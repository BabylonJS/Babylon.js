import type { ISize, PointerInfo, Scene, Vector2 } from "core/index";

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

export interface IToolGUIProps {
    instance: IToolType;
}

/** An interface representing the definition of a tool */
export interface IToolData {
    /** Name to display on the toolbar */
    name: string;
    /** A class definition for the tool including setup and cleanup methods */
    type: IToolConstructable;
    /**  An SVG icon encoded in Base64 */
    icon: string;
    /** Whether the tool uses postprocesses */
    is3D?: boolean;
    cursor?: string;
    settingsComponent?: React.ComponentType<IToolGUIProps>;
}

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

export interface IMetadata {
    color: string;
    alpha: number;
    select: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    };
    [key: string]: any;
}
