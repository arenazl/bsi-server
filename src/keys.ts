import fs from 'fs';
import path from 'path';

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

  OpenAi: {
    key: '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'
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

/*
b2b686e8c89af3
b7745d1b
us-cdbr-east-05.cleardb.net
heroku_55504b2b2691e53
*/
