var uxControl = function () {
	var arqueoDatatable;

    var _loadArqueo = ()=> {
		arqueoDatatable = $('#arqueosTable').KTDatatable({
			data: {
				type: 'remote',
				source: {
					read: {
						url: '/Pos/GetTurnos',
						method: 'GET',
						contentType: 'application/json',
						map: function(raw) {
                            let dataSet = raw;
                            if (typeof raw.data !== 'undefined') {
                                dataSet = raw.data;
                            }
							showMessage('dark', 'Historial', raw.message);
                            return dataSet;
                        },
					},
				},
				pageSize: 10,
				saveState: false,
				serverPaging: false,
				serverFiltering: false,
				serverSorting: false,
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
				input: $('#arqueosTable_search_query'),
				key: 'generalSearch'
			},
			translate: translateKTable,
			columns: [
				{
					field: 'turno_fecha_apertura',
					title: 'Fecha apertura',
					width: 140
				}, {
					field: 'turno_fecha_cierre',
					title: 'Fecha cierre',
					width: 140,
					overflow: 'visible',
					autoHide: false,
					template: function(row) {
                        return (row.turno_estatus == 1) ? 'N/A' : row.turno_fecha_cierre;
					},
				}, {
                    field: 'turno_web',
                    title: 'Origen',
                    template: function(row){
                        return row.turno_web == 1 ? 'Aplicación web' : 'Terminal'
                    }
                }, {
                    field: 'turno_venta_total',
                    title: 'Venta',
                    width: 70,
                    template: function(row) {
                        return currency(row.turno_venta_total);
                    }
                }, {
                    field: 'turno_efectivo_real',
                    title: 'Efectivo',
                    width: 70,
                    template: function(row) {
                        return currency(row.turno_efectivo_real);
                    }
                }, {
                    field: 'turno_venta_tarjeta',
                    title: 'Tarjeta',
                    width: 70,
                    template: function(row) {
                        return currency(row.turno_venta_tarjeta);
                    }
                }, {
                    field: 'usuario_apertura',
                    title: 'Cajero'
                },{
					field: 'turno_estatus',
					title: 'Estatus',
					width: 60,
					overflow: 'visible',
					autoHide: false,
					template: function(row) {
                        return (row.turno_estatus == 1) ? 'Activo' : 'Cerrado';
					},
				}, {
					field: 'turno_id',
					title: '',
					width: '120',
					overflow: 'visible',
					autoHide: false,
					template: function(row) {
                        return `
                            <a href="javascript:;" class="btn btn-sm btn-icon btn-outline-primary" data-pdf-arqueo='${row.turno_id}' id="btnPrint${row.turno_id}" title="Imprimir Documento PDF">
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
                        `;
					},
				}
			],
		});

		$('#arqueosTable_search_estado').on('change', function() {
			arqueoDatatable.search($(this).val(), 'turno_estatus');
		});

        arqueoDatatable.on('click', '[data-pdf-arqueo]', function() {
            let btn = KTUtil.getById( $(this).attr('id') ),
                contentBkp = $(this).html();

            $(this).html('');

            KTUtil.btnWait(btn, 'spinner spinner-right spinner-white pr-15', '', true);

            let turno_id = $(this).data('pdf-arqueo');

            let options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify( { turno_id } )
            };
    
            fetch('/Pos/GeneraPdfCorte', options)
            .then(response => response.json())
            .then(async data => {
                $(this).html( contentBkp );
                KTUtil.btnRelease(btn);
                
                if(data.success) {
                    showMessage('dark', 'Arqueo de caja', 'Formato generado');
                    window.open(`http://localhost:3000/resources/formas/${data.msg}`, "_blank");
                }
            });
        });
	}

    return {
		init: function(){
			_loadArqueo();
        }
	};

}();

$(function() {
    uxControl.init();

    marcarMenu('asideMenuCorte');
});