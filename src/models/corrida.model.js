'use strict'

const { connectToDB, mSql }   = require('./db');
const { logToFile } = require('../controllers/auxiliar.controller');

class CorridaModel {
    Set( data ) {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        INSERT INTO corrida (
                            corrida_origen,
                            corrida_destino,
                            corrida_tiempo_estimado,
                            corrida_precio,
                            sucursal_id,
                            corrida_estatus
                        ) VALUES (
                            @origen, 
                            @destino,
                            @tiempo,
                            @precio,
                            @sucursalId,
                            1
                        );

                        SELECT SCOPE_IDENTITY() AS id;
                    `;
    
                    const result    = await pool
                        .request()
                        .input('origen', mSql.NVarChar, data.inputNombreOrigen)
                        .input('destino', mSql.NVarChar, data.inputNombreDestino)
                        .input('tiempo', mSql.NVarChar, data.inputTiempo)
                        .input('precio', mSql.Float, data.inputPrecio)
                        .input('sucursalId', mSql.Int, data.sucursalId)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Corrida registrada correctamente', corrida_id: result.recordset[0].id});
                }
                catch (error) {
                    let strError = `corrida.model | Set | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('corrida.model | Set | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    Put( data ) {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        UPDATE corrida 
                            SET corrida_origen = @origen,
                            corrida_destino = @destino,
                            corrida_tiempo_estimado = @tiempo,
                            corrida_precio = @precio,
                            sucursal_id = @sucursalId
                        WHERE corrida_id = @corridaId;
                    `;
    
                    const result    = await pool
                        .request()
                        .input('origen', mSql.NVarChar, data.inputNombreOrigen)
                        .input('destino', mSql.NVarChar, data.inputNombreDestino)
                        .input('tiempo', mSql.NVarChar, data.inputTiempo)
                        .input('precio', mSql.NVarChar, data.inputPrecio)
                        .input('corridaId', mSql.NVarChar, data.inputIdCorrida)
                        .input('sucursalId', mSql.Int, data.sucursalId)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Corrida actualizada correctamente' });
                }
                catch (error) {
                    let strError = `corrida.model | Put | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('corrida.model | Put | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    SetHorario( sqlCmd ){
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
                    let strError = `corrida.model | SetHorario | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve(false);
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('corrida.model | SetHorario | ' + error, 'disse-tickets.log', '\r\n');
                resolve(false);
            });
        });
    }

    Get(sucursalId){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        SELECT 
                            c.corrida_id,
                            c.corrida_origen,
                            c.corrida_destino,
                            c.corrida_tiempo_estimado,
                            c.corrida_precio,
                            c.corrida_estatus,
                            ( 
                                SELECT 
                                        h.horario_id, 
                                        h.horario_salida, 
                                        a.autobus_id, 
                                        a.autobus_nombre,
                                        (select coalesce(sum(venta_ocupacion_real), 0) from venta where horario_id = h.horario_id and venta_fecha = CONVERT(date, getdate()) ) AS boleto_vendido,
                                        a.autobus_capacidad AS boleto_permitido,
                                        (select coalesce(sum(venta_ocupacion_especial), 0) from venta where horario_id = h.horario_id and venta_fecha = CONVERT(date, getdate()) ) AS boleto_especial_vendido,
                                        a.autobus_plaza_especial AS boleto_especial_permitido
                                FROM horario h
                                INNER JOIN autobus a ON h.autobus_id = a.autobus_id
                                WHERE corrida_id = c.corrida_id AND horario_estatus = 1
                                for json path
                            ) AS corrida_horario
                        FROM 
                            corrida AS c
                        WHERE
                            c.sucursal_id = @sucursalId
                            AND c.corrida_estatus = 1;
                    `;

                    const result    = await pool
                        .request()
                        .input('sucursalId', mSql.Int, sucursalId)
                        .query(sqlCmd);
    
                    resolve({ success: true, data: result.recordset, message: 'Catalogo cargado correctamente.' });
                }
                catch (error) {
                    let strError = `corrida.model | Get | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('corrida.model | Get | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    Del( corridaId ){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    let sqlCmd = `
                        UPDATE corrida SET corrida_estatus = 0 WHERE corrida_id = @corridaId;
                        UPDATE horario SET horario_estatus = 0 WHERE corrida_id = @corridaId;
                    `;
                    const result    = await pool
                        .request()
                        .input('corridaId', mSql.Int, corridaId)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Usuario eliminado correctamente' });
                }
                catch (error) {
                    let strError = `corrida.model | Del | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({ success: false, data: error, message: 'Error de base de datos' });
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('corrida.model | Del | ' + error, 'disse-tickets.log', '\r\n');
                resolve({ success: false, data: error, message: 'Error de base de datos' });
            });
        });
    }
}

module.exports = new CorridaModel();