import { type CSSProperties, type FunctionComponent, type Ref, useCallback, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";

import { Body1, Label, Slider, Toolbar, ToolbarButton, makeStyles, tokens } from "@fluentui/react-components";

import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";
import { LineContainer } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { AccordionContext } from "shared-ui-components/fluent/primitives/accordion.contexts";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { DownloadBlob } from "../../../misc/download";
import { type TextureChannelsToDisplay } from "../../../misc/textureChannels";

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
        display: "flex",
        alignItems: "center",
        columnGap: tokens.spacingHorizontalS,
        marginTop: tokens.spacingVerticalXS,
        marginBottom: tokens.spacingVerticalXS,
    },
    slider: {
        flex: "1 1 0",
        minWidth: 0,
    },
    controlButton: {
        minWidth: "auto",
        flex: "1 1 0",
        paddingVertical: tokens.spacingVerticalXS,
        paddingHorizontal: tokens.spacingHorizontalS,
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    preview: {
        outline: `1px solid ${tokens.colorNeutralStroke1}`,
        display: "block",
        objectFit: "contain",
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

const TextureChannelStates = {
    R: { R: true, G: false, B: false, A: false },
    G: { R: false, G: true, B: false, A: false },
    B: { R: false, G: false, B: true, A: false },
    A: { R: false, G: false, B: false, A: true },
    ALL: { R: true, G: true, B: true, A: true },
} as const;

/** An imperative handle for refreshing the preview. */
export type TexturePreviewImperativeRef = {
    /** Refreshes the preview canvas. */
    refresh: () => Promise<void>;
};

/** The subresource and channels selected in the preview. @internal */
export type TexturePreviewSelection = Readonly<{
    face: number;
    layer: number;
    lod: number;
    slice: number;
    channels: TextureChannelsToDisplay;
}>;

/** Tightly packed RGBA8 pixels returned by a preview adapter. @internal */
export type TexturePreviewPixels = Readonly<{
    width: number;
    height: number;
    data: Uint8Array;
}>;

/** Runtime-neutral inputs for the texture preview. @internal */
export type TexturePreviewCoreProps = Readonly<{
    source: object;
    kind: "2d" | "2d-array" | "3d" | "cube";
    depth: number;
    layerCount: number;
    maxLod: number;
    refreshable?: boolean;
    getPixelsAsync: (selection: TexturePreviewSelection) => Promise<TexturePreviewPixels>;
    disableToolbar?: boolean;
    maxWidth?: string;
    maxHeight?: string;
    offsetX?: number;
    offsetY?: number;
    width?: number;
    height?: number;
    imperativeRef?: Ref<TexturePreviewImperativeRef>;
    downloadFileName?: string;
}>;

type PreviewRequest = TexturePreviewSelection &
    Readonly<{
        source: object;
        getPixelsAsync: TexturePreviewCoreProps["getPixelsAsync"];
        width?: number;
        height?: number;
        offsetX: number;
        offsetY: number;
    }>;

function IsSamePreview(a: PreviewRequest | undefined, b: PreviewRequest): boolean {
    return (
        a?.source === b.source &&
        a.getPixelsAsync === b.getPixelsAsync &&
        a.face === b.face &&
        a.layer === b.layer &&
        a.lod === b.lod &&
        a.slice === b.slice &&
        a.channels === b.channels &&
        a.width === b.width &&
        a.height === b.height &&
        a.offsetX === b.offsetX &&
        a.offsetY === b.offsetY
    );
}

/**
 * Displays pixels supplied by a runtime-specific texture adapter.
 * @param props The source, subresource information, and readback callback.
 * @returns The texture preview.
 * @internal
 */
export const TexturePreviewCore: FunctionComponent<TexturePreviewCoreProps> = (props) => {
    const {
        source,
        kind,
        depth,
        layerCount,
        maxLod,
        refreshable,
        getPixelsAsync,
        disableToolbar = false,
        maxWidth = "100%",
        maxHeight = "384px",
        offsetX = 0,
        offsetY = 0,
        width,
        height,
        imperativeRef,
        downloadFileName,
    } = props;
    const classes = useStyles();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mountedRef = useRef(false);
    const generationRef = useRef(0);
    const renderedSourceRef = useRef<object>();
    const [channels, setChannels] = useState<(typeof TextureChannelStates)[keyof typeof TextureChannelStates]>(TextureChannelStates.ALL);
    const [face, setFace] = useState(0);
    const [slice, setSlice] = useState(0);
    const [lod, setLod] = useState(0);
    const [layer, setLayer] = useState(0);
    const [canvasStyle, setCanvasStyle] = useState<CSSProperties>();
    const [pending, setPending] = useState(false);
    const [renderedPreview, setRenderedPreview] = useState<PreviewRequest>();
    const [previewError, setPreviewError] = useState<string>();
    const [downloadError, setDownloadError] = useState<string>();
    const safeMaxLod = Math.max(0, maxLod);
    const selectedLod = Math.min(lod, safeMaxLod);
    const maxSlice = Math.max(1, Math.floor(Math.max(depth, 1) / Math.pow(2, selectedLod))) - 1;
    const selectedSlice = Math.min(slice, maxSlice);
    const selectedLayer = Math.min(layer, Math.max(0, layerCount - 1));
    const selectedChannels = kind === "cube" ? TextureChannelStates.ALL : channels;
    const currentPreview: PreviewRequest = {
        source,
        getPixelsAsync,
        face,
        layer: selectedLayer,
        lod: selectedLod,
        slice: selectedSlice,
        channels: selectedChannels,
        width,
        height,
        offsetX,
        offsetY,
    };
    const currentPreviewRef = useRef(currentPreview);
    currentPreviewRef.current = currentPreview;
    const hasPixels = IsSamePreview(renderedPreview, currentPreview);
    const { size } = useContext(ToolContext);
    const accordionCtx = useContext(AccordionContext);
    const isPinned = accordionCtx?.state.pinnedIds.some((id) => id.endsWith("\0TexturePreview")) ?? false;

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            generationRef.current++;
        };
    }, []);

    useEffect(() => {
        setLayer((current) => Math.min(current, Math.max(0, layerCount - 1)));
    }, [layerCount]);

    useEffect(() => {
        setSlice((current) => Math.min(current, maxSlice));
    }, [maxSlice]);

    useEffect(() => {
        setLod((current) => Math.min(current, safeMaxLod));
    }, [safeMaxLod]);

    const updatePreviewAsync = useCallback(async () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const request: PreviewRequest = {
            source,
            getPixelsAsync,
            face,
            layer: selectedLayer,
            lod: selectedLod,
            slice: selectedSlice,
            channels: selectedChannels,
            width,
            height,
            offsetX,
            offsetY,
        };
        const generation = ++generationRef.current;
        const isCurrent = () => mountedRef.current && canvasRef.current === canvas && generationRef.current === generation && IsSamePreview(currentPreviewRef.current, request);
        if (renderedSourceRef.current !== source) {
            canvas.width = 0;
            canvas.height = 0;
        }
        setPending(true);
        setPreviewError(undefined);
        try {
            const pixels = await getPixelsAsync({ face, layer: selectedLayer, lod: selectedLod, slice: selectedSlice, channels: selectedChannels });
            if (!isCurrent()) {
                return;
            }
            if (
                !Number.isSafeInteger(pixels.width) ||
                pixels.width <= 0 ||
                !Number.isSafeInteger(pixels.height) ||
                pixels.height <= 0 ||
                pixels.data.length !== pixels.width * pixels.height * 4
            ) {
                throw new Error("The texture readback returned invalid RGBA pixel data.");
            }
            const canvasWidth = width ?? pixels.width;
            const canvasHeight = height ?? pixels.height;
            if (!Number.isSafeInteger(canvasWidth) || canvasWidth <= 0 || !Number.isSafeInteger(canvasHeight) || canvasHeight <= 0) {
                throw new Error("The texture preview dimensions must be positive integers.");
            }
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const context = canvas.getContext("2d");
            if (!context) {
                throw new Error("A 2D canvas is required to display the texture.");
            }
            const image = context.createImageData(pixels.width, pixels.height);
            image.data.set(pixels.data);
            context.putImageData(image, -offsetX, -offsetY, offsetX, offsetY, canvas.width, canvas.height);
            setCanvasStyle({ width: `min(${maxWidth}, calc(${maxHeight} * ${canvasWidth / canvasHeight}))` });
            renderedSourceRef.current = source;
            setRenderedPreview(request);
        } catch (error) {
            if (isCurrent()) {
                canvas.width = 0;
                canvas.height = 0;
                renderedSourceRef.current = undefined;
                setRenderedPreview(undefined);
                setPreviewError(error instanceof Error ? error.message : String(error));
            }
        } finally {
            if (isCurrent()) {
                setPending(false);
            }
        }
    }, [source, getPixelsAsync, face, selectedLayer, selectedLod, selectedSlice, selectedChannels, width, height, offsetX, offsetY, maxWidth, maxHeight]);

    useImperativeHandle(imperativeRef, () => ({ refresh: updatePreviewAsync }), [updatePreviewAsync]);

    useEffect(() => {
        void updatePreviewAsync();
        return () => {
            generationRef.current++;
        };
    }, [updatePreviewAsync, isPinned]);

    const downloadAsync = async () => {
        const canvas = canvasRef.current;
        if (!canvas || !downloadFileName || pending || !hasPixels) {
            return;
        }
        const request = currentPreviewRef.current;
        const generation = generationRef.current;
        setDownloadError(undefined);
        try {
            const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("PNG encoding failed."))), "image/png"));
            if (!mountedRef.current || !IsSamePreview(currentPreviewRef.current, request) || generationRef.current !== generation) {
                return;
            }
            const document = [canvas.ownerDocument, globalThis.document].find((candidate) => {
                const view = candidate?.defaultView;
                return view && !view.closed && view.document === candidate;
            });
            if (!document) {
                throw new Error("No active document is available for the texture download.");
            }
            DownloadBlob(blob, downloadFileName, document);
        } catch (error) {
            if (mountedRef.current && IsSamePreview(currentPreviewRef.current, request) && generationRef.current === generation) {
                setDownloadError(error instanceof Error ? error.message : String(error));
            }
        }
    };

    return (
        <LineContainer uniqueId="TexturePreview">
            <div className={classes.root}>
                {/* The compact toolbar and sliders preserve the existing preview layout, which property-line wrappers do not provide. */}
                {disableToolbar ? null : kind === "cube" ? (
                    <Toolbar className={classes.controls} size={size} aria-label="Cube Faces">
                        {["+X", "-X", "+Y", "-Y", "+Z", "-Z"].map((label, index) => (
                            <ToolbarButton
                                className={classes.controlButton}
                                key={label}
                                appearance={face === index ? "primary" : "subtle"}
                                aria-pressed={face === index}
                                onClick={() => setFace(index)}
                            >
                                {label}
                            </ToolbarButton>
                        ))}
                    </Toolbar>
                ) : (
                    <Toolbar className={classes.controls} size={size} aria-label="Channels">
                        {(["R", "G", "B", "A", "ALL"] as const).map((channel) => (
                            <ToolbarButton
                                className={classes.controlButton}
                                key={channel}
                                appearance={channels === TextureChannelStates[channel] ? "primary" : "subtle"}
                                aria-pressed={channels === TextureChannelStates[channel]}
                                onClick={() => setChannels(TextureChannelStates[channel])}
                            >
                                {channel}
                            </ToolbarButton>
                        ))}
                    </Toolbar>
                )}
                {kind === "3d" && (
                    <div className={classes.sliderContainer}>
                        <Label>
                            Slice: {selectedSlice} / {maxSlice}
                        </Label>
                        <Slider className={classes.slider} aria-label="Slice" min={0} max={maxSlice} step={1} value={selectedSlice} onChange={(_, data) => setSlice(data.value)} />
                    </div>
                )}
                {safeMaxLod > 0 && (
                    <div className={classes.sliderContainer}>
                        <Label>LOD: {selectedLod}</Label>
                        <Slider className={classes.slider} aria-label="LOD" min={0} max={safeMaxLod} step={1} value={selectedLod} onChange={(_, data) => setLod(data.value)} />
                    </div>
                )}
                <div className={classes.previewContainer}>
                    <canvas ref={canvasRef} className={classes.preview} style={canvasStyle} aria-label="Texture preview" aria-busy={pending} />
                </div>
                {!disableToolbar && kind === "2d-array" && layerCount > 0 && (
                    <SyncedSliderPropertyLine label="Layer" value={selectedLayer} onChange={setLayer} min={0} max={layerCount - 1} step={1} />
                )}
                {previewError ? <Body1 role="alert">{`Texture preview failed: ${previewError}`}</Body1> : null}
                {refreshable ? <Button label="Refresh" onClick={updatePreviewAsync} /> : null}
                {downloadFileName ? <Button label="Export Preview as PNG" onClick={downloadAsync} disabled={pending || !hasPixels} /> : null}
                {downloadError ? <Body1 role="alert">{`Texture export failed: ${downloadError}`}</Body1> : null}
            </div>
        </LineContainer>
    );
};
