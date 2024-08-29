import { Request, Response } from "express";
import pool from "../database";
import multer from "multer";
import fileType from "file-type";
import readXlsxFile from "read-excel-file/node";
import path from "path";
import * as fs from "fs";
import * as mysql from "mysql2/promise";
import keys from "./../keys";
import S3 from "aws-sdk/clients/s3";

import { transInmediataInfo } from "./../models/model";
import { transInmediataDato } from "./../models/model";

import nodemailer from "nodemailer";
import { ImportExport } from "aws-sdk";
import legajoController from "./legajoController";
import { TipoData, TipoMetada, TipoModulo } from "../enums/enums";import { get } from "http";

class FilesController {
  

  public async getUsers(req: Request, res: Response): Promise<void> {
    let connection;
    try {
      connection = await pool.getConnection();
      const result = await executeSpSelect(connection, "GetAllUsers", []);
      
      res.json(result);
     
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users", error: "Internal server error" });
    } finally {
      if (connection) connection.release();
    }
  }

  public async createUser(req: Request, res: Response): Promise<void> {

    const userData = req.body;
    
    let connection;
    try {
      connection = await pool.getConnection();
      const result = await executeJsonInsert(connection, "InsertUser", userData, ["ID", "ESTADO", "DESCRIPCION"]);
      if (!result.ID) {
        res.json({ error: result.Data });
        return;
      }
      res.json({ ID: result.ID, ESTADO: result.ESTADO, DESCRIPCION: result.DESCRIPCION });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error creating user", error: "Internal server error" });
    } finally {
      if (connection) connection.release();
    }
  }

  public async updateUser(req: Request, res: Response): Promise<void> {
    const userData = req.body;
    let connection;
    try {
      connection = await pool.getConnection();
      const result = await executeJsonInsert(connection, "UpdateUser", userData, ["ESTADO", "DESCRIPCION"]);
      if (result.ESTADO === undefined) {
        res.json({ error: result.Data });
        return;
      }
      res.json({ ESTADO: result.ESTADO, DESCRIPCION: result.DESCRIPCION });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Error updating user", error: "Internal server error" });
    } finally {
      if (connection) connection.release();
    }
  }

