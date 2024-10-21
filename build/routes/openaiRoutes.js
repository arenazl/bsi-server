"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const openaiController_1 = require("../controllers/openaiController");
class OpenAIRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config();
    }
    config() {
        this.router.post('/message', openaiController_1.openaiController.sendMessage);
        this.router.get('/webhook', openaiController_1.openaiController.webhookVerification);
    }
}
const openaiRoutes = new OpenAIRoutes();
exports.default = openaiRoutes.router;
