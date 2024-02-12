const express   = require('express');
const session   = require('express-session');
const dotenv    = require('dotenv');
const path      = require('path');
const cors      = require('cors');
const app       = express();

dotenv.config({ path: './config/.env'});

app.set('port', process.env.PORT);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors());

app.use('/resources', express.static('assets'));
app.use('/resources', express.static(path.join(__dirname, 'assets')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: true, 
    rolling: true,
    saveUninitialized: true,
    cookie: {
        maxAge: (1000 * 60 * 60) * 8,
        sameSite: true,
        secure: false
    }
}));

app.use('/Usuario', require('./routes/usuario.route'));
app.use('/Autobus', require('./routes/autobus.route'));
app.use('/Descuento', require('./routes/descuento.route'));
app.use('/Ajuste', require('./routes/ajuste.route'));
app.use('/Corrida', require('./routes/corrida.route'));
app.use('/Pos', require('./routes/venta.route'));
app.use('/Logs', require('./routes/log.route'));
app.use('/Perfil', require('./routes/perfil.route'));
app.use('/Motivo', require('./routes/motivo.route'));
app.use('/', require('./routes/app.route'));

app.use((req, res, next) => {
    res.status(404).render('control/404');
});

app.listen(app.get('port'), () => {
    console.log(`server on port ${app.get('port')}`);
});