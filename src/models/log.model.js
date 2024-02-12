'use strict'

const db = require('./db');

class LogModel {
    Get(complemento){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT
                    a.registro_id,
                    a.modulo,
                    a.accion,
                    a.fecha_hora,
                    a.detalle,
                    u.usuario_propietario
                FROM auditoria a
                INNER JOIN usuario u ON a.usuario_id = u.usuario_id
                ${complemento}
            `;
            db.all(sqlCmd, [], (error, data) => {
                let response = (error) ? { success: false, data: error, message: 'Error de base de datos' } : { success: true, data: data, message: 'Catalogo cargado correctamente' };
                resolve(response);
            });
        });
    }
}

module.exports = new LogModel();