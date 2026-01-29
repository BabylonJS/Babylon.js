import * as React from "react";
import { createRoot } from "react-dom/client";
import { GlobalState } from "./globalState";
import { RenderingZone } from "./components/renderingZone";
import { ReflectorZone } from "./components/reflectorZone";
import { Footer } from "./components/footer";
import { WelcomeDialog } from "./components/welcomeDialog";
import { LocalStorageHelper } from "./tools/localStorageHelper";
import { EnvironmentTools } from "./tools/environmentTools";
import { Vector3 } from "core/Maths/math.vector";
import { Deferred } from "core/Misc/deferred";
import type { Scene } from "core/scene";
import { CreateScreenshotAsync } from "core/Misc/screenshotTools";
import type { IScreenshotSize } from "core/Misc/interfaces/screenshotSize";
import { Color3, Color4 } from "core/Maths/math";
import { FilesInputStore } from "core/Misc/filesInputStore";

import "./scss/main.scss";
import fullScreenLogo from "./img/logo-fullscreen.svg";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { ImageProcessingConfiguration } from "core/Materials/imageProcessingConfiguration";

declare const BABYLON: typeof import("core/index");

// Types for PWA Launch Queue API (file handlers)
interface ILaunchParams {
    files: FileSystemFileHandle[];
}

interface ILaunchQueue {
    setConsumer(consumer: (params: ILaunchParams) => void): void;
}

