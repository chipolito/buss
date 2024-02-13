'use strict'

const { connectToDB, mSql }   = require('./db');
const { logToFile } = require('../controllers/auxiliar.controller');

class PerfilModel {
    Get( usuario_id ){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        SELECT u.usuario_contrasenia
                        FROM usuario As u
                        WHERE u.usuario_id = @usuarioId;
                    `;

                    const result    = await pool
                        .request()
                        .input('usuarioId', mSql.Int, usuario_id)
                        .query(sqlCmd);
    
                    resolve({ success: true, data: result.recordset.length > 0 ? result.recordset[0] : {} });
                }
                catch (error) {
                    let strError = `usuario.model | Get | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('usuario.model | Get | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    PutPassword( data ) {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        UPDATE usuario 
                            SET usuario_contrasenia = @contrasenia
                        WHERE usuario_id = @usuarioId
                    `;
    
                    const result    = await pool
                        .request()
                        .input('contrasenia', mSql.NVarChar, data.confirmPassword)
                        .input('usuarioId', mSql.Int, data.usuario_id)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Contraseña actualizada correctamente' });
                }
                catch (error) {
                    let strError = `perfil.model | PutPassword | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('perfil.model | PutPassword | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }
}

module.exports = new PerfilModel();