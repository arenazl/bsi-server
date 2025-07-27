import moduleAlias from 'module-alias';
import path from 'path';

// Determine if we're in production (compiled) or development
const isProduction = __dirname.includes('build');
const rootPath = path.resolve(__dirname, '../..');
const srcPath = isProduction ? 'build' : 'src';

// Register module aliases
moduleAlias.addAliases({
  '@config': path.join(rootPath, srcPath, 'config'),
  '@controllers': path.join(rootPath, srcPath, 'controllers'),
  '@services': path.join(rootPath, srcPath, 'services'),
  '@middleware': path.join(rootPath, srcPath, 'middleware'),
  '@models': path.join(rootPath, srcPath, 'models'),
  '@routes': path.join(rootPath, srcPath, 'routes'),
  '@routes-v2': path.join(rootPath, srcPath, 'routes-v2'),
  '@controllers-v2': path.join(rootPath, srcPath, 'controllers-v2'),
  '@services-v2': path.join(rootPath, srcPath, 'services-v2'),
  '@utils': path.join(rootPath, srcPath, 'utils'),
  '@types': path.join(rootPath, srcPath, 'types'),
  '@validators': path.join(rootPath, srcPath, 'validators'),
  '@repositories': path.join(rootPath, srcPath, 'repositories'),
  '@constants': path.join(rootPath, srcPath, 'constants')
});

console.log(`Module aliases configured for ${isProduction ? 'production' : 'development'} (${srcPath})`);