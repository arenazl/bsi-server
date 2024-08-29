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
const database_1 = __importDefault(require("../database"));
class UsuarioController {
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(req.body);
            let nombre = req.body.nombre;
            let pass = req.body.password;
            const values = [nombre, pass];
            const connection = yield database_1.default.getConnection();
            //const rows = await executeSpSelect(connection, 'sp_login_user', values); 
            return res.json("lalalalala");
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
            console.log("results");
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
const usuarioController = new UsuarioController;
exports.default = usuarioController;
