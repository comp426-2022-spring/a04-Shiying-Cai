const minimist = require('minimist')
const argv = minimist(process.argv.slice(2))
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

if (argv.help || argv.h){
    console.log(help)
    process.exit(0)
}
const express = require("express")
const app = express()
const morgan = require('morgan')
const fs = require("fs")
const db = require("./database.js")
const port = argv["port"] || 5555

if(argv.debug == "true" || argv.debug == true){
    app.get("/app/log/access", (req,res) => {
        try{
            const stmt = db.prepare("SELECT * FROM accesslog").all()
            res.status(200).json(stmt)
        }catch(err){
            console.error(err)
        }
    })
    app.get("/app/error", (req, res) => {
        throw new Error("Error test successful.")
    })
}

if(argv.log != "false" && argv.log != false){
    const accesslogstream = fs.createWriteStream("access.log", {flags: "a"})
    app.use(morgan('combined', {stream:accesslogstream }))
}

const server = app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})

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
    const stmt = db.prepare("INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?,?,?,?,?,?,?,?,?,?)")
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
    next()
})
app.get("/app/", (req, res) => {
    res.statusCode = 200
    res.statusMessage = "ok"
    res.writeHead(res.statusCode, { "Content-Type": "text/plain" })
    res.end(res.statusCode + " " + res.statusMessage)
})

app.use(function (req, res) {
    res.status(404).send("404 NOT FOUND")
})