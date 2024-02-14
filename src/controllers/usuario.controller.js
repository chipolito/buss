let bcrypt          = require('bcrypt');
let usuarioModel    = require('../models/usuario.model');

const { setAuditoria } = require('../controllers/auxiliar.controller');

class UsuarioController {
    Set (req, res) {
        let data = req.body;

        data.sucursalId = req.session.sucursalId;

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
                    detalle: JSON.stringify(data),
                    sucursal_id: req.session.sucursalId
                };
    
                setAuditoria(toAuditoria);
            }

            return res.status( 201 ).json( response );
         } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    Get(req, res) {
        usuarioModel.Get( req.session.sucursalId )
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
                detalle: JSON.stringify(req.body),
                sucursal_id: req.session.sucursalId
            };

            setAuditoria(toAuditoria);

            return res.status( 200 ).json( response ); 
        } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    Sign(req, res) {
        let userInfo        = req.body,
            sucursalClave   = process.env.CLAVESUCURSAL;

        usuarioModel.Sign(userInfo.username, sucursalClave)
        .then(response => {
            let result = {};

            if(!response.success){
                result = response
            } else if(response.data && response.data.usuario_id){
                let logged = bcrypt.compareSync(userInfo.password, response.data.usuario_contrasenia);

                delete response.data.usuario_contrasenia;

                if(logged){
                    result = { success: true, message: `Bienvenido ${response.data.usuario_propietario}` };

                    req.session.isLoggedIn      = true;
                    req.session.createdAt       = Date.now();
                    req.session.sucursalClave   = sucursalClave;
                    req.session.sucursalId      = response.data.sucursal_id;

                    delete response.data.sucursal_id;

                    req.session.authData        = response.data;

                    let toAuditoria = {
                        usuario_id: req.session.authData.usuario_id,
                        modulo: 'Usuarios',
                        accion: 'Inició sesión en la aplicación',
                        detalle: JSON.stringify( req.session.authData ),
                        sucursal_id: req.session.sucursalId
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
                        detalle: JSON.stringify(req.body),
                        sucursal_id: req.session.sucursalId
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
                detalle: JSON.stringify(req.body),
                sucursal_id: req.session.sucursalId
            };

            setAuditoria(toAuditoria);

            return res.status( 201 ).json( response ); 
        })
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    };
}

module.exports = new UsuarioController();