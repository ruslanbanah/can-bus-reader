const http = require("http");
const express = require( "express");
const WebSocket = require( "ws");

const app = express();

const server = http.createServer(app);

const webSocketServer = new WebSocket.Server({ server });

webSocketServer.on('connection', ws => {
    console.log('Connected');
   ws.on('message', m => {
       console.log(m.toString());
   });

   ws.on("error", e => ws.send(e));

    setInterval(() => {
        const data = Array.from({ length: 10 }, () => Math.floor(Math.random() * 3));
        const id =Math.floor(Math.random() * 5);
        ws.send(JSON.stringify({id, data}));
    }, 10);
});

server.listen(8999, () => console.log("Server started"))