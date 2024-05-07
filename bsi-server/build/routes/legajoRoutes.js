"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const legajoController_1 = __importDefault(require("../controllers/legajoController"));
class LegajoRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config();
    }
    config() {
        this.router.get('/test', legajoController_1.default.test);
    }
}
exports.default = new LegajoRoutes().router;
