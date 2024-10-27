"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const sslCert = fs_1.default.readFileSync(path_1.default.join(__dirname, 'crt/ca.pem'));
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
exports.default = config;
