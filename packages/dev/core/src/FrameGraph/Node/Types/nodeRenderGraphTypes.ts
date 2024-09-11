import type { Color4 } from "../../../Maths/math.color";
import type { Scene } from "../../../scene";
import type { FrameGraphObjectList, FrameGraphTextureId } from "../../../FrameGraph/frameGraphTypes";
import type { Camera } from "../../../Cameras/camera";

/**
 * Interface used to configure the node render graph editor
 */
export interface INodeRenderGraphEditorOptions {
    /** Define the URL to load node editor script from */
    editorURL?: string;
    /** Additional configuration for the FGE */
    nodeRenderGraphEditorConfig?: {
        backgroundColor?: Color4;
        hostScene?: Scene;
    };
}

/**
 * Options that can be passed to the node render graph build method
 */
export interface INodeRenderGraphCreateOptions {
    /** If true, textures created by the node render graph will be visible in the inspector, for easier debugging (default: false) */
    debugTextures?: boolean;
    /** Rebuild the node render graph when the screen is resized (default: true) */
    rebuildGraphOnEngineResize?: boolean;
    /** Defines if the build should log activity (default: false) */
    verbose?: boolean;
    /** Defines if the autoConfigure method should be called when initializing blocks (default: false) */
    autoConfigure?: boolean;
    /** If true, external inputs like object lists and cameras will be filled with default values, taken from the scene. Note that external textures are not concerned (default: true). */
    autoFillExternalInputs?: boolean;
}

/**
 * Defines the kind of connection point for node render graph nodes
 */
export enum NodeRenderGraphBlockConnectionPointTypes {
    /** General purpose texture */
    Texture = 0x00000001,
    /** Depth stencil attachment texture */
    TextureBackBuffer = 0x00000002,
    TextureBackBufferDepthStencilAttachment = 0x00000004,
    TextureDepthStencilAttachment = 0x00000008,
    TextureDepth = 0x00000010,
    TextureNormal = 0x00000020,
    TextureAlbedo = 0x00000040,
    TextureReflectivity = 0x00000080,
    TexturePosition = 0x00000100,
    TextureVelocity = 0x00000200,
    TextureIrradiance = 0x00000400,
    TextureAlbedoSqrt = 0x00000800,

    TextureAllButBackBufferDepthStencil = 0x00fffffb,
    TextureAllButBackBuffer = 0x00fffff9,
    TextureAll = 0x00ffffff,

    /** Camera */
    Camera = 0x01000000,
    /** List of objects (meshes, particle systems, sprites) */
    ObjectList = 0x02000000,

    /** Detect type based on connection */
    AutoDetect = 0x10000000,
    /** Output type that will be defined by input type */
    BasedOnInput = 0x20000000,
    /** Undefined */
    Undefined = 0x40000000,
    /** Bitmask of all types */
    All = 0xffffffff,
}

/**
 * Enum used to define the compatibility state between two connection points
 */
export const enum NodeRenderGraphConnectionPointCompatibilityStates {
    /** Points are compatibles */
    Compatible,
    /** Points are incompatible because of their types */
    TypeIncompatible,
    /** Points are incompatible because they are in the same hierarchy **/
    HierarchyIssue,
}

/**
 * Defines the direction of a connection point
 */
export const enum NodeRenderGraphConnectionPointDirection {
    /** Input */
    Input,
    /** Output */
    Output,
}

export type NodeRenderGraphBlockConnectionPointValueType = FrameGraphTextureId | Camera | FrameGraphObjectList;
