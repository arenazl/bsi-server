import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { env } from 'process';
require('dotenv').config();

dotenv.config();

const sslCert = fs.readFileSync(path.join(__dirname, 'crt/ca.pem'));

const config = {

  database: {
    host: 'mysql-aiven-arenazl.e.aivencloud.com',
    user: 'avnadmin',
    port: 23108,
    password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
    database: 'defaultdev',
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

  databaseNucleoOnline: {
    host: 'mysql-aiven-arenazl.e.aivencloud.com',
    user: 'avnadmin',
    port: 23108,
    password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
    database: 'ng',
    ssl: {
      ca: sslCert,
    },
  },

  Tokens: {
    Meta: 'EAAXOmruNQ1kBO4vbCzMXiDOYRVJU2j8gOmdXXs1Xvp9KJwNJcBcEJmNZBnpkhuo1cQyH2v85T4Y6PqZCB2ZBLlRXmQuZC3bX0qpiNHKRQ6vqYNZAfixaemlTvM8iwc5XOZCmuf1IQNqIUjp9BdawXZBAo0y1qM8WuHBL8LYo7bbyF91JiRsTM8oxplxb3hKPOyWJwqE5i2b9EI37DsZAbduISipFWRg4VAJTdfsJqIWH'
  },

  OpenAi: {
    key: process.env.OPENAI_API_KEY
  },

  AWS: {
    bucketName: 'sisbarrios',
    bucketRegion: 'sa-east-1',
    accesKey: 'AKIATI3QXLJ4VE3LBKFN',
    secretKey: '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'
  },


  mails: {
    control: 'arenazl@gmail.com',
    admin: 'arenazl@gmail.com'
  },

  emailConfig: {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'arenazl@gmail.com',
      pass: process.env.EMAIL_PASSWORD || (() => {
        throw new Error('EMAIL_PASSWORD no está configurada en las variables de entorno. Consulta documentacion/Gmail-Setup.md');
      })()
    }
  }
};

export default config;
