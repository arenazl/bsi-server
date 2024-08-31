import { Request, Response } from "express";
import multer from "multer";
import readXlsxFile from "read-excel-file/node";
import path from "path";
import * as fs from "fs";
import S3 from "aws-sdk/clients/s3";
import keys from "./../keys";
import nodemailer from "nodemailer";
import { getFileType, TipoData, TipoMetada, TipoModulo } from "../enums/enums";
import DatabaseHelper from "../databaseHelper";
import { transInmediataInfo, transInmediataDato } from "./../models/model";
import databaseHelper from "../databaseHelper";

class FilesController 
{
  
  public async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const result = await DatabaseHelper.executeSpSelect("GetAllUsers", []);
      res.json(result[0]);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users", error: "Internal server error" });
    }
  }

  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      const result = await DatabaseHelper.executeJsonInsert("InsertUser", req.body, ["ID", "ESTADO", "DESCRIPCION"]);
      if (!result.ID) {
        res.json({ error: result.Data });
        return;
      }
      res.json({ ID: result.ID, ESTADO: result.ESTADO, DESCRIPCION: result.DESCRIPCION });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error creating user", error: "Internal server error" });
    }
  }

  public async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const result = await DatabaseHelper.executeJsonInsert("UpdateUser", req.body, ["ESTADO", "DESCRIPCION"]);
      if (result.ESTADO === undefined) {
        res.json({ error: result.Data });
        return;
      }
      res.json({ ESTADO: result.ESTADO, DESCRIPCION: result.DESCRIPCION });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Error updating user", error: "Internal server error" });
    }
  }

  public async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const result = await DatabaseHelper.executeSpJsonReturn("DeleteUser", { id: req.params.id });
      if (result.ESTADO === undefined) {
        res.json({ error: result.Data });
        return;
      }
      res.json({ ESTADO: result.ESTADO, DESCRIPCION: result.DESCRIPCION });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user", error: "Internal server error" });
    }
  }

  /*
  public async uploadTR(req: Request, res: Response): Promise<void> {
    try {
      const upload = this.TempUploadProcess(); 
      upload(req, res, async () => {
        try {
          
          const content: string = fs.readFileSync(req.file.path, "utf-8");
          const rows = content.split("\n");
          const info = this.parsearInfoArchivoTR(rows[0], rows[rows.length - 2]);
          const dataFromUI = req.file?.originalname.split("-");
          const [user, motivo, concepto] = dataFromUI;

          const { values, outParams } = await this.ParseHeader(info, concepto);
          const id = await DatabaseHelper.executeSpInsert("InsertTransInmediataInfo", values, outParams);

          const transInmediataDatos = this.parsearDatosArchivoTR(rows, id);

          for (const entity of transInmediataDatos) {
            const values = await this.LoopAndParseInfo(entity);
            await DatabaseHelper.executeSpInsert("InsertTransInmediataDato", values, ["lastId"]);
          }

          this.escribirArchivoTR(transInmediataDatos, info, concepto, motivo, id);

          res.json({ id: id });
        } catch (error) {
          console.error("Error processing file:", error);
          res.status(500).json({ message: "Error processing file", error: "Internal server error" });
        }
      });
    } catch (error) {
      console.error("Error in upload:", error);
      res.status(500).json({ message: "Error in upload", error: "Internal server error" });
    }
  }*/

  public async getResponseTR(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const infoScreen = await this.getPantallaTransferenciaInfoById(parseInt(id));
      if (!infoScreen || infoScreen.length === 0) {
        return res.status(404).json({ error: "Info screen not found" });
      }
      const dataScreen = await this.getPantallaTransferenciaDatoById(parseInt(id));
      if (!dataScreen || dataScreen.length === 0) {
        return res.status(404).json({ error: "Data screen not found" });
      }
      res.json({ head: infoScreen[0], data: dataScreen });
    } catch (error) {
      console.error("Error fetching response:", error);
      res.status(500).json({ message: "Error fetching getResponseTR:", error: "Internal server error" });
    }
  }

  public async postValidateInsert(req: Request, res: Response): Promise<void> {
    
    var upload = await databaseHelper.TempUploadProcess()
  
    upload(req, res, async () => {
  
      try {
        
        const dataFromUI = req.file?.originalname.split("-");
        const TIPO_MODULO = dataFromUI[0];
        const config = mappings[TIPO_MODULO];
        const jsonResult: any = { ITEMS: [] };
  
        if (config) {

          config.fields.forEach((field, index) => {
            let value = dataFromUI[index + 1];
            if (field === "CONCEPTO") value = value.replace(".", "-");
            if (field === "FECHAPAGO") value = DatabaseHelper.formatDateFromFile(value);
            jsonResult[field] = value;
          });

        } 
        if (TIPO_MODULO === "NOMINA") 
          {

          fs.readFile(req.file!.path, "utf8", async (err, data) => {
            if (err) {
              console.error("Error leyendo el archivo de texto:", err);
              res.json({ error: "Error leyendo el archivo de texto" });
              return;
            }

            jsonResult.ITEMS = data.split(/\r?\n/); 
 
          });
        } else {
          // Procesamiento de archivo Excel para PAGO y CUENTA
          const rows = await readXlsxFile(req.file!.path);
          const dataFromRows = rows.slice(config.startRow);


        dataFromRows.forEach((row) => {

        if ((TIPO_MODULO === "PAGO" && !row[3]) || (TIPO_MODULO === "CUENTA" && !row[4])) return;

        if (TIPO_MODULO === "PAGO") 
          {
          const [CBU, CUIL, NOMBRE, IMPORTE] = row.slice(3);
          jsonResult.ITEMS.push({ CBU, CUIL, NOMBRE, IMPORTE });
        } 
        else if (TIPO_MODULO === "CUENTA") 
          {
          const [CUIL, Tipo_Doc, Nro_Doc, Apellidos, Nombres, Fecha_Nacimiento, Sexo] = row;
          jsonResult.ITEMS.push({ CUIL, Tipo_Doc, Nro_Doc, Apellidos, Nombres, Fecha_Nacimiento, Sexo });
        }

      });

      const spName = `${TIPO_MODULO}_VALIDAR_INSERTAR_ENTRADA`;
      const outParamValues = ["ID", "ESTADO", "DESCRIPCION"];

      const result = await databaseHelper.executeJsonInsert( spName, jsonResult, outParamValues);

      if (!result.ID) {
        res.json({ error: result.Data });
        return;
      }

      const ID = result["ID"];
      const ESTADO = result["ESTADO"];
      const DESCRIPCION = result["DESCRIPCION"];
      res.json({ ID, ESTADO, DESCRIPCION });


        }
      } catch (error) {
        console.error("Error durante la operación:", error);
        res.json({ message: "Internal server error", error: error.message });
      } finally {

      }
    });
  }


  private async getPantallaTransferenciaDatoById(transferenciaInfoId: number): Promise<any> {
    return await DatabaseHelper.executeSpSelect("GetTransInmediataDatoById", [transferenciaInfoId]);
  }

  private async getPantallaTransferenciaInfoById(id: number): Promise<any> {
    return await DatabaseHelper.executeSpSelect("GetTransInmediataInfoById", [id]);
  }

  private async LoopAndParseInfo(entity: transInmediataDato): Promise<(string | number)[]> {
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
  }

  private async ParseHeader(info: any, concepto: string): Promise<{ values: any[]; outParams: string[] }> {
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
  }

  private escribirArchivoTR(
    rows: Array<transInmediataDato>,
    info: transInmediataInfo,
    concepto: string,
    motivo: string,
    id: number
  ): boolean {
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

  private parsearInfoArchivoTR(infoRowC: string, infoRowF: string): transInmediataInfo {
    const info = new transInmediataInfo();
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
    } catch (error) {
      throw error;
    }
    return info;
  }

  private parsearDatosArchivoTR(rows: string[], transfeInfoId: number): Array<transInmediataDato> {
    const datosRows = rows.slice(1, rows.length - 2);
    const transInmediataDatos = new Array<transInmediataDato>();
    for (const row of datosRows) {
      const datoTran = new transInmediataDato();
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

  private arreglarDecimales(importe: number): string {
    const valorImporte = Math.floor(importe) / 100;
    return valorImporte.toFixed(2);
  }

  private padStringFromLeft(str: string, length: number, padChar = " "): string {
    return padChar.repeat(length) + str;
  }

  private padStringFromRight(str: string, length: number, padChar = " "): string {
    return str + padChar.repeat(length);
  }

}
 const fileController = new FilesController();
  export default fileController;


  export const mappings: Record<string, { startRow: number; fields: string[] }> = {
    PAGO: {
      startRow: 3,
      fields: ['IDUSER', 'IDORG', 'IDCONT', 'CONCEPTO', 'FECHAPAGO']
    },
    CUENTA: {
      startRow: 4,
      fields: ['IDUSER', 'IDORG', 'IDCONT', 'ROTULO', 'ENTE']
    },
    NOMINA: {
      startRow: 0,
      fields: ['id_user', 'Organismo_id', 'Contrato_id']
    }
  
  };

  

