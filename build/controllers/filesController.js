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
exports.mappings = void 0;
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
    getUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let connection;
            try {
                connection = yield database_1.default.getConnection();
                const result = yield executeSpSelect(connection, "GetAllUsers", []);
                res.json(result);
            }
            catch (error) {
                console.error("Error fetching users:", error);
                res.status(500).json({ message: "Error fetching users", error: "Internal server error" });
            }
            finally {
                if (connection)
                    connection.release();
            }
        });
    }
    createUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userData = req.body;
            let connection;
            try {
                connection = yield database_1.default.getConnection();
                const result = yield executeJsonInsert(connection, "InsertUser", userData, ["ID", "ESTADO", "DESCRIPCION"]);
                if (!result.ID) {
                    res.json({ error: result.Data });
                    return;
                }
                res.json({ ID: result.ID, ESTADO: result.ESTADO, DESCRIPCION: result.DESCRIPCION });
            }
            catch (error) {
                console.error("Error creating user:", error);
                res.status(500).json({ message: "Error creating user", error: "Internal server error" });
            }
            finally {
                if (connection)
                    connection.release();
            }
        });
    }
    updateUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userData = req.body;
            let connection;
            try {
                connection = yield database_1.default.getConnection();
                const result = yield executeJsonInsert(connection, "UpdateUser", userData, ["ESTADO", "DESCRIPCION"]);
                if (result.ESTADO === undefined) {
                    res.json({ error: result.Data });
                    return;
                }
                res.json({ ESTADO: result.ESTADO, DESCRIPCION: result.DESCRIPCION });
            }
            catch (error) {
                console.error("Error updating user:", error);
                res.status(500).json({ message: "Error updating user", error: "Internal server error" });
            }
            finally {
                if (connection)
                    connection.release();
            }
        });
    }
    deleteUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            let connection;
            try {
                connection = yield database_1.default.getConnection();
                const result = yield executeSpJsonReturn(connection, "DeleteUser", { id });
                if (result.ESTADO === undefined) {
                    res.json({ error: result.Data });
                    return;
                }
                res.json({ ESTADO: result.ESTADO, DESCRIPCION: result.DESCRIPCION });
            }
            catch (error) {
                console.error("Error deleting user:", error);
                res.status(500).json({ message: "Error deleting user", error: "Internal server error" });
            }
            finally {
                if (connection)
                    connection.release();
            }
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
    postValidateInsert(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var upload = yield TempUploadProcess();
            upload(req, res, () => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                let connection;
                try {
                    connection = yield database_1.default.getConnection();
                    // Dividir el nombre del archivo en partes
                    const dataFromUI = (_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname.split("-");
                    console.log((_b = req.file) === null || _b === void 0 ? void 0 : _b.originalname.split("-"));
                    // Asumimos que el primer campo determina el tipo de módulo
                    const TIPO_MODULO = dataFromUI[0];
                    // Construcción del objeto JSON sin TIPO_MODULO
                    const jsonResult = {
                        ITEMS: [], // Aquí se agregarán los registros del Excel más adelante
                        fileContent: undefined
                    };
                    // Obtener la configuración según el tipo de módulo
                    const config = exports.mappings[TIPO_MODULO];
                    if (config) {
                        // Iterar sobre los campos y asignar los valores desde dataFromUI
                        config.fields.forEach((field, index) => {
                            let value = dataFromUI[index + 1]; // Ajustamos el índice porque dataFromUI[0] es TIPO_MODULO
                            // Realizar reemplazo específico si es necesario
                            if (field === 'CONCEPTO') {
                                value = value.replace(".", "-");
                            }
                            // Si el campo es FECHAPAGO, formatear la fecha
                            if (field === 'FECHAPAGO') {
                                value = formatDateFromFile(value);
                            }
                            // Asignar el valor al campo correspondiente en el objeto JSON
                            jsonResult[field] = value;
                        });
                        if (TIPO_MODULO === 'NOMINA') {
                            // Leer el contenido del archivo TXT
                            fs.readFile(req.file.path, "utf8", function (err, data) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    // Primero, debemos reemplazar las secuencias escapadas \\r\\n con \r\n
                                    let jsonString = data.replace(/\\r/g, ' ').replace(/\\n/g, ' ').replace(/\\t/g, ' ');
                                    jsonResult.fileContent = jsonString;
                                    ;
                                    console.log(jsonResult);
                                    const spName = `${TIPO_MODULO}_VALIDAR_INSERTAR_ENTRADA`;
                                    // Parámetros de salida
                                    const outParamValues = ["ID", "ESTADO", "DESCRIPCION"];
                                    // Ejecutar el stored procedure con el objeto JSON resultante
                                    const result = yield executeJsonInsert(connection, spName, jsonResult, outParamValues);
                                    if (!result.success) {
                                        res.json({ error: result.Data });
                                        return;
                                    }
                                    const ID = result["ID"];
                                    const ESTADO = result["ESTADO"];
                                    const DESCRIPCION = result["DESCRIPCION"];
                                    res.json({ ID, ESTADO, DESCRIPCION });
                                });
                            });
                        }
                        else {
                            // Procesar el archivo Excel y agregar los items al jsonResult 
                            const rows = yield (0, node_1.default)(req.file.path);
                            const dataFromRows = rows.slice(config.startRow);
                            for (let row of dataFromRows) {
                                if ((TIPO_MODULO === 'PAGO' && !row[3]) || (TIPO_MODULO === 'CUENTA' && !row[4])) {
                                    break;
                                }
                                if (TIPO_MODULO === 'PAGO') {
                                    const [CBU, CUIL, NOMBRE, IMPORTE] = row.slice(3);
                                    jsonResult.ITEMS.push({ CBU, CUIL, NOMBRE, IMPORTE });
                                }
                                else if (TIPO_MODULO === 'CUENTA') {
                                    const [CUIL, Tipo_Doc, Nro_Doc, Apellidos, Nombres, Fecha_Nacimiento, Sexo] = row;
                                    jsonResult.ITEMS.push({ CUIL, Tipo_Doc, Nro_Doc, Apellidos, Nombres, Fecha_Nacimiento, Sexo });
                                }
                            }
                            const spName = `${TIPO_MODULO}_VALIDAR_INSERTAR_ENTRADA`;
                            // Parámetros de salida
                            const outParamValues = ["ID", "ESTADO", "DESCRIPCION"];
                            // Ejecutar el stored procedure con el objeto JSON resultante
                            const result = yield executeJsonInsert(connection, spName, jsonResult, outParamValues);
                            if (!result.ID) {
                                res.json({ error: result.Data });
                                return;
                            }
                            const ID = result["ID"];
                            const ESTADO = result["ESTADO"];
                            const DESCRIPCION = result["DESCRIPCION"];
                            res.json({ ID, ESTADO, DESCRIPCION });
                        }
                    }
                }
                catch (error) {
                    console.error("Error durante la operación:", error);
                    res.json({ message: "Internal server error", error: error.message });
                }
                finally {
                    if (connection)
                        connection.release();
                }
            }));
        });
    }
    getResumen(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let { tipomodulo } = req.params;
            let { id } = req.params;
            let connection;
            try {
                connection = yield database_1.default.getConnection();
                const params = { id };
                const row = yield executeSpJsonReturn(connection, getSpNameForData(tipomodulo, enums_1.TipoData.LIST), params);
                if (row.metadata_json == !undefined) {
                    res.json({ error: row.Data });
                }
                else {
                    res.json({ result: row[0].resultado_json });
                }
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
    getFill(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let { tipomodulo } = req.params;
            let { id } = req.params;
            let connection;
            try {
                connection = yield database_1.default.getConnection();
                const params = { id };
                const row = yield executeSpJsonReturn(connection, getSpNameForData(tipomodulo, enums_1.TipoData.FILL), params);
                if (row.metadata_json == !undefined) {
                    res.json({ error: row.Data });
                    return;
                }
                else {
                    res.json({ result: row[0].resultado_json });
                }
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
    getMetadataUI(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tipomodulo } = req.params;
            const { tipometada } = req.params;
            const { contrato } = req.params;
            let params;
            console.log("tipomodulo: " + tipomodulo);
            console.log("tipometada: " + tipometada);
            console.log("contrato: " + contrato);
            let connection;
            try {
                connection = yield database_1.default.getConnection();
                if (contrato === 'NONE') {
                    params = {};
                }
                else {
                    params = { contrato };
                }
                const row = yield executeSpJsonReturn(connection, getSpNameForMetada(tipomodulo, tipometada), params);
                if (row[0].metadata_json == undefined) {
                    res.json({ error: row.Data });
                    return;
                }
                console.log(['HOLAAAAAAAAAAAAAAAAAAAAAAA']);
                console.log(row[0]);
                res.json({ data: row[0] });
                return;
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
                const row = yield executeSpSelect(connection, getSpNameForData(tipomodulo, enums_1.TipoData.EXPORT), values);
                const file = fs.openSync(`./uploads/${tipomodulo}_${id}.txt`, "w");
                console.log("row");
                console.log(row);
                let line = row[0][1];
                fs.writeSync(file, line + "\n");
                fs.closeSync(file);
                const filePath = `./uploads/${tipomodulo}_${id}.txt`;
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
    getListForCombo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let { tipomodulo } = req.params;
            let values = [tipomodulo];
            let connection;
            try {
                connection = yield database_1.default.getConnection();
                const result = yield executeSpSelect(connection, "GET_LIST_FOR_COMBO", values);
                res.json(result);
            }
            catch (error) {
                console.error("Error fetching getListForCombo:", error);
                res.status(500).json({
                    message: "Error fetching getListForCombo:",
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
            console.log("Executing Stored Procedure:", spName);
            const sql = `CALL ${spName}(?);`;
            const values = [JSON.stringify(jsonData)];
            console.log("SQL Command:");
            console.log(sql);
            console.log("Input Values:");
            console.log(values);
            const [queryResult] = yield connection.execute(sql, values);
            if (queryResult[0][0].Result > 0) {
                return queryResult[0][0];
            }
            const outParamValues = extractOutParams(queryResult, outParams);
            return outParamValues;
        }
        catch (error) {
            console.error("Error executing stored procedure:", error.message || error);
            return {
                success: false,
                message: error.message || "An error occurred during the execution of the stored procedure."
            };
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
            return results;
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
function executeSpJsonReturn(connection, spName, params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("executeSpSelect");
            let values;
            if (Array.isArray(params)) {
                values = params;
            }
            else {
                values = Object.values(params);
            }
            let placeholders = values.map(() => "?").join(",");
            let sql = `CALL ${spName}(${placeholders});`;
            const statement = yield connection.prepare(sql);
            const [results] = yield statement.execute(values);
            if (results[0][0].Result > 0) {
                return results[0][0];
            }
            return results[0];
        }
        catch (error) {
            console.error(error);
            throw error;
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
            if (results[0][0].Result > 0) {
                return results[0][0];
            }
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
function getSpNameForMetada(tipoModulo, tipometada) {
    switch (true) {
        case tipoModulo === enums_1.TipoModulo.PAGO && tipometada === enums_1.TipoMetada.LIST:
            return 'PAGO_METADATA_UI_RESUMEN';
        case tipoModulo === enums_1.TipoModulo.PAGO && tipometada === enums_1.TipoMetada.IMPORT:
            return 'PAGO_METADATA_UI_IMPORT';
        case tipoModulo === enums_1.TipoModulo.CUENTA && tipometada === enums_1.TipoMetada.LIST:
            return 'CUENTA_METADATA_UI_RESUMEN';
        case tipoModulo === enums_1.TipoModulo.CUENTA && tipometada === enums_1.TipoMetada.IMPORT:
            return 'CUENTA_METADATA_UI_IMPORT';
        case tipoModulo === enums_1.TipoModulo.NOMINA && tipometada === enums_1.TipoMetada.LIST:
            return 'NOMINA_METADATA_UI_IMPORT';
        case tipoModulo === enums_1.TipoModulo.NOMINA && tipometada === enums_1.TipoMetada.IMPORT:
            return 'NOMINA_METADATA_UI_IMPORT';
        case tipoModulo === enums_1.TipoModulo.NOMINA && tipometada === enums_1.TipoMetada.FILL:
            return 'NOMINA_METADATA_UI_FILL';
        default:
            return '';
    }
}
function getSpNameForData(tipoModulo, tipoData) {
    switch (true) {
        case tipoModulo === enums_1.TipoModulo.PAGO && tipoData === enums_1.TipoData.LIST:
            return 'PAGO_OBTENER_RESUMEN_BY_ID';
        case tipoModulo === enums_1.TipoModulo.PAGO && tipoData === enums_1.TipoData.EXPORT:
            return 'PAGO_OBTENER_ARCHIVO_BY_ID';
        case tipoModulo === enums_1.TipoModulo.CUENTA && tipoData === enums_1.TipoData.LIST:
            return 'CUENTA_OBTENER_RESUMEN_BY_ID';
        case tipoModulo === enums_1.TipoModulo.CUENTA && tipoData === enums_1.TipoData.EXPORT:
            return 'CUENTA_OBTENER_ARCHIVO_BY_ID';
        case tipoModulo === enums_1.TipoModulo.NOMINA && tipoData === enums_1.TipoData.LIST:
            return 'NOMINA_OBTENER_RESUMEN_BY_ID';
        case tipoModulo === enums_1.TipoModulo.NOMINA && tipoData === enums_1.TipoData.FILL:
            return 'NOMINA_OBTENER_FILL_BY_ID';
        default:
            return '';
    }
}
function TempUploadProcess() {
    return __awaiter(this, void 0, void 0, function* () {
        const randomNumber = Math.floor(100000 + Math.random() * 900000);
        var store = multer_1.default.diskStorage({
            destination: function (req, file, cb) {
                cb(null, "./uploads");
            },
            filename: function (req, file, cb) {
                let tipoModulo = file.originalname.split("-")[0];
                getFileType(tipoModulo).then((fileType) => {
                    cb(null, tipoModulo + "-" + randomNumber + fileType);
                });
            },
        });
        var upload = (0, multer_1.default)({ storage: store }).single("file");
        return upload;
    });
}
function getFileType(tipoModulo) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (tipoModulo) {
            case enums_1.TipoModulo.PAGO:
                return ".xlsx";
            case enums_1.TipoModulo.CUENTA:
                return ".xlsx";
            case enums_1.TipoModulo.NOMINA:
                return ".txt";
            case enums_1.TipoModulo.TRANSFERENCIAS:
                return ".txt";
            default:
                return ".xlsx";
        }
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
const fileController = new FilesController();
exports.default = fileController;
exports.mappings = {
    PAGO: {
        startRow: 3,
        fields: ['IDUSER', 'IDORG', 'IDCONT', 'CONCEPTO', 'FECHAPAGO']
    },
    CUENTA: {
        startRow: 4,
        fields: ['IDUSER', 'IDORG', 'IDCONT', 'ROTULO', 'ENTE']
    },
    NOMINA: {
        startRow: 0,
        fields: ['id_user', 'Organismo_id', 'Contrato_id']
    }
};
