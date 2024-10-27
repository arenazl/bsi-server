import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const sslCert = fs.readFileSync(path.join(__dirname, 'crt/ca.pem'));



const config = {

  database: {
    host: 'mysql-aiven-arenazl.e.aivencloud.com',
    user: 'avnadmin',
    port: 23108,
    password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
    database: 'defaultdb',
    
    ssl: {
      ca: sslCert,  
    },
  },

  databaseNucleo: {
    host: 'localhost',
    user: 'root',
    port: 3306,
    password: 'qqqaaa',
    database: 'ng',
  },

  Tokens: {
    OpenAI: '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',
    Meta: 'EAAXOmruNQ1kBOzBIe0ZA5wZAfcSxVSTxZAZCT9i1SvqxAvGNbr8biZAIou2NiaLZB6UKHaHGkt7jU4lz1FTk2DdaCKkMeOzyT95OJZBEYbq40fZCIfk6eQxBTzJtaJXRhzZCmxEscQSJ5C1FhjmfZCsq0TIHLAm7M7TrcjstoRXnveEPTNZCabpwUZA47Dm2f8Rb5KZBjGwJF9WHhNXYtpUlZBfN9U1gtCouJVEriJHs8mf6FyHwZDZD'
  },
  
  AWS: {
    bucketName: 'sisbarrios',
    bucketRegion: 'sa-east-1',
    accesKey: 'AKIATI3QXLJ4VE3LBKFN',
    secretKey: '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'
  },

  mails: {
    documentacion: 'sisbarrios',
    control: 'Proyectos.don.luisk41@gmail.com',
    new: 'Marcela@newlife.com',
    cj: 'bienescintiap@gmail.com',
    real: 'pablorealstate@hotmail.com',
    ar: 'desarrolloinmobiliarioar@hotmail.com',
    admin: 'arenazl@gmail.com'
  }
};

export default config;
