let toolModel = require('../models/tool.model');
const { logToFile } = require('../controllers/auxiliar.controller');

const sucursalId = 3;
const sucursalClave = '02';

let transactionTurnos   = [];
let transactionVentas   = [];
let transactionDetalles = [];

class ToolController {
    Migrate(req, res) {
        toolModel.GetTurnos()
        .then( async response => { 
            if(response.success) {
                console.log(`[[COMIENZA LA ITERACION]]`);
                await ToolController.asyncForEach(response.data, async (turno) => {
                    turno.sucursal_id = sucursalId;

                    let registroTruno = await toolModel.CreateTurno(turno);
                    transactionTurnos.push(registroTruno);
                    logToFile('Resultado turno: ' + JSON.stringify(registroTruno), 'disse-tickets.log', '\r\n');
                    console.log(registroTruno);

                    if(registroTruno.success){
                        let registroVenta = await ToolController.migrateVenta(registroTruno);
                    }
                });
                console.log(`[[FINALIZA LA ITERACION]]`);
            }

            return res.status( 200 ).json( {transactionTurnos, transactionVentas, transactionDetalles });
        } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    static migrateVenta( registroTruno ) {
        return new Promise((resolve, reject) => {
            toolModel.GetVentas( registroTruno.turno_id )
            .then( async response => {
                if(response.success) {
                    await ToolController.asyncForEach(response.data, async (venta) => {
                        venta.venta_sucursal = sucursalClave;
                        venta.turno_id = registroTruno.new_turno_id;
                        venta.ventaTotalSinDescuento = parseFloat( venta.venta_total ) + parseFloat( venta.venta_descuento );
                        venta.ventaTotalSinImpuesto = (venta.venta_total / 1.16).toFixed(2);
                        venta.ventaTotalConImpuesto = (venta.venta_total - venta.ventaTotalSinImpuesto).toFixed(2);
                        venta.ventaFechaHora = `${venta.venta_fecha} ${venta.venta_hora}`;

                        let registroVenta = await toolModel.CreateVenta(venta);
                        transactionVentas.push(registroVenta);
                        console.log(registroVenta);
                        logToFile('Resultado venta: ' + JSON.stringify(registroVenta), 'disse-tickets.log', '\r\n');

                        if(registroVenta.success){
                            let registroDetalle = await ToolController.migrateDetalle(registroVenta);
                        }
                    });

                    resolve(true);
                } else {
                    transactionVentas.push({success: false, error: `No se pudieron leer los registros de ventas del turno ${registroTruno.turno_id}`});
                    resolve(false);
                }
            })
            .catch( error => { 
                transactionVentas.push({success: false, error: `No se pudieron leer los registros de ventas del turno ${registroTruno.turno_id}`});
                resolve(false); 
            });
        });
    }

    static migrateDetalle( registroVenta ) {
        return new Promise((resolve, reject) => {
            toolModel.GetDetalles( registroVenta.venta_id )
            .then( async response => {
                if(response.success) {
                    await ToolController.asyncForEach(response.data, async (detalle) => {
                        detalle.detalle_sucursal = sucursalClave;
                        detalle.venta_id = registroVenta.new_venta_id;

                        detalle.venta_precio_sin_impuesto = (detalle.venta_precio_venta / 1.16).toFixed(2);
                        detalle.venta_precio_impuesto = (detalle.venta_precio_venta - detalle.venta_precio_sin_impuesto).toFixed(2);

                        let registroDetalle = await toolModel.CreateDetalle(detalle);
                        transactionDetalles.push(registroDetalle);
                        console.log(registroDetalle);
                        logToFile('Resultado detalle: ' + JSON.stringify(registroDetalle), 'disse-tickets.log', '\r\n');
                    });

                    resolve(true);
                } else {
                    transactionDetalles.push({success: false, error: `No se pudieron leer los registros de detalle de la venta ${registroVenta.venta_id}`});
                    resolve(false);
                }
            })
            .catch( error => { 
                transactionDetalles.push({success: false, error: `No se pudieron leer los registros de detalle de la venta ${registroVenta.venta_id}`});
                resolve(false); 
            });
        });
    }

    static async asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
          await callback(array[index], index, array);
        }
    }
}

module.exports = new ToolController();