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
        this.router.get('/GET_RESUMEN/:tipomodulo/:id', metadataController_1.default.getResumen);
        this.router.get('/GET_FILL/:tipomodulo/:id', metadataController_1.default.getFill);
        this.router.get('/GET_METADATA_UI/:tipomodulo/:tipometada/:contrato', metadataController_1.default.getMetadataUI);
    }
}
exports.default = new MetadataRoutes().router;
