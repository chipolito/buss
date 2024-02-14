let descuentoModel = require('../models/descuento.model');

const { setAuditoria } = require('../controllers/auxiliar.controller');

class DescuentoController {
    Set (req, res) {
        descuentoModel.Set(req.body)
        .then( response => { 
            let toAuditoria = {
                usuario_id: req.session.authData.usuario_id,
                modulo: 'Descuentos',
                accion: 'Registró un nuevo descuento',
                detalle: JSON.stringify(req.body),
                sucursal_id: req.session.sucursalId
            };

            setAuditoria(toAuditoria);

            return res.status( 201 ).json( response ); 
        } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    Get(req, res) {
        descuentoModel.Get()
        .then( response => { return res.status( 200 ).json( response ); } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    Del(req, res) {
        descuentoModel.Del( req.body.descuentoId )
        .then( response => { 
            let toAuditoria = {
                usuario_id: req.session.authData.usuario_id,
                modulo: 'Descuentos',
                accion: 'Eliminó un registro de descuento',
                detalle: JSON.stringify(req.body),
                sucursal_id: req.session.sucursalId
            };

            setAuditoria(toAuditoria);

            return res.status( 200 ).json( response ); 
        } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }
}

module.exports = new DescuentoController();