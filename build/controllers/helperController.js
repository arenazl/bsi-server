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
exports.contractController = void 0;
const databaseHelper_1 = __importDefault(require("../databaseHelper"));
class HelperController {
    getContratoById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const id_user = req.body.id_user;
            const id_organismo = req.body.id_organismo;
            const id_contrato = req.body.id_contrato;
            const values = [id_user, id_organismo, id_contrato];
            try {
                // Llama al stored procedure con los valores proporcionados
                const rows = yield databaseHelper_1.default.executeSpSelect("ObtenerContratoById", values);
                // Verifica si rows tiene datos y devuelve la primera fila, que contiene estado, descripcion y data
                if (rows && rows.length > 0) {
                    res.json(rows[0]); // Devuelve la respuesta tal como la recibe del SP
                }
                else {
                    // Maneja el caso donde no se obtienen resultados del SP
                    res.status(404).json({
                        estado: 0,
                        descripcion: 'No se encontraron resultados.',
                        data: null,
                    });
                }
            }
            catch (error) {
                console.error("Error:", error);
                // Manejo del error en caso de falla del SP
                res.status(500).json({
                    estado: 0,
                    descripcion: 'Error interno del servidor.',
                    data: null,
                });
            }
        });
    }
    getListForCombo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let { tipomodulo } = req.params;
            let values = [tipomodulo];
            try {
                const result = yield databaseHelper_1.default.executeSpSelect("GET_LIST_FOR_COMBO", values);
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
            }
        });
    }
}
exports.contractController = new HelperController();
exports.default = exports.contractController;
