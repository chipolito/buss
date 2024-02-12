let motivoModel = require('../models/motivo.model');

class MotivoController {
    Get(req, res) {
        motivoModel.Get()
        .then( response => { return res.status( 200 ).json( response ); } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }
}

module.exports = new MotivoController();