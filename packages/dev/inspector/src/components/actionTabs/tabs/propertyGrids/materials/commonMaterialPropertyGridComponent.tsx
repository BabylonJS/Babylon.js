import * as React from "react";

import type { Observable } from "core/Misc/observable";
import { Material } from "core/Materials/material";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { Constants } from "core/Engines/constants";
import { Engine } from "core/Engines/engine";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { OptionsLine, Null_Value } from "shared-ui-components/lines/optionsLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import { CustomPropertyGridComponent } from "../customPropertyGridComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { AnimationGridComponent } from "../animations/animationPropertyGridComponent";
import { HexLineComponent } from "shared-ui-components/lines/hexLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { alphaModeOptions } from "shared-ui-components/constToOptionsMaps";

interface ICommonMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: Material;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

const orientationOptions = [
    { label: "<None>", value: Number.MAX_SAFE_INTEGER },
    { label: "Clockwise", value: Material.ClockWiseSideOrientation },
    { label: "Counterclockwise", value: Material.CounterClockWiseSideOrientation },
];

const transparencyModeOptions = [
    { label: "<Not Defined>", value: Null_Value },
    { label: "Opaque", value: PBRMaterial.PBRMATERIAL_OPAQUE },
    { label: "Alpha test", value: PBRMaterial.PBRMATERIAL_ALPHATEST },
    { label: "Alpha blend", value: PBRMaterial.PBRMATERIAL_ALPHABLEND },
    { label: "Alpha blend and test", value: PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND },
];

