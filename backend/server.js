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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kishorkella3:kishorkella3@cluster0.slkwfon.mongodb.net/wanderlustt?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// MongoDB Schema
const conversionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  originalFileName: { type: String, required: true },
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
  kmlFileName: String,
  processedFiles: [String], // Array of processed file names
  representativeCoordinate: { // Single coordinate extracted from generated KML
    latitude: Number,
    longitude: Number,
    altitude: Number
  },
  fileStorage: {
    outputDir: String // Directory where generated KML files are stored for download
  },
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
      kmlFileName: conversion.kmlFileName,
      processedFiles: conversion.processedFiles || [], // Include processed files info
      representativeCoordinate: conversion.representativeCoordinate || null,
      fileStorage: conversion.fileStorage || null,
      error: conversion.error,
      createdAt: conversion.createdAt,
      completedAt: conversion.completedAt
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

app.get('/api/download/:id', async (req, res) => {
  try {
    const conversion = await Conversion.findOne({ id: req.params.id });
    if (!conversion) {
      return res.status(404).json({ error: 'Conversion not found' });
    }

    if (conversion.status !== 'completed') {
      return res.status(400).json({ error: 'Conversion not completed' });
    }
    // Stream combined KML file from disk if available
    if (!conversion.fileStorage?.outputDir || !conversion.kmlFileName) {
      return res.status(410).json({ error: 'KML not available.' });
    }
    const filePath = path.join(conversion.fileStorage.outputDir, conversion.kmlFileName);
    if (!(await fs.pathExists(filePath))) {
      return res.status(410).json({ error: 'KML file has been cleaned up or is missing.' });
    }
    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${conversion.kmlFileName}"`);
    fs.createReadStream(filePath).pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
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
    if (!conversion.fileStorage?.outputDir) {
      return res.status(410).json({ error: 'Individual KML files are not available.' });
    }
    const filename = req.params.filename;
    const filePath = path.join(conversion.fileStorage.outputDir, filename);
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(filePath).pipe(res);

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
    if (!conversion.fileStorage?.outputDir) {
      return res.status(410).json({ error: 'KML files are not available.' });
    }
    const dir = conversion.fileStorage.outputDir;
    const zip = new AdmZip();
    const files = await fs.readdir(dir);
    files.filter(f => f.endsWith('.kml')).forEach(f => {
      zip.addLocalFile(path.join(dir, f));
    });
    const zipBuffer = zip.toBuffer();
    const zipFileName = `${conversion.originalFileName.replace('.zip', '')}_all_files.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
    res.setHeader('Content-Length', zipBuffer.length);
    res.send(zipBuffer);

  } catch (error) {
    console.error('Download all files error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Function to combine multiple KML files into one
async function combineKmlFiles(outputDir, kmlFiles) {
  let combinedKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Combined Shapefiles</name>
    <description>Combined KML from multiple shapefiles</description>`;

  for (const kmlFile of kmlFiles) {
    const kmlFilePath = path.join(outputDir, kmlFile);
    const kmlContent = await fs.readFile(kmlFilePath, 'utf8');
    
    console.log(`Processing KML file: ${kmlFile}`);
    
    // Try multiple approaches to extract Placemark elements
    let placemarkElements = [];
    
    // Method 1: Direct Placemark extraction
    const directPlacemarks = kmlContent.match(/<Placemark>[\s\S]*?<\/Placemark>/g);
    if (directPlacemarks) {
      placemarkElements = directPlacemarks;
      console.log(`Found ${directPlacemarks.length} direct Placemark elements in ${kmlFile}`);
    } else {
      // Method 2: Extract from Document
      const documentMatch = kmlContent.match(/<Document>[\s\S]*?<\/Document>/);
      if (documentMatch) {
        const documentContent = documentMatch[0];
        const innerPlacemarks = documentContent.match(/<Placemark>[\s\S]*?<\/Placemark>/g);
        if (innerPlacemarks) {
          placemarkElements = innerPlacemarks;
          console.log(`Found ${innerPlacemarks.length} Placemark elements in Document of ${kmlFile}`);
        }
      }
      
      // Method 3: If still no Placemarks, try to extract the entire content between <kml> tags
      if (placemarkElements.length === 0) {
        const kmlMatch = kmlContent.match(/<kml[^>]*>([\s\S]*?)<\/kml>/);
        if (kmlMatch) {
          const kmlContent = kmlMatch[1];
          const allPlacemarks = kmlContent.match(/<Placemark>[\s\S]*?<\/Placemark>/g);
          if (allPlacemarks) {
            placemarkElements = allPlacemarks;
            console.log(`Found ${allPlacemarks.length} Placemark elements in KML content of ${kmlFile}`);
          }
        }
      }
    }
    
    // Add the Placemark elements to the combined KML
    if (placemarkElements.length > 0) {
      combinedKml += '\n    ' + placemarkElements.join('\n    ');
    } else {
      console.log(`Warning: No Placemark elements found in ${kmlFile}`);
    }
  }

  combinedKml += `
  </Document>
</kml>`;

  console.log('Combined KML structure created');
  return combinedKml;
}

// Extract the first coordinate (lon,lat[,alt]) from a KML string
function extractFirstCoordinateFromKml(kmlString) {
  if (!kmlString || typeof kmlString !== 'string') return null;

  // 1) Try <Point><coordinates>lon,lat[,alt]</coordinates></Point>
  const pointMatch = kmlString.match(/<Point[^>]*>[\s\S]*?<coordinates[^>]*>([\s\S]*?)<\/coordinates>[\s\S]*?<\/Point>/i);
  // 2) Try any <coordinates>...</coordinates> (Polygon, LineString, etc.)
  const anyCoordsMatch = kmlString.match(/<coordinates[^>]*>([\s\S]*?)<\/coordinates>/i);
  // 3) Try Google gx:coord format inside <gx:Track>
  const gxMatch = kmlString.match(/<gx:coord>\s*([\-0-9\.]+)\s+([\-0-9\.]+)(?:\s+([\-0-9\.]+))?\s*<\/gx:coord>/i);

  if (gxMatch) {
    const longitude = parseFloat(gxMatch[1]);
    const latitude = parseFloat(gxMatch[2]);
    const altitudeParsed = gxMatch[3] !== undefined ? parseFloat(gxMatch[3]) : undefined;
    if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
      const coordinate = { latitude, longitude };
      if (!Number.isNaN(altitudeParsed)) coordinate.altitude = altitudeParsed;
      return coordinate;
    }
  }

  const coordsSection = (pointMatch && pointMatch[1]) || (anyCoordsMatch && anyCoordsMatch[1]);
  if (!coordsSection) return null;

  // Normalize whitespace and split to the first coordinate tuple
  const tokens = coordsSection
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  if (tokens.length === 0) return null;

  const parts = tokens[0].split(',');
  if (parts.length < 2) return null;

  const longitude = parseFloat(parts[0]);
  const latitude = parseFloat(parts[1]);
  const altitudeParsed = parts.length > 2 ? parseFloat(parts[2]) : undefined;

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

  const coordinate = { latitude, longitude };
  if (!Number.isNaN(altitudeParsed)) coordinate.altitude = altitudeParsed;
  return coordinate;
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
    const shapefileDir = extractDir;
    
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
    
    // Capture validation errors as warnings, not blockers
    let validationWarning = '';
    if (allOutput.includes('Shapefile validation errors:')) {
        const lines = allOutput.split('\n');
        const errorLines = [];
        let inErrorSection = false;
        for (const line of lines) {
            if (line.includes('Shapefile validation errors:')) { inErrorSection = true; continue; }
            if (inErrorSection && line.trim().startsWith('- ')) { errorLines.push(line.trim()); }
            else if (inErrorSection && line.trim() === '') { break; }
        }
        if (errorLines.length > 0) {
            validationWarning = 'Some shapefiles were skipped due to missing components:\n' + errorLines.join('\n');
        }
    }
    if (allOutput.includes('No valid shapefiles found') || allOutput.includes('All shapefiles failed to process')) {
        // Hard fail when nothing can be processed
        throw new Error('No valid shapefiles could be processed. Please ensure each shapefile has .shp, .shx, and .dbf with the same base name.');
    }
    
    // Check for generated KML files
    const outputFiles = await fs.readdir(outputDir);
    const kmlFiles = outputFiles.filter(file => file.endsWith('.kml'));

    console.log(`Generated ${kmlFiles.length} KML files:`, kmlFiles);

    if (kmlFiles.length === 0) {
      throw new Error('No KML files generated');
    }

    // Handle multiple KML files
    let kmlContent;
    let kmlFileName;
    let individualFiles = [];
    let representativeCoordinate = null;
    
    if (kmlFiles.length === 1) {
      // Single KML file - read it directly
      const kmlFilePath = path.join(outputDir, kmlFiles[0]);
      kmlContent = await fs.readFile(kmlFilePath, 'utf8');
      kmlFileName = kmlFiles[0];
      individualFiles.push({ fileName: kmlFiles[0], content: kmlContent });
      representativeCoordinate = extractFirstCoordinateFromKml(kmlContent);
      console.log(`Processing single file: ${kmlFileName}`);
      console.log('Extracted representativeCoordinate:', representativeCoordinate);
    } else {
      // Multiple KML files - combine them into a single KML
      console.log(`Combining ${kmlFiles.length} KML files into one`);
      
      // Store individual file contents
      for (const kmlFile of kmlFiles) {
        const kmlFilePath = path.join(outputDir, kmlFile);
        const fileContent = await fs.readFile(kmlFilePath, 'utf8');
        individualFiles.push({ fileName: kmlFile, content: fileContent });
      }
      
      const combinedKml = await combineKmlFiles(outputDir, kmlFiles);
      kmlContent = combinedKml;
      kmlFileName = `combined_${originalFileName.replace(/\.zip$/, '.kml')}`;
      representativeCoordinate = extractFirstCoordinateFromKml(kmlContent);
      // Persist the combined KML to disk for downloads
      const combinedPath = path.join(outputDir, kmlFileName);
      await fs.writeFile(combinedPath, kmlContent, 'utf8');
      console.log(`Combined file created: ${kmlFileName}`);
      console.log('Extracted representativeCoordinate:', representativeCoordinate);
    }

    // Update conversion record (store only metadata and representative coordinate)
    await Conversion.findOneAndUpdate(
      { id: conversionId },
      {
        status: 'completed',
        kmlFileName: kmlFileName,
        processedFiles: kmlFiles,
        representativeCoordinate: representativeCoordinate || undefined,
        fileStorage: { outputDir },
        completedAt: new Date(),
        // attach warning if any
        ...(validationWarning ? { error: validationWarning } : {})
      }
    );

    // Cleanup temporary files, keep outputDir for downloads
    await fs.remove(extractDir);
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
      const uploadFilePath = filePath; // already absolute to uploaded file
      
      await fs.remove(extractDir);
      await fs.remove(outputDir);
      await fs.remove(uploadFilePath);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});