"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contractController_1 = __importDefault(require("../controllers/contractController"));
class ContractRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config();
    }
    config() {
        this.router.post('/contratosbotones', contractController_1.default.getContratosBotones);
        this.router.post('/obtenercontratobyid', contractController_1.default.getContratoById);
    }
}
exports.default = new ContractRoutes().router;
