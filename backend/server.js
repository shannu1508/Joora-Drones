import express from 'express';
import multer from 'multer';
import cors from 'cors';
import mongoose from 'mongoose';
import { PythonShell } from 'python-shell';
import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://finace-tracker:gmritprojects@cluster0.ppnct.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// MongoDB Schema
const conversionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  originalFileName: { type: String, required: true },
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
  processedFiles: [{ // Store processed file info with coordinates
    fileName: String,
    firstTwoCoordinates: [{ // Array of first two coordinate pairs (for database storage only)
      longitude: Number,
      latitude: Number,
      altitude: { type: Number, default: 0 }
    }],
    fullKmlContent: String // Store full KML content for downloads
  }],
  error: String,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

const Conversion = mongoose.model('Conversion', conversionSchema);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    cb(null, `${uniqueId}_${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Routes
app.post('/api/upload', upload.single('shapefile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const conversionId = uuidv4();
    const originalFileName = req.file.originalname;

    // Create conversion record
    const conversion = new Conversion({
      id: conversionId,
      originalFileName: originalFileName,
      status: 'processing'
    });
    await conversion.save();

    // Process the file asynchronously
    processShapefile(req.file.path, conversionId, originalFileName);

    res.json({
      id: conversionId,
      message: 'File uploaded successfully. Processing started.',
      status: 'processing'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/api/status/:id', async (req, res) => {
  try {
    const conversion = await Conversion.findOne({ id: req.params.id });
    if (!conversion) {
      return res.status(404).json({ error: 'Conversion not found' });
    }

    res.json({
      id: conversion.id,
      status: conversion.status,
      originalFileName: conversion.originalFileName,
      kmlFileName: conversion.originalFileName.replace(/\.zip$/, '.kml'), // For backward compatibility
      processedFiles: conversion.processedFiles || [], // Include processed files with coordinates
      error: conversion.error,
      createdAt: conversion.createdAt,
      completedAt: conversion.completedAt
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

// Function to generate KML from coordinates (for database-only use)
function generateKmlFromCoordinates(processedFiles, originalFileName) {
  let kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Converted from ${originalFileName}</name>
    <description>KML generated from extracted coordinates</description>`;

  processedFiles.forEach((file, fileIndex) => {
    if (file.firstTwoCoordinates && file.firstTwoCoordinates.length > 0) {
      file.firstTwoCoordinates.forEach((coord, coordIndex) => {
        kmlContent += `
    <Placemark>
      <name>${file.fileName} - Point ${coordIndex + 1}</name>
      <description>Extracted coordinate from ${file.fileName}</description>
      <Point>
        <coordinates>${coord.longitude},${coord.latitude},${coord.altitude}</coordinates>
      </Point>
    </Placemark>`;
      });
    }
  });

  kmlContent += `
  </Document>
</kml>`;

  return kmlContent;
}

// Function to generate combined KML from full content (for downloads)
function generateCombinedKmlFromFullContent(processedFiles, originalFileName) {
  let kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Converted from ${originalFileName}</name>
    <description>Combined KML with all coordinates</description>`;

  processedFiles.forEach((file) => {
    if (file.fullKmlContent) {
      // Extract placemarks from individual KML files
      const placemarkMatches = file.fullKmlContent.match(/<Placemark>[\s\S]*?<\/Placemark>/g);
      if (placemarkMatches) {
        placemarkMatches.forEach(placemark => {
          kmlContent += '\n    ' + placemark;
        });
      }
    }
  });

  kmlContent += `
  </Document>
</kml>`;

  return kmlContent;
}

app.get('/api/download/:id', async (req, res) => {
  try {
    console.log(`Download request for conversion ID: ${req.params.id}`);
    const conversion = await Conversion.findOne({ id: req.params.id });
    if (!conversion) {
      console.log(`Conversion not found for ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Conversion not found' });
    }

    console.log(`Conversion found. Status: ${conversion.status}, Files: ${conversion.processedFiles?.length || 0}`);

    if (conversion.status !== 'completed') {
      console.log(`Conversion not completed. Current status: ${conversion.status}`);
      return res.status(400).json({ error: `Conversion not completed. Current status: ${conversion.status}` });
    }

    if (!conversion.processedFiles || conversion.processedFiles.length === 0) {
      console.log('No processed files found in conversion record');
      return res.status(400).json({ error: 'No processed files found' });
    }

    // Generate KML from full stored content (includes all coordinates)
    const kmlContent = generateCombinedKmlFromFullContent(conversion.processedFiles, conversion.originalFileName);
    const kmlFileName = conversion.originalFileName.replace(/\.zip$/, '.kml');

    console.log(`Sending KML file: ${kmlFileName}, Content length: ${kmlContent.length}`);
    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${kmlFileName}"`);
    res.send(kmlContent);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed', details: error.message });
  }
});

