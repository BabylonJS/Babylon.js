import type { CSSProperties, FunctionComponent, Ref } from "react";

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
        display: "block",
        objectFit: "contain",
    },
    previewContainer: {
        display: "flex",
        justifyContent: "center",
        marginTop: tokens.spacingVerticalXS,
        marginBottom: tokens.spacingVerticalS,
        width: "100%",
        // Checkerboard background to show transparency
        backgroundSize: "32px 32px",
        backgroundColor: "white",
        backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 2'%3E%3Cpath fill='rgba(1.0,1.0,1.0,0.3)' fill-rule='evenodd' d='M0 0h1v1H0V0zm1 1h1v1H1V1z'/%3E%3C/svg%3E\")",
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
    disableToolbar?: boolean;
    maxWidth?: string;
    maxHeight?: string;
    offsetX?: number;
    offsetY?: number;
    width?: number;
    height?: number;
    imperativeRef?: Ref<TexturePreviewImperativeRef>;
};

export const TexturePreview: FunctionComponent<TexturePreviewProps> = (props) => {
    const { texture, disableToolbar = false, maxWidth = "100%", maxHeight = "384px", offsetX = 0, offsetY = 0, width, height, imperativeRef } = props;
    const classes = useStyles();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [channels, setChannels] = useState<(typeof TextureChannelStates)[keyof typeof TextureChannelStates]>(TextureChannelStates.ALL);
    const [face, setFace] = useState(0);
    const [canvasStyle, setCanvasStyle] = useState<CSSProperties>();
    const internalTexture = useProperty(texture, "_texture");

    const { size } = useContext(ToolContext);

    const updatePreviewAsync = useCallback(async () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        try {
            await WhenTextureReadyAsync(texture); // Ensure texture is loaded before grabbing size
            const { width: textureWidth, height: textureHeight } = texture.getSize();

            // Set canvas dimensions to the sub-region size
            canvas.width = width ?? textureWidth;
            canvas.height = height ?? textureHeight;

            // Calculate the width that corresponds to maxHeight while maintaining aspect ratio
            const aspectRatio = canvas.width / canvas.height;
            // Use CSS min() to pick the smaller of maxWidth or the width that corresponds to maxHeight
            const imageWidth = `min(${maxWidth}, calc(${maxHeight} * ${aspectRatio}))`;
            setCanvasStyle({ width: imageWidth });

            // Get full texture data, then draw only the sub-region
            const data = await ApplyChannelsToTextureDataAsync(texture, textureWidth, textureHeight, face, channels);
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
    }, [texture, face, channels, offsetX, offsetY, width, height, internalTexture]);

    useImperativeHandle(imperativeRef, () => ({ refresh: updatePreviewAsync }), [updatePreviewAsync]);

    useEffect(() => {
        void updatePreviewAsync();
    }, [updatePreviewAsync]);

    return (
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
            <div className={classes.previewContainer}>
                <canvas ref={canvasRef} className={classes.preview} style={canvasStyle} />
            </div>
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
