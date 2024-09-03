"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = __importDefault(require("../controllers/userController"));
class UserRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config();
    }
    config() {
        this.router.get('/getUsers', userController_1.default.getUsers);
        this.router.post('/createUser', userController_1.default.createUser);
        this.router.put('/updateUser', userController_1.default.updateUser);
        this.router.delete('/deleteUser/:id', userController_1.default.deleteUser);
        this.router.post('/login', userController_1.default.login);
        this.router.post('/GET_GENERIC_SP', userController_1.default.postGenericSP);
    }
}
exports.default = new UserRoutes().router;
