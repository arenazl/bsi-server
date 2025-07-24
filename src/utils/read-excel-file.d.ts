declare module 'read-excel-file/node' {
  export default function readXlsxFile(
    input: string | Buffer | ReadStream,
    options?: {
      sheet?: number | string;
      dateFormat?: string;
    }
  ): Promise<any[][]>;
  
  export interface ReadStream {
    // Define ReadStream interface if needed
  }
}