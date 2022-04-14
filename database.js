"use strict"

import Database from  'better-sqlite3/lib/database.js';

const db = new Database('log.db');

const stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`)

// check if there is a table. If row is undefined then no table exists.
let row = stmt.get();
if(row === undefined){
    const sqlInit = `
        CREATE TABLE accesslog (
            id INTEGER PRIMARY KEY, remoteaddr STRING, remoteuser STRING,
            time STRING, method STRING, url STRING, protocol STRING,
            httpversion STRING, status INTEGER, referer STRING, useragent STRING
        );  
    `;
    // excute SQL command 
    db.exec(sqlInit);
    console.log('Your database has been initalized');
}else{
    console.log('Database exists.')
}

// export as a module
module.exports = db; 
