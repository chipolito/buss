'use strict'

const db = require('./db');

class CorridaModel {
    Set( data ) {
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                INSERT INTO corrida (
                    corrida_origen,
                    corrida_destino,
                    corrida_tiempo_estimado,
                    corrida_precio,
                    corrida_estatus
                ) VALUES (?, ?, ?, ?, 1);
            `;

            let parameters = [
                data.inputNombreOrigen,
                data.inputNombreDestino,
                data.inputTiempo,
                data.inputPrecio
            ];

            db.run(sqlCmd, parameters, (error) => {
                if(error){
                    resolve({ success: false, data: error, message: 'Error al tratar de registrar la corrida' });
                } else {
                    db.get('SELECT last_insert_rowid() as id', function (err, row) {
                        resolve({ success: true, message: 'Corrida registrada correctamente', corrida_id: row.id });
                   });
                }
            });
        });
    }

    Put( data ) {
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                UPDATE corrida 
                    SET corrida_origen = ?,
                    corrida_destino = ?,
                    corrida_tiempo_estimado = ?,
                    corrida_precio = ?
                WHERE corrida_id = ?;
            `;

            let parameters = [
                data.inputNombreOrigen,
                data.inputNombreDestino,
                data.inputTiempo,
                data.inputPrecio,
                data.inputIdCorrida
            ];

            db.run(sqlCmd, parameters, (error) => {
                let response = (error) ? { success: false, data: error, message: 'Error de base de datos' } : { success: true, message: 'Corrida actualizada correctamente' };
                resolve(response);
            });
        });
    }

    SetHorario( sqlCmd ){
        return new Promise((resolve, reject) => {
            db.run(sqlCmd, [], (error) => {
                resolve( (error) ? false : true );
            });
        });
    }

    Get(){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT 
                    c.corrida_id,
                    c.corrida_origen,
                    c.corrida_destino,
                    c.corrida_tiempo_estimado,
                    c.corrida_precio,
                    c.corrida_estatus,
                    ( 
                        SELECT json_group_array(
                            json_object( 
                                'horario_id', horario_id, 
								'horario_salida', horario_salida, 
                                'autobus_id', autobus_id, 
								'autobus_nombre', (select autobus_nombre from autobus where autobus_id = horario.autobus_id), 
								'boleto_vendido', (select coalesce(sum(venta_ocupacion_real), 0) from venta where horario_id = horario.horario_id and venta_fecha = date('now', 'localtime')),
								'boleto_permitido', (select autobus_capacidad from autobus where autobus_id = horario.autobus_id),
                                'boleto_especial_vendido', (select coalesce(sum(venta_ocupacion_especial), 0) from venta where horario_id = horario.horario_id and venta_fecha = date('now', 'localtime')),
                                'boleto_especial_permitido', (select autobus_plaza_especial from autobus where autobus_id = horario.autobus_id)                                
                            )
                        ) 
                        FROM horario 
                        WHERE corrida_id = c.corrida_id AND horario_estatus = 1
                    ) AS corrida_horario
                FROM 
                    corrida AS c
                WHERE
                    c.corrida_estatus = 1;
            `;
            db.all(sqlCmd, [], (error, data) => {
                let response = (error) ? { success: false, data: error, message: 'Error de base de datos' } : { success: true, data: data, message: 'Catalogo cargado correctamente' };
                resolve(response);
            });
        });
    }

    Del( corridaId ){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                    UPDATE corrida SET corrida_estatus = 0 WHERE ( corrida_id = ? );
                `;

            db.run(sqlCmd, [ corridaId ], (error) => {
                if( error ) {
                    resolve( { success: false, data: error, message: 'Error de base de datos' } );
                } else {
                    sqlCmd = `
                        UPDATE horario SET horario_estatus = 0 WHERE ( corrida_id = ? );
                    `;

                    db.run(sqlCmd, [ corridaId ], (error) => {
                        let response = (error) ? { success: false, data: error, message: 'Error de base de datos' } : { success: true, message: 'Corrida eliminada correctamente' };
                        resolve(response);
                    });
                }
            });
        });
    }
}

module.exports = new CorridaModel();