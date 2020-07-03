import { Nullable } from "../types";
import { Observable } from "../Misc/observable";
import { IDisposable, Scene } from "../scene";
import { WebXRExperienceHelper } from "./webXRExperienceHelper";
import { WebXRState, WebXRRenderTarget } from './webXRTypes';
import { Tools } from '../Misc/tools';
/**
 * Button which can be used to enter a different mode of XR
 */
export class WebXREnterExitUIButton {
    /**
     * Creates a WebXREnterExitUIButton
     * @param element button element
     * @param sessionMode XR initialization session mode
     * @param referenceSpaceType the type of reference space to be used
     */
    constructor(
        /** button element */
        public element: HTMLElement,
        /** XR initialization options for the button */
        public sessionMode: XRSessionMode,
        /** Reference space type */
        public referenceSpaceType: XRReferenceSpaceType
    ) { }

    /**
     * Extendable function which can be used to update the button's visuals when the state changes
     * @param activeButton the current active button in the UI
     */
    public update(activeButton: Nullable<WebXREnterExitUIButton>) {
    }
}

/**
 * Options to create the webXR UI
 */
export class WebXREnterExitUIOptions {
    /**
     * User provided buttons to enable/disable WebXR. The system will provide default if not set
     */
    customButtons?: Array<WebXREnterExitUIButton>;
    /**
     * A reference space type to use when creating the default button.
     * Default is local-floor
     */
    referenceSpaceType?: XRReferenceSpaceType;
    /**
     * Context to enter xr with
     */
    renderTarget?: Nullable<WebXRRenderTarget>;
    /**
     * A session mode to use when creating the default button.
     * Default is immersive-vr
     */
    sessionMode?: XRSessionMode;

    /**
     * A list of optional features to init the session with
     */
    optionalFeatures?: string[];

    /**
     * An alert using the alert() function will be displayed for the user when XR or this session mode is not available.
     * Use this to error silently
     */
    disableUserErrorAlerts?: boolean;
}
/**
 * UI to allow the user to enter/exit XR mode
 */
export class WebXREnterExitUI implements IDisposable {
    private _activeButton: Nullable<WebXREnterExitUIButton> = null;
    private _buttons: Array<WebXREnterExitUIButton> = [];
    private _overlay: HTMLDivElement;

    /**
     * Fired every time the active button is changed.
     *
     * When xr is entered via a button that launches xr that button will be the callback parameter
     *
     * When exiting xr the callback parameter will be null)
     */
    public activeButtonChangedObservable = new Observable<Nullable<WebXREnterExitUIButton>>();

    /**
     *
     * @param scene babylon scene object to use
     * @param options (read-only) version of the options passed to this UI
     */
    private constructor(
        private scene: Scene,
        /** version of the options passed to this UI */
        public options: WebXREnterExitUIOptions
    ) {
        this._overlay = document.createElement("div");
        this._overlay.style.cssText = "z-index:11;position: absolute; right: 20px;bottom: 50px;";

        // if served over HTTP, warn people.
        // Hopefully the browsers will catch up
        if (typeof window !== 'undefined') {
            if (window.location && window.location.protocol === 'http:') {
                Tools.Warn('WebXR can only be served over HTTPS');
            }
        }

        if (options.customButtons) {
            this._buttons = options.customButtons;
        } else {
            const sessionMode = options.sessionMode || "immersive-vr";
            const referenceSpaceType = options.referenceSpaceType || "local-floor";
            const url = !window.SVGSVGElement ? "https://cdn.babylonjs.com/Assets/vrButton.png" : "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%222048%22%20height%3D%221152%22%20viewBox%3D%220%200%202048%201152%22%20version%3D%221.1%22%3E%3Cpath%20transform%3D%22rotate%28180%201024%2C576.0000000000001%29%22%20d%3D%22m1109%2C896q17%2C0%2030%2C-12t13%2C-30t-12.5%2C-30.5t-30.5%2C-12.5l-170%2C0q-18%2C0%20-30.5%2C12.5t-12.5%2C30.5t13%2C30t30%2C12l170%2C0zm-85%2C256q59%2C0%20132.5%2C-1.5t154.5%2C-5.5t164.5%2C-11.5t163%2C-20t150%2C-30t124.5%2C-41.5q23%2C-11%2042%2C-24t38%2C-30q27%2C-25%2041%2C-61.5t14%2C-72.5l0%2C-257q0%2C-123%20-47%2C-232t-128%2C-190t-190%2C-128t-232%2C-47l-81%2C0q-37%2C0%20-68.5%2C14t-60.5%2C34.5t-55.5%2C45t-53%2C45t-53%2C34.5t-55.5%2C14t-55.5%2C-14t-53%2C-34.5t-53%2C-45t-55.5%2C-45t-60.5%2C-34.5t-68.5%2C-14l-81%2C0q-123%2C0%20-232%2C47t-190%2C128t-128%2C190t-47%2C232l0%2C257q0%2C68%2038%2C115t97%2C73q54%2C24%20124.5%2C41.5t150%2C30t163%2C20t164.5%2C11.5t154.5%2C5.5t132.5%2C1.5zm939%2C-298q0%2C39%20-24.5%2C67t-58.5%2C42q-54%2C23%20-122%2C39.5t-143.5%2C28t-155.5%2C19t-157%2C11t-148.5%2C5t-129.5%2C1.5q-59%2C0%20-130%2C-1.5t-148%2C-5t-157%2C-11t-155.5%2C-19t-143.5%2C-28t-122%2C-39.5q-34%2C-14%20-58.5%2C-42t-24.5%2C-67l0%2C-257q0%2C-106%2040.5%2C-199t110%2C-162.5t162.5%2C-109.5t199%2C-40l81%2C0q27%2C0%2052%2C14t50%2C34.5t51%2C44.5t55.5%2C44.5t63.5%2C34.5t74%2C14t74%2C-14t63.5%2C-34.5t55.5%2C-44.5t51%2C-44.5t50%2C-34.5t52%2C-14l14%2C0q37%2C0%2070%2C0.5t64.5%2C4.5t63.5%2C12t68%2C23q71%2C30%20128.5%2C78.5t98.5%2C110t63.5%2C133.5t22.5%2C149l0%2C257z%22%20fill%3D%22white%22%20/%3E%3C/svg%3E%0A";
            var css = ".babylonVRicon { color: #868686; border-color: #868686; border-style: solid; margin-left: 10px; height: 50px; width: 80px; background-color: rgba(51,51,51,0.7); background-image: url(" + url + "); background-size: 80%; background-repeat:no-repeat; background-position: center; border: none; outline: none; transition: transform 0.125s ease-out } .babylonVRicon:hover { transform: scale(1.05) } .babylonVRicon:active {background-color: rgba(51,51,51,1) } .babylonVRicon:focus {background-color: rgba(51,51,51,1) }";
            css += ".babylonVRicon.vrdisplaypresenting { background-image: none;} .vrdisplaypresenting::after { content: \"EXIT\"} .xr-error::after { content: \"ERROR\"}";

            var style = document.createElement('style');
            style.appendChild(document.createTextNode(css));
            document.getElementsByTagName('head')[0].appendChild(style);
            var hmdBtn = document.createElement("button");
            hmdBtn.className = "babylonVRicon";
            hmdBtn.title = `${sessionMode} - ${referenceSpaceType}`;
            this._buttons.push(new WebXREnterExitUIButton(hmdBtn, sessionMode, referenceSpaceType));
            this._buttons[this._buttons.length - 1].update = function(activeButton: WebXREnterExitUIButton) {
                this.element.style.display = (activeButton === null || activeButton === this) ? "" : "none";
                hmdBtn.className = "babylonVRicon" + (activeButton === this ? " vrdisplaypresenting" : "");
            };
            this._updateButtons(null);
        }

        var renderCanvas = scene.getEngine().getInputElement();
        if (renderCanvas && renderCanvas.parentNode) {
            renderCanvas.parentNode.appendChild(this._overlay);
            scene.onDisposeObservable.addOnce(() => {
                this.dispose();
            });
        }
    }

