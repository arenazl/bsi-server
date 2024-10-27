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
    Meta: 'EAAXOmruNQ1kBO1xzy60W8ZAqj47lSlUFSd2FQjSb2IyJZAsXaB8xoxCB5zj2ZBb5OoJcZAUPmZBheXGWPe52RZBoM0sz8YnkUchEhzFoOTkGZCC2OXaLzu3xFfRHH2ba4ikKZAum2VOfAMIb7kRWlZA1rwiaDUDQaiOvjiVQjmZBcCnc7rJPimADH6BYUxpuK5X9SxcODec9cuZBfsCidtyf4wfgpXZB9grrBeZAVIg9IuTlh'
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
