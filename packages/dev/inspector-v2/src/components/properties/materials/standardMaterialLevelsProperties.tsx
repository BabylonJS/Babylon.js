import type { FunctionComponent } from "react";

import { BoundProperty } from "../boundProperty";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";

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
