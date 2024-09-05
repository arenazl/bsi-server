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
        this.router.get('/GET_RESUMEN_VALIDACION/:tipomodulo/:id', metadataController_1.default.getUIResumen);
        this.router.get('/GET_FILL_IMPORTES/:tipomodulo/:id', metadataController_1.default.getUIFill);
        this.router.post('/GET_GENERIC_SP', metadataController_1.default.postGenericSP);
    }
}
exports.default = new MetadataRoutes().router;
