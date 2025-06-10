// eslint-disable-next-line import/no-internal-modules
import type { Color4, Scene, FrameGraphTextureHandle, Camera, FrameGraphObjectList, IShadowLight, FrameGraphShadowGeneratorTask, FrameGraphObjectRendererTask } from "core/index";

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
    /** Back buffer color texture */
    TextureBackBuffer = 0x00000002,
    /** Back buffer depth/stencil attachment */
    TextureBackBufferDepthStencilAttachment = 0x00000004,
    /** Depth/stencil attachment */
    TextureDepthStencilAttachment = 0x00000008,
    /** Depth (in view space) geometry texture */
    TextureViewDepth = 0x00000010,
    /** Normal (in view space) geometry texture */
    TextureViewNormal = 0x00000020,
    /** Albedo geometry texture */
    TextureAlbedo = 0x00000040,
    /** Reflectivity geometry texture */
    TextureReflectivity = 0x00000080,
    /** Position (in world space) geometry texture */
    TextureWorldPosition = 0x00000100,
    /** Velocity geometry texture */
    TextureVelocity = 0x00000200,
    /** Irradiance geometry texture */
    TextureIrradiance = 0x00000400,
    /** Albedo (sqrt) geometry texture */
    TextureAlbedoSqrt = 0x00000800,
    /** Depth (in screen space) geometry texture */
    TextureScreenDepth = 0x00001000,
    /** Normal (in world space) geometry texture */
    TextureWorldNormal = 0x00002000,
    /** Position (in local space) geometry texture */
    TextureLocalPosition = 0x00004000,
    /** Linear velocity geometry texture */
    TextureLinearVelocity = 0x00008000,
    /** Normalied depth (in view space) geometry texture */
    TextureNormalizedViewDepth = 0x00010000,

    /** Bit field for all textures but back buffer depth/stencil */
    TextureAllButBackBufferDepthStencil = 0x000ffffb,
    /** Bit field for all textures but back buffer color and depth/stencil */
    TextureAllButBackBuffer = 0x000ffff9,
    /** Bit field for all textures */
    TextureAll = 0x000fffff,

    /** Resource container */
    ResourceContainer = 0x00100000,
    /** Shadow generator */
    ShadowGenerator = 0x00200000,
    /** Light */
    ShadowLight = 0x00400000,
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
    /** Custom object */
    Object = 0x80000000,
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

/**
 * Defines the type of a connection point value
 */
export type NodeRenderGraphBlockConnectionPointValueType =
    | FrameGraphTextureHandle
    | Camera
    | FrameGraphObjectList
    | IShadowLight
    | FrameGraphShadowGeneratorTask
    | FrameGraphObjectRendererTask;
