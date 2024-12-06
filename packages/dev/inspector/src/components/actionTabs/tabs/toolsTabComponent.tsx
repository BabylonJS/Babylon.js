/* eslint-disable import/no-internal-modules */
import type { IPaneComponentProps } from "../paneComponent";
import { PaneComponent } from "../paneComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import type { Node } from "core/node";
import type { Nullable } from "core/types";
import { VideoRecorder } from "core/Misc/videoRecorder";
import { Tools } from "core/Misc/tools";
import { EnvironmentTextureTools } from "core/Misc/environmentTextureTools";
import type { BackgroundMaterial } from "core/Materials/Background/backgroundMaterial";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { Texture } from "core/Materials/Textures/texture";
import { SceneSerializer } from "core/Misc/sceneSerializer";
import { Mesh } from "core/Meshes/mesh";
import { FilesInput } from "core/Misc/filesInput";
import type { Scene } from "core/scene";
import { captureEquirectangularFromScene } from "core/Misc/equirectangularCapture";
import { SceneLoader, SceneLoaderAnimationGroupLoadingMode } from "core/Loading/sceneLoader";
import { Reflector } from "core/Misc/reflector";
import { GLTFComponent } from "./tools/gltfComponent";
// TODO - does it still work if loading the modules from the correct files?
import type { GLTFData } from "serializers/glTF/2.0/index";
import { GLTF2Export } from "serializers/glTF/2.0/index";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import type { IScreenshotSize } from "core/Misc/interfaces/screenshotSize";
import { NumericInput } from "shared-ui-components/lines/numericInputComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { FileMultipleButtonLineComponent } from "shared-ui-components/lines/fileMultipleButtonLineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { MessageLineComponent } from "shared-ui-components/lines/messageLineComponent";
import { FileButtonLine } from "shared-ui-components/lines/fileButtonLineComponent";
import { IndentedTextLineComponent } from "shared-ui-components/lines/indentedTextLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

import GIF from "gif.js.optimized";
import { Camera } from "core/Cameras/camera";
import { Light } from "core/Lights/light";
import { GLTFFileLoader } from "loaders/glTF/glTFFileLoader";
import { Logger } from "core/Misc/logger";

const envExportImageTypes = [
    { label: "PNG", value: 0, imageType: "image/png" },
    { label: "WebP", value: 1, imageType: "image/webp" },
];

interface IGlbExportOptions {
    exportDisabledNodes: boolean;
    exportSkyboxes: boolean;
    exportCameras: boolean;
    exportLights: boolean;
}

export class ToolsTabComponent extends PaneComponent {
    private _lockObject = new LockObject();
    private _videoRecorder: Nullable<VideoRecorder>;
    private _screenShotSize: IScreenshotSize = { precision: 1 };
    private _gifOptions = { width: 512, frequency: 200 };
    private _useWidthHeight = false;
    private _isExportingGltf = false;
    private _gltfExportOptions: IGlbExportOptions = { exportDisabledNodes: false, exportSkyboxes: false, exportCameras: false, exportLights: false };
    private _gifWorkerBlob: Blob;
    private _gifRecorder: any;
    private _previousRenderingScale: number;
    private _crunchingGIF = false;
    private _reflectorHostname: string = "localhost";
    private _reflectorPort: number = 1234;
    private _reflector: Reflector;
    private _envOptions = { imageTypeIndex: 0, imageQuality: 0.8 };

    constructor(props: IPaneComponentProps) {
        super(props);

        this.state = { tag: "Record video" };

        const sceneImportDefaults = this.props.globalState.sceneImportDefaults;
        if (sceneImportDefaults["overwriteAnimations"] === undefined) {
            sceneImportDefaults["overwriteAnimations"] = true;
        }
        if (sceneImportDefaults["animationGroupLoadingMode"] === undefined) {
            sceneImportDefaults["animationGroupLoadingMode"] = SceneLoaderAnimationGroupLoadingMode.Clean;
        }
    }

    override componentDidMount() {
        if (!GLTF2Export) {
            Tools.Warn("GLTF2Export is not available. Make sure to load the serializers library");
            return;
        }
    }

    override componentWillUnmount() {
        if (this._videoRecorder) {
            this._videoRecorder.stopRecording();
            this._videoRecorder.dispose();
            this._videoRecorder = null;
        }

        if (this._gifRecorder) {
            this._gifRecorder.render();
            this._gifRecorder = null;
            return;
        }
    }

    captureScreenshot() {
        const scene = this.props.scene;
        if (scene.activeCamera) {
            Tools.CreateScreenshot(scene.getEngine(), scene.activeCamera, this._screenShotSize);
        }
    }

    captureEquirectangular() {
        const scene = this.props.scene;
        if (scene.activeCamera) {
            captureEquirectangularFromScene(scene, { size: 1024, filename: "equirectangular_capture.png" });
        }
    }

