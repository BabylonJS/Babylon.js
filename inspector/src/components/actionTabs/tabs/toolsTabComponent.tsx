import * as React from "react";
import { PaneComponent, IPaneComponentProps } from "../paneComponent";
import { LineContainerComponent } from "../lineContainerComponent";
import { ButtonLineComponent } from "../lines/buttonLineComponent";
import { VideoRecorder, Nullable, TransformNode, PBRMaterial, StandardMaterial, BackgroundMaterial, EnvironmentTextureTools, CubeTexture, Tools, Mesh, Texture, SceneSerializer } from "babylonjs";
import { GLTFComponent } from "./tools/gltfComponent";
import { GLTFData } from "babylonjs-serializers";
import { GLTF2Export } from "babylonjs-serializers";

export class ToolsTabComponent extends PaneComponent {
    private _videoRecorder: Nullable<VideoRecorder>;

    constructor(props: IPaneComponentProps) {
        super(props);

        this.state = { tag: "Record video" };
    }

    componentWillMount() {
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
    }

    captureScreenshot() {
        const scene = this.props.scene;
        if (scene.activeCamera) {
            Tools.CreateScreenshotUsingRenderTarget(scene.getEngine(), scene.activeCamera, { precision: 1.0 }, undefined, undefined, 4, true);
        }
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

    shouldExport(transformNode: TransformNode): boolean {

        // No skybox
        if (transformNode instanceof Mesh) {
            if (transformNode.material) {
                const material = transformNode.material as PBRMaterial | StandardMaterial | BackgroundMaterial;
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

        GLTF2Export.GLBAsync(scene, "scene", {
            shouldExportTransformNode: (transformNode) => this.shouldExport(transformNode)
        }).then((glb: GLTFData) => {
            glb.downloadFiles();
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

    render() {
        const scene = this.props.scene;

        if (!scene) {
            return null;
        }

        return (
            <div className="pane">
                <LineContainerComponent title="CAPTURE">
                    <ButtonLineComponent label="Screenshot" onClick={() => this.captureScreenshot()} />
                    <ButtonLineComponent label={this.state.tag} onClick={() => this.recordVideo()} />
                </LineContainerComponent>
                <LineContainerComponent title="SCENE EXPORT">
                    <ButtonLineComponent label="Export to GLB" onClick={() => this.exportGLTF()} />
                    <ButtonLineComponent label="Export to Babylon" onClick={() => this.exportBabylon()} />
                    {
                        !scene.getEngine().premultipliedAlpha && scene.environmentTexture && scene.activeCamera &&
                        <ButtonLineComponent label="Generate .env texture" onClick={() => this.createEnvTexture()} />
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
