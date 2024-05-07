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
const model_1 = require("./../models/model");
const model_2 = require("./../models/model");
const nodemailer_1 = __importDefault(require("nodemailer"));
class FilesController {
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var serverFiles = [];
            const dir = path_1.default.join(__dirname, "../uploads");
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
            yield database_1.default.query("DELETE  FROM games WHERE id = ?", [id]);
            res.json({ message: "The game was deleted" });
        });
    }
    upload(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("upload start");
            var store = multer_1.default.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, "./uploads");
                },
                filename: function (req, file, cb) {
                    cb(null, Date.now() + "-" + file.originalname);
                },
            });
            var upload = (0, multer_1.default)({ storage: store }).single("file");
            upload(req, res, function (err) {
                return __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c;
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
                        secretAccessKey,
                    });
                    //@ts-ignore
                    const fileStream = fs.createReadStream(req.file.path);
                    const uploadParams = {
                        Bucket: bucketName,
                        Body: fileStream,
                        //@ts-ignore
                        Key: req.file.filename,
                    };
                    try {
                        const data = yield s3.upload(uploadParams).promise();
                        console.log(data);
                        res.json({ uploadname: req.file.filename });
                    }
                    catch (err) {
                        throw err;
                    }
                });
            });
        });
    }
    uploadTR(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var store = multer_1.default.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, "./uploads");
                },
                filename: function (req, file, cb) {
                    cb(null, Date.now() + "-" + file.originalname);
                },
            });
            var upload = (0, multer_1.default)({ storage: store }).single("file");
            upload(req, res, function (err) {
                return __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c, _d;
                    console.log((_a = req.file) === null || _a === void 0 ? void 0 : _a.path);
                    console.log((_b = req.file) === null || _b === void 0 ? void 0 : _b.originalname);
                    console.log((_c = req.file) === null || _c === void 0 ? void 0 : _c.filename);
                    // Read the contents of the txt file
                    const content = fs.readFileSync(req.file.path, "utf-8");
                    // Separate the content into rows based on newline
                    let rows = content.split("\n");
                    console.log(rows);
                    try {
                        //PARSEA CABECERA
                        let info = parsearInfoArchivoTR(rows[0], rows[rows.length - 2]);
                        const dataFromUI = (_d = req.file) === null || _d === void 0 ? void 0 : _d.originalname.split("-");
                        // CONCEPTO /MOTIVO
                        const user = dataFromUI[0];
                        const concepto = dataFromUI[2];
                        const motivo = dataFromUI[1];
                        try {
                            let connection = yield database_1.default.getConnection();
                            //LLAMAMOS AL SP DE DETALLE
                            console.log("Llamamos al sp");
                            const values = [
                                info.tipoDeRegistro,
                                info.empresaNombre,
                                info.infoDiscrecional,
                                info.empresaCUIT.toString(),
                                info.prestacion,
                                info.fechaEmision.toString(),
                                info.horaGeneracion.toString() + "00",
                                info.fechaAcreditacion.toString(),
                                info.bloqueDosCbuEmpresa,
                                info.moneda,
                                info.rotuloArchivo,
                                info.tipoRemuneracion,
                                arreglarDecimales(info.importeTotalFinal),
                                concepto,
                            ];
                            const outParams = ["id", "created_at"];
                            const outParamValues = yield executeSpInsert(connection, "Insert_Transferencia_Inmediata_Info", values, outParams);
                            const id = outParamValues["@id"];
                            const created_at = outParamValues["@created_at"];
                            console.log("Termina el SP de Info. ID value: " + id);
                            console.log("Comienza el SP de Dato:");
                            //PARSEA DETALLE
                            let transInmediataDatos = parsearDatosArchivoTR(rows, id);
                            let contador = 0;
                            for (let entity of transInmediataDatos) {
                                const values = [
                                    entity.tipoDeRegistro,
                                    entity.bloqueCBU1,
                                    entity.bloqueCBU2,
                                    arreglarDecimales(entity.importe),
                                    entity.refUnivoca,
                                    entity.beneficiarioDoc,
                                    entity.beneficiarioApeNombre,
                                    entity.filler,
                                    entity.marca,
                                    entity.transInmediataInfoId,
                                ];
                                const outParams = ["id", "created_at"];
                                //DESCOMENTAR PARA EJECUTAR
                                const outParamValues = yield executeSpInsert(connection, "insert_transferencia_inmediata_dato", values, outParams);
                                console.log("outParamValues: " + outParamValues);
                                //LEO EL RETORNO SI ES QUE HAY (ES UN ARRAY)
                            }
                            //Armo el archivoTR
                            escribirArchivoTR(transInmediataDatos, info, concepto, motivo, id);
                            //DEVUELVO AL FRONT EL ID GENERADO PARA MOSTRAR LOS RESULTADOS (ESTA PANTALLA VA A LLAMAR A getResponseTR ['files/responsetr/:id] )
                            res.json({ id: id });
                        }
                        catch (error) {
                            console.error("error:" + error);
                        }
                    }
                    catch (error) {
                        console.error("error:" + error);
                        res
                            .status(500)
                            .json({ message: "An error occurred while updating the data." });
                    }
                });
            });
        });
    }
    downloadFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params; // Assuming the file is identified by an 'id'
                // TODO: Fetch the file path based on the 'id'
                const filePath = "./uploads/output_" + id + ".txt"; // Replace with the actual file path
                res.download(filePath, function (err) {
                    if (err) {
                        // Handle error, but keep in mind the response may be partially sent,
                        // so check `res.headersSent`
                        console.error(err);
                        if (res.headersSent) {
                            // Decide what to do: close the connection, or or just report the error.
                        }
                        else {
                            //res.status(err)
                        }
                    }
                    else {
                        // The file was sent successfully
                    }
                });
            }
            catch (error) {
                console.error("An error occurred:", error);
                res.status(500).send("Internal Server Error");
            }
        });
    }
    getResponseTR(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("enter response....");
            const { id } = req.params;
            const infoScreen = yield getPantallaTransferenciaInfoById(id);
            const dataScreen = yield getPantallaTransferenciaDatoById(id);
            //@ts-ignore
            res.json({ head: infoScreen[0], data: dataScreen[0] });
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
                secretAccessKey,
            });
            const fileStream = fs.createReadStream(file.path);
            const uploadParams = {
                Bucket: bucketName,
                Body: fileStream,
                Key: file.filename,
            };
            return s3.upload(uploadParams).promise();
        });
    }
    dropbox(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let multer1 = (0, multer_1.default)({ dest: "./uploads" });
            let upload = multer1.single("file");
            upload(req, res, function (err) {
                var _a, _b;
                if (err) {
                    return res.status(501).json({ error: err });
                }
                else {
                    return res.json({
                        originalname: (_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname,
                        uploadname: (_b = req.file) === null || _b === void 0 ? void 0 : _b.filename,
                    });
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
                secretAccessKey,
            });
            console.log(s3);
            const downloadParams = {
                Bucket: bucketName,
                Key: req.body.filename,
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
                console.log("Sending Email");
                var transporter = nodemailer_1.default.createTransport({
                    service: "gmail",
                    auth: {
                        user: "arenazl@gmail.com;Proyectos.don.luisk41@gmail.com",
                        pass: "vxmgkblhzauuapqh",
                    },
                });
                var mailOptions = {
                    from: "arenazl@gmail.com",
                    to: "arenazl@gmail.com",
                    subject: "Nueva venta a nombre de: " +
                        req.body.denominacion +
                        " ingreso al sistema!",
                    html: "<h5>Se vendio el Lote " +
                        req.body.id_lote +
                        "!! </h5> <h5> Comprador: " +
                        req.body.denominacion +
                        "</h5> <h5>Dni: " +
                        req.body.dni +
                        " </h5>  <h5>Precio de venta " +
                        req.body.lote_total +
                        " </h5>  <h5>Seña: " +
                        req.body.refuerzo_total +
                        '</h5> <p>Ingrese al sistema para verificar los datos</p> <p><a href="https://sisbarrios.herokuapp.com"> Ingrese a SIS-Barrios </a></p>',
                };
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        console.log("Email sent: " + info.response);
                    }
                });
            }
            catch (ex) {
                console.log(ex);
            }
        });
    }
}
function executeSpInsert(connection, spName, values, outParams) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("executeSpInsert");
            let placeholders = values.map(() => "?").join(",");
            let sql = `CALL ${spName}(${placeholders});`;
            console.log("placeholders");
            console.log(placeholders);
            console.log("sql");
            console.log(sql);
            const statement = yield connection.prepare(sql);
            console.log("values");
            console.log(values);
            yield statement.execute(values);
            statement.close();
            yield connection.unprepare(sql);
            if (outParams.length > 0) {
                let outPlaceholders = outParams.map((param) => `@${param}`).join(",");
                console.log("outPlaceholders");
                console.log(outPlaceholders);
                const [outResults] = yield connection.query(`SELECT ${outPlaceholders};`);
                return outResults[0];
            }
            return {};
        }
        catch (error) {
            throw new Error(`Error al ejecutar el stored procedure: ${error.message}`);
        }
    });
}
function executeSpSelect(connection, spName, values) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("executeSpSelect");
            // Crear los marcadores de posición para los parámetros de entrada
            let placeholders = values.map(() => "?").join(",");
            let sql = `CALL ${spName}(${placeholders});`;
            console.log("placeholders");
            console.log(placeholders);
            console.log("sql");
            console.log(sql);
            // Preparar y ejecutar el stored procedure
            const statement = yield connection.prepare(sql);
            console.log("values");
            console.log(values);
            const [results] = yield statement.execute(values);
            // Cerrar la declaración preparada y deshacer la preparación
            statement.close();
            yield connection.unprepare(sql);
            console.log('RESULT');
            console.log(results);
            // Devolver los resultados
            return results;
        }
        catch (error) {
            throw new Error(`Error al ejecutar el stored procedure: ${error.message}`);
        }
    });
}
function escribirArchivoTR(rows, info, concepto, motivo, id) {
    const file = fs.openSync("./uploads/output_" + id + ".txt", "w");
    // console.log(transInmediataDatos);
    for (const value of rows) {
        //CBU
        let CBU;
        CBU = value.bloqueCBU1.toString() + value.bloqueCBU2.toString();
        //IMPORTE
        let IMPORTE = value.importe.toString();
        IMPORTE = padStringFromLeft(IMPORTE, 12 - IMPORTE.length, "0");
        //CONCEPTO
        let CONCEPTO = concepto;
        CONCEPTO = padStringFromRight(concepto, 50 - concepto.length, " ");
        //REFERENCIA
        let REFERENCIA = " ";
        REFERENCIA = padStringFromRight(REFERENCIA, 12 - REFERENCIA.length, " ");
        //EMAIL
        let EMAIL = " ";
        EMAIL = padStringFromRight(EMAIL, 50 - EMAIL.length, " ");
        //RELLENO
        let RELLENO = "";
        RELLENO = padStringFromRight(RELLENO, 124 - RELLENO.length, " ");
        fs.writeSync(file, CBU + IMPORTE + CONCEPTO + motivo + REFERENCIA + EMAIL + RELLENO + "\n");
    }
    //DATOS FINALES
    //CANT REGISTROS FINALES
    let CANT_REGISTROS = (info.cantidadRegistroFinal + 1).toString();
    CANT_REGISTROS = padStringFromLeft(CANT_REGISTROS, 5 - CANT_REGISTROS.length, "0");
    console.log("Cant Reegistros: " + info.cantidadRegistroFinal);
    console.log("Escribe: " + CANT_REGISTROS);
    //IMPORTE TOTAL
    let IMPORTE_TOTAL = info.importeTotalFinal.toString();
    IMPORTE_TOTAL = padStringFromLeft(IMPORTE_TOTAL, 17 - IMPORTE_TOTAL.length, "0");
    //RELLENO
    let RELLENO = "";
    RELLENO = padStringFromRight(RELLENO, 251 - RELLENO.length, " ");
    fs.writeSync(file, CANT_REGISTROS + IMPORTE_TOTAL + RELLENO + "\n");
    fs.closeSync(file);
    return true;
}
function readDile() {
    //read a look.txt file
    fs.readFile('./uploads/look.txt', 'utf8', function (err, data) {
        if (err)
            throw err;
        console.log(data);
    });
}
function parsearInfoArchivoTR(infoRowC, infoRowF) {
    let info = new model_1.transInmediataInfo();
    //CABECERA
    info.tipoDeRegistro = Number(infoRowC.substring(0, 1).trim());
    info.empresaNombre = infoRowC.substring(1, 17);
    info.infoDiscrecional = infoRowC.substring(17, 37);
    info.empresaCUIT = Number(infoRowC.substring(37, 48).trim());
    info.prestacion = infoRowC.substring(48, 58);
    info.fechaEmision = Number(infoRowC.substring(58, 64).trim());
    info.horaGeneracion = Number(infoRowC.substring(64, 68).trim());
    info.fechaAcreditacion = Number(infoRowC.substring(68, 74).trim());
    info.bloqueDosCbuEmpresa = Number(infoRowC.substring(74, 88).trim());
    info.moneda = Number(infoRowC.substring(88, 89).trim());
    info.rotuloArchivo = infoRowC.substring(89, 97);
    info.tipoRemuneracion = Number(infoRowC.substring(97, 98).trim());
    info.filler = infoRowC.substring(98, 99);
    info.marca = Number(infoRowC.substring(99, 100).trim());
    //PARTE FINAL
    info.tipoRegistroFinal = Number(infoRowF.substring(0, 1).trim());
    info.cantidadRegistroFinal = Number(infoRowF.substring(1, 7).trim());
    info.importeTotalFinal = Number(infoRowF.substring(7, 18).trim());
    info.fillerFinal = infoRowF.substring(18, 99);
    info.marcaFinal = Number(infoRowF.substring(99, 100).trim());
    return info;
}
function parsearDatosArchivoTR(rows, transfeInfoId) {
    console.log("transfeInfoId: " + transfeInfoId);
    let datosRows = rows.slice(1, rows.length - 2);
    let transInmediataDatos = new Array();
    for (const row of datosRows) {
        let datoTran = new model_2.transInmediataDato();
        // Parse fields according to fixed width format
        datoTran.transInmediataInfoId = transfeInfoId;
        datoTran.tipoDeRegistro = Number(row.substring(0, 1).trim());
        datoTran.bloqueCBU1 = row.substring(1, 9).trim();
        datoTran.bloqueCBU2 = row.substring(9, 23).trim();
        datoTran.importe = Number(row.substring(23, 33).trim());
        datoTran.refUnivoca = row.substring(33, 48);
        datoTran.beneficiarioDoc = row.substring(48, 59).trim();
        datoTran.beneficiarioApeNombre = row.substring(59, 81).trim();
        datoTran.filler = row.substring(81, 99).trim();
        datoTran.marca = Number(row.substring(99, 100).trim());
        transInmediataDatos.push(datoTran);
        //console.log(datoTran);
    }
    return transInmediataDatos;
}
function arreglarDecimales(importe) {
    let valorImporte = Math.floor(importe) / 100;
    return valorImporte.toFixed(2);
}
function getPantallaTransferenciaDatoById(transferenciaInfoId) {
    return __awaiter(this, void 0, void 0, function* () {
        let connection = yield database_1.default.getConnection();
        const values = [transferenciaInfoId];
        const result = yield executeSpSelect(connection, 'get_pantalla_transferencia_dato_by_id', values);
        return result;
    });
}
function getPantallaTransferenciaInfoById(transferenciaInfoId) {
    return __awaiter(this, void 0, void 0, function* () {
        let connection = yield database_1.default.getConnection();
        const values = [transferenciaInfoId];
        const result = yield executeSpSelect(connection, 'get_pantalla_transferencia_info_by_id', values);
        return result;
    });
}
function padStringFromLeft(str, length, padChar = " ") {
    let paddedStr = padChar.repeat(length);
    return paddedStr + str;
}
function padStringFromRight(str, length, padChar = " ") {
    let paddedStr = padChar.repeat(length);
    return str + paddedStr;
}
const fileController = new FilesController();
exports.default = fileController;
