import * as fs from 'fs';
import { promisify } from 'util';
import readXlsxFile from 'read-excel-file/node';
import DatabaseHelper from '../DB/databaseHelper';

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

export interface FileData {
  tipoModulo: string;
  fields: Record<string, any>;
  items: any[];
}


export class FileProcessorService {

    mappings: Record<string, { startRow: number; fields: string[] }> = {
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

  /**
   * Procesa el nombre del archivo y extrae la configuración inicial
   */
  parseFileName(fileName: string): { tipoModulo: string; dataFromUI: string[] } {
    const dataFromUI = fileName.split("-");
    const tipoModulo = dataFromUI[0];
    
    if (!this.mappings[tipoModulo]) {
      throw new Error(`Configuración no encontrada para tipo: ${tipoModulo}`);
    }
    
    return { tipoModulo, dataFromUI };
  }

  /**
   * Construye los campos base desde el nombre del archivo
   */
  buildBaseFields(tipoModulo: string, dataFromUI: string[]): Record<string, any> {
    const config = this.mappings[tipoModulo];
    const fields: Record<string, any> = {};
    
    config.fields.forEach((field: string, index: number) => {
      let value = dataFromUI[index + 1];
      
      if (value && field === "CONCEPTO") {
        value = value.replace(".", "-");
      }
      
      if (value && field === "FECHAPAGO") {
        value = DatabaseHelper.formatDateFromFile(value);
      }
      
      fields[field] = value;
    });
    
    return fields;
  }

  /**
   * Procesa archivo TXT y extrae items
   */
  async processTxtFile(filePath: string): Promise<string[]> {
    const data = await readFile(filePath, 'utf8');
    
    return data.split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  /**
   * Procesa archivo Excel y extrae items según el tipo
   */
  async processExcelFile(filePath: string, tipoModulo: string): Promise<any[]> {
    const config = this.mappings[tipoModulo];
    const rows = await readXlsxFile(filePath);
    const dataRows = rows.slice(config.startRow || 0);
    
    return dataRows
      .filter(row => {
        // CUENTA valida columna 4, los demás columna 3
        return tipoModulo === 'CUENTA' ? row[4] : row[3];
      })
      .map(row => this.extractItemFromRow(row, tipoModulo));
  }

  /**
   * Extrae item de una fila según el tipo de módulo
   */
  private extractItemFromRow(row: any[], tipoModulo: string): any {
    // CUENTA tiene estructura diferente
    if (tipoModulo === 'CUENTA') {
      const [CUIL, Tipo_Doc, Nro_Doc, Apellidos, Nombres, Fecha_Nacimiento, Sexo] = row;
      return { CUIL, Tipo_Doc, Nro_Doc, Apellidos, Nombres, Fecha_Nacimiento, Sexo };
    }
    
    // NOMINA y PAGO comparten estructura base
    const baseItem = {
      CBU: row[3],
      CUIL: row[4],
      NOMBRE: row[5]
    };
    
    // Si es PAGO, incluir IMPORTE
    if (tipoModulo === 'PAGO') {
      return { ...baseItem, IMPORTE: row[6] };
    }
    
    return baseItem;
  }

  /**
   * Limpia archivo temporal de forma segura
   */
  async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
      console.log("Archivo temporal eliminado:", filePath);
    } catch (error) {
      console.error("Error eliminando archivo temporal:", error);
    }
  }

  /**
   * Procesa archivo completo según su tipo
   */
  async processFile(filePath: string, fileName: string): Promise<FileData> {
    const { tipoModulo, dataFromUI } = this.parseFileName(fileName);
    const fields = this.buildBaseFields(tipoModulo, dataFromUI);
    let items: any[] = [];
    
    // Determinar tipo de archivo y procesar
    if (fileName.endsWith('.txt')) {
      items = await this.processTxtFile(filePath);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      items = await this.processExcelFile(filePath, tipoModulo);
    } else {
      throw new Error('Tipo de archivo no soportado');
    }
    
    return {
      tipoModulo,
      fields,
      items
    };
  }

}

export default new FileProcessorService();

