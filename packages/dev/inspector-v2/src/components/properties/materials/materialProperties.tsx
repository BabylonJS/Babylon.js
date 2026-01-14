import type { FunctionComponent } from "react";

import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";

import { Constants } from "core/Engines/constants";
import { Engine } from "core/Engines/engine";
import { Material } from "core/Materials/material";
import { AlphaModeOptions } from "shared-ui-components/constToOptionsMaps";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";
import { HexPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/hexPropertyLine";

const OrientationOptions = [
    { label: "Clockwise", value: Material.ClockWiseSideOrientation },
    { label: "Counterclockwise", value: Material.CounterClockWiseSideOrientation },
] as const satisfies DropdownOption<number>[];

const TransparencyModeOptions = [
    { label: "Opaque", value: Material.MATERIAL_OPAQUE },
    { label: "Alpha test", value: Material.MATERIAL_ALPHATEST },
    { label: "Alpha blend", value: Material.MATERIAL_ALPHABLEND },
    { label: "Alpha blend and test", value: Material.MATERIAL_ALPHATESTANDBLEND },
] as const satisfies DropdownOption<number>[];

const DepthFunctionOptions = [
    { label: "<Engine Default>", value: 0 },
    { label: "Never", value: Engine.NEVER },
    { label: "Always", value: Engine.ALWAYS },
    { label: "Equal", value: Engine.EQUAL },
    { label: "Less", value: Engine.LESS },
    { label: "Less or equal", value: Engine.LEQUAL },
    { label: "Greater", value: Engine.GREATER },
    { label: "Greater or equal", value: Engine.GEQUAL },
    { label: "Not equal", value: Engine.NOTEQUAL },
] as const satisfies DropdownOption<number>[];

const StencilFunctionOptions = [
    { label: "Never", value: Constants.NEVER },
    { label: "Always", value: Constants.ALWAYS },
    { label: "Equal", value: Constants.EQUAL },
    { label: "Less", value: Constants.LESS },
    { label: "Less or equal", value: Constants.LEQUAL },
    { label: "Greater", value: Constants.GREATER },
    { label: "Greater or equal", value: Constants.GEQUAL },
    { label: "Not equal", value: Constants.NOTEQUAL },
] as const satisfies DropdownOption<number>[];

const StencilOperationOptions = [
    { label: "Keep", value: Constants.KEEP },
    { label: "Zero", value: Constants.ZERO },
    { label: "Replace", value: Constants.REPLACE },
    { label: "Incr", value: Constants.INCR },
    { label: "Decr", value: Constants.DECR },
    { label: "Invert", value: Constants.INVERT },
    { label: "Incr wrap", value: Constants.INCR_WRAP },
    { label: "Decr wrap", value: Constants.DECR_WRAP },
] as const satisfies DropdownOption<number>[];

export const MaterialGeneralProperties: FunctionComponent<{ material: Material }> = (props) => {
    const { material } = props;

    const pointsCloud = useProperty(material, "pointsCloud");
    const faceCulling = useProperty(material, "backFaceCulling");
    const isWebGPU = material.getScene().getEngine().isWebGPU;

    return (
        <>
            <BoundProperty
                component={SwitchPropertyLine}
                label="Face Culling"
                description="Enabling this will enable culling, default is to cull backfaces. To enable front face culling instead, you can disable 'cullBackfaces' using the below option"
                docLink="https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction#back-face-culling"
                target={material}
                propertyKey="backFaceCulling"
            />
            <Collapse visible={faceCulling}>
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Cull Back Faces"
                    description="Culls back faces. If false, front faces are culled."
                    target={material}
                    propertyKey="cullBackFaces"
                />
            </Collapse>
            <BoundProperty
                component={NumberDropdownPropertyLine}
                label="Orientation"
                description="The front face side. Overrides mesh's orientation."
                options={OrientationOptions}
                target={material}
                propertyKey="sideOrientation"
                nullable
                defaultValue={material.getScene().useRightHandedSystem ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation}
            />
            <BoundProperty component={SwitchPropertyLine} label="Disable Color Write" target={material} propertyKey="disableColorWrite" />
            <BoundProperty component={SwitchPropertyLine} label="Disable Depth Write" target={material} propertyKey="disableDepthWrite" />
            <BoundProperty component={SwitchPropertyLine} label="Force Depth Write" target={material} propertyKey="forceDepthWrite" />
            <BoundProperty component={NumberDropdownPropertyLine} label="Depth Function" options={DepthFunctionOptions} target={material} propertyKey="depthFunction" />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Need Depth Pre-pass"
                docLink="https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering/#depth-pre-pass-meshes"
                target={material}
                propertyKey="needDepthPrePass"
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Z-offset Factor" target={material} propertyKey="zOffset" min={-10} max={10} step={0.1} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Z-offset Units" target={material} propertyKey="zOffsetUnits" min={-10} max={10} step={0.1} />
            <BoundProperty component={SwitchPropertyLine} label="Wireframe" target={material} propertyKey="wireframe" />
            <BoundProperty component={SwitchPropertyLine} label="Point Cloud" target={material} propertyKey="pointsCloud" />
            {pointsCloud && <BoundProperty component={SyncedSliderPropertyLine} label="Point Size" target={material} propertyKey="pointSize" min={0} max={100} step={0.1} />}
            {isWebGPU && <BoundProperty component={SwitchPropertyLine} label="Use Vertex Pulling" target={material} propertyKey="useVertexPulling" />}
            <BoundProperty
                component={SwitchPropertyLine}
                label="Support Fog"
                target={material}
                propertyKey="fogEnabled"
                description="Indicates whether the material supports fog (however, fog must be enabled at the scene level to be effective)."
            />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Use Logarithmic Depth"
                target={material}
                propertyKey="useLogarithmicDepth"
                docLink="https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/logarithmicDepthBuffer"
            />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Set Vertex Output Invariant"
                target={material}
                propertyKey="isVertexOutputInvariant"
                description="Setting this property to true will force the shader compiler to disable some optimization to make sure the vertex output is always calculated the same way across different compilation units."
            />
        </>
    );
};

export const MaterialTransparencyProperties: FunctionComponent<{ material: Material }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="Alpha" target={material} propertyKey="alpha" min={0} max={1} step={0.01} />
            <BoundProperty
                component={NumberDropdownPropertyLine}
                label="Transparency Mode"
                docLink="https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering/#the-transparencymode-property"
                target={material}
                propertyKey="transparencyMode"
                options={TransparencyModeOptions}
                nullable
                defaultValue={Material.MATERIAL_OPAQUE}
            />
            <BoundProperty
                component={NumberDropdownPropertyLine}
                label="Alpha Mode"
                docLink="https://doc.babylonjs.com/features/featuresDeepDive/materials/using/blendModes/#available-blend-modes"
                target={material}
                propertyKey="alphaMode"
                options={AlphaModeOptions}
            />
            <BoundProperty component={SwitchPropertyLine} label="Separate Culling Pass" target={material} propertyKey="separateCullingPass" />
        </>
    );
};

