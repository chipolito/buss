let ajusteModel = require('../models/ajuste.model');
const { getPrinters }     = require('pdf-to-printer');

const { setAuditoria } = require('../controllers/auxiliar.controller');

class AjusteController {
    async Set (req, res) {
        let updateValues = await ajusteModel.Del(req.body.ajuste_clave);

        if ( updateValues ) {
            ajusteModel.Set(req.body)
            .then( response => { 
                let toAuditoria = {
                    usuario_id: req.session.authData.usuario_id,
                    modulo: 'Configuracion',
                    accion: 'Actualizó los parametros de configuración',
                    detalle: JSON.stringify(req.body)
                };
    
                setAuditoria(toAuditoria);
                return res.status( 201 ).json( response ); 
            } )
            .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
        } else {
            return res.status( 500 ).json( { success: false, data: error, message: 'Error de base de datos, contacte a soporte técnico' } );
        }
    }

    Get(req, res) {
        ajusteModel.Get()
        .then( async response => { 
            response.impresoras = await getPrinters();
            return res.status( 200 ).json( response ); 
        })
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }
}

module.exports = new AjusteController();