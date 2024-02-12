var Service = require('node-windows').Service;

var svc = new Service({
  name:'Disse-Tickets',
  description: 'Aplicación para venta de tickets de autobus.',
  script: 'C:\\AppServ\\www\\disse-tickets\\src\\app.js',
});

svc.on('install',function(){
    console.log('Service installed');
    svc.start();
});

svc.install();