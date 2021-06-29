import { Scene } from "../scene";
import { Logger } from "./logger";
import { SceneSerializer } from "./sceneSerializer";
import { StringTools } from "./stringTools";

/**
 * Class used to connect with the reflector zone of the sandbox via the reflector bridge
 */
export class Reflector {
    private static readonly SERVER_PREFIX = "$$";

    private _scene: Scene;
    private _webSocket: WebSocket;

    /**
     * Constructs a reflector object.
     * @param scene The scene to use
     * @param hostname The hostname of the reflector bridge
     * @param port The port of the reflector bridge
     */
    public constructor(scene: Scene, hostname: string, port: number) {
        this._scene = scene;

        Logger.Log(`[Reflector] Connecting to ws://${hostname}:${port}`);
        this._webSocket = new WebSocket(`ws://${hostname}:${port}`);

        this._webSocket.onmessage = (event) => {
            const message: string = event.data;
            if (StringTools.StartsWith(message, Reflector.SERVER_PREFIX)) {
                const serverMessage = message.substr(Reflector.SERVER_PREFIX.length);
                Logger.Log(`[Reflector] Received server message: ${serverMessage.substr(0, 64)}`);
                this._handleServerMessage(serverMessage);
                return;
            } else {
                Logger.Log(`[Reflector] Received client message: ${message.substr(0, 64)}`);
                this._handleClientMessage(message);
            }
        };

        this._webSocket.onclose = (event) => {
            Logger.Log(`[Reflector] Disconnected ${event.code} ${event.reason}`);
        };
    }

    /**
     * Closes the reflector connection
     */
    public close(): void {
        this._webSocket.close();
    }

    private _handleServerMessage(message: string): void {
        switch (message) {
            case "connected": {
                SceneSerializer.SerializeAsync(this._scene).then((serialized) => {
                    this._webSocket.send(`load|${JSON.stringify(serialized)}`);
                });
                break;
            }
        }
    }

    private _handleClientMessage(message: string): void {
        // do nothing
    }
}
