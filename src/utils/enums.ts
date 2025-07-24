

export enum TipoPantalla {
    PAGO_HABERES = 1,
    PAGO_EMBARGOS_BAPRO = 2,
    PAGO_BENEFICIOS = 3,
    PAGO_PROVEEDORES = 4,
    PAGO_HONORARIOS = 9,
    ºPAGO_EMBARGOS_OTROS = 10,
    ALTA_CUENTAS = 3
}


export enum TipoModulo {
    TRANSFERENCIAS = 'TRANSFERENCIA',
    PAGO = 'PAGO',
    CUENTA = 'CUENTA',
    NOMINA = 'NOMINA',
    NOMINA_XSL = 'NOMINA_XSL'
}

export enum TipoMetada {
    IMPORT = 'IMPORT',
    LIST = 'LIST',
      FILL = 'FILL'
}

export enum TipoData {
    EXPORT = 'EXPORT',
    LIST = 'LIST',
    FILL = 'FILL'
}
   
export function getFileType(tipoModulo: TipoModulo) {
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
