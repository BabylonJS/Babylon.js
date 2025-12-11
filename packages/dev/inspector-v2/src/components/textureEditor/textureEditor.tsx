import type { FunctionComponent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { BaseTexture, ISize, PointerInfo, Scene, Vector2 } from "core/index";
import { Constants } from "core/Engines/constants";

import { makeStyles, tokens } from "@fluentui/react-components";

import type { IPixelData } from "./canvasManager";
import { TextureCanvasManager } from "./canvasManager";
import type { IChannel } from "./channels";
import { ChannelsBar } from "./channels";
import { PropertiesBar } from "./properties";
import { StatusBar } from "./status";
import type { ITool } from "./tools";
import { ToolBar, ToolSettings } from "./tools";
import { DefaultTools } from "./defaultTools/defaultTools";

/**
 * Parameters passed to tools for interaction with the texture editor
 */
export interface IToolParameters {
    /** The visible scene in the editor. Useful for adding pointer and keyboard events. */
    scene: Scene;
    /** The 2D canvas which you can sample pixel data from. Tools should not paint directly on this canvas. */
    canvas2D: HTMLCanvasElement;
    /** The 3D scene which tools can add post processes to. */
    scene3D: Scene;
    /** The size of the texture. */
    size: ISize;
    /** Pushes the editor texture back to the original scene. This should be called every time a tool makes any modification to a texture. */
    updateTexture: () => void;
    /** The metadata object which is shared between all tools. Feel free to store any information here. Do not set this directly: instead call setMetadata. */
    metadata: IMetadata;
    /** Call this when you want to mutate the metadata. */
    setMetadata: (data: any) => void;
    /** Returns the texture coordinates under the cursor */
    getMouseCoordinates: (pointerInfo: PointerInfo) => Vector2;
    /** Provides a canvas that you can use the canvas API to paint on. */
    startPainting: () => Promise<CanvasRenderingContext2D>;
    /** After you have painted on your canvas, call this method to push the updates back to the texture. */
    updatePainting: () => void;
    /** Call this when you are finished painting. */
    stopPainting: () => void;
    /** Returns whether the tool should be allowed to interact */
    interactionEnabled: () => boolean;
}

/**
 * Props for tool GUI components
 */
export interface IToolGUIProps {
    /** The tool instance */
    instance: IToolType;
}

/** An interface representing the definition of a tool */
export interface IToolData {
    /** Name to display on the toolbar */
    name: string;
    /** A class definition for the tool including setup and cleanup methods */
    type: IToolConstructable;
    /** Icon component to display in the toolbar */
    icon: React.ComponentType;
    /** Whether the tool uses postprocesses */
    is3D?: boolean;
    /** Optional system cursor name to use when tool is active (e.g. 'crosshair', 'pointer') */
    cursor?: string;
    /** Optional React component for tool-specific settings UI */
    settingsComponent?: React.ComponentType<IToolGUIProps>;
}

/**
 * Interface for tool implementations
 */
export interface IToolType {
    /** Called when the tool is selected. */
    setup: () => void;
    /** Called when the tool is deselected. */
    cleanup: () => void;
    /** Optional. Called when the user resets the texture or uploads a new texture. Tools may want to reset their state when this happens. */
    onReset?: () => void;
}

/** For constructable types, TS requires that you define a separate interface which constructs your actual interface */
interface IToolConstructable {
    new (getParameters: () => IToolParameters): IToolType;
}

/**
 * Metadata shared between tools in the texture editor
 */
export interface IMetadata {
    /** Current paint color in hex format */
    color: string;
    /** Current paint alpha value 0-1 */
    alpha: number;
    /** Current selection coordinates */
    select: {
        /** Left edge of selection */
        x1: number;
        /** Top edge of selection */
        y1: number;
        /** Right edge of selection */
        x2: number;
        /** Bottom edge of selection */
        y2: number;
    };
    /** Allow additional tool-specific metadata */
    [key: string]: any;
}

const useStyles = makeStyles({
    textureEditor: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: tokens.colorNeutralBackground1,
        color: tokens.colorNeutralForeground1,
        overflow: "hidden",
    },
    mainContent: {
        display: "flex",
        flex: 1,
        overflow: "hidden",
    },
    canvasContainer: {
        flex: 1,
        position: "relative",
        overflow: "hidden",
    },
    canvasUI: {
        width: "100%",
        height: "100%",
        outline: "none",
    },
    canvas2D: {
        display: "none",
    },
    canvas3D: {
        display: "none",
    },
    sidebarLeft: {
        display: "flex",
        flexDirection: "column",
    },
    sidebarRight: {
        display: "flex",
        flexDirection: "column",
    },
    toolSettingsContainer: {
        position: "absolute",
        right: tokens.spacingHorizontalM,
        bottom: tokens.spacingVerticalM,
        backgroundColor: tokens.colorNeutralBackground3,
        borderRadius: tokens.borderRadiusMedium,
        padding: tokens.spacingVerticalS,
        boxShadow: tokens.shadow8,
    },
});