const depthfunctionOptions = [
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

const stencilFunctionOptions = [
    { label: "Never", value: Constants.NEVER },
    { label: "Always", value: Constants.ALWAYS },
    { label: "Equal", value: Constants.EQUAL },
    { label: "Less", value: Constants.LESS },
    { label: "Less or equal", value: Constants.LEQUAL },
    { label: "Greater", value: Constants.GREATER },
    { label: "Greater or equal", value: Constants.GEQUAL },
    { label: "Not equal", value: Constants.NOTEQUAL },
];

const stencilOperationOptions = [
    { label: "Keep", value: Constants.KEEP },
    { label: "Zero", value: Constants.ZERO },
    { label: "Replace", value: Constants.REPLACE },
    { label: "Incr", value: Constants.INCR },
    { label: "Decr", value: Constants.DECR },
    { label: "Invert", value: Constants.INVERT },
    { label: "Incr wrap", value: Constants.INCR_WRAP },
    { label: "Decr wrap", value: Constants.DECR_WRAP },
];

export class CommonMaterialPropertyGridComponent extends React.Component<ICommonMaterialPropertyGridComponentProps> {
    constructor(props: ICommonMaterialPropertyGridComponentProps) {
        super(props);
    }

    override render() {
        const material = this.props.material;

        material.depthFunction = material.depthFunction ?? 0;

        return (
            <div>
                <CustomPropertyGridComponent
                    globalState={this.props.globalState}
                    target={material}
                    lockObject={this.props.lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextLineComponent label="ID" value={material.id} onCopy />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Name"
                        target={material}
                        propertyName="name"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextLineComponent label="Unique ID" value={material.uniqueId.toString()} />
                    <TextLineComponent label="Class" value={material.getClassName()} />
                    <CheckBoxLineComponent
                        label="Backface culling"
                        target={material}
                        propertyName="backFaceCulling"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <OptionsLine
                        label="Orientation"
                        options={orientationOptions}
                        target={material}
                        propertyName="sideOrientation"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        allowNullValue={true}
                        onSelect={(value) => this.setState({ mode: value })}
                    />
                    <CheckBoxLineComponent
                        label="Disable lighting"
                        target={material}
                        propertyName="disableLighting"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent
                        label="Disable color write"
                        target={material}
                        propertyName="disableColorWrite"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent
                        label="Disable depth write"
                        target={material}
                        propertyName="disableDepthWrite"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <OptionsLine
                        label="Depth function"
                        options={depthfunctionOptions}
                        target={material}
                        propertyName="depthFunction"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onSelect={(value) => this.setState({ depthFunction: value })}
                    />
                    <CheckBoxLineComponent
                        label="Need depth pre-pass"
                        target={material}
                        propertyName="needDepthPrePass"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent label="Wireframe" target={material} propertyName="wireframe" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Point cloud" target={material} propertyName="pointsCloud" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Point size"
                        target={material}
                        propertyName="pointSize"
                        minimum={0}
                        maximum={100}
                        step={0.1}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Z-offset Factor"
                        target={material}
                        propertyName="zOffset"
                        minimum={-10}
                        maximum={10}
                        step={0.1}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Z-offset Units"
                        target={material}
                        propertyName="zOffsetUnits"
                        minimum={-10}
                        maximum={10}
                        step={0.1}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <ButtonLineComponent
                        label="Dispose"
                        onClick={() => {
                            material.dispose();
                            this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                        }}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="TRANSPARENCY" selection={this.props.globalState}>
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Alpha"
                        target={material}
                        propertyName="alpha"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {(material as any).transparencyMode !== undefined && (
                        <OptionsLine
                            allowNullValue={true}
                            label="Transparency mode"
                            options={transparencyModeOptions}
                            target={material}
                            propertyName="transparencyMode"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            onSelect={(value) => this.setState({ transparencyMode: value })}
                        />
                    )}
                    <OptionsLine
                        label="Alpha mode"
                        options={alphaModeOptions}
                        target={material}
                        propertyName="alphaMode"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onSelect={(value) => this.setState({ alphaMode: value })}
                    />
                    {(material as any).diffuseTexture && (
                        <CheckBoxLineComponent
                            label="Diffuse texture has alpha"
                            target={(material as any).diffuseTexture}
                            propertyName="hasAlpha"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {(material as any).useAlphaFromDiffuseTexture !== undefined && (
                        <CheckBoxLineComponent
                            label="Use alpha from diffuse texture"
                            target={material}
                            propertyName="useAlphaFromDiffuseTexture"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {(material as any).albedoTexture && (
                        <CheckBoxLineComponent
                            label="Albedo texture has alpha"
                            target={(material as any).albedoTexture}
                            propertyName="hasAlpha"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {(material as any).useAlphaFromAlbedoTexture !== undefined && (
                        <CheckBoxLineComponent
                            label="Use alpha from albedo texture"
                            target={material}
                            propertyName="useAlphaFromAlbedoTexture"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    <CheckBoxLineComponent
                        label="Separate culling pass"
                        target={material}
                        propertyName="separateCullingPass"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                {material.stencil && (
                    <>
                        <LineContainerComponent title="STENCIL" selection={this.props.globalState}>
                            <CheckBoxLineComponent
                                label="Enabled"
                                target={material.stencil}
                                propertyName="enabled"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <HexLineComponent
                                isInteger
                                lockObject={this.props.lockObject}
                                label="Mask"
                                target={material.stencil}
                                propertyName="mask"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <OptionsLine
                                label="Function"
                                options={stencilFunctionOptions}
                                target={material.stencil}
                                propertyName="func"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                onSelect={(value) => this.setState({ stencilFunction: value })}
                            />
                            <FloatLineComponent
                                isInteger
                                lockObject={this.props.lockObject}
                                label="Function reference"
                                target={material.stencil}
                                propertyName="funcRef"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <HexLineComponent
                                isInteger
                                lockObject={this.props.lockObject}
                                label="Function mask"
                                target={material.stencil}
                                propertyName="funcMask"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <OptionsLine
                                label="Op stencil fail"
                                options={stencilOperationOptions}
                                target={material.stencil}
                                propertyName="opStencilFail"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                onSelect={(value) => this.setState({ opStencilFail: value })}
                            />
                            <OptionsLine
                                label="Op depth fail"
                                options={stencilOperationOptions}
                                target={material.stencil}
                                propertyName="opDepthFail"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                onSelect={(value) => this.setState({ opDepthFail: value })}
                            />
                            <OptionsLine
                                label="Op stencil+depth pass"
                                options={stencilOperationOptions}
                                target={material.stencil}
                                propertyName="opStencilDepthPass"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                onSelect={(value) => this.setState({ opStencilDepthPass: value })}
                            />
                        </LineContainerComponent>
                    </>
                )}
                <AnimationGridComponent globalState={this.props.globalState} animatable={material} scene={material.getScene()} lockObject={this.props.lockObject} />
            </div>
        );
    }
}
