
const { randomUUID } = require('crypto');
const express = require('express')
const { readFileSync } = require('fs')
const { resolve } = require('path')

const ws = require('ws')

const wss = new ws.WebSocketServer({
    port: 8080,
    perMessageDeflate: {
        zlibDeflateOptions: {
            // See zlib defaults.
            chunkSize: 1024,
            memLevel: 7,
            level: 3
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },
        // Other options settable:
        clientNoContextTakeover: true, // Defaults to negotiated value.
        serverNoContextTakeover: true, // Defaults to negotiated value.
        serverMaxWindowBits: 10, // Defaults to negotiated value.
        // Below options specified as default values.
        concurrencyLimit: 10, // Limits zlib concurrency for perf.
        threshold: 1024 // Size (in bytes) below which messages
        // should not be compressed if context takeover is disabled.
    }
});

let players = {}


wss.on('connection', (socket) => {

    socket.uid = randomUUID()


    socket.onclose = (event) => {
        console.log("Socket closed")
        Object.values(players).forEach((p) => {
            console.log(p)

            wss.clients.forEach((s) => {
                if (s != socket) {
                    s.send(JSON.stringify({
                        type: 'leave',
                        data: {
                            player: {
                                uid:
                                    socket.uid
                            }
                        }
                    }))
                }
            })


        })
        delete players[socket.uid]
    }





    socket.on("message", (message) => {


        let data = JSON.parse(Buffer.from(message).toString("utf-8"))




        if (data.type == 'eat') {
            console.log(data)
            seeds = seeds.filter((s) => s.uid != data.data.uid)

            if(players[uid].body.length >= 100){
                wss.clients.forEach((c) => {
                    c.send(JSON.stringify({
                        type: 'win',
                        data:{
                            player: players[uid]
                        }
                    }))
                })
            }else{
            wss.clients.forEach((c) => {
                c.send(JSON.stringify({
                    type: 'seed',
                    data: {
                        seeds,

                    }
                }))
            })
        }
            return;
        }

        data.data.player['uid'] = socket.uid
        if (data.type == 'join') {

            Object.values(players).forEach((p) => {
                socket.send(JSON.stringify({
                    type: 'join',
                    data: p
                }))
            })
            socket.send(JSON.stringify({
                type: 'seed',
                data: {
                    seeds
                }
            }))
            socket.send(JSON.stringify({
                type: 'config',
                data: {
                    screen: {
                        width: 500,
                        height: 500
                    }
                }
            }))
            players[socket.uid] = {
                screen: data.data.screen,
                player: {
                    name: data.data.player.name,
                    uid: socket.uid,
                    body: []
                }
            }
        }

        wss.clients.forEach((e) => {
            if (socket != e && e.readyState == ws.WebSocket.OPEN) {

                e.send(JSON.stringify(data))

            }
        })
    })

})

let seeds = []
async function seed() {
    while (true) {

        await new Promise((a, b) => setTimeout(() => a(1), 2000))

        if (seeds.length < 5) {
            let seedPosition = { x: (Math.random() * (500 - 100)) + 50, y: (Math.random() * (500 - 100)) + 50 }

            seeds.push({ position: seedPosition, uid: randomUUID() })
        }

        wss.clients.forEach((c) => {
            c.send(JSON.stringify({
                type: 'seed',
                data: {
                    seeds,

                }
            }))
        })
    }
}

seed()


const app = express()


app.get('/', (req, res) => {

    res.sendFile(resolve('game.html'))
})

app.listen(3000, '0.0.0.0')