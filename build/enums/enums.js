"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileType = exports.TipoData = exports.TipoMetada = exports.TipoModulo = exports.TipoPantalla = void 0;
var TipoPantalla;
(function (TipoPantalla) {
    TipoPantalla[TipoPantalla["PAGO_HABERES"] = 1] = "PAGO_HABERES";
    TipoPantalla[TipoPantalla["PAGO_EMBARGOS_BAPRO"] = 2] = "PAGO_EMBARGOS_BAPRO";
    TipoPantalla[TipoPantalla["PAGO_BENEFICIOS"] = 3] = "PAGO_BENEFICIOS";
    TipoPantalla[TipoPantalla["PAGO_PROVEEDORES"] = 4] = "PAGO_PROVEEDORES";
    TipoPantalla[TipoPantalla["PAGO_HONORARIOS"] = 9] = "PAGO_HONORARIOS";
    TipoPantalla[TipoPantalla["\u00BAPAGO_EMBARGOS_OTROS"] = 10] = "\u00BAPAGO_EMBARGOS_OTROS";
    TipoPantalla[TipoPantalla["ALTA_CUENTAS"] = 3] = "ALTA_CUENTAS";
})(TipoPantalla || (exports.TipoPantalla = TipoPantalla = {}));
var TipoModulo;
(function (TipoModulo) {
    TipoModulo["TRANSFERENCIAS"] = "TRANSFERENCIA";
    TipoModulo["PAGO"] = "PAGO";
    TipoModulo["CUENTA"] = "CUENTA";
    TipoModulo["NOMINA"] = "NOMINA";
    TipoModulo["NOMINA_XSL"] = "NOMINA_XSL";
})(TipoModulo || (exports.TipoModulo = TipoModulo = {}));
var TipoMetada;
(function (TipoMetada) {
    TipoMetada["IMPORT"] = "IMPORT";
    TipoMetada["LIST"] = "LIST";
    TipoMetada["FILL"] = "FILL";
})(TipoMetada || (exports.TipoMetada = TipoMetada = {}));
var TipoData;
(function (TipoData) {
    TipoData["EXPORT"] = "EXPORT";
    TipoData["LIST"] = "LIST";
    TipoData["FILL"] = "FILL";
})(TipoData || (exports.TipoData = TipoData = {}));
function getFileType(tipoModulo) {
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
exports.getFileType = getFileType;
