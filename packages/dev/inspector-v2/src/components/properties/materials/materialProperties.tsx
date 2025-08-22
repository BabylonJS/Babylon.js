import { Material } from "core/Materials/material";
import { Engine } from "core/Engines/engine";
import { Constants } from "core/Engines/constants";
import type { FunctionComponent } from "react";

import { BoundProperty } from "../boundProperty";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { AlphaModeOptions } from "shared-ui-components/constToOptionsMaps";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";

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

    return (
        <>
            <BoundProperty
                component={SwitchPropertyLine}
                label="Backface Culling"
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
                defaultValue={material.getScene().useRightHandedSystem ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation}
            />
            {/* TODO: Property name is different per material type
            <BoundProperty component={SwitchPropertyLine} label="Disable Lighting" target={material} propertyKey="disableLighting" /> */}
            <BoundProperty component={SwitchPropertyLine} label="Disable Color Write" target={material} propertyKey="disableColorWrite" />
            <BoundProperty component={SwitchPropertyLine} label="Disable Depth Write" target={material} propertyKey="disableDepthWrite" />
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
            {/* TODO: Property names are different per material type
            <BoundProperty component={SwitchPropertyLine} label="Diffuse/albedo texture has alpha" target={material.albedoTexture} propertyKey="hasAlpha" />
            <BoundProperty component={SwitchPropertyLine} label="Use alpha from diffuse/albedo texture" target={material} propertyKey="useAlphaFromDiffuseTexture" /> */}
            <BoundProperty component={SwitchPropertyLine} label="Separate Culling Pass" target={material} propertyKey="separateCullingPass" />
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
                <>
                    {/* TODO: Make HexPropertyLine work in the case of simply editing a hex value */}
                    {/* <BoundProperty component={HexPropertyLine} label="Write Mask" target={material.stencil} propertyKey="mask" /> */}
                    {/* <BoundProperty component={HexPropertyLine} label="Read Mask" target={material.stencil} propertyKey="funcMask" /> */}
                    {/** TODO: Force int integer-only for NumberInputPropertyLine */}
                    <BoundProperty component={NumberInputPropertyLine} label="Reference Value" target={material.stencil} propertyKey="funcRef" step={0} />
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
                                    options={StencilFunctionOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Stencil Fail Operation"
                                    target={material.stencil}
                                    propertyKey="opStencilFail"
                                    options={StencilOperationOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Depth Fail Operation"
                                    target={material.stencil}
                                    propertyKey="opDepthFail"
                                    options={StencilOperationOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Stencil & Depth Pass Operation"
                                    target={material.stencil}
                                    propertyKey="opStencilDepthPass"
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
                                    options={StencilFunctionOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Stencil Fail Operation"
                                    target={material.stencil}
                                    propertyKey="backOpStencilFail"
                                    options={StencilOperationOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Depth Fail Operation"
                                    target={material.stencil}
                                    propertyKey="backOpDepthFail"
                                    options={StencilOperationOptions}
                                />
                                <BoundProperty
                                    component={NumberDropdownPropertyLine}
                                    label="Stencil & Depth Pass Operation"
                                    target={material.stencil}
                                    propertyKey="backOpStencilDepthPass"
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
