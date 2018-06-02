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
                this._createToolLabel("Load Environment Texture (.dds, .env)", this._panel);

                let file: BABYLON.Nullable<File> = null;

                let elemValue = Helpers.CreateDiv('tool-value', this._panel);
                let inputUploadElement = Inspector.DOCUMENT.createElement('input');
                inputUploadElement.type = "file";
                inputUploadElement.onchange = (event: any) => {
                    var files: File[] = event.target.files;
                    if (files && files.length) {
                        file = files[0];
                        
                    }
                };
                elemValue.appendChild(inputUploadElement);
                
                let inputElement = Inspector.DOCUMENT.createElement('input');
                inputElement.value = "Load";
                inputElement.type = "button";
                inputElement.onclick = () => {
                    if (!file) {
                        return;
                    }

                    let isFileDDS = file.name.toLowerCase().indexOf(".dds") > 0;
                    BABYLON.Tools.ReadFile(file, data => {
                        var blob = new Blob([data], {type: "octet/stream"});
                        var url = URL.createObjectURL(blob);
                        if (isFileDDS) {
                            this._scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(url, this._scene, ".dds");
                        }
                        else {
                            this._scene.environmentTexture = new BABYLON.CubeTexture(url, this._scene, 
                                undefined, undefined, undefined, undefined, undefined, undefined, undefined,
                                ".env");
                        }
                    }, null, true);
                };
                elemValue.appendChild(inputElement);

                this._createToolLabel("Compress to .env", this._panel);
                elemValue = Helpers.CreateDiv('tool-value', this._panel);
                inputElement = Inspector.DOCUMENT.createElement('input');
                inputElement.value = "Save";
                inputElement.type = "button";
                inputElement.onclick = () => {
                    if (this._scene.activeCamera) {
                        BABYLON.EnvironmentTextureTools.CreateEnvTextureAsync(this._scene.environmentTexture).then((buffer) => {
                            var blob = new Blob([buffer], {type: "octet/stream"});
                            BABYLON.Tools.Download(blob, "environment.env");
                        }).catch((error) => {
                            // TODO. display errors. error.message
                        });
                    }
                };
                elemValue.appendChild(inputElement);
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