import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Button, Toolbar, ToolbarButton, makeStyles, tokens } from "@fluentui/react-components";
import { useRef, useState, useEffect, useCallback, useContext } from "react";
import type { CSSProperties, FunctionComponent } from "react";
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
        display: "block",
        objectFit: "contain",
    },
    previewContainer: {
        display: "flex",
        justifyContent: "center",
        marginTop: tokens.spacingVerticalXS,
        marginBottom: tokens.spacingVerticalS,
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

type TexturePreviewProps = {
    texture: BaseTexture;
    disableToolbar?: boolean;
    maxWidth?: string;
    maxHeight?: string;
    offsetX?: number;
    offsetY?: number;
    width?: number;
    height?: number;
};

export const TexturePreview: FunctionComponent<TexturePreviewProps> = (props) => {
    const { texture, disableToolbar = false, maxWidth = "100%", maxHeight = "384px", offsetX = 0, offsetY = 0, width, height } = props;
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
