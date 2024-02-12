'use strict'

const { logToFile }   = require('../controllers/auxiliar.controller');
const sql   = require('mssql');
const db    = require('./db');

class VentaModel {
    constructor() {
        this.sqlConfig = {
            user: process.env.SQLUSER,
            password: process.env.SQLKEY,
            server: process.env.SQLSERVER, 
            database: process.env.SQLDATABASE, 
            options: {
                trustServerCertificate: true
            }
        };
    }

    GetTurno( turno_id = 0) {
        return new Promise((resolve, reject) => {
            let turnoEspecifico = turno_id > 0 ? ` t.turno_id = ${turno_id};` : 't.turno_estatus = 1;';

            let sqlCmd = `
                SELECT
                    t.turno_id, 
                    t.turno_usuario_apertura,
                    (select u.usuario_propietario from usuario as u where u.usuario_id = t.turno_usuario_apertura) AS nombre_usuario_apertura,
                    t.turno_fecha_apertura,
                    t.turno_usuario_cierre,
                    (select u.usuario_propietario from usuario as u where u.usuario_id = t.turno_usuario_cierre) AS nombre_usuario_cierre,
                    t.turno_fecha_cierre,
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
                    (
						select json_group_array(
							json_object(
								'fecha', movimiento_fecha,
								'tipo', movimiento_tipo,
								'importe', movimiento_importe,
								'comentario',  movimiento_comentario
						))
						from movimiento_efectivo
						where turno_id = t.turno_id
					) AS movimiento_efectivo,
                    (
						SELECT 
							json_group_array(
								json_object(
								'descuento_id', descuento_id, 
								'descuento_estatus', descuento_estatus, 
								'descuento_nombre', descuento_nombre, 
								'total_venta', (select coalesce(sum(venta_precio_venta), 0) from venta_detalle where descuento_id = descuento.descuento_id and venta_id in (select venta_id from venta where turno_id = t.turno_id and venta_estatus = 1)),
                                'total_pasajeros', (select count(detalle_id) from venta_detalle where descuento_id = descuento.descuento_id and venta_id in (select venta_id from venta where turno_id = t.turno_id and venta_estatus = 1))
								)
							)
						FROM descuento
					) As detalle_tipo_descuento,
                    t.turno_estatus
                FROM 
                    turno AS t
                WHERE ${turnoEspecifico}
            `;
            db.get(sqlCmd, (error, data) => {
                let response = (error) ? { success: false, data: error, message: 'Error de base de datos' } : { success: true, data: data, message: 'Catalogo cargado correctamente' };
                resolve(response);
            });
        });
    }

