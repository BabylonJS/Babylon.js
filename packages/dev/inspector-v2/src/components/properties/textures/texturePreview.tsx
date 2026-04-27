import { type CSSProperties, type FunctionComponent, type Ref, useCallback, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";

import { type BaseTexture } from "core/index";

import { Button, Label, Slider, Toolbar, ToolbarButton, makeStyles, tokens } from "@fluentui/react-components";

import { Clamp } from "core/Maths/math.scalar.functions";
import { WhenTextureReadyAsync } from "core/Misc/textureTools";
import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";
import { LineContainer } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { AccordionContext } from "shared-ui-components/fluent/primitives/accordion.contexts";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { ApplyChannelsToTextureDataAsync } from "../../../misc/textureTools";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
    },
    controls: {
        display: "flex",
        gap: tokens.spacingHorizontalXS,
        padding: 0,
    },
    sliderContainer: {
        marginTop: tokens.spacingVerticalXS,
        marginBottom: tokens.spacingVerticalXS,
    },
    controlButton: {
        minWidth: "auto",
        flex: "1 1 0", // Equal flex grow/shrink with 0 basis
        paddingVertical: tokens.spacingVerticalXS,
        paddingHorizontal: tokens.spacingHorizontalS,
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    preview: {
        outline: `1px solid ${tokens.colorNeutralStroke1}`,
        display: "block",
        objectFit: "contain",
        // Checkerboard background to show transparency
        background: "repeating-conic-gradient(#B2B2B2 0% 25%, white 25% 50%) 50% / 32px 32px",
    },
    previewContainer: {
        display: "flex",
        justifyContent: "center",
        marginTop: tokens.spacingVerticalXS,
        marginBottom: tokens.spacingVerticalXS,
        width: "100%",
    },
});

// This method of holding TextureChannels was brought over from inspectorv1 and can likely be refactored/simplified
const TextureChannelStates = {
    R: { R: true, G: false, B: false, A: false },
    G: { R: false, G: true, B: false, A: false },
    B: { R: false, G: false, B: true, A: false },
    A: { R: false, G: false, B: false, A: true },
    ALL: { R: true, G: true, B: true, A: true },
} as const;

export type TexturePreviewImperativeRef = {
    /**
     * Refreshes the preview canvas.
     */
    refresh: () => Promise<void>;
};

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
 * Displays a 2D preview for a texture, including channels/cube face controls.
 * @param props The component properties.
 * @returns The rendered component.
 */
