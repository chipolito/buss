let autobusModel = require('../models/autobus.model');

const { setAuditoria } = require('../controllers/auxiliar.controller');

class AutobusController {
    Set (req, res) {
        autobusModel.Set(req.body)
        .then( response => { 
            let toAuditoria = {
                usuario_id: req.session.authData.usuario_id,
                modulo: 'Autobus',
                accion: 'Registró un nuevo autobus',
                detalle: JSON.stringify(req.body),
                sucursal_id: req.session.sucursalId
            };

            setAuditoria(toAuditoria);

            return res.status( 201 ).json( response ); 
        })
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    Get(req, res) {
        autobusModel.Get()
        .then( response => { return res.status( 200 ).json( response ); } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    Del(req, res) {
        autobusModel.Del( req.body.autobusId )
        .then( response => { 
            let toAuditoria = {
                usuario_id: req.session.authData.usuario_id,
                modulo: 'Autobus',
                accion: 'Eliminó un autobus',
                detalle: JSON.stringify({autobusId: req.body.autobusId}),
                sucursal_id: req.session.sucursalId
            };

            setAuditoria(toAuditoria);

            return res.status( 200 ).json( response ); 
        } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }
}

module.exports = new AutobusController();