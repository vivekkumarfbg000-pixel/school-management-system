import React, { useState } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import { Download, UploadCloud, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StudentBulkUpload = ({ onSuccess, onClose }) => {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [errors, setErrors] = useState([]);
  const [validRecords, setValidRecords] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Download Template
  const handleDownloadTemplate = () => {
    const headers = [
      'name', 'class_name', 'section', 'phone', 'monthly_fee'
    ];
    
    // Example row
    const example = [
      'Rahul Sharma', '10', 'A', '9876543210', '2500'
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + example.join(",");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_import_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // 2. Handle File Selection & Parse
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        validateData(results.data);
      },
      error: (error) => {
        setErrors([{ row: 0, issue: `Failed to parse CSV: ${error.message}` }]);
      }
    });
  };

  // 3. Client-Side Validation (Dry Run)
  const validateData = (data) => {
    let valid = [];
    let errs = [];
    const admnMap = new Set(); // Check for duplicates in file

    data.forEach((row, index) => {
      const rowNum = index + 2; // +1 for 0-index, +1 for header
      const issues = [];

      // Required fields
      if (!row.name) issues.push("Missing name");
      if (!row.class_name) issues.push("Missing class_name");
      if (!row.section) issues.push("Missing section");
      if (!row.phone) issues.push("Missing phone");
      if (!row.monthly_fee) issues.push("Missing monthly_fee");
      
      // Phone validation (exactly 10 digits)
      const phoneClean = (row.phone || '').toString().replace(/\D/g, '');
      if (phoneClean.length !== 10) {
        issues.push(`Phone number must be 10 digits (Found: ${row.phone})`);
      } else {
        row.phone = phoneClean; // Normalize
      }

      // Fee validation
      const fee = parseFloat(row.monthly_fee);
      if (isNaN(fee) || fee < 0) {
        issues.push(`Invalid monthly fee: ${row.monthly_fee}`);
      }

      if (issues.length > 0) {
        errs.push({ row: rowNum, data: row, issues });
      } else {
        // Ensure defaults if missing optional fields
        valid.push({
          ...row,
          monthly_fee: parseFloat(row.monthly_fee)
        });
      }
    });

    setValidRecords(valid);
    setErrors(errs);
    setParsedData(data);
  };

  // 4. Submit to Backend
  const handleSubmit = async () => {
    if (validRecords.length === 0) return;
    setIsUploading(true);

    try {
      await axios.post('/api/bulk/students', { students: validRecords }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Successfully imported ${validRecords.length} students!`);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert(`Import failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Smart Data Migration</h2>
          <button onClick={onClose} className="btn-icon"><X size={20} /></button>
        </div>

        {!parsedData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)' }}>
              <h3>Step 1: Download Template</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Start by downloading our standardized CSV template. Do not change the column headers.
              </p>
              <button onClick={handleDownloadTemplate} className="btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Download size={16} /> Download CSV Template
              </button>
            </div>

            <div className="card" style={{ background: 'var(--card-bg)', border: '1px dashed var(--accent)', textAlign: 'center', padding: '3rem' }}>
              <UploadCloud size={48} color="var(--accent)" style={{ marginBottom: '1rem' }} />
              <h3>Step 2: Upload Data</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Upload your completed CSV file. We will perform a dry-run validation before saving.
              </p>
              <label className="btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                Select CSV File
                <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3>Step 3: Validation Preview</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="stat-card" style={{ borderColor: 'var(--success)', background: 'rgba(16, 185, 129, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                  <CheckCircle size={20} />
                  <span style={{ fontWeight: 'bold' }}>Ready to Import</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{validRecords.length}</div>
              </div>
              
              <div className="stat-card" style={{ borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                  <AlertTriangle size={20} />
                  <span style={{ fontWeight: 'bold' }}>Errors Found</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{errors.length}</div>
              </div>
            </div>

            {errors.length > 0 && (
              <div style={{ maxHeight: '250px', overflowY: 'auto', background: 'var(--card-bg)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--danger)' }}>
                <h4 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Please fix these rows in your CSV and re-upload:</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
                  {errors.map((err, i) => (
                    <li key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                      <strong>Row {err.row}:</strong> {err.issues.join(' | ')}
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        Admn: {err.data.admission_no || 'N/A'}, Name: {err.data.name || 'N/A'}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn-secondary" onClick={() => { setParsedData(null); setFile(null); }}>
                Start Over
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSubmit}
                disabled={validRecords.length === 0 || isUploading}
                style={{ opacity: validRecords.length === 0 ? 0.5 : 1 }}
              >
                {isUploading ? 'Importing...' : `Import ${validRecords.length} Valid Records`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentBulkUpload;
