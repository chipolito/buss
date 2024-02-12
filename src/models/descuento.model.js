'use strict'

const db = require('./db');

class DescuentoModel {
    Set( data ) {
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                INSERT INTO descuento (
                    descuento_nombre,
                    descuento_descripcion,
                    descuento_porcentaje,
                    descuento_bypass_plaza,
                    descuento_plaza_especial,
                    descuento_credencial,
                    descuento_estatus
                ) VALUES (?, ?, ?, ?, ?, ?, 1);
            `;

            let parameters = [
                data.inputNombreDescuento,
                data.inputDescripcionDescuento,
                data.inputPorcentajeDescuento,
                data.inputBypassPlaza,
                data.inputPlazaEspecial,
                data.inputCredencial
            ];

            db.run(sqlCmd, parameters, (error) => {
                let response = (error) ? { success: false, data: error, message: 'Error al tratar de registrar el descuento' } : { success: true, message: 'Descuento registrado correctamente' };
                resolve(response);
            });
        });
    }

    Get(){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT 
                    descuento_id,
                    descuento_nombre,
                    descuento_descripcion,
                    descuento_porcentaje,
                    descuento_bypass_plaza,
                    descuento_plaza_especial,
                    descuento_credencial
                FROM 
                    descuento
                WHERE
                    descuento_estatus = 1;
            `;
            db.all(sqlCmd, [], (error, data) => {
                let response = (error) ? { success: false, data: error, message: 'Error de base de datos' } : { success: true, data: data, message: 'Catalogo cargado correctamente' };
                resolve(response);
            });
        });
    }

    Del( descuentoId){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                    UPDATE descuento SET descuento_estatus = 0 WHERE ( descuento_id = ? );
                `;

            db.run(sqlCmd, [ descuentoId ], (error) => {
                let response = (error) ? { success: false, data: error, message: 'Error de base de datos' } : { success: true, message: 'Descuento eliminado correctamente' };
                resolve(response);
            });
        });
    }
}

module.exports = new DescuentoModel();