export const TexturePreview: FunctionComponent<TexturePreviewProps> = (props) => {
    const { texture, disableToolbar = false, maxWidth = "100%", maxHeight = "384px", offsetX = 0, offsetY = 0, width, height, imperativeRef } = props;
    const classes = useStyles();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [channels, setChannels] = useState<(typeof TextureChannelStates)[keyof typeof TextureChannelStates]>(TextureChannelStates.ALL);
    const [face, setFace] = useState(0);
    const [slice, setSlice] = useState(0);
    const [lod, setLod] = useState(0);
    const [layer, setLayer] = useState(0);
    const [canvasStyle, setCanvasStyle] = useState<CSSProperties>();
    const internalTexture = useProperty(texture, "_texture");
    const is3DTexture = !!internalTexture?.is3D;
    const baseDepth = Math.max(internalTexture?.depth ?? 1, 1);
    const lodDepth = Math.max(1, Math.floor(baseDepth / Math.pow(2, lod)));
    const maxSlice = lodDepth - 1;
    const lodBaseSize = Math.max(1, Math.min(internalTexture?.width ?? 1, internalTexture?.height ?? 1, is3DTexture ? (internalTexture?.depth ?? 1) : Number.MAX_SAFE_INTEGER));
    const maxLod = internalTexture?.generateMipMaps ? Math.max(0, Math.floor(Math.log2(lodBaseSize))) : 0;

    const showLayerDropdown = texture.is2DArray;

    const layerCount = texture.is2DArray && internalTexture ? internalTexture.depth : 0;

    useEffect(() => {
        setLayer((layer) => Clamp(layer, 0, Math.max(0, layerCount - 1)));
    }, [layerCount]);

    const { size } = useContext(ToolContext);

    // Watch for pinned state changes - when portaled, the canvas needs to be redrawn
    const accordionCtx = useContext(AccordionContext);
    const isPinned = accordionCtx?.state.pinnedIds.some((id) => id.endsWith("\0TexturePreview")) ?? false;

    const updatePreviewAsync = useCallback(async () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        try {
            await WhenTextureReadyAsync(texture); // Ensure texture is loaded before grabbing size
            const size = texture.getSize();
            let textureWidth = size.width || internalTexture?.width || 1;
            let textureHeight = size.height || internalTexture?.height || textureWidth;

            if (is3DTexture) {
                const squareSize = Math.max(1, Math.min(textureWidth, textureHeight));
                textureWidth = squareSize;
                textureHeight = squareSize;
            }

            // Calculate canvas dimensions
            const canvasWidth = width ?? textureWidth;
            const canvasHeight = height ?? textureHeight;

            // Calculate the width that corresponds to maxHeight while maintaining aspect ratio
            const aspectRatio = canvasWidth / canvasHeight;
            // Use CSS min() to pick the smaller of maxWidth or the width that corresponds to maxHeight
            const imageWidth = `min(${maxWidth}, calc(${maxHeight} * ${aspectRatio}))`;
            setCanvasStyle({ width: imageWidth });

            // Fetch texture data BEFORE clearing the canvas to avoid flicker
            const data = await ApplyChannelsToTextureDataAsync(texture, textureWidth, textureHeight, texture.is2DArray ? layer : face, channels, lod, slice);

            // Now set canvas dimensions (this clears the canvas) and draw immediately
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            const context = canvas.getContext("2d");
            if (context) {
                const fullImageData = context.createImageData(textureWidth, textureHeight);
                fullImageData.data.set(data);
                // Use putImageData with dirty rect to draw only the sub-region
                context.putImageData(fullImageData, -offsetX, -offsetY, offsetX, offsetY, canvas.width, canvas.height);
            }
        } catch {
            // If we fail, leave the canvas empty
        }
    }, [texture, face, channels, lod, slice, offsetX, offsetY, width, height, internalTexture, layer]);

    useEffect(() => {
        if (!is3DTexture || slice <= maxSlice) {
            return;
        }

        setSlice(maxSlice);
    }, [is3DTexture, maxSlice, slice]);

    useEffect(() => {
        if (lod <= maxLod) {
            return;
        }

        setLod(maxLod);
    }, [lod, maxLod]);

    useImperativeHandle(imperativeRef, () => ({ refresh: updatePreviewAsync }), [updatePreviewAsync]);

    useEffect(() => {
        void updatePreviewAsync();
    }, [updatePreviewAsync]);

    // Redraw canvas after portaling (pinned state change moves DOM element, which can clear canvas)
    useEffect(() => {
        void updatePreviewAsync();
    }, [isPinned]);

    return (
        <LineContainer uniqueId="TexturePreview">
            <div className={classes.root}>
                {disableToolbar ? null : texture.isCube ? (
                    <Toolbar className={classes.controls} size={size} aria-label="Cube Faces">
                        {["+X", "-X", "+Y", "-Y", "+Z", "-Z"].map((label, idx) => (
                            <ToolbarButton className={classes.controlButton} key={label} appearance={face === idx ? "primary" : "subtle"} onClick={() => setFace(idx)}>
                                {label}
                            </ToolbarButton>
                        ))}
                    </Toolbar>
                ) : (
                    <Toolbar className={classes.controls} size={size} aria-label="Channels">
                        {(["R", "G", "B", "A", "ALL"] as const).map((ch) => (
                            <ToolbarButton
                                className={classes.controlButton}
                                key={ch}
                                appearance={channels === TextureChannelStates[ch] ? "primary" : "subtle"}
                                onClick={() => setChannels(TextureChannelStates[ch])}
                            >
                                {ch}
                            </ToolbarButton>
                        ))}
                    </Toolbar>
                )}
                {is3DTexture && (
                    <div className={classes.sliderContainer}>
                        <Label>
                            Slice: {slice} / {maxSlice}
                        </Label>
                        <Slider min={0} max={maxSlice} step={1} value={slice} onChange={(_, data) => setSlice(data.value)} />
                    </div>
                )}
                {maxLod > 0 && (
                    <div className={classes.sliderContainer}>
                        <Label>LOD: {lod}</Label>
                        <Slider min={0} max={maxLod} step={1} value={lod} onChange={(_, data) => setLod(data.value)} />
                    </div>
                )}
                <div className={classes.previewContainer}>
                    <canvas ref={canvasRef} className={classes.preview} style={canvasStyle} />
                </div>
                {!disableToolbar && showLayerDropdown && layerCount > 0 && (
                    <SyncedSliderPropertyLine label="Layer" value={layer} onChange={setLayer} min={0} max={layerCount - 1} step={1} />
                )}
                {texture.isRenderTarget && (
                    <Button
                        appearance="outline"
                        onClick={() => {
                            void updatePreviewAsync();
                        }}
                    >
                        Refresh
                    </Button>
                )}
            </div>
        </LineContainer>
    );
};
