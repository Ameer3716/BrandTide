const fs = require('fs');
const path = require('path');

// Frontend
const feTestsDir = path.join(__dirname, 'brandtide', 'src', '__tests__', 'components', 'ui');
const feFiles = fs.readdirSync(feTestsDir);

for (const file of feFiles) {
  if (file.endsWith('.test.tsx')) {
    const filePath = path.join(feTestsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const compName = file.replace('.test.tsx', '');
    content = content.replace(new RegExp(`from './${compName}'`, 'g'), `from '@/components/ui/${compName}'`);
    fs.writeFileSync(filePath, content);
  }
}

// Backend
const beTestsDir = path.join(__dirname, 'server', 'src', '__tests__', 'controllers');
const beFiles = fs.readdirSync(beTestsDir);

for (const file of beFiles) {
  if (file.endsWith('.test.js')) {
    const filePath = path.join(beTestsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    content = content.replace(/from '\.\//g, "from '../../controllers/");
    content = content.replace(/from '\.\.\/models/g, "from '../../models");
    content = content.replace(/from '\.\.\/config/g, "from '../../config");
    fs.writeFileSync(filePath, content);
  }
}
console.log('Imports fixed.');
