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
   * Detecta inteligentemente el tipo de archivo basado en el nombre y estructura
   */
  detectFileType(fileName: string): { detectedType: string | null; suggestions: string[] } {
    const dataFromUI = fileName.split("-");
    const declaredType = dataFromUI[0];
    // Filtrar partes que contienen extensión y contar campos reales
    const realFields = dataFromUI.slice(1).filter(part => !part.includes('.'));
    const fieldCount = realFields.length;
    
    console.log("🔍 DETECTING FILE TYPE:");
    console.log("📄 File Name:", fileName);
    console.log("🏷️ Declared Type:", declaredType);
    console.log("📊 Field Count:", fieldCount);
    
    // Analizar cada tipo posible
    const possibilities: Array<{ type: string; match: boolean; reason: string }> = [];
    
    Object.entries(this.mappings).forEach(([type, config]) => {
      const expectedFields = config.fields.length;
      const matches = fieldCount === expectedFields;
      
      possibilities.push({
        type,
        match: matches,
        reason: matches 
          ? `✅ Coincide: ${fieldCount} campos` 
          : `❌ Esperado: ${expectedFields} campos, Recibido: ${fieldCount}`
      });
      
      console.log(`📋 ${type}: ${matches ? '✅' : '❌'} (esperado: ${expectedFields}, recibido: ${fieldCount})`);
    });
    
    // Encontrar coincidencias exactas
    const exactMatches = possibilities.filter(p => p.match);
    
    if (exactMatches.length === 1) {
      const detectedType = exactMatches[0].type;
      console.log(`🎯 DETECTED TYPE: ${detectedType}`);
      return { detectedType, suggestions: [] };
    }
    
    if (exactMatches.length > 1) {
      console.log(`⚠️ MULTIPLE MATCHES: ${exactMatches.map(m => m.type).join(', ')}`);
      return { 
        detectedType: null, 
        suggestions: exactMatches.map(m => m.type) 
      };
    }
    
    // No hay coincidencias exactas, sugerir los más cercanos
    console.log("❌ NO EXACT MATCHES");
    const suggestions = Object.keys(this.mappings);
    return { detectedType: null, suggestions };
  }

  /**
   * Construye los campos base desde el nombre del archivo
   */
  buildBaseFields(tipoModulo: string, dataFromUI: string[]): Record<string, any> {
    const config = this.mappings[tipoModulo];
    const fields: Record<string, any> = {};
    
    console.log("🔧 buildBaseFields DEBUGGING:");
    console.log("📋 Config fields expected:", config.fields);
    console.log("📊 DataFromUI received:", dataFromUI);
    console.log("📏 DataFromUI length:", dataFromUI.length);
    console.log("📏 Fields expected:", config.fields.length);
    
    config.fields.forEach((field: string, index: number) => {
      let value = dataFromUI[index + 1];
      
      console.log(`🔍 Processing field[${index}]: ${field} = "${value}"`);
      
      if (value && field === "CONCEPTO") {
        value = value.replace(".", "-");
      }
      
      if (value && field === "FECHAPAGO") {
        value = DatabaseHelper.formatDateFromFile(value);
      }
      
      fields[field] = value;
    });
    
    // Validar que todos los campos requeridos estén presentes
    const missingFields = config.fields.filter((field, index) => {
      const value = dataFromUI[index + 1];
      return !value || value.trim() === '' || value.includes('.');
    });
    
    if (missingFields.length > 0) {
      console.log("❌ ERRORES en buildBaseFields - Usando detector inteligente...");
      
      // Usar detector inteligente para sugerir el tipo correcto
      // Reconstruir nombre sin duplicar extensión
      const fileNameWithoutExt = dataFromUI.filter(part => !part.includes('.')).join('-');
      const fileName = fileNameWithoutExt + '.xlsx';
      const { detectedType, suggestions } = this.detectFileType(fileName);
      
      let errorMessage = `El archivo no coincide con el formato esperado para ${tipoModulo}.\n\n`;
      
      if (detectedType && detectedType !== tipoModulo) {
        errorMessage += `🎯 Este archivo parece ser de tipo "${detectedType}"\n\n`;
        errorMessage += `💡 SOLUCIÓN:\n`;
        errorMessage += `   • Usa la funcionalidad correcta para ${detectedType}, o\n`;
        errorMessage += `   • Renombra el archivo con formato: ${tipoModulo}-IDUSER-IDORG-IDCONT-CONCEPTO-FECHAPAGO.xlsx`;
      } else {
        errorMessage += `📋 Formato requerido:\n`;
        errorMessage += `   ${tipoModulo}-${config.fields.join('-')}.xlsx\n\n`;
        errorMessage += `💡 SOLUCIÓN:\n`;
        errorMessage += `   • Verifica que el nombre incluya todos los campos requeridos\n`;
        errorMessage += `   • Separa cada campo con guiones (-)`;
      }
      
      throw new Error(errorMessage);
    }
    
    console.log("✅ Todos los campos procesados correctamente");
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
    console.log("🔍 DEBUGGING FileProcessor.processFile:");
    console.log("📁 File Path:", filePath);
    console.log("📄 File Name:", fileName);
    
    const { tipoModulo, dataFromUI } = this.parseFileName(fileName);
    console.log("🏷️ Tipo Modulo:", tipoModulo);
    console.log("📋 Data from UI:", dataFromUI);
    
    const fields = this.buildBaseFields(tipoModulo, dataFromUI);
    console.log("🔧 Fields generados:", JSON.stringify(fields, null, 2));
    
    let items: any[] = [];
    
    // Determinar tipo de archivo y procesar
    if (fileName.endsWith('.txt')) {
      items = await this.processTxtFile(filePath);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      items = await this.processExcelFile(filePath, tipoModulo);
    } else {
      throw new Error(`Tipo de archivo no soportado: ${fileName}. Solo se permiten archivos .txt, .xlsx o .xls`);
    }
    
    console.log("📊 Items procesados:", items.length);
    console.log("🔍 Primeros 3 items:", JSON.stringify(items.slice(0, 3), null, 2));
    
    const result = {
      tipoModulo,
      fields,
      items
    };
    
    console.log("✅ FileData final:", JSON.stringify({
      tipoModulo: result.tipoModulo,
      fieldsCount: Object.keys(result.fields).length,
      itemsCount: result.items.length
    }, null, 2));
    
    return result;
  }

}

export default new FileProcessorService();

