import type { FunctionComponent } from "react";

import { BoundProperty } from "../boundProperty";
import { useProperty } from "../../../hooks/compoundPropertyHooks";

import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";

import type { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { Vector2PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";

import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { ReadFile } from "core/Misc/fileTools";
import { Texture } from "core/Materials/Textures/texture";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";

declare module "core/Materials/PBR/pbrSheenConfiguration" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface PBRSheenConfiguration {
        _useRoughness: boolean;
    }
}

// TODO: ryamtrem / gehalper This function is temporal until there is a line control to handle texture links (similar to the old TextureLinkLineComponent)
const UpdateTexture = (file: File, material: PBRBaseMaterial, textureSetter: (texture: BaseTexture) => void) => {
    ReadFile(
        file,
        (data) => {
            const blob = new Blob([data], { type: "octet/stream" });
            const url = URL.createObjectURL(blob);
            textureSetter(new Texture(url, material.getScene(), false, false));
        },
        undefined,
        true
    );
};

export const PBRBaseMaterialClearCoatProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    const isEnabled = useProperty(material.clearCoat, "isEnabled");
    const isTintEnabled = useProperty(material.clearCoat, "isTintEnabled");
    const bumpTexture = useProperty(material.clearCoat, "bumpTexture");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Enabled" target={material.clearCoat} propertyKey="isEnabled" />
            <Collapse visible={isEnabled}>
                <BoundProperty component={SyncedSliderPropertyLine} label="Intensity" target={material.clearCoat} propertyKey="intensity" min={0} max={1} step={0.01} />
                <BoundProperty component={SyncedSliderPropertyLine} label="Roughness" target={material.clearCoat} propertyKey="roughness" min={0} max={1} step={0.01} />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="IOR"
                    description="Index of Refraction"
                    target={material.clearCoat}
                    propertyKey="indexOfRefraction"
                    min={1}
                    max={3}
                    step={0.01}
                />
                <BoundProperty component={SwitchPropertyLine} label="Remap F0" target={material.clearCoat} propertyKey="remapF0OnInterfaceChange" />
                <FileUploadLine
                    label="Clear coat"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.clearCoat.texture = texture));
                        }
                    }}
                />
                <FileUploadLine
                    label="Roughness"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.clearCoat.textureRoughness = texture));
                        }
                    }}
                />
                <FileUploadLine
                    label="Bump"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.clearCoat.bumpTexture = texture));
                        }
                    }}
                />
                <Collapse visible={bumpTexture !== null}>
                    <BoundProperty component={SyncedSliderPropertyLine} label="Bump Strength" target={bumpTexture} propertyKey="level" min={0} max={2} step={0.01} />
                </Collapse>
                <BoundProperty component={SwitchPropertyLine} label="Use Roughness from Main Texture" target={material.clearCoat} propertyKey="useRoughnessFromMainTexture" />
                <BoundProperty component={SwitchPropertyLine} label="Tint" target={material.clearCoat} propertyKey="isTintEnabled" />
                <Collapse visible={isTintEnabled}>
                    <BoundProperty component={Color3PropertyLine} label="Tint Color" target={material.clearCoat} propertyKey="tintColor" isLinearMode={true} />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="At Distance"
                        target={material.clearCoat}
                        propertyKey="tintColorAtDistance"
                        min={0}
                        max={20}
                        step={0.1}
                    />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Tint Thickness"
                        target={material.clearCoat}
                        propertyKey="tintThickness"
                        min={0}
                        max={20}
                        step={0.1}
                    />
                    <FileUploadLine
                        label="Tint"
                        accept=".jpg, .png, .tga, .dds, .env, .exr"
                        onClick={(files) => {
                            if (files.length > 0) {
                                UpdateTexture(files[0], material, (texture) => (material.clearCoat.tintTexture = texture));
                            }
                        }}
                    />
                </Collapse>
            </Collapse>
        </>
    );
};

export const PBRBaseMaterialIridescenceProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    const isEnabled = useProperty(material.iridescence, "isEnabled");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Enabled" target={material.iridescence} propertyKey="isEnabled" />
            <Collapse visible={isEnabled}>
                <BoundProperty component={SyncedSliderPropertyLine} label="Intensity" target={material.iridescence} propertyKey="intensity" min={0} max={1} step={0.01} />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="IOR"
                    description="Index of Refraction"
                    target={material.iridescence}
                    propertyKey="indexOfRefraction"
                    min={1}
                    max={3}
                    step={0.01}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Minimum Thickness"
                    target={material.iridescence}
                    propertyKey="minimumThickness"
                    min={0}
                    max={1000}
                    step={10}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Maxium Thickness"
                    target={material.iridescence}
                    propertyKey="maximumThickness"
                    min={0}
                    max={1000}
                    step={10}
                />
                <FileUploadLine
                    label="Iridescence"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.iridescence.texture = texture));
                        }
                    }}
                />
                <FileUploadLine
                    label="Thickness"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.iridescence.thicknessTexture = texture));
                        }
                    }}
                />
            </Collapse>
        </>
    );
};

export const PBRBaseMaterialAnisotropicProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    const isEnabled = useProperty(material.anisotropy, "isEnabled");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Enabled" target={material.anisotropy} propertyKey="isEnabled" />
            <Collapse visible={isEnabled}>
                <BoundProperty component={SwitchPropertyLine} label="Legacy Mode" target={material.anisotropy} propertyKey="legacy" />
                <BoundProperty component={SyncedSliderPropertyLine} label="Intensity" target={material.anisotropy} propertyKey="intensity" min={0} max={1} step={0.01} />
                <BoundProperty component={Vector2PropertyLine} label="Direction" target={material.anisotropy} propertyKey="direction" />
                <FileUploadLine
                    label="Anisotropic"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.anisotropy.texture = texture));
                        }
                    }}
                />
            </Collapse>
        </>
    );
};

export const PBRBaseMaterialSheenProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    const isEnabled = useProperty(material.sheen, "isEnabled");
    const useRoughness = useProperty(material.sheen, "_useRoughness");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Enabled" target={material.sheen} propertyKey="isEnabled" />
            <Collapse visible={isEnabled}>
                <BoundProperty component={SwitchPropertyLine} label="Link to Albedo" target={material.sheen} propertyKey="linkSheenWithAlbedo" />
                <BoundProperty component={SyncedSliderPropertyLine} label="Intensity" target={material.sheen} propertyKey="intensity" min={0} max={1} step={0.01} />
                <BoundProperty component={Color3PropertyLine} label="Color" target={material.sheen} propertyKey="color" isLinearMode={true} />
                <FileUploadLine
                    label="Sheen"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.sheen.texture = texture));
                        }
                    }}
                />
                <FileUploadLine
                    label="Roughness"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.sheen.textureRoughness = texture));
                        }
                    }}
                />
                <BoundProperty component={SwitchPropertyLine} label="Use Roughness" target={material.sheen} propertyKey="_useRoughness" />
                <Collapse visible={useRoughness}>
                    <BoundProperty
                        nullable
                        component={SyncedSliderPropertyLine}
                        label="Roughness"
                        target={material.sheen}
                        propertyKey="roughness"
                        defaultValue={0}
                        min={0}
                        max={1}
                        step={0.01}
                    />
                </Collapse>
                <BoundProperty component={SwitchPropertyLine} label="Use Roughness from Main Texture" target={material.sheen} propertyKey="useRoughnessFromMainTexture" />
                <BoundProperty component={SwitchPropertyLine} label="Albedo Scaling" target={material.sheen} propertyKey="albedoScaling" />
            </Collapse>
        </>
    );
};
