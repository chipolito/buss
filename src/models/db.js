'use strict'

const sqlite3 = require('sqlite3').verbose();
const db_name = `${process.env.PATH_DATABASE}/n10Ticket.db`;

const db = new sqlite3.Database(db_name, error => {
    if (error) {
        console.error(error.message);
    }

    console.log('Se conectó correctamente a la base de datos');
});

module.exports = db;