"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoModulo = exports.TipoPantalla = void 0;
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
    TipoModulo["TRANSFERENCIAS"] = "transferencias";
    TipoModulo["PAGOS"] = "pagos";
    TipoModulo["ALTAS"] = "altas";
})(TipoModulo || (exports.TipoModulo = TipoModulo = {}));
