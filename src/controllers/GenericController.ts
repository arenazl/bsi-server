import { Request, Response } from "express";
import DatabaseHelper from "../DB/databaseHelper";
import { TipoModulo, TipoMetada, TipoData } from "../utils/enums";
import databaseHelper from "../DB/databaseHelper";
import readXlsxFile from "read-excel-file/node";
import ResponseHelper from "../utils/responseHelper";
import * as fs from "fs"

// Orden de parámetros por SP (¡clave!)
const ORDERS: Record<string, string[]> = {
  ORGANISMO_CREAR: [
    'Nombre','Nombre_Corto','CUIT',
    'Direccion_Calle','Direccion_Numero','Direccion_Localidad','Direccion_Codigo_Postal',
    'Sucursal_Bapro','Tipo_Organismo','Tipo_Estado'
  ],
  ORGANISMO_ACTUALIZAR: [
    'id_organismo',
    'Nombre','Nombre_Corto','CUIT',
    'Direccion_Calle','Direccion_Numero','Direccion_Localidad','Direccion_Codigo_Postal',
    'Sucursal_Bapro','Tipo_Organismo','Tipo_Estado'
  ],
  ORGANISMO_ELIMINAR: ['id_organismo']
};

// Normaliza ints y convierte '' -> null si te sirve
function normalizeParam(key: string, val: any) {
  if (val === '') return null;
  if (key === 'id_organismo' || key === 'Tipo_Organismo' || key === 'Tipo_Estado') {
    return val === null || val === undefined || val === '' ? null : Number(val);
  }
  return val;
}


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
        throw new Error('Faltan parámetros requeridos: sp_name y body son obligatorios');
      }

      // Convert body to an ordered array of values if order is specified
      let params: any[] | Record<string, any> = body;
      if (ORDERS[sp_name]) {
        const orderedValues: any[] = [];
        for (const key of ORDERS[sp_name]) {
          orderedValues.push(normalizeParam(key, body[key]));
        }
        params = orderedValues;
      }

      // Logs de depuración
      console.log('--- postInsertGenericSP ---');
      console.log('SP NAME:', sp_name);
      console.log('REQ.BODY:', req.body);
      console.log('PARAMS (array):', params);

      const rows = await DatabaseHelper.executeSpJsonReturn(sp_name, params);

      console.log('RESULTADO ROWS:', rows);
      console.log('--- fin postInsertGenericSP ---');

      ResponseHelper.sendDatabaseResponse(res, rows);
    } catch (error) {
      console.error('*** ERROR en postInsertGenericSP ***');
      console.error(error);
      ResponseHelper.sendError(res, error);
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
