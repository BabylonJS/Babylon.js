/* eslint-disable no-console */
import { WebSocketServer } from "ws";
import { readFileSync } from "fs";
import { createServer } from "https";
import { resolve } from "path";

interface WebSocketInfo extends WebSocket {
    _id?: number;
    _other?: WebSocketInfo;
}

class Server {
    private _nextClientId = 0;
    private _server: WebSocketServer;

    public start(port: number, ssl?: boolean): void {
        console.log(`Starting reflector on port ${port}, ssl: ${ssl}`);
        const server =
            (ssl &&
                createServer({
                    cert: readFileSync(resolve("./cert/cert.pem")),
                    key: readFileSync(resolve("./cert/key.pem")),
                }).listen(1234)) ||
            undefined;

        this._server = ssl ? new WebSocketServer({ server }) : new WebSocketServer({ port });

        this._server.on("connection", (client: WebSocketInfo) => {
            client._id = this._nextClientId++;
            console.log(`Client ${client._id} connected`);

            this._checkClients();

            this._server.on("message", (message: string) => {
                console.log(`Received message from client ${client._id}: ${message.substring(0, 64)}`);

                if (!client._other) {
                    client.close(4001, "received message without two clients connected");
                    return;
                }

                console.log(`Sending message to client ${client._other._id}: ${message.substring(0, 64)}`);
                client._other.send(message);
            });

            this._server.on("close", (code: any, reason: any) => {
                console.log(`Client ${client._id} disconnected: ${code} ${reason}`);
                if (client._other) {
                    delete client._other._other;
                }
                this._broadcast("disconnected");

                this._checkClients();
            });
        });
    }

    private _checkClients(): void {
        if (this._server.clients.size == 2) {
            const clients = Array.from(this._server.clients.values()) as any as Array<WebSocketInfo>;
            clients[0]._other = clients[1];
            clients[1]._other = clients[0];
            this._broadcast("connected");
        }
    }

    private _broadcast(message: string): void {
        const clients = this._server.clients.values() as Iterable<WebSocketInfo>;
        for (const client of clients) {
            console.log(`Sending broadcast message to client ${client._id}: ${message}`);
            client.send(`$$${message}`);
        }
    }
}

const server = new Server();
const port = process.env.npm_config_port ? +process.env.npm_config_port : 1234;
const ssl = process.env.reflector_ssl || process.argv[2] === "--ssl" ? true : false;
server.start(port, ssl);