    /**
     * Creates UI to allow the user to enter/exit XR mode
     * @param scene the scene to add the ui to
     * @param helper the xr experience helper to enter/exit xr with
     * @param options options to configure the UI
     * @returns the created ui
     */
    public static CreateAsync(scene: Scene, helper: WebXRExperienceHelper, options: WebXREnterExitUIOptions): Promise<WebXREnterExitUI> {
        var ui = new WebXREnterExitUI(scene, options);
        var supportedPromises = ui._buttons.map((btn) => {
            return helper.sessionManager.isSessionSupportedAsync(btn.sessionMode);
        });
        helper.onStateChangedObservable.add((state) => {
            if (state == WebXRState.NOT_IN_XR) {
                ui._updateButtons(null);
            }
        });
        return Promise.all(supportedPromises).then((results) => {
            results.forEach((supported, i) => {
                if (supported) {
                    ui._overlay.appendChild(ui._buttons[i].element);
                    ui._buttons[i].element.onclick = async() => {
                        if (helper.state == WebXRState.IN_XR) {
                            await helper.exitXRAsync();
                            ui._updateButtons(null);
                        } else if (helper.state == WebXRState.NOT_IN_XR) {
                            if (options.renderTarget) {
                                try {
                                    await helper.enterXRAsync(ui._buttons[i].sessionMode, ui._buttons[i].referenceSpaceType, options.renderTarget, {optionalFeatures: options.optionalFeatures});
                                    ui._updateButtons(ui._buttons[i]);
                                } catch (e) {
                                    // make sure button is visible
                                    ui._updateButtons(null);
                                    const element = ui._buttons[i].element;
                                    const prevTitle = element.title;
                                    const error = "Error entering WebXR session : " + prevTitle;
                                    if (!options.disableUserErrorAlerts) {
                                        alert(error);
                                    }
                                    element.title = error;
                                    element.classList.add("xr-error");
                                }
                            }
                        }
                    };
                } else {
                    const error = `WebXR Session mode "${ui._buttons[i].sessionMode}" is not supported in this browser`;
                    if (!options.disableUserErrorAlerts) {
                        alert(error);
                    }
                    Tools.Warn(error);
                }
            });
            return ui;
        });
    }

    /**
     * Disposes of the XR UI component
     */
    public dispose() {
        var renderCanvas = this.scene.getEngine().getInputElement();
        if (renderCanvas && renderCanvas.parentNode && renderCanvas.parentNode.contains(this._overlay)) {
            renderCanvas.parentNode.removeChild(this._overlay);
        }
        this.activeButtonChangedObservable.clear();
    }

    private _updateButtons(activeButton: Nullable<WebXREnterExitUIButton>) {
        this._activeButton = activeButton;
        this._buttons.forEach((b) => {
            b.update(this._activeButton);
        });
        this.activeButtonChangedObservable.notifyObservers(this._activeButton);
    }
}