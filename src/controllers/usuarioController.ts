import { Request, Response } from 'express';
import pool from '../database';
import multer from 'multer';
import path from 'path';
import * as mysql from "mysql2/promise";

class UsuarioController {

    public async login(req: Request, res: Response): Promise<any> {

        console.log(req.body);

        let nombre = 'mv'; //req.body.nombre;
        let pass = 'password123'; //req.body.password;

        const values = [nombre, pass];

        const connection = await pool.getConnection();
        
        const rows = await executeSpSelect(connection, 'sp_login_user', values); 

        return res.json(rows[0]);

    }  

}

async function executeSpInsert(

    connection: mysql.PoolConnection,
    spName: string,
    values: (string | number)[],
    outParams: string[]
  ) {
    try {
      console.log("executeSpInsert");
  
      let placeholders = values.map(() => "?").join(",");
  
      let sql = `CALL ${spName}(${placeholders});`;
  
      console.log(placeholders);
      console.log("sql");
      console.log(sql);
      console.log("values");
      console.log(values);
  
      const [queryResult] = await connection.execute(sql, values);
  
      const outParamValues = extractOutParams(queryResult, outParams);
  
      return outParamValues;
  
    } catch (error: any) {
      console.error(error);
    } finally {
      if (connection) connection.release();
    }
  }
  
  async function executeJsonInsert(
    connection: mysql.PoolConnection,
    spName: string,
    jsonData: object,
    outParams: string[]
  ) {
    try {
      console.log("execute SJasonpInsert");
  
      const sql = `CALL ${spName}(?);`;
      const values = [JSON.stringify(jsonData)];
  
      console.log("sql");
      console.log(sql);
      console.log("values");
      console.log(values);
  
      const [queryResult] = await connection.execute(sql, values);
  
      const outParamValues = extractOutParams(queryResult, outParams);
  
      return outParamValues;
  
     } catch (error: any) {
      console.error(error);
    } finally {
      if (connection) connection.release();
    }
  }
  
  async function executeSpSelect(
    connection: mysql.PoolConnection,
    spName: string,
    values: (string | number)[]
  ): Promise<any[]> {
    try {

      console.log("executeSpSelect");
  
      let placeholders = "";
  
      if (values) {
        placeholders = values.map(() => "?").join(",");
      }
  
      let sql = `CALL ${spName}(${placeholders});`;
  
      const statement = await connection.prepare(sql);
  
      const [results]: any = await statement.execute(values);
  
      statement.close();
      await connection.unprepare(sql);
  
      return results[0];
    } catch (error: any) {
      console.error(error);
    } finally {
      if (connection) connection.release();
    }
  }
  
  function extractOutParams(queryResult, outParams) {
    const output = {};
    // Recorrer los resultados y extraer los parámetros de salida
    queryResult.forEach((resultSet) => {
      if (Array.isArray(resultSet)) {
        resultSet.forEach((row) => {
          outParams.forEach((param) => {
            if (row.hasOwnProperty(param)) {
              output[param] = row[param];
            }
          });
        });
      }
    });
    return output;
  }

const usuarioController = new UsuarioController;
export default usuarioController;