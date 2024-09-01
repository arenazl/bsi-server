"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const filesController_1 = __importDefault(require("../controllers/filesController"));
class ValidationRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config();
    }
    config() {
        this.router.post('/POST_VALIDATE_INSERT/', filesController_1.default.postValidateInsert);
    }
}
exports.default = new ValidationRoutes().router;
