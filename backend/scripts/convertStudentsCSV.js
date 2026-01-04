const fs = require('fs');
const path = require('path');

// Read the source CSV file
const sourceFile = process.argv[2] || '/Users/rahulg_1/Downloads/students-report (1).csv';
const outputFile = process.argv[3] || '/Users/rahulg_1/Downloads/students-import-ready.csv';

// Helper function to generate email from name
function generateEmail(name) {
  // Remove special characters, convert to lowercase, replace spaces with dots
  const emailName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '.') // Replace spaces with dots
    .replace(/\.+/g, '.') // Replace multiple dots with single dot
    .replace(/^\.|\.$/g, ''); // Remove leading/trailing dots
  
  return `${emailName}@student.com`;
}

// Parse CSV line properly handling quoted fields with commas
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  // Add last field
  result.push(current.trim());
  return result;
}

// Convert subjects string to enrolledSubjects array format
function parseSubjects(subjectsStr) {
  if (!subjectsStr || subjectsStr === '-' || subjectsStr.trim() === '') {
    return [];
  }
  
  // Split by semicolon or comma, clean up
  const subjects = subjectsStr
    .split(/[;,]/)
    .map(s => s.trim())
    .filter(s => s && s !== '-');
  
  // Convert to enrolledSubjects format: [{ subject: '', classes: 0, fees: 0 }]
  return subjects.map(subject => ({
    subject: subject.trim(),
    classes: 0,
    fees: 0
  }));
}

try {
  // Read the CSV file
  const csvContent = fs.readFileSync(sourceFile, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.error('CSV file is empty');
    process.exit(1);
  }

  // Parse header
  const headerLine = parseCSVLine(lines[0]);
  const headers = headerLine.map(h => h.trim().replace(/"/g, ''));
  
  // Find column indices
  const nameIdx = headers.findIndex(h => h.toLowerCase() === 'name');
  const gradeIdx = headers.findIndex(h => h.toLowerCase() === 'grade');
  const subjectsIdx = headers.findIndex(h => h.toLowerCase() === 'subjects');
  const phoneIdx = headers.findIndex(h => h.toLowerCase().includes('phone'));
  const schoolIdx = headers.findIndex(h => h.toLowerCase() === 'school');
  const statusIdx = headers.findIndex(h => h.toLowerCase() === 'status');

  if (nameIdx === -1) {
    console.error('Required column (Name) not found');
    process.exit(1);
  }

  // Create output CSV with new headers
  const outputHeaders = [
    'Name', 
    'Email', 
    'Phone', 
    'Password', 
    'Grade', 
    'School', 
    'Father Name', 
    'Father Contact', 
    'Mother Name', 
    'Mother Contact',
    'Enrolled Subjects',
    'Status'
  ];
  let outputCSV = outputHeaders.map(h => `"${h}"`).join(',') + '\n';

  // Track generated emails to ensure uniqueness
  const usedEmails = new Set();
  let emailCounter = 1;

  // Process each data row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = parseCSVLine(line);
    
    if (values.length < headers.length) {
      console.warn(`Row ${i + 1}: Column count mismatch, skipping`);
      continue;
    }

    // Extract values
    const name = values[nameIdx] || '';
    const grade = values[gradeIdx] || '';
    const subjects = values[subjectsIdx] || '';
    const phone = values[phoneIdx] || '';
    const school = values[schoolIdx] || '';
    const status = values[statusIdx] || 'Enrolled';

    // Skip if name is missing
    if (!name || name.trim() === '') {
      console.warn(`Skipping row ${i + 1}: Missing name`);
      continue;
    }

    // Generate unique email
    let email = generateEmail(name);
    while (usedEmails.has(email)) {
      email = generateEmail(name + emailCounter);
      emailCounter++;
    }
    usedEmails.add(email);

    // Parse subjects - store as semicolon-separated string for simpler import
    // The import logic will convert this to enrolledSubjects array
    const enrolledSubjectsStr = subjects && subjects !== '-' ? subjects : '';

    // Map status to Active/Inactive
    const isActive = status.toLowerCase().includes('enrolled') || status === '' || status === undefined;
    const statusValue = isActive ? 'Active' : 'Inactive';

    // Escape quotes in values
    const escapeValue = (val) => {
      if (!val || val === '-') return '';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    // Build output row
    const outputRow = [
      escapeValue(name),
      escapeValue(email),
      escapeValue(phone),
      '', // Password - leave blank, will use default
      escapeValue(grade),
      escapeValue(school),
      '', // Father Name - not in source CSV
      '', // Father Contact - not in source CSV
      '', // Mother Name - not in source CSV
      '', // Mother Contact - not in source CSV
      escapeValue(enrolledSubjectsStr), // Enrolled Subjects as JSON string
      escapeValue(statusValue)
    ];

    outputCSV += outputRow.join(',') + '\n';
  }

  // Write output file
  fs.writeFileSync(outputFile, outputCSV, 'utf-8');
  console.log(`✅ Successfully converted CSV!`);
  console.log(`📁 Output file: ${outputFile}`);
  console.log(`📊 Processed ${lines.length - 1} student records`);
  console.log(`\nNote: Email addresses were auto-generated from names.`);
  console.log(`Note: Enrolled Subjects are in semicolon-separated format.`);
} catch (error) {
  console.error('Error converting CSV:', error.message);
  process.exit(1);
}

