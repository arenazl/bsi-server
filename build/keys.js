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
exports.default = config;