interface ITextureEditorProps {
    texture: BaseTexture;
    window: Window;
    onUpdate: () => void;
}

const PREVIEW_UPDATE_DELAY_MS = 160;

/**
 * Main texture editor component
 * @param props - The texture editor properties
 * @returns The texture editor component
 */
export const TextureEditor: FunctionComponent<ITextureEditorProps> = (props) => {
    const { texture, window: editorWindow, onUpdate } = props;

    const classes = useStyles();

    // Canvas refs
    const uiCanvasRef = useRef<HTMLCanvasElement>(null);
    const canvas2DRef = useRef<HTMLCanvasElement>(null);
    const canvas3DRef = useRef<HTMLCanvasElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<number | null>(null);
    const canvasManagerRef = useRef<TextureCanvasManager | null>(null);

    // State
    const [tools, setTools] = useState<ITool[]>([]);
    const [activeToolIndex, setActiveToolIndex] = useState(-1);
    const [metadata, setMetadataState] = useState<IMetadata>({
        color: "#ffffff",
        alpha: 1,
        select: {
            x1: -1,
            y1: -1,
            x2: -1,
            y2: -1,
        },
    });
    const [channels, setChannels] = useState<IChannel[]>(() => {
        const baseChannels: IChannel[] = [
            { name: "Red", visible: true, editable: true, id: "R" },
            { name: "Green", visible: true, editable: true, id: "G" },
            { name: "Blue", visible: true, editable: true, id: "B" },
        ];
        baseChannels.push({
            name: texture.isCube ? "Display" : "Alpha",
            visible: true,
            editable: true,
            id: "A",
        });
        return baseChannels;
    });
    const [pixelData, setPixelData] = useState<IPixelData>({});
    const [face, setFace] = useState(0);
    const [mipLevel, setMipLevel] = useState(0);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [size, setSize] = useState<ISize>(texture.getSize());

    // Callbacks
    const textureDidUpdate = useCallback(() => {
        if (timerRef.current != null) {
            editorWindow.clearTimeout(timerRef.current);
        }
        timerRef.current = editorWindow.setTimeout(() => {
            onUpdate();
            timerRef.current = null;
        }, PREVIEW_UPDATE_DELAY_MS);
    }, [onUpdate, editorWindow]);

    const setMetadata = useCallback((newMetadata: any) => {
        setMetadataState((prev) => {
            const data = { ...prev, ...newMetadata };
            if (canvasManagerRef.current) {
                canvasManagerRef.current.metadata = data;
            }
            return data;
        });
    }, []);

    const getToolParameters = useCallback((): IToolParameters => {
        const manager = canvasManagerRef.current!;
        return {
            scene: manager.scene,
            canvas2D: manager.canvas2D,
            scene3D: manager.scene3D,
            size: manager.size,
            updateTexture: () => void manager.updateTexture(),
            // eslint-disable-next-line @typescript-eslint/promise-function-async
            startPainting: () => manager.startPainting(),
            stopPainting: () => manager.stopPainting(),
            updatePainting: () => manager.updatePainting(),
            metadata,
            setMetadata,
            getMouseCoordinates: (pointerInfo: PointerInfo) => manager.getMouseCoordinates(pointerInfo),
            interactionEnabled: () => manager.toolInteractionEnabled(),
        };
    }, [metadata, setMetadata]);

    const addTools = useCallback(
        (toolDataList: IToolData[]) => {
            setTools((prevTools) => {
                const newTools: ITool[] = toolDataList.map((toolData) => ({
                    ...toolData,
                    instance: new toolData.type(() => getToolParameters()),
                }));
                return [...prevTools, ...newTools];
            });
        },
        [getToolParameters]
    );

    const changeTool = useCallback(
        (index: number) => {
            if (canvasManagerRef.current) {
                if (index !== -1 && tools[index]) {
                    canvasManagerRef.current.tool = tools[index];
                } else {
                    canvasManagerRef.current.tool = null;
                }
            }
            setActiveToolIndex(index);
        },
        [tools]
    );

    const loadToolFromURL = useCallback(
        (_url: string) => {
            // This functionality can be implemented similar to the old inspector
            // For now, it's a placeholder
            // TODO: Implement dynamic tool loading
        },
        [addTools]
    );

    const saveTexture = useCallback(() => {
        canvasManagerRef.current?.saveTexture();
    }, []);

    const resetTexture = useCallback(() => {
        canvasManagerRef.current?.reset();
    }, []);

    const resizeTexture = useCallback((width: number, height: number) => {
        void canvasManagerRef.current?.resize({ width, height });
    }, []);

    const uploadTexture = useCallback((file: File) => {
        canvasManagerRef.current?.upload(file);
    }, []);

    const onPointerDown = useCallback(
        (evt: React.PointerEvent) => {
            if (!pickerRef.current?.contains(evt.target as Node)) {
                setPickerOpen(false);
            }
        },
        [pickerRef]
    );

    // Initialize canvas manager
    useEffect(() => {
        if (!uiCanvasRef.current || !canvas2DRef.current || !canvas3DRef.current) {
            return;
        }

        const manager = new TextureCanvasManager(
            texture,
            editorWindow,
            uiCanvasRef.current,
            canvas2DRef.current,
            canvas3DRef.current,
            setPixelData,
            metadata,
            textureDidUpdate,
            setMetadata,
            setMipLevel
        );

        canvasManagerRef.current = manager;
        setSize(manager.size);

        addTools(DefaultTools);

        return () => {
            manager.dispose();
            canvasManagerRef.current = null;
        };
    }, [texture, editorWindow]);

    // Update canvas manager when channels/face/mipLevel change
    useEffect(() => {
        if (canvasManagerRef.current) {
            canvasManagerRef.current.channels = [...channels];
        }
    }, [channels]);

    useEffect(() => {
        if (canvasManagerRef.current) {
            canvasManagerRef.current.face = face;
        }
    }, [face]);

    useEffect(() => {
        if (canvasManagerRef.current) {
            canvasManagerRef.current.mipLevel = mipLevel;
        }
    }, [mipLevel]);

    // Get current tool
    const currentTool: ITool | undefined = tools[activeToolIndex];

    // Compute cursor style
    let cursor = "default";
    if (canvasManagerRef.current && !canvasManagerRef.current.toolInteractionEnabled()) {
        cursor = "grab";
    } else if (currentTool?.cursor) {
        cursor = currentTool.cursor;
    }

    const hasAlpha = texture.textureFormat === -1 || texture.textureFormat === Constants.TEXTUREFORMAT_RGBA;

    return (
        <div className={classes.textureEditor} onPointerDown={onPointerDown} style={{ cursor }}>
            <PropertiesBar
                texture={texture}
                saveTexture={saveTexture}
                pixelData={pixelData}
                face={face}
                setFace={setFace}
                resetTexture={resetTexture}
                resizeTexture={resizeTexture}
                uploadTexture={uploadTexture}
                mipLevel={mipLevel}
                setMipLevel={setMipLevel}
                size={canvasManagerRef.current?.size || size}
            />
            <div className={classes.mainContent}>
                {!texture.isCube && (
                    <div className={classes.sidebarLeft}>
                        <ToolBar
                            tools={tools}
                            activeToolIndex={activeToolIndex}
                            addTool={loadToolFromURL}
                            changeTool={changeTool}
                            metadata={metadata}
                            setMetadata={setMetadata}
                            pickerOpen={pickerOpen}
                            setPickerOpen={setPickerOpen}
                            pickerRef={pickerRef}
                            hasAlpha={hasAlpha}
                        />
                    </div>
                )}
                <div className={classes.canvasContainer}>
                    <canvas ref={uiCanvasRef} className={classes.canvasUI} tabIndex={1} />
                    <canvas ref={canvas2DRef} className={classes.canvas2D} />
                    <canvas ref={canvas3DRef} className={classes.canvas3D} />
                    {currentTool?.settingsComponent && (
                        <div className={classes.toolSettingsContainer}>
                            <ToolSettings tool={currentTool} />
                        </div>
                    )}
                </div>
                <div className={classes.sidebarRight}>
                    <ChannelsBar channels={channels} setChannels={setChannels} />
                </div>
            </div>
            <StatusBar texture={texture} mipLevel={mipLevel} />
        </div>
    );
};
