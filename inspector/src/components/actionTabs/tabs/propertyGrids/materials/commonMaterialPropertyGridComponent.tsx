import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { Material } from "babylonjs/Materials/material";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { Constants } from "babylonjs/Engines/constants";
import { Engine } from "babylonjs/Engines/engine";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CheckBoxLineComponent } from "../../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { SliderLineComponent } from "../../../../../sharedUiComponents/lines/sliderLineComponent";
import { LineContainerComponent } from "../../../../../sharedUiComponents/lines/lineContainerComponent";
import { TextLineComponent } from "../../../../../sharedUiComponents/lines/textLineComponent";
import { OptionsLineComponent, Null_Value } from "../../../../../sharedUiComponents/lines/optionsLineComponent";
import { LockObject } from "../../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { GlobalState } from '../../../../globalState';
import { CustomPropertyGridComponent } from '../customPropertyGridComponent';
import { ButtonLineComponent } from '../../../../../sharedUiComponents/lines/buttonLineComponent';
import { TextInputLineComponent } from '../../../../../sharedUiComponents/lines/textInputLineComponent';
import { AnimationGridComponent } from '../animations/animationPropertyGridComponent';
import { HexLineComponent } from "../../../../../sharedUiComponents/lines/hexLineComponent";
import { FloatLineComponent } from "../../../../../sharedUiComponents/lines/floatLineComponent";

