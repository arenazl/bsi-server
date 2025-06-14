import { Request, Response } from "express";
import DatabaseHelper from "../databaseHelper";
import { TipoModulo, TipoMetada, TipoData } from "../enums/enums";
import databaseHelper from "../databaseHelper";
import readXlsxFile from "read-excel-file/node";
import ResponseHelper from "../utils/responseHelper";
import * as fs from "fs"

class MetadataController {


  public async postSelectGenericSP(req: Request, res: Response): Promise<any> {
    try {
      const { sp_name, body, jsonUnify = false, } = req.body;

      if (!sp_name || !body) {
        throw new Error('Faltan parámetros requeridos: sp_name y body son obligatorios');
      }

      let values: Record<string, string | number> = {};

      if (jsonUnify) {
        values = { p_json: JSON.stringify(body) };
      } else {
        Object.entries(body).forEach(([key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') {
            values[key] = value;
          } else {
            values[key] = JSON.stringify(value);
          }
        });
      }

      const rows = await DatabaseHelper.executeSpJsonReturn(sp_name, values);
      ResponseHelper.sendDatabaseResponse(res, rows);
      
    } catch (error: any) {
      console.error("Error durante postSelectGenericSP:", error);
      ResponseHelper.throwMethodError(error);
    }
  }

  public async postInsertGenericSP(req: Request, res: Response): Promise<any> {
    try {
      const { sp_name, body } = req.body;

      if (!sp_name || !body) {
        throw new Error('Faltan parámetros requeridos : sp_name y body son obligatorios');
      }

      const rows = await DatabaseHelper.executeJsonInsert(sp_name, body);
      ResponseHelper.sendDatabaseResponse(res, rows);
    } catch (error: any) {
      console.error("Error durante postInsertGenericSP:", error);
      ResponseHelper.throwMethodError(error);
    }
  }

  public async getMetadataUI(req: Request, res: Response): Promise<any> {
    try {
      const { tipomodulo, tipometada, contrato } = req.params;

      let params: (string | number)[] = [];

      if (contrato !== 'NONE') {
        params.push(Number(contrato));
      }

      const spName = databaseHelper.getSpNameForMetada(tipomodulo as TipoModulo, tipometada as TipoMetada);

      if (!spName) {
        throw new Error(`No se encontró stored procedure para tipomodulo: ${tipomodulo}, tipometada: ${tipometada}`);
      }

      const rows = await DatabaseHelper.executeSpSelect(spName, params);
      ResponseHelper.sendDatabaseResponse(res, rows);
    } catch (error: any) {
      console.error("Error durante getMetadataUI:", error);
      ResponseHelper.throwMethodError(error);
    }
  }

  public async postValidarInsertar(req: Request, res: Response): Promise<void> {

    var upload = await DatabaseHelper.TempUploadProcess()

    upload(req, res, async () => {

      try {

        const dataFromUI = req.file?.originalname.split("-");
        const TIPO_MODULO = dataFromUI[0];
        const config = mappings[TIPO_MODULO];
        let jsonResult: any = { ITEMS: [] };

        if (config) {

          config.fields.forEach((field, index) => {
            let value = dataFromUI[index + 1];
            if (field === "CONCEPTO") value = value.replace(".", "-");
            if (field === "FECHAPAGO") value = DatabaseHelper.formatDateFromFile(value);
            jsonResult[field] = value;
          });
        }

        if (TIPO_MODULO === "NOMINA") {

          fs.readFile(req.file!.path, "utf8", async (err, data) => {

            if (err) {
              console.error("Error leyendo el archivo de texto:", err);
              throw new Error("Error leyendo el archivo de texto: " + err.message);
            }

            const items = data.split("\n").map(line => line.trim()).filter(line => line.length > 0);

            jsonResult.ITEMS = items;

            const spName = `${TIPO_MODULO}_VALIDAD_INSERTAR_FULL_VALIDATION`;

            const result = await DatabaseHelper.executeJsonInsert(spName, jsonResult);

            fs.unlink(req.file.path, (err) => {
              if (err) {
                console.error("Error al eliminar el archivo:", err);
              } else {
                console.log("Archivo eliminado correctamente.");
              }
            });

            ResponseHelper.sendDatabaseResponse(res, result);

          });

        }
        else //PAGO O CUENTAS
        {

          const rows = await readXlsxFile(req.file!.path);
          const dataFromRows = rows.slice(config.startRow);


          if (TIPO_MODULO === "PAGO") {

            dataFromRows.forEach((row) => {

              if (!row[3]) return;

              const [CBU, CUIL, NOMBRE] = row.slice(3);
              jsonResult.ITEMS.push({ CBU, CUIL, NOMBRE });

            });

            const spNameNomina = `NOMINA_VALIDAD_INSERTAR_FULL_VALIDATION`;

            const resultb = await DatabaseHelper.executeJsonInsert(spNameNomina, jsonResult);

            resultb[0][0][0].tipo_modulo = "NOMINA";

            console.log("NOMINA");
            console.log(resultb[0][0][0]);

            if(resultb[0][0][0].estado == 0)
            {
              ResponseHelper.sendDatabaseResponse(res, resultb);
              return;
            }  

          }
   
          jsonResult.ITEMS = [];

          dataFromRows.forEach((row) => {

            if ((TIPO_MODULO === "PAGO" && !row[3]) || (TIPO_MODULO === "CUENTA" && !row[4])) return;

            if (TIPO_MODULO === "PAGO") {
              const [CBU, CUIL, NOMBRE, IMPORTE] = row.slice(3);
              jsonResult.ITEMS.push({ CBU, CUIL, NOMBRE, IMPORTE });
            }

            else if (TIPO_MODULO === "CUENTA") {
              const [CUIL, Tipo_Doc, Nro_Doc, Apellidos, Nombres, Fecha_Nacimiento, Sexo] = row;
              jsonResult.ITEMS.push({ CUIL, Tipo_Doc, Nro_Doc, Apellidos, Nombres, Fecha_Nacimiento, Sexo });
            }

          });

          const spName = `${TIPO_MODULO}_VALIDAR_INSERTAR_ENTRADA`;
          const result = await DatabaseHelper.executeJsonInsert(spName, jsonResult);

          fs.unlink(req.file.path, (err) => {
            if (err) {
              console.error("Error al eliminar el archivo:", err);
            } else {
              console.log("Archivo eliminado correctamente.");
            }
          });

          console.log('Response Pagos');
          console.log(result[0][0][0]);

          ResponseHelper.sendDatabaseResponse(res, result);

        }

      } catch (error: any) {
        console.error("Error durante la operación:", error);
        ResponseHelper.throwMethodError(error);
      }

    });
  }


