import * as React from "react";
import { PaneComponent, IPaneComponentProps } from "../paneComponent";
import { Mesh, TransformNode, Material, StandardMaterial, Texture, PBRMaterial, Scene, FreeCamera, ArcRotateCamera, HemisphericLight, PointLight, BackgroundMaterial } from "babylonjs";
import { MaterialPropertyGridComponent } from "./propertyGrids/materials/materialPropertyGridComponent";
import { StandardMaterialPropertyGridComponent } from "./propertyGrids/materials/standardMaterialPropertyGridComponent";
import { TexturePropertyGridComponent } from "./propertyGrids/materials/texturePropertyGridComponent";
import { PBRMaterialPropertyGridComponent } from "./propertyGrids/materials/pbrMaterialPropertyGridComponent";
import { ScenePropertyGridComponent } from "./propertyGrids/scenePropertyGridComponent";
import { HemisphericLightPropertyGridComponent } from "./propertyGrids/lights/hemisphericLightPropertyGridComponent";
import { PointLightPropertyGridComponent } from "./propertyGrids/lights/pointLightPropertyGridComponent";
import { FreeCameraPropertyGridComponent } from "./propertyGrids/cameras/freeCameraPropertyGridComponent";
import { ArcRotateCameraPropertyGridComponent } from "./propertyGrids/cameras/arcRotateCameraPropertyGridComponent";
import { MeshPropertyGridComponent } from "./propertyGrids/meshes/meshPropertyGridComponent";
import { TransformNodePropertyGridComponent } from "./propertyGrids/meshes/transformNodePropertyGridComponent";
import { BackgroundMaterialPropertyGridComponent } from "./propertyGrids/materials/backgroundMaterialPropertyGridComponent";
import { Control } from "babylonjs-gui/2D/controls/control";
import { ControlPropertyGridComponent } from "./propertyGrids/gui/controlPropertyGridComponent";
import { TextBlockPropertyGridComponent } from "./propertyGrids/gui/textBlockPropertyGridComponent";
import { TextBlock } from "babylonjs-gui/2D/controls/textBlock";
import { InputText } from "babylonjs-gui/2D/controls/inputText";
import { InputTextPropertyGridComponent } from "./propertyGrids/gui/inputTextPropertyGridComponent";
import { ColorPicker } from "babylonjs-gui";
import { ColorPickerPropertyGridComponent } from "./propertyGrids/gui/colorPickerPropertyGridComponent";

export class PropertyGridTabComponent extends PaneComponent {
    constructor(props: IPaneComponentProps) {
        super(props);
    }

    render() {
        const entity = this.props.selectedEntity;

        if (!entity) {
            return (
                <div className="infoMessage">
                    Please select an entity in the scene explorer.
                </div>
            );
        }

        if (entity.getClassName) {
            const className = entity.getClassName();

            if (className.indexOf("Mesh") !== -1) {
                const mesh = entity as Mesh;
                if (mesh.getTotalVertices() > 0) {
                    return (<MeshPropertyGridComponent mesh={mesh}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
                }
            }

            if (className.indexOf("FreeCamera") !== -1) {
                const freeCamera = entity as FreeCamera;
                return (<FreeCameraPropertyGridComponent camera={freeCamera} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("ArcRotateCamera") !== -1) {
                const arcRotateCamera = entity as ArcRotateCamera;
                return (<ArcRotateCameraPropertyGridComponent camera={arcRotateCamera} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "HemisphericLight") {
                const hemisphericLight = entity as HemisphericLight;
                return (<HemisphericLightPropertyGridComponent
                    light={hemisphericLight}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "PointLight") {
                const pointLight = entity as PointLight;
                return (<PointLightPropertyGridComponent
                    light={pointLight}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("TransformNode") !== -1 || className.indexOf("Mesh") !== -1) {
                const transformNode = entity as TransformNode;
                return (<TransformNodePropertyGridComponent transformNode={transformNode} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "StandardMaterial") {
                const material = entity as StandardMaterial;
                return (<StandardMaterialPropertyGridComponent
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "PBRMaterial") {
                const material = entity as PBRMaterial;
                return (<PBRMaterialPropertyGridComponent
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "BackgroundMaterial") {
                const material = entity as BackgroundMaterial;
                return (<BackgroundMaterialPropertyGridComponent
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("Material") !== -1) {
                const material = entity as Material;
                return (<MaterialPropertyGridComponent material={material} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("Texture") !== -1) {
                const texture = entity as Texture;
                return (<TexturePropertyGridComponent texture={texture} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "TextBlock") {
                const textBlock = entity as TextBlock;
                return (<TextBlockPropertyGridComponent textBlock={textBlock} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "InputText") {
                const inputText = entity as InputText;
                return (<InputTextPropertyGridComponent inputText={inputText} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "ColorPicker") {
                const colorPicker = entity as ColorPicker;
                return (<ColorPickerPropertyGridComponent colorPicker={colorPicker} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (entity._host) {
                const control = entity as Control;
                return (<ControlPropertyGridComponent control={control} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }
        } else if (entity.transformNodes) {
            const scene = entity as Scene;
            return (<ScenePropertyGridComponent scene={scene}
                onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
        }

        return null;
    }
}