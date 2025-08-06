import type { FunctionComponent } from "react";

import { BoundProperty } from "../boundProperty";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";

/**
 * Displays the levels properties of a standard material.
 * @param props - The required properties
 * @returns A JSX element representing the levels properties.
 */
export const StandardMaterialLevelsProperties: FunctionComponent<{ standardMaterial: StandardMaterial }> = (props) => {
    const { standardMaterial } = props;

    const diffuseTexture = useProperty(standardMaterial, "diffuseTexture");
    const specularTexture = useProperty(standardMaterial, "specularTexture");
    const reflectionTexture = useProperty(standardMaterial, "reflectionTexture");
    const refractionTexture = useProperty(standardMaterial, "refractionTexture");
    const emissiveTexture = useProperty(standardMaterial, "emissiveTexture");
    const bumpTexture = useProperty(standardMaterial, "bumpTexture");
    const opacityTexture = useProperty(standardMaterial, "opacityTexture");
    const ambientTexture = useProperty(standardMaterial, "ambientTexture");
    const lightmapTexture = useProperty(standardMaterial, "lightmapTexture");
    const isDetailMapEnabled = useProperty(standardMaterial.detailMap, "isEnabled");

    return (
        <>
            {diffuseTexture && <BoundProperty component={SyncedSliderPropertyLine} label="Diffuse Level" target={diffuseTexture} propertyKey="level" min={0} max={2} step={0.01} />}
            {specularTexture && (
                <BoundProperty component={SyncedSliderPropertyLine} label="Specular Level" target={specularTexture} propertyKey="level" min={0} max={2} step={0.01} />
            )}
            {reflectionTexture && (
                <BoundProperty component={SyncedSliderPropertyLine} label="Reflection Level" target={reflectionTexture} propertyKey="level" min={0} max={2} step={0.01} />
            )}
            {refractionTexture && (
                <BoundProperty component={SyncedSliderPropertyLine} label="Refraction Level" target={refractionTexture} propertyKey="level" min={0} max={2} step={0.01} />
            )}
            {emissiveTexture && (
                <BoundProperty component={SyncedSliderPropertyLine} label="Emissive Level" target={emissiveTexture} propertyKey="level" min={0} max={2} step={0.01} />
            )}
            {bumpTexture && <BoundProperty component={SyncedSliderPropertyLine} label="Bump Level" target={bumpTexture} propertyKey="level" min={0} max={2} step={0.01} />}
            {opacityTexture && <BoundProperty component={SyncedSliderPropertyLine} label="Opacity Level" target={opacityTexture} propertyKey="level" min={0} max={2} step={0.01} />}
            {ambientTexture && <BoundProperty component={SyncedSliderPropertyLine} label="Ambient Level" target={ambientTexture} propertyKey="level" min={0} max={2} step={0.01} />}
            {lightmapTexture && (
                <BoundProperty component={SyncedSliderPropertyLine} label="Lightmap Level" target={lightmapTexture} propertyKey="level" min={0} max={2} step={0.01} />
            )}
            {isDetailMapEnabled && (
                <>
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
                </>
            )}
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

    const decalMap = useProperty(standardMaterial, "decalMap");

    // TODO: Add buttons and links for adding the textures themselves
    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Use Lightmap as Shadowmap" target={standardMaterial} propertyKey="useLightmapAsShadowmap" />
            <BoundProperty component={SwitchPropertyLine} label="Use Detailmap" target={standardMaterial.detailMap} propertyKey="isEnabled" />
            {decalMap && <BoundProperty component={SwitchPropertyLine} label="Use Decalmap" target={decalMap} propertyKey="isEnabled" />}
        </>
    );
};
