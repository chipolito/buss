let logModel = require('../models/log.model');

class LogController {

    Get(req, res) {
       let complemento = req.session.authData.usuario_tipo == 1 ? '' : `WHERE a.usuario_id = ${ req.session.authData.usuario_id }`;

        logModel.Get( complemento )
        .then( response => { return res.status( 200 ).json( response ); } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }
}

module.exports = new LogController();