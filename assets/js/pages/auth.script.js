'use strict';

var KTLogin = function() {
    var btnLogin;

    var reglaFormLogin = FormValidation.formValidation(
        KTUtil.getById('kt_login_signin_form'), {
            fields: {
                username: {
                    validators: {
                        notEmpty: {
                            message: 'El nombre de usuario es requerido.'
                        }
                    }
                },
                password: {
                    validators: {
                        notEmpty: {
                            message: 'La contraseña es requerida.'
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

    var validacionFormLogin = () => {
        KTUtil.addEvent(btnLogin, 'click', function(e) {
            e.preventDefault();

            reglaFormLogin.validate().then((status) => {
                if (status == 'Valid') {
                    KTUtil.btnWait(btnLogin, 'spinner spinner-right spinner-white pr-15', 'Espere por favor', true);

                    let formElement = new FormData( document.getElementById('kt_login_signin_form') ),
                        formData 	= Object.fromEntries(formElement.entries());

                    let options = {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify( formData )
                    };
                    
                    fetch("/Usuario/Sign", options)
                    .then(response => response.json())
                    .then(data => {
                        if(data.success){
                            $('#kt_login_signin_form')[0].reset();

                            swal.fire({
                                title: data.message,
                                text: 'Cargando configuracion de la cuenta',
                                icon: "success",
                                timer: 4000,
                                allowOutsideClick: false,
                                allowEscapeKey: false,
                                onOpen: function() {
                                    Swal.showLoading()
                                }
                            }).then(function() {
                                window.location.replace('/');
                            });
                        } else {
                            KTUtil.btnRelease(btnLogin);

                            var content = {
                                message: data.message,
                                title: 'Disse Tickets',
                                icon: 'icon flaticon-exclamation-2 icon-md'
                            };

                            notificacion( content );
                        }
                    })
                    .catch(error => {
                        KTUtil.btnRelease(btnLogin);

                        var content = {
                            message: 'Se produjo un error al tratar de validar la información, si el error persiste llame a soporte técnico.',
                            title: 'Disse Tickets',
                            icon: 'icon flaticon-exclamation-2 icon-md'
                        };

                        notificacion( content );
                    });
                }
            });
        });
    };

    var notificacion = (content) => {
        $.notify(content, {
            type: 'danger',
            allow_dismiss: true,
            newest_on_top: false,
            mouse_over: false,
            showProgressbar: false,
            spacing: 10,
            timer: 2000,
            placement: {
                from: 'top',
                align: 'right'
            },
            offset: {
                x: 30,
                y: 30
            },
            delay: 1000,
            z_index: 10000,
            animate: {
                enter: 'animate__animated animate__bounceIn',
                exit: 'animate__animated animate__fadeOutUp'
            }
        });
    };

    var configurarFocus = () => {
        document.getElementById('username').focus();

        let inputUserName = KTUtil.getById('username');
        KTUtil.addEvent(inputUserName, 'keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('password').focus();
            }
        });
        
        let inputPassword = KTUtil.getById('password');
        KTUtil.addEvent(inputPassword, 'keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('kt_login_signin_submit').click();
            }
        });

    };

    return {
        init: () => {
            btnLogin = KTUtil.getById('kt_login_signin_submit');
            validacionFormLogin();
            configurarFocus();
        }
    };
}();

jQuery(document).ready(function() {
    KTLogin.init();
});