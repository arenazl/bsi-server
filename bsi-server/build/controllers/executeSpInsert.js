"use strict";
const { __awaiter } = require("./filesController");

function executeSpInsert(connection, spName, values, outParams) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("executeSpInsert");
            let placeholders = values.map(() => "?").join(",");
            let sql = `CALL ${spName}(${placeholders});`;
            console.log("placeholders");
            console.log(placeholders);
            console.log("sql");
            console.log(sql);
            //const statement = await connection.prepare(sql);
            console.log("values");
            console.log(values);
            console.log("run execute");
            //const [rows] = await connection.execute('SELECT * FROM usuario');
            //console.log(rows);
            const resulting = yield connection.execute(sql, values);
            //console.log(resulting);
            console.log("run close");
            //await connection.close();
            console.log("run unprepare");
            //await connection.unprepare(sql);
            console.log("params length: " + outParams.length);
            if (outParams.length > 0) {
                let outPlaceholders = outParams.map((param) => `${param}`).join(",");
                console.log("Parameters");
                console.log(outParams.length);
                console.log(outParams);
                console.log("outPlaceholders");
                console.log(outPlaceholders);
                const [outResults] = yield connection.query(`SELECT ${outPlaceholders};`);
                return outResults[0];
            }
            return {};
        }
        catch (error) {
            console.error(error);
        }
    });
}
exports.executeSpInsert = executeSpInsert;
