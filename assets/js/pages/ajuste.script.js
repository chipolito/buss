'use strict';

var uxControl = function () {
    var btnGuardarInfoEmpresa,
        btnGuardarInfoBase;

    var reglaFormEmpresa = FormValidation.formValidation(
        document.getElementById('formGenerales'), {
            fields: {
                inputGeneralNombre: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputGeneralRfc: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputGeneralRazon: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputGeneralContacto: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputGeneralEmail: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputGeneralTel: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputGeneralDir1: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputGeneralSucursal: {
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

    var reglaFormBase = FormValidation.formValidation(
        document.getElementById('formBase'), {
            fields: {
                inputBaseImpresora: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputBaseImpresoraTamanio: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputBaseFormaPago: {
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

    var _validacionFormEmpresa = () => {
        KTUtil.addEvent(btnGuardarInfoEmpresa, 'click', function(e) {
            e.preventDefault();

            reglaFormEmpresa.validate().then((status) => {
                if (status == 'Valid') {
                    KTUtil.btnWait(btnGuardarInfoEmpresa, 'spinner spinner-right spinner-white pr-15', 'Espere por favor', true);

                    let formElement = new FormData( document.getElementById('formGenerales') ),
				        formData 	= Object.fromEntries(formElement.entries());

                    _setAjuste( 'cnf_empresa', JSON.stringify(formData), btnGuardarInfoEmpresa );
                }
            });
        });
    };

    var _validacionFormBase = () => {
        KTUtil.addEvent(btnGuardarInfoBase, 'click', function(e) {
            e.preventDefault();

            reglaFormBase.validate().then((status) => {
                if (status == 'Valid') {
                    KTUtil.btnWait(btnGuardarInfoBase, 'spinner spinner-right spinner-white pr-15', 'Espere por favor', true);

                    let formElement = new FormData( document.getElementById('formBase') );

                    formElement.append('inputBaseEfectivo', $('#inputBaseEfectivo').is(":checked") );
                    formElement.append('inputBaseTarjeta', $('#inputBaseTarjeta').is(":checked") );

                    let formData = Object.fromEntries(formElement.entries());

                    _setAjuste( 'cnf_base', JSON.stringify(formData), btnGuardarInfoBase );
                }
            });
        });
    };

    var _setAjuste = ( ajuste_clave, ajuste_valor, btn ) => {
        let options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify( { ajuste_clave, ajuste_valor } )
        };

        fetch('/Ajuste', options)
        .then(response => response.json())
        .then(data => {
            showMessage('dark', 'Administración de ajustes', data.message);
        })
        .catch(( error ) => {
            console.log(error);
            showMessage('danger', 'Administración de ajustes', error.message);
        })
        .finally(() => {
            KTUtil.btnRelease(btn);
        });
    };

    var _getAjuste = () => {
        let options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        fetch('/Ajuste', options)
        .then(response => response.json())
        .then(data => {
            showMessage('dark', 'Administración de ajustes', data.message);
            
            if(data.success) {
                $.each( data.data, (index, item) => {
                    switch ( item.configuracion_clave ) {
                        case 'cnf_empresa':
                            let inputsE = JSON.parse( item.configuracion_valor );

                            $.each(inputsE, (input, inputVal) => {
                                if(input == 'inputGeneralSucursal') {
                                   // $(`#${input}`).val( inputVal ).selectpicker('render');
                                } else {
                                    $(`#${input}`).val( inputVal );
                                }
                            });
                            break;
                        case 'cnf_base':
                            let inputsB = JSON.parse( item.configuracion_valor );

                            $.each(data.impresoras, (index, item) => {
                                $('#inputBaseImpresora').append(`<option value="${item.name}">- ${item.name} -</option>`);
                            });

                            $('#inputBaseImpresora')
                            .val(inputsB.inputBaseImpresora)
                            .selectpicker('render');

                            $('#inputBaseImpresoraTamanio')
                            .val(inputsB.inputBaseImpresoraTamanio)
                            .selectpicker('render');

                            $('#inputBaseEfectivo').prop('checked', inputsB.inputBaseEfectivo.toLowerCase() === 'true');
                            $('#inputBaseTarjeta').prop('checked', inputsB.inputBaseTarjeta.toLowerCase() === 'true');

                            break;
                        default:
                            console.log('Configuracion no establecida', item.configuracion_clave);
                    }
                });

                $(`#inputGeneralSucursal`).val( data.sucursalClave ).selectpicker('render');
            }
        })
        .catch(( error ) => {
            console.log(error);
            showMessage('danger', 'Administración de ajustes', error.message);
        });
    };

    return {
		init: function(){
            btnGuardarInfoEmpresa   = KTUtil.getById('btnGuardarEmpresa');
            btnGuardarInfoBase      = KTUtil.getById('btnGuardarBase');

            _getAjuste();
            _validacionFormEmpresa();
            _validacionFormBase();
        }
	};
}();

$(function() {
    uxControl.init();

    marcarMenu('asideMenuOptions, .asideMenuAjuste');
});