import * as React from "react";
import { PaneComponent, IPaneComponentProps } from "../paneComponent";
import { LineContainerComponent } from "../lineContainerComponent";
import { ButtonLineComponent } from "../lines/buttonLineComponent";
import { Node } from "babylonjs/node";
import { Nullable } from "babylonjs/types";
import { VideoRecorder } from "babylonjs/Misc/videoRecorder";
import { Tools } from "babylonjs/Misc/tools";
import { EnvironmentTextureTools } from "babylonjs/Misc/environmentTextureTools";
import { BackgroundMaterial } from "babylonjs/Materials/Background/backgroundMaterial";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { CubeTexture } from "babylonjs/Materials/Textures/cubeTexture";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { SceneSerializer } from "babylonjs/Misc/sceneSerializer";
import { Mesh } from "babylonjs/Meshes/mesh";
import { FilesInput } from 'babylonjs/Misc/filesInput';
import { Scene } from 'babylonjs/scene';
import { SceneLoaderAnimationGroupLoadingMode } from 'babylonjs/Loading/sceneLoader';

import { GLTFComponent } from "./tools/gltfComponent";

import { GLTFData, GLTF2Export } from "babylonjs-serializers/glTF/2.0/index";
import { FloatLineComponent } from '../lines/floatLineComponent';
import { IScreenshotSize } from 'babylonjs/Misc/interfaces/screenshotSize';
import { NumericInputComponent } from '../lines/numericInputComponent';
import { CheckBoxLineComponent } from '../lines/checkBoxLineComponent';
import { TextLineComponent } from '../lines/textLineComponent';
import { FileMultipleButtonLineComponent } from '../lines/fileMultipleButtonLineComponent';
import { OptionsLineComponent } from '../lines/optionsLineComponent';
import { MessageLineComponent } from '../lines/messageLineComponent';
import { FileButtonLineComponent } from '../lines/fileButtonLineComponent';
import { IndentedTextLineComponent } from '../lines/indentedTextLineComponent';

const GIF = require('gif.js.optimized')

export class ToolsTabComponent extends PaneComponent {
    private _videoRecorder: Nullable<VideoRecorder>;
    private _screenShotSize: IScreenshotSize = { precision: 1 };
    private _gifOptions = {width: 512, frequency: 200};
    private _useWidthHeight = false;
    private _isExporting = false;
    private _gifWorkerBlob: Blob;
    private _gifRecorder: any;
    private _previousRenderingScale: number;
    private _crunchingGIF = false;

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

    componentDidMount() {
        if (!(BABYLON as any).GLTF2Export) {
            Tools.LoadScript("https://preview.babylonjs.com/serializers/babylonjs.serializers.min.js", () => {
            });
            return;
        }
    }

