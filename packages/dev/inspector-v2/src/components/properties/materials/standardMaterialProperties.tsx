import type { FunctionComponent } from "react";

import type { StandardMaterial } from "core/Materials/standardMaterial";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";

/**
 * Displays the levels properties of a standard material.
 * @param props - The required properties
 * @returns A JSX element representing the levels properties.
 */
export const StandardMaterialLevelsProperties: FunctionComponent<{ standardMaterial: StandardMaterial }> = (props) => {
    const { standardMaterial } = props;

    const isDetailMapEnabled = useProperty(standardMaterial.detailMap, "isEnabled");

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="Diffuse Level" target={standardMaterial.diffuseTexture} propertyKey="level" min={0} max={2} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Specular Level" target={standardMaterial.specularTexture} propertyKey="level" min={0} max={2} step={0.01} />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Reflection Level"
                target={standardMaterial.reflectionTexture}
                propertyKey="level"
                min={0}
                max={2}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Refraction Level"
                target={standardMaterial.refractionTexture}
                propertyKey="level"
                min={0}
                max={2}
                step={0.01}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Emissive Level" target={standardMaterial.emissiveTexture} propertyKey="level" min={0} max={2} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Bump Level" target={standardMaterial.bumpTexture} propertyKey="level" min={0} max={2} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Opacity Level" target={standardMaterial.opacityTexture} propertyKey="level" min={0} max={2} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Ambient Level" target={standardMaterial.ambientTexture} propertyKey="level" min={0} max={2} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Lightmap Level" target={standardMaterial.lightmapTexture} propertyKey="level" min={0} max={2} step={0.01} />
            <Collapse visible={isDetailMapEnabled}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Detailmap Diffuse"
                    target={standardMaterial.detailMap}
                    propertyKey="diffuseBlendLevel"
                    min={0}
                    max={1}
                    step={0.01}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Detailmap Bump"
                    target={standardMaterial.detailMap}
                    propertyKey="bumpLevel"
                    min={0}
                    max={1}
                    step={0.01}
                />
            </Collapse>
        </>
    );
};

/**
 * Displays the lighting and color properties of a standard material.
 * @param props - The required properties
 * @returns A JSX element representing the lighting and color properties.
 */
export const StandardMaterialLightingAndColorProperties: FunctionComponent<{ standardMaterial: StandardMaterial }> = (props) => {
    const { standardMaterial } = props;

    return (
        <>
            <BoundProperty component={Color3PropertyLine} label="Diffuse Color" target={standardMaterial} propertyKey="diffuseColor" />
            <BoundProperty component={Color3PropertyLine} label="Specular Color" target={standardMaterial} propertyKey="specularColor" />
            <BoundProperty component={SyncedSliderPropertyLine} label="Specular Power" target={standardMaterial} propertyKey="specularPower" min={0} max={128} step={0.1} />
            <BoundProperty component={Color3PropertyLine} label="Emissive Color" target={standardMaterial} propertyKey="emissiveColor" />
            <BoundProperty component={Color3PropertyLine} label="Ambient Color" target={standardMaterial} propertyKey="ambientColor" />
            <BoundProperty component={SwitchPropertyLine} label="Use Specular Over Alpha" target={standardMaterial} propertyKey="useSpecularOverAlpha" />
        </>
    );
};

/**
 * Displays the texture properties of a standard material.
 * @param props - The required properties
 * @returns A JSX element representing the texture properties.
 */
export const StandardMaterialTexturesProperties: FunctionComponent<{ standardMaterial: StandardMaterial }> = (props) => {
    const { standardMaterial } = props;

    // TODO: Add buttons and links for adding the textures themselves
    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Use Lightmap as Shadowmap" target={standardMaterial} propertyKey="useLightmapAsShadowmap" />
            <BoundProperty component={SwitchPropertyLine} label="Use Detailmap" target={standardMaterial.detailMap} propertyKey="isEnabled" />
            <BoundProperty component={SwitchPropertyLine} label="Use Decalmap" target={standardMaterial.decalMap} propertyKey="isEnabled" />
        </>
    );
};
