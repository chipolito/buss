'use strict'

const sqlite3       = require('sqlite3').verbose();
const dbSqliteName  = `C:/dataBaseTerminal/n10Ticket.db`;

const { connectToDB, mSql }   = require('./db');

const dbSqlite = new sqlite3.Database(dbSqliteName, error => {
    if (error) {
        console.error(error.message);
    }

    console.log('Successfully connected to the database');
});

class ToolModel {
    GetTurnos(){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT 
                    t.turno_id,
                    t.turno_fecha_apertura,
                    t.turno_fecha_cierre,
                    t.turno_usuario_apertura,
                    t.turno_usuario_cierre,
                    t.turno_efectivo_inicial,
                    t.turno_efectivo_final,
                    t.turno_efectivo_real,
                    t.turno_venta_tarjeta,
                    t.turno_venta_total,
                    t.turno_comentario,
                    t.turno_estatus
                FROM turno As t
                ORDER BY t.turno_id ASC
            `;

            dbSqlite.all(sqlCmd, [], (error, data) => {
                let response = (error) ? { success: false, data: [] } : { success: true, data: data };
                resolve(response);
            });
        });
    }

    CreateTurno(data){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        INSERT INTO turno (
                            turno_fecha_apertura,
                            turno_fecha_cierre,
                            turno_usuario_apertura,
                            turno_usuario_cierre,
                            turno_efectivo_inicial,
                            turno_efectivo_final,
                            turno_efectivo_real,
                            turno_venta_tarjeta,
                            turno_venta_total,
                            turno_comentario,
                            turno_estatus,
                            sucursal_id
                        ) VALUES (
                            @fechaApertura,
                            @fechaCierre,
                            @usuarioApertura,
                            @usuarioCierre,
                            @efectivoInicial,
                            @efectivoFinal,
                            @efectivoReal,
                            @ventaTarjeta,
                            @ventaTotal,
                            @comentario,
                            @estatus,
                            @sucursal
                        );

                        SELECT SCOPE_IDENTITY() AS id;
                    `;
    
                    const result    = await pool
                        .request()
                        .input('fechaApertura', mSql.DateTime, data.turno_fecha_apertura)
                        .input('fechaCierre', mSql.DateTime, data.turno_fecha_cierre)
                        .input('usuarioApertura', mSql.Int, data.turno_usuario_apertura)
                        .input('usuarioCierre', mSql.Int, data.turno_usuario_cierre)
                        .input('efectivoInicial', mSql.Float, data.turno_efectivo_inicial)
                        .input('efectivoFinal', mSql.Float, data.turno_efectivo_final)
                        .input('efectivoReal', mSql.Float, data.turno_efectivo_real)
                        .input('ventaTarjeta', mSql.Float, data.turno_venta_tarjeta)
                        .input('ventaTotal', mSql.Float, data.turno_venta_total)
                        .input('comentario', mSql.NVarChar, data.turno_comentario)
                        .input('estatus', mSql.Int, data.turno_estatus)
                        .input('sucursal', mSql.Int, data.sucursal_id)
                        .query(sqlCmd);

                    resolve({ success: true, turno_id: data.turno_id, new_turno_id: result.recordset[0].id });
                }
                catch (error) {
                    resolve({success: false, turno_id: data.turno_id});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                resolve({success: false, turno_id: data.turno_id});
            });
        });
    }

    GetVentas( turno_id ){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT 
                    venta_id,
                    turno_id,
                    usuario_id,
                    corrida_id,
                    horario_id,
                    venta_folio,
                    venta_sucursal,
                    venta_fecha,
                    venta_hora,
                    venta_cantidad,
                    venta_ocupacion_real,
                    venta_ocupacion_especial,
                    venta_total,
                    venta_descuento,
                    venta_efectivo,
                    venta_cambio,
                    venta_tarjeta,
                    venta_marca,
                    venta_tipo,
                    venta_autorizacion,
                    venta_operacion,
                    venta_estatus
                FROM venta
                WHERE turno_id = ?
                ORDER BY venta_id ASC
            `;

            dbSqlite.all(sqlCmd, [ turno_id ], (error, data) => {
                let response = (error) ? { success: false } : { success: true, data: data };
                resolve(response);
            });
        });
    }

    CreateVenta(data){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        INSERT INTO venta (
                            turno_id,
                            usuario_id,
                            corrida_id,
                            horario_id,
                            venta_folio,
                            venta_sucursal,
                            venta_fecha,
                            venta_hora,
                            venta_fecha_hora,
                            venta_cantidad,
                            venta_ocupacion_real,
                            venta_ocupacion_especial,
                            venta_total_sin_descuento,
                            venta_total,
                            venta_total_sin_impuesto,
                            venta_impuesto,
                            venta_descuento,
                            venta_efectivo,
                            venta_cambio,
                            venta_tarjeta,
                            venta_tarjeta_marca,
                            venta_tarjeta_tipo,
                            venta_tarjeta_autorizacion,
                            venta_tarjeta_operacion,
                            enviado_erp,
                            venta_estatus
                        ) VALUES (
                            @turnoId, 
                            @usuarioId, 
                            @corridaId, 
                            @horarioId, 
                            @folio, 
                            @sucursal, 
                            @ventaFecha, 
                            '${ data.venta_hora }', 
                            '${ data.ventaFechaHora }',
                            @cantidad, 
                            @ocupacionReal, 
                            @ocupacionEspecial, 
                            @ventaTotalSinDescuento,
                            @ventaTotal,
                            @ventaTotalSinImpuesto,
                            @ventaTotalConImpuesto,
                            @ventaDescuento, 
                            @ventaEfectivo, 
                            @ventaCambio, 
                            @ventaTarjeta, 
                            @ventaMarca, 
                            @ventaTipo, 
                            @ventaAutorizacion, 
                            @ventaOperacion, 
                            0,
                            @ventaEstatus
                        );

                        SELECT SCOPE_IDENTITY() AS venta_id;
                    `;
    
                    const result    = await pool
                        .request()
                        .input('turnoId', mSql.Int, data.turno_id)
                        .input('usuarioId', mSql.Int, data.usuario_id)
                        .input('corridaId', mSql.Int, data.corrida_id)
                        .input('horarioId', mSql.Int, data.horario_id)
                        .input('folio', mSql.NVarChar, data.venta_folio)
						.input('sucursal', mSql.NVarChar, data.venta_sucursal)
                        .input('ventaFecha', mSql.Date, data.venta_fecha)
                        .input('cantidad', mSql.Int, data.venta_cantidad)
                        .input('ocupacionReal', mSql.Int, data.venta_ocupacion_real)
                        .input('ocupacionEspecial', mSql.Int, data.venta_ocupacion_especial)
						.input('ventaTotalSinDescuento', mSql.Float, data.ventaTotalSinDescuento)
                        .input('ventaTotal', mSql.Float, data.venta_total)
                        .input('ventaTotalSinImpuesto', mSql.Float, data.ventaTotalSinImpuesto)
                        .input('ventaTotalConImpuesto', mSql.Float, data.ventaTotalConImpuesto)
						.input('ventaDescuento', mSql.Float, data.venta_descuento)
                        .input('ventaEfectivo', mSql.Float, data.venta_efectivo)
                        .input('ventaCambio', mSql.Float, data.venta_cambio)
                        .input('ventaTarjeta', mSql.Float, data.venta_tarjeta)
						.input('ventaMarca', mSql.NVarChar, data.venta_marca)
                        .input('ventaTipo', mSql.NVarChar, data.venta_tipo)
                        .input('ventaAutorizacion', mSql.NVarChar, data.venta_autorizacion)
                        .input('ventaOperacion', mSql.NVarChar, data.venta_operacion)
                        .input('ventaEstatus', mSql.Int, data.venta_estatus)
                        .query(sqlCmd);

                    resolve({ success: true, venta_id: data.venta_id, new_venta_id: result.recordset[0].venta_id });
                } catch (error) {
                    resolve({success: false, venta_id: data.venta_id, error});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                resolve({success: false, venta_id: data.venta_id, error});
            });
        });
    }

    GetDetalles( venta_id ){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT 
                    detalle_id,
                    venta_id,
                    descuento_id,
                    motivo_id,
                    detalle_folio,
                    detalle_sucursal,
                    detalle_fecha,
                    detalle_hora,
                    venta_precio_base,
                    venta_descuento,
                    venta_descuento_nombre,
                    venta_precio_venta,
                    detalle_beneficiario,
                    detalle_asiento,
                    detalle_estatus,
                    detalle_credencial,
                    detalle_genero                    
                FROM venta_detalle
                WHERE venta_id = ?
                ORDER BY detalle_id ASC
            `;

            dbSqlite.all(sqlCmd, [ venta_id ], (error, data) => {
                let response = (error) ? { success: false } : { success: true, data: data };
                resolve(response);
            });
        });
    }

    CreateDetalle(data){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        INSERT INTO venta_detalle (
                            venta_id,
                            descuento_id,
                            motivo_id,
                            detalle_folio,
                            detalle_sucursal,
                            detalle_fecha,
                            detalle_hora,
                            venta_precio_base,
                            venta_descuento,
                            venta_descuento_nombre,
                            venta_precio_venta,
                            venta_precio_sin_impuesto,
                            venta_precio_impuesto,
                            detalle_beneficiario,
                            detalle_asiento,
                            detalle_estatus,
                            detalle_credencial,
                            detalle_genero
                        ) VALUES (
                            @ventaId, 
                            @descuentoId, 
                            @motivoId,
                            @folio, 
                            @sucursal, 
                            @fecha, 
                            '${data.detalle_hora}',
                            @precio, 
                            @descuento, 
                            @descuentoNombre, 
                            @precioVenta, 
                            @sinImpuesto, 
                            @impuesto, 
                            @beneficiario,
                            @asiento, 
                            @estatus, 
                            @credencial, 
                            @genero
                        );

                        SELECT SCOPE_IDENTITY() As detalle_id;
                    `;
    
                    const result    = await pool
                        .request()
                        .input('ventaId', mSql.Int, data.venta_id)
                        .input('descuentoId', mSql.Int, data.descuento_id)
                        .input('motivoId', mSql.Int, data.motivo_id)
                        .input('folio', mSql.NVarChar, data.detalle_folio)
                        .input('sucursal', mSql.NVarChar, data.detalle_sucursal)
                        .input('fecha', mSql.Date, data.detalle_fecha)
                        .input('precio', mSql.Float, data.venta_precio_base)
                        .input('descuento', mSql.Float, data.venta_descuento)
                        .input('descuentoNombre', mSql.NVarChar, data.venta_descuento_nombre)
                        .input('precioVenta', mSql.Float, data.venta_precio_venta)
                        .input('sinImpuesto', mSql.Float, data.venta_precio_sin_impuesto)
                        .input('impuesto', mSql.Float, data.venta_precio_impuesto)
						.input('beneficiario', mSql.NVarChar, data.detalle_beneficiario)
                        .input('asiento', mSql.NVarChar, data.detalle_asiento)
                        .input('estatus', mSql.Int, data.detalle_estatus)
                        .input('credencial', mSql.NVarChar, data.detalle_credencial)
                        .input('genero', mSql.NVarChar, data.detalle_genero ? data.detalle_genero : 'H')
                        .query(sqlCmd);

                    resolve({ success: true, detalle_id: data.detalle_id, new_detalle_id: result.recordset[0].detalle_id });
                }
                catch (error) {
                    resolve({ success: false, detalle_id: data.detalle_id, error });
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                resolve({ success: false, detalle_id: data.detalle_id, error });
            });
        });
    }
}

module.exports = new ToolModel();