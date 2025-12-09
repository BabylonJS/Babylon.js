import type { FunctionComponent } from "react";

import type { BaseTexture } from "core/index";

import { Button, Toolbar, ToolbarButton, makeStyles, tokens } from "@fluentui/react-components";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

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

type TexturePreviewProps = {
    texture: BaseTexture;
    width: number;
    height: number;
};

export const TexturePreview: FunctionComponent<TexturePreviewProps> = (props) => {
    const { texture, width, height } = props;
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
            let w = width;
            let h = (w / ratio) | 1;
            const engine = texture.getScene()?.getEngine();

            if (engine && h > engine.getCaps().maxTextureSize) {
                w = size.width;
                h = size.height;
            }

            previewCanvas.width = w;
            previewCanvas.height = h;
            previewCanvas.style.width = w + "px";
            previewCanvas.style.height = h + "px";

            return {
                w: w,
                h: h,
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
            const { w, h } = updatePreviewCanvasSize(previewCanvas); // Grab desired size
            const data = await ApplyChannelsToTextureDataAsync(texture, w, h, face, channels); // get channel data to load onto canvas context
            const context = previewCanvas.getContext("2d");
            if (context) {
                const imageData = context.createImageData(w, h);
                imageData.data.set(data);
                context.putImageData(imageData, 0, 0);
            }
        } catch {
            updatePreviewCanvasSize(previewCanvas); // If we fail above, best effort sizing preview canvas
        }
    }, [[texture, width, height, face, channels, internalTexture]]);

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
