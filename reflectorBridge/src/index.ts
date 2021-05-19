import * as WebSocket from 'ws';

interface WebSocketInfo extends WebSocket {
    _id?: number;
    _other?: WebSocketInfo;
}

class Server {
    private _nextClientId = 0;
    private _server: WebSocket.Server;

    public start(port: number): void {
        console.log(`Starting reflector on port ${port}`);
        this._server = new WebSocket.Server({ port: port });

        this._server.on("connection", (client: WebSocketInfo, request) => {
            client._id = this._nextClientId++;
            console.log(`Client ${client._id} connected`);

            this._checkClients();

            client.on("message", (message: string) => {
                console.log(`Received message from client ${client._id}: ${message.substr(0, 64)}`);

                if (!client._other) {
                    client.close(4001, "received message without two clients connected");
                    return;
                }

                console.log(`Sending message to client ${client._other._id}: ${message.substr(0, 64)}`);
                client._other.send(message);
            });

            client.on("close", (code, reason) => {
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
            const clients = Array.from(this._server.clients.values()) as Array<WebSocketInfo>;
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
server.start(port);
