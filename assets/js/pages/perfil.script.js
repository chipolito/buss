'use strict';

var uxControl = function () {
    var btnGuardar;

    var reglaFormUpdatePass = FormValidation.formValidation(
        document.getElementById('frmChangePassword'), {
            fields: {
                inputCurrentPass: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputNewPass: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputRepeatPass: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        },
                        identical: {
                            compare: function () {
                                return document.querySelector('[name="inputNewPass"]').value;
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

    var _validacionFormDescuento = () => {
        KTUtil.addEvent(btnGuardar, 'click', function(e) {
            e.preventDefault();

            reglaFormUpdatePass.validate().then((status) => {
                if (status == 'Valid') {
                    KTUtil.btnWait(btnGuardar, 'spinner spinner-right spinner-white pr-15', 'Espere por favor', true);

                    let formElement = new FormData( document.getElementById('frmChangePassword') ),
				        formData 	= Object.fromEntries(formElement.entries());
                        
                    let options = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify( formData )
                    };
                    console.log(formData);

                    fetch('/Perfil', options)
                    .then(response => response.json())
                    .then(data => {
                        showMessage('dark', 'Administración', data.message);

                        if(data.success)
                            _resetearForm();
                    })
                    .catch(( error ) => {
                        console.log(error);
                        showMessage('danger', 'Administración', error.message);
                    })
                    .finally(() => {
                        KTUtil.btnRelease(btnGuardar);
                    });
                }
            });
        });
    };

    var _resetearForm = () => {
        reglaFormUpdatePass.resetForm();
        $('#frmChangePassword')[0].reset();
    }

    return {
		init: function(){
            btnGuardar = KTUtil.getById('btnGuardar');

            _validacionFormDescuento();
        }
	};

}();

$(function() {
    uxControl.init();
});