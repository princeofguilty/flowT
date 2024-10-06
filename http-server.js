const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pty = require('node-pty');
const { isUndefined } = require('util');
const cors = require('cors');
const { execSync } = require('child_process');
const { stringify } = require('querystring');
const { exit } = require('process');
const fs = require('fs');
const os = require('os');

const fav_shell = "/usr/bin/zsh"

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// Serve static files (your index.html)
// app.use(
//     (req, res, next) => {
//         res.setHeader('Access-Control-Allow-Origin', '*');
//         next();
//     },
//     express.static('public')
// );


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins (for development)
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        // credentials: true // Include credentials if needed
    },
});

app.use(cors(),
express.static('public')
); // Enable CORS for all routes


// app.use();

// Store terminal instances for each socket connection
const terminals = {};

io.on('connection', (socket) => {
    console.log('Client connected');

    io._opts.pingInterval = 25000; // Adjust to control how often pings are sent
    io._opts.pingTimeout = 5000;   // Adjust to control how long to wait for a ping response
    io._opts.transports = ['websocket']; // Use only WebSocket for faster communication
    io._opts.perMessageDeflate = {
        threshold: 1024 // Enable message compression for messages larger than 1KB
    };
    io._opts.cookie = false; // Disable cookies to reduce overhead

    // Handle new terminal request
    socket.on('new-terminal', (shell) => {
        console.log(shell);
        var command = null;
        // exit();
        if(shell != fav_shell){
            // it is a command not a shell
            command = shell;
            shell = fav_shell;
        }

        // Create a new shell for this terminal instance
        shell = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.env.HOME,
            env: process.env,
        });


        // code 13: Enter
        // some code to easily track last executed command
        shell.write("preexec(){echo XXX-$1-XXX}" + String.fromCharCode(13));
        shell.write("clear" + String.fromCharCode(13));
        socket.emit("clear");
        if(command)
            shell.write(command + String.fromCharCode(13));

        // Handle data from the shell
        shell.on('data', (data) => {
            const regex = /XXX-(.*?)\-XXX/;
            const match = data.match(regex);

            // Check if there is a match
            if (match) {
                const extractedCommand = match[1]; // Extract the text

                // Remove the extracted text and the markers from the original string
                data = data.replace(regex, '').trim(); // Remove the matched part and trim any extra spaces
                console.log(extractedCommand);
                if (extractedCommand == "cls" || extractedCommand == "clear") {
                    socket.emit("clear");
                }
                else if (extractedCommand == "exit") {
                    console.log('attempting to exit from client');
                    socket.emit('exit');
                }
                else {
                    socket.emit("command", { data, extractedCommand });
                }
            }

            socket.emit('output', data);
        });


        // Handle input from the client
        socket.on('input', (inputData) => {
            const data = inputData;
            shell.write(data);
        });


        // Handle shell exit
        socket.on('disconnect', () => {
            shell.kill(); // Kill the associated shell when the client disconnects
            console.log('Client disconnected');
        });

        // Handle Resizing
        socket.on('resize', (resizeData) => {
            // console.log(resizeData)
            const { id, new_w, new_h } = resizeData;
            // console.log("resize : ", id, new_w, new_h)
            if (new_w <= 0 || new_h <= 0 || new_w == undefined || new_h == undefined)
                return;

            console.log("resizing to: " + new_w + "," + new_h);
            shell.resize(new_w, new_h);
        });
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server is listening on http://localhost:3000');
});
