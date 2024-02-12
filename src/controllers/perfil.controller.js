let bcrypt          = require('bcrypt');
let perfilModel     = require('../models/perfil.model');

const { setAuditoria } = require('../controllers/auxiliar.controller');

class PerfilController {
    Get(req, res) {
        let userInfo = req.body;

        perfilModel.Get( req.session.authData.usuario_id )
        .then(async response => {
            let result = {};

            if(!response.success){
                result = { success: false, message: 'Error de base de datos'};
            } else if(response.data && response.data.usuario_contrasenia){
                let isCorrect = bcrypt.compareSync(userInfo.inputCurrentPass, response.data.usuario_contrasenia);

                if(isCorrect){

                    let confirmPassword = bcrypt.hashSync(userInfo.inputRepeatPass, 10);

                    await perfilModel.PutPassword( {confirmPassword, usuario_id: req.session.authData.usuario_id} );

                    result = { success: true, message: `Su contraseña se actualizó correctamente` };

                    let toAuditoria = {
                        usuario_id: req.session.authData.usuario_id,
                        modulo: 'Configuración',
                        accion: 'Actualización de contraseña',
                        detalle: JSON.stringify( {} )
                    };
        
                    setAuditoria(toAuditoria);

                } else {
                    result = { success: false, message: 'La contraseña actual no coincide' };
                }
            } else{
                result = { success: false, message: 'Usuario no exite' };
            }

            return res.status(200).json(result); 
        })
        .catch(error => { return res.status(200).json({success: false, data: error, message: "Error al procesar la petición" }); });
    }
}

module.exports = new PerfilController();