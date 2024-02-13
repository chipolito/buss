'use strict'

const { connectToDB, mSql }   = require('./db');
const { logToFile } = require('../controllers/auxiliar.controller');

class DescuentoModel {
    Set( data ) {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        INSERT INTO descuento (
                            descuento_nombre,
                            descuento_descripcion,
                            descuento_porcentaje,
                            descuento_bypass_plaza,
                            descuento_plaza_especial,
                            descuento_credencial,
                            descuento_estatus
                        ) VALUES (
                            @nombre,
                            @descripcion,
                            @porcentaje,
                            @bypass,
                            @especial,
                            @credencial,
                            1
                        );
                    `;
    
                    const result    = await pool
                        .request()
                        .input('nombre', mSql.NVarChar, data.inputNombreDescuento)
                        .input('descripcion', mSql.NVarChar, data.inputDescripcionDescuento)
                        .input('porcentaje', mSql.Int, data.inputPorcentajeDescuento)
                        .input('bypass', mSql.Int, data.inputBypassPlaza)
                        .input('especial', mSql.Int, data.inputPlazaEspecial)
                        .input('credencial', mSql.Int, data.inputCredencial)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Descuento registrado correctamente'});
                }
                catch (error) {
                    let strError = `descuento.model | Set | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('descuento.model | Set | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    Get(){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        SELECT 
                            descuento_id,
                            descuento_nombre,
                            descuento_descripcion,
                            descuento_porcentaje,
                            descuento_bypass_plaza,
                            descuento_plaza_especial,
                            descuento_credencial
                        FROM 
                            descuento
                        WHERE
                            descuento_estatus = 1;
                    `;

                    const result    = await pool
                        .request()
                        .query(sqlCmd);
    
                    resolve({ success: true, data: result.recordset, message: 'Catalogo cargado correctamente.' });
                }
                catch (error) {
                    let strError = `descuento.model | Get | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('descuento.model | Get | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    Del( descuentoId){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd = `
                        UPDATE descuento SET descuento_estatus = 0 WHERE descuento_id = @descuentoId;
                    `;
                    const result    = await pool
                        .request()
                        .input('descuentoId', mSql.Int, descuentoId)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Descuento eliminado correctamente' });
                }
                catch (error) {
                    let strError = `descuento.model | Del | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({ success: false, data: error, message: 'Error de base de datos' });
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('descuento.model | Del | ' + error, 'disse-tickets.log', '\r\n');
                resolve({ success: false, data: error, message: 'Error de base de datos' });
            });
        });
    }
}

module.exports = new DescuentoModel();