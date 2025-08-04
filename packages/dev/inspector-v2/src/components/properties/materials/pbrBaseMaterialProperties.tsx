import type { FunctionComponent } from "react";

import { Collapse } from "@fluentui/react-motion-components-preview";

import { BoundProperty } from "../boundProperty";
import { useProperty } from "../../../hooks/compoundPropertyHooks";

import { CheckboxPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/checkboxPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";

import type { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";

import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { ReadFile } from "core/Misc/fileTools";
import { Texture } from "core/Materials/Textures/texture";

export const PBRBaseMaterialClearCoatProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    const bumpTexture = useProperty(material.clearCoat, "bumpTexture");

    const updateTexture = (file: File, _texture: BaseTexture | null) => {
        ReadFile(
            file,
            (data) => {
                const blob = new Blob([data], { type: "octet/stream" });
                const url = URL.createObjectURL(blob);
                _texture = new Texture(url, material.getScene(), false, false);
            },
            undefined,
            true
        );
    };

    return (
        <>
            <BoundProperty component={CheckboxPropertyLine} label="Enabled" target={material.clearCoat} propertyKey="isEnabled" />
            <Collapse visible={material.clearCoat.isEnabled}>
                <div>
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
                    <BoundProperty component={CheckboxPropertyLine} label="Remap F0" target={material.clearCoat} propertyKey="remapF0OnInterfaceChange" />
                    <FileUploadLine
                        label="Clear coat"
                        accept=".jpg, .png, .tga, .dds, .env, .exr"
                        onClick={(files) => {
                            if (files.length > 0) {
                                updateTexture(files[0], material.clearCoat.texture);
                            }
                        }}
                    />
                    <FileUploadLine
                        label="Roughness"
                        accept=".jpg, .png, .tga, .dds, .env, .exr"
                        onClick={(files) => {
                            if (files.length > 0) {
                                updateTexture(files[0], material.clearCoat.textureRoughness);
                            }
                        }}
                    />
                    <FileUploadLine
                        label="Bump"
                        accept=".jpg, .png, .tga, .dds, .env, .exr"
                        onClick={(files) => {
                            if (files.length > 0) {
                                updateTexture(files[0], material.clearCoat.bumpTexture);
                            }
                        }}
                    />
                    <Collapse visible={bumpTexture !== null}>
                        <BoundProperty component={SyncedSliderPropertyLine} label="Bump strength" target={bumpTexture!} propertyKey="level" min={0} max={2} step={0.01} />
                    </Collapse>
                    <BoundProperty component={CheckboxPropertyLine} label="Use roughness from main texture" target={material.clearCoat} propertyKey="useRoughnessFromMainTexture" />
                    <BoundProperty component={CheckboxPropertyLine} label="Tint" target={material.clearCoat} propertyKey="isTintEnabled" />
                    <Collapse visible={material.clearCoat.isTintEnabled}>
                        <div>
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
                                        updateTexture(files[0], material.clearCoat.tintTexture);
                                    }
                                }}
                            />
                        </div>
                    </Collapse>
                </div>
            </Collapse>
        </>
    );
};
