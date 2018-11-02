import * as React from "react";
import { PaneComponent, IPaneComponentProps } from "../paneComponent";
import { LineContainerComponent } from "../lineContainerComponent";
import { ButtonLineComponent } from "../lines/buttonLineComponent";
import { VideoRecorder, TransformNode, PBRMaterial, StandardMaterial, BackgroundMaterial, Nullable } from "babylonjs";
import { GLTFData } from "babylonjs-serializers";

export class ToolsTabComponent extends PaneComponent {
    private _videoRecorder: Nullable<VideoRecorder>;

    constructor(props: IPaneComponentProps) {
        super(props);

        this.state = { tag: "Record video" };
    }

    componentWillMount() {
        if (!(BABYLON as any).GLTF2Export) {
            BABYLON.Tools.LoadScript("https://preview.babylonjs.com/serializers/babylonjs.serializers.min.js", () => {
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
            BABYLON.Tools.CreateScreenshotUsingRenderTarget(scene.getEngine(), scene.activeCamera, { precision: 1.0 }, undefined, undefined, 4, true);
        }
    }

    recordVideo() {
        if (this._videoRecorder && this._videoRecorder.isRecording) {
            this._videoRecorder.stopRecording();
            return;
        }

        const scene = this.props.scene;
        if (!this._videoRecorder) {
            this._videoRecorder = new BABYLON.VideoRecorder(scene.getEngine());
        }

        this._videoRecorder.startRecording().then(() => {
            this.setState({ tag: "Record video" })
        });
        this.setState({ tag: "Stop recording" })
    }

    shouldExport(transformNode: TransformNode): boolean {

        // No skybox
        if (transformNode instanceof BABYLON.Mesh) {
            if (transformNode.material) {
                const material = transformNode.material as PBRMaterial | StandardMaterial | BackgroundMaterial;
                const reflectionTexture = material.reflectionTexture;
                if (reflectionTexture && reflectionTexture.coordinatesMode === BABYLON.Texture.SKYBOX_MODE) {
                    return false;
                }
            }
        }

        return true;
    }

    exportGLTF() {
        const scene = this.props.scene;

        BABYLON.GLTF2Export.GLBAsync(scene, "scene", {
            shouldExportTransformNode: (transformNode) => this.shouldExport(transformNode)
        }).then((glb: GLTFData) => {
            glb.downloadFiles();
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
                <LineContainerComponent title="GLTF">
                    <ButtonLineComponent label="Export" onClick={() => this.exportGLTF()} />
                </LineContainerComponent>
            </div>
        );
    }
}
