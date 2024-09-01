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
class ContractController {
    getContratosBotones(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const id_user = req.body.user;
            const id_organismo = req.body.contrato;
            const values = [id_user, id_organismo];
            try {
                const row = yield databaseHelper_1.default.executeSpSelect("ObtenerContratos", values);
                res.json(row);
            }
            catch (error) {
                console.error("Error:", error);
                res
                    .status(500)
                    .json({ message: "Error fetching:", error: "Internal server error" });
            }
            finally {
            }
        });
    }
    getContratoById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const id_user = req.body.id_user;
            const id_organismo = req.body.id_organismo;
            const id_contrato = req.body.id_contrato;
            const values = [id_user, id_organismo, id_contrato];
            try {
                const [row] = yield databaseHelper_1.default.executeSpSelect("ObtenerContratoById", values);
                res.json([row]);
                return;
            }
            catch (error) {
                console.error("Error:", error);
                res
                    .status(500)
                    .json({ message: "Error fetching:", error: "Internal server error" });
            }
            finally {
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
exports.contractController = new ContractController();
exports.default = exports.contractController;
