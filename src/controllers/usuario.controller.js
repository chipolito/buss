let bcrypt          = require('bcrypt');
let usuarioModel    = require('../models/usuario.model');

const { setAuditoria } = require('../controllers/auxiliar.controller');

class UsuarioController {
    Set (req, res) {
        let data = req.body;

        data.inputContraseniaUsuario = bcrypt.hashSync(data.inputContraseniaUsuario, 10);

        usuarioModel.Set(data)
        .then( async response => { 
            if(response.success) {
                let permisos    = JSON.parse( data.permisos ),
                    sqlCmd      = `INSERT INTO usuario_permiso (usuario_id, permiso_id) VALUES `,
                    sqlValues   = [];
                    
                permisos.forEach(function(permiso, index) {
                    sqlValues.push(`(${response.usuario_id}, ${permiso})`);
                });

                sqlCmd += `${ sqlValues.join(',') };`;

                await usuarioModel.SetPermissions( sqlCmd );

                let toAuditoria = {
                    usuario_id: req.session.authData.usuario_id,
                    modulo: 'Usuarios',
                    accion: 'Registró un nuevo usuario',
                    detalle: JSON.stringify(data)
                };
    
                setAuditoria(toAuditoria);
            }

            return res.status( 201 ).json( response );
         } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    Get(req, res) {
        usuarioModel.Get()
        .then( response => { return res.status( 200 ).json( response ); } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    Del(req, res) {
        usuarioModel.Del( req.body.usuarioId )
        .then( response => { 
            let toAuditoria = {
                usuario_id: req.session.authData.usuario_id,
                modulo: 'Usuarios',
                accion: 'Eliminó el registro de un usuario',
                detalle: JSON.stringify(req.body)
            };

            setAuditoria(toAuditoria);

            return res.status( 200 ).json( response ); 
        } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    Sign(req, res) {
        let userInfo = req.body;

        usuarioModel.Sign(userInfo.username)
        .then(response => {
            let result = {};

            if(!response.success){
                result = response
            } else if(response.data && response.data.usuario_id){
                let logged = bcrypt.compareSync(userInfo.password, response.data.usuario_contrasenia);

                delete response.data.usuario_contrasenia;

                if(logged){
                    result = { success: true, message: `Bienvenido ${response.data.usuario_propietario}` };

                    req.session.authData    = response.data;
                    req.session.isLoggedIn  = true;
                    req.session.createdAt   = Date.now();

                    let toAuditoria = {
                        usuario_id: req.session.authData.usuario_id,
                        modulo: 'Usuarios',
                        accion: 'Inició sesión en la aplicación',
                        detalle: JSON.stringify( req.session.authData )
                    };
        
                    setAuditoria(toAuditoria);

                } else {
                    result = { success: false, message: 'Contraseña incorrecta' };
                }
            } else{
                result = { success: false, message: 'Usuario no exite' };
            }

            return res.status(200).json(result); 
        })
        .catch(error => { return res.status(200).json({success: false, data: error, message: "Error al procesar la petición" }); });
    }

    Put(req, res) {
        let data = req.body;

        usuarioModel.Put(data)
        .then( async response => { 
            if(response.success){
                let updatePermissions = await usuarioModel.DelPermissions( data.usuarioId );

                if( updatePermissions ) {
                    let permisos    = JSON.parse( data.permisos ),
                        sqlCmd      = `INSERT INTO usuario_permiso (usuario_id, permiso_id) VALUES `,
                        sqlValues   = [];
                        
                    permisos.forEach(function(permiso, index) {
                        sqlValues.push(`(${data.usuarioId}, ${permiso})`);
                    });

                    sqlCmd += `${ sqlValues.join(',') };`;

                    await usuarioModel.SetPermissions( sqlCmd );

                    let toAuditoria = {
                        usuario_id: req.session.authData.usuario_id,
                        modulo: 'Usuarios',
                        accion: 'Actualizó el registro de un usuario',
                        detalle: JSON.stringify(req.body)
                    };
        
                    setAuditoria(toAuditoria);
                }
            }

            return res.status( 201 ).json( response );
        })
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    };

    PutPassword(req, res) {
        let data = req.body;

        data.confirmPassword = bcrypt.hashSync(data.confirmPassword, 10);

        usuarioModel.PutPassword(data)
        .then( async response => {
            let toAuditoria = {
                usuario_id: req.session.authData.usuario_id,
                modulo: 'Usuarios',
                accion: 'Actualizó la contraseña de un usuario',
                detalle: JSON.stringify(req.body)
            };

            setAuditoria(toAuditoria);

            return res.status( 201 ).json( response ); 
        })
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    };
}

module.exports = new UsuarioController();