  public async deleteUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    let connection;
    try {
      connection = await pool.getConnection();
      const result = await executeSpJsonReturn(connection, "DeleteUser", { id });
      if (result.ESTADO === undefined) {
        res.json({ error: result.Data });
        return;
      }
      res.json({ ESTADO: result.ESTADO, DESCRIPCION: result.DESCRIPCION });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user", error: "Internal server error" });
    } finally {
      if (connection) connection.release();
    }
  }

  public async uploadTR(req: Request, res: Response): Promise<void> {
    try {

      var upload = await TempUploadProcess();


      upload(req, res, async () => {
        let info = null;
        let rows: string[];

        try {
          const content: string = fs.readFileSync(req.file.path, "utf-8");
          rows = content.split("\n");

          //console.log(rows);

          info = parsearInfoArchivoTR(rows[0], rows[rows.length - 2]);
        } catch (error) {
          console.error("error parseo: " + error);
          res.status(500).json({
            message: "An error occurred while updating the data.",
            error: error.message,
          });
          return;
        }

        const dataFromUI = req.file?.originalname.split("-");

        const user = dataFromUI[0];
        const concepto = dataFromUI[2];
        const motivo = dataFromUI[1];

        try {
          let connection = await pool.getConnection();

          var { values, outParams } = await ParseHeader(info, concepto);

          const id = await InsertTransInmediataInfo(connection, values, outParams);

          let transInmediataDatos = parsearDatosArchivoTR(rows, id);

          let contador = 0;

          for (let entity of transInmediataDatos) {
            const values = await LoopAndParseInfo(entity);

            const outParams = ["lastId"];

            const outParamValues = await InsertTransInmediataDato(
              connection,
              values,
              outParams
            );
          }

          escribirArchivoTR(transInmediataDatos, info, concepto, motivo, id);

          res.json({ id: id });
        } catch (error) {
          console.error("error DB:" + error);
        }

      });

    } catch (error) {
      console.error("error in upload:" + error);
    }

  }

  public async getResponseTR(req, res) {
    try {
      console.log("enter response....");
      const { id } = req.params;

      // Fetch the infoScreen data
      const infoScreen = await getPantallaTransferenciaInfoById(id);
      if (!infoScreen || infoScreen.length === 0) {
        return res.status(404).json({ error: "Info screen not found" });
      }

      // Fetch the dataScreen data
      const dataScreen = await getPantallaTransferenciaDatoById(id);
      if (!dataScreen || dataScreen.length === 0) {
        return res.status(404).json({ error: "Data screen not found" });
      }

      // Send the response
      //@ts-ignore
      res.json({ head: infoScreen[0], data: dataScreen });
    } catch (error) {
      console.error("Error fetching response:", error);
      res.status(500).json({
        message: "Error fetching getResponseTR:",
        error: "Internal server error",
      });
    }
  }

  public async postValidateInsert(req: Request, res: Response): Promise<void> {

    var upload = await TempUploadProcess();

    upload(req, res, async () => {
      let connection;
      try {

        connection = await pool.getConnection();
  
        // Dividir el nombre del archivo en partes
        const dataFromUI = req.file?.originalname.split("-");
        console.log(req.file?.originalname.split("-"));

        // Asumimos que el primer campo determina el tipo de módulo
        const TIPO_MODULO = dataFromUI[0];
  
        // Construcción del objeto JSON sin TIPO_MODULO
        const jsonResult: any = {
          ITEMS: [],// Aquí se agregarán los registros del Excel más adelante
          fileContent: undefined
        };

        // Obtener la configuración según el tipo de módulo
        const config = mappings[TIPO_MODULO];
  
        if (config) {
          // Iterar sobre los campos y asignar los valores desde dataFromUI
          config.fields.forEach((field, index) => {
            let value = dataFromUI[index + 1]; // Ajustamos el índice porque dataFromUI[0] es TIPO_MODULO
  
            // Realizar reemplazo específico si es necesario
            if (field === 'CONCEPTO') {
              value = value.replace(".", "-");
            }
  
            // Si el campo es FECHAPAGO, formatear la fecha
            if (field === 'FECHAPAGO') {
              value = formatDateFromFile(value);
            }
  
            // Asignar el valor al campo correspondiente en el objeto JSON
            jsonResult[field] = value;     
          });


          if (TIPO_MODULO === 'NOMINA') {

            // Leer el contenido del archivo TXT

            fs.readFile(req.file.path, "utf8", async function (err, data) {


              // Primero, debemos reemplazar las secuencias escapadas \\r\\n con \r\n

              let jsonString = data.replace(/\\r/g, ' ').replace(/\\n/g, ' ').replace(/\\t/g, ' ');
              jsonResult.fileContent = jsonString;;
           
              console.log(jsonResult);

              const spName = `${TIPO_MODULO}_VALIDAR_INSERTAR_ENTRADA`;
  
              // Parámetros de salida
              const outParamValues = ["ID", "ESTADO", "DESCRIPCION"];

              // Ejecutar el stored procedure con el objeto JSON resultante
              const result = await executeJsonInsert(connection, spName, jsonResult, outParamValues);

              if (!result.success) 
                {
                  res.json({ error: result.Data  });
                  return;
              }
    
              const ID = result["ID"];
              const ESTADO = result["ESTADO"];
              const DESCRIPCION = result["DESCRIPCION"];
      
              res.json({ ID, ESTADO, DESCRIPCION });

            });

          } else 
          {  

            // Procesar el archivo Excel y agregar los items al jsonResult 
            const rows = await readXlsxFile(req.file.path);
            const dataFromRows = rows.slice(config.startRow);
    
            for (let row of dataFromRows) {
              if ((TIPO_MODULO === 'PAGO' && !row[3]) || (TIPO_MODULO === 'CUENTA' && !row[4])) {
                break;
              }
    
              if (TIPO_MODULO === 'PAGO') {
                const [CBU, CUIL, NOMBRE, IMPORTE] = row.slice(3);
                jsonResult.ITEMS.push({ CBU, CUIL, NOMBRE, IMPORTE });
              } else if (TIPO_MODULO === 'CUENTA') {
                const [CUIL, Tipo_Doc, Nro_Doc, Apellidos, Nombres, Fecha_Nacimiento, Sexo] = row;
                jsonResult.ITEMS.push({ CUIL, Tipo_Doc, Nro_Doc, Apellidos, Nombres, Fecha_Nacimiento, Sexo });
              }
            }

            const spName = `${TIPO_MODULO}_VALIDAR_INSERTAR_ENTRADA`;

            // Parámetros de salida
            const outParamValues = ["ID", "ESTADO", "DESCRIPCION"];
  
            // Ejecutar el stored procedure con el objeto JSON resultante
            const result = await executeJsonInsert(connection, spName, jsonResult, outParamValues);

            if (!result.ID) 
              {
                res.json({ error: result.Data  });
                return;
            }
  
            const ID = result["ID"];
            const ESTADO = result["ESTADO"];
            const DESCRIPCION = result["DESCRIPCION"];
    
            res.json({ ID, ESTADO, DESCRIPCION });

          }   

      }

      } catch (error) {
        console.error("Error durante la operación:", error);
        res.json({  message: "Internal server error", error: error.message  });
      } finally {
        if (connection) connection.release();
      }
    });
  }
  
  public async getResumen(req: Request, res: Response): Promise<any> {

    let { tipomodulo } = req.params;
    let { id } = req.params;

    let connection;

    try {

      connection = await pool.getConnection();

      const params = { id };

      const row = await executeSpJsonReturn(connection, getSpNameForData(tipomodulo as TipoModulo, TipoData.LIST) , params);

      if (row.metadata_json == !undefined) 
      {
        res.json({ error: row.Data  });          
      }
      else
      {
        res.json({result: row[0].resultado_json});
      }

    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ message: "Error fetching:", error: "Internal server error" });
    } finally 
    {
      if (connection) connection.release();
    }

  }

  public async getFill(req: Request, res: Response): Promise<any> {

    let { tipomodulo } = req.params;
    let { id } = req.params;

    let connection;

    try {
      connection = await pool.getConnection();

      const params = { id };

      const row = await executeSpJsonReturn(connection, getSpNameForData(tipomodulo as TipoModulo, TipoData.FILL) , params);

      if (row.metadata_json == !undefined) 
        {
          res.json({ error: row.Data  });
          return;
      }
      else
      {
        res.json({result: row[0].resultado_json});
      }

    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ message: "Error fetching:", error: "Internal server error" });
    } finally {
      if (connection) connection.release();
    }

  }

  public async getMetadataUI(req: Request, res: Response): Promise<void> {

    const { tipomodulo } = req.params;
    const { tipometada } = req.params;
    const { contrato } = req.params;
    let params;

    console.log("tipomodulo: " + tipomodulo);
    console.log("tipometada: " + tipometada);
    console.log("contrato: " + contrato);


    let connection;

    try {

      connection = await pool.getConnection();

      if (contrato === 'NONE') { params = { }; } else  { params = { contrato }; }

      const row = await executeSpJsonReturn(connection, getSpNameForMetada(tipomodulo as TipoModulo, tipometada as TipoMetada), params);

      if (row[0].metadata_json == undefined) 
        {
          res.json({ error: row.Data });
          return;
      }

      console.log(['HOLAAAAAAAAAAAAAAAAAAAAAAA']);
      console.log(row[0]);

      res.json({data: row[0]});
      return

    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ message: "Error fetching:", error: "Internal server error" });
    } finally {
      if (connection) connection.release();
    }
  }

  public async getContratosBotones(req: Request, res: Response): Promise<void> {

    const id_user = req.body.user;
    const id_organismo = req.body.contrato;

    const values = [id_user, id_organismo];

    let connection;

    try {
      connection = await pool.getConnection();

      const row = await executeSpSelect(connection, "ObtenerContratos", values);

      res.json(row);
    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ message: "Error fetching:", error: "Internal server error" });
    } finally {
      if (connection) connection.release();
    }
  }

  public async getContratoById(req: Request, res: Response): Promise<void> {

    const id_user = req.body.id_user;
    const id_organismo = req.body.id_organismo;
    const id_contrato = req.body.id_contrato;

    const values = [id_user, id_organismo, id_contrato];

    let connection;

    try {
      connection = await pool.getConnection();

      const row = await executeSpSelect(connection, "ObtenerContratoById", values);

      res.json(row);
    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ message: "Error fetching:", error: "Internal server error" });
    } finally {
      if (connection) connection.release();
    }
  }

  public async downloadOutputFile(req: Request, res: Response): Promise<void> {

    const { tipomodulo } = req.params;
    const { id } = req.params;

    const values = [id];

    let connection;
    try {
      connection = await pool.getConnection();

      const row = await executeSpSelect(connection, getSpNameForData(tipomodulo as TipoModulo, TipoData.EXPORT), values)
  
      const file = fs.openSync(`./uploads/${tipomodulo}_${id}.txt`, "w");

      console.log("row");
      console.log(row);

      
      let line = row[0][1];

      fs.writeSync(file, line + "\n");

      fs.closeSync(file);

      const filePath = `./uploads/${tipomodulo as TipoModulo}_${id}.txt`;

      res.download(filePath, function (err) { });

    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({
        message: "Error fetching:",
        error: "Internal server error",
      });
    } finally {
      if (connection) connection.release();
    }
  }

  public async downloadFile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // Assuming the file is identified by an 'id'

      const filePath = "./uploads/output_" + id + ".txt";

      res.download(filePath, function (err) {
        if (err) {
          console.error(err);
          if (res.headersSent) {
          } else {
            //res.status(err)
          }
        } else {
          // The file was sent successfully
        }
      });
    } catch (error) {
      console.error("An error occurred:", error);
      res.status(500).send("Internal Server Error");
    }
  }

  public async getListForCombo(req, res): Promise<void> {

    let { tipomodulo } = req.params;

    let values = [tipomodulo];

    let connection;
    try {

      connection = await pool.getConnection();

      const result = await executeSpSelect(
        connection,
        "GET_LIST_FOR_COMBO",
        values
      );

      res.json(result);
    } catch (error) {
      console.error("Error fetching getListForCombo:", error);
      res.status(500).json({
        message: "Error fetching getListForCombo:",
        error: "Internal server error",
      });
    } finally {
      if (connection) connection.release();
    }
  }

  public async getResponsePagosForCombo(req, res): Promise<void> {
    console.error("getResponsePagosForCombo");

    let connection;
    try {
      connection = await pool.getConnection();
      const values = null;

      const result = await executeSpSelect(
        connection,
        "getPagosListForSelect",
        values
      );

      res.json(result);
    } catch (error) {
      console.error("Error fetching getResponsePagosForCombo:", error);
      res.status(500).json({
        message: "Error fetching getResponsePagosForCombo:",
        error: "Internal server error",
      });
    } finally {
      if (connection) connection.release();
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await pool.query("DELETE  FROM games WHERE id = ?", [id]);
    res.json({ message: "The game was deleted" });
  }

  public async list(req: Request, res: Response): Promise<any> {
    var serverFiles = [];
    const dir = path.join(__dirname, "../../uploads");
    const files = fs.readdirSync(dir);

    for (const file of files) {
      serverFiles.push(file);
    }
    return res.json(serverFiles);
  }

  public async uploadS3(file: any) {
    let bucketName = keys.AWS.bucketName;
    let region = keys.AWS.bucketRegion;
    let accessKeyId = keys.AWS.accesKey;
    let secretAccessKey = keys.AWS.secretKey;

    const s3 = new S3({
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
  }

  public async dropbox(req: Request, res: Response, next: any): Promise<void> {
    let multer1 = multer({ dest: "./uploads" });

    let upload = multer1.single("file");

    upload(req, res, function (err) {
      if (err) {
        return res.status(501).json({ error: err });
      } else {
        return res.json({
          originalname: req.file?.originalname,
          uploadname: req.file?.filename,
        });
      }
    });
  }

  public async download(req: Request, res: Response, next: any): Promise<void> {
    let bucketName = keys.AWS.bucketName;
    let region = keys.AWS.bucketRegion;
    let accessKeyId = keys.AWS.accesKey;
    let secretAccessKey = keys.AWS.secretKey;

    const s3 = new S3({
      region,
      accessKeyId,
      secretAccessKey,
    });

    console.log(s3);

    const downloadParams = {
      Bucket: bucketName,
      Key: req.body.filename,
    };

    console.log(downloadParams);

    try {
      const data = await s3.getObject(downloadParams).createReadStream();
      data.pipe(res);
    } catch (err) {
      throw err;
    }
  }

  public async sendMail(req: Request, res: Response, next: any): Promise<void> {
    let bucketName = keys.AWS.bucketName;

    try {
      console.log("Sending Email");

      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "arenazl@gmail.com;Proyectos.don.luisk41@gmail.com",
          pass: "vxmgkblhzauuapqh",
        },
      });

      var mailOptions = {
        from: "arenazl@gmail.com",
        to: "arenazl@gmail.com",
        subject:
          "Nueva venta a nombre de: " +
          req.body.denominacion +
          " ingreso al sistema!",
        html:
          "<h5>Se vendio el Lote " +
          req.body.id_lote +
          "!! </h5> <h5> Comprador: " +
          req.body.denominacion +
          "</h5> <h5>Dni: " +
          req.body.dni +
          " </h5>  <h5>Precio de venta " +
          req.body.lote_total +
          " </h5>  <h5>Seña: " +
          req.body.refuerzo_total +
          '</h5> <p>Ingrese al sistema para verificar los datos</p> <p><a href="https://sisbarrios.herokuapp.com"> Ingrese a SIS-Barrios </a></p>',
      };

      transporter.sendMail(mailOptions, function (error: any, info: any) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    } catch (ex) {
      console.log(ex);
    }
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

function formatDateFromFile(fechaPagoRaw) {
  // fechaPagoRaw tiene el formato YYYYMMDD
  const year = fechaPagoRaw.substring(0, 4);
  const month = fechaPagoRaw.substring(4, 6);
  const day = fechaPagoRaw.substring(6, 8);
  return `${year}-${month}-${day}`; // Formato YYYY-MM-DD
}


async function executeJsonInsert(
  connection: mysql.PoolConnection,
  spName: string,
  jsonData: object,
  outParams: string[]
) : Promise<any> {
  try {
    console.log("Executing Stored Procedure:", spName);

    const sql = `CALL ${spName}(?);`;
    const values = [JSON.stringify(jsonData)];

    console.log("SQL Command:");
    console.log(sql);
    console.log("Input Values:");
    console.log(values);

    const [queryResult] = await connection.execute(sql, values);

  if( queryResult[0][0].Result > 0) 
    { 
      return queryResult[0][0];
    }  

    const outParamValues = extractOutParams(queryResult, outParams);

    return outParamValues;
  } catch (error: any) {
    console.error("Error executing stored procedure:", error.message || error);
    return {
      success: false,
      message: error.message || "An error occurred during the execution of the stored procedure."
    };
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

    return results;

  } catch (error: any) {
    console.error(error);
  } finally {
    if (connection) connection.release();
  }
}


async function executeSpJsonReturn(

  connection: mysql.PoolConnection,
  spName: string,
  params: Record<string, string | number> | (string | number)[]
): Promise<any> {
  try {
    console.log("executeSpSelect");

    let values: (string | number)[];

    if (Array.isArray(params)) {
      values = params;
    } else {
      values = Object.values(params);
    }

    let placeholders = values.map(() => "?").join(",");

    let sql = `CALL ${spName}(${placeholders});`;

    const statement = await connection.prepare(sql);

    const [results]: any = await statement.execute(values);

    if( results[0][0].Result > 0) 
      { 
        return results[0][0];
      }  
  
    return results[0];

  } catch (error: any) {
    console.error(error);
    throw error;
  } 
}

async function executeJsonSelect(
  connection: mysql.PoolConnection,
  spName: string,
  jsonData: object,
  outParams: string[]
): Promise<any[]> {
  try {

    const sql = `CALL ${spName}(?);`;
    const values = [JSON.stringify(jsonData)];

    console.log("sql");
    console.log(sql);
    console.log("values");
    console.log(values);

    const statement = await connection.prepare(sql);

    const [results]: any = await statement.execute(values);

    if( results[0][0].Result > 0) 
      { 
        return results[0][0];
      }  

    console.log('results full');
    console.log(results);

    statement.close();

    await connection.unprepare(sql);

    return results[0];

  } catch (error: any) {
    console.error(error);
  } finally {
    if (connection) {
      connection.release();
    }

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

async function InsertTransInmediataDato(
  connection: mysql.PoolConnection,
  values: (string | number)[],
  outParams: string[]
) {
  return await executeSpInsert(
    connection,
    "InsertTransInmediataDato",
    values,
    outParams
  );
}


function getSpNameForMetada(tipoModulo: TipoModulo, tipometada: TipoMetada) {

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
      return 'NOMINA_METADATA_UI_IMPORT';

    case tipoModulo === TipoModulo.NOMINA && tipometada === TipoMetada.IMPORT:
      return 'NOMINA_METADATA_UI_IMPORT';

    case tipoModulo === TipoModulo.NOMINA && tipometada === TipoMetada.FILL:
      return 'NOMINA_METADATA_UI_FILL';

    default:
      return '';
  }
}

function getSpNameForData(tipoModulo: TipoModulo, tipoData: TipoData) {

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

    case tipoModulo === TipoModulo.NOMINA && tipoData === TipoData.FILL:
        return 'NOMINA_OBTENER_FILL_BY_ID';

    default:
      return '';
  }
}

async function TempUploadProcess() {

  const randomNumber = Math.floor(100000 + Math.random() * 900000);

  var store = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./uploads");
    },
    filename: function (req, file, cb) {

      let tipoModulo = file.originalname.split("-")[0];

      getFileType(tipoModulo as TipoModulo).then((fileType) => {
        cb(null, tipoModulo + "-" + randomNumber + fileType);
      });

    },
  });

  var upload = multer({ storage: store }).single("file");
  return upload;
}

