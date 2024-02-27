const puppeteer     = require('puppeteer');
const cheerio       = require('cheerio');
const fs            = require('fs');
const { print }     = require('pdf-to-printer');

let ventaModel = require('../models/venta.model');
const { getConfiguracion, generaFolioUnico, setAuditoria } = require('../controllers/auxiliar.controller');

class VentaController {
    Configuracion(req, res) {
        ventaModel.GetTurno(0, req.session.sucursalId, 0)
        .then( async response => { 
            let authData                    = req.session.authData,
                jsonPermiso                 = JSON.parse(authData.usuario_permiso),
                permisoHistorialVenta       = authData.usuario_tipo == 1 ? true : jsonPermiso.includes( 'p2' ) ? true : false,
                permisoMovimientoEfectivo   = authData.usuario_tipo == 1 ? true : jsonPermiso.includes( 'p3' ) ? true : false,
                permisoCorteCaja            = authData.usuario_tipo == 1 ? true : jsonPermiso.includes( 'p4' ) ? true : false,
                permisoReimpresion          = authData.usuario_tipo == 1 ? true : jsonPermiso.includes( 'p11' ) ? true : false;

            let configuracion = {
                turno: response,
                base: await getConfiguracion('cnf_base', req.session.sucursalId),
                comercio: await getConfiguracion('cnf_empresa', req.session.sucursalId),
                authData,
                permisoHistorialVenta,
                permisoMovimientoEfectivo,
                permisoCorteCaja,
                permisoReimpresion
            };

            return res.status( 200 ).json( configuracion ); 
        } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    AbrirTurno(req, res) {
        let authData = req.session.authData;

        ventaModel.AbrirTurno(req.body.importeInicial, authData.usuario_id, req.session.sucursalId)
        .then(async response => { 
            if(response.success){
                response.miTurno = await ventaModel.GetTurno(0, req.session.sucursalId, 0);

                let toAuditoria = {
                    usuario_id: authData.usuario_id,
                    modulo: 'Ventas',
                    accion: 'Abrió nuevo turno de caja.',
                    detalle: JSON.stringify({importeInicial: req.body.importeInicial, turno: response.miTurno.turno_id}),
                    sucursal_id: req.session.sucursalId
                };

                setAuditoria(toAuditoria);
            }
            
            return res.status( 200 ).json( response ); 
        })
        .catch(error => { return res.status( 500 ).json({success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' }); });
    }

    Sale(req, res) {
        let dataSale    = req.body;
        let authData    = req.session.authData;
       
        dataSale.usuario_id = authData.usuario_id;
        dataSale.venta_folio = generaFolioUnico(req.session.sucursalClave);
        dataSale.sucursal = req.session.sucursalClave;
        
        ventaModel.Sale(dataSale)
        .then( async response => { 
            if(response.success){
                const configuracion = await getConfiguracion('cnf_base', req.session.sucursalId);
                const objConfiguracion = JSON.parse( configuracion.data );

                let colaImpresion = [];

                await VentaController.asyncForEach(dataSale.boletos, async (boleto) => {
                    let venta_detalle = {
                            venta_id: response.data.venta_id,
                            horario_id: dataSale.horario_id,
                            corrida_id: dataSale.corrida_id,
                            descuento_id: parseInt(boleto.inputBoleto),
                            motivo_id: parseInt(boleto.inputMotivo),
                            detalle_sucursal: dataSale.sucursal,
                            detalle_beneficiario: boleto.inputNombrePasajero,
                            detalle_credencial: boleto.inputFolioCredencial,
                            detalle_genero: boleto.rdoGenero
                        };

                    let ticket = await ventaModel.SaleTicket(venta_detalle);

                    if(ticket.success)
                        colaImpresion.push( { forma: 'boleto', venta_id: response.data.venta_id, folio: ticket.data.folio, ticket: ticket.data.tiket_id } );
                });

                // ventaModel.procesaCopia(dataSale.sucursal);

                if(objConfiguracion.inputBaseImpresora != '0') {
                    let impresora = { name: objConfiguracion.inputBaseImpresora, size: objConfiguracion.inputBaseImpresoraTamanio };

                    await VentaController.printTicket('ticket', response.data.venta_id,  response.data.venta_folio, 0, impresora, req.session.sucursalId);

                    await VentaController.asyncForEach(colaImpresion, async (boleto) => {
                        await VentaController.printTicket(boleto.forma, boleto.venta_id,  boleto.folio, boleto.ticket, impresora, req.session.sucursalId);
                    });
                }

                let toAuditoria = {
                    usuario_id: authData.usuario_id,
                    modulo: 'Ventas',
                    accion: 'Vendió nuevo boleto.',
                    detalle: JSON.stringify({ventaId: response.data.venta_id, folio: response.data.venta_folio}),
                    sucursal_id: req.session.sucursalId
                };

                setAuditoria(toAuditoria);
            }

            return res.status( 201 ).json( response );
        })
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    GetMovimientoEffectivo(req, res) {
        ventaModel.GetMovimientoEffectivo(req.params.turno_id)
        .then( response => { return res.status( 200 ).json( response ) })
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    DelMovimientoEfectivo(req, res) {
        ventaModel.DelMovimientoEfectivo(req.body.movimientoId)
        .then( response => { 
            let toAuditoria = {
                usuario_id: req.session.authData.usuario_id,
                modulo: 'Ventas',
                accion: 'Eliminó un registro de movimiento de efectivo.',
                detalle: JSON.stringify({registroId: req.body.movimientoId}),
                sucursal_id: req.session.sucursalId
            };

            setAuditoria(toAuditoria);

            return res.status( 200 ).json( response ) 
        })
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    SetMovimientoEfectivo(req, res) {
        req.body.usuario_id = req.session.authData.usuario_id;

        ventaModel.SetMovimientoEfectivo(req.body)
        .then( response => { 
            let toAuditoria = {
                usuario_id: req.session.authData.usuario_id,
                modulo: 'Ventas',
                accion: 'Registró un movimiento de efectivo.',
                detalle: JSON.stringify(req.body),
                sucursal_id: req.session.sucursalId
            };

            setAuditoria(toAuditoria);

            return res.status( 200 ).json( response ) 
        })
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    GetHistorialVenta(req, res) {
        ventaModel.GetHistorialVenta(req.params.turno_id)
        .then( response => { return res.status( 200 ).json( response ) })
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    GetTurno(req, res) {
        let turno_id = req.params.turnoid,
            sucursal_id = req.params.sucursal_id == 0 ? req.session.sucursalId : req.params.sucursal_id,
            turnoWeb = req.params.turno_web;

        ventaModel.GetTurno( turno_id, sucursal_id, turnoWeb )
        .then( response => { return res.status( 200 ).json( response ); } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    async CerrarTurno(req, res){
        // let continua = await ventaModel.procesaCopia();

        // if( continua ) {
            req.body.usuario_id = req.session.authData.usuario_id;
        
            ventaModel.CerrarTurno(req.body)
            .then(response => { 
                let toAuditoria = {
                    usuario_id: req.session.authData.usuario_id,
                    modulo: 'Ventas',
                    accion: 'Cierre de turno.',
                    detalle: JSON.stringify(req.body),
                    sucursal_id: req.session.sucursalId
                };
    
                setAuditoria(toAuditoria);

                return res.status( 200 ).json( response ); 
            })
            .catch(error => { return res.status( 500 ).json({success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' }); });
        // } else {
        //     return res.status( 200 ).json({success: false, data: [], message: 'No se puede cerrar el turno actual, existen registros sin poder sincronizarse con el servidor.' });
        // }
    }

    GetTurnos(req, res){
        ventaModel.GetTurnos( req.session.sucursalId )
        .then(response => { return res.status(200).json(response); })
        .catch(error => { return res.status(500).json({success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' }); });
    }

    async GeneraPdfCorte(req, res) {
        let doctoHtml   = fs.readFileSync(`./src/views/formas/arqueo.html`, 'utf8'),
            $           = cheerio.load(doctoHtml),
            nameFile    = `${(Math.floor(Date.now() / 1000)).toString()}.pdf`,
            turno_id    = req.body.turno_id,
            turno_web   = req.body.turno_web;

        $('#turno_id').html(turno_id);
        $('#sucursal_id').html(req.session.sucursalId);
        $('#turno_web').html(turno_web);

        try {

            const browser = await puppeteer.launch({
                executablePath: 'C://Program Files//Google//Chrome//Application//chrome.exe',
                headless: 'new'
            });

            const page = await browser.newPage();

            await page.setContent($.html(), { waitUntil: 'networkidle0' });

            await page.emulateMediaType('screen');

            const PDF = await page.pdf({
                path: `assets/formas/${nameFile}`,
                margin: { top: '40px', right: '0px', bottom: '40px', left: '0px' },
                printBackground: true,
                format: 'A4'
            });

            await browser.close();

            res.status(200).json({success: true, msg: 'Formato generado', file: nameFile});
        } catch (error) {
            res.status(200).json({success: false, msg: 'Ocurrió un error al tratar de generar el archivo de corte, inténtelo nuevamente'});
        }
    }

    GetVentaForTicket(req, res){
        ventaModel.GetVentaForTicket( req.params.venta_id, req.params.sucursal_id )
        .then(response => { return res.status(200).json(response); })
        .catch(error => { return res.status(500).json({success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' }); });
    }

    ActualizarDisponibilidad(req, res) {
        let horarioId = req.params.horarioId;

        ventaModel.ActualizarDisponibilidad( horarioId )
        .then( response => { return res.status( 200 ).json( response ); } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    static printTicket(forma = '', registro_id = 0, fileName = '', boleto_id = 0, impresora = {}, sucursalId) {
        return new Promise(async (resolve, reject) => {
            let doctoHtml   = fs.readFileSync(`./src/views/formas/${forma}.html`, 'utf8'),
                $           = cheerio.load(doctoHtml),
                strName     = `${fileName}.pdf`;

            $('#registro_id').val(registro_id);
            $('#boleto_id').val(boleto_id);
            $('#sucursal_id').val(sucursalId);

            const browser = await puppeteer.launch({
                executablePath: 'C://Program Files//Google//Chrome//Application//chrome.exe',
                headless: 'new'
            });

            const page = await browser.newPage();

            await page.setContent($.html(), { waitUntil: 'networkidle0' });

            await page.emulateMediaType('screen');

            await page.pdf({
                path: `assets/formas/${strName}`,
                margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
                printBackground: true,
                width: impresora.size
            });

            await browser.close();

            const options = {
                printer: impresora.name,
                scale: 'noscale',
                orientation: 'portrait',
                monochrome: true
            };
            
            print(`assets/formas/${strName}`, options).then( resolve(true) );
        });
    }

    static async asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
          await callback(array[index], index, array);
        }
    }

    async Reimpresion(req, res){
        const configuracion = await getConfiguracion('cnf_base', req.session.sucursalId);
        const objConfiguracion = JSON.parse( configuracion.data );

        let message = 'No se ha configurado una impresora correcta.';

        if(objConfiguracion.inputBaseImpresora != '0') {

            let impresora = { name: objConfiguracion.inputBaseImpresora, size: objConfiguracion.inputBaseImpresoraTamanio };

            await VentaController.printTicket(req.body.forma, req.body.venta_id, req.body.venta_folio, req.body.boleto_id, impresora, req.session.sucursalId);

            let toAuditoria = {
                usuario_id: req.session.authData.usuario_id,
                modulo: 'Ventas',
                accion: 'Reimpresión de ticket de venta',
                detalle: JSON.stringify(req.body),
                sucursal_id: req.session.sucursalId
            };

            setAuditoria(toAuditoria);

            message = 'Reimpresion enviada correctamente';
        }

        return res.status( 200 ).json( { success: true, message });
    }
}

module.exports = new VentaController();