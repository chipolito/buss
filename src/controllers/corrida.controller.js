let corridaModel = require('../models/corrida.model');

const { setAuditoria } = require('../controllers/auxiliar.controller');

class CorridaController {
    Set (req, res) {
        let data = req.body;

        data.sucursalId = req.session.sucursalId;

        corridaModel.Set(data)
        .then( async response => { 
            if( response.success ) {
                let horarios = JSON.parse( data.inputHorario );
                horarios.forEach(async function(horario, index) {
                    await CorridaController.SetHorario(horario, response.corrida_id);
                });

                let toAuditoria = {
                    usuario_id: req.session.authData.usuario_id,
                    modulo: 'Corridas',
                    accion: 'Registró una nueva corrida',
                    detalle: JSON.stringify(req.body),
                    sucursal_id: data.sucursalId
                };
    
                setAuditoria(toAuditoria);
            }

            return res.status( 201 ).json( response );
        })
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    Put (req, res) {
        let data = req.body;

        data.sucursalId = req.session.sucursalId;

        corridaModel.Put(data)
        .then( async response => { 
            if( response.success) {
                let horarios    = JSON.parse( data.inputHorario );
                horarios.forEach(async function(horario, index) {
                    if( horario.horario_id == 0  ) {
                        await CorridaController.SetHorario(horario, data.inputIdCorrida);
                    } else {
                        await CorridaController.PutHorario(horario);
                    }
                });

                let inputEliminar = JSON.parse( data.inputEliminar );
                inputEliminar.forEach(async function(horario_id, index) {
                    await CorridaController.DelHorario(horario_id);
                });

                let toAuditoria = {
                    usuario_id: req.session.authData.usuario_id,
                    modulo: 'Corridas',
                    accion: 'Actualizó la informacion de la corrida',
                    detalle: JSON.stringify(req.body),
                    sucursal_id: data.sucursalId
                };
    
                setAuditoria(toAuditoria);
            }
            
            return res.status( 200 ).json( response );
        })
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    Get(req, res) {
        corridaModel.Get( req.session.sucursalId )
        .then( response => { 
            if(response.success) {
                response.data.forEach(function(corrida, index) {
                    let horarios = JSON.parse( corrida.corrida_horario ).sort((a, b) => {
                        let fechaA  = `2023-01-01T${ a.horario_salida }`;
                            
                        let fechaB  = `2023-01-01T${ b.horario_salida }`;

                        return new Date(fechaA).getTime() - new Date(fechaB).getTime();
                    });

                    response.data[index].corrida_horario = JSON.stringify( horarios );
                });
            }

            return res.status( 200 ).json( response ); 
        } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    Del(req, res) {
        corridaModel.Del( req.body.inputIdCorrida )
        .then( response => { 
            let toAuditoria = {
                usuario_id: req.session.authData.usuario_id,
                modulo: 'Corridas',
                accion: 'Eliminó la informacion de la corrida',
                detalle: JSON.stringify(req.body),
                sucursal_id: req.session.sucursalId
            };

            setAuditoria(toAuditoria);

            return res.status( 200 ).json( response ); 
        } )
        .catch( error => { return res.status( 500 ).json( { success: false, data: error, message: 'Error de sistema, contacte a soporte técnico' } ); } );
    }

    static SetHorario(horario, corrida_id) {
        return new Promise(async (resolve, reject) => {
            let sqlCmd = `
                INSERT INTO horario 
                    (corrida_id, autobus_id, horario_salida, horario_estatus) VALUES 
                    (${corrida_id}, ${horario.inputAutobusSalida}, '${horario.inputHoraSalida}', 1);
                `;

            await corridaModel.SetHorario( sqlCmd );
            resolve(true);
        });
    }

    static PutHorario(horario) {
        return new Promise(async (resolve, reject) => {
            let sqlCmd = `
                    UPDATE horario
                        SET autobus_id = ${horario.inputAutobusSalida},
                        horario_salida = '${horario.inputHoraSalida}'
                    WHERE horario_id = ${horario.horario_id}
                `;
                
            await corridaModel.SetHorario( sqlCmd );
            resolve(true);
        });
    }

    static DelHorario(horario_id) {
        return new Promise(async (resolve, reject) => {
            let sqlCmd = `
                    UPDATE horario
                        SET horario_estatus = 0
                    WHERE horario_id = ${horario_id}
                `;
                
            await corridaModel.SetHorario( sqlCmd );
            resolve(true);
        });
    }
}

module.exports = new CorridaController();