"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const databaseHelper_1 = __importDefault(require("../databaseHelper"));
const databaseHelper_2 = __importDefault(require("../databaseHelper"));
class UserController {
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const nombre = req.body.nombre;
            const pass = req.body.password;
            const values = [nombre, pass];
            try {
                // Llama al procedimiento almacenado usando el método executeSpSelect
                const rows = yield databaseHelper_2.default.executeSpSelect('sp_login_user', values);
                // Devuelve directamente el primer registro de los resultados, que contiene estado, descripcion y data
                return res.json(rows[0]);
            }
            catch (error) {
                console.error("Error en el login:", error.message || error);
                // En caso de error, devuelve una estructura con los campos estándar
                return res.status(500).json({
                    estado: 0,
                    descripcion: 'Error interno del servidor.',
                    data: null,
                });
            }
        });
    }
    postGenericSP(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { sp_name, body } = req.body;
                const values = {};
                Object.keys(body).forEach(key => {
                    values[key] = body[key];
                });
                const rows = yield databaseHelper_2.default.executeSpJsonReturn(sp_name, values);
                return res.json(rows[0]);
            }
            catch (error) {
                console.error("Error en el procedimiento:", error.message || error);
                return res.status(500).json({
                    estado: 0,
                    descripcion: 'Error interno del servidor.',
                    data: null,
                });
            }
        });
    }
    getUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield databaseHelper_1.default.executeSpSelect("GetAllUsers", []);
                res.json(result);
            }
            catch (error) {
                console.error("Error fetching users:", error);
                res.status(500).json({ message: "Error fetching users", error: "Internal server error" });
            }
        });
    }
    createUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield databaseHelper_1.default.executeJsonInsert("InsertUser", req.body, ["ID", "ESTADO", "DESCRIPCION"]);
                if (!result.ID) {
                    res.json({ error: result.Data });
                    return;
                }
                res.json({ ID: result.ID, ESTADO: result.ESTADO, DESCRIPCION: result.DESCRIPCION });
            }
            catch (error) {
                console.error("Error creating user:", error);
                res.status(500).json({ message: "Error creating user", error: "Internal server error" });
            }
        });
    }
    updateUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield databaseHelper_1.default.executeJsonInsert("UpdateUser", req.body, ["ESTADO", "DESCRIPCION"]);
                if (result.ESTADO === undefined) {
                    res.json({ error: result.Data });
                    return;
                }
                res.json({ ESTADO: result.ESTADO, DESCRIPCION: result.DESCRIPCION });
            }
            catch (error) {
                console.error("Error updating user:", error);
                res.status(500).json({ message: "Error updating user", error: "Internal server error" });
            }
        });
    }
    deleteUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield databaseHelper_1.default.executeSpJsonReturn("DeleteUser", { id: req.params.id });
                if (result.ESTADO === undefined) {
                    res.json({ error: result.Data });
                    return;
                }
                res.json({ ESTADO: result.ESTADO, DESCRIPCION: result.DESCRIPCION });
            }
            catch (error) {
                console.error("Error deleting user:", error);
                res.status(500).json({ message: "Error deleting user", error: "Internal server error" });
            }
        });
    }
}
const userController = new UserController();
exports.default = userController;
