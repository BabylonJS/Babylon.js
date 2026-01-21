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

// Types for PWA Launch Queue API (file handlers)
interface ILaunchParams {
    files: FileSystemFileHandle[];
}

interface ILaunchQueue {
    setConsumer(consumer: (params: ILaunchParams) => void): void;
}

interface ISandboxProps {
    version: string;
    bundles: string[];
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
        /**
         * current loaded file name
         */
        currentFileName: string;
    }
> {
    private _globalState: GlobalState;
    private _logoRef: React.RefObject<HTMLImageElement>;
    private _dropTextRef: React.RefObject<HTMLDivElement>;
    private _clickInterceptorRef: React.RefObject<HTMLDivElement>;
    private _clearColor?: string;
    private _camera?: number;
    private _engine?: AbstractEngine;

    // Stores files from Launch Queue until filesInput is ready
    private _pendingLaunchFiles: File[] | null = null;

    /**
     * Constructs the Sandbox component
     * @param props Component props
     */
    public constructor(props: ISandboxProps) {
        super(props);
        this._globalState = new GlobalState({ version: props.version, bundles: props.bundles });
        this._logoRef = React.createRef();
        this._dropTextRef = React.createRef();
        this._clickInterceptorRef = React.createRef();

        this.state = { isFooterVisible: true, errorMessage: "", currentFileName: "" };

        this.checkUrl();

        EnvironmentTools.HookWithEnvironmentChange(this._globalState);

        // Update document title when display mode changes
        window.matchMedia("(display-mode: window-controls-overlay)").addEventListener("change", () => {
            this._updateDocumentTitle(this.state.currentFileName);
        });

        // Events
        this._globalState.onSceneLoaded.add((info) => {
            this.setState({ errorMessage: "", currentFileName: info.filename });
            this._updateDocumentTitle(info.filename);

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

        // Handle files opened via PWA file handler (double-click from OS)
        // Set up launch queue consumer early to capture files, then process when filesInput is ready
        this._setupLaunchQueueHandler();

        // Set initial document title based on display mode
        this._updateDocumentTitle("");
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
                        this.state = { isFooterVisible: value.toLowerCase() === "true" ? false : true, errorMessage: "", currentFileName: "" };
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
        // In overlay mode, the titlebar shows the full title because the system only shows window controls, not the app name
        const titleBarText = this.state.currentFileName ? `Babylon.js Sandbox - ${this.state.currentFileName}` : "Babylon.js Sandbox - View glTF, glb, obj and babylon files";

        return (
            <div id="root">
                <div className="titlebar">{titleBarText}</div>
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

    /**
     * Sets up the Launch Queue consumer to capture files opened via PWA file handlers.
     * Files are stored and processed once filesInput is ready.
     */
    private _setupLaunchQueueHandler() {
        // Check if Launch Queue API is available (PWA file handlers)
        if (!("launchQueue" in window)) {
            return;
        }

        // Set consumer immediately to capture files
        (window as Window & { launchQueue: ILaunchQueue }).launchQueue.setConsumer(async (launchParams) => {
            if (!launchParams.files || launchParams.files.length === 0) {
                return;
            }

            // Get File objects from file handles
            const filePromises = launchParams.files.map(async (handle) => await handle.getFile());
            const files = await Promise.all(filePromises);

            // If filesInput is already ready, load immediately
            if (this._globalState.filesInput) {
                this._loadFilesIntoSandbox(files);
            } else {
                // Store for later when filesInput is ready
                this._pendingLaunchFiles = files;
            }
        });

        // When filesInput becomes ready, process any pending files
        this._globalState.onFilesInputReady.addOnce(() => {
            if (this._pendingLaunchFiles) {
                this._loadFilesIntoSandbox(this._pendingLaunchFiles);
                this._pendingLaunchFiles = null;
            }
        });
    }

    /**
     * Loads files into the sandbox via filesInput
     * @param files Array of File objects to load
     */
    private _loadFilesIntoSandbox(files: File[]) {
        // Create a fake event that loadFiles expects
        const fakeEvent = {
            dataTransfer: { files: files },
        };
        this._globalState.filesInput.loadFiles(fakeEvent);
    }

    /**
     * Updates document.title based on display mode
     * - Overlay mode: document.title is not used, we build the text ourselves
     * - Standalone mode: system shows "App Name - document.title"
     * - Browser mode: document.title shows full title
     *
     * @param filename current filename
     */
    private _updateDocumentTitle(filename: string) {
        const defaultDescription = "View glTF, glb, obj and babylon files";
        const isOverlay = window.matchMedia("(display-mode: window-controls-overlay)").matches;
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

        if (isOverlay || isStandalone) {
            // PWA mode: system prepends manifest app name, so just use filename or description
            document.title = filename || defaultDescription;
        } else {
            // Browser mode: show full title with app name
            document.title = filename ? `Babylon.js Sandbox - ${filename}` : `Babylon.js Sandbox - ${defaultDescription}`;
        }
    }

    // Use the promise of this deferred to do something after the scene is loaded.
    private static _SceneLoadedDeferred = new Deferred<Scene>();

    public static Show(hostElement: HTMLElement, { version, bundles }: { version: string; bundles: string[] }): void {
        const sandbox = React.createElement(Sandbox, { version, bundles });
        const root = createRoot(hostElement);
        root.render(sandbox);
    }

    public static async CaptureScreenshotAsync(size: IScreenshotSize | number, mimeType?: string): Promise<string> {
        const scene = await this._SceneLoadedDeferred.promise;
        return await CreateScreenshotAsync(scene.getEngine(), scene.activeCamera!, size, mimeType);
    }
}
