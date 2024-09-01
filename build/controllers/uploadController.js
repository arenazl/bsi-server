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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.uploadController = void 0;
const enums_1 = require("../enums/enums");
const databaseHelper_1 = __importDefault(require("../databaseHelper"));
const multer_1 = __importDefault(require("multer"));
const keys_1 = __importDefault(require("../keys"));
const aws_sdk_1 = require("aws-sdk");
const databaseHelper_2 = __importDefault(require("../databaseHelper"));
const fs = __importStar(require("fs"));
class UploadController {
    postValidateInsert(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //const data = req.body;
            //console.log(data);
            const result = yield databaseHelper_1.default.TempUploadProcess();
            res.json(result);
        });
    }
    formatDateFromFile(fechaPagoRaw) {
        let dateTime = new Date(fechaPagoRaw);
        return new Date(dateTime.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    }
    downloadOutputFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tipomodulo } = req.params;
            const { id } = req.params;
            const values = [id];
            try {
                const row = yield databaseHelper_2.default.executeSpSelect(getSpNameForData(tipomodulo, enums_1.TipoData.EXPORT), values);
                const file = fs.openSync(`./uploads/${tipomodulo}_${id}.txt`, "w");
                console.log("row");
                console.log(row);
                let line = row[0][0].contenido;
                fs.writeSync(file, line + "\n");
                fs.closeSync(file);
                const filePath = `./uploads/${tipomodulo}_${id}.txt`;
                res.download(filePath, function (err) { });
            }
            catch (error) {
                console.error("Error:", error);
                res.status(500).json({
                    message: "Error fetching:",
                    error: "Internal server error",
                });
            }
            finally {
            }
        });
    }
    downloadFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params; // Assuming the file is identified by an 'id'
                const filePath = "./uploads/output_" + id + ".txt";
                res.download(filePath, function (err) {
                    if (err) {
                        console.error(err);
                        if (res.headersSent) {
                        }
                        else {
                            //res.status(err)
                        }
                    }
                    else {
                        // The file was sent successfully
                    }
                });
            }
            catch (error) {
                console.error("An error occurred:", error);
                res.status(500).send("Internal Server Error");
            }
        });
    }
    uploadS3(file) {
        return __awaiter(this, void 0, void 0, function* () {
            let bucketName = keys_1.default.AWS.bucketName;
            let region = keys_1.default.AWS.bucketRegion;
            let accessKeyId = keys_1.default.AWS.accesKey;
            let secretAccessKey = keys_1.default.AWS.secretKey;
            const s3 = new aws_sdk_1.S3({
                region,
                accessKeyId,
                secretAccessKey,
            });
            const fileStream = fs.createReadStream(file.path);
            const uploadParams = {
                Bucket: bucketName,
                Body: fileStream,
                Key: file.filename,
            };
            return s3.upload(uploadParams).promise();
        });
    }
    dropbox(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let multer1 = (0, multer_1.default)({ dest: "./uploads" });
            let upload = multer1.single("file");
            upload(req, res, function (err) {
                var _a, _b;
                if (err) {
                    return res.status(501).json({ error: err });
                }
                else {
                    return res.json({
                        originalname: (_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname,
                        uploadname: (_b = req.file) === null || _b === void 0 ? void 0 : _b.filename,
                    });
                }
            });
        });
    }
}
function getSpNameForData(tipoModulo, tipoData) {
    switch (true) {
        case tipoModulo === enums_1.TipoModulo.PAGO && tipoData === enums_1.TipoData.LIST:
            return 'PAGO_OBTENER_RESUMEN_BY_ID';
        case tipoModulo === enums_1.TipoModulo.PAGO && tipoData === enums_1.TipoData.EXPORT:
            return 'PAGO_OBTENER_ARCHIVO_BY_ID';
        case tipoModulo === enums_1.TipoModulo.CUENTA && tipoData === enums_1.TipoData.LIST:
            return 'CUENTA_OBTENER_RESUMEN_BY_ID';
        case tipoModulo === enums_1.TipoModulo.CUENTA && tipoData === enums_1.TipoData.EXPORT:
            return 'CUENTA_OBTENER_ARCHIVO_BY_ID';
        case tipoModulo === enums_1.TipoModulo.NOMINA && tipoData === enums_1.TipoData.LIST:
            return 'NOMINA_OBTENER_RESUMEN_BY_ID';
        case tipoModulo === enums_1.TipoModulo.NOMINA && tipoData === enums_1.TipoData.FILL:
            return 'NOMINA_OBTENER_FILL_BY_ID';
        default:
            return '';
    }
}
exports.uploadController = new UploadController();
exports.default = exports.uploadController;