export const MaterialStencilProperties: FunctionComponent<{ material: Material }> = (props) => {
    const { material } = props;
    const stencilEnabled = useProperty(material.stencil, "enabled");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Enabled" target={material.stencil} propertyKey="enabled" propertyPath="stencil.enabled" />
            <Collapse visible={stencilEnabled}>
                <>
                    <BoundProperty component={HexPropertyLine} label="Write Mask" target={material.stencil} propertyKey="mask" propertyPath="stencil.mask" numBits={8} />
                    <BoundProperty component={HexPropertyLine} label="Read Mask" target={material.stencil} propertyKey="funcMask" propertyPath="stencil.funcMask" numBits={8} />
                    <BoundProperty
                        component={NumberInputPropertyLine}
                        label="Reference Value"
                        target={material.stencil}
                        propertyKey="funcRef"
                        propertyPath="stencil.funcRef"
                        step={1}
                        forceInt={true}
                        min={0}
                        max={255}
                    />
                    <PropertyLine
                        label="Front"
                        expandByDefault={true}
                        expandedContent={
                            <>
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Function"
                                    target={material.stencil}
                                    propertyKey="func"
                                    propertyPath="stencil.func"
                                    options={StencilFunctionOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Stencil Fail Operation"
                                    target={material.stencil}
                                    propertyKey="opStencilFail"
                                    propertyPath="stencil.opStencilFail"
                                    options={StencilOperationOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Depth Fail Operation"
                                    target={material.stencil}
                                    propertyKey="opDepthFail"
                                    propertyPath="stencil.opDepthFail"
                                    options={StencilOperationOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Stencil & Depth Pass Operation"
                                    target={material.stencil}
                                    propertyKey="opStencilDepthPass"
                                    propertyPath="stencil.opStencilDepthPass"
                                    options={StencilOperationOptions}
                                />
                            </>
                        }
                    />
                    <PropertyLine
                        label="Back"
                        expandByDefault={true}
                        expandedContent={
                            <>
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Function"
                                    target={material.stencil}
                                    propertyKey="backFunc"
                                    propertyPath="stencil.backFunc"
                                    options={StencilFunctionOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Stencil Fail Operation"
                                    target={material.stencil}
                                    propertyKey="backOpStencilFail"
                                    propertyPath="stencil.backOpStencilFail"
                                    options={StencilOperationOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Depth Fail Operation"
                                    target={material.stencil}
                                    propertyKey="backOpDepthFail"
                                    propertyPath="stencil.backOpDepthFail"
                                    options={StencilOperationOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Stencil & Depth Pass Operation"
                                    target={material.stencil}
                                    propertyKey="backOpStencilDepthPass"
                                    propertyPath="stencil.backOpStencilDepthPass"
                                    options={StencilOperationOptions}
                                />
                            </>
                        }
                    />
                </>
            </Collapse>
        </>
    );
};
