const express   = require('express');
const router    = express.Router();
const           { getPermisos, redirectAuth, getAutobuses, tienePermiso } = require('../controllers/auxiliar.controller');

router.get('/', redirectAuth, (req, res) => {
    let authData = req.session.authData;

    res.render('layout', {
        childPage:'page/board',
        pageName: 'Panel de entrada',
        sidebarState: 'off',
        actualUser: authData.usuario_propietario
    });
});

router.get('/Auth', (req, res) => {
    res.render('page/index');
});

router.get('/Logout', (req, res) => {
    req.session.destroy();
    res.redirect('/Auth');
});

router.get('/CatalogoAutobus', redirectAuth, (req, res) => {
    let { autorizado, ejs401 } = tienePermiso(req, 'p5');

    let authData = req.session.authData;

    res.render('layout', autorizado ? {
        childPage:'page/autobus',
        pageName: 'Administración de autobuses',
        sidebarState: 'off',
        actualUser: authData.usuario_propietario
    } : ejs401);
});

router.get('/CatalogoDescuento', redirectAuth, (req, res) => {
    let { autorizado, ejs401 } = tienePermiso(req, 'p6');

    let authData = req.session.authData;

    res.render('layout', autorizado ? {
        childPage:'page/descuento',
        pageName: 'Administración de descuentos',
        sidebarState: 'off',
        actualUser: authData.usuario_propietario
    } : ejs401);
});

router.get('/CatalogoUsuario', redirectAuth, async (req, res) => {
    let { autorizado, ejs401 } = tienePermiso(req, 'p8');

    let authData = req.session.authData,
        permisos = await getPermisos();

    res.render('layout', autorizado ? {
        childPage:'page/usuario',
        pageName: 'Administración de usuarios',
        sidebarState: 'off',
        actualUser: authData.usuario_propietario,
        permisos
    } : ejs401);
});

router.get('/Ajustes', redirectAuth, (req, res) => {
    let { autorizado, ejs401 } = tienePermiso(req, 'p10');

    let authData = req.session.authData;

    res.render('layout', autorizado ? {
        childPage:'page/ajuste',
        pageName: 'Ajustes del sistema',
        sidebarState: 'off',
        actualUser: authData.usuario_propietario
    } : ejs401);
});

router.get('/CatalogoCorrida', redirectAuth, async (req, res) => {
    let { autorizado, ejs401 } = tienePermiso(req, 'p7');

    let authData = req.session.authData,
        autobuses = await getAutobuses();

    res.render('layout', autorizado ? {
        childPage:'page/corrida',
        pageName: 'Administración de corridas',
        sidebarState: 'off',
        actualUser: authData.usuario_propietario,
        autobuses
    } : ejs401);
});

router.get('/Venta', redirectAuth, (req, res) => {
    let { autorizado, ejs401 } = tienePermiso(req, 'p1');

    let authData = req.session.authData;

    res.render('layout', autorizado ? {
        childPage:'page/venta',
        pageName: 'Venta de boletos',
        sidebarState: 'off',
        actualUser: authData.usuario_propietario
    } : ejs401);
});

router.get('/HistorialCorte', redirectAuth, (req, res) => {
    let { autorizado, ejs401 } = tienePermiso(req, 'p9');

    let authData = req.session.authData;

    res.render('layout', autorizado ? {
        childPage:'page/arqueo',
        pageName: 'Historial de corte de jaca diario',
        sidebarState: 'off',
        actualUser: authData.usuario_propietario
    } : ejs401);
});

router.get('/Log', redirectAuth, (req, res) => {
    let authData = req.session.authData;

    res.render('layout', {
        childPage:'page/log',
        pageName: 'Historial de movimientos del usuario',
        sidebarState: 'off',
        actualUser: authData.usuario_propietario
    });
});

router.get('/Miperfil', redirectAuth, (req, res) => {
    let authData = req.session.authData;

    res.render('layout', {
        childPage:'page/perfil',
        pageName: 'Historial de movimientos del usuario',
        sidebarState: 'off',
        actualUser: authData.usuario_propietario,
        data: authData
    });
});
module.exports = router;