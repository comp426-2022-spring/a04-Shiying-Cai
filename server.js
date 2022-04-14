const db = require("./database.js")
const http = require('http')
  
//Require express.js
const express = require('express');
const app = express()

//take an arbitrary port number from argument. default = 5000
const args = require('minimist')(process.argv.slice(2))
args['port']
if(args.port == undefined) {
    args.port = 5000
}
var HTTP_PORT = args.port;

const server = app.listen(HTTP_PORT, () => {
    console.log('App lisenting on port %PORT%' .replace('%PORT%',HTTP_PORT))
});

const help = (`
server.js [options]
--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.
--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.
--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.
--help	Return this message and exit.
`)

if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}


//Define check endpoint at /app/ return '200 OK'
app.get('/app/', (req, res) => {
    //respond with status 200
        res.status = 200;
    //respond statusmessage
        res.statusMessage = 'OK';
        res.writeHead( res.status, { 'Content-Type' : 'text/plain'});
        res.end(res.status + ' ' + res.statusMessage)
})

if (argument.log == true) {
    // Use morgan for logging to files
    // Create a write stream to append (flags: 'a') to a file
    const mylog = fs.createWriteStream('access.log', { flags: 'a' })
    // Set up the access logging middleware
    app.use(morgan('combined', { stream: mylog }))
}
else {
    app.use(morgan('combined'))
}

app.use((req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
      remoteuser: req.user,
      time: Date.now(),
      method: req.method,
      url: req.url,
      protocol: req.protocol,
      httpversion: req.httpVersion,
      status: res.statusCode,
      referer: req.headers['referer'],
      useragent: req.headers['user-agent']
    }

    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)

    next();
})

app.get('/app/log/access', (req, res) => {
    const stmt = db.prepare('SELECT * FROM accesslog').all()
    res.status(200).json(stmt) })

app.get('/app/error', (req, res) => { throw new error ('Error test successful') })


// define defualt end point that are not defined "404 NOT FOUND"
app.use(function(req, res){
    res.status(404).send('404 NOT FOUND');
});
