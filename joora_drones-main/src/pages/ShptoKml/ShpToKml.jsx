import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon, FileZipIcon, SpinnerIcon, CheckCircleIcon, XCircleIcon, DownloadIcon } from './Icons';
import './ShpToKml.css';

// --- ZIP Validation Function ---
const validateZipContents = async (file) => {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(file);
    const files = Object.keys(zip.files).map(f => f.toLowerCase());
    const shpFiles = files.filter(f => f.endsWith('.shp'));

    if (shpFiles.length === 0) {
      return { isValid: false, error: 'No shapefile (.shp) found in the ZIP file. Please ensure your ZIP contains at least one shapefile.' };
    }

    const missingComponents = [];
    for (const shpFile of shpFiles) {
      const baseName = shpFile.replace('.shp', '');
      const requiredFiles = [`${baseName}.shp`, `${baseName}.shx`, `${baseName}.dbf`];
      const missing = requiredFiles.filter(reqFile => !files.some(f => f === reqFile.toLowerCase()));
      if (missing.length > 0) {
        missingComponents.push({
          shapefile: baseName + '.shp',
          missing: missing,
          found: requiredFiles.filter(reqFile => files.some(f => f === reqFile.toLowerCase()))
        });
      }
    }

    if (missingComponents.length > 0) {
      let errorMessage = 'Shapefile validation failed:\n\n';
      missingComponents.forEach(comp => {
        errorMessage += `• ${comp.shapefile} is missing:\n`;
        errorMessage += `  Missing: ${comp.missing.join(', ')}\n`;
        errorMessage += `  Found: ${comp.found.length > 0 ? comp.found.join(', ') : 'None'}\n\n`;
      });
      errorMessage += 'A complete shapefile requires: .shp, .shx, and .dbf files with the same base name.';
      return { isValid: false, error: errorMessage };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: `Error reading ZIP file: ${error.message}. Please ensure the file is a valid ZIP archive.` };
  }
};

