'use strict'

const { connectToDB, mSql }   = require('./db');
const { logToFile } = require('../controllers/auxiliar.controller');

class AutobusModel {
    Set( data ) {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        INSERT INTO autobus (
                            autobus_nombre,
                            autobus_descripcion,
                            autobus_capacidad,
                            autobus_plaza_especial,
                            autobus_estatus
                        ) VALUES (@nombre, @descripcion, @capacidad, @plazaEspecial, 1);
                    `;
    
                    const result    = await pool
                        .request()
                        .input('nombre', mSql.NVarChar, data.inputNombreAutobus)
                        .input('descripcion', mSql.NVarChar, data.inputDescripcionAutobus)
                        .input('capacidad', mSql.Int, data.inputCapacidadAutobus)
                        .input('plazaEspecial', mSql.Int, data.inputSillaRuedaAutobus)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Autobus registrado correctamente' });
                }
                catch (error) {
                    let strError = `autobus.model | Set | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('autobus.model | Set | ' + error, 'disse-tickets.log', '\r\n');
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
                            autobus_id,
                            autobus_nombre,
                            autobus_descripcion,
                            autobus_capacidad,
                            autobus_plaza_especial
                        FROM 
                            autobus
                        WHERE
                            autobus_estatus = 1;
                    `;

                    const result    = await pool
                        .request()
                        .query(sqlCmd);
    
                    resolve({ success: true, data: result.recordset, message: 'Catalogo cargado correctamente.' });
                }
                catch (error) {
                    let strError = `autobus.model | Get | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('autobus.model | Get | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    Del( autobusId){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd = `
                        UPDATE autobus SET autobus_estatus = 0 WHERE autobus_id = @autobusId;
                    `;
                    const result    = await pool
                        .request()
                        .input('autobusId', mSql.Int, autobusId)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Autobus eliminado correctamente' });
                }
                catch (error) {
                    let strError = `usuario.model | DelPermissions | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({ success: false, data: error, message: 'Error de base de datos' });
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('usuario.model | DelPermissions | ' + error, 'disse-tickets.log', '\r\n');
                resolve({ success: false, data: error, message: 'Error de base de datos' });
            });
        });
    }
}

module.exports = new AutobusModel();