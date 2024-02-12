'use strict'

const db = require('./db');

class PerfilModel {
    Get( usuario_id ){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT u.usuario_contrasenia
                FROM usuario As u
                WHERE u.usuario_id = ?;
            `;

            db.get(sqlCmd, usuario_id, (error, row) => {
                let response = (error) ? {success: false, message: 'Error de base de datos'} : {success: true, data: row};
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

module.exports = new PerfilModel();