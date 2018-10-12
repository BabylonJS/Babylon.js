module BABYLON {
    /**
     * Options to create the webXR UI
     */
    export class WebXREnterExitUIOptions {
        /**
         * Context to enter xr with
         */
        outputCanvasContext?: Nullable<WebGLRenderingContext>;
    }
    /**
     * UI to allow the user to enter/exit XR mode
     */
    export class WebXREnterExitUI implements IDisposable {
        private _overlay: HTMLDivElement;
        private _buttons: Array<{element: HTMLElement, initializationOptions: XRSessionCreationOptions}> = [];
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
                return helper.supportsSession(btn.initializationOptions);
            });
            return Promise.all(supportedPromises).then((results) => {
                results.forEach((supported, i) => {
                    if (supported) {
                        ui._overlay.appendChild(ui._buttons[i].element);
                        ui._buttons[i].element.onclick = async() => {
                            if (helper.state == BABYLON.WebXRState.IN_XR) {
                                await helper.exitXR();
                                return;
                            }else if (helper.state == BABYLON.WebXRState.NOT_IN_XR) {
                                await helper.enterXR(ui._buttons[i].initializationOptions, "eye-level");
                            }
                        };
                    }
                });
            });
        }
        private constructor(private scene: BABYLON.Scene, options: WebXREnterExitUIOptions) {
            this._overlay = document.createElement("div");
            this._overlay.style.cssText = "z-index:11;position: absolute; right: 20px;bottom: 50px;";

            var hmdBtn = document.createElement("button");
            hmdBtn.style.cssText = "color: #868686; border-color: #868686; border-style: solid; margin-left: 10px; height: 50px; width: 80px; background-color: rgba(51,51,51,0.7); background-repeat:no-repeat; background-position: center; outline: none;";
            hmdBtn.innerText = "HMD";
            this._buttons.push({element: hmdBtn, initializationOptions: {immersive: true}});

            var windowBtn = document.createElement("button");
            windowBtn.style.cssText = hmdBtn.style.cssText;
            windowBtn.innerText = "Window";
            this._buttons.push({element: windowBtn, initializationOptions: {immersive: false, environmentIntegration: true, outputContext: options.outputCanvasContext}});

            var renderCanvas = scene.getEngine().getRenderingCanvas();
            if (renderCanvas && renderCanvas.parentNode) {
                renderCanvas.parentNode.appendChild(this._overlay);
                scene.onDisposeObservable.addOnce(() => {
                    this.dispose();
                });
            }
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