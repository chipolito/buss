'use strict'

const db = require('./db');

class AutobusModel {
    Set( data ) {
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                INSERT INTO autobus (
                    autobus_nombre,
                    autobus_descripcion,
                    autobus_capacidad,
                    autobus_plaza_especial,
                    autobus_estatus
                ) VALUES (?, ?, ?, ?, 1);
            `;

            let parameters = [
                data.inputNombreAutobus,
                data.inputDescripcionAutobus,
                data.inputCapacidadAutobus,
                data.inputSillaRuedaAutobus
            ];

            db.run(sqlCmd, parameters, (error) => {
                let response = (error) ? { success: false, data: error, message: 'Error al tratar de registrar el autobus' } : { success: true, message: 'Autobus registrado correctamente' };
                resolve(response);
            });
        });
    }

    Get(){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
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
            db.all(sqlCmd, [], (error, data) => {
                let response = (error) ? { success: false, data: error, message: 'Error de base de datos' } : { success: true, data: data, message: 'Catalogo cargado correctamente' };
                resolve(response);
            });
        });
    }

    Del( autobusId){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                    UPDATE autobus SET autobus_estatus = 0 WHERE ( autobus_id = ? );
                `;

            db.run(sqlCmd, [ autobusId ], (error) => {
                let response = (error) ? { success: false, data: error, message: 'Error de base de datos' } : { success: true, message: 'Autobus eliminado correctamente' };
                resolve(response);
            });
        });
    }
}

module.exports = new AutobusModel();