  public async postNominaDesdeImport(req: Request, res: Response): Promise<void> {

    var upload = await DatabaseHelper.TempUploadProcess()

    upload(req, res, async () => {

      try {

        const dataFromUI = req.file?.originalname.split("-");

        const TIPO_MODULO = TipoModulo.NOMINA_XSL;
        const config = mappings[TIPO_MODULO];

        const jsonResult: any = { ITEMS: [] };

        config.fields.forEach((field, index) => {
          let value = dataFromUI[index + 1];
          jsonResult[field] = value;
        });

        const rows = await readXlsxFile(req.file!.path);
        const dataFromRows = rows.slice(config.startRow);

        dataFromRows.forEach((row) => {

          if (!row[3]) return;

          const [CBU, CUIL, NOMBRE] = row.slice(3);
          jsonResult.ITEMS.push({ CBU, CUIL, NOMBRE });

        });

        const spName = `NOMINA_VALIDAD_INSERTAR_FULL_VALIDATION`;

        const result = await DatabaseHelper.executeJsonInsert(spName, jsonResult);

        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error("Error al eliminar el archivo:", err);
          } else {
            console.log("Archivo eliminado correctamente.");
          }
        });

        ResponseHelper.sendDatabaseResponse(res, result);


      } catch (error: any) {
        console.error("Error durante la operación:", error);
        ResponseHelper.throwMethodError(error);
      }

    });
  }

  public async postValidarInsertarPagos(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body) {
        throw new Error('Body es requerido para validar insertar pagos');
      }

      const spName = `PAGO_VALIDAR_INSERTAR_ENTRADA`;
      const result = await DatabaseHelper.executeJsonInsert(spName, req.body);
      ResponseHelper.sendDatabaseResponse(res, result);
    } catch (error: any) {
      console.error("Error durante postValidarInsertarPagos:", error);
      ResponseHelper.throwMethodError(error);
    }
  }

  public async postValidarInsertarNomina(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body) {
        throw new Error('Body es requerido para validar insertar nómina');
      }

      const spName = `NOMINA_VALIDAR_INSERTAR_ENTRADA_JSON`;
      const result = await DatabaseHelper.executeJsonInsert(spName, req.body);
      ResponseHelper.sendDatabaseResponse(res, result);
    } catch (error: any) {
      console.error("Error durante postValidarInsertarNomina:", error);
      ResponseHelper.throwMethodError(error);
    }
  }

  public async getUIResumen(req: Request, res: Response): Promise<any> {
    try {
      const { tipomodulo, id } = req.params;

      if (!tipomodulo || !id) {
        throw new Error('Faltan parámetros requeridos: tipomodulo e id son obligatorios');
      }

      const params = [id];

      const spName = databaseHelper.getSpNameForData(tipomodulo as TipoModulo, TipoData.LIST);
      
      if (!spName) {
        throw new Error(`No se encontró stored procedure para tipomodulo: ${tipomodulo} con TipoData.LIST`);
      }

      const rows = await DatabaseHelper.executeSpSelect(spName, params);
      ResponseHelper.sendDatabaseResponse(res, rows);
    } catch (error: any) {
      console.error("Error durante getUIResumen:", error);
      ResponseHelper.throwMethodError(error);
    }
  }

}

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
    fields: ['IDUSER', 'IDORG', 'IDCONT']
  },
  NOMINA_XSL: {
    startRow: 3,
    fields: ['IDUSER', 'IDORG', 'IDCONT', 'CONCEPTO', 'FECHAPAGO']
  }
};

const metadataController = new MetadataController();
export default metadataController;
