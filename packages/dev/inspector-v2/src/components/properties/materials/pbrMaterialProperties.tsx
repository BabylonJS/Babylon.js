import type { FunctionComponent } from "react";

import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { BoundProperty } from "../boundProperty";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { ChooseTexturePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/chooseEntityPropertyLine";

/**
 * Displays the lighting and color properties of a PBR material.
 * @param props - The required properties
 * @returns A JSX element representing the lighting and color properties.
 */
export const PBRMaterialLightingAndColorProperties: FunctionComponent<{ material: PBRMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={Color3PropertyLine} label="Albedo" target={material} propertyKey="albedoColor" isLinearMode />
            <BoundProperty component={SyncedSliderPropertyLine} label="Base Weight" target={material} propertyKey="baseWeight" min={0} max={1} step={0.01} />
            <BoundProperty component={Color3PropertyLine} label="Reflectivity" target={material} propertyKey="reflectivityColor" isLinearMode />
            <BoundProperty component={SyncedSliderPropertyLine} label="Micro-Surface" target={material} propertyKey="microSurface" min={0} max={1} step={0.01} />
            <BoundProperty component={Color3PropertyLine} label="Emissive" target={material} propertyKey="emissiveColor" isLinearMode />
            <BoundProperty component={Color3PropertyLine} label="Ambient" target={material} propertyKey="ambientColor" isLinearMode />
            <BoundProperty component={SwitchPropertyLine} label="Use Physical Light Falloff" target={material} propertyKey="usePhysicalLightFalloff" />
        </>
    );
};

/**
 * Displays the texture channel properties of a PBR material.
 * @param props - The required properties
 * @returns A JSX element representing the texture channels.
 */
export const PBRMaterialTextureProperties: FunctionComponent<{ material: PBRMaterial }> = (props) => {
    const { material } = props;
    const scene = material.getScene();

    return (
        <>
            <BoundProperty component={ChooseTexturePropertyLine} label="Albedo" target={material} propertyKey="albedoTexture" scene={scene} defaultValue={null} />
            <BoundProperty component={ChooseTexturePropertyLine} label="Base Weight" target={material} propertyKey="baseWeightTexture" scene={scene} defaultValue={null} />
            <BoundProperty
                component={ChooseTexturePropertyLine}
                label="Base Diffuse Roughness"
                target={material}
                propertyKey="baseDiffuseRoughnessTexture"
                scene={scene}
                defaultValue={null}
            />
            <BoundProperty component={ChooseTexturePropertyLine} label="Metallic Roughness" target={material} propertyKey="metallicTexture" scene={scene} defaultValue={null} />
            <BoundProperty component={ChooseTexturePropertyLine} label="Reflection" target={material} propertyKey="reflectionTexture" scene={scene} cubeOnly defaultValue={null} />
            <BoundProperty component={ChooseTexturePropertyLine} label="Refraction" target={material} propertyKey="refractionTexture" scene={scene} defaultValue={null} />
            <BoundProperty component={ChooseTexturePropertyLine} label="Reflectivity" target={material} propertyKey="reflectivityTexture" scene={scene} defaultValue={null} />
            <BoundProperty component={ChooseTexturePropertyLine} label="Micro-surface" target={material} propertyKey="microSurfaceTexture" scene={scene} defaultValue={null} />
            <BoundProperty component={ChooseTexturePropertyLine} label="Bump" target={material} propertyKey="bumpTexture" scene={scene} defaultValue={null} />
            <BoundProperty component={ChooseTexturePropertyLine} label="Emissive" target={material} propertyKey="emissiveTexture" scene={scene} defaultValue={null} />
            <BoundProperty component={ChooseTexturePropertyLine} label="Opacity" target={material} propertyKey="opacityTexture" scene={scene} defaultValue={null} />
            <BoundProperty component={ChooseTexturePropertyLine} label="Ambient" target={material} propertyKey="ambientTexture" scene={scene} defaultValue={null} />
            <BoundProperty component={ChooseTexturePropertyLine} label="Lightmap" target={material} propertyKey="lightmapTexture" scene={scene} defaultValue={null} />
        </>
    );
};
