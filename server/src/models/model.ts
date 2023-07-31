

export interface Solicitud {
    id?: number,
    id_barrio?: number,
    denominacion?: string,
    id_estado?: number,
    estado?: string,
    nombre_archivo_1?: string,
    nombre_archivo_2?: string,
    nombre_archivo_3?: string,
    nombre_archivo_4?: string,
    nombre_archivo_5?: string,
    observaciones_v?:string,
    observaciones_a?:string,
    observaciones_c?:string,
    id_lote?:number,
    id_grupo?:number,
    timestamp?:Date,
    archivos?: Array<FileForTable>
    refuerzos?: Array<Refuerzo>
};

export interface Refuerzo {
  id?: number,
  id_solicitud?: number,
  descripcion?: string,
  monto?: number
};
export interface FileRes {
  originalname?: string,
  uploadname?: string
};

export interface FileForTable {
  friendlyName?: string,
  fileName?: string
};

export interface Usuario {
  panel?:boolean,
  id?: number,
  id_barrio?:number;
  nombre?: string,
  password?: string,
  id_rol?: number,
  rol?:string,
  id_grupo?:number,
  barrio?: string,
  grupo?:string
  nombre_grupo?:string,

  esAdmin?: boolean
};

export interface Params {
  tg1?:Number,
  tg2?:Number,
  tg3?:Number,
  tg4?:Number,
  grupo?:number,
  id_barrio?:number
};

export interface Lotes {
  id?:number,
  estado: number,
  id_barrio: number,
  observaciones?:string,
  timestamp?:Date
};

export interface Ventas {
  id_grupo:number,
  descripcion: string,
  total: number,
  indice?:number
};

export interface LotesParams {
  estado?:EnumLotes,
};

export enum EnumLotes {
  Disponible = 0,
  Reservado = 1,
  Cargado = 2,
  Vendido = 3 ,
}

export interface LotesFilterOptions {
  estado:number,
  id_barrio:number
}
