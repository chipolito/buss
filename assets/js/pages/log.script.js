'use strict';

var uxControl = function () {
    var datatable;

    var _cargarCatalogo = function() {
        datatable = $('#kt_datatable').KTDatatable({
            data: {
                type: 'remote',
                source: {
					read: {
						url: '/Logs',
						method: 'GET',
						contentType: 'application/json',
						map: function(raw) {
                            let dataSet = raw;

                            if (typeof raw.data !== 'undefined') {
                                dataSet = raw.data;
                            }

							showMessage('dark', 'Administración', raw.message);

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
                field: 'fecha_hora',
                title: 'Fecha'
            }, {
                field: 'usuario_propietario',
                title: 'Usuario'
            }, {
                field: 'modulo',
                title: 'Acción',
                template: (row) => {
                    return `${row.modulo} | ${row.accion}`;
                }
            }, {
                field: 'detalle',
                title: 'Detalle'
            }],
        });
    };

    return {
		init: function(){
            _cargarCatalogo();
        }
	};

}();

$(function() {
    uxControl.init();
});