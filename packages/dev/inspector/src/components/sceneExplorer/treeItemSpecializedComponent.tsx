import type { Camera } from "core/Cameras/camera";
import type { IExplorerExtensibilityGroup } from "core/Debug/debugLayer";
import type { AnimationGroup, TargetedAnimation } from "core/Animations/animationGroup";
import type { Material } from "core/Materials/material";
import type { Texture } from "core/Materials/Textures/texture";
import type { TransformNode } from "core/Meshes/transformNode";
import type { Light } from "core/Lights/light";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { PostProcess } from "core/PostProcesses/postProcess";

import { MeshTreeItemComponent } from "./entities/meshTreeItemComponent";
import { CameraTreeItemComponent } from "./entities/cameraTreeItemComponent";
import { LightTreeItemComponent } from "./entities/lightTreeItemComponent";
import { TreeItemLabelComponent } from "./treeItemLabelComponent";
import { faProjectDiagram } from "@fortawesome/free-solid-svg-icons";
import { MaterialTreeItemComponent } from "./entities/materialTreeItemComponent";
import { TextureTreeItemComponent } from "./entities/textureTreeItemComponent";
import { TransformNodeItemComponent } from "./entities/transformNodeTreeItemComponent";
import * as React from "react";
import { ControlTreeItemComponent } from "./entities/gui/controlTreeItemComponent";
import type { Control } from "gui/2D/controls/control";
import type { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";
import { AdvancedDynamicTextureTreeItemComponent } from "./entities/gui/advancedDynamicTextureTreeItemComponent";
import { AnimationGroupItemComponent } from "./entities/animationGroupTreeItemComponent";
import type { GlobalState } from "../globalState";
import { PostProcessItemComponent } from "./entities/postProcessTreeItemComponent";
import { RenderingPipelineItemComponent } from "./entities/renderingPipelineTreeItemComponent";
import type { PostProcessRenderPipeline } from "core/PostProcesses/RenderPipeline/postProcessRenderPipeline";
import { SkeletonTreeItemComponent } from "./entities/skeletonTreeItemComponent";
import type { Skeleton } from "core/Bones/skeleton";
import { BoneTreeItemComponent } from "./entities/boneTreeItemComponent";
import type { Bone } from "core/Bones/bone";
import { ParticleSystemTreeItemComponent } from "./entities/particleSystemTreeItemComponent";
import type { IParticleSystem } from "core/Particles/IParticleSystem";
import { SpriteManagerTreeItemComponent } from "./entities/spriteManagerTreeItemComponent";
import type { SpriteManager } from "core/Sprites/spriteManager";
import { SpriteTreeItemComponent } from "./entities/spriteTreeItemComponent";
import type { Sprite } from "core/Sprites/sprite";
import { TargetedAnimationItemComponent } from "./entities/targetedAnimationTreeItemComponent";
import type { Sound } from "core/Audio/sound";
import { SoundTreeItemComponent } from "./entities/soundTreeItemComponent";
import { EffectLayerItemComponent } from "./entities/effectLayerPipelineTreeItemComponent";
import type { EffectLayer } from "core/Layers/effectLayer";

interface ITreeItemSpecializedComponentProps {
    label: string;
    entity?: any;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    globalState: GlobalState;
    onClick?: () => void;
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
                return (
                    <MeshTreeItemComponent globalState={this.props.globalState} extensibilityGroups={this.props.extensibilityGroups} mesh={mesh} onClick={() => this.onClick()} />
                );
            }

            if (className.indexOf("SpriteManager") !== -1) {
                return (
                    <SpriteManagerTreeItemComponent extensibilityGroups={this.props.extensibilityGroups} spriteManager={entity as SpriteManager} onClick={() => this.onClick()} />
                );
            }

            if (className.indexOf("Sprite") !== -1) {
                return <SpriteTreeItemComponent extensibilityGroups={this.props.extensibilityGroups} sprite={entity as Sprite} onClick={() => this.onClick()} />;
            }

            if (className.indexOf("Skeleton") !== -1) {
                return <SkeletonTreeItemComponent extensibilityGroups={this.props.extensibilityGroups} skeleton={entity as Skeleton} onClick={() => this.onClick()} />;
            }

            if (className.indexOf("Bone") !== -1) {
                return <BoneTreeItemComponent extensibilityGroups={this.props.extensibilityGroups} bone={entity as Bone} onClick={() => this.onClick()} />;
            }

            if (className.indexOf("TransformNode") !== -1) {
                return <TransformNodeItemComponent extensibilityGroups={this.props.extensibilityGroups} transformNode={entity as TransformNode} onClick={() => this.onClick()} />;
            }

            if (className.indexOf("Camera") !== -1) {
                return (
                    <CameraTreeItemComponent
                        globalState={this.props.globalState}
                        extensibilityGroups={this.props.extensibilityGroups}
                        camera={entity as Camera}
                        onClick={() => this.onClick()}
                    />
                );
            }

            if (className.indexOf("Light", className.length - 5) !== -1) {
                return (
                    <LightTreeItemComponent
                        globalState={this.props.globalState}
                        extensibilityGroups={this.props.extensibilityGroups}
                        light={entity as Light}
                        onClick={() => this.onClick()}
                    />
                );
            }

            if (className.indexOf("Material") !== -1) {
                return <MaterialTreeItemComponent extensibilityGroups={this.props.extensibilityGroups} material={entity as Material} onClick={() => this.onClick()} />;
            }

            if (className.indexOf("ParticleSystem") !== -1) {
                return <ParticleSystemTreeItemComponent extensibilityGroups={this.props.extensibilityGroups} system={entity as IParticleSystem} onClick={() => this.onClick()} />;
            }

            if (className === "AdvancedDynamicTexture") {
                return (
                    <AdvancedDynamicTextureTreeItemComponent
                        onSelectionChangedObservable={this.props.globalState.onSelectionChangedObservable}
                        extensibilityGroups={this.props.extensibilityGroups}
                        texture={entity as AdvancedDynamicTexture}
                        onClick={() => this.onClick()}
                    />
                );
            }

            if (className === "AnimationGroup") {
                return (
                    <AnimationGroupItemComponent extensibilityGroups={this.props.extensibilityGroups} animationGroup={entity as AnimationGroup} onClick={() => this.onClick()} />
                );
            }

            if (className === "TargetedAnimation") {
                return (
                    <TargetedAnimationItemComponent
                        extensibilityGroups={this.props.extensibilityGroups}
                        targetedAnimation={entity as TargetedAnimation}
                        onClick={() => this.onClick()}
                    />
                );
            }

            if (className.indexOf("Texture") !== -1) {
                return <TextureTreeItemComponent extensibilityGroups={this.props.extensibilityGroups} texture={entity as Texture} onClick={() => this.onClick()} />;
            }

            if (className.indexOf("RenderingPipeline") !== -1) {
                return (
                    <RenderingPipelineItemComponent
                        extensibilityGroups={this.props.extensibilityGroups}
                        renderPipeline={entity as PostProcessRenderPipeline}
                        onClick={() => this.onClick()}
                    />
                );
            }

            if (className.indexOf("PostProcess") !== -1) {
                return <PostProcessItemComponent extensibilityGroups={this.props.extensibilityGroups} postProcess={entity as PostProcess} onClick={() => this.onClick()} />;
            }

            if (className.indexOf("Layer") !== -1) {
                return <EffectLayerItemComponent extensibilityGroups={this.props.extensibilityGroups} layer={entity as EffectLayer} onClick={() => this.onClick()} />;
            }

            if (className.indexOf("Sound") !== -1) {
                return <SoundTreeItemComponent extensibilityGroups={this.props.extensibilityGroups} sound={entity as Sound} onClick={() => this.onClick()} />;
            }

            if (entity._host) {
                return <ControlTreeItemComponent extensibilityGroups={this.props.extensibilityGroups} control={entity as Control} onClick={() => this.onClick()} />;
            }
        }

        return (
            <div className="meshTools">
                <TreeItemLabelComponent label={entity.name} onClick={() => this.onClick()} icon={faProjectDiagram} color="cornflowerblue" />
            </div>
        );
    }
}
