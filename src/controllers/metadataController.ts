import { Request, Response } from "express";
import DatabaseHelper from "../databaseHelper";
import { TipoModulo, TipoMetada, TipoData } from "../enums/enums";

class MetadataController {


  public async getMetadataUI(req: Request, res: Response): Promise<any> {

    const { tipomodulo, tipometada, contrato } = req.params;

    let params: (string | number)[] = [];
  
    try {
      // Configuración de los parámetros en función de la entrada
      if (contrato !== 'NONE') {
        params.push(Number(contrato)); // Asegura que contrato sea tratado como un número
      }
  
      // Obtiene el nombre del stored procedure basado en los parámetros recibidos
      const spName = getSpNameForMetada(tipomodulo as TipoModulo, tipometada as TipoMetada);
  
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

  public async getResumen(req: Request, res: Response): Promise<any> {
    const { tipomodulo, id } = req.params;

    try {

      const params = [id];

      const rows = await DatabaseHelper.executeSpSelect(getSpNameForData(tipomodulo as TipoModulo, TipoData.LIST), params);

       res.json(rows[0]);
      
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Error fetching resumen:", error: "Internal server error" });
    }
  }

  public async getFill(req: Request, res: Response): Promise<void> {
    const { tipomodulo, id } = req.params;

    try {
      const params = { id };
      const [row] = await DatabaseHelper.executeSpJsonReturn(
        getSpNameForData(tipomodulo as TipoModulo, TipoData.FILL),
        params
      );

        res.json([row]);
        return
      
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Error fetching fill data:", error: "Internal server error" });
    }
    
}

}

function  getSpNameForMetada(tipoModulo: TipoModulo, tipometada: TipoMetada): string {
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

function  getSpNameForData(tipoModulo: TipoModulo, tipoData: TipoData): string {
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
  
const metadataController = new MetadataController();
export default metadataController;