// Update FileDropzone component to remove heading
const FileDropzone = ({ onFileSelect, status }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (e.dataTransfer.files[0].type === 'application/zip' || e.dataTransfer.files[0].name.endsWith('.zip')) {
        onFileSelect(e.dataTransfer.files[0]);
      } else {
        alert("Please upload a .zip file.");
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) onFileSelect(e.target.files[0]);
  };

  const onButtonClick = () => inputRef.current?.click();

  return (
    <div className="main-card">
      <div
        className={`dropzone ${dragActive ? 'dropzone-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden-input"
          accept=".zip,application/zip"
          onChange={handleChange}
          disabled={status === 'PROCESSING'}
        />
        <div className="dropzone-content">
          <div className={`dropzone-icon ${dragActive ? 'scale-up' : ''}`}>
            <UploadIcon width={64} height={64} />
          </div>
          <p className="dropzone-title">Drag & Drop your .zip file here</p>
          <p className="dropzone-subtitle">or</p>
          <button type="button" className="browse-btn">Browse Files</button>
          <div className="supported-note">
            <span>Supported:</span> ZIP files should contain ESRI Shapefiles (.shp, .shx, .dbf)
          </div>
        </div>
      </div>
    </div>
  );
};

// ... (keep the rest of your file the same)

const StatusDisplay = ({ status, fileName, error }) => {
  if (status === 'IDLE') return null;
  let icon, message, statusClass;
  switch (status) {
    case 'PROCESSING':
      icon = <div className="dropzone-icon scale-up"><SpinnerIcon className="spin" width={64} height={64} /></div>;
      message = (
        <>
          <span style={{ fontWeight: 600 }}>{`Processing ${fileName}...`}</span>
          <div className="progress-bar"><div className="progress-fill"></div></div>
        </>
      );
      statusClass = 'status-processing';
      break;
    case 'SUCCESS':
      icon = <CheckCircleIcon width={64} height={64} />;
      message = `Successfully converted ${fileName}!`;
      statusClass = 'status-success';
      break;
    case 'ERROR':
      icon = <XCircleIcon width={64} height={64} />;
      message = error || 'An unknown error occurred.';
      statusClass = 'status-error';
      break;
    default:
      return null;
  }
  return (
    <div className={`status-display ${statusClass}`}>
      {icon}
      <div>{message}</div>
    </div>
  );
};

const ValidationModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-icon"><XCircleIcon width={20} height={20} /></div>
          <h3>Validation Error</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{message}</div>
        <div className="modal-footer">
          <button className="ok-btn" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
};

const API_URL = "https://joora-drones.onrender.com";

const ResultPanel = ({ result, onReset }) => {
  const handleCombinedDownload = () => {
    fetch(`${API_URL}/api/download-all/${result.conversionId}`)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.fileName.replace('.kml', '')}_all_files.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('Download failed'));
  };
  return (
    <div className="result-panel">
      <div className="result-header">
        <div className="result-icon"><CheckCircleIcon width={24} height={24} /></div>
        <h3>Conversion Complete</h3>
        <button className="reset-btn" onClick={onReset}>Start Over</button>
      </div>
      <div className="result-file">
        <div className="file-icon"><FileZipIcon width={24} height={24} /></div>
        <div>
          <p className="file-name">{result.fileName}</p>
          <p className="file-info">
            {result.processedFiles?.length > 1
              ? `${result.processedFiles.length} shapefiles combined`
              : 'KML file ready for download'}
          </p>
        </div>
      </div>
      <button className="download-btn" onClick={handleCombinedDownload}>
        <DownloadIcon width={20} height={20} /> Download
      </button>
      <p className="download-note">Get a single ZIP containing all kml files.</p>
    </div>
  );
};

export default function ShpToKml() {
  const [status, setStatus] = useState('IDLE');
  const [kmlResult, setKmlResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [conversionId, setConversionId] = useState(null);
  const [validationModal, setValidationModal] = useState({ isOpen: false, message: '' });

  const handleReset = () => {
    setStatus('IDLE');
    setKmlResult(null);
    setError(null);
    setSelectedFile(null);
    setConversionId(null);
    setValidationModal({ isOpen: false, message: '' });
  };

  const processFile = useCallback(async (file) => {
    setStatus('PROCESSING');
    setError(null);
    try {
      const formData = new FormData();
      formData.append('shapefile', file);
      const response = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(await response.text());
      const result = await response.json();
      setConversionId(result.id);
      const pollStatus = async () => {
        try {
          console.log(`Checking status for conversion ID: ${result.id}`);
          const statusResponse = await fetch(`${API_URL}/api/status/${result.id}`);
          if (!statusResponse.ok) {
            console.error('Status check failed:', statusResponse.status, statusResponse.statusText);
            throw new Error('Status check failed');
          }
          const statusData = await statusResponse.json();
          console.log('Status data:', statusData);

          if (statusData.status === 'completed') {
            console.log(`Attempting download for conversion ID: ${result.id}`);
            const downloadResponse = await fetch(`${API_URL}/api/download/${result.id}`);
            if (!downloadResponse.ok) {
              console.error('Download failed:', downloadResponse.status, downloadResponse.statusText);
              const errorText = await downloadResponse.text();
              console.error('Download error response:', errorText);
              throw new Error(`Download failed: ${downloadResponse.status} ${downloadResponse.statusText}`);
            }
            const kmlContent = await downloadResponse.text();
            const kmlFileName = statusData.kmlFileName || file.name.replace(/\.zip$/, '.kml');
            setKmlResult({
              fileName: kmlFileName,
              content: kmlContent,
              processedFiles: statusData.processedFiles || [],
              conversionId: result.id
            });
            setStatus('SUCCESS');
          } else if (statusData.status === 'failed') {
            console.error('Conversion failed:', statusData.error);
            setError(statusData.error || 'Conversion failed');
            setStatus('ERROR');
          } else {
            console.log(`Status is ${statusData.status}, polling again in 2 seconds...`);
            setTimeout(pollStatus, 2000);
          }
        } catch (pollError) {
          console.error('Poll status error:', pollError);
          throw pollError;
        }
      };
      setTimeout(pollStatus, 1000);
    } catch (err) {
      setError(err.message);
      setStatus('ERROR');
    }
  }, []);

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    const validation = await validateZipContents(file);
    if (!validation.isValid) {
      setValidationModal({ isOpen: true, message: validation.error });
      return;
    }
    processFile(file);
  };

  return (
    <div className="page-container">
      <div className="logo">
        <a href="/" target="_self" rel="noopener noreferrer">
          <img src="https://www.jooradrones.com/assets/logo-bec58e99.webp" alt="JOORA DRONES Logo" />
          <span><b>Joora Drones</b></span>
        </a>
      </div>
      <div className="content">
        <div className="heading-section">
          <h1 className="heading-title">
            shp to kml file converter for DJI Drones1
          </h1>
        </div>
        {status === 'IDLE' && <FileDropzone onFileSelect={handleFileSelect} status={status} />}
        {status !== 'IDLE' && status !== 'SUCCESS' && <StatusDisplay status={status} fileName={selectedFile?.name || ''} error={error} />}
        {status === 'SUCCESS' && kmlResult && <ResultPanel result={kmlResult} onReset={handleReset} />}
        {status === 'ERROR' && (
          <div className="error-section">
            <button className="retry-btn" onClick={handleReset}>Try Again</button>
            <p>Something went wrong. Please check your file and try again.</p>
          </div>
        )}
      </div>
      <ValidationModal
        isOpen={validationModal.isOpen}
        message={validationModal.message}
        onClose={() => setValidationModal({ isOpen: false, message: '' })}
      />
      <footer>© 2025 Joora Drones. Elevated Perspective Endless Possibilities.</footer>
    </div>
  );
}
