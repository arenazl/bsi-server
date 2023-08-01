"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../database"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
const keys_1 = __importDefault(require("./../keys"));
const s3_1 = __importDefault(require("aws-sdk/clients/s3"));
const nodemailer_1 = __importDefault(require("nodemailer"));
class FilesController {
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var serverFiles = [];
            const dir = path_1.default.join(__dirname, '../uploads');
            const files = fs.readdirSync(dir);
            for (const file of files) {
                serverFiles.push(file);
            }
            return res.json(serverFiles);
        });
    }
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            yield database_1.default.query('DELETE FROM games WHERE id = ?', [id]);
            res.json({ message: "The game was deleted" });
        });
    }
    upload(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("upload start");
            var store = multer_1.default.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, './uploads');
                },
                filename: function (req, file, cb) {
                    cb(null, Date.now() + '-' + file.originalname);
                }
            });
            var upload = (0, multer_1.default)({ storage: store }).single('file');
            upload(req, res, function (err) {
                var _a, _b, _c;
                return __awaiter(this, void 0, void 0, function* () {
                    console.log((_a = req.file) === null || _a === void 0 ? void 0 : _a.path);
                    console.log((_b = req.file) === null || _b === void 0 ? void 0 : _b.originalname);
                    console.log((_c = req.file) === null || _c === void 0 ? void 0 : _c.filename);
                    let bucketName = keys_1.default.AWS.bucketName;
                    let region = keys_1.default.AWS.bucketRegion;
                    let accessKeyId = keys_1.default.AWS.accesKey;
                    let secretAccessKey = keys_1.default.AWS.secretKey;
                    const s3 = new s3_1.default({
                        region,
                        accessKeyId,
                        secretAccessKey
                    });
                    //@ts-ignore
                    const fileStream = fs.createReadStream(req.file.path);
                    const uploadParams = {
                        Bucket: bucketName,
                        Body: fileStream,
                        //@ts-ignore
                        Key: req.file.filename
                    };
                    try {
                        const data = yield s3.upload(uploadParams).promise();
                        console.log(data);
                        //@ts-ignore
                        res.json({ uploadname: req.file.filename });
                    }
                    catch (err) {
                        throw err;
                    }
                });
            });
        });
    }
    upload2(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("upload start");
            var store = multer_1.default.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, './uploads');
                },
                filename: function (req, file, cb) {
                    cb(null, Date.now() + '-' + file.originalname);
                }
            });
            var upload = (0, multer_1.default)({ storage: store }).single('file');
            upload(req, res, function (err) {
                var _a, _b, _c;
                return __awaiter(this, void 0, void 0, function* () {
                    console.log((_a = req.file) === null || _a === void 0 ? void 0 : _a.path);
                    console.log((_b = req.file) === null || _b === void 0 ? void 0 : _b.originalname);
                    console.log((_c = req.file) === null || _c === void 0 ? void 0 : _c.filename);
                    // Read the contents of the txt file
                    const content = fs.readFileSync(req.file.path, 'utf-8');
                    // Separate the content into rows based on newline
                    let rows = content.split('\n');
                    // Remove the first and last row
                    rows = rows.slice(1, rows.length - 1);
                    // Loop through each row and call the stored procedure
                    try {
                        for (const row of rows) {
                            // Parse fields according to fixed width format
                            const tipoRegistro = row.substring(0, 1);
                            const nombreEmpresa = row.substring(1, 17);
                            const infoDiscrecional = row.substring(17, 37);
                            const cuitEmpresa = row.substring(37, 48);
                            const prestacion = row.substring(48, 58);
                            const fechaEmision = row.substring(58, 64);
                            const horaGeneracion = row.substring(64, 68);
                            const fechaAcreditacion = row.substring(68, 74);
                            const bloqueCBU = row.substring(74, 88);
                            const moneda = row.substring(88, 89);
                            const rotuloArchivo = row.substring(89, 97);
                            const tipoRemuneracion = row.substring(97, 98);
                            const filler = row.substring(98, 99);
                            const marca = row.substring(99, 100);
                            // Call stored procedure (adjust as needed for your procedure)
                            yield database_1.default.query('CALL YourStoredProcedure(?, ?, ?)', [tipoRegistro, nombreEmpresa, cuitEmpresa]);
                            //generacion del arhivo salida
                        }
                        res.status(200).json({ message: 'Data updated successfully.' });
                    }
                    catch (error) {
                        console.error(error);
                        res.status(500).json({ message: 'An error occurred while updating the data.' });
                    }
                });
            });
        });
    }
    uploadS3(file) {
        return __awaiter(this, void 0, void 0, function* () {
            let bucketName = keys_1.default.AWS.bucketName;
            let region = keys_1.default.AWS.bucketRegion;
            let accessKeyId = keys_1.default.AWS.accesKey;
            let secretAccessKey = keys_1.default.AWS.secretKey;
            const s3 = new s3_1.default({
                region,
                accessKeyId,
                secretAccessKey
            });
            const fileStream = fs.createReadStream(file.path);
            const uploadParams = {
                Bucket: bucketName,
                Body: fileStream,
                Key: file.filename
            };
            return s3.upload(uploadParams).promise();
        });
    }
    dropbox(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let multer1 = (0, multer_1.default)({ dest: "./uploads" });
            let upload = multer1.single('file');
            upload(req, res, function (err) {
                var _a, _b;
                if (err) {
                    return res.status(501).json({ error: err });
                }
                else {
                    return res.json({ originalname: (_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname, uploadname: (_b = req.file) === null || _b === void 0 ? void 0 : _b.filename });
                }
            });
        });
    }
    download(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let bucketName = keys_1.default.AWS.bucketName;
            let region = keys_1.default.AWS.bucketRegion;
            let accessKeyId = keys_1.default.AWS.accesKey;
            let secretAccessKey = keys_1.default.AWS.secretKey;
            const s3 = new s3_1.default({
                region,
                accessKeyId,
                secretAccessKey
            });
            console.log(s3);
            const downloadParams = {
                Bucket: bucketName,
                Key: req.body.filename
            };
            console.log(downloadParams);
            try {
                const data = yield s3.getObject(downloadParams).createReadStream();
                data.pipe(res);
            }
            catch (err) {
                throw err;
            }
        });
    }
    sendMail(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let bucketName = keys_1.default.AWS.bucketName;
            try {
                console.log('Sending Email');
                var transporter = nodemailer_1.default.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'arenazl@gmail.com;Proyectos.don.luisk41@gmail.com',
                        pass: 'vxmgkblhzauuapqh'
                    }
                });
                var mailOptions = {
                    from: 'arenazl@gmail.com',
                    to: 'arenazl@gmail.com',
                    subject: 'Nueva venta a nombre de: ' + req.body.denominacion + ' ingreso al sistema!',
                    html: '<h5>Se vendio el Lote ' + req.body.id_lote + '!! </h5> <h5> Comprador: ' + req.body.denominacion + '</h5> <h5>Dni: ' + req.body.dni + ' </h5>  <h5>Precio de venta ' + req.body.lote_total + ' </h5>  <h5>Seña: ' + req.body.refuerzo_total + '</h5> <p>Ingrese al sistema para verificar los datos</p> <p><a href="https://sisbarrios.herokuapp.com"> Ingrese a SIS-Barrios </a></p>'
                };
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        console.log('Email sent: ' + info.response);
                    }
                });
            }
            catch (ex) {
                console.log(ex);
            }
        });
    }
}
const fileController = new FilesController;
exports.default = fileController;