interface ICommonMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: Material;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CommonMaterialPropertyGridComponent extends React.Component<ICommonMaterialPropertyGridComponentProps> {
    constructor(props: ICommonMaterialPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const material = this.props.material;

        material.depthFunction = material.depthFunction ?? 0;

        var orientationOptions = [
            { label: "Clockwise", value: Material.ClockWiseSideOrientation },
            { label: "Counterclockwise", value: Material.CounterClockWiseSideOrientation }
        ];

        var transparencyModeOptions = [
            { label: "<Not Defined>", value: Null_Value },
            { label: "Opaque", value: PBRMaterial.PBRMATERIAL_OPAQUE },
            { label: "Alpha test", value: PBRMaterial.PBRMATERIAL_ALPHATEST },
            { label: "Alpha blend", value: PBRMaterial.PBRMATERIAL_ALPHABLEND },
            { label: "Alpha blend and test", value: PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND },
        ];

        var alphaModeOptions = [
            { label: "Combine", value: Constants.ALPHA_COMBINE },
            { label: "One one", value: Constants.ALPHA_ONEONE },
            { label: "Add", value: Constants.ALPHA_ADD },
            { label: "Subtract", value: Constants.ALPHA_SUBTRACT },
            { label: "Multiply", value: Constants.ALPHA_MULTIPLY },
            { label: "Maximized", value: Constants.ALPHA_MAXIMIZED },
            { label: "Pre-multiplied", value: Constants.ALPHA_PREMULTIPLIED },
        ];

        var depthfunctionOptions = [
            { label: "<Engine Default>", value: 0 },
            { label: "Never", value: Engine.NEVER },
            { label: "Always", value: Engine.ALWAYS },
            { label: "Equal", value: Engine.EQUAL },
            { label: "Less", value: Engine.LESS },
            { label: "Less or equal", value: Engine.LEQUAL },
            { label: "Greater", value: Engine.GREATER },
            { label: "Greater or equal", value: Engine.GEQUAL },
            { label: "Not equal", value: Engine.NOTEQUAL },
        ];

        var stencilFunctionOptions = [
            { label: "Never", value: Constants.NEVER },
            { label: "Always", value: Constants.ALWAYS },
            { label: "Equal", value: Constants.EQUAL },
            { label: "Less", value: Constants.LESS },
            { label: "Less or equal", value: Constants.LEQUAL },
            { label: "Greater", value: Constants.GREATER },
            { label: "Greater or equal", value: Constants.GEQUAL },
            { label: "Not equal", value: Constants.NOTEQUAL },
        ];

        var stencilOperationOptions = [
            { label: "Keep", value: Constants.KEEP },
            { label: "Zero", value: Constants.ZERO },
            { label: "Replace", value: Constants.REPLACE },
            { label: "Incr", value: Constants.INCR },
            { label: "Decr", value: Constants.DECR },
            { label: "Invert", value: Constants.INVERT },
            { label: "Incr wrap", value: Constants.INCR_WRAP },
            { label: "Decr wrap", value: Constants.DECR_WRAP },
        ];

        return (
            <div>
                <CustomPropertyGridComponent globalState={this.props.globalState} target={material}
                    lockObject={this.props.lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextLineComponent label="ID" value={material.id} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Name" target={material} propertyName="name" onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    <TextLineComponent label="Unique ID" value={material.uniqueId.toString()} />
                    <TextLineComponent label="Class" value={material.getClassName()} />
                    <CheckBoxLineComponent label="Backface culling" target={material} propertyName="backFaceCulling" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <OptionsLineComponent label="Orientation" options={orientationOptions} target={material} propertyName="sideOrientation" onPropertyChangedObservable={this.props.onPropertyChangedObservable} onSelect={(value) => this.setState({ mode: value })} />
                    <CheckBoxLineComponent label="Disable lighting" target={material} propertyName="disableLighting" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Disable color write" target={material} propertyName="disableColorWrite" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Disable depth write" target={material} propertyName="disableDepthWrite" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <OptionsLineComponent label="Depth function" options={depthfunctionOptions} target={material} propertyName="depthFunction" onPropertyChangedObservable={this.props.onPropertyChangedObservable} onSelect={(value) => this.setState({ depthFunction: value })} />
                    <CheckBoxLineComponent label="Need depth pre-pass" target={material} propertyName="needDepthPrePass" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Wireframe" target={material} propertyName="wireframe" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Point cloud" target={material} propertyName="pointsCloud" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Point size" target={material} propertyName="pointSize" minimum={0} maximum={100} step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Z-offset" target={material} propertyName="zOffset" minimum={-10} maximum={10} step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <ButtonLineComponent label="Dispose" onClick={() => {
                        material.dispose();
                        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                    }} />
                </LineContainerComponent>
                <LineContainerComponent title="TRANSPARENCY" selection={this.props.globalState}>
                    <SliderLineComponent label="Alpha" target={material} propertyName="alpha" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        (material as any).transparencyMode !== undefined &&
                        <OptionsLineComponent allowNullValue={true} label="Transparency mode" options={transparencyModeOptions} target={material} propertyName="transparencyMode" onPropertyChangedObservable={this.props.onPropertyChangedObservable} onSelect={(value) => this.setState({ transparencyMode: value })} />
                    }
                    <OptionsLineComponent label="Alpha mode" options={alphaModeOptions} target={material} propertyName="alphaMode" onPropertyChangedObservable={this.props.onPropertyChangedObservable} onSelect={(value) => this.setState({ alphaMode: value })} />
                    {
                        (material as any).diffuseTexture &&
                        <CheckBoxLineComponent label="Diffuse texture has alpha" target={(material as any).diffuseTexture} propertyName="hasAlpha" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        (material as any).useAlphaFromDiffuseTexture !== undefined &&
                        <CheckBoxLineComponent label="Use alpha from diffuse texture" target={material} propertyName="useAlphaFromDiffuseTexture" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        (material as any).albedoTexture &&
                        <CheckBoxLineComponent label="Albedo texture has alpha" target={(material as any).albedoTexture} propertyName="hasAlpha" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        (material as any).useAlphaFromAlbedoTexture !== undefined &&
                        <CheckBoxLineComponent label="Use alpha from albedo texture" target={material} propertyName="useAlphaFromAlbedoTexture" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    <CheckBoxLineComponent label="Separate culling pass" target={material} propertyName="separateCullingPass" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                { material.stencil && <>
                    <LineContainerComponent title="STENCIL" selection={this.props.globalState}>
                        <CheckBoxLineComponent label="Enabled" target={material.stencil} propertyName="enabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <HexLineComponent isInteger lockObject={this.props.lockObject} label="Mask" target={material.stencil} propertyName="mask" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <OptionsLineComponent label="Function" options={stencilFunctionOptions} target={material.stencil} propertyName="func" onPropertyChangedObservable={this.props.onPropertyChangedObservable} onSelect={(value) => this.setState({ stencilFunction: value })} />
                        <FloatLineComponent isInteger lockObject={this.props.lockObject} label="Function reference" target={material.stencil} propertyName="funcRef" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <HexLineComponent isInteger lockObject={this.props.lockObject} label="Function mask" target={material.stencil} propertyName="funcMask" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <OptionsLineComponent label="Op stencil fail" options={stencilOperationOptions} target={material.stencil} propertyName="opStencilFail" onPropertyChangedObservable={this.props.onPropertyChangedObservable} onSelect={(value) => this.setState({ opStencilFail: value })} />
                        <OptionsLineComponent label="Op depth fail" options={stencilOperationOptions} target={material.stencil} propertyName="opDepthFail" onPropertyChangedObservable={this.props.onPropertyChangedObservable} onSelect={(value) => this.setState({ opDepthFail: value })} />
                        <OptionsLineComponent label="Op stencil+depth pass" options={stencilOperationOptions} target={material.stencil} propertyName="opStencilDepthPass" onPropertyChangedObservable={this.props.onPropertyChangedObservable} onSelect={(value) => this.setState({ opStencilDepthPass: value })} />
                    </LineContainerComponent>
                </> }
                <AnimationGridComponent globalState={this.props.globalState} animatable={material} scene={material.getScene()} lockObject={this.props.lockObject} />
            </div>
        );
    }
}