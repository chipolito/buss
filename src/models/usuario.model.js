'use strict'

const { connectToDB, mSql }   = require('./db');
const { logToFile } = require('../controllers/auxiliar.controller');

class UsuarioModel{
    Set( data ) {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        INSERT INTO usuario (
                            usuario_nombre,
                            usuario_contrasenia,
                            usuario_propietario,
                            usuario_telefono,
                            usuario_tipo,
                            sucursal_id,
                            usuario_estatus
                        ) VALUES (
                            @usuarioNombre, 
                            @usuarioContrasenia, 
                            @usuarioPropietario, 
                            @usuarioTelefono, 
                            2, 
                            2, 
                            1
                        );

                        SELECT SCOPE_IDENTITY() AS id;
                    `;
    
                    const result    = await pool
                        .request()
                        .input('usuarioNombre', mSql.NVarChar, data.inputNombreUsuario)
                        .input('usuarioContrasenia', mSql.NVarChar, data.inputContraseniaUsuario)
                        .input('usuarioPropietario', mSql.NVarChar, data.inputPropietarioUsuario)
                        .input('usuarioTelefono', mSql.NVarChar, data.inputContactoUsuario)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Usuario registrado correctamente', usuario_id: result.recordset[0].id});
                }
                catch (error) {
                    let strError = `auxiliar.model | Set | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('auxiliar.model | Set | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    SetPermissions( sqlCmd ) {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const result    = await pool
                        .request()
                        .query(sqlCmd);

                    resolve(true);
                }
                catch (error) {
                    let strError = `auxiliar.model | SetPermissions | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve(false);
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('auxiliar.model | SetPermissions | ' + error, 'disse-tickets.log', '\r\n');
                resolve(false);
            });
        });
    }

    DelPermissions( usuarioId ) {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd = `
                        DELETE FROM usuario_permiso WHERE usuario_id = @usuarioId
                    `;
                    const result    = await pool
                        .request()
                        .input('usuarioId', mSql.Int, usuarioId)
                        .query(sqlCmd);

                    resolve(true);
                }
                catch (error) {
                    let strError = `auxiliar.model | DelPermissions | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve(false);
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('auxiliar.model | DelPermissions | ' + error, 'disse-tickets.log', '\r\n');
                resolve(false);
            });
        });
    }

    Get() {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        SELECT 
                            u.usuario_id,
                            u.usuario_nombre,
                            u.usuario_propietario,
                            u.usuario_telefono,
                            u.usuario_tipo,
                            u.sucursal_id,
                            STRING_AGG(up.permiso_id, ',') as usuario_permiso
                        FROM 
                            usuario AS u
                        INNER JOIN usuario_permiso AS up on u.usuario_id = up.usuario_id
                        WHERE
                            usuario_estatus = 1 AND usuario_tipo = 2
                        GROUP BY u.usuario_id, u.usuario_nombre, u.usuario_propietario, u.usuario_telefono, u.usuario_tipo, u.sucursal_id
                    `;

                    const result    = await pool
                        .request()
                        .query(sqlCmd);
    
                    resolve({ success: true, data: result.recordset, message: 'Catalogo cargado correctamente.' });
                }
                catch (error) {
                    let strError = `usuario.model | Get | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('usuario.model | Get | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    Del( usuarioId ) {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd = `
                        UPDATE usuario SET usuario_estatus = 0 WHERE usuario_id = @usuarioId;
                    `;
                    const result    = await pool
                        .request()
                        .input('usuarioId', mSql.Int, usuarioId)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Usuario eliminado correctamente' });
                }
                catch (error) {
                    let strError = `auxiliar.model | Del | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({ success: false, data: error, message: 'Error de base de datos' });
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('auxiliar.model | Del | ' + error, 'disse-tickets.log', '\r\n');
                resolve({ success: false, data: error, message: 'Error de base de datos' });
            });
        });
    }
    
    Sign( username ) {
        return new Promise(async (resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        SELECT 
                            u.usuario_id, 
                            u.usuario_nombre, 
                            u.usuario_contrasenia, 
                            u.usuario_propietario, 
                            u.usuario_telefono, 
                            u.usuario_tipo,
                            concat('["', (select STRING_AGG(p.permiso_clave, '","') from permiso p where p.permiso_id in (select up.permiso_id from usuario_permiso up where up.usuario_id = u.usuario_id) ), '"]') as usuario_permiso
                        FROM usuario As u
                        WHERE u.usuario_nombre = @nombre AND u.usuario_estatus = 1;
                    `;

                    const result    = await pool
                        .request()
                        .input('nombre', mSql.NVarChar, username)
                        .query(sqlCmd);
    
                    resolve({ success: true, data: result.recordset.length > 0 ? result.recordset[0] : {}});
                }
                catch (error) {
                    let strError = `usuario.model | Sign | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('usuario.model | Sign | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    Put( data ) {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        UPDATE usuario 
                            SET usuario_nombre = @usuarioNombre,
                            usuario_propietario = @usuarioPropietario,
                            usuario_telefono = @usuarioTelefono
                        WHERE usuario_id = @usuarioId;
                    `;
    
                    const result    = await pool
                        .request()
                        .input('usuarioNombre', mSql.NVarChar, data.inputNombreUsuario)
                        .input('usuarioPropietario', mSql.NVarChar, data.inputPropietarioUsuario)
                        .input('usuarioTelefono', mSql.NVarChar, data.inputContactoUsuario)
                        .input('usuarioId', mSql.NVarChar, data.usuarioId)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Cuenta de usuario actualizado correctamente' });
                }
                catch (error) {
                    let strError = `auxiliar.model | Put | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('auxiliar.model | Put | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
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
                            SET usuario_contrasenia = @password
                        WHERE usuario_id = @usuarioId
                    `;
    
                    const result    = await pool
                        .request()
                        .input('password', mSql.NVarChar, data.confirmPassword)
                        .input('usuarioId', mSql.NVarChar, data.usuario_id)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Contraseña actualizada correctamente' });
                }
                catch (error) {
                    let strError = `auxiliar.model | PutPassword | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('auxiliar.model | PutPassword | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }
}

module.exports = new UsuarioModel();