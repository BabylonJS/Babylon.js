import * as React from "react";
import { PaneComponent, IPaneComponentProps } from "../../../paneComponent";
import { Mesh, TransformNode, Material, StandardMaterial, Texture, PBRMaterial, Scene, FreeCamera, ArcRotateCamera, HemisphericLight, PointLight } from "babylonjs";
import { MaterialPropertyGridComponent } from "../materials/materialPropertyGridComponent";
import { StandardMaterialPropertyGridComponent } from "../materials/standardMaterialPropertyGridComponent";
import { TexturePropertyGridComponent } from "../materials/texturePropertyGridComponent";
import { PBRMaterialPropertyGridComponent } from "../materials/pbrMaterialPropertyGridComponent";
import { ScenePropertyGridComponent } from "../scenePropertyGridComponent";
import { HemisphericLightPropertyGridComponent } from "../lights/hemisphericLightPropertyGridComponent";
import { PointLightPropertyGridComponent } from "../lights/pointLightPropertyGridComponent";
import { FreeCameraPropertyGridComponent } from "./freeCameraPropertyGridComponent";
import { ArcRotateCameraPropertyGridComponent } from "./arcRotateCameraPropertyGridComponent";
import { MeshPropertyGridComponent } from "../meshes/meshPropertyGridComponent";
import { TransformNodePropertyGridComponent } from "../meshes/transformNodePropertyGridComponent";

export class PropertyGridTabComponent extends PaneComponent {
    constructor(props: IPaneComponentProps) {
        super(props);
    }

    render() {
        const entity = this.props.selectedEntity;

        if (!entity) {
            return null;
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

            if (className.indexOf("Material") !== -1) {
                const material = entity as Material;
                return (<MaterialPropertyGridComponent material={material} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("Texture") !== -1) {
                const texture = entity as Texture;
                return (<TexturePropertyGridComponent texture={texture} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

        } else if (entity.transformNodes) {
            const scene = entity as Scene;
            return (<ScenePropertyGridComponent scene={scene} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
        }

        return null;
    }
}