async function getFileType(tipoModulo: TipoModulo) {

  switch (tipoModulo) {
    case TipoModulo.PAGO:
      return ".xlsx";
    case TipoModulo.CUENTA:
      return ".xlsx";
      case TipoModulo.NOMINA:
        return ".txt";
      case TipoModulo.TRANSFERENCIAS:
         return ".txt";
    default:
      return ".xlsx";
  }

}


async function LoopAndParseInfo(entity: transInmediataDato) {
  return [
    entity.tipoDeRegistro,
    entity.bloqueCBU1,
    entity.bloqueCBU2,
    arreglarDecimales(entity.importe),
    entity.refUnivoca,
    entity.beneficiarioDoc,
    entity.beneficiarioApeNombre,
    entity.filler,
    entity.marca,
    entity.transInmediataInfoId,
  ];
}

async function InsertTransInmediataInfo(
  connection: mysql.PoolConnection,
  values: any[],
  outParams: string[]
) {
  const outParamValues = await executeSpInsert(
    connection,
    "InsertTransInmediataInfo",
    values,
    outParams
  );

  const id = outParamValues["lastId"];
  return id;
}

async function ParseHeader(info: any, concepto: string) {
  //LLAMAMOS AL SP DE DETALLE
  console.log("Llamamos al sp");

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
    arreglarDecimales(info.importeTotalFinal),
    concepto,
  ];

  const outParams = ["lastId"];
  return { values, outParams };
}

