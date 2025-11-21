import * as React from "react";
import { createRoot } from "react-dom/client";
import { GlobalState } from "./globalState";
import { RenderingZone } from "./components/renderingZone";
import { ReflectorZone } from "./components/reflectorZone";
import { Footer } from "./components/footer";
import { EnvironmentTools } from "./tools/environmentTools";
import { Vector3 } from "core/Maths/math.vector";
import { Deferred } from "core/Misc/deferred";
import type { Scene } from "core/scene";
import { CreateScreenshotAsync } from "core/Misc/screenshotTools";
import type { IScreenshotSize } from "core/Misc/interfaces/screenshotSize";
import { Color3, Color4 } from "core/Maths/math";

import "./scss/main.scss";
import fullScreenLogo from "./img/logo-fullscreen.svg";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { ImageProcessingConfiguration } from "core/Materials/imageProcessingConfiguration";

interface ISandboxProps {
    version: string;
}

/**
 * Sandbox component
 */
export class Sandbox extends React.Component<
    ISandboxProps,
    {
        /**
         * is the footer visible?
         */
        isFooterVisible: boolean;
        /**
         * error message
         */
        errorMessage: string;
    }
> {
    private _globalState: GlobalState;
    private _logoRef: React.RefObject<HTMLImageElement>;
    private _dropTextRef: React.RefObject<HTMLDivElement>;
    private _clickInterceptorRef: React.RefObject<HTMLDivElement>;
    private _clearColor?: string;
    private _camera?: number;
    private _engine?: AbstractEngine;

    public constructor(props: ISandboxProps) {
        super(props);
        this._globalState = new GlobalState(props.version);
        this._logoRef = React.createRef();
        this._dropTextRef = React.createRef();
        this._clickInterceptorRef = React.createRef();

        this.state = { isFooterVisible: true, errorMessage: "" };

        this.checkUrl();

        EnvironmentTools.HookWithEnvironmentChange(this._globalState);

        // Events
        this._globalState.onSceneLoaded.add((info) => {
            document.title = "Babylon.js - " + info.filename;
            this.setState({ errorMessage: "" });

            this._globalState.currentScene = info.scene;
            if (
                this._globalState.currentScene.meshes.length === 0 &&
                this._globalState.currentScene.clearColor.r === 1 &&
                this._globalState.currentScene.clearColor.g === 0 &&
                this._globalState.currentScene.clearColor.b === 0
            ) {
                this._logoRef.current!.className = "";
            } else {
                this._logoRef.current!.className = "hidden";
                this._dropTextRef.current!.className = "hidden";
            }

            if (this._clearColor) {
                info.scene.clearColor = Color4.FromColor3(Color3.FromHexString(`#${this._clearColor}`), 1);
            }

            if (this._camera != undefined) {
                info.scene.activeCamera = info.scene.cameras[this._camera];
            }

            Sandbox._SceneLoadedDeferred.resolve(info.scene);
        });

        this._globalState.onError.add((error) => {
            this._logoRef.current!.parentElement!.className = "hidden";
            this._logoRef.current!.className = "hidden";

            if (error.scene) {
                this._globalState.showDebugLayer();
            }

            this.setState({ errorMessage: error.message ? `${error.message} Check the developer console.` : "Unable to load scene. Check the developer console." });

            this._engine && this._engine.hideLoadingUI();

            Sandbox._SceneLoadedDeferred.reject(new Error(error.message));
        });

        this._globalState.onRequestClickInterceptor.add(() => {
            const div = this._clickInterceptorRef.current!;

            if (div.classList.contains("hidden")) {
                div.classList.remove("hidden");
            } else {
                div.classList.add("hidden");
            }
        });

        // Keyboard
        window.addEventListener("keydown", (event: KeyboardEvent) => {
            // Press space to toggle footer
            if (event.keyCode === 32 && event.target && (event.target as HTMLElement).nodeName !== "INPUT") {
                this.setState({ isFooterVisible: !this.state.isFooterVisible });
            }
        });

        //

        window.onerror = (error: any) => {
            this._globalState.onError.notifyObservers({ message: `${error}` });
            return true;
        };

        window.onunhandledrejection = (event) => {
            // eslint-disable-next-line no-console
            console.error("Unhandled promise rejection:", event.reason);

            return true;
        };
    }

    /**
     * Stores the engine
     * @param engine the Engine
     */
    onEngineCreated = (engine: AbstractEngine) => {
        this._engine = engine;
    };

    checkUrl() {
        const set3DCommerceMode = () => {
            document.title = "Babylon.js Sandbox for 3D Commerce";
            this._globalState.commerceMode = true;
        };

        const setReflectorMode = () => {
            document.title = "Babylon.js Reflector";
            this._globalState.reflector = { hostname: "localhost", port: 1234 };
        };

        const host = location.host.toLowerCase();
        if (host.indexOf("3dcommerce") === 0) {
            set3DCommerceMode();
        } else if (host.toLowerCase().indexOf("reflector") === 0) {
            setReflectorMode();
        }

        const indexOf = location.href.indexOf("?");
        if (indexOf !== -1) {
            const params = location.href.substr(indexOf + 1).split("&");
            for (const param of params) {
                const [name, value] = param.split("=", 2);
                switch (name.toLowerCase()) {
                    case "3dcommerce": {
                        set3DCommerceMode();
                        break;
                    }
                    case "asset":
                    case "asseturl": {
                        this._globalState.assetUrl = value;
                        break;
                    }
                    case "autorotate": {
                        this._globalState.autoRotate = value.toLowerCase() === "true" ? true : false;
                        break;
                    }
                    case "camera": {
                        this._camera = +value;
                        break;
                    }
                    case "cameraposition": {
                        this._globalState.cameraPosition = Vector3.FromArray(
                            value.split(",").map(function (component) {
                                return +component;
                            })
                        );
                        break;
                    }
                    case "clearcolor": {
                        this._clearColor = value;
                        break;
                    }
                    case "environment": {
                        EnvironmentTools.SkyboxPath = value;
                        break;
                    }
                    case "kiosk": {
                        this.state = { isFooterVisible: value.toLowerCase() === "true" ? false : true, errorMessage: "" };
                        break;
                    }
                    case "skybox": {
                        this._globalState.skybox = value.toLowerCase() === "true" ? true : false;
                        break;
                    }
                    case "tonemapping": {
                        switch (value.toLowerCase()) {
                            case "standard":
                                this._globalState.toneMapping = ImageProcessingConfiguration.TONEMAPPING_STANDARD;
                                break;
                            case "aces":
                                this._globalState.toneMapping = ImageProcessingConfiguration.TONEMAPPING_ACES;
                                break;
                            case "khr_pbr_neutral":
                                this._globalState.toneMapping = ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL;
                                break;
                        }
                        break;
                    }

                    // --------------------------------------------
                    // Reflector specific parameters (undocumented)
                    // --------------------------------------------
                    case "reflector": {
                        setReflectorMode();
                        break;
                    }
                    case "hostname": {
                        if (this._globalState.reflector) {
                            this._globalState.reflector.hostname = value;
                        }
                        break;
                    }
                    case "port": {
                        if (this._globalState.reflector) {
                            this._globalState.reflector.port = +value;
                        }
                        break;
                    }
                }
            }
        }
    }

    public override render() {
        return (
            <div id="root">
                <span>
                    <p id="droptext" ref={this._dropTextRef}>
                        {this._globalState.reflector ? "" : "Drag and drop gltf, glb, obj, ply, splat, spz or babylon files to view them"}
                    </p>
                    {this._globalState.reflector ? (
                        <ReflectorZone globalState={this._globalState} expanded={!this.state.isFooterVisible} />
                    ) : (
                        <RenderingZone globalState={this._globalState} expanded={!this.state.isFooterVisible} onEngineCreated={this.onEngineCreated} />
                    )}
                </span>
                <div
                    ref={this._clickInterceptorRef}
                    onClick={() => {
                        this._globalState.onClickInterceptorClicked.notifyObservers();
                        this._clickInterceptorRef.current!.classList.add("hidden");
                    }}
                    className="clickInterceptor hidden"
                ></div>
                {this.state.isFooterVisible && <Footer globalState={this._globalState} />}
                <div id="logoContainer">
                    <img id="logo" src={fullScreenLogo} ref={this._logoRef} />
                </div>
                {this.state.errorMessage && (
                    <div id="errorZone">
                        <div className="message">{this.state.errorMessage}</div>
                        <button type="button" className="close" onClick={() => this.setState({ errorMessage: "" })} data-dismiss="alert">
                            &times;
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Use the promise of this deferred to do something after the scene is loaded.
    private static _SceneLoadedDeferred = new Deferred<Scene>();

    public static Show(hostElement: HTMLElement, version: string): void {
        const sandbox = React.createElement(Sandbox, { version });
        const root = createRoot(hostElement);
        root.render(sandbox);
    }

    public static async CaptureScreenshotAsync(size: IScreenshotSize | number, mimeType?: string): Promise<string> {
        const scene = await this._SceneLoadedDeferred.promise;
        return await CreateScreenshotAsync(scene.getEngine(), scene.activeCamera!, size, mimeType);
    }
}
