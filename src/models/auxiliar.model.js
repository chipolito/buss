'use strict'

const { connectToDB, mSql }   = require('./db');

class AuxiliarModel{
    GetPermisos(){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT 
                    permiso_id, 
                    permiso_nombre, 
                    permiso_clave, 
                    permiso_descripcion 
                FROM permiso;
            `;

            db.all(sqlCmd, [], (error, data) => {
                let response = (error) ? { success: false, data: [], message: 'Error de base de datos' } : { success: true, data: data, message: 'Catalogo de permisos cargado correctamente' };
                resolve(response);
            });
        });
    }

    GetAutobuses(){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT 
                    autobus_id,
                    autobus_nombre,
                    autobus_capacidad
                FROM autobus
                WHERE autobus_estatus = 1;
            `;

            db.all(sqlCmd, [], (error, data) => {
                let response = (error) ? { success: false, data: [], message: 'Error de base de datos' } : { success: true, data: data, message: 'Catalogo de autobuses cargado correctamente' };
                resolve(response);
            });
        });
    }

    GetConfiguracion( configuracionClave ) {
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT
                    configuracion_valor
                FROM 
                    configuracion
                WHERE configuracion_clave = ?
            `;

            db.get(sqlCmd, configuracionClave, (error, data) => {
                let response = (error) ? { success: false, data: [], message: "Error de base de datos" } : { success: true, data: data.configuracion_valor, message: "Configuracion cargada" };
                resolve(response);
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
                        .input('sucursalId', mSql.Int, 2)
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