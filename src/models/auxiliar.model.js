'use strict'

const { connectToDB, mSql }   = require('./db');
// const { logToFile } = require('../controllers/auxiliar.controller');

class AuxiliarModel{
    GetPermisos(){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        SELECT 
                            permiso_id, 
                            permiso_nombre, 
                            permiso_clave, 
                            permiso_descripcion 
                        FROM permiso;
                    `;

                    const result    = await pool
                        .request()
                        .query(sqlCmd);
    
                    resolve({ success: true, data: result.recordset, message: 'Catalogo de permisos cargado correctamente.' });
                }
                catch (error) {
                    let strError = `auxiliar.model | GetPermisos | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: [], message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('auxiliar.model | GetPermisos | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: [], message: 'Error de servidor de base de datos.'});
            });
        });
    }

    GetAutobuses(){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        SELECT 
                            autobus_id,
                            autobus_nombre,
                            autobus_capacidad
                        FROM autobus
                        WHERE autobus_estatus = 1;
                    `;

                    const result    = await pool
                        .request()
                        .query(sqlCmd);
    
                    resolve({ success: true, data: result.recordset, message: 'Catalogo de autobuses cargado correctamente.' });
                }
                catch (error) {
                    let strError = `auxiliar.model | GetAutobuses | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: [], message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('auxiliar.model | GetAutobuses | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: [], message: 'Error de servidor de base de datos.'});
            });
        });
    }

    GetConfiguracion( configuracionClave ) {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        SELECT
                            configuracion_valor
                        FROM 
                            configuracion
                        WHERE configuracion_clave = @clave
                    `;

                    const result    = await pool
                        .request()
                        .input('clave', mSql.NVarChar, configuracionClave)
                        .query(sqlCmd);
    
                    resolve({ success: true, data: result.recordset[0].configuracion_valor, message: 'Configuracion cargada.' });
                }
                catch (error) {
                    let strError = `auxiliar.model | GetConfiguracion | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: [], message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('auxiliar.model | GetConfiguracion | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: [], message: 'Error de servidor de base de datos.'});
            });
        });
    }

    SetAuditoria( data ) {
        return new Promise(async (resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        INSERT INTO auditoria (
                            usuario_id,
                            modulo,
                            accion,
                            fecha_hora,
                            detalle,
                            sucursal_id
                        ) VALUES (
                            @usuarioId, 
                            @modulo, 
                            @accion, 
                            SYSDATETIME(), 
                            @detalle, 
                            @sucursalId
                        );
                    `;
    
                    const result    = await pool
                        .request()
                        .input('usuarioId', mSql.Int, data.usuario_id)
                        .input('modulo', mSql.NVarChar, data.modulo)
                        .input('accion', mSql.NVarChar, data.accion)
                        .input('detalle', mSql.NVarChar, data.detalle)
                        .input('sucursalId', mSql.Int, data.sucursal_id)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Movimiento registrado correctamente'});
                }
                catch (error) {
                    let strError = `auxiliar.model | SetAuditoria | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('auxiliar.model | SetAuditoria | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, message: 'Error de servidor de base de datos.'});
            });            
        });
    }
}

module.exports = new AuxiliarModel();