app.get('/api/coordinates/:id', async (req, res) => {
  try {
    const conversion = await Conversion.findOne({ id: req.params.id });
    if (!conversion) {
      return res.status(404).json({ error: 'Conversion not found' });
    }

    if (conversion.status !== 'completed') {
      return res.status(400).json({ error: 'Conversion not completed' });
    }

    // Return coordinate data as JSON
    res.json({
      id: conversion.id,
      originalFileName: conversion.originalFileName,
      processedFiles: conversion.processedFiles,
      createdAt: conversion.createdAt,
      completedAt: conversion.completedAt
    });

  } catch (error) {
    console.error('Coordinates fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch coordinates' });
  }
});

// New endpoint to download individual KML files
app.get('/api/download/:id/:filename', async (req, res) => {
  try {
    const conversion = await Conversion.findOne({ id: req.params.id });
    if (!conversion) {
      return res.status(404).json({ error: 'Conversion not found' });
    }

    if (conversion.status !== 'completed') {
      return res.status(400).json({ error: 'Conversion not completed' });
    }

    const filename = req.params.filename;
    const processedFile = conversion.processedFiles?.find(file => file.fileName === filename);

    if (!processedFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Use the full KML content for this specific file
    const kmlContent = processedFile.fullKmlContent || generateKmlFromCoordinates([processedFile], filename);

    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(kmlContent);

  } catch (error) {
    console.error('Individual download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// New endpoint to download all files as a ZIP
app.get('/api/download-all/:id', async (req, res) => {
  try {
    const conversion = await Conversion.findOne({ id: req.params.id });
    if (!conversion) {
      return res.status(404).json({ error: 'Conversion not found' });
    }

    if (conversion.status !== 'completed') {
      return res.status(400).json({ error: 'Conversion not completed' });
    }

    // Create a new ZIP file
    const zip = new AdmZip();

    // Add the combined KML file (with all coordinates)
    const combinedKml = generateCombinedKmlFromFullContent(conversion.processedFiles, conversion.originalFileName);
    const combinedFileName = conversion.originalFileName.replace(/\.zip$/, '.kml');
    zip.addFile(combinedFileName, Buffer.from(combinedKml, 'utf8'));

    // Add individual KML files (with all coordinates)
    conversion.processedFiles.forEach(file => {
      const individualKml = file.fullKmlContent || generateKmlFromCoordinates([file], file.fileName);
      zip.addFile(file.fileName, Buffer.from(individualKml, 'utf8'));
    });

    // Generate ZIP buffer
    const zipBuffer = zip.toBuffer();

    // Set response headers
    const zipFileName = `${conversion.originalFileName.replace('.zip', '')}_all_files.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
    res.setHeader('Content-Length', zipBuffer.length);

    // Send the ZIP file
    res.send(zipBuffer);

  } catch (error) {
    console.error('Download all files error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// New endpoint to get coordinates for a specific file
app.get('/api/coordinates/:id/:filename', async (req, res) => {
  try {
    const conversion = await Conversion.findOne({ id: req.params.id });
    if (!conversion) {
      return res.status(404).json({ error: 'Conversion not found' });
    }

    if (conversion.status !== 'completed') {
      return res.status(400).json({ error: 'Conversion not completed' });
    }

    const filename = req.params.filename;
    const processedFile = conversion.processedFiles?.find(file => file.fileName === filename);

    if (!processedFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      fileName: processedFile.fileName,
      firstTwoCoordinates: processedFile.firstTwoCoordinates
    });

  } catch (error) {
    console.error('Individual coordinates fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch coordinates' });
  }
});

// Function to extract first two coordinates from KML content
function extractFirstTwoCoordinates(kmlContent) {
  const coordinates = [];

  try {
    // Look for coordinates in different KML geometry types
    const coordinatePatterns = [
      /<coordinates>\s*([^<]+)\s*<\/coordinates>/g,
      /<coord>\s*([^<]+)\s*<\/coord>/g
    ];

    for (const pattern of coordinatePatterns) {
      let match;
      while ((match = pattern.exec(kmlContent)) !== null && coordinates.length < 2) {
        const coordText = match[1].trim();

        // Parse coordinate string - KML format is "longitude,latitude,altitude"
        const coordLines = coordText.split(/[\s\n\r]+/).filter(line => line.trim());

        for (const line of coordLines) {
          if (coordinates.length >= 2) break;

          const parts = line.trim().split(',');
          if (parts.length >= 2) {
            const longitude = parseFloat(parts[0]);
            const latitude = parseFloat(parts[1]);
            const altitude = parts.length > 2 ? parseFloat(parts[2]) || 0 : 0;

            if (!isNaN(longitude) && !isNaN(latitude)) {
              coordinates.push({
                longitude: longitude,
                latitude: latitude,
                altitude: altitude
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error extracting coordinates from KML:', error);
  }

  return coordinates;
}



// Function to process shapefile
async function processShapefile(filePath, conversionId, originalFileName) {
  try {
    // Extract ZIP file
    const extractDir = path.join(__dirname, 'temp', conversionId);
    await fs.ensureDir(extractDir);

    const zip = new AdmZip(filePath);
    zip.extractAllTo(extractDir, true);

    // Find shapefile in extracted directory
    const files = await fs.readdir(extractDir);
    
    // Check if there's a subdirectory with shapefiles
    const subdirs = files.filter(file => 
      fs.statSync(path.join(extractDir, file)).isDirectory()
    );
    
    let inputPath = extractDir;
    if (subdirs.length > 0) {
      // Use the first subdirectory that contains .shp files
      for (const subdir of subdirs) {
        const subdirPath = path.join(extractDir, subdir);
        const subdirFiles = await fs.readdir(subdirPath);
        if (subdirFiles.some(file => file.endsWith('.shp'))) {
          inputPath = subdirPath;
          break;
        }
      }
    }

    // Create output directory
    const outputDir = path.join(__dirname, 'output', conversionId);
    await fs.ensureDir(outputDir);

    // Prepare Python script options
    const options = {
      mode: 'text',
      pythonPath: 'python', // or 'python3' depending on your system
      pythonOptions: ['-u'], // unbuffered output
      scriptPath: path.join(__dirname, 'scripts'),
      args: [
        '--input_path', inputPath,
        '--output_path', outputDir,
        '--name_field', 'id',
        '--description_field', 'JOORA'
      ],
      stderrHandler: (err) => {
        console.log('Python stderr:', err);
      }
    };

    // Run Python script with comprehensive error handling
    let results;
    let errorOutput = '';
    
    try {
        const pyshell = new PythonShell('shapefile_to_kml.py', options);
        
        // Collect all output
        const outputLines = [];
        
        pyshell.on('message', function (message) {
            outputLines.push(message);
        });
        
        pyshell.on('stderr', function (stderr) {
            errorOutput += stderr + '\n';
            console.log('Python stderr:', stderr);
        });
        
        pyshell.on('error', function (err) {
            console.error('Python shell error:', err);
            throw new Error('Python script execution failed');
        });
        
        results = await new Promise((resolve, reject) => {
            pyshell.end(function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(outputLines);
                }
            });
        });
        
    } catch (pythonError) {
        console.error('Python script execution error:', pythonError);
        throw new Error('Failed to execute shapefile conversion script');
    }
    
    // Combine stdout and stderr output
    const allOutput = [...results, errorOutput].join('\n');
    console.log('Complete Python script output:', allOutput);
    
    // Check for validation errors in the output
    if (allOutput.includes('Shapefile validation errors:') || allOutput.includes('No valid shapefiles found')) {
        // Extract the specific error messages
        let errorMessage = '';
        
        if (allOutput.includes('Shapefile validation errors:')) {
            // Extract validation errors
            const lines = allOutput.split('\n');
            const errorLines = [];
            let inErrorSection = false;
            
            for (const line of lines) {
                if (line.includes('Shapefile validation errors:')) {
                    inErrorSection = true;
                    continue;
                }
                if (inErrorSection && line.trim().startsWith('- ')) {
                    errorLines.push(line.trim());
                } else if (inErrorSection && line.trim() === '') {
                    break;
                }
            }
            
            if (errorLines.length > 0) {
                errorMessage = 'Shapefile validation failed:\n' + errorLines.join('\n');
            } else {
                errorMessage = allOutput;
            }
        } else if (allOutput.includes('No valid shapefiles found')) {
            // Extract file listing
            const lines = allOutput.split('\n');
            const fileLines = [];
            let inFileSection = false;
            
            for (const line of lines) {
                if (line.includes('Files found in the directory:')) {
                    inFileSection = true;
                    continue;
                }
                if (inFileSection && line.trim().startsWith('- ')) {
                    fileLines.push(line.trim());
                } else if (inFileSection && line.trim() === '') {
                    break;
                }
            }
            
            if (fileLines.length > 0) {
                errorMessage = 'No valid shapefiles found. Files in your ZIP:\n' + fileLines.join('\n') + '\n\nPlease ensure your ZIP contains complete shapefiles with .shp, .shx, and .dbf files.';
            } else {
                errorMessage = allOutput;
            }
        } else {
            errorMessage = allOutput;
        }
        
        throw new Error(errorMessage);
    }
    
    // Check for generated KML files
    const outputFiles = await fs.readdir(outputDir);
    const kmlFiles = outputFiles.filter(file => file.endsWith('.kml'));

    console.log(`Generated ${kmlFiles.length} KML files:`, kmlFiles);

    if (kmlFiles.length === 0) {
      throw new Error('No KML files generated');
    }

    // Process KML files and extract coordinates
    let processedFilesData = [];

    console.log(`Processing ${kmlFiles.length} KML files for coordinate extraction`);

    for (const kmlFile of kmlFiles) {
      const kmlFilePath = path.join(outputDir, kmlFile);
      const fileContent = await fs.readFile(kmlFilePath, 'utf8');

      // Extract first two coordinates from this KML file (for database storage)
      const firstTwoCoordinates = extractFirstTwoCoordinates(fileContent);

      processedFilesData.push({
        fileName: kmlFile,
        firstTwoCoordinates: firstTwoCoordinates, // Only first 2 coordinates for database
        fullKmlContent: fileContent // Full KML content for downloads
      });

      console.log(`Processed ${kmlFile}: extracted ${firstTwoCoordinates.length} coordinates for database, stored full KML content for downloads`);
      if (firstTwoCoordinates.length > 0) {
        console.log(`First coordinate: ${JSON.stringify(firstTwoCoordinates[0])}`);
        if (firstTwoCoordinates.length > 1) {
          console.log(`Second coordinate: ${JSON.stringify(firstTwoCoordinates[1])}`);
        }
      }
    }

    // Update conversion record with new schema
    await Conversion.findOneAndUpdate(
      { id: conversionId },
      {
        status: 'completed',
        processedFiles: processedFilesData, // Store file names with coordinates
        completedAt: new Date()
      }
    );

    // Cleanup temporary files
    await fs.remove(extractDir);
    await fs.remove(outputDir);
    await fs.remove(filePath);

  } catch (error) {
    console.error('Processing error:', error);
    
    // Update conversion record with error
    await Conversion.findOneAndUpdate(
      { id: conversionId },
      {
        status: 'failed',
        error: error.message,
        completedAt: new Date()
      }
    );

    // Cleanup on error
    try {
      const extractDir = path.join(__dirname, 'temp', conversionId);
      const outputDir = path.join(__dirname, 'output', conversionId);
      const filePath = path.join(__dirname, 'uploads', originalFileName);
      
      await fs.remove(extractDir);
      await fs.remove(outputDir);
      await fs.remove(filePath);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
  }
}

// Test endpoint for coordinate extraction
app.post('/api/test-coordinates', (req, res) => {
  try {
    const { kmlContent } = req.body;
    if (!kmlContent) {
      return res.status(400).json({ error: 'KML content is required' });
    }

    const coordinates = extractFirstTwoCoordinates(kmlContent);
    res.json({
      extractedCoordinates: coordinates,
      count: coordinates.length
    });
  } catch (error) {
    console.error('Test coordinates error:', error);
    res.status(500).json({ error: 'Failed to extract coordinates' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
}); 