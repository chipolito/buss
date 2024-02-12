'use strict'

const db = require('./db');

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
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                INSERT INTO auditoria (
                    usuario_id,
                    modulo,
                    accion,
                    fecha_hora,
                    detalle
                ) VALUES (?, ?, ?, datetime('now', 'localtime'), ?);
            `;

            let parameters = [
                data.usuario_id,
                data.modulo,
                data.accion,
                data.detalle
            ];

            db.run(sqlCmd, parameters, (error) => {
                let response = (error) ? { success: false, data: error, message: 'Error al tratar de registrar el movimiento' } : { success: true, message: 'Movimiento registrado correctamente' };
                resolve(response);
            });
        });
    }
}

module.exports = new AuxiliarModel();