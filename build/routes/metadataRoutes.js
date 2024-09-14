"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const metadataController_1 = __importDefault(require("../controllers/metadataController"));
class MetadataRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config();
    }
    config() {
        this.router.get('/GET_METADATA_UI/:tipomodulo/:tipometada/:contrato', metadataController_1.default.getMetadataUI);
        this.router.post('/POST_VALIDATE_INSERT/', metadataController_1.default.postValidarInsertar);
        this.router.post('/POST_INSERT_PAGOS_MANUAL', metadataController_1.default.postValidarInsertarPagos);
        this.router.post('/POST_INSERT_NOMINA_MANUAL', metadataController_1.default.postValidarInsertarNomina);
        this.router.get('//:tipomodulo/:user/:contrato/:organismo', metadataController_1.default.getUIResumen);
        this.router.post('/POST_INSERT_GENERIC_SP', metadataController_1.default.postInsertGenericSP);
        this.router.post('/POST_SELECT_GENERIC_SP', metadataController_1.default.postSelectGenericSP);
    }
}
exports.default = new MetadataRoutes().router;
