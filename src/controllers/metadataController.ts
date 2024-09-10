import { Request, Response } from "express";
import DatabaseHelper from "../databaseHelper";
import { TipoModulo, TipoMetada, TipoData } from "../enums/enums";
import databaseHelper from "../databaseHelper";
import readXlsxFile from "read-excel-file/node";
import * as fs from "fs";

class MetadataController {

  public async postGenericSP(req: Request, res: Response): Promise<any> {
    try {

        const { sp_name, body } = req.body;

        const values: Record<string, string | number> = {};
        Object.keys(body).forEach(key => {
            values[key] = body[key];
        });

        const rows = await DatabaseHelper.executeSpJsonReturn(sp_name, values);

        return res.json(rows[0]);

    } catch (error: any) {
        console.error("Error en el procedimiento:", error.message || error);
        return res.status(500).json({
            estado: 0,
            descripcion: 'Error interno del servidor.',
            data: null,
        });
    }
}

  public async getMetadataUI(req: Request, res: Response): Promise<any> {

    const { tipomodulo, tipometada, contrato } = req.params;

    let params: (string | number)[] = [];
  
    try {
      // Configuración de los parámetros en función de la entrada
      if (contrato !== 'NONE') {
        params.push(Number(contrato));
      }
  
      // Obtiene el nombre del stored procedure basado en los parámetros recibidos
      const spName = databaseHelper.getSpNameForMetada(tipomodulo as TipoModulo, tipometada as TipoMetada);
  
      // Llama al stored procedure usando los parámetros configurados
      const rows = await DatabaseHelper.executeSpSelect(spName, params);
  
      // Devuelve la primera fila obtenida del procedimiento almacenado
      res.json(rows[0]);

    } catch (error) {
      console.error("Error:", error);
      // Manejo de errores: devuelve una respuesta con estructura estándar
      res.status(500).json({ 
        estado: 0, 
        descripcion: "Error interno del servidor.", 
        data: null 
      });
    }
  }

  public async postValidarInsertar(req: Request, res: Response): Promise<void> {
    
    var upload = await DatabaseHelper.TempUploadProcess()
  
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

            const items = data.split("\n").map(line => line.trim()).filter(line => line.length > 0);

            jsonResult.ITEMS = items;

            const spName = `${TIPO_MODULO}_VALIDAR_INSERTAR_ENTRADA_2`;

            const result = await DatabaseHelper.executeJsonInsert( spName, jsonResult);
      
            res.json(result[0][0][0]);       
  
          });
        } else 
        {
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

        const result = await DatabaseHelper.executeJsonInsert( spName, jsonResult);
  
        res.json(result[0][0][0]); 

      }
    
      } catch (error) {
        console.error("Error durante la operación:", error);
        res.json({ message: "Internal server error", error: error.message });
      } 

    });
  }

  public async postValidarInsertarPagos(req: Request, res: Response): Promise<void> {  
        const spName = `PAGO_VALIDAR_INSERTAR_ENTRADA`;
        const result = await DatabaseHelper.executeJsonInsert( spName, req.body);
        res.json(result[0][0][0]); 
  }

  public async postValidarInsertarNomina(req: Request, res: Response): Promise<void> {  
    const spName = `NOMINA_VALIDAR_INSERTAR_ENTRADA_JSON`;

    const result = await DatabaseHelper.executeJsonInsert( spName, req.body);
    res.json(result[0][0][0]); 
}


  public async getUIResumen(req: Request, res: Response): Promise<any> {
    const { tipomodulo, id } = req.params;

    try {

      const params = [id];

      const rows = await DatabaseHelper.executeSpSelect(databaseHelper.getSpNameForData(tipomodulo as TipoModulo, TipoData.LIST), params);

       res.json(rows[0]);
      
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Error fetching resumen:", error: "Internal server error" });
    }
  }

  public async getUIFill(req: Request, res: Response): Promise<void> {

    const { tipomodulo, id } = req.params;

    try {
      const params = { id };
      const [row] = await DatabaseHelper.executeSpJsonReturn(databaseHelper.getSpNameForData(tipomodulo as TipoModulo, TipoData.FILL),params);

        res.json([row]);
        return
      
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Error fetching fill data:", error: "Internal server error" });
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
  }

};

  
const metadataController = new MetadataController();
export default metadataController;


