import { type FunctionComponent, type Ref, useCallback } from "react";

import { type BaseTexture } from "core/index";
import { WhenTextureReadyAsync } from "core/Misc/textureTools";

import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { ApplyChannelsToTextureDataAsync } from "../../../misc/textureTools";
import { TexturePreviewCore, type TexturePreviewImperativeRef, type TexturePreviewSelection } from "./texturePreviewCore";

export type { TexturePreviewImperativeRef } from "./texturePreviewCore";

/**
 * Properties for the texture preview component.
 */
export type TexturePreviewProps = {
    /**
     * Texture to display.
     */
    texture: BaseTexture;
    /**
     * Disables preview toolbar controls.
     */
    disableToolbar?: boolean;
    /**
     * Maximum preview width CSS value.
     */
    maxWidth?: string;
    /**
     * Maximum preview height CSS value.
     */
    maxHeight?: string;
    /**
     * Horizontal offset in source pixels.
     */
    offsetX?: number;
    /**
     * Vertical offset in source pixels.
     */
    offsetY?: number;
    /**
     * Preview width override.
     */
    width?: number;
    /**
     * Preview height override.
     */
    height?: number;
    /**
     * Optional imperative ref.
     */
    imperativeRef?: Ref<TexturePreviewImperativeRef>;
};

/**
 * Displays a 2D preview for a Babylon.js texture, including channels/cube face controls.
 * @param props The component properties.
 * @returns The rendered component.
 */
export const TexturePreview: FunctionComponent<TexturePreviewProps> = (props) => {
    const { texture, disableToolbar, maxWidth, maxHeight, offsetX, offsetY, width, height, imperativeRef } = props;
    const internalTexture = useProperty(texture, "_texture");
    const is3DTexture = !!internalTexture?.is3D;
    const depth = Math.max(internalTexture?.depth ?? 1, 1);
    const lodBaseSize = Math.max(1, Math.min(internalTexture?.width ?? 1, internalTexture?.height ?? 1, is3DTexture ? depth : Number.MAX_SAFE_INTEGER));
    const maxLod = internalTexture?.generateMipMaps ? Math.max(0, Math.floor(Math.log2(lodBaseSize))) : 0;
    const getPixelsAsync = useCallback(
        async (selection: TexturePreviewSelection) => {
            await WhenTextureReadyAsync(texture);
            const size = texture.getSize();
            let textureWidth = size.width || internalTexture?.width || 1;
            let textureHeight = size.height || internalTexture?.height || textureWidth;
            if (is3DTexture) {
                textureWidth = textureHeight = Math.max(1, Math.min(textureWidth, textureHeight));
            }
            const data = await ApplyChannelsToTextureDataAsync(
                texture,
                textureWidth,
                textureHeight,
                texture.is2DArray ? selection.layer : selection.face,
                selection.channels,
                selection.lod,
                selection.slice
            );
            return { width: textureWidth, height: textureHeight, data };
        },
        [texture, internalTexture, is3DTexture]
    );

    return (
        <TexturePreviewCore
            source={texture}
            kind={texture.isCube ? "cube" : texture.is2DArray ? "2d-array" : is3DTexture ? "3d" : "2d"}
            depth={depth}
            layerCount={texture.is2DArray && internalTexture ? internalTexture.depth : 0}
            maxLod={maxLod}
            refreshable={texture.isRenderTarget}
            getPixelsAsync={getPixelsAsync}
            disableToolbar={disableToolbar}
            maxWidth={maxWidth}
            maxHeight={maxHeight}
            offsetX={offsetX}
            offsetY={offsetY}
            width={width}
            height={height}
            imperativeRef={imperativeRef}
        />
    );
};
