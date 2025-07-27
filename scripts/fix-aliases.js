const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Update module aliases for production
if (packageJson._moduleAliases) {
  const updatedAliases = {};
  
  for (const [alias, aliasPath] of Object.entries(packageJson._moduleAliases)) {
    // Change from src/ to build/
    updatedAliases[alias] = aliasPath.replace('src/', 'build/');
  }
  
  packageJson._moduleAliases = updatedAliases;
  
  // Write updated package.json
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  
  console.log('✅ Module aliases updated for production');
  console.log('Updated aliases:', updatedAliases);
}