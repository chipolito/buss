'use strict'

const { connectToDB, mSql }   = require('./db');
const { logToFile } = require('../controllers/auxiliar.controller');

class VentaModel {
    GetTurno( turno_id = 0, sucursalId, turnoWeb) {
        return new Promise((resolve, reject) => {
            let turnoEspecifico = turno_id > 0 ? ` t.turno_id = ${turno_id};` : 't.turno_estatus = 1;';

            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        SELECT
                            t.turno_id, 
                            t.turno_usuario_apertura,
                            (select u.usuario_propietario from usuario as u where u.usuario_id = t.turno_usuario_apertura) AS nombre_usuario_apertura,
                            CONCAT(CAST(CAST(t.turno_fecha_apertura as date) AS nvarchar), ' ', CAST(CAST(t.turno_fecha_apertura as time) AS nvarchar(5)) ) AS turno_fecha_apertura,
                            t.turno_usuario_cierre,
                            (select u.usuario_propietario from usuario as u where u.usuario_id = t.turno_usuario_cierre) AS nombre_usuario_cierre,
                            case when t.turno_estatus > 0 then CONCAT(CAST(CAST(t.turno_fecha_cierre as date) AS nvarchar), ' ', CAST(CAST(t.turno_fecha_cierre as time) AS nvarchar(5)) )
							else 'N/A'
                            end As turno_fecha_cierre,
                            t.turno_efectivo_inicial,
                            t.turno_efectivo_final,
                            t.turno_efectivo_real,
                            coalesce((select sum(v.venta_total) from venta as v where v.turno_id = t.turno_id and v.venta_estatus = 1), 0) AS total_venta_boletos,
                            (
                                select 
                                coalesce(sum(CASE
                                            WHEN v.venta_efectivo > v.venta_total THEN v.venta_total
                                            ELSE v.venta_efectivo
                                        END), 0)
                                from venta as v where v.turno_id = t.turno_id and v.venta_estatus = 1
                            ) AS venta_efectivo,
                            (select coalesce(sum(v.venta_tarjeta), 0) from venta as v where v.turno_id = t.turno_id and v.venta_estatus = 1) AS venta_tarjeta,
                            (select coalesce(sum(me.movimiento_importe), 0) from movimiento_efectivo as me where me.movimiento_tipo = 'E' and me.turno_id = t.turno_id) AS entrada_efectivo,
                            (select coalesce(sum(me.movimiento_importe), 0) from movimiento_efectivo as me where me.movimiento_tipo = 'S' and me.turno_id = t.turno_id) AS salida_efectivo,
                            t.turno_comentario,
                            coalesce((
                                select
                                    me.movimiento_fecha AS fecha,
                                    me.movimiento_tipo AS tipo,
                                    me.movimiento_importe AS importe,
                                    me.movimiento_comentario AS comentario
                                from movimiento_efectivo AS me
                                where me.turno_id = t.turno_id
                                for json path
                            ), '[]') AS movimiento_efectivo,
                            (
                                SELECT
                                    descuento_id, 
                                    descuento_estatus, 
                                    descuento_nombre, 
                                    (select coalesce(sum(venta_precio_venta), 0) from venta_detalle where descuento_id = descuento.descuento_id and venta_id in (select venta_id from venta where turno_id = t.turno_id and venta_estatus = 1)) AS total_venta,
                                    (select count(detalle_id) from venta_detalle where descuento_id = descuento.descuento_id and venta_id in (select venta_id from venta where turno_id = t.turno_id and venta_estatus = 1)) AS total_pasajeros
                                FROM descuento
                                for json path
                            ) As detalle_tipo_descuento,
                            (select concat('Sucursal ', sucursal_nombre_corto, ' - ', sucursal_nombre) from sucursal where sucursal_id = 2) As nombre_sucursal,
                            t.turno_estatus
                        FROM 
                            turno AS t
                        WHERE t.sucursal_id = @sucursalId and t.turno_web = ${turnoWeb} and ${turnoEspecifico}
                    `;

                    const result    = await pool
                        .request()
                        .input('sucursalId', mSql.Int, sucursalId)
                        .query(sqlCmd);
    
                    resolve({ success: true, data: result.recordset.length > 0 ? result.recordset[0] : {}, message: 'Catalogo cargado correctamente.' });
                }
                catch (error) {
                    let strError = `venta.model | GetTurno | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('venta.model | GetTurno | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    AbrirTurno(importeInicial, user_id, sucursalId){
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
                            turno_comentario,
                            turno_estatus,
                            sucursal_id
                        ) VALUES (
                            SYSDATETIME(), 
                            null, 
                            @usuarioApertura, 
                            @usuarioCierre,
                            @efectivoinicial,
                            0, 
                            0, 
                            '', 
                            1,
                            @sucursalId
                        );

                        SELECT SCOPE_IDENTITY() AS id;
                    `;
    
                    const result    = await pool
                        .request()
                        .input('usuarioApertura', mSql.Int, user_id)
                        .input('usuarioCierre', mSql.Int, user_id)
                        .input('efectivoinicial', mSql.Float, importeInicial)
                        .input('sucursalId', mSql.Int, sucursalId)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Se abrio un nuevo turno.', turno_id: result.recordset[0].id});
                }
                catch (error) {
                    let strError = `usuario.model | AbrirTurno | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('venta.model | AbrirTurno | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    Sale(data){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    let complementoFolio = `
                        SELECT concat(${data.venta_folio}, FORMAT((count(venta_id) +1), '00#')) FROM venta WHERE venta_sucursal = '${data.sucursal}' AND venta_fecha = CONVERT(date, getdate()) AND venta_estatus = 1
                    `;

                    let ventaSinImuesto = (data.venta_total / 1.16).toFixed(2);
                    let ventaImpuesto = (data.venta_total - ventaSinImuesto).toFixed(2);

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
                            (${complementoFolio}), 
                            @sucursal, 
                            CONVERT(date, getdate()), 
                            CONVERT(time, getdate()), 
                            SYSDATETIME(),
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
                            1
                        );

                        SELECT SCOPE_IDENTITY() AS venta_id, (select venta_folio from venta where venta_id = SCOPE_IDENTITY()) as venta_folio;
                    `;
    
                    const result    = await pool
                        .request()
                        .input('turnoId', mSql.Int, data.turno_id)
                        .input('usuarioId', mSql.Int, data.usuario_id)
                        .input('corridaId', mSql.Int, data.corrida_id)
                        .input('horarioId', mSql.Int, data.horario_id)
						.input('sucursal', mSql.NVarChar, data.sucursal)
                        .input('cantidad', mSql.Int, data.venta_cantidad)
                        .input('ocupacionReal', mSql.Int, data.venta_ocupacion_real)
                        .input('ocupacionEspecial', mSql.Int, data.venta_ocupacion_especial)
						.input('ventaTotalSinDescuento', mSql.Float, (data.venta_total + data.venta_descuento))
                        .input('ventaTotal', mSql.Float, data.venta_total)
                        .input('ventaTotalSinImpuesto', mSql.Float, ventaSinImuesto)
                        .input('ventaTotalConImpuesto', mSql.Float, ventaImpuesto)
						.input('ventaDescuento', mSql.Float, data.venta_descuento)
                        .input('ventaEfectivo', mSql.Float, data.venta_efectivo)
                        .input('ventaCambio', mSql.Float, data.venta_cambio)
                        .input('ventaTarjeta', mSql.Float, data.venta_tarjeta)
						.input('ventaMarca', mSql.NVarChar, data.venta_marca)
                        .input('ventaTipo', mSql.NVarChar, data.venta_tipo)
                        .input('ventaAutorizacion', mSql.NVarChar, data.venta_autorizacion)
                        .input('ventaOperacion', mSql.NVarChar, data.venta_operacion)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Venta registrada correctamente.', data: result.recordset[0] });
                } catch (error) {
                    let strError = `venta.model | Sale | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('venta.model | Sale | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    SaleTicket(data){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    let complementoFolio = `
                        SELECT concat((SELECT venta_folio FROM venta WHERE venta_id = ${data.venta_id}), FORMAT((count(detalle_id) +1), '0#')) FROM venta_detalle WHERE venta_id = ${data.venta_id} AND detalle_estatus = 1
                    `;

                    let complementoSilla = `
                        SELECT FORMAT(COALESCE(sum(venta_ocupacion_real), 0) + 1, '0#') FROM venta WHERE horario_id = ${data.horario_id} and venta_fecha = CONVERT(date, getdate())
                    `;

                    let complementoPrecioBase = `
                        SELECT corrida_precio FROM corrida WHERE corrida_id = ${data.corrida_id}
                    `;

                    let complementoDescuento = data.descuento_id == 0 ? 0 : `(SELECT descuento_porcentaje FROM descuento WHERE descuento_id = ${data.descuento_id})`;

                    let complementoDescuentoNombre = data.descuento_id == 0 ? "''" : `(SELECT descuento_nombre FROM descuento WHERE descuento_id = ${data.descuento_id})`;

                    let complementoDescuentoVenta = data.descuento_id == 0 ? `(${complementoPrecioBase})` :
                        `(SELECT (SELECT CAST(corrida_precio AS REAL) FROM corrida WHERE corrida_id = ${data.corrida_id}) * ((100 - CAST(descuento_porcentaje AS REAL)) / 100)  FROM descuento WHERE descuento_id = ${data.descuento_id})`;

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
                            (${complementoFolio}), 
                            @sucursal, 
                            CONVERT(date, getdate()), 
                            CONVERT(time, getdate()),
                            (${complementoPrecioBase}), 
                            ${complementoDescuento}, 
                            ${complementoDescuentoNombre}, 
                            ${complementoDescuentoVenta}, 
                            (select cast(round(${complementoDescuentoVenta} / 1.16, 2) as numeric(36,2))), 
                            (select cast(round((${complementoDescuentoVenta} / 1.16) * 0.16, 2) as numeric(36,2))), 
                            @beneficiario,
                            '00', 
                            1, 
                            @credencial, 
                            @genero
                        );

                        SELECT SCOPE_IDENTITY() As tiket_id, (select detalle_folio from venta_detalle where detalle_id = SCOPE_IDENTITY()) as folio;
                    `;
    
                    const result    = await pool
                        .request()
                        .input('ventaId', mSql.Int, data.venta_id)
                        .input('descuentoId', mSql.Int, data.descuento_id)
                        .input('motivoId', mSql.Int, data.motivo_id)
                        .input('sucursal', mSql.NVarChar, data.detalle_sucursal)
						.input('beneficiario', mSql.NVarChar, data.detalle_beneficiario)
                        .input('credencial', mSql.NVarChar, data.detalle_credencial)
                        .input('genero', mSql.NVarChar, data.detalle_genero)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Ticket registrado correctamente.', data: result.recordset[0] });
                }
                catch (error) {
                    let strError = `venta.model | SaleTicket | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('venta.model | SaleTicket | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    GetMovimientoEffectivo(turno_id){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        SELECT 
                            me.movimiento_id,
                            me.turno_id,
                            me.usuario_id,
                            CONCAT(CAST(CAST(me.movimiento_fecha as date) AS nvarchar), ' ', CAST(CAST(me.movimiento_fecha as time) AS nvarchar(5)) ) AS movimiento_fecha,
                            me.movimiento_tipo,
                            me.movimiento_importe,
                            me.movimiento_comentario,
                            u.usuario_propietario
                        FROM movimiento_efectivo AS me 
                        INNER JOIN usuario AS u ON me.usuario_id = u.usuario_id
                        WHERE me.turno_id = @turnoId;
                    `;

                    const result    = await pool
                        .request()
                        .input('turnoId', mSql.Int, turno_id)
                        .query(sqlCmd);
    
                    resolve({ success: true, data: result.recordset, message: 'Catalogo cargado correctamente.' });
                }
                catch (error) {
                    let strError = `venta.model | GetMovimientoEffectivo | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: [], message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('venta.model | GetMovimientoEffectivo | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: [], message: 'Error de servidor de base de datos.'});
            });
        });
    }

    DelMovimientoEfectivo(movimientoId){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd = `
                        DELETE FROM movimiento_efectivo WHERE movimiento_id = @movimientoId;
                    `;
                    const result    = await pool
                        .request()
                        .input('movimientoId', mSql.Int, movimientoId)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Registro eliminado correctamente' });
                }
                catch (error) {
                    let strError = `venta.model | DelMovimientoEfectivo | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({ success: false, data: error, message: 'Error al tratar de eliminar el registro'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('venta.model | DelMovimientoEfectivo | ' + error, 'disse-tickets.log', '\r\n');
                resolve({ success: false, data: error, message: 'Error al tratar de eliminar el registro'});
            });
        });
    }

    SetMovimientoEfectivo(data){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        INSERT INTO movimiento_efectivo (
                            turno_id, 
                            usuario_id, 
                            movimiento_fecha, 
                            movimiento_tipo, 
                            movimiento_importe, 
                            movimiento_comentario
                        ) VALUES (
                            @turnoId,
                            @usuarioId,
                            SYSDATETIME(),
                            @tipo,
                            @importe,
                            @comentario
                        );
                    `;
    
                    const result    = await pool
                        .request()
                        .input('turnoId', mSql.Int, data.turno_id)
                        .input('usuarioId', mSql.Int, data.usuario_id)
                        .input('tipo', mSql.NVarChar, data.inputMovimientoTipo)
                        .input('importe', mSql.Float, data.inputMovimientoImporte)
                        .input('comentario', mSql.NVarChar, data.inputMovimientoComentario)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Movimiento Registrado correctamente.' });
                }
                catch (error) {
                    let strError = `venta.model | SetMovimientoEfectivo | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('venta.model | SetMovimientoEfectivo | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    GetHistorialVenta(turno_id){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        SELECT 
                            v.venta_id, 
                            v.venta_folio,
                            v.venta_sucursal,
                            CAST(v.venta_fecha as nvarchar) AS venta_fecha,
                            CAST(v.venta_hora as nvarchar(5)) AS venta_hora,
                            v.venta_cantidad,
                            v.venta_total,
                            v.venta_descuento,
                            v.venta_efectivo,
                            v.venta_cambio,
                            v.venta_tarjeta,
                            v.venta_tarjeta_marca,
                            v.venta_tarjeta_tipo,
                            v.venta_tarjeta_autorizacion,
                            v.venta_tarjeta_operacion,
                            u.usuario_propietario AS cajero,
                            c.corrida_origen,
                            c.corrida_destino,
                            h.horario_salida,
                            a.autobus_nombre,
                            (
                                SELECT 
                                            d.detalle_id,
                                            d.detalle_folio,
                                            cast(d.venta_precio_base as numeric(36, 2)) AS venta_precio_base,
                                            d.descuento_id,
                                            cast(d.venta_descuento as numeric(36,2)) AS venta_descuento,
                                            d.venta_descuento_nombre,
                                            cast(d.venta_precio_venta as numeric(36, 2)) AS venta_precio_venta,
                                            d.detalle_beneficiario,
                                            d.detalle_asiento
                                FROM venta_detalle AS d
                                WHERE d.detalle_estatus = 1 AND d.venta_id = v.venta_id
                                for json path
                            ) AS detalle_venta
                        FROM venta AS v
                        INNER JOIN usuario AS u ON v.usuario_id = u.usuario_id
                        INNER JOIN corrida AS c ON v.corrida_id = c.corrida_id
                        INNER JOIN horario AS h ON v.horario_id = h.horario_id
                        INNER JOIN autobus AS a ON h.autobus_id = a.autobus_id
                        WHERE v.turno_id = @turnoId;
                    `;

                    const result    = await pool
                        .request()
                        .input('turnoId', mSql.Int, turno_id)
                        .query(sqlCmd);
    
                    resolve({ success: true, data: result.recordset, message: 'Historial cargada correctamente.' });
                }
                catch (error) {
                    let strError = `venta.model | GetHistorialVenta | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: [], message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('venta.model | GetHistorialVenta | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: [], message: 'Error de servidor de base de datos.'});
            });
        });
    }

    CerrarTurno(data){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        UPDATE turno SET
                            turno_fecha_cierre = SYSDATETIME(),
                            turno_usuario_cierre = @usuarioCierre,
                            turno_efectivo_final = @efectivoFinal,
                            turno_efectivo_real = @efectivoReal,
                            turno_venta_tarjeta = @ventaTarjeta,
                            turno_venta_total = @ventaTotal,
                            turno_estatus = 2
                        WHERE turno_id = @turnoId
                    `;
    
                    const result    = await pool
                        .request()
                        .input('usuarioCierre', mSql.Int, data.usuario_id)
                        .input('efectivoFinal', mSql.Float, data.efectivo_final)
                        .input('efectivoReal', mSql.Float, data.efectivo_real)
                        .input('ventaTarjeta', mSql.Float, data.ventaTarjeta)
                        .input('ventaTotal', mSql.Float, data.ventaTotal)
                        .input('turnoId', mSql.Int, data.turno_id)
                        .query(sqlCmd);

                    resolve({ success: true, message: 'Turno cerrado correctamente' });
                }
                catch (error) {
                    let strError = `venta.model | CerrarTurno | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: error, message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('venta.model | CerrarTurno | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: error, message: 'Error de servidor de base de datos.'});
            });
        });
    }

    GetTurnos( sucursalId ){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        SELECT 
                            t.turno_id,
                            CONCAT(CAST(CAST(t.turno_fecha_apertura as date) AS nvarchar), ' ', CAST(CAST(t.turno_fecha_apertura as time) AS nvarchar(5)) ) AS turno_fecha_apertura,
                            ua.usuario_propietario As usuario_apertura,
                            CONCAT(CAST(CAST(t.turno_fecha_cierre as date) AS nvarchar), ' ', CAST(CAST(t.turno_fecha_cierre as time) AS nvarchar(5)) ) AS turno_fecha_cierre,
                            uc.usuario_propietario As usuario_cierre,
                            t.turno_efectivo_inicial,
                            t.turno_efectivo_final,
                            t.turno_efectivo_real,
                            t.turno_venta_tarjeta,
                            t.turno_venta_total,
                            t.turno_comentario,
                            t.turno_estatus,
                            t.turno_web
                        FROM turno As t
                        INNER JOIN usuario As ua ON t.turno_usuario_apertura = ua.usuario_id
                        INNER JOIN usuario As uc ON t.turno_usuario_cierre = uc.usuario_id
                        WHERE t.sucursal_id = @sucursalId
                        ORDER BY t.turno_id DESC
                    `;

                    const result    = await pool
                        .request()
                        .input('sucursalId', mSql.Int, sucursalId)
                        .query(sqlCmd);
    
                    resolve({ success: true, data: result.recordset, message: 'Historial cargada correctamente.' });
                }
                catch (error) {
                    let strError = `venta.model | GetTurnos | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: [], message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('venta.model | GetTurnos | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: [], message: 'Error de servidor de base de datos.'});
            });
        });
    }

    GetVentaForTicket(venta_id, sucursalId){
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const sqlCmd    = `
                        SELECT 
                            v.venta_id, 
                            v.venta_folio,
                            v.venta_sucursal,
                            CAST(v.venta_fecha as nvarchar) AS venta_fecha,
                            CAST(v.venta_hora as nvarchar(5)) AS venta_hora,
                            v.venta_cantidad,
                            v.venta_total,
                            v.venta_descuento,
                            v.venta_efectivo,
                            v.venta_cambio,
                            v.venta_tarjeta,
                            v.venta_tarjeta_marca,
                            v.venta_tarjeta_tipo,
                            v.venta_tarjeta_autorizacion,
                            v.venta_tarjeta_operacion,
                            u.usuario_propietario AS cajero,
                            c.corrida_origen,
                            c.corrida_destino,
                            h.horario_salida,
                            a.autobus_nombre,
                            (
                                SELECT 
                                            d.detalle_id,
                                            d.detalle_folio,
                                            CAST(d.venta_precio_base as numeric(36,2)) AS venta_precio_base,
                                            d.descuento_id,
                                            CAST(v.venta_descuento as numeric(36, 2)) AS venta_descuento,
                                            d.venta_descuento_nombre,
                                            CAST(d.venta_precio_venta as numeric(36, 2)) AS venta_precio_venta,
                                            d.detalle_beneficiario,
                                            d.detalle_asiento,
                                            d.detalle_credencial
                                FROM venta_detalle AS d
                                WHERE d.detalle_estatus = 1 AND d.venta_id = v.venta_id
                                for json path
                            ) AS detalle_venta,
                            (select configuracion_valor from configuracion where configuracion_clave = 'cnf_empresa' and sucursal_id = @sucursalId ) AS configuracion
                        FROM venta AS v
                        INNER JOIN usuario AS u ON v.usuario_id = u.usuario_id
                        INNER JOIN corrida AS c ON v.corrida_id = c.corrida_id
                        INNER JOIN horario AS h ON v.horario_id = h.horario_id
                        INNER JOIN autobus AS a ON h.autobus_id = a.autobus_id
                        WHERE v.venta_id = @ventaId;
                    `;

                    const result    = await pool
                        .request()
                        .input('ventaId', mSql.Int, venta_id)
                        .input('sucursalId', mSql.Int, sucursalId)
                        .query(sqlCmd);
    
                    resolve({ success: true, data: result.recordset[0], message: 'Venta cargada correctamente.' });
                }
                catch (error) {
                    let strError = `venta.model | GetVentaForTicket | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: [], message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('venta.model | GetVentaForTicket | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: [], message: 'Error de servidor de base de datos.'});
            });
        });
    }

    ActualizarDisponibilidad(horarioId = 0, fechaActual = '') {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const result = await pool
                        .request()
                        .input('id_horario', mSql.Int, horarioId)
                        .input('fecha', mSql.VarChar, fechaActual)
                        .output('d_asientos', mSql.Int)
                        .output('d_lugares', mSql.Int)
                        .execute('actualiza_disponibilidad');
    
                    resolve({ success: true, data: result.output, message: 'Disponibilidad actualizada' });
                }
                catch (error) {
                    let strError = `venta.model | ActualizarDisponibilidad | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: [], message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('venta.model | ActualizarDisponibilidad | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: [], message: 'Error de servidor de base de datos.'});
            });
        });
    }

    ReservacionBoleto( info ) {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const result = await pool
                        .request()
                        .input('id_horario', mSql.Int, info.id_horario)
                        .input('fecha', mSql.VarChar, info.fecha)
                        .input('id_cliente', mSql.Int, info.id_cliente)
                        .input('r_asientos', mSql.Int, info.r_asientos)
                        .input('r_lugares', mSql.Int, info.r_lugares)
                        .output('id_reserva', mSql.Int)
                        .execute('reserva_boletos');
    
                    resolve({ success: true, data: result.output, message: 'Boletos reservados correctamente' });
                }
                catch (error) {
                    let strError = `venta.model | ReservacionBoleto | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: [], message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('venta.model | ReservacionBoleto | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: [], message: 'Error de servidor de base de datos.'});
            });
        });
    }

    TerminarReservacionBoleto( info ) {
        return new Promise((resolve, reject) => {
            connectToDB()
            .then(async pool => {
                try{
                    const result = await pool
                        .request()
                        .input('id_reserva', mSql.Int, info.id_reserva)
                        .input('new_estatus', mSql.Int, info.estatus)
                        .output('resultado', mSql.Int)
                        .execute('termina_reserva');
    
                    resolve({ success: true, data: result.output, message: 'Reserva actualizada correctamente' });
                }
                catch (error) {
                    let strError = `venta.model | TerminarReservacionBoleto | Error con la peticion al servidor de base de datos: ${JSON.stringify( error )}`;
                    logToFile(strError, 'disse-tickets.log', '\r\n');
                    resolve({success: false, data: [], message: 'Error con la peticion al servidor de base de datos.'});
                } finally {
                    pool.close()
                }
            })
            .catch( error => {
                logToFile('venta.model | TerminarReservacionBoleto | ' + error, 'disse-tickets.log', '\r\n');
                resolve({success: false, data: [], message: 'Error de servidor de base de datos.'});
            });
        });
    }
}

module.exports = new VentaModel();