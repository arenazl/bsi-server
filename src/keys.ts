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
    Meta: 'EAAXOmruNQ1kBO6bx31vIhVq7nTMxDuCB9qnM1XYJKOnZBviNj6QEKb4SjReHRdEFz8B5yMoM1cqZCUa2WBxUglNLWiRVVOOZBlKALyaJsDJIHHbGjN53mEqvxpKZBNY12TMZCgQPGYjtnc6y8ZBcusczwLM3eTfs6Fj309prWbAqkFArPQDN1XcqBBuq6zEb2Y1jkRbTOKGhcOKAWtIOsEy0pJfinqEX7ZCmaAuyJvj'
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
