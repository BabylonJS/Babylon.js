import * as React from "react";
import { PaneComponent, IPaneComponentProps } from "../paneComponent";

import { ArcRotateCamera } from "babylonjs/Cameras/arcRotateCamera";
import { FreeCamera } from "babylonjs/Cameras/freeCamera";
import { AnimationGroup, TargetedAnimation } from "babylonjs/Animations/animationGroup";
import { Material } from "babylonjs/Materials/material";
import { BackgroundMaterial } from "babylonjs/Materials/Background/backgroundMaterial";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { PBRMetallicRoughnessMaterial } from "babylonjs/Materials/PBR/pbrMetallicRoughnessMaterial";
import { PBRSpecularGlossinessMaterial } from "babylonjs/Materials/PBR/pbrSpecularGlossinessMaterial";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Mesh } from "babylonjs/Meshes/mesh";
import { HemisphericLight } from "babylonjs/Lights/hemisphericLight";
import { PointLight } from "babylonjs/Lights/pointLight";
import { Scene } from "babylonjs/scene";

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

import { ColorPicker } from "babylonjs-gui/2D/controls/colorpicker";
import { Image } from "babylonjs-gui/2D/controls/image";
import { Slider } from "babylonjs-gui/2D/controls/sliders/slider";
import { ImageBasedSlider } from "babylonjs-gui/2D/controls/sliders/imageBasedSlider";
import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
import { Ellipse } from "babylonjs-gui/2D/controls/ellipse";
import { Checkbox } from "babylonjs-gui/2D/controls/checkbox";
import { RadioButton } from "babylonjs-gui/2D/controls/radioButton";
import { Line } from "babylonjs-gui/2D/controls/line";
import { ScrollViewer } from "babylonjs-gui/2D/controls/scrollViewers/scrollViewer";
import { Grid } from "babylonjs-gui/2D/controls/grid";
import { StackPanel } from "babylonjs-gui/2D/controls/stackPanel";

