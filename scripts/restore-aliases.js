const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Restore module aliases for development
if (packageJson._moduleAliases) {
  const restoredAliases = {};
  
  for (const [alias, aliasPath] of Object.entries(packageJson._moduleAliases)) {
    // Change from build/ back to src/
    restoredAliases[alias] = aliasPath.replace('build/', 'src/');
  }
  
  packageJson._moduleAliases = restoredAliases;
  
  // Write updated package.json
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  
  console.log('✅ Module aliases restored for development');
  console.log('Restored aliases:', restoredAliases);
}