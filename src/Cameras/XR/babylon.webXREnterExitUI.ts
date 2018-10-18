module BABYLON {
    /**
     * Button which can be used to enter a different mode of XR
     */
    export class WebXREnterExitUIButton {
        /**
         * Creates a WebXREnterExitUIButton
         * @param element button element
         * @param initializationOptions XR initialization options for the button
         */
        constructor(
            /** button element */
            public element: HTMLElement,
            /** XR initialization options for the button */
            public initializationOptions: XRSessionCreationOptions
        ) {}
        /**
         * Overwritable function which can be used to update the button's visuals when the state changes
         * @param activeButton the current active button in the UI
         */
        update(activeButton: Nullable<WebXREnterExitUIButton>) {
        }
    }

    /**
     * Options to create the webXR UI
     */
    export class WebXREnterExitUIOptions {
        /**
         * Context to enter xr with
         */
        outputCanvasContext?: Nullable<WebGLRenderingContext>;

        /**
         * User provided buttons to enable/disable WebXR. The system will provide default if not set
         */
        customButtons?: Array<WebXREnterExitUIButton>;
    }
    /**
     * UI to allow the user to enter/exit XR mode
     */
    export class WebXREnterExitUI implements IDisposable {
        private _overlay: HTMLDivElement;
        private _buttons: Array<WebXREnterExitUIButton> = [];
        private _activeButton: Nullable<WebXREnterExitUIButton> = null;
        /**
         * Creates UI to allow the user to enter/exit XR mode
         * @param scene the scene to add the ui to
         * @param helper the xr experience helper to enter/exit xr with
         * @param options options to configure the UI
         * @returns the created ui
         */
        public static CreateAsync(scene: BABYLON.Scene, helper: WebXRExperienceHelper, options: WebXREnterExitUIOptions) {
            var ui = new WebXREnterExitUI(scene, options);
            var supportedPromises = ui._buttons.map((btn) => {
                return helper.supportsSessionAsync(btn.initializationOptions);
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
                            if (helper.state == BABYLON.WebXRState.IN_XR) {
                                ui._updateButtons(null);
                                await helper.exitXRAsync();
                                return;
                            } else if (helper.state == BABYLON.WebXRState.NOT_IN_XR) {
                                ui._updateButtons(ui._buttons[i]);
                                await helper.enterXRAsync(ui._buttons[i].initializationOptions, "eye-level");
                            }
                        };
                    }
                });
            });
        }

        private constructor(private scene: BABYLON.Scene, options: WebXREnterExitUIOptions) {
            this._overlay = document.createElement("div");
            this._overlay.style.cssText = "z-index:11;position: absolute; right: 20px;bottom: 50px;";

            if (options.customButtons) {
                this._buttons = options.customButtons;
            } else {
                var hmdBtn = document.createElement("button");
                hmdBtn.style.cssText = "color: #868686; border-color: #868686; border-style: solid; margin-left: 10px; height: 50px; width: 80px; background-color: rgba(51,51,51,0.7); background-repeat:no-repeat; background-position: center; outline: none;";
                hmdBtn.innerText = "HMD";
                this._buttons.push(new WebXREnterExitUIButton(hmdBtn, {immersive: true, outputContext: options.outputCanvasContext}));
                this._buttons[this._buttons.length - 1].update = function(activeButton: WebXREnterExitUIButton) {
                    this.element.style.display = (activeButton === null || activeButton === this) ? "" : "none";
                    this.element.innerText = activeButton === this ? "EXIT" : "HMD";
                };

                var windowBtn = document.createElement("button");
                windowBtn.style.cssText = hmdBtn.style.cssText;
                windowBtn.innerText = "Window";
                this._buttons.push(new WebXREnterExitUIButton(windowBtn, { immersive: false, environmentIntegration: true, outputContext: options.outputCanvasContext }));
                this._buttons[this._buttons.length - 1].update = function(activeButton: WebXREnterExitUIButton) {
                    this.element.style.display = (activeButton === null || activeButton === this) ? "" : "none";
                    this.element.innerText = activeButton === this ? "EXIT" : "Window";
                };
                this._updateButtons(null);
            }

            var renderCanvas = scene.getEngine().getRenderingCanvas();
            if (renderCanvas && renderCanvas.parentNode) {
                renderCanvas.parentNode.appendChild(this._overlay);
                scene.onDisposeObservable.addOnce(() => {
                    this.dispose();
                });
            }
        }

        private _updateButtons(activeButton: Nullable<WebXREnterExitUIButton>) {
            this._activeButton = activeButton;
            this._buttons.forEach((b) => {
                b.update(this._activeButton);
            });
        }

        /**
         * Disposes of the object
         */
        dispose() {
            var renderCanvas = this.scene.getEngine().getRenderingCanvas();
            if (renderCanvas && renderCanvas.parentNode && renderCanvas.parentNode.contains(this._overlay)) {
                renderCanvas.parentNode.removeChild(this._overlay);
            }
        }
    }
}