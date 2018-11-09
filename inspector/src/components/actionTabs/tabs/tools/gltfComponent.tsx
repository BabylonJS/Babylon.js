import * as React from "react";
import { Scene, TransformNode, PBRMaterial, StandardMaterial, BackgroundMaterial } from "babylonjs";
import { LineContainerComponent } from "../../lineContainerComponent";
import { ButtonLineComponent } from "../../lines/buttonLineComponent";
import { GLTFData } from "babylonjs-serializers";
import { CheckBoxLineComponent } from "../../lines/checkBoxLineComponent";
import { GlobalState } from "../../../globalState";

interface IGLTFComponentProps {
    scene: Scene,
    globalState: GlobalState
}

export class GLTFComponent extends React.Component<IGLTFComponentProps> {
    constructor(props: IGLTFComponentProps) {
        super(props);
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
        const extensionStates = this.props.globalState.glTFLoaderDefaults;
        return (
            <div>
                <LineContainerComponent title="SCENE EXPORT">
                    <ButtonLineComponent label="Export to GLB" onClick={() => this.exportGLTF()} />
                </LineContainerComponent>
                <LineContainerComponent title="GLTF EXTENSIONS">
                    <CheckBoxLineComponent label="MSFT_lod" isSelected={() => extensionStates["MSFT_lod"]} onSelect={value => extensionStates["MSFT_lod"] = value}/>
                </LineContainerComponent>
            </div>
        );
    }
}