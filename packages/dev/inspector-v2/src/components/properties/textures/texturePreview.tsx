import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Button, Toolbar, ToolbarButton, makeStyles, tokens } from "@fluentui/react-components";
import { useRef, useState, useEffect, useCallback, useContext } from "react";
import type { FunctionComponent } from "react";
import { GetTextureDataAsync, WhenTextureReadyAsync } from "core/Misc/textureTools";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import type { Texture } from "core/Materials";
import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";

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

/**
 * Defines which channels of the texture to retrieve with {@link TextureHelper.GetTextureDataAsync}.
 */
type TextureChannelsToDisplay = {
    /**
     * True if the red channel should be included.
     */
    R: boolean;
    /**
     * True if the green channel should be included.
     */
    G: boolean;
    /**
     * True if the blue channel should be included.
     */
    B: boolean;
    /**
     * True if the alpha channel should be included.
     */
    A: boolean;
};

/**
 * Gets the data of the specified texture by rendering it to an intermediate RGBA texture and retrieving the bytes from it.
 * This is convienent to get 8-bit RGBA values for a texture in a GPU compressed format.
 * @param texture the source texture
 * @param width the width of the result, which does not have to match the source texture width
 * @param height the height of the result, which does not have to match the source texture height
 * @param face if the texture has multiple faces, the face index to use for the source
 * @param channels a filter for which of the RGBA channels to return in the result
 * @param lod if the texture has multiple LODs, the lod index to use for the source
 * @returns the 8-bit texture data
 */
async function ApplyChannelsToTextureDataAsync(
    texture: BaseTexture,
    width: number,
    height: number,
    face: number,
    channels: TextureChannelsToDisplay,
    lod: number = 0
): Promise<Uint8Array> {
    const data = await GetTextureDataAsync(texture, width, height, face, lod);

    if (!channels.R || !channels.G || !channels.B || !channels.A) {
        for (let i = 0; i < width * height * 4; i += 4) {
            // If alpha is the only channel, just display alpha across all channels
            if (channels.A && !channels.R && !channels.G && !channels.B) {
                data[i] = data[i + 3];
                data[i + 1] = data[i + 3];
                data[i + 2] = data[i + 3];
                data[i + 3] = 255;
                continue;
            }
            let r = data[i],
                g = data[i + 1],
                b = data[i + 2],
                a = data[i + 3];
            // If alpha is not visible, make everything 100% alpha
            if (!channels.A) {
                a = 255;
            }
            // If only one color channel is selected, map both colors to it. If two are selected, the unused one gets set to 0
            if (!channels.R) {
                if (channels.G && !channels.B) {
                    r = g;
                } else if (channels.B && !channels.G) {
                    r = b;
                } else {
                    r = 0;
                }
            }
            if (!channels.G) {
                if (channels.R && !channels.B) {
                    g = r;
                } else if (channels.B && !channels.R) {
                    g = b;
                } else {
                    g = 0;
                }
            }
            if (!channels.B) {
                if (channels.R && !channels.G) {
                    b = r;
                } else if (channels.G && !channels.R) {
                    b = g;
                } else {
                    b = 0;
                }
            }
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = a;
        }
    }

    //To flip image on Y axis.
    if ((texture as Texture).invertY || texture.isCube) {
        const numberOfChannelsByLine = width * 4;
        const halfHeight = height / 2;
        for (let i = 0; i < halfHeight; i++) {
            for (let j = 0; j < numberOfChannelsByLine; j++) {
                const currentCell = j + i * numberOfChannelsByLine;
                const targetLine = height - i - 1;
                const targetCell = j + targetLine * numberOfChannelsByLine;

                const temp = data[currentCell];
                data[currentCell] = data[targetCell];
                data[targetCell] = temp;
            }
        }
    }
    return data;
}
