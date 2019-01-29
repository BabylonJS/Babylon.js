import * as React from "react";
import { PaneComponent, IPaneComponentProps } from "../paneComponent";

import { ArcRotateCamera } from "babylonjs/Cameras/arcRotateCamera";
import { FreeCamera } from "babylonjs/Cameras/freeCamera";
import { AnimationGroup } from "babylonjs/Animations/animationGroup";
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
import { AnimationGroupGridComponent } from "./propertyGrids/animationGroupPropertyGridComponent";
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

    componentWillMount() {
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

            if (className.indexOf("Mesh") !== -1) {
                const mesh = entity as Mesh;
                if (mesh.getTotalVertices() > 0) {
                    return (<MeshPropertyGridComponent mesh={mesh}
                        lockObject={this._lockObject}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
                }
            }

            if (className.indexOf("FreeCamera") !== -1) {
                const freeCamera = entity as FreeCamera;
                return (<FreeCameraPropertyGridComponent camera={freeCamera}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("ArcRotateCamera") !== -1) {
                const arcRotateCamera = entity as ArcRotateCamera;
                return (<ArcRotateCameraPropertyGridComponent camera={arcRotateCamera}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "HemisphericLight") {
                const hemisphericLight = entity as HemisphericLight;
                return (<HemisphericLightPropertyGridComponent
                    light={hemisphericLight}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "PointLight") {
                const pointLight = entity as PointLight;
                return (<PointLightPropertyGridComponent
                    light={pointLight}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("TransformNode") !== -1 || className.indexOf("Mesh") !== -1) {
                const transformNode = entity as TransformNode;
                return (<TransformNodePropertyGridComponent transformNode={transformNode}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "StandardMaterial") {
                const material = entity as StandardMaterial;
                return (<StandardMaterialPropertyGridComponent
                    material={material}
                    lockObject={this._lockObject}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "PBRMaterial") {
                const material = entity as PBRMaterial;
                return (<PBRMaterialPropertyGridComponent
                    material={material}
                    lockObject={this._lockObject}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "PBRMetallicRoughnessMaterial") {
                const material = entity as PBRMetallicRoughnessMaterial;
                return (<PBRMetallicRoughnessMaterialPropertyGridComponent
                    material={material}
                    lockObject={this._lockObject}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "PBRSpecularGlossinessMaterial") {
                const material = entity as PBRSpecularGlossinessMaterial;
                return (<PBRSpecularGlossinessMaterialPropertyGridComponent
                    material={material}
                    lockObject={this._lockObject}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "BackgroundMaterial") {
                const material = entity as BackgroundMaterial;
                return (<BackgroundMaterialPropertyGridComponent
                    material={material}
                    lockObject={this._lockObject}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "AnimationGroup") {
                const animationGroup = entity as AnimationGroup;
                return (<AnimationGroupGridComponent
                    animationGroup={animationGroup}
                    scene={this.props.scene}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("Material") !== -1) {
                const material = entity as Material;
                return (<MaterialPropertyGridComponent material={material}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className.indexOf("PostProcess") !== -1) {
                const postProcess = entity as PostProcess;
                return (<PostProcessPropertyGridComponent postProcess={postProcess}
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

            if (className === "TextBlock") {
                const textBlock = entity as TextBlock;
                return (<TextBlockPropertyGridComponent textBlock={textBlock}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "InputText") {
                const inputText = entity as InputText;
                return (<InputTextPropertyGridComponent inputText={inputText}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "ColorPicker") {
                const colorPicker = entity as ColorPicker;
                return (<ColorPickerPropertyGridComponent colorPicker={colorPicker}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "Image") {
                const image = entity as Image;
                return (<ImagePropertyGridComponent image={image}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "Slider") {
                const slider = entity as Slider;
                return (<SliderPropertyGridComponent slider={slider}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "ImageBasedSlider") {
                const imageBasedSlider = entity as ImageBasedSlider;
                return (<ImageBasedSliderPropertyGridComponent imageBasedSlider={imageBasedSlider}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "Rectangle") {
                const rectangle = entity as Rectangle;
                return (<RectanglePropertyGridComponent rectangle={rectangle}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "StackPanel") {
                const stackPanel = entity as StackPanel;
                return (<StackPanelPropertyGridComponent stackPanel={stackPanel}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "Grid") {
                const grid = entity as Grid;
                return (<GridPropertyGridComponent grid={grid}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "ScrollViewer") {
                const scrollViewer = entity as ScrollViewer;
                return (<ScrollViewerPropertyGridComponent scrollViewer={scrollViewer}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "Ellipse") {
                const ellipse = entity as Ellipse;
                return (<EllipsePropertyGridComponent ellipse={ellipse}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "Checkbox") {
                const checkbox = entity as Checkbox;
                return (<CheckboxPropertyGridComponent checkbox={checkbox}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "RadioButton") {
                const radioButton = entity as RadioButton;
                return (<RadioButtonPropertyGridComponent radioButton={radioButton}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (className === "Line") {
                const line = entity as Line;
                return (<LinePropertyGridComponent line={line}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }

            if (entity._host) {
                const control = entity as Control;
                return (<ControlPropertyGridComponent control={control}
                    lockObject={this._lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
            }
        } else if (entity.transformNodes) {
            const scene = entity as Scene;
            return (<ScenePropertyGridComponent scene={scene}
                lockObject={this._lockObject}
                onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                onPropertyChangedObservable={this.props.onPropertyChangedObservable} />);
        }

        return null;
    }
}