const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const before = content;
      // Remove PrismaClient require
      content = content.replace(/const\s*{\s*PrismaClient\s*}\s*=\s*require\(['"]@prisma\/client['"]\);\s*/g, '');
      
      // Handle socket/index.js (which needs ../db)
      let requirePath = '"../db"';
      if (fullPath.includes('routes') || fullPath.includes('socket')) {
        requirePath = '"../db"';
      }
      
      // Replace new PrismaClient()
      content = content.replace(/const\s+prisma\s*=\s*new\s+PrismaClient\(\);/g, `const prisma = require(${requirePath});`);
      
      if (content !== before) {
        fs.writeFileSync(fullPath, content);
        console.log("Updated", fullPath);
      }
    }
  }
}

replaceInDir(path.join(__dirname, 'src', 'routes'));
replaceInDir(path.join(__dirname, 'src', 'socket'));
console.log("Done");
