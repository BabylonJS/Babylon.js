import type { IPaneComponentProps } from "../paneComponent";
import { PaneComponent } from "../paneComponent";

import type { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import type { FreeCamera } from "core/Cameras/freeCamera";
import type { AnimationGroup, TargetedAnimation } from "core/Animations/animationGroup";
import type { Material } from "core/Materials/material";
import type { BackgroundMaterial } from "core/Materials/Background/backgroundMaterial";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { PBRMetallicRoughnessMaterial } from "core/Materials/PBR/pbrMetallicRoughnessMaterial";
import type { PBRSpecularGlossinessMaterial } from "core/Materials/PBR/pbrSpecularGlossinessMaterial";
import type { Texture } from "core/Materials/Textures/texture";
import type { TransformNode } from "core/Meshes/transformNode";
import type { Mesh } from "core/Meshes/mesh";
import type { HemisphericLight } from "core/Lights/hemisphericLight";
import type { PointLight } from "core/Lights/pointLight";
import type { Scene } from "core/scene";

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
import type { Control } from "gui/2D/controls/control";
import { ControlPropertyGridComponent } from "shared-ui-components/tabs/propertyGrids/gui/controlPropertyGridComponent";
import { TextBlockPropertyGridComponent } from "shared-ui-components/tabs/propertyGrids/gui/textBlockPropertyGridComponent";
import type { TextBlock } from "gui/2D/controls/textBlock";
import type { InputText } from "gui/2D/controls/inputText";
import { InputTextPropertyGridComponent } from "shared-ui-components/tabs/propertyGrids/gui/inputTextPropertyGridComponent";

import type { ColorPicker } from "gui/2D/controls/colorpicker";
import type { Image } from "gui/2D/controls/image";
import type { Slider } from "gui/2D/controls/sliders/slider";
import type { ImageBasedSlider } from "gui/2D/controls/sliders/imageBasedSlider";
import type { Rectangle } from "gui/2D/controls/rectangle";
import type { Ellipse } from "gui/2D/controls/ellipse";
import type { Checkbox } from "gui/2D/controls/checkbox";
import type { RadioButton } from "gui/2D/controls/radioButton";
import type { Line } from "gui/2D/controls/line";
import type { ScrollViewer } from "gui/2D/controls/scrollViewers/scrollViewer";
import type { Grid } from "gui/2D/controls/grid";
import type { StackPanel } from "gui/2D/controls/stackPanel";

import { ColorPickerPropertyGridComponent } from "shared-ui-components/tabs/propertyGrids/gui/colorPickerPropertyGridComponent";
import { AnimationGroupGridComponent } from "./propertyGrids/animations/animationGroupPropertyGridComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { ImagePropertyGridComponent } from "shared-ui-components/tabs/propertyGrids/gui/imagePropertyGridComponent";
import { SliderPropertyGridComponent } from "shared-ui-components/tabs/propertyGrids/gui/sliderPropertyGridComponent";
import { ImageBasedSliderPropertyGridComponent } from "shared-ui-components/tabs/propertyGrids/gui/imageBasedSliderPropertyGridComponent";
import { RectanglePropertyGridComponent } from "shared-ui-components/tabs/propertyGrids/gui/rectanglePropertyGridComponent";
import { EllipsePropertyGridComponent } from "shared-ui-components/tabs/propertyGrids/gui/ellipsePropertyGridComponent";
import { CheckboxPropertyGridComponent } from "shared-ui-components/tabs/propertyGrids/gui/checkboxPropertyGridComponent";
import { RadioButtonPropertyGridComponent } from "shared-ui-components/tabs/propertyGrids/gui/radioButtonPropertyGridComponent";
import { LinePropertyGridComponent } from "shared-ui-components/tabs/propertyGrids/gui/linePropertyGridComponent";
import { ScrollViewerPropertyGridComponent } from "shared-ui-components/tabs/propertyGrids/gui/scrollViewerPropertyGridComponent";
import { GridPropertyGridComponent } from "shared-ui-components/tabs/propertyGrids/gui/gridPropertyGridComponent";
import { PBRMetallicRoughnessMaterialPropertyGridComponent } from "./propertyGrids/materials/pbrMetallicRoughnessMaterialPropertyGridComponent";
import { PBRSpecularGlossinessMaterialPropertyGridComponent } from "./propertyGrids/materials/pbrSpecularGlossinessMaterialPropertyGridComponent";
import { StackPanelPropertyGridComponent } from "shared-ui-components/tabs/propertyGrids/gui/stackPanelPropertyGridComponent";
import type { PostProcess } from "core/PostProcesses/postProcess";
import { PostProcessPropertyGridComponent } from "./propertyGrids/postProcesses/postProcessPropertyGridComponent";
import { RenderingPipelinePropertyGridComponent } from "./propertyGrids/postProcesses/renderingPipelinePropertyGridComponent";
import type { PostProcessRenderPipeline } from "core/PostProcesses/RenderPipeline/postProcessRenderPipeline";
import { DefaultRenderingPipelinePropertyGridComponent } from "./propertyGrids/postProcesses/defaultRenderingPipelinePropertyGridComponent";
import type { DefaultRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import type { SSAORenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssaoRenderingPipeline";
import { SSAORenderingPipelinePropertyGridComponent } from "./propertyGrids/postProcesses/ssaoRenderingPipelinePropertyGridComponent";
import type { SSAO2RenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline";
import { SSAO2RenderingPipelinePropertyGridComponent } from "./propertyGrids/postProcesses/ssao2RenderingPipelinePropertyGridComponent";
import type { IblShadowsRenderPipeline } from "core/Rendering/IBLShadows/iblShadowsRenderPipeline";
import { IblShadowsRenderPipelinePropertyGridComponent } from "./propertyGrids/postProcesses/iblShadowsRenderPipelinePropertyGridComponent";
import type { SSRRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssrRenderingPipeline";
import { SSRRenderingPipelinePropertyGridComponent } from "./propertyGrids/postProcesses/ssrRenderingPipelinePropertyGridComponent";
import type { Skeleton } from "core/Bones/skeleton";
import { SkeletonPropertyGridComponent } from "./propertyGrids/meshes/skeletonPropertyGridComponent";
import type { Bone } from "core/Bones/bone";
import { BonePropertyGridComponent } from "./propertyGrids/meshes/bonePropertyGridComponent";
import { DirectionalLightPropertyGridComponent } from "./propertyGrids/lights/directionalLightPropertyGridComponent";
import type { DirectionalLight } from "core/Lights/directionalLight";
import type { SpotLight } from "core/Lights/spotLight";
import { SpotLightPropertyGridComponent } from "./propertyGrids/lights/spotLightPropertyGridComponent";
import { RectAreaLightPropertyGridComponent } from "./propertyGrids/lights/rectAreaLightPropertyGridComponent";
import type { LensRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/lensRenderingPipeline";
import { LensRenderingPipelinePropertyGridComponent } from "./propertyGrids/postProcesses/lensRenderingPipelinePropertyGridComponent";
import type { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { NodeMaterialPropertyGridComponent } from "./propertyGrids/materials/nodeMaterialPropertyGridComponent";
import type { MultiMaterial } from "core/Materials/multiMaterial";
import { MultiMaterialPropertyGridComponent } from "./propertyGrids/materials/multiMaterialPropertyGridComponent";
import { ParticleSystemPropertyGridComponent } from "./propertyGrids/particleSystems/particleSystemPropertyGridComponent";
import type { IParticleSystem } from "core/Particles/IParticleSystem";
import { SpriteManagerPropertyGridComponent } from "./propertyGrids/sprites/spriteManagerPropertyGridComponent";
import type { SpriteManager } from "core/Sprites/spriteManager";
import { SpritePropertyGridComponent } from "./propertyGrids/sprites/spritePropertyGridComponent";
import type { Sprite } from "core/Sprites/sprite";
import { TargetedAnimationGridComponent } from "./propertyGrids/animations/targetedAnimationPropertyGridComponent";
import type { FollowCamera } from "core/Cameras/followCamera";
import { FollowCameraPropertyGridComponent } from "./propertyGrids/cameras/followCameraPropertyGridComponent";
import type { Sound } from "core/Audio/sound";
import { SoundPropertyGridComponent } from "./propertyGrids/sounds/soundPropertyGridComponent";
import { LayerPropertyGridComponent } from "./propertyGrids/layers/layerPropertyGridComponent";
import type { EffectLayer } from "core/Layers/effectLayer";
import { FrameGraphPropertyGridComponent } from "./propertyGrids/frameGraphs/frameGraphPropertyGridComponent";
import type { FrameGraph } from "core/FrameGraph/frameGraph";
import { EmptyPropertyGridComponent } from "./propertyGrids/emptyPropertyGridComponent";
import { MetadataGridComponent } from "inspector/components/actionTabs/tabs/propertyGrids/metadata/metadataPropertyGridComponent";
import type { SkyMaterial } from "materials/sky/skyMaterial";
import { SkyMaterialPropertyGridComponent } from "./propertyGrids/materials/skyMaterialPropertyGridComponent";
import { Tags } from "core/Misc/tags";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { RectAreaLight } from "core/Lights/rectAreaLight";
import { FluentToolWrapper } from "shared-ui-components/fluent/hoc/fluentToolWrapper";
import type { OpenPBRMaterial } from "core/Materials";

export class PropertyGridTabComponent extends PaneComponent {
    private _timerIntervalId: number;
    private _lockObject = new LockObject();

    constructor(props: IPaneComponentProps) {
        super(props);
    }

    timerRefresh() {
        if (!this._lockObject.lock) {
            this.forceUpdate();
        }
    }

    override componentDidMount() {
        this._timerIntervalId = window.setInterval(() => this.timerRefresh(), 500);
    }

    override componentWillUnmount() {
        window.clearInterval(this._timerIntervalId);
    }

    renderContent() {
        const entity = this.props.selectedEntity;

        if (!entity) {
            return <div className="infoMessage">Please select an entity in the scene explorer.</div>;
        }

        if (entity.getClassName) {
            const className = entity.getClassName();

            if (className === "Scene") {
                const scene = entity as Scene;
                return (
                    <ScenePropertyGridComponent
                        scene={scene}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "Sound") {
                const sound = entity as Sound;
                return (
                    <SoundPropertyGridComponent
                        sound={sound}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "Sprite") {
                const sprite = entity as Sprite;
                return (
                    <SpritePropertyGridComponent
                        sprite={sprite}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "SpriteManager") {
                const spriteManager = entity as SpriteManager;
                return (
                    <SpriteManagerPropertyGridComponent
                        spriteManager={spriteManager}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("Mesh") !== -1) {
                const mesh = entity as Mesh;
                if (mesh.getTotalVertices() > 0) {
                    return (
                        <div>
                            <MeshPropertyGridComponent
                                globalState={this.props.globalState}
                                mesh={mesh}
                                lockObject={this._lockObject}
                                onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        </div>
                    );
                }
            }

            if (className.indexOf("ParticleSystem") !== -1) {
                const particleSystem = entity as IParticleSystem;
                return (
                    <ParticleSystemPropertyGridComponent
                        globalState={this.props.globalState}
                        system={particleSystem}
                        lockObject={this._lockObject}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (
                className.indexOf("FreeCamera") !== -1 ||
                className.indexOf("UniversalCamera") !== -1 ||
                className.indexOf("WebXRCamera") !== -1 ||
                className.indexOf("DeviceOrientationCamera") !== -1
            ) {
                const freeCamera = entity as FreeCamera;
                return (
                    <FreeCameraPropertyGridComponent
                        globalState={this.props.globalState}
                        camera={freeCamera}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("ArcRotateCamera") !== -1) {
                const arcRotateCamera = entity as ArcRotateCamera;
                return (
                    <ArcRotateCameraPropertyGridComponent
                        globalState={this.props.globalState}
                        camera={arcRotateCamera}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("FollowCamera") !== -1) {
                const followCamera = entity as FollowCamera;
                return (
                    <FollowCameraPropertyGridComponent
                        globalState={this.props.globalState}
                        camera={followCamera}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "HemisphericLight") {
                const hemisphericLight = entity as HemisphericLight;
                return (
                    <HemisphericLightPropertyGridComponent
                        globalState={this.props.globalState}
                        light={hemisphericLight}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "PointLight") {
                const pointLight = entity as PointLight;
                return (
                    <PointLightPropertyGridComponent
                        globalState={this.props.globalState}
                        light={pointLight}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "DirectionalLight") {
                const pointLight = entity as DirectionalLight;
                return (
                    <DirectionalLightPropertyGridComponent
                        globalState={this.props.globalState}
                        light={pointLight}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "SpotLight") {
                const pointLight = entity as SpotLight;
                return (
                    <SpotLightPropertyGridComponent
                        globalState={this.props.globalState}
                        light={pointLight}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    />
                );
            }

            if (className === "RectAreaLight") {
                const pointLight = entity as RectAreaLight;
                return (
                    <RectAreaLightPropertyGridComponent
                        globalState={this.props.globalState}
                        light={pointLight}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    />
                );
            }

            if (className.indexOf("TransformNode") !== -1 || className.indexOf("Mesh") !== -1) {
                const transformNode = entity as TransformNode;
                return (
                    <TransformNodePropertyGridComponent
                        transformNode={transformNode}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "MultiMaterial") {
                const material = entity as MultiMaterial;
                return (
                    <MultiMaterialPropertyGridComponent
                        globalState={this.props.globalState}
                        material={material}
                        lockObject={this._lockObject}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "StandardMaterial") {
                const material = entity as StandardMaterial;
                return (
                    <StandardMaterialPropertyGridComponent
                        globalState={this.props.globalState}
                        material={material}
                        lockObject={this._lockObject}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "NodeMaterial") {
                const material = entity as NodeMaterial;
                return (
                    <NodeMaterialPropertyGridComponent
                        globalState={this.props.globalState}
                        material={material}
                        lockObject={this._lockObject}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "PBRMaterial") {
                const material = entity as PBRMaterial;
                return (
                    <PBRMaterialPropertyGridComponent
                        globalState={this.props.globalState}
                        material={material}
                        lockObject={this._lockObject}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            } else if (className === "OpenPBRMaterial") {
                const material = entity as OpenPBRMaterial;
                return (
                    <PBRMaterialPropertyGridComponent
                        globalState={this.props.globalState}
                        material={material}
                        lockObject={this._lockObject}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "PBRMetallicRoughnessMaterial") {
                const material = entity as PBRMetallicRoughnessMaterial;
                return (
                    <PBRMetallicRoughnessMaterialPropertyGridComponent
                        globalState={this.props.globalState}
                        material={material}
                        lockObject={this._lockObject}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "PBRSpecularGlossinessMaterial") {
                const material = entity as PBRSpecularGlossinessMaterial;
                return (
                    <PBRSpecularGlossinessMaterialPropertyGridComponent
                        globalState={this.props.globalState}
                        material={material}
                        lockObject={this._lockObject}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "SkyMaterial") {
                const material = entity as SkyMaterial;
                return (
                    <SkyMaterialPropertyGridComponent
                        globalState={this.props.globalState}
                        material={material}
                        lockObject={this._lockObject}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "BackgroundMaterial") {
                const material = entity as BackgroundMaterial;
                return (
                    <BackgroundMaterialPropertyGridComponent
                        globalState={this.props.globalState}
                        material={material}
                        lockObject={this._lockObject}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "AnimationGroup") {
                const animationGroup = entity as AnimationGroup;
                return (
                    <AnimationGroupGridComponent
                        globalState={this.props.globalState}
                        animationGroup={animationGroup}
                        scene={this.props.scene}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "TargetedAnimation") {
                const targetedAnimation = entity as TargetedAnimation;
                return (
                    <TargetedAnimationGridComponent
                        globalState={this.props.globalState}
                        targetedAnimation={targetedAnimation}
                        scene={this.props.scene}
                        lockObject={this._lockObject}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("Material") !== -1) {
                const material = entity as Material;
                return (
                    <MaterialPropertyGridComponent
                        material={material}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("DefaultRenderingPipeline") !== -1) {
                const renderPipeline = entity as DefaultRenderingPipeline;
                return (
                    <DefaultRenderingPipelinePropertyGridComponent
                        renderPipeline={renderPipeline}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("LensRenderingPipeline") !== -1) {
                const renderPipeline = entity as LensRenderingPipeline;
                return (
                    <LensRenderingPipelinePropertyGridComponent
                        renderPipeline={renderPipeline}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("SSAORenderingPipeline") !== -1) {
                const renderPipeline = entity as SSAORenderingPipeline;
                return (
                    <SSAORenderingPipelinePropertyGridComponent
                        renderPipeline={renderPipeline}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("SSAO2RenderingPipeline") !== -1) {
                const renderPipeline = entity as SSAO2RenderingPipeline;
                return (
                    <SSAO2RenderingPipelinePropertyGridComponent
                        renderPipeline={renderPipeline}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("SSRRenderingPipeline") !== -1) {
                const renderPipeline = entity as SSRRenderingPipeline;
                return (
                    <SSRRenderingPipelinePropertyGridComponent
                        renderPipeline={renderPipeline}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("IBLShadowsRenderPipeline") !== -1) {
                const renderPipeline = entity as IblShadowsRenderPipeline;
                return (
                    <IblShadowsRenderPipelinePropertyGridComponent
                        renderPipeline={renderPipeline}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("RenderingPipeline") !== -1) {
                const renderPipeline = entity as PostProcessRenderPipeline;
                return (
                    <RenderingPipelinePropertyGridComponent
                        renderPipeline={renderPipeline}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("PostProcess") !== -1) {
                const postProcess = entity as PostProcess;
                return (
                    <PostProcessPropertyGridComponent
                        postProcess={postProcess}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("Layer") !== -1) {
                const layer = entity as EffectLayer;
                return (
                    <LayerPropertyGridComponent
                        layer={layer}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("FrameGraph") !== -1) {
                const frameGraph = entity as FrameGraph;
                return (
                    <FrameGraphPropertyGridComponent
                        frameGraph={frameGraph}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("Texture") !== -1) {
                const texture = entity as Texture;
                return (
                    <TexturePropertyGridComponent
                        texture={texture}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("Skeleton") !== -1) {
                const skeleton = entity as Skeleton;
                return (
                    <SkeletonPropertyGridComponent
                        skeleton={skeleton}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className.indexOf("Bone") !== -1) {
                const bone = entity as Bone;
                return (
                    <BonePropertyGridComponent
                        bone={bone}
                        globalState={this.props.globalState}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "TextBlock") {
                const textBlock = entity as TextBlock;
                return <TextBlockPropertyGridComponent textBlock={textBlock} lockObject={this._lockObject} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />;
            }

            if (className === "InputText") {
                const inputText = entity as InputText;
                return <InputTextPropertyGridComponent inputText={inputText} lockObject={this._lockObject} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />;
            }

            if (className === "ColorPicker") {
                const colorPicker = entity as ColorPicker;
                return (
                    <ColorPickerPropertyGridComponent
                        colorPicker={colorPicker}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "Image") {
                const image = entity as Image;
                return <ImagePropertyGridComponent image={image} lockObject={this._lockObject} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />;
            }

            if (className === "Slider") {
                const slider = entity as Slider;
                return <SliderPropertyGridComponent slider={slider} lockObject={this._lockObject} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />;
            }

            if (className === "ImageBasedSlider") {
                const imageBasedSlider = entity as ImageBasedSlider;
                return (
                    <ImageBasedSliderPropertyGridComponent
                        imageBasedSlider={imageBasedSlider}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "Rectangle") {
                const rectangle = entity as Rectangle;
                return <RectanglePropertyGridComponent rectangle={rectangle} lockObject={this._lockObject} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />;
            }

            if (className === "StackPanel") {
                const stackPanel = entity as StackPanel;
                return (
                    <StackPanelPropertyGridComponent stackPanel={stackPanel} lockObject={this._lockObject} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                );
            }

            if (className === "Grid") {
                const grid = entity as Grid;
                return <GridPropertyGridComponent grid={grid} lockObject={this._lockObject} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />;
            }

            if (className === "ScrollViewer") {
                const scrollViewer = entity as ScrollViewer;
                return (
                    <ScrollViewerPropertyGridComponent
                        scrollViewer={scrollViewer}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "Ellipse") {
                const ellipse = entity as Ellipse;
                return <EllipsePropertyGridComponent ellipse={ellipse} lockObject={this._lockObject} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />;
            }

            if (className === "Checkbox") {
                const checkbox = entity as Checkbox;
                return <CheckboxPropertyGridComponent checkbox={checkbox} lockObject={this._lockObject} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />;
            }

            if (className === "RadioButton") {
                const radioButton = entity as RadioButton;
                return (
                    <RadioButtonPropertyGridComponent
                        radioButtons={[radioButton]}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            }

            if (className === "Line") {
                const line = entity as Line;
                return <LinePropertyGridComponent line={line} lockObject={this._lockObject} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />;
            }

            if (entity._host) {
                const control = entity as Control;
                return <ControlPropertyGridComponent control={control} lockObject={this._lockObject} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />;
            }

            return (
                <EmptyPropertyGridComponent
                    item={entity}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    globalState={this.props.globalState}
                />
            );
        }

        return null;
    }

    renderTags() {
        const tags = Object.keys(Tags.GetTags(this.props.selectedEntity, false));

        return tags.map((tag: string, i: number) => {
            return (
                <div className="tag" key={"tag" + i}>
                    {tag}
                </div>
            );
        });
    }

    override render() {
        const entity = this.props.selectedEntity || {};
        const entityHasMetadataProp = Object.prototype.hasOwnProperty.call(entity, "metadata");
        return (
            <FluentToolWrapper toolName="INSPECTOR">
                <div className="pane">
                    {this.renderContent()}
                    {Tags.HasTags(entity) && (
                        <LineContainerComponent title="TAGS" selection={this.props.globalState}>
                            <div className="tagContainer">{this.renderTags()}</div>
                        </LineContainerComponent>
                    )}
                    {entityHasMetadataProp && <MetadataGridComponent globalState={this.props.globalState} entity={entity} />}
                </div>
            </FluentToolWrapper>
        );
    }
}