    AbrirTurno(importeInicial, user_id){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                    INSERT INTO turno (
                        turno_fecha_apertura,
                        turno_fecha_cierre,
                        turno_usuario_apertura,
                        turno_usuario_cierre,
                        turno_efectivo_inicial,
                        turno_efectivo_final,
                        turno_efectivo_real,
                        turno_comentario,
                        turno_estatus
                    ) VALUES (datetime('now', 'localtime'), '', ?, ?, ?, 0, 0, '', 1);`,
                data = [
                    user_id,
                    user_id,
                    importeInicial
                ];

            db.run(sqlCmd, data, (error) => {
                if(error){
                    resolve({ success: false, data: error, message: 'Error al tratar de abrir el turno, contacte con soporte.' });
                } else {
                    db.get('SELECT last_insert_rowid() as id', function (err, row) {
                        resolve({ success: true, message: 'Se abrio un nuevo turno.', turno_id: row.id });
                   });
                }
            });
        });
    }

    Sale(data){
        return new Promise((resolve, reject) => {
            let complementoFolio = `
                SELECT ${data.venta_folio} || PRINTF('%03d', (count(venta_id) +1)) FROM venta WHERE venta_sucursal = '${data.sucursal}' AND venta_fecha = date('now', 'localtime') AND venta_estatus = 1
            `;

            let sqlCmd = `
                    INSERT INTO venta (
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
                    ) VALUES (?, ?, ?, ?, (${complementoFolio}), ?, date('now', 'localtime'), time('now', 'localtime'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1);`,
                parrams = [
                    data.turno_id,
                    data.usuario_id,
                    data.corrida_id,
                    data.horario_id,
                    data.sucursal,
                    data.venta_cantidad,
                    data.venta_ocupacion_real,
                    data.venta_ocupacion_especial,
                    data.venta_total,
                    data.venta_descuento,
                    data.venta_efectivo,
                    data.venta_cambio,
                    data.venta_tarjeta,
                    data.venta_marca,
                    data.venta_tipo,
                    data.venta_autorizacion,
                    data.venta_operacion
                ];

            db.run(sqlCmd, parrams, (error) => {
                if(error){
                    resolve({ success: false, data: error, message: 'Error al tratar de registrar la venta, contacte con soporte.' });
                } else {
                    db.get('SELECT last_insert_rowid() as venta_id, (select venta_folio from venta where venta_id = last_insert_rowid()) as venta_folio', function (err, row) {
                        resolve({ success: true, message: 'Venta registrada correctamente.', data: row });
                   });
                }
            });
        });
    }

    SaleTicket(data){
        return new Promise((resolve, reject) => {
            let complementoFolio = `
                SELECT (SELECT venta_folio FROM venta WHERE venta_id = ${data.venta_id}) || PRINTF('%02d', (count(detalle_id) +1)) FROM venta_detalle WHERE venta_id = ${data.venta_id} AND detalle_estatus = 1
            `;

            let complementoSilla = `
                SELECT PRINTF('%02d', (count(detalle_id) +1)) FROM venta_detalle WHERE detalle_estatus = 1 AND venta_id in (SELECT venta_id FROM venta WHERE horario_id = ${data.horario_id} AND venta_estatus = 1 ORDER BY 1 DESC LIMIT 1)
            `;

            let complementoPrecioBase = `
                SELECT corrida_precio FROM corrida WHERE corrida_id = ${data.corrida_id}
            `;

            let complementoDescuento = data.descuento_id == 0 ? 0 : `(SELECT descuento_porcentaje FROM descuento WHERE descuento_id = ${data.descuento_id})`;

            let complementoDescuentoNombre = data.descuento_id == 0 ? '""' : `(SELECT descuento_nombre FROM descuento WHERE descuento_id = ${data.descuento_id})`;

            let complementoDescuentoVenta = data.descuento_id == 0 ? `(${complementoPrecioBase})` :
                `(SELECT (SELECT CAST(corrida_precio AS REAL) FROM corrida WHERE corrida_id = ${data.corrida_id}) * ((100 - CAST(descuento_porcentaje AS REAL)) / 100)  FROM descuento WHERE descuento_id = ${data.descuento_id})`;

            let sqlCmd = `
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
                        detalle_beneficiario,
                        detalle_asiento,
                        detalle_estatus,
                        detalle_credencial,
                        detalle_genero
                    ) VALUES (?, ?, ?, (${complementoFolio}), ?, date('now', 'localtime'), time('now', 'localtime'), (${complementoPrecioBase}), ${complementoDescuento}, ${complementoDescuentoNombre}, ${complementoDescuentoVenta}, ?, (${complementoSilla}), 1, ?, ?);`,
                parrams = [
                    data.venta_id,
                    data.descuento_id,
                    data.motivo_id,
                    data.detalle_sucursal,
                    data.detalle_beneficiario,
                    data.detalle_credencial,
                    data.detalle_genero
                ];

            db.run(sqlCmd, parrams, (error) => {
                if(error){
                    resolve({ success: false, data: error, message: 'Error al tratar de registrar la venta, contacte con soporte.' });
                } else {
                    db.get('SELECT last_insert_rowid() as tiket_id, (select detalle_folio from venta_detalle where detalle_id = last_insert_rowid()) as folio', function (err, row) {
                        resolve({ success: true, message: 'Ticket registrado correctamente.', data: row });
                   });
                }
            });
        });
    }

    GetMovimientoEffectivo(turno_id){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT 
                    me.movimiento_id,
                    me.turno_id,
                    me.usuario_id,
                    me.movimiento_fecha,
                    me.movimiento_tipo,
                    me.movimiento_importe,
                    me.movimiento_comentario,
                    u.usuario_propietario
                FROM movimiento_efectivo AS me 
                INNER JOIN usuario AS u ON me.usuario_id = u.usuario_id
                WHERE me.turno_id = ?;
            `;

            db.all(sqlCmd, [turno_id], (error, data) => {
                let response = (error) ? { success: false, data: [], message: 'Error al cargar el catalogo'} : { success: true, data: data, message: 'Catalogo cargado correctamente' };
                resolve(response);
            });
        });
    }

    DelMovimientoEfectivo(movimientoId){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                    DELETE FROM movimiento_efectivo WHERE movimiento_id = ?
                `;

            db.run(sqlCmd, movimientoId, (error) => {
                let response = (error) ? { success: false, data: error, message: 'Error al tratar de eliminar el registro'} : { success: true, message: 'Registro eliminado correctamente' };
                resolve(response);
            });
        });
    }

    SetMovimientoEfectivo(data){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                INSERT INTO movimiento_efectivo (
                    turno_id, 
                    usuario_id, 
                    movimiento_fecha, 
                    movimiento_tipo, 
                    movimiento_importe, 
                    movimiento_comentario
                ) VALUES (?, ?, datetime('now', 'localtime'), ?, ?, ?)
            `,
            parameters = [
                data.turno_id,
                data.usuario_id,
                data.inputMovimientoTipo,
                data.inputMovimientoImporte,
                data.inputMovimientoComentario
            ];

            db.run(sqlCmd, parameters, (error) => {
                let response = (error) ? { success: false, message: 'Error al trara de registrar el movimiento' } : { success: true, message: 'Movimiento Registrado correctamente' };
                resolve(response);
            });
        });
    }

    GetHistorialVenta(turno_id){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT 
                    v.venta_id, 
                    v.venta_folio,
                    v.venta_sucursal,
                    v.venta_fecha,
                    v.venta_hora,
                    v.venta_cantidad,
                    v.venta_total,
                    v.venta_descuento,
                    v.venta_efectivo,
                    v.venta_cambio,
                    v.venta_tarjeta,
                    v.venta_marca,
                    v.venta_tipo,
                    v.venta_autorizacion,
                    v.venta_operacion,
                    u.usuario_propietario AS cajero,
                    c.corrida_origen,
                    c.corrida_destino,
                    h.horario_salida,
                    a.autobus_nombre,
                    (
                        SELECT 
                            json_group_array( 
                                json_object(
                                    'detalle_id', d.detalle_id,
                                    'detalle_folio', d.detalle_folio,
                                    'venta_precio_base', d.venta_precio_base,
                                    'descuento_id', d.descuento_id,
                                    'venta_descuento', d.venta_descuento,
                                    'venta_descuento_nombre', d.venta_descuento_nombre,
                                    'venta_precio_venta', d.venta_precio_venta,
                                    'detalle_beneficiario', d.detalle_beneficiario,
                                    'detalle_asiento', d.detalle_asiento
                                )
                            )
                        FROM venta_detalle AS d
                        WHERE d.detalle_estatus = 1 AND d.venta_id = v.venta_id
                    ) AS detalle_venta
                FROM venta AS v
                INNER JOIN usuario AS u ON v.usuario_id = u.usuario_id
                INNER JOIN corrida AS c ON v.corrida_id = c.corrida_id
                INNER JOIN horario AS h ON v.horario_id = h.horario_id
                INNER JOIN autobus AS a ON h.autobus_id = a.autobus_id
                WHERE v.turno_id = ?;
            `;

            db.all(sqlCmd, turno_id, (error, data) => {
                let response = (error) ? { success: false, data: [], message: 'Error al tratar de recuperar el historial de ventas' } : { success: true, data: data, message: 'Historial cargada correctamente' };
                resolve(response);
            });
        });
    }

    CerrarTurno(data){
        let sqlCmd = `
                UPDATE turno SET
                    turno_fecha_cierre = datetime('now', 'localtime'),
                    turno_usuario_cierre = ?,
                    turno_efectivo_final = ?,
                    turno_efectivo_real = ?,
                    turno_venta_tarjeta = ?,
                    turno_venta_total = ?,
                    turno_estatus = 2
                WHERE (turno_id = ?)
            `,
            parameters = [
                data.usuario_id,
                parseFloat(data.efectivo_final),
                parseFloat(data.efectivo_real),
                parseFloat(data.ventaTarjeta),
                parseFloat(data.ventaTotal),
                data.turno_id
            ];

        return new Promise((resolve, reject) => {
            db.run(sqlCmd, parameters, (error) => {
                let response = (error) ? { success: false, data: error, message: 'Error al tratar de cerrar el turno' } : { success: true, message: 'Turno cerrado correctamente' };
                resolve(response);
            });
        });
    }

    GetTurnos(){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT 
                    t.turno_id,
                    t.turno_fecha_apertura,
                    ua.usuario_propietario As usuario_apertura,
                    t.turno_fecha_cierre,
                    uc.usuario_propietario As usuario_cierre,
                    t.turno_efectivo_inicial,
                    t.turno_efectivo_final,
                    t.turno_efectivo_real,
                    t.turno_venta_tarjeta,
                    t.turno_venta_total,
                    t.turno_comentario,
                    t.turno_estatus
                FROM turno As t
                INNER JOIN usuario As ua ON t.turno_usuario_apertura = ua.usuario_id
                INNER JOIN usuario As uc ON t.turno_usuario_cierre = uc.usuario_id
                ORDER BY t.turno_id DESC
            `;

            db.all(sqlCmd, [], (error, data) => {
                let response = (error) ? { success: false, data: [], message: 'Error al tratar de recuperar el historial de turnos' } : { success: true, data: data, message: 'Historial cargada correctamente' };
                resolve(response);
            });
        });
    }

    GetVentaForTicket(venta_id){
        return new Promise((resolve, reject) => {
            let sqlCmd = `
                SELECT 
                    v.venta_id, 
                    v.venta_folio,
                    v.venta_sucursal,
                    v.venta_fecha,
                    v.venta_hora,
                    v.venta_cantidad,
                    v.venta_total,
                    v.venta_descuento,
                    v.venta_efectivo,
                    v.venta_cambio,
                    v.venta_tarjeta,
                    v.venta_marca,
                    v.venta_tipo,
                    v.venta_autorizacion,
                    v.venta_operacion,
                    u.usuario_propietario AS cajero,
                    c.corrida_origen,
                    c.corrida_destino,
                    h.horario_salida,
                    a.autobus_nombre,
                    (
                        SELECT 
                            json_group_array( 
                                json_object(
                                    'detalle_id', d.detalle_id,
                                    'detalle_folio', d.detalle_folio,
                                    'venta_precio_base', d.venta_precio_base,
                                    'descuento_id', d.descuento_id,
                                    'venta_descuento', d.venta_descuento,
                                    'venta_descuento_nombre', d.venta_descuento_nombre,
                                    'venta_precio_venta', d.venta_precio_venta,
                                    'detalle_beneficiario', d.detalle_beneficiario,
                                    'detalle_asiento', d.detalle_asiento,
                                    'detalle_credencial', d.detalle_credencial
                                )
                            )
                        FROM venta_detalle AS d
                        WHERE d.detalle_estatus = 1 AND d.venta_id = v.venta_id
                    ) AS detalle_venta,
                    (select configuracion_valor from configuracion where configuracion_clave = 'cnf_empresa') AS configuracion
                FROM venta AS v
                INNER JOIN usuario AS u ON v.usuario_id = u.usuario_id
                INNER JOIN corrida AS c ON v.corrida_id = c.corrida_id
                INNER JOIN horario AS h ON v.horario_id = h.horario_id
                INNER JOIN autobus AS a ON h.autobus_id = a.autobus_id
                WHERE v.venta_id = ?;
            `;

            db.get(sqlCmd, venta_id, (error, data) => {
                let response = (error) ? { success: false, data: [], message: 'Error al tratar de recuperar la venta' } : { success: true, data: data, message: 'Venta cargada correctamente' };
                resolve(response);
            });
        });
    }

    procesaCopia(sucursal) {
        return new Promise((resolve, reject) => {
            try {
                sql.connect(this.sqlConfig, function (err) {
                    if (err) {
                        logToFile('Error al tratar de conectar con el servidor de base de datos: ' + JSON.stringify( err ), 'disse-tickets.log', '\r\n');
                        return resolve(false);
                    }
        
                    let request = new sql.Request();
                    let sqlCmd  = `
                        SELECT 
                            COALESCE(MAX(local_id), 0) AS venta_id, 
                            (SELECT COALESCE(MAX(local_id), 0) FROM venta_detalle WHERE detalle_sucursal = '${sucursal}') AS detalle_id
                        FROM venta 
                        WHERE venta_sucursal = '${sucursal}'
                    `;
        
                    request.query(sqlCmd, function (err2, result) {
                        if (err2) {
                            logToFile('Error al obtener el recuento de los registros sincronizados', 'disse-tickets.log', '\r\n');
                            return resolve(false);
                        }
                        
                        let ultimoRegistroVenta         = result.recordset[0].venta_id;
                        let ultimoRegistroVentaDetalle  = result.recordset[0].detalle_id;
                        let ultimoRegistroPasajero      = result.recordset[0].pasajero_id;
        
                        let sqLiteCmd = `
                            SELECT * FROM venta WHERE venta_id > ? AND venta_estatus = 1
                        `;
        
                        db.all(sqLiteCmd, [ultimoRegistroVenta], (err3, data) => {
                            if (err3) {
                                logToFile('Error al obtener los detalles de las ventas', 'disse-tickets.log', '\r\n');
                                return resolve(false);
                            }
        
                            let reqVentas = new sql.Request();
                            let sqlCmd = `
                                INSERT INTO venta 
                                    (
                                        local_id, 
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
                                        venta_estatus
                                    )
                                VALUES 
                            `;
        
                            let sqlValues = [];
        
                            data.forEach(function(venta, index) {
                                let ventaSinImuesto = (venta.venta_total / 1.16).toFixed(2);
                                let ventaImpuesto = (venta.venta_total - ventaSinImuesto).toFixed(2);

                                sqlValues.push(`(
                                    ${venta.venta_id}, 
                                    ${venta.turno_id}, 
                                    ${venta.usuario_id}, 
                                    ${venta.corrida_id}, 
                                    ${venta.horario_id}, 
                                    '${venta.venta_folio}',
                                    '${venta.venta_sucursal}',
                                    '${venta.venta_fecha}',
                                    '${venta.venta_hora}',
                                    SYSDATETIME(),
                                    ${venta.venta_cantidad},
                                    ${venta.venta_ocupacion_real},
                                    ${venta.venta_ocupacion_especial},
                                    ${ venta.venta_total + venta.venta_descuento},
                                    ${venta.venta_total},
                                    ${ventaSinImuesto},
                                    ${ventaImpuesto},
                                    ${venta.venta_descuento},
                                    ${venta.venta_efectivo},
                                    ${venta.venta_cambio},
                                    ${venta.venta_tarjeta},
                                    '${venta.venta_marca}',
                                    '${venta.venta_tipo}',
                                    '${venta.venta_autorizacion}',
                                    '${venta.venta_operacion}',
                                    1
                                )`);
                            });
        
                            sqlCmd += `${ sqlValues.join(',') };`;

                            if( sqlValues.length > 0 ) {
                                reqVentas.query(sqlCmd, (err4, result) => {
                                    if (err4) {
                                        console.log(err4);
                                        logToFile('Error al procesar los detalles de las ventas', 'disse-tickets.log', '\r\n');
                                        return resolve(false);
                                    }
            
                                    let sqLiteCmd = `
                                        SELECT * FROM venta_detalle WHERE detalle_id > ? AND detalle_estatus = 1
                                    `;
            
                                    db.all(sqLiteCmd, [ultimoRegistroVentaDetalle], (err5, data) => {
                                        if (err5) {
                                            logToFile('Error al obtener los detalles de los boletos', 'disse-tickets.log', '\r\n');
                                            return resolve(false);
                                        }
            
                                        let reqDetalles = new sql.Request();
                                        let sqlCmd = `
                                            INSERT INTO venta_detalle 
                                                (
                                                    local_id, 
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
                                                )
                                            VALUES 
                                        `;
            
                                        let sqlValues = [];
            
                                        data.forEach(function(detalle, index) {
                                            let ventaSinImuesto = (detalle.venta_precio_venta / 1.16).toFixed(2);
                                            let ventaImpuesto = (detalle.venta_precio_venta - ventaSinImuesto).toFixed(2);

                                            sqlValues.push(`(
                                                ${detalle.detalle_id},
                                                ${detalle.venta_id},
                                                ${detalle.descuento_id},
                                                ${detalle.motivo_id},
                                                '${detalle.detalle_folio}',
                                                '${detalle.detalle_sucursal}',
                                                '${detalle.detalle_fecha}',
                                                '${detalle.detalle_hora}',
                                                ${detalle.venta_precio_base},
                                                ${detalle.venta_descuento},
                                                '${detalle.venta_descuento_nombre}',
                                                ${detalle.venta_precio_venta},
                                                ${ventaSinImuesto},
                                                ${ventaImpuesto},
                                                '${detalle.detalle_beneficiario}',
                                                '${detalle.detalle_asiento}',
                                                1,
                                                '${detalle.detalle_credencial}',
                                                '${detalle.detalle_genero}'
                                            )`);
                                        });
            
                                        sqlCmd += `${ sqlValues.join(',') };`;
            
                                        reqDetalles.query(sqlCmd, (err6, result) => {
                                            if (err6) {
                                                logToFile('Error al procesar los detalles de los boletos', 'disse-tickets.log', '\r\n');
                                                return resolve(false);
                                            }
                                            
                                            resolve(true);
                                        });
                                    });
                                });
                            } else {
                                resolve(true);
                            }
                        });
                    });
                });

                sql.on('error', err => {
                    logToFile('Error al tratar de conectar con el servidor de base de datos: ', 'disse-tickets.log', '\r\n');
                    resolve(false);
                })
            } catch (error) {
                logToFile('Error general al procesar la sincronización de datos', 'disse-tickets.log', '\r\n');
                resolve(false);
            }
            
        });
    }
}

module.exports = new VentaModel();