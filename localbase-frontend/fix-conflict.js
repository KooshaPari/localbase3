const fs = require('fs');
const path = require('path');

// Define paths
const pagesIndexPath = path.join(__dirname, 'pages', 'index.tsx');
const appPagePath = path.join(__dirname, 'app', 'page.tsx');

// Check if files exist
const pagesIndexExists = fs.existsSync(pagesIndexPath);
const appPageExists = fs.existsSync(appPagePath);

console.log('Checking for conflicting files...');

if (pagesIndexExists) {
  console.log('Found pages/index.tsx');
  
  // Remove the file
  try {
    fs.unlinkSync(pagesIndexPath);
    console.log('Successfully removed pages/index.tsx');
  } catch (error) {
    console.error(`Error removing pages/index.tsx: ${error.message}`);
  }
} else {
  console.log('pages/index.tsx does not exist');
}

if (appPageExists) {
  console.log('Found app/page.tsx - keeping this file for App Router');
} else {
  console.log('app/page.tsx does not exist');
}

console.log('Conflict resolution complete. You can now try building your project again.');
