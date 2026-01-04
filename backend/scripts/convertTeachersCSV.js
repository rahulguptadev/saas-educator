const fs = require('fs');
const path = require('path');

// Read the source CSV file
const sourceFile = process.argv[2] || '/Users/rahulg_1/Downloads/teachers-report.csv';
const outputFile = process.argv[3] || '/Users/rahulg_1/Downloads/teachers-import-ready.csv';

try {
  // Read the CSV file
  const csvContent = fs.readFileSync(sourceFile, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.error('CSV file is empty');
    process.exit(1);
  }

  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
  
  // Find column indices
  const nameIdx = headers.findIndex(h => h.toLowerCase() === 'name');
  const emailIdx = headers.findIndex(h => h.toLowerCase() === 'email');
  const phoneIdx = headers.findIndex(h => h.toLowerCase().includes('phone'));
  const subjectsIdx = headers.findIndex(h => h.toLowerCase() === 'subjects');
  const educationIdx = headers.findIndex(h => h.toLowerCase() === 'education');
  const qualificationIdx = headers.findIndex(h => h.toLowerCase() === 'qualification');
  const bioIdx = headers.findIndex(h => h.toLowerCase() === 'bio');
  const statusIdx = headers.findIndex(h => h.toLowerCase() === 'status');

  if (nameIdx === -1 || emailIdx === -1) {
    console.error('Required columns (Name, Email) not found');
    process.exit(1);
  }

  // Create output CSV with new headers
  const outputHeaders = ['Name', 'Email', 'Phone', 'Password', 'Specialization', 'Qualification', 'Education', 'Bio', 'Subjects', 'Status'];
  let outputCSV = outputHeaders.map(h => `"${h}"`).join(',') + '\n';

  // Process each data row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Parse CSV line handling quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add last value

    // Extract values
    const name = values[nameIdx] || '';
    const email = values[emailIdx] || '';
    const phone = values[phoneIdx] || '';
    const subjects = values[subjectsIdx] || '';
    const education = values[educationIdx] || '';
    const qualification = values[qualificationIdx] || '';
    const bio = values[bioIdx] || '';
    const status = values[statusIdx] || 'Active';

    // Skip if name or email is missing
    if (!name || !email) {
      console.warn(`Skipping row ${i + 1}: Missing name or email`);
      continue;
    }

    // Escape quotes in values
    const escapeValue = (val) => {
      if (!val || val === '-') return '';
      return `"${val.replace(/"/g, '""')}"`;
    };

    // Build output row
    const outputRow = [
      escapeValue(name),
      escapeValue(email),
      escapeValue(phone),
      '', // Password - leave blank, will use default
      escapeValue(subjects), // Use Subjects as Specialization
      escapeValue(qualification),
      escapeValue(education),
      escapeValue(bio),
      escapeValue(subjects), // Keep Subjects as separate field
      escapeValue(status)
    ];

    outputCSV += outputRow.join(',') + '\n';
  }

  // Write output file
  fs.writeFileSync(outputFile, outputCSV, 'utf-8');
  console.log(`✅ Successfully converted CSV!`);
  console.log(`📁 Output file: ${outputFile}`);
  console.log(`📊 Processed ${lines.length - 1} teacher records`);
} catch (error) {
  console.error('Error converting CSV:', error.message);
  process.exit(1);
}

