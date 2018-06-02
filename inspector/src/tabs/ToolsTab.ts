module INSPECTOR {

    export class ToolsTab extends Tab {

        private _inspector: Inspector;

        private _scene: BABYLON.Scene;

        constructor(tabbar: TabBar, insp: Inspector) {
            super(tabbar, 'Tools');

            this._inspector = insp;

            this._scene = this._inspector.scene;

            // Build the tools panel: a div that will contains all tools
            this._panel = Helpers.CreateDiv('tab-panel') as HTMLDivElement;
            this._panel.classList.add("tools-panel")

            let title = Helpers.CreateDiv('tool-title1', this._panel);
            let versionSpan = Helpers.CreateElement('span');
            versionSpan.textContent = `Babylon.js v${BABYLON.Engine.Version} - Tools`;
            title.appendChild(versionSpan);

            // Environment block
            title = Helpers.CreateDiv('tool-title2', this._panel);
            title.textContent = "Environment";
            {
                let elemLabel = this._createToolLabel("Load Environment Texture (.dds, .env) ", this._panel);
                elemLabel.className = "tool-label-line";

                let errorElemm = Inspector.DOCUMENT.createElement('div');
                errorElemm.className = "tool-label-error";
                errorElemm.style.display = "none";

                let inputElement = Inspector.DOCUMENT.createElement('input');
                inputElement.className = "tool-label-line";
                inputElement.type = "file";
                inputElement.onchange = (event: any) => {
                    var files: File[] = event.target.files;
                    let file: BABYLON.Nullable<File> = null;
                    if (files && files.length) {
                        file = files[0];
                    }

                    if (!file) {
                        errorElemm.style.display = "block";
                        errorElemm.textContent = "Please, select a file first."
                        return;
                    }

                    let isFileDDS = file.name.toLowerCase().indexOf(".dds") > 0;
                    let isFileEnv = file.name.toLowerCase().indexOf(".env") > 0;
                    if (!isFileDDS && ! isFileEnv) {
                        errorElemm.style.display = "block";
                        errorElemm.textContent = "Please, select a dds or env file."
                        return;
                    }

                    BABYLON.Tools.ReadFile(file, data => {
                        var blob = new Blob([data], {type: "octet/stream"});
                        var url = URL.createObjectURL(blob);
                        if (isFileDDS) {
                            this._scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(url, this._scene, ".dds");
                            errorElemm.style.display = "none";
                        }
                        else {
                            this._scene.environmentTexture = new BABYLON.CubeTexture(url, this._scene, 
                                undefined, undefined, undefined, 
                                () => {
                                    errorElemm.style.display = "none";
                                }, 
                                (message) => {
                                    if (message) {
                                        errorElemm.style.display = "block";
                                        errorElemm.textContent = message;
                                    }
                                }, 
                                undefined, undefined,
                                ".env");
                        }
                    }, undefined, true);
                };
                elemLabel.appendChild(inputElement);

                this._createToolLabel("Compress to .env", this._panel);
                let elemValue = Helpers.CreateDiv('tool-value', this._panel);
                inputElement = Inspector.DOCUMENT.createElement('input');
                inputElement.value = "Save";
                inputElement.type = "button";
                inputElement.onclick = () => {
                    if (!this._scene.environmentTexture) {
                        errorElemm.style.display = "block";
                        errorElemm.textContent = "You must load an environment texture first.";
                        return;
                    }
                    if (this._scene.activeCamera) {
                        BABYLON.EnvironmentTextureTools.CreateEnvTextureAsync(this._scene.environmentTexture)
                        .then((buffer: ArrayBuffer) => {
                            var blob = new Blob([buffer], {type: "octet/stream"});
                            BABYLON.Tools.Download(blob, "environment.env");
                            errorElemm.style.display = "none";
                        })
                        .catch((error: any) => {
                            errorElemm.style.display = "block";
                            errorElemm.textContent = error;
                        });
                    }
                    else {
                        errorElemm.style.display = "block";
                        errorElemm.textContent = "An active camera is required.";
                    }
                };
                elemValue.appendChild(inputElement);
                
                this._panel.appendChild(errorElemm);
            }

            title = Helpers.CreateDiv('tool-title2', this._panel);
            title.textContent = "Capture";
            {
                this._createToolLabel("Screenshot", this._panel);
                let elemValue = Helpers.CreateDiv('tool-value', this._panel);
                let inputElement = Inspector.DOCUMENT.createElement('input');
                inputElement.value = "Capture";
                inputElement.type = "button";
                inputElement.onclick = () => {
                    if (this._scene.activeCamera) {
                        BABYLON.Tools.CreateScreenshot(this._scene.getEngine(), this._scene.activeCamera, {precision: 0.5});
                    }
                };
                elemValue.appendChild(inputElement);
            }
        }

        private _createToolLabel(content: string, parent: HTMLElement): HTMLElement {
            let elem = Helpers.CreateDiv('tool-label', parent);
            elem.textContent = content;
            return elem;
        }

        public dispose() {
            // Nothing to dispose
        }
    }
}