    captureRender() {
        const scene = this.props.scene;
        const oldScreenshotSize: IScreenshotSize = {
            height: this._screenShotSize.height,
            width: this._screenShotSize.width,
            precision: this._screenShotSize.precision,
        };
        if (!this._useWidthHeight) {
            this._screenShotSize.width = undefined;
            this._screenShotSize.height = undefined;
        }
        if (scene.activeCamera) {
            Tools.CreateScreenshotUsingRenderTarget(scene.getEngine(), scene.activeCamera, this._screenShotSize, undefined, undefined, 4);
        }
        this._screenShotSize = oldScreenshotSize;
    }

    recordVideo() {
        if (this._videoRecorder && this._videoRecorder.isRecording) {
            this._videoRecorder.stopRecording();
            return;
        }

        const scene = this.props.scene;
        if (!this._videoRecorder) {
            this._videoRecorder = new VideoRecorder(scene.getEngine());
        }

        this._videoRecorder.startRecording().then(() => {
            this.setState({ tag: "Record video" });
        });
        this.setState({ tag: "Stop recording" });
    }

    recordGIFInternal() {
        const workerUrl = URL.createObjectURL(this._gifWorkerBlob);
        this._gifRecorder = new GIF({
            workers: 2,
            quality: 10,
            workerScript: workerUrl,
        });
        const scene = this.props.scene;
        const engine = scene.getEngine();

        this._previousRenderingScale = engine.getHardwareScalingLevel();
        engine.setHardwareScalingLevel(engine.getRenderWidth() / this._gifOptions.width ?? 1);

        const intervalId = setInterval(() => {
            if (!this._gifRecorder) {
                clearInterval(intervalId);
                return;
            }
            this._gifRecorder.addFrame(engine.getRenderingCanvas(), { delay: 0, copy: true });
        }, this._gifOptions.frequency);

        this._gifRecorder.on("finished", (blob: Blob) => {
            this._crunchingGIF = false;
            Tools.Download(blob, "record.gif");

            this.forceUpdate();

            URL.revokeObjectURL(workerUrl);
            engine.setHardwareScalingLevel(this._previousRenderingScale);
        });

        this.forceUpdate();
    }

    recordGIF() {
        if (this._gifRecorder) {
            this._crunchingGIF = true;
            this.forceUpdate();
            this._gifRecorder.render();
            this._gifRecorder = null;
            return;
        }

        if (this._gifWorkerBlob) {
            this.recordGIFInternal();
            return;
        }

        Tools.LoadFileAsync("https://cdn.jsdelivr.net/gh//terikon/gif.js.optimized@0.1.6/dist/gif.worker.js").then((value) => {
            this._gifWorkerBlob = new Blob([value], {
                type: "application/javascript",
            });
            this.recordGIFInternal();
        });
    }

    importAnimations(event: any) {
        const scene = this.props.scene;

        const overwriteAnimations = this.props.globalState.sceneImportDefaults["overwriteAnimations"];
        const animationGroupLoadingMode = this.props.globalState.sceneImportDefaults["animationGroupLoadingMode"];

        const reload = function (sceneFile: File) {
            // If a scene file has been provided
            if (sceneFile) {
                const onSuccess = function (scene: Scene) {
                    if (scene.animationGroups.length > 0) {
                        const currentGroup = scene.animationGroups[0];
                        currentGroup.play(true);
                    }
                };
                SceneLoader.ImportAnimationsAsync("file:", sceneFile, scene, overwriteAnimations, animationGroupLoadingMode, null, onSuccess);
            }
        };
        const filesInputAnimation = new FilesInput(
            scene.getEngine() as any,
            scene as any,
            () => {},
            () => {},
            () => {},
            () => {},
            () => {},
            reload,
            () => {}
        );

        filesInputAnimation.loadFiles(event);
    }

    exportGLTF() {
        const scene = this.props.scene;
        this._isExportingGltf = true;
        this.forceUpdate();

        const shouldExport = (node: Node): boolean => {
            if (!this._gltfExportOptions.exportDisabledNodes) {
                if (!node.isEnabled()) {
                    return false;
                }
            }

            if (!this._gltfExportOptions.exportSkyboxes) {
                if (node instanceof Mesh) {
                    if (node.material) {
                        const material = node.material as PBRMaterial | StandardMaterial | BackgroundMaterial;
                        const reflectionTexture = material.reflectionTexture;
                        if (reflectionTexture && reflectionTexture.coordinatesMode === Texture.SKYBOX_MODE) {
                            return false;
                        }
                    }
                }
            }

            if (!this._gltfExportOptions.exportCameras) {
                if (node instanceof Camera) {
                    return false;
                }
            }

            if (!this._gltfExportOptions.exportLights) {
                if (node instanceof Light) {
                    return false;
                }
            }

            return true;
        };

        GLTF2Export.GLBAsync(scene, "scene", { shouldExportNode: (node) => shouldExport(node) })
            .then((glb: GLTFData) => {
                this._isExportingGltf = false;
                this.forceUpdate();
                glb.downloadFiles();
            })
            .catch((reason) => {
                Logger.Error(`Failed to export GLB: ${reason}`);
                this._isExportingGltf = false;
                this.forceUpdate();
            });
    }

