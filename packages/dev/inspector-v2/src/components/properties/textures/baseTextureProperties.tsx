import type { FunctionComponent } from "react";

import type { BaseTexture } from "core/index";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";

import { useCallback } from "react";

import { Constants } from "core/Engines/constants";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { Texture } from "core/Materials/Textures/texture";
import { ReadFile } from "core/Misc/fileTools";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";
import { FindTextureFormat, FindTextureType } from "./textureFormatUtils";
import { TexturePreview } from "./texturePreview";

export const BaseTexturePreviewProperties: FunctionComponent<{ texture: BaseTexture }> = (props) => {
    const { texture } = props;

    const isUpdatable = texture instanceof Texture || texture instanceof CubeTexture;

    const updateTexture = useCallback(
        (file: File) => {
            ReadFile(
                file,
                (data) => {
                    const blob = new Blob([data], { type: "octet/stream" });

                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = () => {
                        const base64data = reader.result as string;

                        if (texture instanceof CubeTexture) {
                            let extension: string | undefined = undefined;
                            if (file.name.toLowerCase().indexOf(".dds") > 0) {
                                extension = ".dds";
                            } else if (file.name.toLowerCase().indexOf(".env") > 0) {
                                extension = ".env";
                            }

                            texture.updateURL(base64data, extension);
                        } else if (texture instanceof Texture) {
                            texture.updateURL(base64data);
                        }
                    };
                },
                undefined,
                true
            );
        },
        [texture]
    );

    return (
        <>
            <TexturePreview texture={texture} width={256} height={256} />
            {/* TODO: This should probably be dynamically fetching a list of supported texture extensions. */}
            {isUpdatable && (
                <FileUploadLine
                    label="Load Texture From File"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            updateTexture(files[0]);
                        }
                    }}
                />
            )}
            <ButtonLine label="Edit Texture (coming soon!)" onClick={() => {}} />
        </>
    );
};

export const BaseTextureGeneralProperties: FunctionComponent<{ texture: BaseTexture }> = (props) => {
    const { texture } = props;

    const internalTexture = useProperty(texture, "_texture");
    const internalUniqueId = useProperty(internalTexture, "uniqueId");

    return (
        <>
            <BoundProperty component={TextInputPropertyLine} label="Display Name" target={texture} propertyKey="displayName" />
            {internalUniqueId != null ? (
                <StringifiedPropertyLine label="Internal Unique ID" description="The unique ID of the internal texture." value={internalUniqueId} />
            ) : (
                <BooleanBadgePropertyLine label="Internal Unique ID" description="This texture has no internal texture." value={false} />
            )}
        </>
    );
};

const CoordinatesMode = [
    { label: "Explicit", value: Texture.EXPLICIT_MODE },
    { label: "Cubic", value: Texture.CUBIC_MODE },
    { label: "Inverse cubic", value: Texture.INVCUBIC_MODE },
    { label: "Equirectangular", value: Texture.EQUIRECTANGULAR_MODE },
    { label: "Fixed equirectangular", value: Texture.FIXED_EQUIRECTANGULAR_MODE },
    { label: "Fixed equirectangular mirrored", value: Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE },
    { label: "Planar", value: Texture.PLANAR_MODE },
    { label: "Projection", value: Texture.PROJECTION_MODE },
    { label: "Skybox", value: Texture.SKYBOX_MODE },
    { label: "Spherical", value: Texture.SPHERICAL_MODE },
] as const satisfies DropdownOption<number>[];

export const BaseTextureCharacteristicProperties: FunctionComponent<{ texture: BaseTexture }> = (props) => {
    const { texture } = props;

    const internalTexture = useProperty(texture, "_texture");
    const format = useProperty(internalTexture, "format") ?? NaN;
    const type = useProperty(internalTexture, "type") ?? NaN;
    const depth = useProperty(internalTexture, "depth");
    const useSRGBBuffer = useProperty(internalTexture, "_useSRGBBuffer");

    const displayFormat = FindTextureFormat(format === -1 ? Constants.TEXTUREFORMAT_RGBA : format);
    const displayType = FindTextureType(type === -1 ? Constants.TEXTURETYPE_UNSIGNED_BYTE : type);

    return (
        <>
            {texture.is2DArray && <TextPropertyLine label="Layers" value={depth?.toString() ?? "?"} />}
            {texture.is3D && <TextPropertyLine label="Depth" value={depth?.toString() ?? "?"} />}
            <TextPropertyLine label="Format" value={displayFormat?.label ?? "unknown"} />
            {!displayFormat?.hideType && !displayFormat?.compressed && <TextPropertyLine label="Type" value={displayType?.label ?? "unknown"} />}
            {!!displayFormat?.normalizable && !displayFormat?.compressed && displayType?.normalizable != undefined && (
                <BooleanBadgePropertyLine label="Normalized" value={displayType.normalizable} />
            )}
            <BooleanBadgePropertyLine label="Compressed" value={displayFormat?.compressed ?? false} />
            <BooleanBadgePropertyLine label="sRGB Buffers" value={useSRGBBuffer ?? false} />
            <BoundProperty component={BooleanBadgePropertyLine} label="Gamma Space" target={texture} propertyKey="gammaSpace" />
            <BoundProperty component={BooleanBadgePropertyLine} label="Has Alpha" target={texture} propertyKey="hasAlpha" />
            <BoundProperty component={SwitchPropertyLine} label="Alpha from RGB" target={texture} propertyKey="getAlphaFromRGB" />
            <BooleanBadgePropertyLine label="3D" value={texture.is3D} />
            <BooleanBadgePropertyLine label="2D Array" value={texture.is2DArray} />
            <BooleanBadgePropertyLine label="Cube" value={texture.isCube} />
            <BooleanBadgePropertyLine label="Render Target" value={texture.isRenderTarget} />
            <BooleanBadgePropertyLine label="Mipmaps" value={!texture.noMipmap} />
            <BoundProperty component={SyncedSliderPropertyLine} label="UV Set" target={texture} propertyKey="coordinatesIndex" min={0} max={3} step={1} />
            <BoundProperty component={NumberDropdownPropertyLine} label="Mode" target={texture} propertyKey="coordinatesMode" options={CoordinatesMode} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Level" target={texture} propertyKey="level" min={0} max={2} step={0.01} />
        </>
    );
};

export const BaseTextureTransformProperties: FunctionComponent<{ texture: BaseTexture }> = (props) => {
    const { texture } = props;

    return (
        <>
            {texture.canRescale && (
                <ButtonLine
                    label="Scale Up"
                    onClick={() => {
                        texture.scale(2);
                    }}
                />
            )}
            {texture.canRescale && (
                <ButtonLine
                    label="Scale Down"
                    onClick={() => {
                        texture.scale(0.5);
                    }}
                />
            )}
        </>
    );
};
