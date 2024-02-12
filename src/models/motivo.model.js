'use strict'

const db = require('./db');

class MotivoModel {
    Get(){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT 
                    motivo_id,
                    motivo_texto
                FROM 
                    motivo_viaje
                WHERE
                    motivo_estatus = 1;
            `;
            db.all(sqlCmd, [], (error, data) => {
                let response = (error) ? { success: false, data: error, message: 'Error de base de datos' } : { success: true, data: data, message: 'Catalogo cargado correctamente' };
                resolve(response);
            });
        });
    }
}

module.exports = new MotivoModel();