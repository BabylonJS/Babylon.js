import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Button, Toolbar, ToolbarButton, makeStyles, shorthands } from "@fluentui/react-components";
import { useRef, useState, useEffect } from "react";
import type { FunctionComponent } from "react";
import { TextureHelper } from "./textureHelper";

const useStyles = makeStyles({
    root: { display: "flex", flexDirection: "column", gap: "8px" },
    controls: { display: "flex", gap: "4px", ...shorthands.padding("4px") },
    preview: { border: "1px solid #ccc", marginTop: "8px", maxWidth: "100%" },
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
    width: number;
    height: number;
    hideChannelSelect?: boolean;
};

export const TexturePreview: FunctionComponent<TexturePreviewProps> = (props) => {
    const { texture, width, height, hideChannelSelect } = props;
    const classes = useStyles();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [channels, setChannels] = useState(TextureChannelStates.ALL);
    const [face, setFace] = useState(0);

    const updatePreviewAsync = async () => {
        const previewCanvas = canvasRef.current!;
        const size = texture.getSize();
        const ratio = size.width / size.height;
        let w = width;
        let h = (w / ratio) | 1;
        const engine = texture.getScene()?.getEngine();

        if (engine && h > engine.getCaps().maxTextureSize) {
            w = size.width;
            h = size.height;
        }

        try {
            const data = await TextureHelper.GetTextureDataAsync(texture, w, h, face, channels);
            previewCanvas.width = w;
            previewCanvas.height = h;
            const context = previewCanvas.getContext("2d");
            if (context) {
                const imageData = context.createImageData(w, h);
                imageData.data.set(data);
                context.putImageData(imageData, 0, 0);
            }
            previewCanvas.style.height = h + "px";
        } catch {
            previewCanvas.width = w;
            previewCanvas.height = h;
            previewCanvas.style.height = h + "px";
        }
    };
    useEffect(() => {
        void updatePreviewAsync();
    }, [texture, width, height, face, channels]);

    return (
        <div className={classes.root}>
            {!hideChannelSelect && texture.isCube && (
                <Toolbar className={classes.controls} aria-label="Cube Faces">
                    {["+X", "-X", "+Y", "-Y", "+Z", "-Z"].map((label, idx) => (
                        <ToolbarButton key={label} appearance={face === idx ? "primary" : "subtle"} onClick={() => setFace(idx)}>
                            {label}
                        </ToolbarButton>
                    ))}
                </Toolbar>
            )}
            {!hideChannelSelect && !texture.isCube && (
                <Toolbar className={classes.controls} aria-label="Channels">
                    {(["R", "G", "B", "A", "ALL"] as const).map((ch) => (
                        <ToolbarButton key={ch} appearance={channels === TextureChannelStates[ch] ? "primary" : "subtle"} onClick={() => setChannels(TextureChannelStates[ch])}>
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
