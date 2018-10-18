import { CubeTexture, Engine, EnvironmentTextureTools, Nullable, Scene, Tools, VideoRecorder } from "babylonjs";
import { Helpers } from "../helpers/Helpers";
import { Inspector } from "../Inspector";
import { Tab } from "./Tab";
import { TabBar } from "./TabBar";

export class ToolsTab extends Tab {

    private _inspector: Inspector;

    private _scene: Scene;

    private _videoRecorder: Nullable<VideoRecorder> = null;

    constructor(tabbar: TabBar, insp: Inspector) {
        super(tabbar, 'Tools');

        this._inspector = insp;

        this._scene = this._inspector.scene;

        // Build the tools panel: a div that will contains all tools
        this._panel = Helpers.CreateDiv('tab-panel') as HTMLDivElement;
        this._panel.classList.add("tools-panel");

        let title = Helpers.CreateDiv('tool-title1', this._panel);
        let versionSpan = Helpers.CreateElement('span');
        versionSpan.textContent = `js v${Engine.Version} - Tools`;
        title.appendChild(versionSpan);

        // Environment block
        title = Helpers.CreateDiv('tool-title2', this._panel);
        title.textContent = "Environment Texture (.dds, .env)";
        {
            let errorElemm = Inspector.DOCUMENT.createElement('div');
            errorElemm.className = "tool-label-error";
            errorElemm.style.display = "none";

            let elemValue = Helpers.CreateDiv(null, this._panel);

            let inputElement = Inspector.DOCUMENT.createElement('input');
            inputElement.className = "tool-input";
            inputElement.type = "file";
            inputElement.accept = ".dds, .env";
            inputElement.onchange = (event: any) => {
                var files: File[] = event.target.files;
                let file: Nullable<File> = null;
                if (files && files.length) {
                    file = files[0];
                }

                if (!file) {
                    errorElemm.style.display = "block";
                    errorElemm.textContent = "Please, select a file first.";
                    return;
                }

                let isFileDDS = file.name.toLowerCase().indexOf(".dds") > 0;
                let isFileEnv = file.name.toLowerCase().indexOf(".env") > 0;
                if (!isFileDDS && !isFileEnv) {
                    errorElemm.style.display = "block";
                    errorElemm.textContent = "Please, select a dds or env file.";
                    return;
                }

                Tools.ReadFile(file, (data) => {
                    var blob = new Blob([data], { type: "octet/stream" });
                    var url = URL.createObjectURL(blob);
                    if (isFileDDS) {
                        this._scene.environmentTexture = CubeTexture.CreateFromPrefilteredData(url, this._scene, ".dds");
                        errorElemm.style.display = "none";
                    }
                    else {
                        this._scene.environmentTexture = new CubeTexture(url, this._scene,
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
            elemValue.appendChild(inputElement);

            if (!this._scene.getEngine().premultipliedAlpha) {
                elemValue = Helpers.CreateDiv(null, this._panel);

                inputElement = Inspector.DOCUMENT.createElement('input');
                inputElement.value = "Compress current texture to .env";
                inputElement.className = "tool-input";
                inputElement.type = "button";
                inputElement.onclick = () => {
                    if (!this._scene.environmentTexture) {
                        errorElemm.style.display = "block";
                        errorElemm.textContent = "You must load an environment texture first.";
                        return;
                    }
                    if (this._scene.activeCamera) {
                        EnvironmentTextureTools.CreateEnvTextureAsync(<CubeTexture>this._scene.environmentTexture)
                            .then((buffer: ArrayBuffer) => {
                                var blob = new Blob([buffer], { type: "octet/stream" });
                                Tools.Download(blob, "environment.env");
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
            }

            this._panel.appendChild(errorElemm);
        }

        title = Helpers.CreateDiv('tool-title2', this._panel);
        title.textContent = "Capture";
        {
            let elemValue = Helpers.CreateDiv(null, this._panel);

            let inputElement = Inspector.DOCUMENT.createElement('input');
            inputElement.value = "Take Screenshot";
            inputElement.type = "button";
            inputElement.className = "tool-input";
            inputElement.onclick = () => {
                if (this._scene.activeCamera) {
                    Tools.CreateScreenshot(this._scene.getEngine(), this._scene.activeCamera, { precision: 0.5 });
                }
            };
            elemValue.appendChild(inputElement);

            if (VideoRecorder && VideoRecorder.IsSupported(this._scene.getEngine())) {
                let videoRecorderElement = Inspector.DOCUMENT.createElement('input');
                videoRecorderElement.value = "Start Recording Video";
                videoRecorderElement.type = "button";
                videoRecorderElement.className = "tool-input";
                videoRecorderElement.onclick = () => {
                    if (!this._videoRecorder) {
                        this._videoRecorder = new VideoRecorder(this._scene.getEngine());
                    }

                    if (this._videoRecorder!.isRecording) {
                        this._videoRecorder!.stopRecording();
                    }
                    else {
                        videoRecorderElement.value = "Stop Recording Video";
                        this._videoRecorder!.startRecording().then(() => {
                            videoRecorderElement.value = "Start Recording Video";
                        });
                    }
                };
                elemValue.appendChild(videoRecorderElement);
            }
        }
    }

    public dispose() {
        // Nothing to dispose
    }
}
