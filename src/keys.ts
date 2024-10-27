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
    Meta: 'EAAXOmruNQ1kBOZCVhVaZCq2aBKFsvAhsT4fnUpKZCM5Ef0muuE34lekyyq5w1HMjaN9maW2ZAoqVVEt0NzqdG5jBRiYVUvyQ1VRbDaLzmIKGZBCh88PCIGqN5qPChANgIZBxPBe337cDl4jNkxsWAuDQAVZAAeqzXIXGIxlqZA8Kp8iT3dt7tZC4YxGiWSalMBvKJbv1xkZAEjG8r5oDTQ7t0QE8LyZA4RcAP2s5xTpp6nU'
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
