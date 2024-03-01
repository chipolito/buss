'use strict';

var uxControl = function () {
    var $listaHorario;

    var btnGuardar;

    var datatable;

    var horarioEliminar = [];

    var reglaFormCorrida = FormValidation.formValidation(
        document.getElementById('formCorrida'), {
            fields: {
                inputNombreOrigen: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputNombreDestino: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputPrecio: {
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

    var _validacionFormCorrida = () => {
        KTUtil.addEvent(btnGuardar, 'click', function(e) {
            e.preventDefault();

            reglaFormCorrida.validate().then((status) => {
                if (status == 'Valid') {
                    KTUtil.btnWait(btnGuardar, 'spinner spinner-right spinner-white pr-15', 'Espere por favor', true);

                    let inputIdCorrida  = $('#inputIdCorrida').val(),
                        method          = inputIdCorrida == 0 ? 'POST' : 'PUT',
                        configHorario   = $listaHorario.repeaterVal();
                    
                    let formData = {
                        inputIdCorrida,
                        inputNombreOrigen: $('#inputNombreOrigen').val(),
                        inputNombreDestino: $('#inputNombreDestino').val(),
                        inputTiempo: $('#inputTiempo').val(),
                        inputPrecio: $('#inputPrecio').val(),
                        inputHorario: JSON.stringify( configHorario.horarios ),
                        inputEliminar: JSON.stringify( horarioEliminar )
                    }; 
                        
                    let options = {
                        method,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify( formData )
                    };

                    fetch('/Corrida', options)
                    .then(response => response.json())
                    .then(data => {
                        showMessage('dark', 'Administración de corridas', data.message);

                        if(data.success){
                            KTLayoutGeneralActions.closePanel();

                            _resetearForm();

                            if(datatable) 
                                datatable.reload();
                        }
                    })
                    .catch(( error ) => {
                        console.log(error);
                        showMessage('danger', 'Administración de corridas', error.message);
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

        $('#inputTiempo, .inputHoraSalida').timepicker({
			minuteStep: 5,
			defaultTime: '',
			showSeconds: false,
			showMeridian: false,
			snapToStep: true
		});

        $listaHorario = $('#kt_repeat_horarios').repeater({
            initEmpty: false,

            show: function () {
                $(this).find('.inputHoraSalida')
                .timepicker({
                    minuteStep: 5,
                    defaultTime: '',
                    showSeconds: false,
                    showMeridian: false,
                    snapToStep: true
                });

                if( $(this).find('.inputAutobusSalida').val() === null )
                    $(this).find('.inputAutobusSalida').prop('selectedIndex', 0);

                if($(this).find('.horario_id').val() === '')
                    $(this).find('.horario_id').val(0);

                $(this).find('.inputAutobusSalida').attr('data-boleto_vendido', $(this).find('.boleto_vendido').val());

                if($(this).find('.boleto_vendido').val() === '')
                    $(this).find('.boleto_vendido').val(0);

                if( $(this).find('.boleto_vendido').val() ==  $(this).find('.inputAutobusSalida').find(':selected').data('capacidad') )
                    $(this).find('.inputAutobusSalida').prop('disabled', 'disabled');


                $(this).slideDown();
            },

            hide: function (deleteElement) {
                let horario_id = $(this).find('.horario_id').val();

                if(horario_id != '' && horario_id != '0')
                    horarioEliminar.push( horario_id );

                if( $(this).find('.boleto_vendido').val() > 0)
                    return false;
                
                $(this).slideUp(deleteElement);
            }
        });

        let previewValueBus = 0;
        let selectInput;
        $(document).on('focus',  '.inputAutobusSalida', function(){
            selectInput = $(this);
            previewValueBus = selectInput.val();
        }).change(function() {
            if( selectInput ) {
                let vendido = selectInput.data('boleto_vendido');
                let capacidad = selectInput.find(':selected').data('capacidad');
                
                if(vendido > capacidad)
                    selectInput.val( previewValueBus );
            }
            
        });
    }

    var _resetearForm = () => {
        reglaFormCorrida.resetForm();
        $('#formCorrida')[0].reset();

        $listaHorario.setList([{
            'horario_id': '', 
            'inputHoraSalida': '', 
            'inputAutobusSalida': '',
            'boleto_vendido': ''
        }]);

        horarioEliminar = [];
    }

    var _cargarCatalogo = function() {
        datatable = $('#kt_datatable').KTDatatable({
            data: {
                type: 'remote',
                source: {
					read: {
						url: '/Corrida',
						method: 'GET',
						contentType: 'application/json',
						map: function(raw) {
                            let dataSet = raw;

                            if (typeof raw.data !== 'undefined') {
                                dataSet = raw.data;
                            }

							showMessage('dark', 'Administración de corridas', raw.message);

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
                field: 'corrida_origen',
                title: 'Corrida',
                width: '350',
                template: (row) => {
                    return `
                        <div class="d-flex align-items-center">
                            <div class="symbol symbol-40 symbol-light-success flex-shrink-0">
                                <div class="symbol-label">C</div>
                            </div>
                            <div class="ml-2">
                                <div class="text-dark-75 font-weight-bold line-height-sm">Origen: ${row.corrida_origen}</div>
                                <a href="javascript:void(0);" class="font-size-sm text-dark-60 text-hover-success">
                                    Destino: ${row.corrida_destino}
                                </a>
                            </div>
                        </div>
                    `;
                }
            }, {
                field: 'corrida_tiempo_estimado',
                title: 'Viaje',
                width: '100',
                template: (row) => {
                    return `
                        <span class="text-danger font-weight-bolder font-size-sm">${row.corrida_tiempo_estimado} Hrs</span>
                    `;
                }
            }, {
                field: 'corrida_precio',
                title: 'Precio',
                width: '100',
                template: (row) => {
                    return `
                        <span class="text-danger font-weight-bolder font-size-sm">${currency(row.corrida_precio)}</span>
                    `;
                }
            }, {
                field: 'corrida_id',
                title: '',
                sortable: false,
                textAlign: 'right',
                width: '100',
                template: function(row) {
                    return `
                        <a href="javascript:;" class="btn btn-sm btn-icon btn-outline-warning mr-3" title="Editar corrida" data-detalle-corrida='${JSON.stringify(row)}'>
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

                        <a href="javascript:;" class="btn btn-sm btn-icon btn-outline-danger" data-eliminar-corrida='${row.corrida_id}' title="Eliminar corrida">
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

        datatable.on('click', '[data-eliminar-corrida]', function() {
            let inputIdCorrida = $(this).data('eliminar-corrida');

            Swal.fire({
                title: "¿Estas seguro?",
                text: `Confirma que deseas eliminar esta corrida`,
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
                        body: JSON.stringify( { inputIdCorrida } )
                    };

                    fetch('/Corrida', options)
                    .then(response => response.json())
                    .then(data => {
                        showMessage('dark', 'Administración de corridas', data.message);

                        if(data.success){
                            if(datatable)
                                datatable.reload();
                        }
                    })
                    .catch(( error ) => {
                        console.log(error);
                        showMessage('danger', 'Administración de corridas', error.message);
                    });
                }
            });
        });

        datatable.on('click', '[data-detalle-corrida]', function() {
            _resetearForm();

            let detalle = $(this).data('detalle-corrida');

            $('#inputIdCorrida').val(detalle.corrida_id);
            $('#inputNombreOrigen').val(detalle.corrida_origen);
            $('#inputNombreDestino').val(detalle.corrida_destino);
            $('#inputTiempo').timepicker('setTime', detalle.corrida_tiempo_estimado);
            $('#inputPrecio').val(detalle.corrida_precio);

            let horarios    = JSON.parse(detalle.corrida_horario),
                arrHorarios = [];

            $.each( horarios, function(index, item) {
                arrHorarios.push({
                    'horario_id': item.horario_id,
                    'inputHoraSalida': item.horario_salida, 
                    'inputAutobusSalida': item.autobus_id,
                    'boleto_vendido': item.boleto_vendido
                });
            });

            $listaHorario.setList( arrHorarios );

            KTLayoutGeneralActions.openPanel();
        });
    };

    return {
		init: function(){
            btnGuardar = KTUtil.getById('btnGuardar');

            _validacionFormCorrida();
            _activarControles();
            _cargarCatalogo();
        }
	};

}();

$(function() {
    uxControl.init();

    marcarMenu('asideMenuOptions, .asideMenuCorrida');
});