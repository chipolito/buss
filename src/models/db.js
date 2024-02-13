'use strict'

const mSql       = require('mssql');

const sqlConfig = {
    user: process.env.SQLUSER,
    password: process.env.SQLKEY,
    server: process.env.SQLSERVER, 
    database: process.env.SQLDATABASE, 
    options: {
        trustServerCertificate: true
    }
};

function connectToDB() {
    return new Promise(async (resolve, reject) => {
        try {
            const pool = await mSql.connect(sqlConfig)
            resolve(pool);
        } catch (error) {
            reject(`Error | Servidor de base de datos: ${JSON.stringify( error )}`);
        }
    });
}

module.exports = {connectToDB, mSql};