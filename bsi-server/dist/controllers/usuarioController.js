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
const database_1 = __importDefault(require("../database"));
class UsuarioController {
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(req.body);
            let nombre = req.body.nombre;
            let pass = req.body.password;
            let id_barrio = req.body.id_barrio;
            let q = 'SELECT u.id, u.nombre, g.descripcion grupo, id_grupo, id_barrio \
                FROM Usuario u \
                LEFT JOIN Grupo g on u.id_grupo = g.id \
                where u.nombre =' + "'" + nombre + "'";
            console.log(q);
            const usuario = yield database_1.default.query(q);
            console.log(usuario.length);
            if (usuario.length > 0) {
                return res.json(usuario[0]);
            }
        });
    }
}
const usuarioController = new UsuarioController;
exports.default = usuarioController;