    componentWillUnmount() {
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

    captureRender() {
        const scene = this.props.scene;
        const oldScreenshotSize: IScreenshotSize = {
            height: this._screenShotSize.height,
            width: this._screenShotSize.width,
            precision: this._screenShotSize.precision
        };
        if (!this._useWidthHeight) {
            this._screenShotSize.width = undefined;
            this._screenShotSize.height = undefined;
        }
        if (scene.activeCamera) {
            Tools.CreateScreenshotUsingRenderTarget(scene.getEngine(), scene.activeCamera, this._screenShotSize);
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
            workerScript: workerUrl
        });
        const scene = this.props.scene;
        const engine = scene.getEngine();

        this._previousRenderingScale = engine.getHardwareScalingLevel();
        engine.setHardwareScalingLevel(engine.getRenderWidth() / this._gifOptions.width | 0);

        let intervalId = setInterval(() => {
            if (!this._gifRecorder) {
                clearInterval(intervalId);
                return;
            }
            this._gifRecorder.addFrame(engine.getRenderingCanvas(), {delay: this._gifOptions.frequency});
        }, this._gifOptions.frequency);
                        
        this._gifRecorder.on('finished', (blob: Blob) =>{
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

        Tools.LoadFileAsync("https://cdn.jsdelivr.net/gh//terikon/gif.js.optimized@0.1.6/dist/gif.worker.js").then(value => {
            this._gifWorkerBlob = new Blob([value], {
                type: 'application/javascript'
            });
            this.recordGIFInternal();
        });
    }

    importAnimations(event: any) {

        const scene = this.props.scene;

        const overwriteAnimations = this.props.globalState.sceneImportDefaults["overwriteAnimations"];
        const animationGroupLoadingMode = this.props.globalState.sceneImportDefaults["animationGroupLoadingMode"];

        var reload = function (sceneFile: File) {
            // If a scene file has been provided
            if (sceneFile) {
                var onSuccess = function (scene: Scene) {
                    if (scene.animationGroups.length > 0) {
                        let currentGroup = scene.animationGroups[0];
                        currentGroup.play(true);
                    }
                };
                (BABYLON as any).SceneLoader.ImportAnimationsAsync("file:", sceneFile, scene, overwriteAnimations, animationGroupLoadingMode, null, onSuccess);
            }
        };
        let filesInputAnimation = new FilesInput(scene.getEngine() as any, scene as any, () => { }, () => { }, () => { }, (remaining: number) => { }, () => { }, reload, () => { });

        filesInputAnimation.loadFiles(event);
    }

    shouldExport(node: Node): boolean {

        // No skybox
        if (node instanceof Mesh) {
            if (node.material) {
                const material = node.material as PBRMaterial | StandardMaterial | BackgroundMaterial;
                const reflectionTexture = material.reflectionTexture;
                if (reflectionTexture && reflectionTexture.coordinatesMode === Texture.SKYBOX_MODE) {
                    return false;
                }
            }
        }

        return true;
    }

    exportGLTF() {
        const scene = this.props.scene;
        this._isExporting = true;
        this.forceUpdate();

        GLTF2Export.GLBAsync(scene, "scene", {
            shouldExportNode: (node) => this.shouldExport(node)
        }).then((glb: GLTFData) => {
            glb.downloadFiles();
            this._isExporting = false;
            this.forceUpdate();
        }).catch(reason => {      
            this._isExporting = false;
            this.forceUpdate();
        });
    }

    exportBabylon() {
        const scene = this.props.scene;

        var strScene = JSON.stringify(SceneSerializer.Serialize(scene));
        var blob = new Blob([strScene], { type: "octet/stream" });

        Tools.Download(blob, "scene.babylon");
    }

    createEnvTexture() {
        const scene = this.props.scene;
        EnvironmentTextureTools.CreateEnvTextureAsync(scene.environmentTexture as CubeTexture)
            .then((buffer: ArrayBuffer) => {
                var blob = new Blob([buffer], { type: "octet/stream" });
                Tools.Download(blob, "environment.env");
            })
            .catch((error: any) => {
                console.error(error);
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

    render() {
        const scene = this.props.scene;

        if (!scene) {
            return null;
        }

        const sceneImportDefaults = this.props.globalState.sceneImportDefaults;

        var animationGroupLoadingModes = [
            { label: "Clean", value: SceneLoaderAnimationGroupLoadingMode.Clean },
            { label: "Stop", value: SceneLoaderAnimationGroupLoadingMode.Stop },
            { label: "Sync", value: SceneLoaderAnimationGroupLoadingMode.Sync },
            { label: "NoSync", value: SceneLoaderAnimationGroupLoadingMode.NoSync },
        ];

        return (
            <div className="pane">
                <LineContainerComponent globalState={this.props.globalState} title="CAPTURE">
                    <ButtonLineComponent label="Screenshot" onClick={() => this.captureScreenshot()} />
                    <ButtonLineComponent label={this.state.tag} onClick={() => this.recordVideo()} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="CAPTURE WITH RTT">
                    <ButtonLineComponent label="Capture" onClick={() => this.captureRender()} />
                    <div className="vector3Line">
                        <FloatLineComponent label="Precision" target={this._screenShotSize} propertyName='precision' onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <CheckBoxLineComponent label="Use Width/Height" onSelect={ value => {
                            this._useWidthHeight = value;
                            this.forceUpdate();
                        }} isSelected={() => this._useWidthHeight} />
                        {
                        this._useWidthHeight &&
                        <div className="secondLine">
                            <NumericInputComponent label="Width" precision={0} step={1} value={this._screenShotSize.width ? this._screenShotSize.width : 512} onChange={value => this._screenShotSize.width = value} />
                            <NumericInputComponent label="Height" precision={0} step={1} value={this._screenShotSize.height ? this._screenShotSize.height : 512} onChange={value => this._screenShotSize.height = value} />
                        </div>
                        }      
                    </div>              
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="GIF">
                    {
                        this._crunchingGIF &&
                        <MessageLineComponent text="Creating the GIF file..." />
                    }
                    {
                        !this._crunchingGIF &&
                        <ButtonLineComponent label={this._gifRecorder ? "Stop" : "Record"} onClick={() => this.recordGIF()} />
                    }
                    {
                        !this._crunchingGIF && !this._gifRecorder &&
                        <>
                            <FloatLineComponent label="Resolution" isInteger={true} target={this._gifOptions} propertyName="width" />
                            <FloatLineComponent label="Frequency (ms)" isInteger={true} target={this._gifOptions} propertyName="frequency" />
                        </>
                    }
                </LineContainerComponent>                
                <LineContainerComponent globalState={this.props.globalState} title="REPLAY">
                    {
                        !this.props.globalState.recorder.isRecording &&
                        <ButtonLineComponent label="Start recording" onClick={() => this.startRecording()} />
                    }
                    {
                        this.props.globalState.recorder.isRecording &&
                        <IndentedTextLineComponent value={"Record in progress"}/>                        
                    }
                    {
                        this.props.globalState.recorder.isRecording &&
                        <ButtonLineComponent label="Generate delta file" onClick={() => this.exportReplay()} />
                    }
                    <FileButtonLineComponent label={`Apply delta file`} onClick={(file) => this.applyDelta(file)} accept=".json" />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="SCENE IMPORT">
                    <FileMultipleButtonLineComponent label="Import animations" accept="gltf" onClick={(evt: any) => this.importAnimations(evt)} />
                    <CheckBoxLineComponent label="Overwrite animations" target={sceneImportDefaults} propertyName="overwriteAnimations" onSelect={value => {
                        sceneImportDefaults["overwriteAnimations"] = value;
                        this.forceUpdate();
                    }} />
                    {
                        sceneImportDefaults["overwriteAnimations"] === false &&
                        <OptionsLineComponent label="Animation merge mode" options={animationGroupLoadingModes} target={sceneImportDefaults} propertyName="animationGroupLoadingMode" />
                    }
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="SCENE EXPORT">
                    {
                        this._isExporting && 
                        <TextLineComponent label="Please wait..exporting" ignoreValue={true} />
                    }
                    {
                        !this._isExporting && 
                        <>  
                            <ButtonLineComponent label="Export to GLB" onClick={() => this.exportGLTF()} />
                            <ButtonLineComponent label="Export to Babylon" onClick={() => this.exportBabylon()} />
                            {
                                !scene.getEngine().premultipliedAlpha && scene.environmentTexture && scene.environmentTexture._prefiltered && scene.activeCamera &&
                                <ButtonLineComponent label="Generate .env texture" onClick={() => this.createEnvTexture()} />
                            }
                        </>
                    }
                </LineContainerComponent>
                {
                    (BABYLON as any).GLTFFileLoader &&
                    <GLTFComponent scene={scene} globalState={this.props.globalState!} />
                }
            </div>
        );
    }
}
