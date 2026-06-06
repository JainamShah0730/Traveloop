const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('frontend/src', (filePath) => {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace backtick patterns
    content = content.replace(/`http:\/\/localhost:3000([^`]*)`/g, '`${import.meta.env.VITE_API_URL || \'http://localhost:3000\'}$1`');
    
    // Replace single quote patterns
    content = content.replace(/'http:\/\/localhost:3000([^']*)'/g, '(import.meta.env.VITE_API_URL || \'http://localhost:3000\') + \'$1\'');

    // Replace double quote patterns
    content = content.replace(/"http:\/\/localhost:3000([^"]*)"/g, '(import.meta.env.VITE_API_URL || \'http://localhost:3000\') + "$1"');

    // Replace strict matches (if any without quotes) - not needed since URLs are strings
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
