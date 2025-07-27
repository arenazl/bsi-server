import { Request, Response } from "express";
import DatabaseHelper from "../DB/databaseHelper";
import { TipoModulo, TipoMetada, TipoData } from "../utils/enums";
import databaseHelper from "../DB/databaseHelper";
import readXlsxFile from "read-excel-file/node";
import ResponseHelper from "../utils/responseHelper";
import * as fs from "fs"

class GenericController {


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

const genericController = new GenericController();
export default genericController;
