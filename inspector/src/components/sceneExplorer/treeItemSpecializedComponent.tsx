import { Camera } from "babylonjs/Cameras/camera";
import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { AnimationGroup } from "babylonjs/Animations/animationGroup";
import { Material } from "babylonjs/Materials/material";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Light } from "babylonjs/Lights/light";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { PostProcess } from 'babylonjs/PostProcesses/postProcess';

import { MeshTreeItemComponent } from "./entities/meshTreeItemComponent";
import { CameraTreeItemComponent } from "./entities/cameraTreeItemComponent";
import { LightTreeItemComponent } from "./entities/lightTreeItemComponent";
import { TreeItemLabelComponent } from "./treeItemLabelComponent";
import { faProjectDiagram } from '@fortawesome/free-solid-svg-icons';
import { MaterialTreeItemComponent } from "./entities/materialTreeItemComponent";
import { TextureTreeItemComponent } from "./entities/textureTreeItemComponent";
import { TransformNodeItemComponent } from "./entities/transformNodeTreeItemComponent";
import * as React from "react";
import { ControlTreeItemComponent } from "./entities/gui/controlTreeItemComponent";
import { Control } from "babylonjs-gui/2D/controls/control";
import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
import { AdvancedDynamicTextureTreeItemComponent } from "./entities/gui/advancedDynamicTextureTreeItemComponent";
import { AnimationGroupItemComponent } from "./entities/animationGroupTreeItemComponent";
import { GlobalState } from "../globalState";
import { PostProcessItemComponent } from './entities/postProcessTreeItemComponent';


interface ITreeItemSpecializedComponentProps {
    label: string,
    entity?: any,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    globalState: GlobalState,
    onClick?: () => void
}

export class TreeItemSpecializedComponent extends React.Component<ITreeItemSpecializedComponentProps> {
    constructor(props: ITreeItemSpecializedComponentProps) {
        super(props);
    }

    onClick() {
        if (!this.props.onClick) {
            return;
        }

        this.props.onClick();
    }

    render() {
        const entity = this.props.entity;

        if (entity && entity.getClassName) {
            const className = entity.getClassName();

            if (className.indexOf("Mesh") !== -1) {
                const mesh = entity as AbstractMesh;
                if (mesh.getTotalVertices() > 0) {
                    return (<MeshTreeItemComponent extensibilityGroups={this.props.extensibilityGroups} mesh={mesh} onClick={() => this.onClick()} />);
                } else {
                    return (<TransformNodeItemComponent extensibilityGroups={this.props.extensibilityGroups} transformNode={entity as TransformNode} onClick={() => this.onClick()} />);
                }
            }

            if (className.indexOf("TransformNode") !== -1) {
                return (<TransformNodeItemComponent extensibilityGroups={this.props.extensibilityGroups} transformNode={entity as TransformNode} onClick={() => this.onClick()} />);
            }

            if (className.indexOf("Camera") !== -1) {
                return (<CameraTreeItemComponent extensibilityGroups={this.props.extensibilityGroups} camera={entity as Camera} onClick={() => this.onClick()} />);
            }

            if (className.indexOf("Light") !== -1) {
                return (<LightTreeItemComponent globalState={this.props.globalState} extensibilityGroups={this.props.extensibilityGroups} light={entity as Light} onClick={() => this.onClick()} />);
            }

            if (className.indexOf("Material") !== -1) {
                return (<MaterialTreeItemComponent extensibilityGroups={this.props.extensibilityGroups} material={entity as Material} onClick={() => this.onClick()} />);
            }

            if (className === "AdvancedDynamicTexture") {
                return (<AdvancedDynamicTextureTreeItemComponent onSelectionChangedObservable={this.props.globalState.onSelectionChangedObservable} extensibilityGroups={this.props.extensibilityGroups} texture={entity as AdvancedDynamicTexture} onClick={() => this.onClick()} />);
            }

            if (className === "AnimationGroup") {
                return (<AnimationGroupItemComponent extensibilityGroups={this.props.extensibilityGroups} animationGroup={entity as AnimationGroup} onClick={() => this.onClick()} />);
            }

            if (className.indexOf("Texture") !== -1) {
                return (<TextureTreeItemComponent extensibilityGroups={this.props.extensibilityGroups} texture={entity as Texture} onClick={() => this.onClick()} />);
            }

            if (className.indexOf("PostProcess") !== -1) {
                return (<PostProcessItemComponent extensibilityGroups={this.props.extensibilityGroups} postProcess={entity as PostProcess} onClick={() => this.onClick()} />);
            }

            if (entity._host) {
                return (<ControlTreeItemComponent extensibilityGroups={this.props.extensibilityGroups} control={entity as Control} onClick={() => this.onClick()} />);
            }
        }

        return (
            <div className="meshTools">
                <TreeItemLabelComponent label={entity.name} onClick={() => this.onClick()} icon={faProjectDiagram} color="cornflowerblue" />
            </div>
        );
    }
}
