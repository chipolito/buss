'use strict'

const { connectToDB, mSql }   = require('./db');
const { logToFile } = require('../controllers/auxiliar.controller');

class MotivoModel {
    Get(){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        SELECT 
                            motivo_id,
                            motivo_texto
                        FROM 
                            motivo_viaje
                        WHERE
                            motivo_estatus = 1;
                    `;

                    const result    = await pool
                        .request()
                        .query(sqlCmd);
    
                    resolve({ success: true, data: result.recordset, message: 'Catalogo cargado correctamente.' });
                }
                catch (error) {
                    let strError = `motivo.model | Get | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('motivo.model | Get | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }
}

module.exports = new MotivoModel();