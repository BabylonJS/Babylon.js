import { Material } from "core/Materials/material";
import { Engine } from "core/Engines/engine";
import { Constants } from "core/Engines/constants";
import type { FunctionComponent } from "react";

import { Collapse } from "@fluentui/react-motion-components-preview";

import { BoundProperty } from "../boundProperty";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { AlphaModeOptions } from "shared-ui-components/constToOptionsMaps";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";

const NullValue = Number.MAX_SAFE_INTEGER;

const OrientationOptions = [
    { label: "<None>", value: NullValue },
    { label: "Clockwise", value: Material.ClockWiseSideOrientation },
    { label: "Counterclockwise", value: Material.CounterClockWiseSideOrientation },
] as const satisfies DropdownOption[];

const TransparencyModeOptions = [
    { label: "<Not Defined>", value: NullValue },
    { label: "Opaque", value: Material.MATERIAL_OPAQUE },
    { label: "Alpha test", value: Material.MATERIAL_ALPHATEST },
    { label: "Alpha blend", value: Material.MATERIAL_ALPHABLEND },
    { label: "Alpha blend and test", value: Material.MATERIAL_ALPHATESTANDBLEND },
] as const satisfies DropdownOption[];

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
] as const satisfies DropdownOption[];

const StencilFunctionOptions = [
    { label: "Never", value: Constants.NEVER },
    { label: "Always", value: Constants.ALWAYS },
    { label: "Equal", value: Constants.EQUAL },
    { label: "Less", value: Constants.LESS },
    { label: "Less or equal", value: Constants.LEQUAL },
    { label: "Greater", value: Constants.GREATER },
    { label: "Greater or equal", value: Constants.GEQUAL },
    { label: "Not equal", value: Constants.NOTEQUAL },
] as const satisfies DropdownOption[];

const StencilOperationOptions = [
    { label: "Keep", value: Constants.KEEP },
    { label: "Zero", value: Constants.ZERO },
    { label: "Replace", value: Constants.REPLACE },
    { label: "Incr", value: Constants.INCR },
    { label: "Decr", value: Constants.DECR },
    { label: "Invert", value: Constants.INVERT },
    { label: "Incr wrap", value: Constants.INCR_WRAP },
    { label: "Decr wrap", value: Constants.DECR_WRAP },
] as const satisfies DropdownOption[];

export const MaterialGeneralProperties: FunctionComponent<{ material: Material }> = (props) => {
    const { material } = props;

    const pointsCloud = useProperty(material, "pointsCloud");

    return (
        <>
            <BoundProperty
                component={SwitchPropertyLine}
                label="Backface culling"
                docLink="https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction#back-face-culling"
                target={material}
                propertyKey="backFaceCulling"
            />
            <BoundProperty
                component={NumberDropdownPropertyLine}
                label="Orientation"
                description="The front face side. Overrides mesh's orientation."
                options={OrientationOptions}
                target={material}
                propertyKey="sideOrientation"
                nullable
                defaultValue={NullValue}
                // TODO: defaultValue={material.getScene().useRightHandedSystem ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation}
            />
            {/* TODO: Property name is different per material type
            <BoundProperty component={SwitchPropertyLine} label="Disable lighting" target={material} propertyKey="disableLighting" /> */}
            <BoundProperty component={SwitchPropertyLine} label="Disable color write" target={material} propertyKey="disableColorWrite" />
            <BoundProperty component={SwitchPropertyLine} label="Disable depth write" target={material} propertyKey="disableDepthWrite" />
            <BoundProperty component={NumberDropdownPropertyLine} label="Depth function" options={DepthFunctionOptions} target={material} propertyKey="depthFunction" />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Need depth pre-pass"
                docLink="https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering/#depth-pre-pass-meshes"
                target={material}
                propertyKey="needDepthPrePass"
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Z-offset Factor" target={material} propertyKey="zOffset" min={-10} max={10} step={0.1} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Z-offset Units" target={material} propertyKey="zOffsetUnits" min={-10} max={10} step={0.1} />
            <BoundProperty component={SwitchPropertyLine} label="Wireframe" target={material} propertyKey="wireframe" />
            <BoundProperty component={SwitchPropertyLine} label="Point cloud" target={material} propertyKey="pointsCloud" />
            {pointsCloud && <BoundProperty component={SyncedSliderPropertyLine} label="Point size" target={material} propertyKey="pointSize" min={0} max={100} step={0.1} />}
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
                label="Transparency mode"
                docLink="https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering/#the-transparencymode-property"
                target={material}
                propertyKey="transparencyMode"
                options={TransparencyModeOptions}
                nullable
                defaultValue={NullValue}
                // TODO: defaultValue={Material.MATERIAL_OPAQUE}
            />
            <BoundProperty
                component={NumberDropdownPropertyLine}
                label="Alpha mode"
                docLink="https://doc.babylonjs.com/features/featuresDeepDive/materials/using/blendModes/#available-blend-modes"
                target={material}
                propertyKey="alphaMode"
                options={AlphaModeOptions}
            />
            {/* TODO: Property names are different per material type
            <BoundProperty component={SwitchPropertyLine} label="Diffuse/albedo texture has alpha" target={material.albedoTexture} propertyKey="hasAlpha" />
            <BoundProperty component={SwitchPropertyLine} label="Use alpha from diffuse/albedo texture" target={material} propertyKey="useAlphaFromDiffuseTexture" /> */}
            <BoundProperty component={SwitchPropertyLine} label="Separate culling pass" target={material} propertyKey="separateCullingPass" />
        </>
    );
};

