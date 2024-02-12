const fs = require('fs');

let auxiliarModel   = require('../models/auxiliar.model');
// const JulianDate    = require('julian-date');

'use strict';

var dayInMs = 1000 * 60 * 60 * 24,
  julian1970 = 2440588,
  julian2000 = 2451545;

var julian = function(date) {
  this.d = (date == null) ? new Date() : (date instanceof Date) ? date : new Date(date);
};

julian.prototype.julian = function(julianDate) {
  if (julianDate) {
    this.d = new Date((julianDate + 0.5 - julian1970) * dayInMs);
    return this;
  }
  return this.d.valueOf() / dayInMs - 0.5 + julian1970;
};

julian.prototype.getDate = function() {
  return this.d;
};

julian.prototype.julianDays = function(julianDays) {
  // if (julianDays) {
  //   this.julian(julianDays + julian2000);
  //   return this;
  // }
  return this.julian() - julianDays;
};

function getPermisos() {
    return auxiliarModel.GetPermisos()
    .then(response => {
        return response;
    })
    .catch(error => { 
        return {success: false, data: error, message: 'Error de sistema'};              
    });
}

function redirectAuth(req, res, next) {
    req.session.isLoggedIn ? next() : res.redirect('/Auth');
}

function getAutobuses(req, res, next) {
    return auxiliarModel.GetAutobuses()
    .then(response => {
        return response;
    })
    .catch(error => { 
        return {success: false, data: error, message: 'Error de sistema'};              
    });
}

function generaFolioUnico(sucursal){
    let currentDate = new Date();
    let newYear     = `${currentDate.getFullYear()}`.substring(2);

    let julObjDate  = new julian(`20${newYear}-01-01T00:00:00`);
    let julDate     = julObjDate.julian();

    let julObjDay   = new julian();
    let julDay      = julObjDay.julianDays( parseFloat(julDate) );
    
    return `${newYear}${appendZeroToLength(parseInt(julDay), 3)}${sucursal}`;
}

function getConfiguracion(configuracionClave) {
    return auxiliarModel.GetConfiguracion(configuracionClave)
    .then(response => { return response;  })
    .catch(error => { return {success: false, data: error, message: "Error de sistema"}; });
}

function tienePermiso(req, permiso){
  let authData            = req.session.authData,
      authConfiguracion   = JSON.parse(authData.usuario_permiso),      
      autorizado          = authData.usuario_tipo == 1 ? true : authConfiguracion.includes( permiso ) ? true : false,
      ejs401              = {
          childPage:"control/401",
          pageName: "Sin permiso",
          sidebarState: "off",
          actualUser: authData.usuario_propietario
      };

  return { autorizado , ejs401 };
}

/**
 * Append zero to length.
 * @param {string} value Value to append zero.
 * @param {number} length Needed length.
 * @returns {string} String with appended zeros id need it.
 */
function appendZeroToLength(value, length) {
  return `${value}`.padStart(length, '0');
}

/**
 * Get date as text.
 * @returns {string} Date as text. Sample: "2018.12.03, 07:32:13.0162".
 */
function getDateAsText() {
  const now = new Date();
  const nowText = appendZeroToLength(now.getFullYear(), 4) + '.'
    + appendZeroToLength(now.getMonth() + 1, 2) + '.'
    + appendZeroToLength(now.getDate(), 2) + ', '
    + appendZeroToLength(now.getHours(), 2) + ':'
    + appendZeroToLength(now.getMinutes(), 2) + ':'
    + appendZeroToLength(now.getSeconds(), 2) + '.'
    + appendZeroToLength(now.getMilliseconds(), 4);
  return nowText;
}

/**
 * Log to file.
 * @param {string} text Text to log.
 * @param {string} [file] Log file path. Default: `default.log`.
 * @param {string} [delimiter] Delimiter. Default: `\n`.
 */
function logToFile(text, file = 'default.log', delimiter = '\n') {
  // Define log text.
  const logText = getDateAsText() + ' -> ' + text + delimiter;

  // Save log to file.
  fs.appendFile(file, logText, 'utf8', function (error) {
    if (error) {
      // If error - show in console.
      console.log(getDateAsText() + ' -> ' + error);
    }
  });
}

function setAuditoria(data) { 
  return auxiliarModel.SetAuditoria(data)
    .then(response => {
        return response;
    })
    .catch(error => { 
        return {success: false, data: error, message: 'Error de sistema'};              
    });
}

module.exports = { getPermisos, redirectAuth, getAutobuses, getConfiguracion, generaFolioUnico, tienePermiso, logToFile, setAuditoria };