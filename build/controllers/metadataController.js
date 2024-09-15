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
const databaseHelper_1 = __importDefault(require("../databaseHelper"));
const enums_1 = require("../enums/enums");
const databaseHelper_2 = __importDefault(require("../databaseHelper"));
const node_1 = __importDefault(require("read-excel-file/node"));
const fs = __importStar(require("fs"));
class MetadataController {
    postSelectGenericSP(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { sp_name, body, jsonUnify = false, } = req.body;
                // Verificar si los parámetros requeridos están presentes
                if (!sp_name || !body) {
                    return res.status(400).json({
                        estado: 0,
                        descripcion: 'Faltan parámetros requeridos.',
                        data: null,
                    });
                }
                // Preparar los valores para enviar al SP
                let values = {};
                // Si jsonUnify es true, mandar el body completo como un JSON único
                if (jsonUnify) {
                    values = { p_json: JSON.stringify(body) }; // Envía todo el body como JSON único
                }
                else {
                    // Mandar los parámetros de manera tradicional, cada clave-valor por separado
                    Object.entries(body).forEach(([key, value]) => {
                        if (typeof value === 'string' || typeof value === 'number') {
                            values[key] = value;
                        }
                        else {
                            values[key] = JSON.stringify(value); // Convertir objetos y arrays a JSON
                        }
                    });
                }
                // Ejecutar el stored procedure con los valores
                const rows = yield databaseHelper_1.default.executeSpJsonReturn(sp_name, values);
                const result = rows[0];
                return res.json(result);
            }
            catch (error) {
                console.error("Error en el procedimiento:", error.message || error);
                return res.status(500).json({
                    estado: 0,
                    descripcion: 'Error interno del servidor.',
                    data: null,
                });
            }
        });
    }
    postInsertGenericSP(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { sp_name, body } = req.body;
                // Ejecutar el stored procedure con los valores
                const rows = yield databaseHelper_1.default.executeJsonInsert(sp_name, body);
                const result = rows[0][0][0];
                // Retornar la respuesta si el estado es 1
                return res.json(result);
            }
            catch (error) {
                console.error("Error en el procedimiento:", error.message || error);
                return res.status(500).json({
                    estado: 0,
                    descripcion: 'Error interno del servidor.',
                    data: null,
                });
            }
        });
    }
    getMetadataUI(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tipomodulo, tipometada, contrato } = req.params;
            let params = [];
            try {
                // Configuración de los parámetros en función de la entrada
                if (contrato !== 'NONE') {
                    params.push(Number(contrato));
                }
                // Obtiene el nombre del stored procedure basado en los parámetros recibidos
                const spName = databaseHelper_2.default.getSpNameForMetada(tipomodulo, tipometada);
                // Llama al stored procedure usando los parámetros configurados
                const rows = yield databaseHelper_1.default.executeSpSelect(spName, params);
                // Devuelve la primera fila obtenida del procedimiento almacenado
                res.json(rows[0]);
            }
            catch (error) {
                console.error("Error:", error);
                // Manejo de errores: devuelve una respuesta con estructura estándar
                res.status(500).json({
                    estado: 0,
                    descripcion: "Error interno del servidor.",
                    data: null
                });
            }
        });
    }
    postValidarInsertar(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var upload = yield databaseHelper_1.default.TempUploadProcess();
            upload(req, res, () => __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    const dataFromUI = (_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname.split("-");
                    const TIPO_MODULO = dataFromUI[0];
                    const config = exports.mappings[TIPO_MODULO];
                    const jsonResult = { ITEMS: [] };
                    if (config) {
                        config.fields.forEach((field, index) => {
                            let value = dataFromUI[index + 1];
                            if (field === "CONCEPTO")
                                value = value.replace(".", "-");
                            if (field === "FECHAPAGO")
                                value = databaseHelper_1.default.formatDateFromFile(value);
                            jsonResult[field] = value;
                        });
                    }
                    if (TIPO_MODULO === "NOMINA") {
                        fs.readFile(req.file.path, "utf8", (err, data) => __awaiter(this, void 0, void 0, function* () {
                            if (err) {
                                console.error("Error leyendo el archivo de texto:", err);
                                res.json({ error: "Error leyendo el archivo de texto" });
                                return;
                            }
                            const items = data.split("\n").map(line => line.trim()).filter(line => line.length > 0);
                            jsonResult.ITEMS = items;
                            const spName = `${TIPO_MODULO}_VALIDAD_INSERTAR_FULL_VALIDATION`;
                            const result = yield databaseHelper_1.default.executeJsonInsert(spName, jsonResult);
                            res.json(result[0][0][0]);
                        }));
                    }
                    else {
                        const rows = yield (0, node_1.default)(req.file.path);
                        const dataFromRows = rows.slice(config.startRow);
                        dataFromRows.forEach((row) => {
                            if ((TIPO_MODULO === "PAGO" && !row[3]) || (TIPO_MODULO === "CUENTA" && !row[4]))
                                return;
                            if (TIPO_MODULO === "PAGO") {
                                const [CBU, CUIL, NOMBRE, IMPORTE] = row.slice(3);
                                jsonResult.ITEMS.push({ CBU, CUIL, NOMBRE, IMPORTE });
                            }
                            else if (TIPO_MODULO === "CUENTA") {
                                const [CUIL, Tipo_Doc, Nro_Doc, Apellidos, Nombres, Fecha_Nacimiento, Sexo] = row;
                                jsonResult.ITEMS.push({ CUIL, Tipo_Doc, Nro_Doc, Apellidos, Nombres, Fecha_Nacimiento, Sexo });
                            }
                        });
                        const spName = `${TIPO_MODULO}_VALIDAR_INSERTAR_ENTRADA`;
                        const result = yield databaseHelper_1.default.executeJsonInsert(spName, jsonResult);
                        res.json(result[0][0][0]);
                    }
                }
                catch (error) {
                    console.error("Error durante la operación:", error);
                    res.json({ message: "Internal server error", error: error.message });
                }
            }));
        });
    }
    postNominaDesdeImport(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var upload = yield databaseHelper_1.default.TempUploadProcess();
            upload(req, res, () => __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    const dataFromUI = (_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname.split("-");
                    const TIPO_MODULO = enums_1.TipoModulo.NOMINA_XSL;
                    const config = exports.mappings[TIPO_MODULO];
                    const jsonResult = { ITEMS: [] };
                    config.fields.forEach((field, index) => {
                        let value = dataFromUI[index + 1];
                        jsonResult[field] = value;
                    });
                    const rows = yield (0, node_1.default)(req.file.path);
                    const dataFromRows = rows.slice(config.startRow);
                    dataFromRows.forEach((row) => {
                        if (!row[3])
                            return;
                        const [CBU, CUIL, NOMBRE] = row.slice(3);
                        jsonResult.ITEMS.push({ CBU, CUIL, NOMBRE });
                    });
                    const spName = `NOMINA_VALIDAD_INSERTAR_FULL_VALIDATION`;
                    const result = yield databaseHelper_1.default.executeJsonInsert(spName, jsonResult);
                    res.json(result[0][0][0]);
                }
                catch (error) {
                    console.error("Error durante la operación:", error);
                    res.json({ message: "Internal server error", error: error.message });
                }
            }));
        });
    }
    postValidarInsertarPagos(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const spName = `PAGO_VALIDAR_INSERTAR_ENTRADA`;
            const result = yield databaseHelper_1.default.executeJsonInsert(spName, req.body);
            res.json(result[0][0][0]);
        });
    }
    postValidarInsertarNomina(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const spName = `NOMINA_VALIDAR_INSERTAR_ENTRADA_JSON`;
            const result = yield databaseHelper_1.default.executeJsonInsert(spName, req.body);
            res.json(result[0][0][0]);
        });
    }
    getUIResumen(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tipomodulo, id } = req.params;
            try {
                const params = [id];
                const rows = yield databaseHelper_1.default.executeSpSelect(databaseHelper_2.default.getSpNameForData(tipomodulo, enums_1.TipoData.LIST), params);
                res.json(rows[0]);
            }
            catch (error) {
                console.error("Error:", error);
                res.status(500).json({ message: "Error fetching resumen:", error: "Internal server error" });
            }
        });
    }
}
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
        fields: ['IDUSER', 'IDORG', 'IDCONT']
    },
    NOMINA_XSL: {
        startRow: 3,
        fields: ['IDUSER', 'IDORG', 'IDCONT', 'CONCEPTO', 'FECHAPAGO']
    }
};
const metadataController = new MetadataController();
exports.default = metadataController;
