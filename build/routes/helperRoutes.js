"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const helperController_1 = __importDefault(require("../controllers/helperController"));
class HelperRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config();
    }
    config() {
        this.router.post('/GET_CONTRATO_BY_ID', helperController_1.default.getContratoById);
        this.router.get('/GET_LIST_FOR_COMBO/:tipomodulo', helperController_1.default.getListForCombo);
    }
}
exports.default = new HelperRoutes().router;
