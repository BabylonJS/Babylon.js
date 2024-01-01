import * as React from "react";
import type { GlobalState } from "../globalState";

import { Engine } from "core/Engines/engine";
import { SceneLoader } from "core/Loading/sceneLoader";
import { Logger } from "core/Misc/logger";

// use the same scss as renderingZone
import "../scss/renderingZone.scss";

class Reflector {
    private static readonly _SERVER_PREFIX = "$$";

    private readonly _engine: Engine;
    private readonly _globalState: GlobalState;
    private readonly _webSocket: WebSocket;

    public constructor(engine: Engine, globalState: GlobalState) {
        this._engine = engine;
        this._globalState = globalState;

        const reflector = globalState.reflector!;
        Logger.Log(`Connecting to ws://${reflector.hostname}:${reflector.port}`);
        this._webSocket = new WebSocket(`ws://${reflector.hostname}:${reflector.port}`);

        this._webSocket.onmessage = (event) => {
            const message: string = event.data;

            if (message.startsWith(Reflector._SERVER_PREFIX)) {
                const serverMessage = message.substr(Reflector._SERVER_PREFIX.length);
                Logger.Log(`[Reflector] Received server message: ${serverMessage}`);
                this._handleServerMessage(serverMessage);
                return;
            } else {
                Logger.Log(`[Reflector] Received client message: ${message.substr(0, 64)}`);
                this._handleClientMessage(message);
            }
        };

        this._webSocket.onclose = (event) => {
            document.getElementById("droptext")!.innerText = "Disconnected";
            Logger.Log(`${event.code}: ${event.reason}`);
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _handleServerMessage(message: string): void {
        // do nothing
    }

    public close(): void {
        this._webSocket.close();
    }

    private _handleClientMessage(message: string): void {
        const [command, payload] = message.split("|", 2);
        switch (command) {
            case "load": {
                SceneLoader.LoadAsync("", `data:${payload}`, this._engine).then((scene) => {
                    if (scene.activeCamera) {
                        scene.activeCamera!.attachControl();

                        this._engine.runRenderLoop(() => {
                            scene.render();
                        });
                    }

                    this._globalState.onSceneLoaded.notifyObservers({ scene: scene, filename: "Reflector scene" });

                    scene.debugLayer.show();
                });
                break;
            }
            default: {
                Logger.Error(`Unknown command: ${command}`);
                break;
            }
        }
    }
}

interface IReflectorProps {
    globalState: GlobalState;
    expanded: boolean;
}

export class ReflectorZone extends React.Component<IReflectorProps> {
    private _engine: Engine;
    private _canvas: HTMLCanvasElement;
    private _reflector: Reflector;

    public constructor(props: IReflectorProps) {
        super(props);
    }

    initEngine() {
        this._canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        this._engine = new Engine(this._canvas, true, { premultipliedAlpha: false, preserveDrawingBuffer: true });

        this._engine.loadingUIBackgroundColor = "#2A2342";

        window.addEventListener("resize", () => {
            this._engine.resize();
        });
    }

    componentDidMount() {
        if (!Engine.isSupported()) {
            return;
        }

        Engine.ShadersRepository = "/src/Shaders/";

        this.initEngine();

        this._reflector = new Reflector(this._engine, this.props.globalState);
    }

    componentWillUnmount() {
        this._reflector.close();
    }

    shouldComponentUpdate(nextProps: IReflectorProps) {
        if (nextProps.expanded !== this.props.expanded) {
            setTimeout(() => this._engine.resize());
            return true;
        }
        return false;
    }

    public render() {
        return (
            <div id="canvasZone" className={this.props.expanded ? "expanded" : ""}>
                <canvas id="renderCanvas" touch-action="none" onContextMenu={(evt) => evt.preventDefault()}></canvas>
            </div>
        );
    }
}
