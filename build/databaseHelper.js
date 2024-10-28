"use strict";
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
const promise_1 = require("mysql2/promise");
const keys_1 = __importDefault(require("./keys"));
const enums_1 = require("./enums/enums");
const multer_1 = __importDefault(require("multer"));
class DatabaseHelper {
    constructor() {
        // Configuración del pool de conexiones usando createPool
        this.pool = (0, promise_1.createPool)(keys_1.default.databaseNucleoOnline);
    }
    static getInstance() {
        if (!DatabaseHelper.instance) {
            DatabaseHelper.instance = new DatabaseHelper();
        }
        return DatabaseHelper.instance;
    }
    getConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = yield this.pool.getConnection();
                return connection;
            }
            catch (err) {
                console.error("Error obtaining database connection:", err.message || err);
                throw err;
            }
        });
    }
    executeSpInsert(spName, values, outParams) {
        return __awaiter(this, void 0, void 0, function* () {
            let connection;
            try {
                connection = yield this.getConnection();
                const placeholders = values.map(() => "?").join(",");
                const sql = `CALL ${spName}(${placeholders});`;
                const [queryResult] = yield connection.execute(sql, values);
                return this.extractOutParams(queryResult, outParams);
            }
            catch (error) {
                console.error("Error executing stored procedure (Insert):", error.message || error);
                throw error;
            }
            finally {
                if (connection)
                    connection.release();
            }
        });
    }
    executeSpSelect(spName_1, values_1) {
        return __awaiter(this, arguments, void 0, function* (spName, values, outParams = []) {
            let connection;
            try {
                connection = yield this.getConnection();
                const placeholders = values.map(() => "?").join(",");
                const sql = `CALL ${spName}(${placeholders});`;
                // Ejecuta el procedimiento almacenado y obtiene los resultados
                const [results] = yield connection.execute(sql, values);
                // Verifica que los resultados no estén vacíos y que tengan la estructura esperada
                if (results && results.length > 0 && Array.isArray(results[0])) {
                    // Retorna siempre el primer set de resultados
                    return results[0];
                }
                else {
                    // Maneja casos donde no haya datos retornados correctamente
                    throw new Error("El stored procedure no devolvió datos válidos.");
                }
            }
            catch (error) {
                console.error("Error executing stored procedure (Select):", error.message || error);
                throw error;
            }
            finally {
                if (connection)
                    connection.release();
            }
        });
    }
    executeJsonInsert(spName_1, jsonData_1) {
        return __awaiter(this, arguments, void 0, function* (spName, jsonData, outParams = []) {
            let connection;
            try {
                connection = yield this.getConnection();
                const sql = `CALL ${spName}(?);`;
                const values = [JSON.stringify(jsonData)];
                const [queryResult] = yield connection.execute(sql, values);
                return [queryResult];
            }
            catch (error) {
                console.error("Error executing JSON insert:", error.message || error);
                return {
                    success: false,
                    message: error.message || "An error occurred during the execution of the stored procedure.",
                };
            }
            finally {
                if (connection)
                    connection.release();
            }
        });
    }
    executeSpJsonReturn(spName_1, params_1) {
        return __awaiter(this, arguments, void 0, function* (spName, params, outParams = []) {
            let connection;
            try {
                connection = yield this.getConnection();
                const values = Array.isArray(params) ? params : Object.values(params);
                const placeholders = values.map(() => "?").join(",");
                const sql = `CALL ${spName}(${placeholders});`;
                const [results] = yield connection.execute(sql, values);
                return results[0];
            }
            catch (error) {
                console.error("Error executing stored procedure (JSON Return):", error.message || error);
                throw error;
            }
            finally {
                if (connection)
                    connection.release();
            }
        });
    }
    formatDateFromFile(fechaPagoRaw) {
        // fechaPagoRaw tiene el formato YYYYMMDD
        const year = fechaPagoRaw.substring(0, 4);
        const month = fechaPagoRaw.substring(4, 6);
        const day = fechaPagoRaw.substring(6, 8);
        return `${year}-${month}-${day}`; // Formato YYYY-MM-DD
    }
    getfileType(tipoModulo) {
        if (tipoModulo == enums_1.TipoModulo.PAGO || tipoModulo == enums_1.TipoModulo.CUENTA)
            return ".xlsx";
        else if (tipoModulo == enums_1.TipoModulo.NOMINA || tipoModulo == enums_1.TipoModulo.TRANSFERENCIAS)
            return ".txt";
        else if (tipoModulo == enums_1.TipoModulo.NOMINA_XSL)
            return ".xlsx";
    }
    extractOutParams(queryResult, outParams) {
        const output = {};
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
    formatItems(data) {
        if (data.ITEMS && Array.isArray(data.ITEMS)) {
            data.ITEMS = data.ITEMS.join('\n');
        }
        return JSON.stringify(data, null, 2);
    }
    TempUploadProcess() {
        return __awaiter(this, void 0, void 0, function* () {
            const randomNumber = Math.floor(100000 + Math.random() * 900000);
            var store = multer_1.default.diskStorage({
                destination: function (_req, _file, cb) {
                    cb(null, "./uploads");
                },
                filename: (req, file, cb) => {
                    let tipoModulo = file.originalname.split("-")[0];
                    cb(null, tipoModulo + "-" + randomNumber + "-" + this.getfileType(tipoModulo));
                },
            });
            var upload = (0, multer_1.default)({ storage: store }).single("file");
            return upload;
        });
    }
    getSpNameForData(tipoModulo, tipoData) {
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
            default:
                return '';
        }
    }
    getSpNameForMetada(tipoModulo, tipometada) {
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
                return 'NOMINA_METADATA_UI_RESUMEN';
            case tipoModulo === enums_1.TipoModulo.NOMINA && tipometada === enums_1.TipoMetada.IMPORT:
                return 'NOMINA_METADATA_UI_IMPORT';
            case tipoModulo === enums_1.TipoModulo.NOMINA && tipometada === enums_1.TipoMetada.FILL:
                return 'NOMINA_METADATA_UI_FILL';
            default:
                return '';
        }
    }
}
exports.default = DatabaseHelper.getInstance();
