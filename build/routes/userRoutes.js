"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const filesController_1 = __importDefault(require("../controllers/filesController"));
class UserRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config();
    }
    config() {
        this.router.get('/getUsers', filesController_1.default.getUsers);
        this.router.post('/createUser', filesController_1.default.createUser);
        this.router.put('/updateUser', filesController_1.default.updateUser);
        this.router.delete('/deleteUser/:id', filesController_1.default.deleteUser);
    }
}
exports.default = new UserRoutes().router;
