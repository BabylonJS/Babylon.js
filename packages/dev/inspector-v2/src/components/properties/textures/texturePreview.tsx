import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Button, Toolbar, ToolbarButton, makeStyles, shorthands } from "@fluentui/react-components";
import { useRef, useState, useEffect, useCallback } from "react";
import type { FunctionComponent } from "react";
import { ApplyChannelsToTextureDataAsync } from "./textureHelper";
import type { Nullable } from "core/types";

const useStyles = makeStyles({
    root: { display: "flex", flexDirection: "column", gap: "8px" },
    controls: {
        display: "flex",
        gap: "2px",
        ...shorthands.padding("2px"),
        width: "100%",
        justifyContent: "center", // Center the buttons
    },
    controlButton: {
        minWidth: "auto",
        flex: "1 1 0", // Equal flex grow/shrink with 0 basis
        ...shorthands.padding("4px", "8px"), // Reasonable padding
        fontSize: "inherit", // Use default font size
        overflow: "hidden", // Prevent text overflow
        textOverflow: "ellipsis", // Add ellipsis if needed
    },
    preview: {
        border: "1px solid #ccc",
        marginTop: "8px",
        maxWidth: "100%",
        marginLeft: "auto", // Center horizontally
        marginRight: "auto", // Center horizontally
        display: "block", // Ensure it's a block element
    },
});

const TextureChannelStates = {
    R: { R: true, G: false, B: false, A: false },
    G: { R: false, G: true, B: false, A: false },
    B: { R: false, G: false, B: true, A: false },
    A: { R: false, G: false, B: false, A: true },
    ALL: { R: true, G: true, B: true, A: true },
};

type TexturePreviewProps = {
    texture: BaseTexture;
    url: Nullable<string>;
    width: number;
    height: number;
    hideChannelSelect?: boolean;
};

export const TexturePreview: FunctionComponent<TexturePreviewProps> = (props) => {
    const { texture, width, height, hideChannelSelect, url } = props;
    const classes = useStyles();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [channels, setChannels] = useState(TextureChannelStates.ALL);
    const [face, setFace] = useState(0);

    const updatePreviewCanvasSize = useCallback(
        (previewCanvas: HTMLCanvasElement) => {
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
        [canvasRef.current, texture, width, height, url]
    );

    const updatePreviewAsync = useCallback(async () => {
        if (!canvasRef.current) {
            return;
        }
        const previewCanvas = canvasRef.current!;
        try {
            const data = await ApplyChannelsToTextureDataAsync(texture, face, channels);
            // @alex we are never reaching this line, the internal promise never resolves
            const { w, h } = updatePreviewCanvasSize(previewCanvas);

            const context = previewCanvas.getContext("2d");
            if (context) {
                const imageData = context.createImageData(w, h);
                imageData.data.set(data);
                context.putImageData(imageData, 0, 0);
            }
        } catch {
            updatePreviewCanvasSize(previewCanvas);
        }
    }, [[texture, width, height, face, channels, url]]);

    useEffect(() => {
        void updatePreviewAsync();
    }, [texture, width, height, face, channels, url]);

    return (
        <div className={classes.root}>
            {!hideChannelSelect && texture.isCube && (
                <Toolbar className={classes.controls} aria-label="Cube Faces">
                    {["+X", "-X", "+Y", "-Y", "+Z", "-Z"].map((label, idx) => (
                        <ToolbarButton className={classes.controlButton} key={label} appearance={face === idx ? "primary" : "subtle"} onClick={() => setFace(idx)}>
                            {label}
                        </ToolbarButton>
                    ))}
                </Toolbar>
            )}
            {!hideChannelSelect && !texture.isCube && (
                <Toolbar className={classes.controls} aria-label="Channels">
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
