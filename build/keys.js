"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
require('dotenv').config();
dotenv_1.default.config();
const sslCert = fs_1.default.readFileSync(path_1.default.join(__dirname, 'crt/ca.pem'));
const config = {
    database: {
        host: 'mysql-aiven-arenazl.e.aivencloud.com',
        user: 'avnadmin',
        port: 23108,
        password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
        database: 'defauldbqa',
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
        documentacion: 'sisbarrios',
        control: 'Proyectos.don.luisk41@gmail.com',
        new: 'Marcela@newlife.com',
        cj: 'bienescintiap@gmail.com',
        real: 'pablorealstate@hotmail.com',
        ar: 'desarrolloinmobiliarioar@hotmail.com',
        admin: 'arenazl@gmail.com'
    }
};
exports.default = config;
