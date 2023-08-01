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
class LoteController {
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const id_barrio = req.body.id_barrio;
            const estado = req.body.estado;
            console.log(id_barrio);
            console.log(estado);
            let lotes;
            let query = '';
            if (estado == 0 || estado == 1) {
                query = 'select * from lotes where id_barrio = ' + id_barrio + ' and estado =  ' + estado;
            }
            else {
                query = 'select * from Lotes where id_barrio = 2';
            }
            if (query !== '') {
                console.log(query);
                lotes = yield database_1.default.query(query);
            }
            res.json(lotes);
        });
    }
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const oldLote = req.body;
            /*
            estado: 1,
            id: '3',
            id_barrio: 2,
            obervaciones: 'look'*/
            let sql = 'UPDATE lotes set estado = ' + req.body.estado + ' WHERE id_barrio = ' + req.body.id_barrio + ' and id = ' + req.body.id;
            console.log(sql);
            yield database_1.default.query(sql);
            res.json({ message: "The lote was Updated" });
        });
    }
    provincias(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let provincias;
            let query = '';
            query = 'SELECT * from PROVINCIAS';
            if (query !== '') {
                console.log(query);
                provincias = yield database_1.default.query(query);
            }
            res.json(provincias);
        });
    }
    localidades(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            let localidades;
            let query = '';
            query = 'SELECT * from LOCALIDADES where id_provincia = ' + id;
            if (query !== '') {
                console.log(query);
                localidades = yield database_1.default.query(query);
            }
            res.json(localidades);
        });
    }
}
const loteController = new LoteController;
exports.default = loteController;