export const MaterialStencilProperties: FunctionComponent<{ material: Material }> = (props) => {
    const { material } = props;
    const stencilEnabled = useProperty(material.stencil, "enabled");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Enabled" target={material.stencil} propertyKey="enabled" />
            <Collapse visible={stencilEnabled}>
                <div>
                    {/* TODO: Make HexPropertyLine work in the case of simply editing a hex value */}
                    {/* <BoundProperty component={HexPropertyLine} label="Write mask" target={material.stencil} propertyKey="mask" /> */}
                    {/* <BoundProperty component={HexPropertyLine} label="Read mask" target={material.stencil} propertyKey="funcMask" /> */}
                    {/** TODO: Force int integer-only for NumberInputPropertyLine */}
                    <BoundProperty component={NumberInputPropertyLine} label="Reference value" target={material.stencil} propertyKey="funcRef" step={0} />
                    <TextPropertyLine
                        label="Front Stencil"
                        value=""
                        expandByDefault={true}
                        expandedContent={
                            <>
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Function"
                                    target={material.stencil}
                                    propertyKey="func"
                                    options={StencilFunctionOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Op stencil fail"
                                    description="Operation to perform when stencil test fails"
                                    target={material.stencil}
                                    propertyKey="opStencilFail"
                                    options={StencilOperationOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Op depth fail"
                                    description="Operation to perform when depth test fails"
                                    target={material.stencil}
                                    propertyKey="opDepthFail"
                                    options={StencilOperationOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Op stencil+depth pass"
                                    description="Operation to perform when both stencil + depth tests succeed"
                                    target={material.stencil}
                                    propertyKey="opStencilDepthPass"
                                    options={StencilOperationOptions}
                                />
                            </>
                        }
                    />
                    <TextPropertyLine
                        label="Back Stencil"
                        value=""
                        expandByDefault={true}
                        expandedContent={
                            <>
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Function"
                                    target={material.stencil}
                                    propertyKey="backFunc"
                                    options={StencilFunctionOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Op stencil fail"
                                    description="Operation to perform when stencil test fails"
                                    target={material.stencil}
                                    propertyKey="backOpStencilFail"
                                    options={StencilOperationOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Op depth fail"
                                    description="Operation to perform when depth test fails"
                                    target={material.stencil}
                                    propertyKey="backOpDepthFail"
                                    options={StencilOperationOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Op stencil+depth pass"
                                    description="Operation to perform when both stencil + depth tests succeed"
                                    target={material.stencil}
                                    propertyKey="backOpStencilDepthPass"
                                    options={StencilOperationOptions}
                                />
                            </>
                        }
                    />
                </div>
            </Collapse>
        </>
    );
};
