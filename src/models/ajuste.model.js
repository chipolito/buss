'use strict'

const db = require('./db');

class AjusteModel {
    Get(){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        SELECT 
                            configuracion_id,
                            configuracion_clave,
                            configuracion_valor
                        FROM 
                            configuracion;
                    `;

                    const result    = await pool
                        .request()
                        .query(sqlCmd);
    
                    resolve({ success: true, data: result.recordset, message: 'Ajustes cargados correctamente.' });
                }
                catch (error) {
                    let strError = `ajuste.model | Get | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('ajuste.model | Get | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    Set( data ) {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        INSERT INTO configuracion (
                            configuracion_clave,
                            configuracion_valor
                        ) VALUES (@clave, @valor);
                    `;
    
                    const result    = await pool
                        .request()
                        .input('clave', mSql.NVarChar, data.ajuste_clave)
                        .input('valor', mSql.NVarChar, data.ajuste_valor)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Ajsue registrado correctamente'});
                }
                catch (error) {
                    let strError = `ajuste.model | Set | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('ajuste.model | Set | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    Del( clave ) {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd = `
                        DELETE FROM configuracion WHERE configuracion_clave = @clave
                    `;
                    const result    = await pool
                        .request()
                        .input('clave', mSql.NVarChar, clave)
                        .query(sqlCmd);

                    resolve(true);
                }
                catch (error) {
                    let strError = `ajuste.model | Del | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve(false);
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('ajuste.model | Del | ' + error, 'disse-tickets.log', '\r\n');
                resolve(false);
            });
        });
    }
}

module.exports = new AjusteModel();