import { ColorPickerPropertyGridComponent } from "./propertyGrids/gui/colorPickerPropertyGridComponent";
import { AnimationGroupGridComponent } from "./propertyGrids/animations/animationGroupPropertyGridComponent";
import { LockObject } from "./propertyGrids/lockObject";
import { ImagePropertyGridComponent } from "./propertyGrids/gui/imagePropertyGridComponent";
import { SliderPropertyGridComponent } from "./propertyGrids/gui/sliderPropertyGridComponent";
import { ImageBasedSliderPropertyGridComponent } from "./propertyGrids/gui/imageBasedSliderPropertyGridComponent";
import { RectanglePropertyGridComponent } from "./propertyGrids/gui/rectanglePropertyGridComponent";
import { EllipsePropertyGridComponent } from "./propertyGrids/gui/ellipsePropertyGridComponent";
import { CheckboxPropertyGridComponent } from "./propertyGrids/gui/checkboxPropertyGridComponent";
import { RadioButtonPropertyGridComponent } from "./propertyGrids/gui/radioButtonPropertyGridComponent";
import { LinePropertyGridComponent } from "./propertyGrids/gui/linePropertyGridComponent";
import { ScrollViewerPropertyGridComponent } from "./propertyGrids/gui/scrollViewerPropertyGridComponent";
import { GridPropertyGridComponent } from "./propertyGrids/gui/gridPropertyGridComponent";
import { PBRMetallicRoughnessMaterialPropertyGridComponent } from "./propertyGrids/materials/pbrMetallicRoughnessMaterialPropertyGridComponent";
import { PBRSpecularGlossinessMaterialPropertyGridComponent } from "./propertyGrids/materials/pbrSpecularGlossinessMaterialPropertyGridComponent";
import { StackPanelPropertyGridComponent } from "./propertyGrids/gui/stackPanelPropertyGridComponent";
import { PostProcess } from 'babylonjs/PostProcesses/postProcess';
import { PostProcessPropertyGridComponent } from './propertyGrids/postProcesses/postProcessPropertyGridComponent';
import { RenderingPipelinePropertyGridComponent } from './propertyGrids/postProcesses/renderingPipelinePropertyGridComponent';
import { PostProcessRenderPipeline } from 'babylonjs/PostProcesses/RenderPipeline/postProcessRenderPipeline';
import { DefaultRenderingPipelinePropertyGridComponent } from './propertyGrids/postProcesses/defaultRenderingPipelinePropertyGridComponent';
import { DefaultRenderingPipeline } from 'babylonjs/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { SSAORenderingPipeline } from 'babylonjs/PostProcesses/RenderPipeline/Pipelines/ssaoRenderingPipeline';
import { SSAORenderingPipelinePropertyGridComponent } from './propertyGrids/postProcesses/ssaoRenderingPipelinePropertyGridComponent';
import { SSAO2RenderingPipeline } from 'babylonjs/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline';
import { SSAO2RenderingPipelinePropertyGridComponent } from './propertyGrids/postProcesses/ssao2RenderingPipelinePropertyGridComponent';
import { Skeleton } from 'babylonjs/Bones/skeleton';
import { SkeletonPropertyGridComponent } from './propertyGrids/meshes/skeletonPropertyGridComponent';
import { Bone } from 'babylonjs/Bones/bone';
import { BonePropertyGridComponent } from './propertyGrids/meshes/bonePropertyGridComponent';
import { DirectionalLightPropertyGridComponent } from './propertyGrids/lights/directionalLightPropertyGridComponent';
import { DirectionalLight } from 'babylonjs/Lights/directionalLight';
import { SpotLight } from 'babylonjs/Lights/spotLight';
import { SpotLightPropertyGridComponent } from './propertyGrids/lights/spotLightPropertyGridComponent';
import { LensRenderingPipeline } from 'babylonjs/PostProcesses/RenderPipeline/Pipelines/lensRenderingPipeline';
import { LensRenderingPipelinePropertyGridComponent } from './propertyGrids/postProcesses/lensRenderingPipelinePropertyGridComponent';
import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
import { NodeMaterialPropertyGridComponent } from './propertyGrids/materials/nodeMaterialPropertyGridComponent';
import { MultiMaterial } from 'babylonjs/Materials/multiMaterial';
import { MultiMaterialPropertyGridComponent } from './propertyGrids/materials/multiMaterialPropertyGridComponent';
import { ParticleSystemPropertyGridComponent } from './propertyGrids/particleSystems/particleSystemPropertyGridComponent';
import { IParticleSystem } from 'babylonjs/Particles/IParticleSystem';
import { SpriteManagerPropertyGridComponent } from './propertyGrids/sprites/spriteManagerPropertyGridComponent';
import { SpriteManager } from 'babylonjs/Sprites/spriteManager';
import { SpritePropertyGridComponent } from './propertyGrids/sprites/spritePropertyGridComponent';
import { Sprite } from 'babylonjs/Sprites/sprite';
import { TargetedAnimationGridComponent } from './propertyGrids/animations/targetedAnimationPropertyGridComponent';
import { FollowCamera } from 'babylonjs/Cameras/followCamera';
import { FollowCameraPropertyGridComponent } from './propertyGrids/cameras/followCameraPropertyGridComponent';

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

    componentDidMount() {
        this._timerIntervalId = window.setInterval(() => this.timerRefresh(), 500);
    }

    componentWillUnmount() {
        window.clearInterval(this._timerIntervalId);
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

            if (className === "Scene") {
                const scene = entity as Scene;
                return (<ScenePropertyGridComponent scene={scene}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "Sprite") {
                const sprite = entity as Sprite;
                return (<SpritePropertyGridComponent sprite={sprite}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "SpriteManager") {
                const spriteManager = entity as SpriteManager;
                return (<SpriteManagerPropertyGridComponent spriteManager={spriteManager}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}                    
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("Mesh") !== -1) {
                const mesh = entity as Mesh;
                if (mesh.getTotalVertices() > 0) {
                    return (
                        <div>
                            <MeshPropertyGridComponent globalState={this.props.globalState} mesh={mesh}
                                lockObject={this._lockObject}
                                onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        </div>
                    );
                }
            }

            if (className.indexOf("ParticleSystem") !== -1) {
                const particleSystem = entity as IParticleSystem;
                return (<ParticleSystemPropertyGridComponent globalState={this.props.globalState} system={particleSystem}
                    lockObject={this._lockObject}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("FreeCamera") !== -1 || className.indexOf("UniversalCamera") !== -1
            || className.indexOf("WebXRCamera") !== -1  || className.indexOf("DeviceOrientationCamera") !== -1) {
                const freeCamera = entity as FreeCamera;
                return (<FreeCameraPropertyGridComponent globalState={this.props.globalState} camera={freeCamera}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("ArcRotateCamera") !== -1) {
                const arcRotateCamera = entity as ArcRotateCamera;
                return (<ArcRotateCameraPropertyGridComponent globalState={this.props.globalState} camera={arcRotateCamera}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("FollowCamera") !== -1) {
                const followCamera = entity as FollowCamera;
                return (<FollowCameraPropertyGridComponent globalState={this.props.globalState} camera={followCamera}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "HemisphericLight") {
                const hemisphericLight = entity as HemisphericLight;
                return (<HemisphericLightPropertyGridComponent
                    globalState={this.props.globalState}
                    light={hemisphericLight}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "PointLight") {
                const pointLight = entity as PointLight;
                return (<PointLightPropertyGridComponent
                    globalState={this.props.globalState}
                    light={pointLight}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "DirectionalLight") {
                const pointLight = entity as DirectionalLight;
                return (<DirectionalLightPropertyGridComponent
                    globalState={this.props.globalState}
                    light={pointLight}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "SpotLight") {
                const pointLight = entity as SpotLight;
                return (<SpotLightPropertyGridComponent
                    globalState={this.props.globalState}
                    light={pointLight}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("TransformNode") !== -1 || className.indexOf("Mesh") !== -1) {
                const transformNode = entity as TransformNode;
                return (<TransformNodePropertyGridComponent transformNode={transformNode}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "MultiMaterial") {
                const material = entity as MultiMaterial;
                return (<MultiMaterialPropertyGridComponent
                    globalState={this.props.globalState}
                    material={material}
                    lockObject={this._lockObject}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "StandardMaterial") {
                const material = entity as StandardMaterial;
                return (<StandardMaterialPropertyGridComponent
                    globalState={this.props.globalState}
                    material={material}
                    lockObject={this._lockObject}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "NodeMaterial") {
                const material = entity as NodeMaterial;
                return (<NodeMaterialPropertyGridComponent
                    globalState={this.props.globalState}
                    material={material}
                    lockObject={this._lockObject}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "PBRMaterial") {
                const material = entity as PBRMaterial;
                return (<PBRMaterialPropertyGridComponent
                    globalState={this.props.globalState}
                    material={material}
                    lockObject={this._lockObject}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "PBRMetallicRoughnessMaterial") {
                const material = entity as PBRMetallicRoughnessMaterial;
                return (<PBRMetallicRoughnessMaterialPropertyGridComponent
                    globalState={this.props.globalState}
                    material={material}
                    lockObject={this._lockObject}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "PBRSpecularGlossinessMaterial") {
                const material = entity as PBRSpecularGlossinessMaterial;
                return (<PBRSpecularGlossinessMaterialPropertyGridComponent
                    globalState={this.props.globalState}
                    material={material}
                    lockObject={this._lockObject}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "BackgroundMaterial") {
                const material = entity as BackgroundMaterial;
                return (<BackgroundMaterialPropertyGridComponent
                    globalState={this.props.globalState}
                    material={material}
                    lockObject={this._lockObject}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "AnimationGroup") {
                const animationGroup = entity as AnimationGroup;
                return (<AnimationGroupGridComponent
                    globalState={this.props.globalState}
                    animationGroup={animationGroup}
                    scene={this.props.scene}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "TargetedAnimation") {
                const targetedAnimation = entity as TargetedAnimation;
                return (<TargetedAnimationGridComponent
                    globalState={this.props.globalState}
                    targetedAnimation={targetedAnimation}
                    scene={this.props.scene}
                    lockObject={this._lockObject}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }            

            if (className.indexOf("Material") !== -1) {
                const material = entity as Material;
                return (<MaterialPropertyGridComponent material={material}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("DefaultRenderingPipeline") !== -1) {
                const renderPipeline = entity as DefaultRenderingPipeline;
                return (<DefaultRenderingPipelinePropertyGridComponent renderPipeline={renderPipeline}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("LensRenderingPipeline") !== -1) {
                const renderPipeline = entity as LensRenderingPipeline;
                return (<LensRenderingPipelinePropertyGridComponent renderPipeline={renderPipeline}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("SSAORenderingPipeline") !== -1) {
                const renderPipeline = entity as SSAORenderingPipeline;
                return (<SSAORenderingPipelinePropertyGridComponent renderPipeline={renderPipeline}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("SSAO2RenderingPipeline") !== -1) {
                const renderPipeline = entity as SSAO2RenderingPipeline;
                return (<SSAO2RenderingPipelinePropertyGridComponent renderPipeline={renderPipeline}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("RenderingPipeline") !== -1) {
                const renderPipeline = entity as PostProcessRenderPipeline;
                return (<RenderingPipelinePropertyGridComponent renderPipeline={renderPipeline}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("PostProcess") !== -1) {
                const postProcess = entity as PostProcess;
                return (<PostProcessPropertyGridComponent postProcess={postProcess}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("Texture") !== -1) {
                const texture = entity as Texture;
                return (<TexturePropertyGridComponent texture={texture}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("Skeleton") !== -1) {
                const skeleton = entity as Skeleton;
                return (<SkeletonPropertyGridComponent skeleton={skeleton}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("Bone") !== -1) {
                const bone = entity as Bone;
                return (<BonePropertyGridComponent bone={bone}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "TextBlock") {
                const textBlock = entity as TextBlock;
                return (<TextBlockPropertyGridComponent textBlock={textBlock}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "InputText") {
                const inputText = entity as InputText;
                return (<InputTextPropertyGridComponent inputText={inputText}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "ColorPicker") {
                const colorPicker = entity as ColorPicker;
                return (<ColorPickerPropertyGridComponent colorPicker={colorPicker}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "Image") {
                const image = entity as Image;
                return (<ImagePropertyGridComponent image={image}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "Slider") {
                const slider = entity as Slider;
                return (<SliderPropertyGridComponent slider={slider}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "ImageBasedSlider") {
                const imageBasedSlider = entity as ImageBasedSlider;
                return (<ImageBasedSliderPropertyGridComponent imageBasedSlider={imageBasedSlider}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "Rectangle") {
                const rectangle = entity as Rectangle;
                return (<RectanglePropertyGridComponent rectangle={rectangle}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "StackPanel") {
                const stackPanel = entity as StackPanel;
                return (<StackPanelPropertyGridComponent stackPanel={stackPanel}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "Grid") {
                const grid = entity as Grid;
                return (<GridPropertyGridComponent grid={grid}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "ScrollViewer") {
                const scrollViewer = entity as ScrollViewer;
                return (<ScrollViewerPropertyGridComponent scrollViewer={scrollViewer}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "Ellipse") {
                const ellipse = entity as Ellipse;
                return (<EllipsePropertyGridComponent ellipse={ellipse}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "Checkbox") {
                const checkbox = entity as Checkbox;
                return (<CheckboxPropertyGridComponent checkbox={checkbox}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "RadioButton") {
                const radioButton = entity as RadioButton;
                return (<RadioButtonPropertyGridComponent radioButton={radioButton}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "Line") {
                const line = entity as Line;
                return (<LinePropertyGridComponent line={line}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (entity._host) {
                const control = entity as Control;
                return (<ControlPropertyGridComponent control={control}
                    globalState={this.props.globalState}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }
        }

        return null;
    }
}