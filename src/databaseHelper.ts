import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import keys from './keys';
import { TipoData, TipoMetada, TipoModulo } from './enums/enums';
import multer from 'multer';

class DatabaseHelper {
  
  private static instance: DatabaseHelper;
  private pool: Pool;

  private constructor() {
    // Configuración del pool de conexiones usando createPool
    this.pool = createPool(keys.database as any);
  }

  public static getInstance(): DatabaseHelper {
    if (!DatabaseHelper.instance) {
      DatabaseHelper.instance = new DatabaseHelper();
    }
    return DatabaseHelper.instance;
  }

  public async getConnection(): Promise<PoolConnection> {
    try {
      const connection = await this.pool.getConnection();
      return connection;
    } catch (err) {
      console.error("Error obtaining database connection:", err.message || err);
      throw err;
    }
  }

  public async executeSpInsert(
    spName: string,
    values: (string | number)[],
    outParams: string[]
  ): Promise<any> {
    let connection: PoolConnection | undefined;
    try {
      connection = await this.getConnection();
      const placeholders = values.map(() => "?").join(",");
      const sql = `CALL ${spName}(${placeholders});`;
      const [queryResult] = await connection.execute(sql, values);
      return this.extractOutParams(queryResult, outParams);
    } catch (error: any) {
      console.error("Error executing stored procedure (Insert):", error.message || error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }


  public async executeSpSelect(
  spName: string,
  values: (string | number)[],
  outParams: string[] | undefined | null = []
): Promise<any> {
  let connection: PoolConnection | undefined;
  try {
    connection = await this.getConnection();
    const placeholders = values.map(() => "?").join(",");
    const sql = `CALL ${spName}(${placeholders});`;

    // Ejecuta el procedimiento almacenado y obtiene los resultados
    const [results]: any = await connection.execute(sql, values);

    // Verifica que los resultados no estén vacíos y que tengan la estructura esperada
    if (results && results.length > 0 && Array.isArray(results[0])) {
      // Retorna siempre el primer set de resultados
      return results[0];
    } else {
      // Maneja casos donde no haya datos retornados correctamente
      throw new Error("El stored procedure no devolvió datos válidos.");
    }
  } catch (error: any) {
    console.error("Error executing stored procedure (Select):", error.message || error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

public async executeJsonInsert(
  spName: string,
  jsonData: object,
  outParams: string[] | undefined | null = []
): Promise<any> {
  let connection: PoolConnection | undefined;
  try {
    connection = await this.getConnection();
    const sql = `CALL ${spName}(?);`;

    const values = [JSON.stringify(jsonData)];
    const [queryResult] = await connection.execute(sql, values);

    return [queryResult];

  } catch (error: any) {
    console.error("Error executing JSON insert:", error.message || error);
    return {
      success: false,
      message: error.message || "An error occurred during the execution of the stored procedure.",
    };
  } finally {
    if (connection) connection.release();
  }
}

public async executeSpJsonReturn(

  spName: string,
  params: Record<string, string | number> | (string | number)[],
  outParams: string[] | undefined | null = []
): Promise<any> {
  let connection: PoolConnection | undefined;
  try {
    connection = await this.getConnection();

    const values = Array.isArray(params) ? params : Object.values(params);

    const placeholders = values.map(() => "?").join(",");

    const sql = `CALL ${spName}(${placeholders});`;

    const [results]: any = await connection.execute(sql, values);

    return results[0];
  } catch (error: any) {
    console.error("Error executing stored procedure (JSON Return):", error.message || error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

  public formatDateFromFile(fechaPagoRaw) {
    // fechaPagoRaw tiene el formato YYYYMMDD
    const year = fechaPagoRaw.substring(0, 4);
    const month = fechaPagoRaw.substring(4, 6);
    const day = fechaPagoRaw.substring(6, 8);
    return `${year}-${month}-${day}`; // Formato YYYY-MM-DD
  }
  
  private getfileType(tipoModulo: TipoModulo) 
  {
    if (tipoModulo == TipoModulo.PAGO || tipoModulo == TipoModulo.CUENTA)
      return ".xlsx";
    else if (tipoModulo == TipoModulo.NOMINA || tipoModulo == TipoModulo.TRANSFERENCIAS)
      return ".txt"; 
    else if (tipoModulo == TipoModulo.NOMINA_XSL)
      return ".xlsx"; 
  }

  private extractOutParams(queryResult: any, outParams: string[]): any {
    const output: Record<string, any> = {};
    queryResult.forEach((resultSet: any) => {
      if (Array.isArray(resultSet)) {
        resultSet.forEach((row: any) => {
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

  private formatItems(data: any): string {
    if (data.ITEMS && Array.isArray(data.ITEMS)) {
      data.ITEMS = data.ITEMS.join('\n');
    }
    return JSON.stringify(data, null, 2);
  }

  public async TempUploadProcess() {

    const randomNumber = Math.floor(100000 + Math.random() * 900000);

    var store = multer.diskStorage({
      destination: function (_req, _file, cb) {
        cb(null, "./uploads");
      },
      filename: (req, file, cb) => {
        let tipoModulo = file.originalname.split("-")[0];
        cb(null, tipoModulo + "-" + randomNumber + "-" + this.getfileType(tipoModulo as TipoModulo));
      },
    });
    
    var upload = multer({ storage: store }).single("file");
    return upload

  }

  public getSpNameForData(tipoModulo: TipoModulo, tipoData: TipoData) {
    switch (true) {
      case tipoModulo === TipoModulo.PAGO && tipoData === TipoData.LIST:
        return 'PAGO_OBTENER_RESUMEN_BY_ID';
      case tipoModulo === TipoModulo.PAGO && tipoData === TipoData.EXPORT:
        return 'PAGO_OBTENER_ARCHIVO_BY_ID';
      case tipoModulo === TipoModulo.CUENTA && tipoData === TipoData.LIST:
        return 'CUENTA_OBTENER_RESUMEN_BY_ID';
      case tipoModulo === TipoModulo.CUENTA && tipoData === TipoData.EXPORT:
        return 'CUENTA_OBTENER_ARCHIVO_BY_ID';
      case tipoModulo === TipoModulo.NOMINA && tipoData === TipoData.LIST:
        return 'NOMINA_OBTENER_RESUMEN_BY_ID';
      default:
        return '';
    }
  }
  
    public  getSpNameForMetada(tipoModulo: TipoModulo, tipometada: TipoMetada)  {
      switch (true) {
        case tipoModulo === TipoModulo.PAGO && tipometada === TipoMetada.LIST:
          return 'PAGO_METADATA_UI_RESUMEN';
        case tipoModulo === TipoModulo.PAGO && tipometada === TipoMetada.IMPORT:
          return 'PAGO_METADATA_UI_IMPORT';
        case tipoModulo === TipoModulo.CUENTA && tipometada === TipoMetada.LIST:
          return 'CUENTA_METADATA_UI_RESUMEN';
        case tipoModulo === TipoModulo.CUENTA && tipometada === TipoMetada.IMPORT:
          return 'CUENTA_METADATA_UI_IMPORT';
        case tipoModulo === TipoModulo.NOMINA && tipometada === TipoMetada.LIST:
          return 'NOMINA_METADATA_UI_RESUMEN';
        case tipoModulo === TipoModulo.NOMINA && tipometada === TipoMetada.IMPORT:
          return 'NOMINA_METADATA_UI_IMPORT';
        case tipoModulo === TipoModulo.NOMINA && tipometada === TipoMetada.FILL:
          return 'NOMINA_METADATA_UI_FILL';
        default:
          return '';
      }
    }
}


export default DatabaseHelper.getInstance();
