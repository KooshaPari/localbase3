const fs = require('fs');
const path = require('path');

// Check if pages/index.tsx exists
const pagesIndexPath = path.join(__dirname, 'pages', 'index.tsx');
const pagesIndexExists = fs.existsSync(pagesIndexPath);

// Check if app/page.tsx exists
const appPagePath = path.join(__dirname, 'app', 'page.tsx');
const appPageExists = fs.existsSync(appPagePath);

console.log('Checking for conflicting files...');

if (pagesIndexExists && appPageExists) {
  console.log('Found conflicting files:');
  console.log('- pages/index.tsx');
  console.log('- app/page.tsx');
  
  // Choose to keep the App Router version (recommended)
  console.log('\nRemoving pages/index.tsx to use App Router...');
  fs.unlinkSync(pagesIndexPath);
  console.log('Done! You can now build your project using App Router.');
} else if (pagesIndexExists) {
  console.log('Found only pages/index.tsx - using Pages Router.');
  console.log('No conflicts to resolve.');
} else if (appPageExists) {
  console.log('Found only app/page.tsx - using App Router.');
  console.log('No conflicts to resolve.');
} else {
  console.log('No index files found in pages/ or app/ directories.');
  console.log('Please check your project structure.');
}
