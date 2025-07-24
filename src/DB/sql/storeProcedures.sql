queryResult

CREATE DEFINER=`root`@`localhost` PROCEDURE `InsertTransInmediataInfo`(
	IN p_tipoDeRegistro INT,
    IN p_empresaNombre VARCHAR(255),
    IN p_infoDiscrecional VARCHAR(255),
    IN p_empresaCUIT BIGINT,
    IN p_prestacion VARCHAR(255),
    IN p_fechaEmision INT,
    IN p_horaGeneracion INT,
    IN p_fechaAcreditacion INT,
    IN p_bloqueDosCbuEmpresa BIGINT,
    IN p_moneda INT,
    IN p_rotuloArchivo VARCHAR(255),
    IN p_tipoRemuneracion INT,
    IN p_importeTotalFinal DECIMAL(10,2),
    IN p_concepto VARCHAR(100),
)
BEGIN
    INSERT INTO transInmediataInfo (
        tipoDeRegistro, empresaNombre, infoDiscrecional, empresaCUIT,
        prestacion, fechaEmision, horaGeneracion, fechaAcreditacion,
        bloqueDosCbuEmpresa, moneda, rotuloArchivo, tipoRemuneracion,
        importeTotalFinal, concepto
    ) VALUES (
        p_tipoDeRegistro, p_empresaNombre, p_infoDiscrecional, p_empresaCUIT,
        p_prestacion, p_fechaEmision, p_horaGeneracion, p_fechaAcreditacion,
        p_bloqueDosCbuEmpresa, p_moneda, p_rotuloArchivo, p_tipoRemuneracion,
        p_importeTotalFinal, p_concepto );
        

END



CREATE PROCEDURE InsertTransInmediataDato(
    IN p_tipoDeRegistro INT,
    IN p_bloqueCBU1 VARCHAR(255),
    IN p_bloqueCBU2 VARCHAR(255),
    IN p_importe DECIMAL(10, 2),
    IN p_refUnivoca VARCHAR(255),
    IN p_beneficiarioDoc VARCHAR(255),
    IN p_beneficiarioApeNombre VARCHAR(255),
    IN p_filler VARCHAR(255),
    IN p_marca INT,
    IN p_transInmediataInfoId INT
)
BEGIN
    INSERT INTO TransInmediataDato (
        tipoDeRegistro, bloqueCBU1, bloqueCBU2, importe, refUnivoca,
        beneficiarioDoc, beneficiarioApeNombre, filler, marca, transInmediataInfoId
    ) VALUES (
        p_tipoDeRegistro, p_bloqueCBU1, p_bloqueCBU2, p_importe, p_refUnivoca,
        p_beneficiarioDoc, p_beneficiarioApeNombre, p_filler, p_marca, p_transInmediataInfoId
    );

    SET lastId = LAST_INSERT_ID();
END 






























