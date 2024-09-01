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
const databaseHelper_1 = __importDefault(require("../databaseHelper"));
const enums_1 = require("../enums/enums");
class MetadataController {
    getMetadataUI(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tipomodulo, tipometada, contrato } = req.params;
            let params;
            //let outParams = ['1','2' ];
            try {
                if (contrato === 'NONE') {
                    params = {};
                }
                else {
                    params = { contrato };
                }
                const row = yield databaseHelper_1.default.executeSpJsonReturn(getSpNameForMetada(tipomodulo, tipometada), params);
                res.json([row]);
                return;
            }
            catch (error) {
                console.error("Error:", error);
                res.status(500).json({ message: "Error fetching metadata:", error: "Internal server error" });
            }
        });
    }
    getResumen(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tipomodulo, id } = req.params;
            try {
                const params = { id };
                const [row] = yield databaseHelper_1.default.executeSpJsonReturn(getSpNameForData(tipomodulo, enums_1.TipoData.LIST), params);
                res.json([row]);
                return;
            }
            catch (error) {
                console.error("Error:", error);
                res.status(500).json({ message: "Error fetching resumen:", error: "Internal server error" });
            }
        });
    }
    getFill(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tipomodulo, id } = req.params;
            try {
                const params = { id };
                const [row] = yield databaseHelper_1.default.executeSpJsonReturn(getSpNameForData(tipomodulo, enums_1.TipoData.FILL), params);
                res.json([row]);
                return;
            }
            catch (error) {
                console.error("Error:", error);
                res.status(500).json({ message: "Error fetching fill data:", error: "Internal server error" });
            }
        });
    }
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
const metadataController = new MetadataController();
exports.default = metadataController;
