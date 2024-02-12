'use strict';

var uxControl = function () {
    var $objListaBoletos;

    var lstDescuentos = [];

    var lstMotivos = [];

    var btnGuardar;

    var btnValidar;

    var btnPrecreate;

    var btnRegistrarMovimiento;

    var miTurno = {};

    var datatableMovimientos;

    var datatableHistorialVenta;

    var datatableCorteCaja;

    var permisoImpresion = false;

    var reglaFormMovimiento = FormValidation.formValidation(
        document.getElementById('frmMovimiento'), {
            fields: {
                inputMovimientoImporte: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputMovimientoTipo: {
                    validators: {
                        notEmpty: {
                            message: 'Dato requerido'
                        }
                    }
                },
                inputMovimientoComentario: {
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

    var _activarControles = () => {
        KTUtil.addEvent(btnPrecreate, 'click', function(){
            let salidaSeleccionada  = $("input[name='corrida_horario']:checked").data('detalle');
                                
            if(salidaSeleccionada) {
                let boletosDisponbles           = salidaSeleccionada.boleto_permitido - salidaSeleccionada.boleto_vendido,
                    boletosMemoria              = $objListaBoletos.repeaterVal(),
                    boletosPorVender            = 0;

                boletosMemoria.boletos.forEach(function(boleto, index) {
                    if(boleto.inputBoleto == '0') {
                        boletosPorVender += 1;
                    } else {
                        lstDescuentos.forEach(function(descuento, index){
                            if(boleto.inputBoleto == descuento.descuento_id) {
                                if(descuento.descuento_bypass_plaza == 0)
                                    boletosPorVender += 1;
                            }
                        });
                    }
                });
            
                if(boletosPorVender == boletosDisponbles || boletosDisponbles == 0) {
                    showMessage('warning', 'Administración', 'No puedes agregar mas boletos que los disponibles');
                } else {
                    $('#btnAddBoleto').click();
                }
            } else {
                showMessage('warning', 'Administración', 'Debe seleccionar un horario de salida');
            }
        });

        KTUtil.addEvent(btnValidar, 'click', function(e) {
            e.preventDefault();

            let dataSalida = $("input[name='corrida_horario']:checked").data('detalle');

            if(dataSalida){
                let dataCorrida = $('#inputCorrida').find(":selected").data();

                let dataTickets = $objListaBoletos.repeaterVal();

                let jsonSalesData = {
                    turno_id: 0,
                    usuario_id: 0,
                    corrida_id: dataCorrida.corridaId,
                    horario_id: dataSalida.horario_id,
                    venta_folio: '',
                    venta_fecha: '',
                    venta_cantidad: dataTickets.boletos.length,
                    venta_ocupacion_real: 0,
                    venta_ocupacion_especial: 0,
                    venta_total: 0,
                    venta_descuento: 0,
                    venta_efectivo: 0,
                    venta_cambio: 0,
                    venta_tarjeta: 0,
                    venta_marca: '',
                    venta_tipo: '',
                    venta_autorizacion: '',
                    venta_operacion: '',
                    boletos: dataTickets.boletos,
                    sucursal: miTurno.sucursal
                };

                let horasS = dataSalida.llegada.split(':');

                $('.lblDetalleOrigen').html(`De ${dataCorrida.origen}`);
                $('.lblDetalleDestino').html(`A ${dataCorrida.destino}`);
                $('.lblDetalleSalida').html(`${dataSalida.horario_salida}`);
                $('.lblDetalleLlegada').html(`${horasS[0].length == 1 ? '0' + horasS[0] : horasS[0]}:${horasS[1].length == 1 ? '0' + horasS[1] : horasS[1]}`);
                $('.lblDetalleBoletos').html(`${dataTickets.boletos.length} Boletos`);

                let tableRows   = {},
                    terminar    = 0;

                dataTickets.boletos.forEach(function(boleto, index) {
                    console.log(boleto);
                    if((boleto.inputNombrePasajero.trim()).length == 0 )
                        terminar = 1;

                    if(boleto.inputMotivo == null && terminar == 0)
                        terminar = 2;

                    if(boleto.inputBoleto in tableRows) {
                        tableRows[boleto.inputBoleto]['qty'] += 1;

                        if(boleto.inputBoleto == '0') {
                            jsonSalesData.venta_ocupacion_real += 1;
                        } else {
                            lstDescuentos.forEach(function(descuento, index){
                                if(boleto.inputBoleto == descuento.descuento_id) {

                                    if(descuento.descuento_bypass_plaza == 0)
                                        jsonSalesData.venta_ocupacion_real += 1;

                                    if(descuento.descuento_plaza_especial == 1)
                                        jsonSalesData.venta_ocupacion_especial += 1;
                                }
                            });
                        }
                    } else {
                        if(boleto.inputBoleto == '0') {
                            tableRows[boleto.inputBoleto] = {qty: 1, descripcion: 'Boleto Tradicional', costo: parseFloat(dataCorrida.corridaPrecio), tipo: 0};
                            jsonSalesData.venta_ocupacion_real += 1;
                        } else {
                            lstDescuentos.forEach(function(descuento, index){
                                if(boleto.inputBoleto == descuento.descuento_id) {
                                    let costoDescuento = parseFloat(dataCorrida.corridaPrecio) * ((100 - parseFloat(descuento.descuento_porcentaje)) / 100);

                                    tableRows[boleto.inputBoleto] = {qty: 1, descripcion: `Boleto ${descuento.descuento_nombre}`, costo: costoDescuento, tipo: 1};

                                    if(descuento.descuento_bypass_plaza == 0)
                                        jsonSalesData.venta_ocupacion_real += 1;

                                    if(descuento.descuento_plaza_especial == 1)
                                        jsonSalesData.venta_ocupacion_especial += 1;
                                }
                            });
                        }
                    }
                });

                if(terminar == 1){
                    showMessage('warning', 'Administración', 'Ingrese todos los nombres de los pasajeros.');
                    return;
                }

                if(terminar == 2){
                    showMessage('warning', 'Administración', 'Ingrese todos los motivos de viajes.');
                    return;
                }
                
                let importeTotal = 0;
                $('#tblDetalleBoletos').html('');
                for (const row in tableRows) {
                    let importe = parseInt(tableRows[row]['qty']) * parseFloat(tableRows[row]['costo']);

                    let file = `
                        <tr class="font-weight-bolder border-bottom">
                            <td class="border-top-0 pl-0 pt-4">${tableRows[row]['descripcion']}</td>
                            <td class="border-top-0 text-right pt-4">${tableRows[row]['qty']}</td>
                            <td class="border-top-0 text-right pt-4">${currency( tableRows[row]['costo'] )}</td>
                            <td class="border-top-0 text-danger pr-0 pt-4 text-right">${currency( importe )}</td>
                        </tr>
                    `;

                    importeTotal += importe;
                    $('#tblDetalleBoletos').append( file );

                    if( tableRows[row]['tipo'] == 1)
                        jsonSalesData.venta_descuento += (parseFloat(dataCorrida.corridaPrecio) - parseFloat(tableRows[row]['costo'])) * parseInt(tableRows[row]['qty']);
                }

                jsonSalesData.venta_total = parseFloat( importeTotal );

                $('.lblDetalleImporteTotal').html( currency(importeTotal));
                $('#txtDetalleImporte').val( importeTotal );

                localStorage.setItem('jsonSalesData', JSON.stringify(jsonSalesData));

                $('.itemPagoEfectivo').click();

                importeTotal == 0 ? $('.seccionCobro').addClass('d-none') : $('.seccionCobro').removeClass('d-none')

                KTLayoutGeneralActions.openPanel();
            } else {
                showMessage('warning', 'Administración', 'Seleccione una corrida y una hora de salida.');
            }
        });

        let inputDetalleImporte = KTUtil.getById('txtDetalleImporte');
        KTUtil.addEvent(inputDetalleImporte, 'keyup', (e) => {
            let venta = JSON.parse( localStorage.getItem('jsonSalesData') );

            let recibido = $('#txtDetalleImporte').val();

            $('.lblDetalleCambio').html( currency( 0 ) );

            if(recibido != '') {
                recibido = parseFloat( recibido );
                if(recibido > 0){
                    let cambio = recibido - venta.venta_total;
                    $('.lblDetalleCambio').html( currency( cambio <= 0 ? 0 : cambio ) );
                }
            }
        });

        KTUtil.addEvent(btnGuardar, 'click', function(){
            let venta = JSON.parse(localStorage.getItem('jsonSalesData'));

            if( $('.itemPagoEfectivo').hasClass('active') ) {
                if( $('#txtDetalleImporte').val() == '') {
                    showMessage('warning', 'Pago', 'Debe de ingresar la cantidad de efectivo recibido por el cliente');
                    return false;
                }

                if( $('#txtDetalleImporte').val() < venta.venta_total) {
                    showMessage('warning', 'Pago', 'Debe de ingresar la cantidad de efectivo mayor o igual al importe total');
                    return false;
                }

                let recibido = $('#txtDetalleImporte').val();
                let cambio = recibido - venta.venta_total;

                venta.venta_tarjeta = 0;
                venta.venta_efectivo = parseFloat(recibido);
                venta.venta_cambio = cambio <= 0 ? 0 : cambio;
            }

            if( $('.itemPagoTarjeta').hasClass('active') ) {
                if( $('#cboMarcaTarjeta').val() == '') {
                    showMessage('warning', 'Pago', 'Debe de Seleccionar la marca de la tarjeta');
                    return false;
                }

                if( $('#cboTipoTarjeta').val() == '') {
                    showMessage('warning', 'Pago', 'Debe de Seleccionar el tipo de tarjeta');
                    return false;
                }

                if( $('#inputNumeroAutorizacion').val() == '') {
                    showMessage('warning', 'Pago', 'Debe de capturar el numero de autorización impreso en el voucher.');
                    return false;
                }

                if( $('#inputNumeroOperacion').val() == '') {
                    showMessage('warning', 'Pago', 'Debe de capturar el numero de operación impreso en el voucher.');
                    return false;
                }

                venta.venta_efectivo = 0;
                venta.venta_cambio = 0;
                venta.venta_tarjeta = venta.venta_total;

                venta.venta_marca = $('#cboMarcaTarjeta').val();
                venta.venta_tipo = $('#cboTipoTarjeta').val();
                venta.venta_autorizacion = $('#inputNumeroAutorizacion').val();
                venta.venta_operacion = $('#inputNumeroOperacion').val();
            }

            KTUtil.btnWait(btnGuardar, 'spinner spinner-right spinner-white pr-15', 'PROCESANDO LA VENTA', true);

            venta.turno_id = miTurno.turno_id;
            
            let options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify( venta )
            };
    
            fetch('/Pos/sale', options)
            .then(response => response.json())
            .then(data => {
                if(data.success){
                    localStorage.removeItem('jsonSalesData');
                    showMessage('dark', 'Venta exitosa', 'Se ha registrado la venta correctamente');
                    _resetForm();

                    setTimeout(() => {
                        location.reload();
                    }, '1000');
                }
            })
            .catch(( error ) => {
                console.log(error);
                showMessage('danger', 'Administración', error.message);
            });
        });

        let alreadyReloadedHistorialMovimiento = false;
        $('#mdlHistorialVenta').on('shown.bs.modal', function() {
            _historialVenta();

            if (!alreadyReloadedHistorialMovimiento) {
                let modalContent = $(this).find('.modal-content');
                datatableHistorialVenta.spinnerCallback(true, modalContent);

                datatableHistorialVenta.reload();

                datatableHistorialVenta.on('datatable-on-layout-updated', function() {
                    datatableHistorialVenta.show();
                    datatableHistorialVenta.spinnerCallback(false, modalContent);
                    datatableHistorialVenta.redraw();
                });

                alreadyReloadedHistorialMovimiento = true;
            }
        });

        let alreadyReloadedCorteCaja = false;
        $('#mdlCorteCaja').on('shown.bs.modal', async function() {
            $('#tblCategoria').html('');
            $('#tblEntradas').html('');
            $('#tblSalidas').html('');

            if(datatableCorteCaja)
                datatableCorteCaja.destroy();

            let prosigue = await _previewCorteCaja();

            KTApp.unblock('#mdlCorteCaja .modal-content');

            if( prosigue ) {
                if (!alreadyReloadedCorteCaja) {
                    let modalContent = $(this).find('.modal-content');
                    datatableCorteCaja.spinnerCallback(true, modalContent);
    
                    datatableCorteCaja.reload();
    
                    datatableCorteCaja.on('datatable-on-layout-updated', function() {
                        datatableCorteCaja.show();
                        datatableCorteCaja.spinnerCallback(false, modalContent);
                        datatableCorteCaja.redraw();
                    });
    
                    alreadyReloadedCorteCaja = true;
                }
            }            
        });

        $('#btnPreCerrarturno').on('click', function(){
            let totalCaja = ( miTurno.turno_efectivo_inicial + miTurno.venta_efectivo + miTurno.entrada_efectivo ) - miTurno.salida_efectivo;

            swal.fire({
                title: 'Cerrar turno',
                text: `Por favor confirme el dinero en caja (${currency(totalCaja)}) para proceder con el cierre de turno.`,
                icon: "warning",
                input: 'number',
                inputLabel: 'Efectivo en caja',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showCancelButton: true,
                confirmButtonText: "<i class='flaticon2-right-arrow icon-md'></i> Cerrar turno",
                cancelButtonText: "Cancelar",
                customClass: {
                    confirmButton: "btn btn-primary",
                    cancelButton: "btn btn-secondary"
                },
                target: document.getElementById('mdlCorteCaja'),
                inputValidator: (value) => {
                    if (!value) {
                      return 'Ingrese un valor correcto.'
                    }
                }
            }).then(function(result) {
                if(result.value){
                    swal.fire({
                        title: 'Espere un momento por favor',
                        text: 'Cerrando turno.',
                        icon: "info",
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        onOpen: function() {
                            Swal.showLoading()
                        }
                    });

                    let options = {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify( {
                            turno_id: miTurno.turno_id,
                            efectivo_final: totalCaja,
                            efectivo_real: result.value,
                            ventaTarjeta: miTurno.venta_tarjeta,
                            ventaTotal: miTurno.total_venta_boletos
                        } )
                    };

                    fetch(`/Pos/CerrarTurno`, options)
                    .then(response => response.json())
                    .then(result => {
                        swal.close();
                        showMessage('dark', 'Administración', result.message);

                        if(result.success){
                            window.location.replace('/HistorialCorte');
                        }
                    });
                }
            });
        });

        $(document).on('click', '.btn-reimprimir-boleto',  function(){
            let currentButton = $(this);
                currentButton
                .html('')
                .addClass(' spinner spinner-dark spinner-left ')
                .attr('disabled', 'disabled');
    
                let venta_id = currentButton.data('venta-id'),
                    venta_folio = currentButton.data('boleto-folio'),
                    boleto_id = currentButton.data('boleto-id'),
                    forma = 'boleto';
                    
                let options = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify( { venta_id, venta_folio, boleto_id, forma } )
                    };
    
                fetch('/Pos/Reimpresion', options)
                .then(response => response.json())
                .then(data => {
                    showMessage('dark', 'Administración', data.message);
                    
                    currentButton.html(`
                        <span class="svg-icon svg-icon-md">
                            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                                <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                    <rect x="0" y="0" width="24" height="24"/>
                                    <path d="M16,17 L16,21 C16,21.5522847 15.5522847,22 15,22 L9,22 C8.44771525,22 8,21.5522847 8,21 L8,17 L5,17 C3.8954305,17 3,16.1045695 3,15 L3,8 C3,6.8954305 3.8954305,6 5,6 L19,6 C20.1045695,6 21,6.8954305 21,8 L21,15 C21,16.1045695 20.1045695,17 19,17 L16,17 Z M17.5,11 C18.3284271,11 19,10.3284271 19,9.5 C19,8.67157288 18.3284271,8 17.5,8 C16.6715729,8 16,8.67157288 16,9.5 C16,10.3284271 16.6715729,11 17.5,11 Z M10,14 L10,20 L14,20 L14,14 L10,14 Z" fill="#000000"/>
                                    <rect fill="#000000" opacity="0.3" x="8" y="2" width="8" height="2" rx="1"/>
                                </g>
                            </svg>
                        </span>
                    `)
                    .removeAttr('disabled')
                    .removeClass(' spinner spinner-dark spinner-left ');
                })
                .catch(( error ) => {
                    console.log(error);
                    showMessage('danger', 'Administración', error.message);
                });
        });

        $(document).on('change', '.inputBoleto', function(){
            let salidaSeleccionada  = $("input[name='corrida_horario']:checked").data('detalle');
                                
            if(salidaSeleccionada) {
                let solicitarCredencial     = $(this).find(':selected').attr('data-credencial'),
                    parent                  = $(this).parent().parent(),
                    tienePlazaEspecial      = $(this).find(':selected').attr('data-especial');

                if(solicitarCredencial > 0){
                    parent.find('.folioCrendencial').removeClass('d-none');
                } else {
                    parent.find('.folioCrendencial').addClass('d-none');
                }

                if(tienePlazaEspecial > 0) {
                    let boletosEspecialesDisponbles = salidaSeleccionada.boleto_especial_permitido - salidaSeleccionada.boleto_especial_vendido,
                    boletosMemoria              = $objListaBoletos.repeaterVal(),
                    boletosPorVender            = 0;

                    boletosMemoria.boletos.forEach(function(boleto, index) {
                        if(boleto.inputBoleto != '0') {
                            lstDescuentos.forEach(function(descuento, index){
                                if(boleto.inputBoleto == descuento.descuento_id && descuento.descuento_plaza_especial == 1) {
                                    boletosPorVender += 1;
                                }
                            });
                        }
                    });
            
                    if(boletosPorVender > boletosEspecialesDisponbles || boletosEspecialesDisponbles == 0) {
                        showMessage('warning', 'Administración', 'No puedes agregar mas de este tipo de boletos');
                        $(this).prop('selectedIndex', 0);
                    }
                }
            } else {
                showMessage('warning', 'Administración', 'Debe seleccionar un horario de salida');
                $(this).prop('selectedIndex', 0);
            }
        });
    }

    var _resetForm = () => {
        KTLayoutGeneralActions.closePanel();

        $objListaBoletos.setList([
            { 'inputNombrePasajero': '', 'inputBoleto': '', 'rdoGenero': ''}
        ]);

        $('#contenedorHorarios').html(`
            <div id="seccionWelcome" class="d-flex flex-column h-100 justify-content-center pnlSeccion">
                <img class="mx-auto mb-10 w-75" src="resources/images/general/ASA-Logotipo.png" style="width: fit-content;">
            </div>
        `);

        let templateRepeatItem  = `
            <div data-repeater-item>
                <div class="form-group row mb-5">
                    <div class="col-md-1 px-3 align-self-end mb-1">
                        <a href="javascript:;" data-repeater-delete class="btn btn-sm font-weight-bolder btn-light-danger">
                            <i class="la la-trash-o"></i>
                        </a>
                    </div>

                    <div class="col-md-6 pr-0">
                        <input type="text" data-kt-repeater name="inputNombrePasajero" class="form-control"  placeholder="Nombre del pasajero" autocomplete="off" maxlength="250"/>
                    </div>

                    <div class="col-md-5">
                        <select class="form-control inputBoleto" data-kt-repeater name="inputBoleto" >
                            <option value="0">Selecciona una corrida</option>
                        </select>
                    </div>

                    <div class="col-md-7 pr-0 text-right pt-5">
                        <div class="radio-inline">
                            <label class="radio">
                                <input type="radio" checked="checked" name="rdoGenero" value="H" class="rdoGenero"/>
                                <span></span>
                                Hombre
                            </label>
                            <label class="radio">
                                <input type="radio" name="rdoGenero" value="M"/>
                                <span></span>
                                Mujer
                            </label>
                            <label class="radio">
                                <input type="radio" name="rdoGenero" value="NB"/>
                                <span></span>
                                No Binario
                            </label>
                        </div>
                    </div>

                    <div class="col-md-5 mt-2 d-none folioCrendencial">
                        <input type="text" data-kt-repeater name="inputFolioCredencial" class="form-control"  placeholder="Credencial/Folio" autocomplete="off"/>
                    </div>
                </div>
            </div>
        `;

        $('div[data-repeater-list|="boletos"]').html(templateRepeatItem);
        $objListaBoletos.destory();

        _cargarCorridas();
    }

    var _cargarDescuentos = function () {
        let options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        fetch('/Descuento', options)
        .then(response => response.json())
        .then(data => {
            if(data.success){
                lstDescuentos = data.data;

                _cargarCorridas();
            }
        })
        .catch(( error ) => {
            console.log(error);
            showMessage('danger', 'Administración', error.message);
        });
    };

    var _cargarMotivos = function () {
        let options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        fetch('/Motivo', options)
        .then(response => response.json())
        .then(data => {
            if(data.success){
                lstMotivos = data.data;
            }
        }).catch(( error ) => {
            console.log(error);
            showMessage('danger', 'Administración', error.message);
        });
    };

    var _cargarCorridas = function() {
        let options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        fetch('/Corrida', options)
        .then(response => response.json())
        .then(data => {
            $('#inputCorrida').selectpicker('destroy');

            if(data.success){
                let selOptions = '';
                data.data.forEach(function(corrida, index) {
                    selOptions += `
                        <option data-corrida-id="${corrida.corrida_id}" data-origen="${corrida.corrida_origen}" data-destino="${corrida.corrida_destino}" data-corrida-precio="${corrida.corrida_precio}" data-horario='${corrida.corrida_horario}' data-tiempo-estimado="${corrida.corrida_tiempo_estimado}" data-content="<div class='d-flex'> <div class='d-flex flex-column pr-5 flex-grow-1'> <div class='text-dark text-hover-primary mb-1 font-size-lg'>De ${corrida.corrida_origen}</div> <span class='text-dark text-hover-primary font-size-lg'>A ${corrida.corrida_destino}</span> </div> <div class='d-flex flex-column pr-1 text-right'> <span class='font-size-lg text-danger font-weight-bolder mb-1'> ${currency(corrida.corrida_precio)}</span> ${ (corrida.corrida_tiempo_estimado.length > 0) ? "<span class='font-size-sm'> <i class='ki ki-clock  icon-md'></i> "+ corrida.corrida_tiempo_estimado +"</span>" : "" } </div> </div>">Corrida ${index}</option>
                    `;
                });

                $('#inputCorrida')
                .html(selOptions)
                .selectpicker()
                .on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
                    //[[ PROCESAMIENTO DE HORARIOS ]]
                    let horarios        = $(this).find(":selected").data('horario'),
                        tiempoEstimado  = $(this).find(":selected").data('tiempo-estimado'),
                        boletoBase      = $(this).find(":selected").data('corrida-precio');

                    $('#contenedorHorarios').html('');

                    horarios.forEach(function(horario, index) {
                        let hrBase    = horario.horario_salida.split(':'),
                            hrSalida  = new Date(),
                            hrActual  = new Date();

                        hrSalida.setHours( parseInt(hrBase[0]), parseInt(hrBase[1]) + 10, 0 );

                        if( hrActual > hrSalida)
                            return;

                        let ventaMaxima = parseInt(horario.boleto_permitido) - parseInt(horario.boleto_vendido),
                            strLlegada  = '';

                        if(ventaMaxima == 0)
                            return;

                        horario.llegada = '----';

                        if(tiempoEstimado.length > 0) {
                            let horaSalida      = horario.horario_salida.split(':'),
                                horaViaje       = tiempoEstimado.split(':'),
                                tiempoLlegada   = new Date();

                            tiempoLlegada.setHours(parseInt(horaSalida[0]) + parseInt(horaViaje[0]), parseInt(horaSalida[1]) + parseInt(horaViaje[1]), 0 );

                            horario.llegada = `${tiempoLlegada.getHours()}:${tiempoLlegada.getMinutes()}`;

                            let hReal = horario.llegada.split(':');

                            strLlegada = `LLegada aprox. <span class="font-size-lg font-weight-bold">${hReal[0].length == 1 ? '0' + hReal[0] : hReal[0] }:${hReal[1].length == 1 ? '0' + hReal[1] : hReal[1] }</span> Horas<br>`;
                        }

                        let chekOption = `
                            <label class="option">
                                <span class="option-control">
                                    <span class="radio">
                                        <input type="radio" name="corrida_horario" data-detalle='${JSON.stringify(horario)}' value="${horario.horario_id}"/>
                                        <span></span>
                                    </span>
                                </span>
                                <span class="option-label">
                                    <span class="option-head">
                                        <span class="option-focus">
                                            Salida ${horario.horario_salida} HORAS
                                        </span>
                                    </span>
                                    <span class="option-body text-dark-75">
                                        ${ strLlegada }
                                        Disponibles <span class="font-size-lg font-weight-bold">${ ventaMaxima }</span> Asientos <br>
                                        Autobus <span class="font-size-lg font-weight-bold">${horario.autobus_nombre}</span>
                                    </span>
                                </span>
                            </label>
                        `;

                        $('#contenedorHorarios').append(chekOption);
                    });

                    //[[ PROCESAMIENTO DE BOLETOS ]]

                    let templateInputBoleto = `
                            <option data-bypass="0" data-especial="0" data-credencial="0" value="0">Tradicional ${currency(boletoBase)}</option>
                        `;

                    let templateInputMotivo = `<option value="" selected disabled>Motivo de viaje</option>`;

                    lstDescuentos.forEach(function(descuento, index){
                        templateInputBoleto += `
                            <option data-bypass="${descuento.descuento_bypass_plaza}" data-especial="${descuento.descuento_plaza_especial}" data-credencial="${descuento.descuento_credencial}" value="${descuento.descuento_id}">${descuento.descuento_nombre} ${currency( parseFloat(boletoBase) * ((100 - parseFloat(descuento.descuento_porcentaje)) / 100) )}</option>
                        `;
                    });

                    lstMotivos.forEach(function(motivo, index){
                        templateInputMotivo += `
                            <option value="${motivo.motivo_id}">${motivo.motivo_texto}</option>
                        `;
                    });

                    let templateRepeatItem  = `
                        <div data-repeater-item>
                            <div class="form-group row mb-5">
                                <div class="col-md-1 px-3 align-self-end mb-1">
                                    <a href="javascript:;" data-repeater-delete class="btn btn-sm font-weight-bolder btn-light-danger">
                                        <i class="la la-trash-o"></i>
                                    </a>
                                </div>

                                <div class="col-md-6 pr-0">
                                    <input type="text" data-kt-repeater name="inputNombrePasajero" class="form-control"  placeholder="Nombre del pasajero" autocomplete="off" maxlength="250"/>
                                </div>

                                <div class="col-md-5">
                                    <select class="form-control inputBoleto" data-kt-repeater name="inputBoleto" >
                                        ${templateInputBoleto}
                                    </select>
                                </div>

                                <div class="col-md-7 pr-0 text-right pt-5">
                                    <div class="radio-inline">
                                        <label class="radio">
                                            <input type="radio" checked="checked" name="rdoGenero" value="H" class="rdoGenero"/>
                                            <span></span>
                                            Hombre
                                        </label>
                                        <label class="radio">
                                            <input type="radio" name="rdoGenero" value="M"/>
                                            <span></span>
                                            Mujer
                                        </label>
                                        <label class="radio">
                                            <input type="radio" name="rdoGenero" value="NB"/>
                                            <span></span>
                                            No Binario
                                        </label>
                                    </div>
                                </div>

                                <div class="col-md-5 mt-2 d-none folioCrendencial">
                                    <input type="text" data-kt-repeater name="inputFolioCredencial" class="form-control"  placeholder="Folio / Credencial" autocomplete="off"/>
                                </div>

                                <div class="col-md-5 mt-2">
                                    <select class="form-control inputMotivo" data-kt-repeater name="inputMotivo" >
                                        ${templateInputMotivo}
                                    </select>
                                </div>
                            </div>
                        </div>
                    `;

                    if($objListaBoletos) {
                        let backupTickets = $objListaBoletos.repeaterVal();
                        $('div[data-repeater-list|="boletos"]').html(templateRepeatItem);
                        $objListaBoletos.destory();

                        if( 'boletos' in backupTickets ){
                            if(backupTickets.boletos.length > 0)
                                $objListaBoletos.setList(backupTickets.boletos);
                        }
                    } else {
                        $('div[data-repeater-list|="boletos"]').html(templateRepeatItem);

                        $objListaBoletos = $('#kt_repeat_boletos').repeater({
                            initEmpty: false,

                            show: function () {
                                if( $(this).find('.inputBoleto').val() === null ){
                                    $(this).find('.inputBoleto').prop('selectedIndex', 0);
                                } else if( $(this).find('.inputBoleto').val() > 0 ) {
                                    $(this).find('.folioCrendencial').removeClass('d-none');
                                }
                                // Esto se debe mejorar, deve validar si ya se habia seteado agun valor con anterioidad
                                $(this).find('.rdoGenero').prop('checked', true);

                                $(this).slideDown();
                            },
                
                            hide: function (deleteElement) {
                                $(this).slideUp(deleteElement);
                            }
                        });
                    }
                });
            }
        })
        .catch(( error ) => {
            console.log(error);
            showMessage('danger', 'Administración', 'Por favor recargue la página (F5), si el problema persiste solcite a soporte técnico.');
        });
    };

    var _cargarConfiguraciones = ()=> {
		let options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

		fetch("/Pos/Configuracion", options)
        .then(response => response.json())
        .then(configuracion => {
            let turno = configuracion.turno;

            if(turno.success){
                miTurno = (turno.data) ? turno.data : {};

                if($.isEmptyObject(miTurno)){
                    swal.fire({
                        title: 'Iniciar turno',
                        text: 'Abrir un turno nuevo para iniciar una venta',
                        icon: "warning",
                        input: 'number',
                        inputLabel: 'Fondo de la caja',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showCancelButton: true,
                        confirmButtonText: "<i class='flaticon2-right-arrow icon-md'></i> Abrir turno",
                        cancelButtonText: "Cancelar",
                        customClass: {
                            confirmButton: "btn btn-primary",
                            cancelButton: "btn btn-secondary"
                        },
                        inputValidator: (value) => {
                            if (!value) {
                                return 'Ingrese un valor correcto.'
                            }
                        }
                    }).then(function(result) {
                        if(result.value){
                            swal.fire({
                                title: 'Espere un momento.',
                                text: 'Configurando turno.',
                                icon: "info",
                                allowOutsideClick: false,
                                allowEscapeKey: false,
                                onOpen: function() {
                                    Swal.showLoading()
                                }
                            });

                            options = {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify( {importeInicial: result.value} )
                            };

                            fetch(`/Pos/AbrirTurno`, options)
                            .then(response => response.json())
                            .then(infoTurno => {
                                swal.close();
                                showMessage('dark', 'Administración', infoTurno.message);

                                if(infoTurno.success && infoTurno.miTurno.success) {
                                    miTurno = infoTurno.miTurno.data;

                                    parsearInformacionComercio(configuracion.comercio);
                                    parsearInformacionBase(configuracion.base, configuracion.authData);
                                    _cargarMotivos();
                                    _cargarDescuentos();
                                    _movimientoEfectivo();

                                    if(!configuracion.permisoMovimientoEfectivo)
                                        $('.itemMovimientoEfectivo, #mdlNovimientoEfectivo').remove();

                                    if(!configuracion.permisoHistorialVenta)
                                        $('.itemHistorialVenta, #mdlHistorialVenta').remove();

                                    if(!configuracion.permisoCorteCaja)
                                        $('.itemCorteCaja, #mdlCorteCaja').remove();

                                    permisoImpresion = configuracion.permisoReimpresion;
                                }
                            });
                        } else {
                            window.location.replace('/');
                        }                            
                    });
                } else {
                    parsearInformacionComercio(configuracion.comercio);
                    parsearInformacionBase(configuracion.base, configuracion.authData);
                    _cargarMotivos();
                    _cargarDescuentos();
                    _movimientoEfectivo();

                    if(!configuracion.permisoMovimientoEfectivo)
                        $('.itemMovimientoEfectivo, #mdlNovimientoEfectivo').remove();

                    if(!configuracion.permisoHistorialVenta)
                        $('.itemHistorialVenta, #mdlHistorialVenta').remove();

                    if(!configuracion.permisoCorteCaja)
                        $('.itemCorteCaja, #mdlCorteCaja').remove();

                    permisoImpresion = configuracion.permisoReimpresion;
                }
            } else {
                showMessage('warning', 'Administración', 'No es posible recuperar la información del turno actual, Intentelo más tarde.');
            }
        });
	}

    var parsearInformacionComercio = (comercio) => {
        if(comercio.success){
            let informacion_comercio = JSON.parse(comercio.data),
                now = new Date();

            $('.lblNombreEmpresa').html(informacion_comercio.inputGeneralNombre);
            $('.lblFechaHora').html(`Hoy es ${now.getDate()} de ${meses[now.getMonth()]} del ${now.getFullYear()}`);
            miTurno.sucursal = informacion_comercio.inputGeneralSucursal;

            $('.lblTurnoActual').html(`#${miTurno.turno_id}`);
        }
    };

    var parsearInformacionBase = (base, authData) => {
        if(base.success){
            let configuracion   = JSON.parse(base.data),
                hasActive       = false;

            if(configuracion.inputBaseEfectivo == 'true'){
                hasActive = true;

                $('.tabPagoEfectivo')
                .removeClass('d-none')
                .addClass('active show');;

                $('.itemPagoEfectivo')
                .addClass('active')
                .parent().removeClass('d-none');
            }

            if(configuracion.inputBaseTarjeta == 'true') {
                $('.tabPagoTarjeta').removeClass('d-none');

                $('.itemPagoTarjeta')
                .parent().removeClass('d-none');

                if(!hasActive) {
                    hasActive = true;

                    $('.tabPagoTarjeta')
                    .addClass('active show');

                    $('.itemPagoTarjeta')
                    .addClass('active');
                }
            }
        }
        
        $('.lblNombreCajero').html(`Cajero: ${authData.usuario_propietario}`);
    }

    var _movimientoEfectivo = function() {
        datatableMovimientos = $('#table_movimiento_efectivo').KTDatatable({
            data: {
                type: 'remote',
                source: {
					read: {
						url: `/Pos/MovimientoEfectivo/${miTurno.turno_id}`,
						method: 'GET',
						contentType: 'application/json',
						map: function(raw) {
                            let dataSet = raw;

                            if (typeof raw.data !== 'undefined') {
                                dataSet = raw.data;
                            }

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
            translate: translateKTable,
            columns: [{
                field: 'usuario_propietario',
                title: 'Cajero',
                width: 'auto',
            }, {
                field: 'movimiento_importe',
                title: 'Importe',
                width: 70,
                template: (row) => {
                    return `
                        <span class="${(row.movimiento_tipo == 'E' ? 'text-primary' : 'text-danger')} font-weight-bolder font-size-lg">${currency(row.movimiento_importe)}</span>
                    `;
                }
            }, {
                field: 'movimiento_tipo',
                title: 'Tipo',
                width: 70,
                template: (row) => {
                    return `
                        <span class="${(row.movimiento_tipo == 'E' ? 'text-primary' : 'text-danger')} font-weight-bolder font-size-lg">${(row.movimiento_tipo == 'E' ? 'Entrada' : 'Salida')}</span>
                    `;
                }
            }, {
                field: 'movimiento_fecha',
                title: 'Fecha',
                width: 130,
                sortable: 'desc'
            }, {
                field: 'movimiento_comentario',
                title: 'Comentario',
                width: 'auto'
            }, {
                field: 'movimiento_id',
                title: '',
                sortable: false,
                textAlign: 'right',
                width: 40,
                template: function(row) {
                    return `
                        <a href="javascript:;" class="btn btn-sm btn-icon btn-outline-danger" data-eliminar-movimiento='${row.movimiento_id}' title="Eliminar movimiento">
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

        $('#filtroTipoMovimiento').on('change', function() {
			datatableMovimientos.search($(this).val().toLowerCase(), 'movimiento_tipo');
		});

        datatableMovimientos.on('click', '[data-eliminar-movimiento]', function() {
            let movimientoId = $(this).data('eliminar-movimiento');

            Swal.fire({
                title: "¿Estas seguro?",
                text: `Confirma que deseas eliminar el registro de este movimiento`,
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
                        body: JSON.stringify( { movimientoId } )
                    };

                    fetch('/Pos/MovimientoEfectivo', options)
                    .then(response => response.json())
                    .then(data => {
                        showMessage('dark', 'Administración', data.message);

                        if(data.success){
                            if(datatableMovimientos)
                                datatableMovimientos.reload();
                        }
                    })
                    .catch(( error ) => {
                        console.log(error);
                        showMessage('danger', 'Administración', error.message);
                    });
                }
            });
        });

        let modal           = $('#mdlNovimientoEfectivo');
        let alreadyReloaded = false;

        modal.on('shown.bs.modal', function() {
            if (!alreadyReloaded) {
                let modalContent = $(this).find('.modal-content');
                datatableMovimientos.spinnerCallback(true, modalContent);

                datatableMovimientos.reload();

                datatableMovimientos.on('datatable-on-layout-updated', function() {
                    datatableMovimientos.show();
                    datatableMovimientos.spinnerCallback(false, modalContent);
                    datatableMovimientos.redraw();
                });

                alreadyReloaded = true;
            }
        });
    };

    var _validacionFormMovimientoEfectivo = () => {
        KTUtil.addEvent(btnRegistrarMovimiento, 'click', function(e) {
            e.preventDefault();

            reglaFormMovimiento.validate().then((status) => {
                if (status == 'Valid') {
                    KTUtil.btnWait(btnRegistrarMovimiento, 'spinner spinner-right spinner-white pr-15', 'Espere por favor', true);

                    let formElement = new FormData( document.getElementById('frmMovimiento') ),
				        formData 	= Object.fromEntries(formElement.entries());

                    formData.turno_id = miTurno.turno_id;
                        
                    let options = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify( formData )
                    };

                    fetch('/Pos/RegistrarMovimiento', options)
                    .then(response => response.json())
                    .then(data => {
                        showMessage('dark', 'Administración', data.message);

                        if(data.success){
                            $('#frmMovimiento')[0].reset();

                            if(datatableMovimientos)
                                datatableMovimientos.reload();
                        }
                    })
                    .catch(( error ) => {
                        console.log(error);
                        showMessage('danger', 'Administración', error.message);
                    })
                    .finally(() => {
                        KTUtil.btnRelease(btnRegistrarMovimiento);
                    });
                }
            });
        });
    };

    var _historialVenta = function() {
        datatableHistorialVenta = $('#table_historial_venta').KTDatatable({
            data: {
                type: 'remote',
                source: {
					read: {
						url: `/Pos/GetHistorialVenta/${miTurno.turno_id}`,
						method: 'GET',
						contentType: 'application/json',
						map: function(raw) {
                            let dataSet = raw;

                            if (typeof raw.data !== 'undefined') {
                                dataSet = raw.data;
                            }

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
            detail: {
				title: 'Detalle de la venta',
				content: tableDetalleVenta,
			},
            search: {
                input: $('#kt_datatable_search_query'),
                key: 'generalSearch'
            },
            translate: translateKTable,
            columns: [{
                field: 'venta_id',
                title: '',
                sortable: false,
                width: 40,
                textAlign: 'center',
            }, {
                field: 'venta_folio',
                title: 'Folio',
                width: 80,
            }, {
                field: 'venta_fecha',
                title: 'Fecha/Hora',
                width: 130,
                template: (row) => {
                    return `${row.venta_fecha} ${row.venta_hora}`;
                }
            }, {
                field: 'venta_cantidad',
                title: 'Boletos',
                textAlign: 'center',
                width: 65
            }, {
                field: 'venta_sucursal',
                title: 'Sucursal'
            }, {
                field: 'venta_total',
                title: 'Importe',
                width: 100,
                template: function(row) {
                    return currency(row.venta_total)
                }
            }, {
                field: 'venta_hora',
                title: '',
                sortable: false,
                textAlign: 'right',
                width: '40',
                template: function(row) {
                    return permisoImpresion ? `
                        <a href="javascript:;" class="btn btn-sm btn-icon btn-outline-primary" data-imprimir-tiket='${row.venta_id}' data-folio="${row.venta_folio}" title="Reimprimir ticket de venta">
                            <span class="svg-icon svg-icon-md">
                                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                                    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                        <rect x="0" y="0" width="24" height="24"/>
                                        <path d="M16,17 L16,21 C16,21.5522847 15.5522847,22 15,22 L9,22 C8.44771525,22 8,21.5522847 8,21 L8,17 L5,17 C3.8954305,17 3,16.1045695 3,15 L3,8 C3,6.8954305 3.8954305,6 5,6 L19,6 C20.1045695,6 21,6.8954305 21,8 L21,15 C21,16.1045695 20.1045695,17 19,17 L16,17 Z M17.5,11 C18.3284271,11 19,10.3284271 19,9.5 C19,8.67157288 18.3284271,8 17.5,8 C16.6715729,8 16,8.67157288 16,9.5 C16,10.3284271 16.6715729,11 17.5,11 Z M10,14 L10,20 L14,20 L14,14 L10,14 Z" fill="#000000"/>
                                        <rect fill="#000000" opacity="0.3" x="8" y="2" width="8" height="2" rx="1"/>
                                    </g>
                                </svg>
                            </span>
                        </a>
                    ` : '';
                },
            }],
        });

        datatableHistorialVenta.on('click', '[data-imprimir-tiket]', function() {
            let currentButton = $(this);
            currentButton
            .html('')
            .addClass(' spinner spinner-white spinner-left ')
            .attr('disabled', 'disabled');

            let venta_id = currentButton.data('imprimir-tiket'),
                venta_folio = currentButton.data('folio'),
                boleto_id = 0,
                forma = 'ticket';
                
            let options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify( { venta_id, venta_folio, boleto_id, forma } )
                };

            fetch('/Pos/Reimpresion', options)
            .then(response => response.json())
            .then(data => {
                showMessage('dark', 'Administración', data.message);
                
                currentButton.html(`
                    <span class="svg-icon svg-icon-md">
                        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                <rect x="0" y="0" width="24" height="24"/>
                                <path d="M16,17 L16,21 C16,21.5522847 15.5522847,22 15,22 L9,22 C8.44771525,22 8,21.5522847 8,21 L8,17 L5,17 C3.8954305,17 3,16.1045695 3,15 L3,8 C3,6.8954305 3.8954305,6 5,6 L19,6 C20.1045695,6 21,6.8954305 21,8 L21,15 C21,16.1045695 20.1045695,17 19,17 L16,17 Z M17.5,11 C18.3284271,11 19,10.3284271 19,9.5 C19,8.67157288 18.3284271,8 17.5,8 C16.6715729,8 16,8.67157288 16,9.5 C16,10.3284271 16.6715729,11 17.5,11 Z M10,14 L10,20 L14,20 L14,14 L10,14 Z" fill="#000000"/>
                                <rect fill="#000000" opacity="0.3" x="8" y="2" width="8" height="2" rx="1"/>
                            </g>
                        </svg>
                    </span>
                `)
                .removeAttr('disabled')
                .removeClass(' spinner spinner-white spinner-left ');
            })
            .catch(( error ) => {
                console.log(error);
                showMessage('danger', 'Administración', error.message);
            });
        });
    };

    var tableDetalleVenta = function(e) {
        let childId = `child_data_local_${e.data.venta_id}`;

        let headDetalle = `
            <div class="d-flex flex-wrap py-5">
                <div class="d-flex flex-center mr-10">
                    <span class="bullet bullet-bar bg-gray-700 align-self-stretch mr-4 my-1"></span>
                
                    <div class="d-flex flex-column flex-grow-1">
                        <a href="javascript:void(0);" class="text-dark-75 text-hover-primary font-weight-bolder font-size-lg mb-1">
                            Cajero
                        </a>
                        <span class="text-muted font-weight-bold">
                            ${e.data.cajero}
                        </span>
                    </div>
                </div>

                <div class="d-flex flex-center mr-10">
                    <span class="bullet bullet-bar bg-gray-700 align-self-stretch mr-4 my-1"></span>
                
                    <div class="d-flex flex-column flex-grow-1">
                        <a href="javascript:void(0);" class="text-dark-75 text-hover-primary font-weight-bolder font-size-lg mb-1">
                            Origen
                        </a>
                        <span class="text-muted font-weight-bold">
                            ${e.data.corrida_origen}
                        </span>
                    </div>
                </div>

                <div class="d-flex flex-center mr-10">
                    <span class="bullet bullet-bar bg-gray-700 align-self-stretch mr-4 my-1"></span>
                
                    <div class="d-flex flex-column flex-grow-1">
                        <a href="javascript:void(0);" class="text-dark-75 text-hover-primary font-weight-bolder font-size-lg mb-1">
                            Destino
                        </a>
                        <span class="text-muted font-weight-bold">
                            ${e.data.corrida_destino}
                        </span>
                    </div>
                </div>

                <div class="d-flex flex-center mr-10">
                    <span class="bullet bullet-bar bg-gray-700 align-self-stretch mr-4 my-1"></span>
                
                    <div class="d-flex flex-column flex-grow-1">
                        <a href="javascript:void(0);" class="text-dark-75 text-hover-primary font-weight-bolder font-size-lg mb-1">
                            Hora de salida
                        </a>
                        <span class="text-muted font-weight-bold">
                            ${e.data.horario_salida} Horas
                        </span>
                    </div>
                </div>

                <div class="d-flex flex-center mr-10">
                    <span class="bullet bullet-bar bg-gray-700 align-self-stretch mr-4 my-1"></span>
                
                    <div class="d-flex flex-column flex-grow-1">
                        <a href="javascript:void(0);" class="text-dark-75 text-hover-primary font-weight-bolder font-size-lg mb-1">
                            Autobus
                        </a>
                        <span class="text-muted font-weight-bold">
                            ${e.data.autobus_nombre}
                        </span>
                    </div>
                </div>

                <div class="d-flex flex-center mr-10">
                    <span class="bullet bullet-bar bg-gray-700 align-self-stretch mr-4 my-1"></span>
                
                    <div class="d-flex flex-column flex-grow-1">
                        <a href="javascript:void(0);" class="text-dark-75 text-hover-primary font-weight-bolder font-size-lg mb-1">
                            Metodo Pago
                        </a>
                        <span class="text-muted font-weight-bold">
                            ${e.data.venta_efectivo > 0 ? 'Efectivo: ' + currency(e.data.venta_efectivo) : 'Tarjeta: #Aut ' + e.data.venta_autorizacion}
                        </span>
                    </div>
                </div>
            </div>

            <div class="separator separator-dashed mb-2"></div>
        `;

		$('<div/>').attr('id', childId).appendTo(e.detailCell).KTDatatable({
			data: {
				type: 'local',
				source: JSON.parse(e.data.detalle_venta)
			},
			layout: {
				scroll: true,
				height: 400,
				footer: false,
			},
            sortable: false,
            pagination: false,
			columns: [
				{
					field: 'detalle_folio',
					title: 'Folio'
				}, {
					field: 'detalle_asiento',
					title: 'Asiento'
				}, {
					field: 'detalle_beneficiario',
					title: 'Pasajero',
                    width: 'auto'
				}, {
					field: 'descuento_id',
					title: 'Boleto',
                    width: 'auto',
                    template: function(row) {
                        let tipoBoleto;
                        if(row.descuento_id == 0){
                            tipoBoleto = 'Boleto Tradicional';
                        } else {
                            tipoBoleto = `Boleto ${row.venta_descuento_nombre} ${row.venta_descuento}% Off`;
                        }

                        return tipoBoleto;
                    }
				}, {
                    field: 'detalle_id',
                    title: '',
                    sortable: false,
                    textAlign: 'left',
                    width: '60',
                    template: function(row) {
                        return permisoImpresion ? `
                            <a href="javascript:;" class="btn-reimprimir-boleto btn btn-sm btn-icon btn-outline-secondary" data-venta-id="${e.data.venta_id}" data-boleto-id='${row.detalle_id}' data-boleto-folio="${row.detalle_folio}" title="Reimprimir boleto de pasajero">
                                <span class="svg-icon svg-icon-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                                        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                            <rect x="0" y="0" width="24" height="24"/>
                                            <path d="M16,17 L16,21 C16,21.5522847 15.5522847,22 15,22 L9,22 C8.44771525,22 8,21.5522847 8,21 L8,17 L5,17 C3.8954305,17 3,16.1045695 3,15 L3,8 C3,6.8954305 3.8954305,6 5,6 L19,6 C20.1045695,6 21,6.8954305 21,8 L21,15 C21,16.1045695 20.1045695,17 19,17 L16,17 Z M17.5,11 C18.3284271,11 19,10.3284271 19,9.5 C19,8.67157288 18.3284271,8 17.5,8 C16.6715729,8 16,8.67157288 16,9.5 C16,10.3284271 16.6715729,11 17.5,11 Z M10,14 L10,20 L14,20 L14,14 L10,14 Z" fill="#000000"/>
                                            <rect fill="#000000" opacity="0.3" x="8" y="2" width="8" height="2" rx="1"/>
                                        </g>
                                    </svg>
                                </span>
                            </a>
                        ` : '';
                    },
                }
            ],
		});

        $(`#${childId}`).prepend( headDetalle );
	};

    var _previewCorteCaja = function() {
        KTApp.block('#mdlCorteCaja .modal-content', {
            overlayColor: '#000000',
            state: 'primary',
            message: 'Cargando información de las ventas...'
        });

        return new Promise((resolve, reject) => {
            let options = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
    
            fetch('/Pos/GetTurno/0', options)
            .then(response => response.json())
            .then(data => {
                if(data.success){
                    let result = data.data;
    
                    miTurno = result;
    
                    $('.lbl-nombre-cajero').html(`Corte de ${result.nombre_usuario_apertura}`);
    
                    let dateInfo = result.turno_fecha_apertura.split(' ');
                    $('.lbl-fecha-inicio').html(`Iniciado el ${dateInfo[0]} a las ${dateInfo[1]}`);
    
                    let totalEfectivo = ( result.turno_efectivo_inicial + result.venta_efectivo + result.entrada_efectivo ) - result.salida_efectivo;
    
                    $('.lbl-total-efectivo').html(`${currency(totalEfectivo)}`);
                    $('.lbl-salida-efectivo').html(`${currency(result.salida_efectivo)}`);
                    $('.lbl-total-venta-producto').html(`${currency(result.total_venta_boletos)}`);
                    $('.lbl-entrada-devolucion').html(`${currency(0)}`);
                    $('.lbl-fondo-inicial').html(`${currency(result.turno_efectivo_inicial)}`);
                    $('.lbl-total-pagos-efectivo').html(`${currency(result.venta_efectivo)}`);
                    $('.lbl-entrada-efectivo').html(`${currency(result.entrada_efectivo)}`);
                    $('.lbl-total-pagos-tarjeta').html(`${currency(result.venta_tarjeta)}`);
    
                    let movimiento_efectivo = JSON.parse( result.movimiento_efectivo );
    
                    $('#tblEntradas').html('');
                    $('#tblSalidas').html('');
    
                    $.each(movimiento_efectivo, function(index, item){
                        let row = `
                            <tr>
                                <td>${item.fecha}</td>
                                <td>${item.comentario}</td>
                                <td>${currency(item.importe)}</td>
                            </tr>
                        `;
    
                        $(row).appendTo(item.tipo == 'E' ? '#tblEntradas' : '#tblSalidas');
                    });
    
                    let detalle_tipo_descuento = JSON.parse(result.detalle_tipo_descuento);
    
                    $('#tblCategoria').html('');
    
                    $.each(detalle_tipo_descuento, function(index, item){
                        if(item.descuento_estatus == 1 || item.descuento_id == 0) {
                            let row = `
                                <tr>
                                    <td>(${item.total_pasajeros}) Boleto ${item.descuento_nombre}</td>
                                    <td>Total recaudado <b>${currency(item.total_venta)}</b></td>
                                </tr>
                            `;
    
                            $(row).appendTo('#tblCategoria');
                        }
                    });
    
                    datatableCorteCaja = $('#table_corte_caja').KTDatatable({
                        data: {
                            type: 'remote',
                            source: {
                                read: {
                                    url: `/Pos/GetHistorialVenta/${miTurno.turno_id}`,
                                    method: 'GET',
                                    contentType: 'application/json',
                                    map: function(raw) {
                                        let dataSet = raw;
            
                                        if (typeof raw.data !== 'undefined') {
                                            dataSet = raw.data;
                                        }
            
                                        return dataSet;
                                    },
                                },
                            },
                            pageSize: 5,
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
                        translate: translateKTable,
                        columns: [{
                            field: 'venta_folio',
                            title: 'Folio',
                            width: 80,
                        }, {
                            field: 'venta_fecha',
                            title: 'Fecha/Hora',
                            width: 130,
                            template: (row) => {
                                return `${row.venta_fecha} ${row.venta_hora}`;
                            }
                        }, {
                            field: 'venta_cantidad',
                            title: 'Boletos',
                            textAlign: 'center',
                            width: 65
                        }, {
                            field: 'venta_sucursal',
                            title: 'Sucursal'
                        }, {
                            field: 'venta_total',
                            title: 'Importe',
                            width: 100,
                            template: function(row) {
                                return currency(row.venta_total)
                            }
                        }],
                    });

                    resolve(true);
    
                } else {
                    showMessage('warning', 'Administración', data.message);
                    resolve(false);
                }
            })
            .catch(( error ) => {
                console.log(error);
                showMessage('danger', 'Administración', error.message);
            });
        });
    };

    return {
		init: function(){
            btnGuardar      = KTUtil.getById('btnGuardar');
            btnValidar      = KTUtil.getById('btnValidar');
            btnPrecreate    = KTUtil.getById('btnPrecreate');
            btnRegistrarMovimiento  = KTUtil.getById('btnRegistrarMovimiento');

            _activarControles();
            _cargarConfiguraciones();
            _validacionFormMovimientoEfectivo();
        }
	};

}();

$(function() {
    uxControl.init();

    marcarMenu('asideMenuVenta');
});