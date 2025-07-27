#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔄 Migración de keys.ts a .env');
console.log('================================\n');

// Verificar si .env ya existe
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (fs.existsSync(envPath)) {
  console.log('⚠️  Ya existe un archivo .env');
  rl.question('¿Deseas sobrescribirlo? (s/n): ', (answer) => {
    if (answer.toLowerCase() !== 's') {
      console.log('Migración cancelada.');
      rl.close();
      return;
    }
    createEnvFile();
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  console.log('\n📝 Creando archivo .env...\n');
  
  // Copiar .env.example a .env
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env creado desde .env.example');
  } else {
    console.log('❌ No se encontró .env.example');
    rl.close();
    return;
  }
  
  console.log('\n🔑 Configuración de credenciales básicas:');
  console.log('=========================================\n');
  
  askForCredentials();
}

function askForCredentials() {
  const questions = [
    { key: 'DB_PRIMARY_HOST', prompt: 'Host de la base de datos principal: ', default: 'localhost' },
    { key: 'DB_PRIMARY_USER', prompt: 'Usuario de la base de datos: ', default: 'root' },
    { key: 'DB_PRIMARY_PASSWORD', prompt: 'Contraseña de la base de datos: ', default: '', hidden: true },
    { key: 'DB_PRIMARY_NAME', prompt: 'Nombre de la base de datos: ', default: 'bsi_db' },
    { key: 'JWT_SECRET', prompt: 'JWT Secret (32+ caracteres): ', default: generateSecret() },
    { key: 'JWT_REFRESH_SECRET', prompt: 'JWT Refresh Secret (32+ caracteres): ', default: generateSecret() }
  ];
  
  let currentIndex = 0;
  const answers = {};
  
  function askQuestion() {
    if (currentIndex >= questions.length) {
      // Actualizar .env con las respuestas
      updateEnvFile(answers);
      return;
    }
    
    const q = questions[currentIndex];
    const promptText = q.default ? `${q.prompt}[${q.default}] ` : q.prompt;
    
    rl.question(promptText, (answer) => {
      answers[q.key] = answer || q.default;
      currentIndex++;
      askQuestion();
    });
  }
  
  askQuestion();
}

function updateEnvFile(answers) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Actualizar valores en .env
  for (const [key, value] of Object.entries(answers)) {
    const regex = new RegExp(`^${key}=.*$`, 'gm');
    envContent = envContent.replace(regex, `${key}=${value}`);
  }
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Archivo .env actualizado correctamente');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Revisa y completa las demás variables en .env');
  console.log('2. Asegúrate de que .env esté en .gitignore');
  console.log('3. Reinicia el servidor: npm run dev');
  console.log('\n⚠️  IMPORTANTE: No compartas ni commitees tu archivo .env\n');
  
  // Verificar .gitignore
  checkGitignore();
  
  rl.close();
}

function checkGitignore() {
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    
    if (!gitignoreContent.includes('.env')) {
      fs.appendFileSync(gitignorePath, '\n# Environment variables\n.env\n.env.local\n.env.*.local\n');
      console.log('✅ Agregado .env a .gitignore');
    }
  }
}

function generateSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

// Manejar cierre limpio
rl.on('close', () => {
  console.log('\nMigración completada.');
  process.exit(0);
});