    exportBabylon() {
        const scene = this.props.scene;

        const strScene = JSON.stringify(SceneSerializer.Serialize(scene));
        const blob = new Blob([strScene], { type: "octet/stream" });

        Tools.Download(blob, "scene.babylon");
    }

    createEnvTexture() {
        const scene = this.props.scene;
        EnvironmentTextureTools.CreateEnvTextureAsync(scene.environmentTexture as CubeTexture, {
            imageType: envExportImageTypes[this._envOptions.imageTypeIndex].imageType,
            imageQuality: this._envOptions.imageQuality,
        })
            .then((buffer: ArrayBuffer) => {
                const blob = new Blob([buffer], { type: "octet/stream" });
                Tools.Download(blob, "environment.env");
            })
            .catch((error: any) => {
                Logger.Error(error);
                alert(error);
            });
    }

    exportReplay() {
        this.props.globalState.recorder.export();
        this.forceUpdate();
    }

    startRecording() {
        this.props.globalState.recorder.trackScene(this.props.scene);
        this.forceUpdate();
    }

    applyDelta(file: File) {
        Tools.ReadFile(file, (data) => {
            this.props.globalState.recorder.applyDelta(data, this.props.scene);

            this.forceUpdate();
        });
    }

    connectReflector() {
        if (this._reflector) {
            this._reflector.close();
        }

        this._reflector = new Reflector(this.props.scene, this._reflectorHostname, this._reflectorPort);
    }