function escribirArchivoTR(
  rows: Array<transInmediataDato>,
  info: transInmediataInfo,
  concepto: string,
  motivo: string,
  id: number
): boolean {
  const file = fs.openSync("./uploads/output_" + id + ".txt", "w");

  // console.log(transInmediataDatos);

  for (const value of rows) {
    //CBU
    let CBU;
    CBU = value.bloqueCBU1.toString() + value.bloqueCBU2.toString();

    //IMPORTE
    let IMPORTE = value.importe.toString();
    IMPORTE = padStringFromLeft(IMPORTE, 12 - IMPORTE.length, "0");

    //CONCEPTO
    let CONCEPTO = concepto;
    CONCEPTO = padStringFromRight(concepto, 50 - concepto.length, " ");

    //REFERENCIA
    let REFERENCIA = " ";
    REFERENCIA = padStringFromRight(REFERENCIA, 12 - REFERENCIA.length, " ");

    //EMAIL
    let EMAIL = " ";
    EMAIL = padStringFromRight(EMAIL, 50 - EMAIL.length, " ");

    //RELLENO
    let RELLENO = "";
    RELLENO = padStringFromRight(RELLENO, 124 - RELLENO.length, " ");

    fs.writeSync(
      file,
      CBU + IMPORTE + CONCEPTO + motivo + REFERENCIA + EMAIL + RELLENO + "\n"
    );
  }

  //DATOS FINALES

  //CANT REGISTROS FINALES
  let CANT_REGISTROS = (info.cantidadRegistroFinal + 1).toString();
  CANT_REGISTROS = padStringFromLeft(
    CANT_REGISTROS,
    5 - CANT_REGISTROS.length,
    "0"
  );

  console.log("Cant Reegistros: " + info.cantidadRegistroFinal);
  console.log("Escribe: " + CANT_REGISTROS);

  //IMPORTE TOTAL
  let IMPORTE_TOTAL = info.importeTotalFinal.toString();
  IMPORTE_TOTAL = padStringFromLeft(
    IMPORTE_TOTAL,
    17 - IMPORTE_TOTAL.length,
    "0"
  );

  //RELLENO
  let RELLENO = "";
  RELLENO = padStringFromRight(RELLENO, 251 - RELLENO.length, " ");

  fs.writeSync(file, CANT_REGISTROS + IMPORTE_TOTAL + RELLENO + "\n");

  fs.closeSync(file);

  return true;
}

