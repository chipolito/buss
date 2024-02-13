'use strict'

const { connectToDB, mSql }   = require('./db');
const { logToFile } = require('../controllers/auxiliar.controller');

class UsuarioModel{
    Set( data ) {
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                INSERT INTO usuario (
                    usuario_nombre,
                    usuario_contrasenia,
                    usuario_propietario,
                    usuario_telefono,
                    usuario_tipo,
                    usuario_estatus
                ) VALUES (?, ?, ?, ?, 2, 1);
            `;

            let parameters = [
                data.inputNombreUsuario,
                data.inputContraseniaUsuario,
                data.inputPropietarioUsuario,
                data.inputContactoUsuario
            ];

            db.run(sqlCmd, parameters, (error) => {
                if(error){
                    resolve({ success: false, data: error, message: 'Error al tratar de registrar la cuenta de usuario' });
                } else {
                    db.get('SELECT last_insert_rowid() as id', function (err, row) {
                        resolve({ success: true, message: 'Usuario registrado correctamente', usuario_id: row.id });
                   });
                }
            });
        });
    }

    SetPermissions( sqlCmd ) {
        return new Promise((resolve, reject) => {
            db.run(sqlCmd, [], (error) => {
                resolve( (error) ? false : true );
            });
        });
    }

    DelPermissions( usuarioId ) {
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                DELETE FROM usuario_permiso WHERE usuario_id = ?
            `;

            let parameters = [
                usuarioId
            ];

            db.run(sqlCmd, parameters, (error) => {
                resolve( (error) ? false : true );
            });
        });
    }

    Get() {
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT 
                    u.usuario_id,
                    u.usuario_nombre,
                    u.usuario_propietario,
                    u.usuario_telefono,
                    u.usuario_tipo,
                    (select GROUP_CONCAT(permiso_id) AS permisos from usuario_permiso where usuario_id = u.usuario_id) AS usuario_permiso
                FROM 
                    usuario AS u
                WHERE
                    usuario_estatus = 1 AND usuario_tipo = 2;
            `;
            db.all(sqlCmd, [], (error, data) => {
                let response = (error) ? { success: false, data: error, message: 'Error de base de datos' } : { success: true, data: data, message: 'Catalogo cargado correctamente' };
                resolve(response);
            });
        });
    }

    Del( usuarioId ) {
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                    UPDATE usuario SET usuario_estatus = 0 WHERE ( usuario_id = ? );
                `;

            db.run(sqlCmd, [ usuarioId ], (error) => {
                let response = (error) ? { success: false, data: error, message: 'Error de base de datos' } : { success: true, message: 'Usuario eliminado correctamente' };
                resolve(response);
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
                    let strError = `Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile(error, 'disse-tickets.log', '\r\n');
                resolve({success: false, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    Put( data ) {
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                UPDATE usuario 
                    SET usuario_nombre = ?,
                    usuario_propietario = ?,
                    usuario_telefono = ?
                WHERE usuario_id = ?
            `;

            let parameters = [
                data.inputNombreUsuario,
                data.inputPropietarioUsuario,
                data.inputContactoUsuario,
                data.usuarioId
            ];

            db.run(sqlCmd, parameters, (error) => {
                let response = (error) ? { success: false, data: error, message: 'Error de base de datos' } : { success: true, message: 'Cuenta de usuario actualizado correctamente' };
                resolve(response);
            });
        });
    }

    PutPassword( data ) {
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                UPDATE usuario 
                    SET usuario_contrasenia = ?
                WHERE usuario_id = ?
            `;

            let parameters = [
                data.confirmPassword,
                data.usuario_id
            ];

            db.run(sqlCmd, parameters, (error) => {
                let response = (error) ? { success: false, data: error, message: 'Error de base de datos' } : { success: true, message: 'Contraseña actualizada correctamente' };
                resolve(response);
            });
        });
    }
}

module.exports = new UsuarioModel();