    override render() {
        const scene = this.props.scene;

        if (!scene) {
            return null;
        }

        const sceneImportDefaults = this.props.globalState.sceneImportDefaults;

        const animationGroupLoadingModes = [
            { label: "Clean", value: SceneLoaderAnimationGroupLoadingMode.Clean },
            { label: "Stop", value: SceneLoaderAnimationGroupLoadingMode.Stop },
            { label: "Sync", value: SceneLoaderAnimationGroupLoadingMode.Sync },
            { label: "NoSync", value: SceneLoaderAnimationGroupLoadingMode.NoSync },
        ];

        return (
            <div className="pane">
                <LineContainerComponent title="CAPTURE" selection={this.props.globalState}>
                    <ButtonLineComponent label="Screenshot" onClick={() => this.captureScreenshot()} />
                    <ButtonLineComponent label="Generate equirectangular capture" onClick={() => this.captureEquirectangular()} />
                    <ButtonLineComponent label={this.state.tag} onClick={() => this.recordVideo()} />
                </LineContainerComponent>
                <LineContainerComponent title="CAPTURE WITH RTT" selection={this.props.globalState}>
                    <ButtonLineComponent label="Capture" onClick={() => this.captureRender()} />
                    <div className="vector3Line">
                        <FloatLineComponent
                            lockObject={this._lockObject}
                            label="Precision"
                            target={this._screenShotSize}
                            propertyName="precision"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <CheckBoxLineComponent
                            label="Use Width/Height"
                            onSelect={(value) => {
                                this._useWidthHeight = value;
                                this.forceUpdate();
                            }}
                            isSelected={() => this._useWidthHeight}
                        />
                        {this._useWidthHeight && (
                            <div className="secondLine">
                                <NumericInput
                                    lockObject={this._lockObject}
                                    label="Width"
                                    precision={0}
                                    step={1}
                                    value={this._screenShotSize.width ? this._screenShotSize.width : 512}
                                    onChange={(value) => (this._screenShotSize.width = value)}
                                />
                                <NumericInput
                                    lockObject={this._lockObject}
                                    label="Height"
                                    precision={0}
                                    step={1}
                                    value={this._screenShotSize.height ? this._screenShotSize.height : 512}
                                    onChange={(value) => (this._screenShotSize.height = value)}
                                />
                            </div>
                        )}
                    </div>
                </LineContainerComponent>
                <LineContainerComponent title="GIF" selection={this.props.globalState}>
                    {this._crunchingGIF && <MessageLineComponent text="Creating the GIF file..." />}
                    {!this._crunchingGIF && <ButtonLineComponent label={this._gifRecorder ? "Stop" : "Record"} onClick={() => this.recordGIF()} />}
                    {!this._crunchingGIF && !this._gifRecorder && (
                        <>
                            <FloatLineComponent lockObject={this._lockObject} label="Resolution" isInteger={true} target={this._gifOptions} propertyName="width" />
                            <FloatLineComponent lockObject={this._lockObject} label="Frequency (ms)" isInteger={true} target={this._gifOptions} propertyName="frequency" />
                        </>
                    )}
                </LineContainerComponent>
                <LineContainerComponent title="REPLAY" selection={this.props.globalState}>
                    {!this.props.globalState.recorder.isRecording && <ButtonLineComponent label="Start recording" onClick={() => this.startRecording()} />}
                    {this.props.globalState.recorder.isRecording && <IndentedTextLineComponent value={"Record in progress"} />}
                    {this.props.globalState.recorder.isRecording && <ButtonLineComponent label="Generate delta file" onClick={() => this.exportReplay()} />}
                    <FileButtonLine label={`Apply delta file`} onClick={(file) => this.applyDelta(file)} accept=".json" />
                </LineContainerComponent>
                <LineContainerComponent title="SCENE IMPORT" selection={this.props.globalState}>
                    <FileMultipleButtonLineComponent label="Import animations" accept="gltf" onClick={(evt: any) => this.importAnimations(evt)} />
                    <CheckBoxLineComponent
                        label="Overwrite animations"
                        target={sceneImportDefaults}
                        propertyName="overwriteAnimations"
                        onSelect={(value) => {
                            sceneImportDefaults["overwriteAnimations"] = value;
                            this.forceUpdate();
                        }}
                    />
                    {sceneImportDefaults["overwriteAnimations"] === false && (
                        <OptionsLine label="Animation merge mode" options={animationGroupLoadingModes} target={sceneImportDefaults} propertyName="animationGroupLoadingMode" />
                    )}
                </LineContainerComponent>
                <LineContainerComponent title="SCENE EXPORT" selection={this.props.globalState}>
                    <ButtonLineComponent label="Export to Babylon" onClick={() => this.exportBabylon()} />
                    {!scene.getEngine().premultipliedAlpha && scene.environmentTexture && scene.environmentTexture._prefiltered && scene.activeCamera && (
                        <>
                            <ButtonLineComponent label="Generate .env texture" onClick={() => this.createEnvTexture()} />
                            <OptionsLine
                                label="Image type"
                                options={envExportImageTypes}
                                target={this._envOptions}
                                propertyName="imageTypeIndex"
                                onSelect={() => {
                                    this.forceUpdate();
                                }}
                            />
                            {this._envOptions.imageTypeIndex > 0 && (
                                <FloatLineComponent
                                    lockObject={this._lockObject}
                                    label="Quality"
                                    isInteger={false}
                                    min={0}
                                    max={1}
                                    target={this._envOptions}
                                    propertyName="imageQuality"
                                />
                            )}
                        </>
                    )}
                </LineContainerComponent>
                <LineContainerComponent title="GLTF EXPORT" selection={this.props.globalState}>
                    {this._isExportingGltf && <TextLineComponent label="Please wait..exporting" ignoreValue={true} />}
                    {!this._isExportingGltf && (
                        <>
                            <CheckBoxLineComponent
                                label="Export Disabled Nodes"
                                isSelected={() => this._gltfExportOptions.exportDisabledNodes}
                                onSelect={(value) => (this._gltfExportOptions.exportDisabledNodes = value)}
                            />
                            <CheckBoxLineComponent
                                label="Export Skybox"
                                isSelected={() => this._gltfExportOptions.exportSkyboxes}
                                onSelect={(value) => (this._gltfExportOptions.exportSkyboxes = value)}
                            />
                            <CheckBoxLineComponent
                                label="Export Cameras"
                                isSelected={() => this._gltfExportOptions.exportCameras}
                                onSelect={(value) => (this._gltfExportOptions.exportCameras = value)}
                            />
                            <CheckBoxLineComponent
                                label="Export Lights"
                                isSelected={() => this._gltfExportOptions.exportLights}
                                onSelect={(value) => (this._gltfExportOptions.exportLights = value)}
                            />
                            <ButtonLineComponent label="Export to GLB" onClick={() => this.exportGLTF()} />
                        </>
                    )}
                </LineContainerComponent>
                {GLTFFileLoader && <GLTFComponent lockObject={this._lockObject} scene={scene} globalState={this.props.globalState!} />}
                <LineContainerComponent title="REFLECTOR" selection={this.props.globalState}>
                    <TextInputLineComponent lockObject={this._lockObject} label="Hostname" target={this} propertyName="_reflectorHostname" />
                    <FloatLineComponent lockObject={this._lockObject} label="Port" target={this} propertyName="_reflectorPort" isInteger={true} />
                    <ButtonLineComponent label="Connect" onClick={() => this.connectReflector()} />
                </LineContainerComponent>
            </div>
        );
    }
}
