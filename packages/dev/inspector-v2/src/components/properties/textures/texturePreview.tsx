import type { FunctionComponent, Ref } from "react";

import type { BaseTexture } from "core/index";

import { Button, Toolbar, ToolbarButton, makeStyles, tokens } from "@fluentui/react-components";
import { useCallback, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";

import { WhenTextureReadyAsync } from "core/Misc/textureTools";
import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";
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
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        marginTop: tokens.spacingVerticalXS,
        maxWidth: "100%",
        marginLeft: "auto",
        marginRight: "auto",
        marginBottom: tokens.spacingVerticalS,
        display: "block",
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
    refresh: () => Promise<void>;
};

export type TexturePreviewProps = {
    texture: BaseTexture;
    width: number;
    height: number;
    imperativeRef?: Ref<TexturePreviewImperativeRef>;
};

export const TexturePreview: FunctionComponent<TexturePreviewProps> = (props) => {
    let { width, height } = props;
    const { texture, imperativeRef } = props;
    const classes = useStyles();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [channels, setChannels] = useState<(typeof TextureChannelStates)[keyof typeof TextureChannelStates]>(TextureChannelStates.ALL);
    const [face, setFace] = useState(0);
    const internalTexture = useProperty(texture, "_texture");

    const { size } = useContext(ToolContext);

    const updatePreviewCanvasSize = useCallback(
        (previewCanvas: HTMLCanvasElement) => {
            // This logic was brought over from inspectorv1 and can likely be refactored/simplified
            const size = texture.getSize();
            const ratio = size.width / size.height;
            height = (width / ratio) | 1;
            const engine = texture.getScene()?.getEngine();

            if (engine && height > engine.getCaps().maxTextureSize) {
                width = size.width;
                height = size.height;
            }

            if (width !== previewCanvas.width || height !== previewCanvas.height) {
                previewCanvas.width = width;
                previewCanvas.height = height;
                previewCanvas.style.width = width + "px";
                previewCanvas.style.height = height + "px";
            }

            return {
                width,
                height,
            };
        },
        [canvasRef.current, texture, width, height, internalTexture]
    );

    const updatePreviewAsync = useCallback(async () => {
        const previewCanvas = canvasRef.current;
        if (!previewCanvas) {
            return;
        }
        try {
            await WhenTextureReadyAsync(texture); // Ensure texture is loaded before grabbing size
            const { width, height } = updatePreviewCanvasSize(previewCanvas); // Grab desired size
            const data = await ApplyChannelsToTextureDataAsync(texture, width, height, face, channels); // get channel data to load onto canvas context
            const context = previewCanvas.getContext("2d");
            if (context) {
                const imageData = context.createImageData(width, height);
                imageData.data.set(data);
                context.putImageData(imageData, 0, 0);
            }
        } catch {
            updatePreviewCanvasSize(previewCanvas); // If we fail above, best effort sizing preview canvas
        }
    }, [[texture, width, height, face, channels, internalTexture]]);

    useImperativeHandle(imperativeRef, () => ({ refresh: updatePreviewAsync }), [updatePreviewAsync]);

    useEffect(() => {
        void updatePreviewAsync();
    }, [texture, width, height, face, channels, internalTexture]);

    return (
        <div className={classes.root}>
            {texture.isCube ? (
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
            <canvas ref={canvasRef} className={classes.preview} />
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
    );
};