function parsearInfoArchivoTR(
  infoRowC: string,
  infoRowF: string
): transInmediataInfo {
  let info = new transInmediataInfo();

  try {
    //CABECERA
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

    //PARTE FINAL
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

function parsearDatosArchivoTR(
  rows: string[],
  transfeInfoId: number
): Array<transInmediataDato> {
  console.log("transfeInfoId: " + transfeInfoId);

  let datosRows = rows.slice(1, rows.length - 2);
  let transInmediataDatos = new Array<transInmediataDato>();

  for (const row of datosRows) {
    let datoTran = new transInmediataDato();

    // Parse fields according to fixed width format
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

    //console.log(datoTran);
  }

  return transInmediataDatos;
}

function arreglarDecimales(importe: number) {
  let valorImporte = Math.floor(importe) / 100;
  return valorImporte.toFixed(2);
}

function padStringFromLeft(str: string, length: number, padChar = " ") {
  let paddedStr = padChar.repeat(length);
  return paddedStr + str;
}

function padStringFromRight(str: string, length: number, padChar = " ") {
  let paddedStr = padChar.repeat(length);
  return str + paddedStr;
}

async function getPantallaTransferenciaDatoById(transferenciaInfoId: number) {
  let connection;
  try {
    connection = await pool.getConnection();

    const values = [transferenciaInfoId];
    const result = await executeSpSelect(
      connection,
      "GetTransInmediataDatoById",
      values
    );

    return result;
  } catch (error) {
    console.error("Error fetching Pantalla Transferencia Dato:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

async function getPantallaTransferenciaInfoById(id: number) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query("CALL GetTransInmediataInfoById(?)", [
      id,
    ]);
    return rows;
  } catch (error) {
    console.error("Error fetching Pantalla Transferencia Info:", error);
    throw error;
  } finally {
    if (connection) connection.release();
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