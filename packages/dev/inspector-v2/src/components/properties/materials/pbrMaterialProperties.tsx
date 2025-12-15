import type { FunctionComponent } from "react";

import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { BoundProperty } from "../boundProperty";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { ChooseTexturePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/chooseTexturePropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { usePropertyChangedNotifier } from "../../../contexts/propertyContext";
import type { Scene } from "core/scene";

/**
 * Helper to bind texture properties without needing defaultValue
 */
const BoundTextureProperty: FunctionComponent<{
    label: string;
    target: PBRMaterial;
    propertyKey: keyof PBRMaterial;
    scene: Scene;
    cubeOnly?: boolean;
}> = ({ label, target, propertyKey, scene, cubeOnly }) => {
    const value = useProperty(target, propertyKey);
    const notifyPropertyChanged = usePropertyChangedNotifier();

    return (
        <ChooseTexturePropertyLine
            label={label}
            value={value}
            onChange={(texture) => {
                const oldValue = target[propertyKey];
                (target as any)[propertyKey] = texture;
                notifyPropertyChanged(target, propertyKey, oldValue, texture);
            }}
            scene={scene}
            cubeOnly={cubeOnly}
        />
    );
};

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
            <BoundTextureProperty label="Albedo" target={material} propertyKey="albedoTexture" scene={scene} />
            <BoundTextureProperty label="Base Weight" target={material} propertyKey="baseWeightTexture" scene={scene} />
            <BoundTextureProperty label="Base Diffuse Roughness" target={material} propertyKey="baseDiffuseRoughnessTexture" scene={scene} />
            <BoundTextureProperty label="Metallic Roughness" target={material} propertyKey="metallicTexture" scene={scene} />
            <BoundTextureProperty label="Reflection" target={material} propertyKey="reflectionTexture" scene={scene} cubeOnly />
            <BoundTextureProperty label="Refraction" target={material} propertyKey="refractionTexture" scene={scene} />
            <BoundTextureProperty label="Reflectivity" target={material} propertyKey="reflectivityTexture" scene={scene} />
            <BoundTextureProperty label="Micro-surface" target={material} propertyKey="microSurfaceTexture" scene={scene} />
            <BoundTextureProperty label="Bump" target={material} propertyKey="bumpTexture" scene={scene} />
            <BoundTextureProperty label="Emissive" target={material} propertyKey="emissiveTexture" scene={scene} />
            <BoundTextureProperty label="Opacity" target={material} propertyKey="opacityTexture" scene={scene} />
            <BoundTextureProperty label="Ambient" target={material} propertyKey="ambientTexture" scene={scene} />
            <BoundTextureProperty label="Lightmap" target={material} propertyKey="lightmapTexture" scene={scene} />
        </>
    );
};
