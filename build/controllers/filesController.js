"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const fs = __importStar(require("fs"));
const model_1 = require("./../models/model");
const databaseHelper_1 = __importDefault(require("../databaseHelper"));
class FilesController {
    getPantallaTransferenciaDatoById(transferenciaInfoId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield databaseHelper_1.default.executeSpSelect("GetTransInmediataDatoById", [transferenciaInfoId]);
        });
    }
    getPantallaTransferenciaInfoById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield databaseHelper_1.default.executeSpSelect("GetTransInmediataInfoById", [id]);
        });
    }
    LoopAndParseInfo(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            return [
                entity.tipoDeRegistro,
                entity.bloqueCBU1,
                entity.bloqueCBU2,
                this.arreglarDecimales(entity.importe),
                entity.refUnivoca,
                entity.beneficiarioDoc,
                entity.beneficiarioApeNombre,
                entity.filler,
                entity.marca,
                entity.transInmediataInfoId,
            ];
        });
    }
    ParseHeader(info, concepto) {
        return __awaiter(this, void 0, void 0, function* () {
            const values = [
                info.tipoDeRegistro,
                info.empresaNombre,
                info.infoDiscrecional,
                info.empresaCUIT.toString(),
                info.prestacion,
                info.fechaEmision.toString(),
                info.horaGeneracion.toString() + "00",
                info.fechaAcreditacion.toString(),
                info.bloqueDosCbuEmpresa,
                info.moneda,
                info.rotuloArchivo,
                info.tipoRemuneracion,
                this.arreglarDecimales(info.importeTotalFinal),
                concepto,
            ];
            const outParams = ["lastId"];
            return { values, outParams };
        });
    }
    escribirArchivoTR(rows, info, concepto, motivo, id) {
        const file = fs.openSync(`./uploads/output_${id}.txt`, "w");
        for (const value of rows) {
            const CBU = value.bloqueCBU1.toString() + value.bloqueCBU2.toString();
            let IMPORTE = value.importe.toString();
            IMPORTE = this.padStringFromLeft(IMPORTE, 12 - IMPORTE.length, "0");
            let CONCEPTO = this.padStringFromRight(concepto, 50 - concepto.length, " ");
            let REFERENCIA = this.padStringFromRight(" ", 12 - " ".length, " ");
            let EMAIL = this.padStringFromRight(" ", 50 - " ".length, " ");
            let RELLENO = this.padStringFromRight("", 124 - "".length, " ");
            fs.writeSync(file, `${CBU}${IMPORTE}${CONCEPTO}${motivo}${REFERENCIA}${EMAIL}${RELLENO}\n`);
        }
        let CANT_REGISTROS = (info.cantidadRegistroFinal + 1).toString();
        CANT_REGISTROS = this.padStringFromLeft(CANT_REGISTROS, 5 - CANT_REGISTROS.length, "0");
        let IMPORTE_TOTAL = info.importeTotalFinal.toString();
        IMPORTE_TOTAL = this.padStringFromLeft(IMPORTE_TOTAL, 17 - IMPORTE_TOTAL.length, "0");
        let RELLENO = this.padStringFromRight("", 251 - "".length, " ");
        fs.writeSync(file, `${CANT_REGISTROS}${IMPORTE_TOTAL}${RELLENO}\n`);
        fs.closeSync(file);
        return true;
    }
    parsearInfoArchivoTR(infoRowC, infoRowF) {
        const info = new model_1.transInmediataInfo();
        try {
            info.tipoDeRegistro = Number(infoRowC.substring(0, 1).trim());
            if (Number.isNaN(info.tipoDeRegistro)) {
                throw new Error("Error en el tipo de registro");
            }
            info.empresaNombre = infoRowC.substring(1, 17);
            info.infoDiscrecional = infoRowC.substring(17, 37);
            info.empresaCUIT = Number(infoRowC.substring(37, 48).trim());
            info.prestacion = infoRowC.substring(48, 58);
            info.fechaEmision = Number(infoRowC.substring(58, 64).trim());
            info.horaGeneracion = Number(infoRowC.substring(64, 68).trim());
            info.fechaAcreditacion = Number(infoRowC.substring(68, 74).trim());
            info.bloqueDosCbuEmpresa = Number(infoRowC.substring(74, 88).trim());
            info.moneda = Number(infoRowC.substring(88, 89).trim());
            info.rotuloArchivo = infoRowC.substring(89, 97);
            info.tipoRemuneracion = Number(infoRowC.substring(97, 98).trim());
            info.filler = infoRowC.substring(98, 99);
            info.marca = Number(infoRowC.substring(99, 100).trim());
            info.tipoRegistroFinal = Number(infoRowF.substring(0, 1).trim());
            info.cantidadRegistroFinal = Number(infoRowF.substring(1, 7).trim());
            info.importeTotalFinal = Number(infoRowF.substring(7, 18).trim());
            info.fillerFinal = infoRowF.substring(18, 99);
            info.marcaFinal = Number(infoRowF.substring(99, 100).trim());
        }
        catch (error) {
            throw error;
        }
        return info;
    }
    parsearDatosArchivoTR(rows, transfeInfoId) {
        const datosRows = rows.slice(1, rows.length - 2);
        const transInmediataDatos = new Array();
        for (const row of datosRows) {
            const datoTran = new model_1.transInmediataDato();
            datoTran.transInmediataInfoId = transfeInfoId;
            datoTran.tipoDeRegistro = Number(row.substring(0, 1).trim());
            datoTran.bloqueCBU1 = row.substring(1, 9).trim();
            datoTran.bloqueCBU2 = row.substring(9, 23).trim();
            datoTran.importe = Number(row.substring(23, 33).trim());
            datoTran.refUnivoca = row.substring(33, 48);
            datoTran.beneficiarioDoc = row.substring(48, 59).trim();
            datoTran.beneficiarioApeNombre = row.substring(59, 81).trim();
            datoTran.filler = row.substring(81, 99).trim();
            datoTran.marca = Number(row.substring(99, 100).trim());
            transInmediataDatos.push(datoTran);
        }
        return transInmediataDatos;
    }
    arreglarDecimales(importe) {
        const valorImporte = Math.floor(importe) / 100;
        return valorImporte.toFixed(2);
    }
    padStringFromLeft(str, length, padChar = " ") {
        return padChar.repeat(length) + str;
    }
    padStringFromRight(str, length, padChar = " ") {
        return str + padChar.repeat(length);
    }
    uploadTR(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var upload = yield databaseHelper_1.default.TempUploadProcess();
                upload(req, res, () => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    try {
                        const content = fs.readFileSync(req.file.path, "utf-8");
                        const rows = content.split("\n");
                        const info = this.parsearInfoArchivoTR(rows[0], rows[rows.length - 2]);
                        const dataFromUI = (_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname.split("-");
                        const [user, motivo, concepto] = dataFromUI;
                        const { values, outParams } = yield this.ParseHeader(info, concepto);
                        const id = yield databaseHelper_1.default.executeSpInsert("InsertTransInmediataInfo", values, outParams);
                        const transInmediataDatos = this.parsearDatosArchivoTR(rows, id);
                        for (const entity of transInmediataDatos) {
                            const values = yield this.LoopAndParseInfo(entity);
                            yield databaseHelper_1.default.executeSpInsert("InsertTransInmediataDato", values, ["lastId"]);
                        }
                        this.escribirArchivoTR(transInmediataDatos, info, concepto, motivo, id);
                        res.json({ id: id });
                    }
                    catch (error) {
                        console.error("Error processing file:", error);
                        res.status(500).json({ message: "Error processing file", error: "Internal server error" });
                    }
                }));
            }
            catch (error) {
                console.error("Error in upload:", error);
                res.status(500).json({ message: "Error in upload", error: "Internal server error" });
            }
        });
    }
}
const fileController = new FilesController();
exports.default = fileController;
