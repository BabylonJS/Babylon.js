import type { FunctionComponent } from "react";

import type { StandardMaterial } from "core/Materials/standardMaterial";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";
import { TextureSelectorPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/entitySelectorPropertyLine";
import type { ISelectionService } from "../../../services/selectionService";

export const StandardMaterialGeneralProperties: FunctionComponent<{ material: StandardMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Disable Lighting" target={material} propertyKey="disableLighting" />
        </>
    );
};

export const StandardMaterialTransparencyProperties: FunctionComponent<{ material: StandardMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            {material.diffuseTexture && (
                <>
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Diffuse Texture has Alpha"
                        target={material.diffuseTexture}
                        propertyKey="hasAlpha"
                        propertyPath="diffuseTexture.hasAlpha"
                    />
                </>
            )}
            <BoundProperty component={SwitchPropertyLine} label="Use Alpha from Diffuse Texture" target={material} propertyKey="useAlphaFromDiffuseTexture" />
        </>
    );
};

export const StandardMaterialTexturesProperties: FunctionComponent<{ material: StandardMaterial; selectionService: ISelectionService }> = (props) => {
    const { material, selectionService } = props;
    const scene = material.getScene();

    const selectEntity = (entity: unknown) => (selectionService.selectedEntity = entity);

    return (
        <>
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Diffuse"
                target={material}
                propertyKey="diffuseTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Specular"
                target={material}
                propertyKey="specularTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Reflection"
                target={material}
                propertyKey="reflectionTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Refraction"
                target={material}
                propertyKey="refractionTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Emissive"
                target={material}
                propertyKey="emissiveTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Bump"
                target={material}
                propertyKey="bumpTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Opacity"
                target={material}
                propertyKey="opacityTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Ambient"
                target={material}
                propertyKey="ambientTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Lightmap"
                target={material}
                propertyKey="lightmapTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Detailmap"
                target={material.detailMap}
                propertyKey="texture"
                propertyPath="detailMap.texture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty component={SwitchPropertyLine} label="Use Lightmap as Shadowmap" target={material} propertyKey="useLightmapAsShadowmap" />
            <BoundProperty component={SwitchPropertyLine} label="Use Detailmap" target={material.detailMap} propertyKey="isEnabled" propertyPath="detailMap.isEnabled" />
            <BoundProperty component={SwitchPropertyLine} label="Use Decalmap" target={material.decalMap} propertyKey="isEnabled" propertyPath="decalMap.isEnabled" />
        </>
    );
};

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
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Diffuse Level"
                target={standardMaterial.diffuseTexture}
                propertyKey="level"
                propertyPath="diffuseTexture.level"
                min={0}
                max={2}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Specular Level"
                target={standardMaterial.specularTexture}
                propertyKey="level"
                propertyPath="specularTexture.level"
                min={0}
                max={2}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Reflection Level"
                target={standardMaterial.reflectionTexture}
                propertyKey="level"
                propertyPath="reflectionTexture.level"
                min={0}
                max={2}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Refraction Level"
                target={standardMaterial.refractionTexture}
                propertyKey="level"
                propertyPath="refractionTexture.level"
                min={0}
                max={2}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Emissive Level"
                target={standardMaterial.emissiveTexture}
                propertyKey="level"
                propertyPath="emissiveTexture.level"
                min={0}
                max={2}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Bump Level"
                target={standardMaterial.bumpTexture}
                propertyKey="level"
                propertyPath="bumpTexture.level"
                min={0}
                max={2}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Opacity Level"
                target={standardMaterial.opacityTexture}
                propertyKey="level"
                propertyPath="opacityTexture.level"
                min={0}
                max={2}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Ambient Level"
                target={standardMaterial.ambientTexture}
                propertyKey="level"
                propertyPath="ambientTexture.level"
                min={0}
                max={2}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Lightmap Level"
                target={standardMaterial.lightmapTexture}
                propertyKey="level"
                propertyPath="lightmapTexture.level"
                min={0}
                max={2}
                step={0.01}
            />
            <Collapse visible={isDetailMapEnabled}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Detailmap Diffuse"
                    target={standardMaterial.detailMap}
                    propertyKey="diffuseBlendLevel"
                    propertyPath="detailMap.diffuseBlendLevel"
                    min={0}
                    max={1}
                    step={0.01}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Detailmap Bump"
                    target={standardMaterial.detailMap}
                    propertyKey="bumpLevel"
                    propertyPath="detailMap.bumpLevel"
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
