const fs = require('fs');
const path = require('path');

function listFiles(dir, indent = '') {
  if (!fs.existsSync(dir)) {
    console.log(`${indent}Directory does not exist: ${dir}`);
    return;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      console.log(`${indent}📁 ${item}/`);
      listFiles(itemPath, indent + '  ');
    } else {
      console.log(`${indent}📄 ${item}`);
    }
  }
}

console.log('Project Structure:');
console.log('=================');
listFiles(__dirname);
