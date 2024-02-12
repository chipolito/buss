'use strict'

const db = require('./db');

class AjusteModel {
    Get(){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT 
                    configuracion_id,
                    configuracion_clave,
                    configuracion_valor
                FROM 
                    configuracion;
            `;
            db.all(sqlCmd, [], (error, data) => {
                let response = (error) ? { success: false, data: error, message: 'Error de base de datos' } : { success: true, data: data, message: 'Ajustes cargados correctamente' };
                resolve(response);
            });
        });
    }

    Set( data ) {
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                INSERT INTO configuracion (
                    configuracion_clave,
                    configuracion_valor
                ) VALUES (?, ?);
            `;

            let parameters = [
                data.ajuste_clave,
                data.ajuste_valor
            ];

            db.run(sqlCmd, parameters, (error) => {
                let response = (error) ? { success: false, data: error, message: 'Error al tratar de registrar los ajustes' } : { success: true, message: 'Ajsue registrado correctamente' };
                resolve(response);
            });
        });
    }

    Del( clave ) {
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                DELETE FROM configuracion WHERE configuracion_clave = ?
            `;

            let parameters = [
                clave
            ];

            db.run(sqlCmd, parameters, (error) => {
                resolve( (error) ? false : true );
            });
        });
    }
}

module.exports = new AjusteModel();