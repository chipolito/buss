'use strict';

var uxControl = function () {
    var btnGuardar;

    var datatable;

    var reglaFormDescuento = FormValidation.formValidation(
        document.getElementById('formDescuentos'), {
            fields: {
                inputNombreDescuento: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputPorcentajeDescuento: {
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

    var _validacionFormDescuento = () => {
        KTUtil.addEvent(btnGuardar, 'click', function(e) {
            e.preventDefault();

            reglaFormDescuento.validate().then((status) => {
                if (status == 'Valid') {
                    KTUtil.btnWait(btnGuardar, 'spinner spinner-right spinner-white pr-15', 'Espere por favor', true);

                    let formElement = new FormData( document.getElementById('formDescuentos') );

                    formElement.append('inputBypassPlaza', $('#inputBypassPlaza').is(":checked") ? 1 :0 );
                    formElement.append('inputPlazaEspecial', $('#inputPlazaEspecial').is(":checked") ? 1 :0 );
                    formElement.append('inputCredencial', $('#inputCredencial').is(":checked") ? 1 :0 );

				    let formData = Object.fromEntries(formElement.entries());

                    let options = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify( formData )
                    };

                    fetch('/Descuento', options)
                    .then(response => response.json())
                    .then(data => {
                        showMessage('dark', 'Administración de descuentos', data.message);

                        if(data.success){
                            KTLayoutGeneralActions.closePanel();

                            _resetearForm();

                            if(datatable)
                                datatable.reload();
                        }
                    })
                    .catch(( error ) => {
                        console.log(error);
                        showMessage('danger', 'Administración de descuentos', error.message);
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

        $('#inputBypassPlaza').change( function(){
            if(this.checked) {
                $('#inputPlazaEspecial').attr('disabled', false);
            } else {
                $('#inputPlazaEspecial').attr('disabled', true);
                $('#inputPlazaEspecial').prop('checked', false);
            }
        });
    }

    var _resetearForm = () => {
        reglaFormDescuento.resetForm();
        $('#formDescuentos')[0].reset();
    }

    var _cargarCatalogo = function() {
        datatable = $('#kt_datatable').KTDatatable({
            data: {
                type: 'remote',
                source: {
					read: {
						url: '/Descuento',
						method: 'GET',
						contentType: 'application/json',
						map: function(raw) {
                            let dataSet = raw;

                            if (typeof raw.data !== 'undefined') {
                                dataSet = raw.data;
                            }

							showMessage('dark', 'Administración de descuentos', raw.message);

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
                field: 'descuento_nombre',
                title: 'Nombre',
                width: '500',
                template: (row) => {
                    return `
                        <div class="d-flex align-items-center">
                            <div class="symbol symbol-40 symbol-light-success flex-shrink-0">
                                <div class="symbol-label">${row.descuento_nombre.charAt(0).toUpperCase()}</div>
                            </div>
                            <div class="ml-2">
                                <div class="text-dark-75 font-weight-bold line-height-sm">${row.descuento_nombre.charAt(0).toUpperCase() + row.descuento_nombre.slice(1).toLowerCase()}</div>
                                <a href="javascript:void(0);" class="font-size-sm text-dark-50 text-hover-success">
                                    ${row.descuento_descripcion}
                                </a>
                                <div class="font-size-sm text-dark-50">${row.descuento_bypass_plaza == 1 ? '&#9679; No ocupa asiento en el autobus' : ''} ${row.descuento_plaza_especial == 1 ? ' / Ocupa una plaza para silla de rueda' : ''}</div>
                                <div class="font-size-sm text-dark-50">${row.descuento_credencial == 1 ? '&#9679; Debe presentar credencial para aplicar descuento' : ''}</div>
                            </div>
                        </div>
                    `;
                }
            }, {
                field: 'descuento_porcentaje',
                title: 'Descuento',
                width: '100',
                template: (row) => {
                    return `
                        <span class="text-danger font-weight-bolder font-size-sm">${row.descuento_porcentaje}%</span>
                    `;
                }
            }, {
                field: 'descuento_id',
                title: '',
                sortable: false,
                textAlign: 'right',
                width: '40',
                template: function(row) {
                    return `
                        <a href="javascript:;" class="btn btn-sm btn-icon btn-outline-danger" data-eliminar-descuento='${row.descuento_id}' title="Eliminar descuento">
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

        datatable.on('click', '[data-eliminar-descuento]', function() {
            let descuentoId = $(this).data('eliminar-descuento');

            Swal.fire({
                title: "¿Estas seguro?",
                text: `Confirma que deseas eliminar el registro de este descuento`,
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
                        body: JSON.stringify( { descuentoId } )
                    };

                    fetch('/Descuento', options)
                    .then(response => response.json())
                    .then(data => {
                        showMessage('dark', 'Administración de descuentos', data.message);

                        if(data.success){
                            if(datatable)
                                datatable.reload();
                        }
                    })
                    .catch(( error ) => {
                        console.log(error);
                        showMessage('danger', 'Administración de descuentos', error.message);
                    });
                }
            });
        });
    };

    return {
		init: function(){
            btnGuardar = KTUtil.getById('btnGuardar');

            _validacionFormDescuento();
            _activarControles();
            _cargarCatalogo();
        }
	};

}();

$(function() {
    uxControl.init();

    marcarMenu('asideMenuOptions, .asideMenuDescuento');
});