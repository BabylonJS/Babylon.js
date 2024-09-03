import type { Nullable } from "../types";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { IParticleSystem } from "../Particles/IParticleSystem";
import type { RenderTargetCreationOptions, TextureSize } from "../Materials/Textures/textureCreationOptions";
import type { FrameGraphContext } from "./frameGraphContext";
import type { FrameGraph } from "./frameGraph";
import type { FrameGraphTaskInternals } from "./Tasks/taskInternals";

export type FrameGraphTextureHandle = number;

export const backbufferColorTextureHandle: FrameGraphTextureHandle = 0;

export const backbufferDepthStencilTextureHandle: FrameGraphTextureHandle = 1;

export type FrameGraphTaskOutputReference = [IFrameGraphTask, string];

export type FrameGraphTextureId = FrameGraphTaskOutputReference | FrameGraphTextureHandle;

export type FrameGraphTextureCreationOptions = {
    /** Size of the render target texture. If sizeIsPercentage is true, these are percentages relative to the screen size */
    size: TextureSize;
    /** Options used to create the render target texture */
    options: RenderTargetCreationOptions;
    /** If true, indicates that "size" is percentages relative to the screen size */
    sizeIsPercentage: boolean;
};

export type FrameGraphTextureDescription = {
    size: { width: number; height: number };
    options: RenderTargetCreationOptions;
};

export type FrameGraphObjectList = {
    meshes: AbstractMesh[];
    particleSystems: IParticleSystem[];
};

export type FrameGraphObjectListId = FrameGraphTaskOutputReference | FrameGraphObjectList;

/**
 * Interface used to indicate that the class can be used as a task in a frame graph.
 */
export interface IFrameGraphTask {
    /**
     * Use this function to add content (render passes, ...) to the task
     * @param frameGraph The frame graph
     */
    recordFrameGraph(frameGraph: FrameGraph): void;

    isReadyFrameGraph(): boolean;

    disposeFrameGraph(): void;

    name: string;

    disabled: boolean;

    /** @internal */
    _fgInternals?: FrameGraphTaskInternals;
}

export interface IFrameGraphPass {
    name: string;
    setExecuteFunc(func: (context: FrameGraphContext) => void): void;
    _execute(): void;
    _isValid(): Nullable<string>;
}