// Type for PWA install prompt event
interface IBeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
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
        /**
         * Show folder access prompt for files with dependencies
         */
        showFolderAccessPrompt: boolean;
        /**
         * Show welcome dialog for 3D Viewer users
         */
        showWelcomeDialog: boolean;
        /**
         * Whether PWA can be installed
         */
        canInstallPwa: boolean;
        /**
         * Supported file extensions from registered scene loader plugins
         */
        supportedExtensions: string;
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
    // Stores info for folder access prompt
    private _pendingFolderAccessFile: File | null = null;
    // Stores the file handle for folder access (to start picker in same directory)
    private _pendingFolderAccessFileHandle: FileSystemFileHandle | null = null;
    // Stores the PWA install prompt event
    private _deferredInstallPrompt: IBeforeInstallPromptEvent | null = null;
    // Whether we're in 3D Viewer welcome mode (show drop text even with default model)
    private _isViewerWelcomeMode = false;

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

        this.state = {
            isFooterVisible: true,
            errorMessage: "",
            currentFileName: "",
            showFolderAccessPrompt: false,
            showWelcomeDialog: false,
            canInstallPwa: false,
            supportedExtensions: this._getSupportedExtensions(),
        };

        this._checkUrl();

        EnvironmentTools.HookWithEnvironmentChange(this._globalState);

        // Listen for PWA install prompt
        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            this._deferredInstallPrompt = e as IBeforeInstallPromptEvent;
            // Clear any previous "do not show" preference since PWA is not installed
            LocalStorageHelper.ClearWelcomeDialogDismissed();
            this.setState({ canInstallPwa: true });
        });

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
                // Keep drop text visible in 3D Viewer welcome mode so users know they can drag files
                if (!this._isViewerWelcomeMode) {
                    this._dropTextRef.current!.className = "hidden";
                }
                // Reset welcome mode after first load so subsequent file drops hide the text
                this._isViewerWelcomeMode = false;
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

    /**
     * Handles the PWA install button click
     */
    private _handleInstallClickAsync = async () => {
        if (!this._deferredInstallPrompt) {
            return;
        }

        await this._deferredInstallPrompt.prompt();
        const { outcome } = await this._deferredInstallPrompt.userChoice;

        if (outcome === "accepted") {
            this._deferredInstallPrompt = null;
            this.setState({ canInstallPwa: false, showWelcomeDialog: false });
        }
    };

    /**
     * Closes the welcome dialog
     */
    private _handleWelcomeClose = () => {
        this.setState({ showWelcomeDialog: false });
    };

    /**
     * Checks URL parameters to set modes and load assets
     */
    private _checkUrl = () => {
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
                    case "from": {
                        // Handle special source modes
                        if (value.toLowerCase() === "3dviewer") {
                            // Set Studio environment for 3D Viewer mode
                            EnvironmentTools.SkyboxPath = EnvironmentTools.Skyboxes[2];
                            // Load the welcome Yeti model
                            this._globalState.assetUrl = "https://assets.babylonjs.com/meshes/YetiSmall.glb";
                            // Keep drop text visible so users know they can drag files
                            this._isViewerWelcomeMode = true;
                            // Show welcome dialog only if not already running as PWA and not previously dismissed
                            const isPwa = window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: window-controls-overlay)").matches;
                            const isDismissed = LocalStorageHelper.GetWelcomeDialogDismissed();
                            if (!isPwa && !isDismissed) {
                                this.state = { ...this.state, showWelcomeDialog: true };
                            }
                        }
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
                        this.state = {
                            isFooterVisible: value.toLowerCase() === "true" ? false : true,
                            errorMessage: "",
                            currentFileName: "",
                            showFolderAccessPrompt: false,
                            showWelcomeDialog: false,
                            canInstallPwa: false,
                            supportedExtensions: this._getSupportedExtensions(),
                        };
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
    };

    /**
     * Gets the supported file extensions from registered scene loader plugins.
     * Falls back to a hardcoded list if GetRegisteredSceneLoaderPluginMetadata is not available (older Babylon versions).
     * @returns A formatted string of supported extensions like "gltf, glb, obj or babylon"
     */
    private _getSupportedExtensions(): string {
        const fallbackExtensions = "babylon, gltf, glb, obj, ply, sog, splat, spz or stl";

        try {
            const plugins = BABYLON.GetRegisteredSceneLoaderPluginMetadata();
            let extensions = plugins.flatMap((plugin) => plugin.extensions.map((ext) => ext.extension.replace(".", "").toLowerCase())).sort();
            extensions = extensions.filter((ext) => ext !== "json"); // The splat loader registers .json, but that is covered by the sog format and json files are too generic

            if (extensions.length === 0) {
                return fallbackExtensions;
            }

            // Format: "ext1, ext2, ext3 or ext4"
            if (extensions.length === 1) {
                return extensions[0];
            }
            return extensions.slice(0, -1).join(", ") + " or " + extensions[extensions.length - 1];
        } catch {
            return fallbackExtensions;
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
                        {this._globalState.reflector ? "" : `Drag and drop ${this.state.supportedExtensions} files to view them`}
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
                {/* 
                  Folder Access Prompt: This dialog is required because the File System Access API 
                  (showDirectoryPicker) can only be called from a direct user gesture (click/tap).
                  The PWA launch queue callback is async and not considered a user gesture, so we 
                  must show this UI to get a user click before requesting folder access.
                */}
                {this.state.showFolderAccessPrompt && (
                    <div id="folderAccessPrompt">
                        <div className="prompt-content">
                            <p>
                                The file <strong>{this._pendingFolderAccessFile?.name}</strong> may reference external files (textures, etc.).
                            </p>
                            <p>Would you like to grant access to the containing folder so all referenced files can be loaded?</p>
                            <div className="prompt-buttons">
                                <button type="button" onClick={async () => await this._handleFolderAccessClickAsync(true)}>
                                    Select Folder
                                </button>
                                <button type="button" onClick={async () => await this._handleFolderAccessClickAsync(false)}>
                                    Load Without
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {this.state.showWelcomeDialog && (
                    <WelcomeDialog onInstall={this._handleInstallClickAsync} onClose={this._handleWelcomeClose} canInstall={this.state.canInstallPwa} />
                )}
            </div>
        );
    }

    /**
     * Handles user clicking to grant folder access
     *
     * @param grantAccess Whether the user granted access to the folder
     */
    private async _handleFolderAccessClickAsync(grantAccess: boolean) {
        const file = this._pendingFolderAccessFile;
        const fileHandle = this._pendingFolderAccessFileHandle;
        this._pendingFolderAccessFile = null;
        this._pendingFolderAccessFileHandle = null;
        this.setState({ showFolderAccessPrompt: false });

        if (!file) {
            return;
        }

        if (grantAccess) {
            try {
                // Start the directory picker in the same folder as the file
                const pickerOptions: { startIn?: FileSystemFileHandle } = {};
                if (fileHandle) {
                    pickerOptions.startIn = fileHandle;
                }
                const dirHandle = await (
                    window as unknown as { showDirectoryPicker: (options?: { startIn?: FileSystemFileHandle }) => Promise<FileSystemDirectoryHandle> }
                ).showDirectoryPicker(pickerOptions);
                // Recursively collect all files from the directory and subdirectories
                const collectFilesAsync = async (handle: FileSystemDirectoryHandle, relativePath: string = "") => {
                    // Use values() method to iterate - cast needed as TypeScript types may be incomplete
                    const entries = (handle as unknown as { values: () => AsyncIterable<FileSystemHandle> }).values();
                    for await (const entry of entries) {
                        if (entry.kind === "file") {
                            const entryFile = await (entry as FileSystemFileHandle).getFile();
                            // Register file directly in FilesInputStore with its relative path
                            // This is how the loaders will look it up
                            const filePath = (relativePath + entryFile.name).toLowerCase();
                            FilesInputStore.FilesToLoad[filePath] = entryFile;
                        } else if (entry.kind === "directory") {
                            await collectFilesAsync(entry as FileSystemDirectoryHandle, relativePath + entry.name + "/");
                        }
                    }
                };
                await collectFilesAsync(dirHandle);
            } catch {
                // User cancelled - proceed with just the original file
            }
        }

        // Only pass the main file to load - dependencies are already registered in FilesInputStore
        this._loadFileWhenReady([file]);
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

            const fileHandle = launchParams.files[0];
            const file = await fileHandle.getFile();
            const extension = file.name.split(".").pop()?.toLowerCase();

            // File types that may have external dependencies (textures, .bin files, etc.)
            const typesWithDependencies = ["gltf", "obj", "babylon"];

            // If file type may have dependencies, show prompt for folder access
            if (extension && typesWithDependencies.includes(extension) && "showDirectoryPicker" in window) {
                this._pendingFolderAccessFile = file;
                this._pendingFolderAccessFileHandle = fileHandle;
                this.setState({ showFolderAccessPrompt: true });
            } else {
                // Load single file directly
                this._loadFileWhenReady([file]);
            }
        });
    }

    /**
     * Loads files when filesInput is ready
     *
     * @param files Array of File objects to load
     */
    private _loadFileWhenReady(files: File[]) {
        if (this._globalState.filesInput) {
            this._loadFilesIntoSandbox(files);
        } else {
            this._pendingLaunchFiles = files;
            this._globalState.onFilesInputReady.addOnce(() => {
                if (this._pendingLaunchFiles) {
                    this._loadFilesIntoSandbox(this._pendingLaunchFiles);
                    this._pendingLaunchFiles = null;
                }
            });
        }
    }

    /**
     * Loads files into the sandbox via filesInput
     * @param files Array of File objects to load
     */
    private _loadFilesIntoSandbox(files: File[]) {
        // Create the event that loadFiles expects
        const event = {
            dataTransfer: { files: files },
        };
        this._globalState.filesInput.loadFiles(event);
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
