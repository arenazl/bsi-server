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
    Meta: 'EAAXOmruNQ1kBOwJRIK5CYZAyH0ZBzUII1Q8JptjfJpAu65ilHs2aMEFpf31r4Geg4bsBph4SbH2JZBDnbr6O7UM7CENkRvTx5UrcMcAfwTZBNovflJPUC1eBaLH8XsWwz1hrP71RpzkZCr0yBZBecwF6ZBrVRBJsrQNZABmMOEITAi5Uq4ZCR5sbhBVmLA9OOUOnf8xicJvdRSlMZBp1qV22O0S0kkECAVm2PaJUsnPPHT'
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
