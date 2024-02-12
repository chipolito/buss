'use strict';

var uxControl = function () {
    var btnGuardar;

    var btnCambiarPass;

    var datatable;

    var reglaFormUsuario = FormValidation.formValidation(
        document.getElementById('formUsuarios'), {
            fields: {
                inputNombreUsuario: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputContraseniaUsuario: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputContraseniaBUsuario: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        },
                        identical: {
                            compare: function () {
                                return document.querySelector('[name="inputContraseniaUsuario"]').value;
                            },
                            message: 'Las contraseñas no coinciden',
                        },
                    }
                },
                inputPropietarioUsuario: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                }
            },
            plugins: {
                trigger: new FormValidation.plugins.Trigger(),
                submitButton: new FormValidation.plugins.SubmitButton(),
                bootstrap: new FormValidation.plugins.Bootstrap()
            }
        }
    );

    var reglaFormPassword = FormValidation.formValidation(
        document.getElementById('frmCambioContrasenia'), {
            fields: {
                newPassword: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                confirmPassword: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        },
                        identical: {
                            compare: function () {
                                return document.querySelector('[name="newPassword"]').value;
                            },
                            message: 'Las contraseñas no coinciden',
                        }
                    }
                }
            },
            plugins: {
                trigger: new FormValidation.plugins.Trigger(),
                submitButton: new FormValidation.plugins.SubmitButton(),
                bootstrap: new FormValidation.plugins.Bootstrap()
            }
        }
    );

    var _validacionFormUsuario = () => {
        KTUtil.addEvent(btnGuardar, 'click', function(e) {
            e.preventDefault();

            reglaFormUsuario.validate().then((status) => {
                if (status == 'Valid') {
                    KTUtil.btnWait(btnGuardar, 'spinner spinner-right spinner-white pr-15', 'Espere por favor', true);

                    let permisos    = [],
                        method      = 'POST',
                        ws          = '/Usuario/Set';

                    $.each( $(`input[name="inputPermisoUsuario"]` ), function() {
                        if( $(this).is(":checked") )
                            permisos.push( $(this).val() );
                    });

                    let formElement = new FormData( document.getElementById('formUsuarios') ),
				        formData 	= Object.fromEntries(formElement.entries());

                    formData.permisos = JSON.stringify(permisos);

                    let usuarioId = $("#inputIdUsuario").val();
                    
                    if(usuarioId != 0) {
                        formData.usuarioId = usuarioId;
                        method = 'PUT';
                        ws = '/Usuario';
                    }
                    
                    let options = {
                        method,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify( formData )
                    };

                    fetch(ws, options)
                    .then(response => response.json())
                    .then(data => {
                        if(data.success){
                            KTLayoutGeneralActions.closePanel();

                            _resetearForm();

                            if(datatable)
                                datatable.reload();
                        } else {
                            if(data.data.code == "SQLITE_CONSTRAINT")
                                data.message += " ¡EL NOMBRE DE USUARIO YA EXISTE!";
                        }

                        showMessage('dark', 'Administración de usuarios', data.message);
                    })
                    .catch(( error ) => {
                        console.log(error);
                        showMessage('danger', 'Administración de usuarios', error.message);
                    })
                    .finally(() => {
                        KTUtil.btnRelease(btnGuardar);
                    });
                }
            });
        });
    };

    var _activarControles = () => {
        $('#kt_general_actions_toggle').on('click', _resetearForm);
    }

    var _resetearForm = () => {
        reglaFormUsuario.resetForm();
        $('#formUsuarios')[0].reset();

        $('#inputContraseniaUsuario, #inputContraseniaBUsuario')
        .val('')
        .removeAttr('readonly');
    }

    var _validacionFormCambioContrasenia = () => {
        KTUtil.addEvent(btnCambiarPass, 'click', function(e) {
            e.preventDefault();

            reglaFormPassword.validate().then((status) => {
                if (status == 'Valid') {
                    KTUtil.btnWait(btnCambiarPass, 'spinner spinner-right spinner-white pr-15', 'Espere por favor', true);

                    let formElement = new FormData( document.getElementById('frmCambioContrasenia') ),
				        formData 	= Object.fromEntries(formElement.entries());
                        
                    let options = {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify( formData )
                    };

                    fetch('/Usuario/PutPassword', options)
                    .then(response => response.json())
                    .then(data => {
                        showMessage('dark', 'Administración', data.message);

                        if(data.success){
                            _resetearFormPass();
                            $('#mdlCambioContrasenia').modal('hide');
                        }
                    })
                    .catch(( error ) => {
                        console.log(error);
                        showMessage('danger', 'Administración', error.message);
                    })
                    .finally(() => {
                        KTUtil.btnRelease(btnCambiarPass);
                    });
                }
            });
        });
    };

    var _resetearFormPass = () => {
        reglaFormPassword.resetForm();
        $('#frmCambioContrasenia')[0].reset();
    }

    var _cargarCatalogo = function() {
        datatable = $('#kt_datatable').KTDatatable({
            data: {
                type: 'remote',
                source: {
					read: {
						url: '/Usuario',
						method: 'GET',
						contentType: 'application/json',
						map: function(raw) {
                            let dataSet = raw;

                            if (typeof raw.data !== 'undefined') {
                                dataSet = raw.data;
                            }

							showMessage('dark', 'Administración de usuarios', raw.message);

                            return dataSet;
                        },
					},
				},
                pageSize: 10,
                saveState: false,
                serverPaging: false,
				serverFiltering: false,
				serverSorting: false
            },
            layout: {
                scroll: false,
                footer: false,
                spinner: {
					overlayColor: '#181C32',
					message: 'Espere por favor'
				}
            },
            sortable: true,
            pagination: true,
            search: {
                input: $('#kt_datatable_search_query'),
                key: 'generalSearch'
            },
            translate: translateKTable,
            columns: [{
                field: 'usuario_nombre',
                title: 'Usuario',
                width: '250',
                template: (row) => {
                    return `
                        <div class="d-flex align-items-center">
                            <div class="symbol symbol-40 symbol-light-success flex-shrink-0">
                                <div class="symbol-label">${row.usuario_propietario.charAt(0).toUpperCase()}</div>
                            </div>
                            <div class="ml-2">
                                <div class="text-dark-75 font-weight-bold line-height-sm">${row.usuario_propietario.charAt(0).toUpperCase() + row.usuario_propietario.slice(1).toLowerCase()}</div>
                                <a href="javascript:void(0);" class="font-size-sm text-dark-50 text-hover-success">
                                    Nombre de usuario: ${row.usuario_nombre}
                                </a>
                            </div>
                        </div>
                    `;
                }
            }, {
                field: 'usuario_telefono',
                title: 'Contacto',
                width: 120
            }, {
                field: 'usuario_id',
                title: '',
                width: 120,
                template: function(row) {
                    return `
                        <a href="javascript:;" class="btn btn-sm btn-icon btn-outline-warning mr-2" title="Editar usuario" data-detalle-usuario='${JSON.stringify(row)}'>
                            <span class="svg-icon svg-icon-md">
                                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                                    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                        <rect x="0" y="0" width="24" height="24"/>
                                        <path d="M8,17.9148182 L8,5.96685884 C8,5.56391781 8.16211443,5.17792052 8.44982609,4.89581508 L10.965708,2.42895648 C11.5426798,1.86322723 12.4640974,1.85620921 13.0496196,2.41308426 L15.5337377,4.77566479 C15.8314604,5.0588212 16,5.45170806 16,5.86258077 L16,17.9148182 C16,18.7432453 15.3284271,19.4148182 14.5,19.4148182 L9.5,19.4148182 C8.67157288,19.4148182 8,18.7432453 8,17.9148182 Z" fill="#000000" fill-rule="nonzero" transform="translate(12.000000, 10.707409) rotate(-135.000000) translate(-12.000000, -10.707409) "/>
                                        <rect fill="#000000" opacity="0.3" x="5" y="20" width="15" height="2" rx="1"/>
                                    </g>
                                </svg>
                            </span>
                        </a>

                        <a href="javascript:;" class="btn btn-sm btn-icon btn-outline-secondary mr-2" title="Cambiar contraseña" data-toggle="modal" data-target="#mdlCambioContrasenia" data-eliminar-contrasenia="${row.usuario_id}">
                            <span class="svg-icon svg-icon-md">
                                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                                    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                        <rect x="0" y="0" width="24" height="24"/>
                                        <path d="M7.38979581,2.8349582 C8.65216735,2.29743306 10.0413491,2 11.5,2 C17.2989899,2 22,6.70101013 22,12.5 C22,18.2989899 17.2989899,23 11.5,23 C5.70101013,23 1,18.2989899 1,12.5 C1,11.5151324 1.13559454,10.5619345 1.38913364,9.65805651 L3.31481075,10.1982117 C3.10672013,10.940064 3,11.7119264 3,12.5 C3,17.1944204 6.80557963,21 11.5,21 C16.1944204,21 20,17.1944204 20,12.5 C20,7.80557963 16.1944204,4 11.5,4 C10.54876,4 9.62236069,4.15592757 8.74872191,4.45446326 L9.93948308,5.87355717 C10.0088058,5.95617272 10.0495583,6.05898805 10.05566,6.16666224 C10.0712834,6.4423623 9.86044965,6.67852665 9.5847496,6.69415008 L4.71777931,6.96995273 C4.66931162,6.97269931 4.62070229,6.96837279 4.57348157,6.95710938 C4.30487471,6.89303938 4.13906482,6.62335149 4.20313482,6.35474463 L5.33163823,1.62361064 C5.35654118,1.51920756 5.41437908,1.4255891 5.49660017,1.35659741 C5.7081375,1.17909652 6.0235153,1.2066885 6.2010162,1.41822583 L7.38979581,2.8349582 Z" fill="#000000" opacity="0.3"/>
                                        <path d="M14.5,11 C15.0522847,11 15.5,11.4477153 15.5,12 L15.5,15 C15.5,15.5522847 15.0522847,16 14.5,16 L9.5,16 C8.94771525,16 8.5,15.5522847 8.5,15 L8.5,12 C8.5,11.4477153 8.94771525,11 9.5,11 L9.5,10.5 C9.5,9.11928813 10.6192881,8 12,8 C13.3807119,8 14.5,9.11928813 14.5,10.5 L14.5,11 Z M12,9 C11.1715729,9 10.5,9.67157288 10.5,10.5 L10.5,11 L13.5,11 L13.5,10.5 C13.5,9.67157288 12.8284271,9 12,9 Z" fill="#000000"/>
                                    </g>
                                </svg>
                            </span>
                        </a>

                        <a href="javascript:;" class="btn btn-sm btn-icon btn-outline-danger" title="Eliminar usuario" data-eliminar-usuario="${row.usuario_id}">
                            <span class="svg-icon svg-icon-md">
                                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                                    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                        <rect x="0" y="0" width="24" height="24"/>
                                        <path d="M6,8 L18,8 L17.106535,19.6150447 C17.04642,20.3965405 16.3947578,21 15.6109533,21 L8.38904671,21 C7.60524225,21 6.95358004,20.3965405 6.89346498,19.6150447 L6,8 Z M8,10 L8.45438229,14.0894406 L15.5517885,14.0339036 L16,10 L8,10 Z" fill="#000000" fill-rule="nonzero"/>
                                        <path d="M14,4.5 L14,3.5 C14,3.22385763 13.7761424,3 13.5,3 L10.5,3 C10.2238576,3 10,3.22385763 10,3.5 L10,4.5 L5.5,4.5 C5.22385763,4.5 5,4.72385763 5,5 L5,5.5 C5,5.77614237 5.22385763,6 5.5,6 L18.5,6 C18.7761424,6 19,5.77614237 19,5.5 L19,5 C19,4.72385763 18.7761424,4.5 18.5,4.5 L14,4.5 Z" fill="#000000" opacity="0.3"/>
                                    </g>
                                </svg>
                            </span>
                        </a>
                    `;
                },
            }],
        });

        datatable.on('click', '[data-eliminar-usuario]', function() {
            let usuarioId = $(this).data('eliminar-usuario');

            Swal.fire({
                title: "¿Estas seguro?",
                text: `Confirma que deseas eliminar el registro de este usuario`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "<i class='flaticon2-right-arrow icon-md'></i> Confirmar",
                cancelButtonText: "Cancelar",
                customClass: {
                    confirmButton: "btn btn-primary",
                    cancelButton: "btn btn-secondary"
                },
                allowOutsideClick: false
            }).then(function(result) {
                if (result.value) {
                    let options = {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify( { usuarioId } )
                    };

                    fetch('/Usuario', options)
                    .then(response => response.json())
                    .then(data => {
                        showMessage('dark', 'Administración de usuarios', data.message);

                        if(data.success){
                            if(datatable)
                                datatable.reload();
                        }
                    })
                    .catch(( error ) => {
                        console.log(error);
                        showMessage('danger', 'Administración de usuarios', error.message);
                    });
                }
            });
        });

        datatable.on('click', '[data-detalle-usuario]', function() {
            _resetearForm();

            let detalle = $(this).data('detalle-usuario');
            
            $('#inputContraseniaUsuario, #inputContraseniaBUsuario')
            .val('Gossiping')
            .attr('readonly', 'readonly');

            $('#inputIdUsuario').val(detalle.usuario_id);
            $('#inputNombreUsuario').val(detalle.usuario_nombre);
            $('#inputContactoUsuario').val(detalle.usuario_telefono);
            $('#inputPropietarioUsuario').val(detalle.usuario_propietario);

            let permiso = detalle.usuario_permiso ? detalle.usuario_permiso.split(',') : [];

            $.each( $(`input[name="inputPermisoUsuario"]` ), function() {
                if( !permiso.includes( $(this).val() ) )
                    $(this).prop('checked', false);
            });

            KTLayoutGeneralActions.openPanel();
        });

        datatable.on('click', '[data-eliminar-contrasenia]', function() {
            $('#usuario_id').val( $(this).data('eliminar-contrasenia') );
        });
    };

    return {
		init: function(){
            btnGuardar      = KTUtil.getById('btnGuardar');
            btnCambiarPass  = KTUtil.getById('btnCambiarPass');

            _validacionFormUsuario();
            _validacionFormCambioContrasenia();

            _activarControles();
            _cargarCatalogo();
        }
	};

}();

$(function() {
    uxControl.init();

    marcarMenu('asideMenuOptions, .asideMenuUsuario');
});