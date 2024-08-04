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
const node_1 = __importDefault(require("read-excel-file/node"));
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
const keys_1 = __importDefault(require("./../keys"));
const s3_1 = __importDefault(require("aws-sdk/clients/s3"));
const model_1 = require("./../models/model");
const model_2 = require("./../models/model");
const nodemailer_1 = __importDefault(require("nodemailer"));
const enums_1 = require("../enums/enums");
class FilesController {
    ImportXlsPagos(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var upload = yield TempUploadProcess();
            upload(req, res, () => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                try {
                    let connection = yield database_1.default.getConnection();
                    const dataFromUI = (_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname.split("-");
                    console.log("originalname" + ((_b = req.file) === null || _b === void 0 ? void 0 : _b.originalname));
                    console.log("datafromui" + dataFromUI);
                    console.log("datafromui" + dataFromUI);
                    const IDUSER = dataFromUI[0];
                    const IDORG = dataFromUI[1];
                    const IDCONT = dataFromUI[2];
                    let CONCEPTO = dataFromUI[3];
                    const FECHAPAGO = formatDateFromFile(dataFromUI[4]);
                    CONCEPTO = CONCEPTO.replace(".", "-");
                    const rows = yield (0, node_1.default)(req.file.path);
                    const dataFromFourthRow = rows.slice(3);
                    const registros = [];
                    for (let row of dataFromFourthRow) {
                        if (!row[3]) {
                            break;
                        }
                        const [CBU, CUIL, NOMBRE, IMPORTE] = row.slice(3);
                        registros.push({ CBU, CUIL, NOMBRE, IMPORTE });
                    }
                    const jsonResult = {
                        IDUSER,
                        IDORG,
                        IDCONT,
                        CONCEPTO,
                        FECHAPAGO,
                        ITEMS: registros,
                    };
                    console.log(jsonResult);
                    const outParamValues = ["PAGO_HEAD_ID"];
                    var result = yield executeJsonInsert(connection, "insertPagoFromJson", jsonResult, outParamValues);
                    const id = result["PAGO_HEAD_ID"];
                    console.log("id: " + id);
                    res.json({ id: id });
                }
                catch (error) {
                    console.error("error tipo de archivo: " + error);
                    res
                        .status(500)
                        .json({ message: "error tipo de archivo.", error: error.message });
                    return;
                }
            }));
        });
    }
    ImportXlsAltas(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var upload = yield TempUploadProcess();
            upload(req, res, () => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                try {
                    let connection = yield database_1.default.getConnection();
                    const dataFromUI = (_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname.split("-");
                    console.log("originalname" + ((_b = req.file) === null || _b === void 0 ? void 0 : _b.originalname));
                    console.log("datafromui" + dataFromUI);
                    console.log("datafromui" + dataFromUI);
                    const IDUSER = dataFromUI[0];
                    const IDORG = dataFromUI[1];
                    const IDCONT = dataFromUI[2];
                    const rows = yield (0, node_1.default)(req.file.path);
                    const dataFromFourthRow = rows.slice(4);
                    //console.log('infro cruda')
                    //console.log(dataFromFourthRow)
                    const registros = [];
                    for (let row of dataFromFourthRow) {
                        if (!row[4]) {
                            break;
                        }
                        const [CUIL, Tipo_Doc, Nro_Doc, Apellidos, Nombres, Fecha_Nacimiento, Sexo] = row;
                        registros.push({ CUIL, Tipo_Doc, Nro_Doc, Apellidos, Nombres, Fecha_Nacimiento, Sexo });
                    }
                    const jsonResult = {
                        ITEMS: registros,
                    };
                    let json = jsonResult;
                    console.log('cantidad');
                    console.log(registros.length);
                    const outParams = [];
                    const results = yield executeJsonSelect(connection, "ValidarDatosAltaCuenta", jsonResult, outParams);
                    console.log("posterior al sp");
                    console.log(results);
                    res.json(results);
                }
                catch (error) {
                    console.error("Error:", error);
                    res
                        .status(500)
                        .json({ message: "Error fetching:", error: "Internal server error" });
                }
            }));
        });
    }
    uploadTR(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var upload = yield TempUploadProcess();
                upload(req, res, () => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    let info = null;
                    let rows;
                    try {
                        const content = fs.readFileSync(req.file.path, "utf-8");
                        rows = content.split("\n");
                        //console.log(rows);
                        info = parsearInfoArchivoTR(rows[0], rows[rows.length - 2]);
                    }
                    catch (error) {
                        console.error("error parseo: " + error);
                        res.status(500).json({
                            message: "An error occurred while updating the data.",
                            error: error.message,
                        });
                        return;
                    }
                    const dataFromUI = (_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname.split("-");
                    const user = dataFromUI[0];
                    const concepto = dataFromUI[2];
                    const motivo = dataFromUI[1];
                    try {
                        let connection = yield database_1.default.getConnection();
                        var { values, outParams } = yield ParseHeader(info, concepto);
                        const id = yield InsertTransInmediataInfo(connection, values, outParams);
                        let transInmediataDatos = parsearDatosArchivoTR(rows, id);
                        let contador = 0;
                        for (let entity of transInmediataDatos) {
                            const values = yield LoopAndParseInfo(entity);
                            const outParams = ["lastId"];
                            const outParamValues = yield InsertTransInmediataDato(connection, values, outParams);
                        }
                        escribirArchivoTR(transInmediataDatos, info, concepto, motivo, id);
                        res.json({ id: id });
                    }
                    catch (error) {
                        console.error("error DB:" + error);
                    }
                }));
            }
            catch (error) {
                console.error("error in upload:" + error);
            }
        });
    }
    getContratosBotones(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const id_user = req.body.user;
            const id_organismo = req.body.contrato;
            const values = [id_user, id_organismo];
            let connection;
            try {
                connection = yield database_1.default.getConnection();
                const row = yield executeSpSelect(connection, "ObtenerContratos", values);
                res.json(row);
            }
            catch (error) {
                console.error("Error:", error);
                res
                    .status(500)
                    .json({ message: "Error fetching:", error: "Internal server error" });
            }
            finally {
                if (connection)
                    connection.release();
            }
        });
    }
    getContratoById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const id_user = req.body.id_user;
            const id_organismo = req.body.id_organismo;
            const id_contrato = req.body.id_contrato;
            const values = [id_user, id_organismo, id_contrato];
            let connection;
            try {
                connection = yield database_1.default.getConnection();
                const row = yield executeSpSelect(connection, "ObtenerContratoById", values);
                res.json(row);
            }
            catch (error) {
                console.error("Error:", error);
                res
                    .status(500)
                    .json({ message: "Error fetching:", error: "Internal server error" });
            }
            finally {
                if (connection)
                    connection.release();
            }
        });
    }
    downloadOutputFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tipomodulo } = req.params;
            const { id } = req.params;
            const values = [id];
            let connection;
            try {
                connection = yield database_1.default.getConnection();
                const row = yield executeSpSelect(connection, this.getSpNameForTxt(tipomodulo), values);
                const file = fs.openSync(`./uploads/${tipomodulo}_{id}.txt`, "w");
                let line = row[0]["archivo_contenido"];
                fs.writeSync(file, line + "\n");
                fs.closeSync(file);
                const filePath = `./uploads/pago_${id}.txt`;
                res.download(filePath, function (err) { });
            }
            catch (error) {
                console.error("Error:", error);
                res.status(500).json({
                    message: "Error fetching:",
                    error: "Internal server error",
                });
            }
            finally {
                if (connection)
                    connection.release();
            }
        });
    }
    getSpNameForTxt(tipoModulo) {
        switch (tipoModulo) {
            case enums_1.TipoModulo.PAGOS:
                return 'GetPagoFile';
            case enums_1.TipoModulo.TRANSFERENCIAS:
                return 'GetFileTransferencias';
            case enums_1.TipoModulo.ALTAS:
                return 'GenerarArchivoAltaCuentas';
            default:
                return '';
        }
    }
    downloadFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params; // Assuming the file is identified by an 'id'
                const filePath = "./uploads/output_" + id + ".txt";
                res.download(filePath, function (err) {
                    if (err) {
                        console.error(err);
                        if (res.headersSent) {
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
            try {
                console.log("enter response....");
                const { id } = req.params;
                // Fetch the infoScreen data
                const infoScreen = yield getPantallaTransferenciaInfoById(id);
                if (!infoScreen || infoScreen.length === 0) {
                    return res.status(404).json({ error: "Info screen not found" });
                }
                // Fetch the dataScreen data
                const dataScreen = yield getPantallaTransferenciaDatoById(id);
                if (!dataScreen || dataScreen.length === 0) {
                    return res.status(404).json({ error: "Data screen not found" });
                }
                // Send the response
                //@ts-ignore
                res.json({ head: infoScreen[0], data: dataScreen });
            }
            catch (error) {
                console.error("Error fetching response:", error);
                res.status(500).json({
                    message: "Error fetching getResponseTR:",
                    error: "Internal server error",
                });
            }
        });
    }
    getResponsePagos(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const values = [id];
            try {
                const connection = yield database_1.default.getConnection();
                const rows = yield executeSpSelect(connection, "getPageById", values);
                if (rows.length === 0) {
                    return res.status(404).json({ message: "No data found" });
                }
                const infoScreen = [];
                const dataScreen = [];
                let totalImporte = 0;
                rows.forEach((row) => {
                    if (infoScreen.length === 0) {
                        infoScreen.push({
                            headerId: row.headerId,
                            CUENTA_DEBITO: row.Cuenta_Debito,
                            CONCEPTO: row.Prestacion,
                            ROTULO: row.Rotulo,
                            FECHA: row.Fecha_Acreditacion,
                            CANTIDAD_TRANSFERENCIAS: 0,
                            TOTAL_IMPORTE: 0,
                        });
                    }
                    totalImporte += parseFloat(row.totalImporte);
                    dataScreen.push({
                        itemId: row.headerId,
                        CBU: row.CBU,
                        APELLIDO: row.Apellido_Nombre,
                        NOMBRE: row.Apellido_Nombre,
                        IMPORTE: row.totalImporte,
                    });
                });
                if (infoScreen.length > 0) {
                    infoScreen[0].CANTIDAD_TRANSFERENCIAS = dataScreen.length;
                    infoScreen[0].TOTAL_IMPORTE = totalImporte;
                }
                res.json({ head: infoScreen[0], data: dataScreen });
            }
            catch (error) {
                console.error("Error fetching response:", error);
                res.status(500).json({
                    message: "Error fetching getResponsePagos:",
                    error: "Internal server error",
                });
            }
        });
    }
    getResponseTRForCombo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.error("getResponseTRForCombo");
            let connection;
            try {
                connection = yield database_1.default.getConnection();
                const values = null;
                const result = yield executeSpSelect(connection, "getTransListForSelect", values);
                res.json(result);
            }
            catch (error) {
                console.error("Error fetching getResponseTRList:", error);
                res.status(500).json({
                    message: "Error fetching getResponseTRList:",
                    error: "Internal server error",
                });
            }
            finally {
                if (connection)
                    connection.release();
            }
        });
    }
    getResponsePagosForCombo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.error("getResponsePagosForCombo");
            let connection;
            try {
                connection = yield database_1.default.getConnection();
                const values = null;
                const result = yield executeSpSelect(connection, "getPagosListForSelect", values);
                res.json(result);
            }
            catch (error) {
                console.error("Error fetching getResponsePagosForCombo:", error);
                res.status(500).json({
                    message: "Error fetching getResponsePagosForCombo:",
                    error: "Internal server error",
                });
            }
            finally {
                if (connection)
                    connection.release();
            }
        });
    }
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            yield database_1.default.query("DELETE  FROM games WHERE id = ?", [id]);
            res.json({ message: "The game was deleted" });
        });
    }
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var serverFiles = [];
            const dir = path_1.default.join(__dirname, "../../uploads");
            const files = fs.readdirSync(dir);
            for (const file of files) {
                serverFiles.push(file);
            }
            return res.json(serverFiles);
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
            console.log(placeholders);
            console.log("sql");
            console.log(sql);
            console.log("values");
            console.log(values);
            const [queryResult] = yield connection.execute(sql, values);
            const outParamValues = extractOutParams(queryResult, outParams);
            return outParamValues;
        }
        catch (error) {
            console.error(error);
        }
        finally {
            if (connection)
                connection.release();
        }
    });
}
function formatDateFromFile(fechaPagoRaw) {
    // fechaPagoRaw tiene el formato YYYYMMDD
    const year = fechaPagoRaw.substring(0, 4);
    const month = fechaPagoRaw.substring(4, 6);
    const day = fechaPagoRaw.substring(6, 8);
    return `${year}-${month}-${day}`; // Formato YYYY-MM-DD
}
function executeJsonInsert(connection, spName, jsonData, outParams) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("execute SJasonpInsert");
            const sql = `CALL ${spName}(?);`;
            const values = [JSON.stringify(jsonData)];
            console.log("sql");
            console.log(sql);
            console.log("values");
            console.log(values);
            const [queryResult] = yield connection.execute(sql, values);
            const outParamValues = extractOutParams(queryResult, outParams);
            return outParamValues;
        }
        catch (error) {
            console.error(error);
        }
        finally {
            if (connection)
                connection.release();
        }
    });
}
function executeSpSelect(connection, spName, values) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("executeSpSelect");
            let placeholders = "";
            if (values) {
                placeholders = values.map(() => "?").join(",");
            }
            let sql = `CALL ${spName}(${placeholders});`;
            const statement = yield connection.prepare(sql);
            const [results] = yield statement.execute(values);
            statement.close();
            yield connection.unprepare(sql);
            return results[0];
        }
        catch (error) {
            console.error(error);
        }
        finally {
            if (connection)
                connection.release();
        }
    });
}
function executeJsonSelect(connection, spName, jsonData, outParams) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sql = `CALL ${spName}(?);`;
            const values = [JSON.stringify(jsonData)];
            console.log("sql");
            console.log(sql);
            console.log("values");
            console.log(values);
            const statement = yield connection.prepare(sql);
            const [results] = yield statement.execute(values);
            console.log('results full');
            console.log(results);
            statement.close();
            yield connection.unprepare(sql);
            return results[0];
        }
        catch (error) {
            console.error(error);
        }
        finally {
            if (connection) {
                connection.release();
            }
        }
    });
}
function extractOutParams(queryResult, outParams) {
    const output = {};
    // Recorrer los resultados y extraer los parámetros de salida
    queryResult.forEach((resultSet) => {
        if (Array.isArray(resultSet)) {
            resultSet.forEach((row) => {
                outParams.forEach((param) => {
                    if (row.hasOwnProperty(param)) {
                        output[param] = row[param];
                    }
                });
            });
        }
    });
    return output;
}
function InsertTransInmediataDato(connection, values, outParams) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield executeSpInsert(connection, "InsertTransInmediataDato", values, outParams);
    });
}
function LoopAndParseInfo(entity) {
    return __awaiter(this, void 0, void 0, function* () {
        return [
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
    });
}
function InsertTransInmediataInfo(connection, values, outParams) {
    return __awaiter(this, void 0, void 0, function* () {
        const outParamValues = yield executeSpInsert(connection, "InsertTransInmediataInfo", values, outParams);
        const id = outParamValues["lastId"];
        return id;
    });
}
function ParseHeader(info, concepto) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const outParams = ["lastId"];
        return { values, outParams };
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
    fs.readFile("./uploads/look.txt", "utf8", function (err, data) {
        if (err)
            throw err;
        console.log(data);
    });
}
function parsearInfoArchivoTR(infoRowC, infoRowF) {
    let info = new model_1.transInmediataInfo();
    try {
        //CABECERA
        info.tipoDeRegistro = Number(infoRowC.substring(0, 1).trim());
        if (Number.isNaN(info.tipoDeRegistro)) {
            throw new Error("Error en el tipo de registro");
        }
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
    }
    catch (error) {
        throw error;
    }
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
function padStringFromLeft(str, length, padChar = " ") {
    let paddedStr = padChar.repeat(length);
    return paddedStr + str;
}
function padStringFromRight(str, length, padChar = " ") {
    let paddedStr = padChar.repeat(length);
    return str + paddedStr;
}
function getPantallaTransferenciaDatoById(transferenciaInfoId) {
    return __awaiter(this, void 0, void 0, function* () {
        let connection;
        try {
            connection = yield database_1.default.getConnection();
            const values = [transferenciaInfoId];
            const result = yield executeSpSelect(connection, "GetTransInmediataDatoById", values);
            return result;
        }
        catch (error) {
            console.error("Error fetching Pantalla Transferencia Dato:", error);
            throw error;
        }
        finally {
            if (connection)
                connection.release();
        }
    });
}
function getPantallaTransferenciaInfoById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        let connection;
        try {
            connection = yield database_1.default.getConnection();
            const [rows] = yield connection.query("CALL GetTransInmediataInfoById(?)", [
                id,
            ]);
            return rows;
        }
        catch (error) {
            console.error("Error fetching Pantalla Transferencia Info:", error);
            throw error;
        }
        finally {
            if (connection)
                connection.release();
        }
    });
}
function TempUploadProcess() {
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
        return upload;
    });
}
const fileController = new FilesController();
exports.default = fileController;
