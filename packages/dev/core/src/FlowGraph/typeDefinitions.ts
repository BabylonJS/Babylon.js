import type { IAnimatable } from "core/Animations/animatable.interface";
import type { Animation } from "core/Animations/animation";
import type { FlowGraphConnectionType } from "./flowGraphConnection";

/**
 * Interpolation generator
 */
export interface IInterpolationPropertyInfo {
    /**
     * type of the interpolation
     */
    type: number;
    /**
     * The name of the property
     */
    name: string;
    /** @internal */
    getValue: (target: any, source: Float32Array, offset: number, scale: number) => any;
    /** @internal */
    getStride: (target: any) => number;
    /**
     * @internal
     */
    buildAnimations(target: any, name: string, fps: number, keys: any[]): { babylonAnimatable: IAnimatable; babylonAnimation: Animation }[];
}

/**
 * An accessor that allows modifying properties on some other object.
 */
export interface IObjectAccessor<GLTFTargetType = any, BabylonTargetType = any, BabylonValueType = any> {
    /**
     * The number of components that are changed in the property when setting this value.
     * This will usually be 1. But, for example, Babylon has both orthoLeft and orthoRight (two components) properties that are changed when setting xmag (single value in glTF).
     * Defaults to 1 if not provided!
     */
    componentsCount?: number;
    /**
     * The (babylon) type of the property.
     */
    type: string;
    /**
     * Get the value of the property.
     */
    get: (target: GLTFTargetType, index?: number, payload?: any) => BabylonValueType | undefined;
    /**
     * Get the target of the property.
     */
    getTarget: (target: GLTFTargetType, index?: number, payload?: any) => BabylonTargetType | undefined;
    /**
     * is the property readonly?
     */
    isReadOnly?: boolean;
    /**
     * @deprecated Use get instead
     */
    getPropertyName?: Array<(target: GLTFTargetType) => string>;
    /**
     * Set a new value to the property.
     * @param newValue the new value to set
     * @param target the target object
     * @param index the index of the target object in the array (optional)
     */
    set?: (newValue: BabylonValueType, target: GLTFTargetType, index?: number, payload?: any) => void;
    /**
     * Interpolation/animation information for the property.
     * This is an array that can be used to animate the value over time.
     */
    interpolation?: IInterpolationPropertyInfo[];
}

/**
 * A Serialized Flow Graph Context
 */
export interface ISerializedFlowGraphContext {
    /**
     * The unique id of the context
     */
    uniqueId: string;
    /**
     * User variables
     */
    _userVariables: { [key: string]: any };
    /**
     * Values of the connection points
     */
    _connectionValues: { [key: string]: any };

    /**
     * Assets context, if not the scene
     */
    _assetsContext?: { [key: string]: any };

    /**
     * Should logging be enabled?
     */
    enableLogging?: boolean;
}

/**
 * A Serialized Flow Graph Connection
 */
export interface ISerializedFlowGraphConnection {
    /**
     * The unique id of the connection
     */
    uniqueId: string;
    /**
     * The name of the connection
     */
    name: string;
    /**
     * The type of the connection
     */
    _connectionType: FlowGraphConnectionType;
    /**
     * The id of the connection that this is connected to
     */
    connectedPointIds: string[];
}

/**
 * A Serialized Flow Graph Block
 */
export interface ISerializedFlowGraphBlock {
    /**
     * The class name of the block
     */
    className: string;
    /**
     * The glTF type of the block
     */
    type: string;
    /**
     * Configuration parameters for the block
     */
    config: any;
    /**
     * The unique id of the block
     */
    uniqueId: string;
    /**
     * Input connection data
     */
    dataInputs: ISerializedFlowGraphConnection[];
    /**
     * Output connection data
     */
    dataOutputs: ISerializedFlowGraphConnection[];
    /**
     * Metadata for the block
     */
    metadata: any;
    /**
     * Input connection signal
     */
    signalInputs: ISerializedFlowGraphConnection[];
    /**
     * Output connection signal
     */
    signalOutputs: ISerializedFlowGraphConnection[];
}

/**
 * A Serialized Flow Graph
 */
export interface ISerializedFlowGraph {
    /**
     * Contexts belonging to the flow graph
     */
    executionContexts: ISerializedFlowGraphContext[];
    /**
     * Blocks belonging to the flow graph
     */
    allBlocks: ISerializedFlowGraphBlock[];

    /**
     * Is the flow graph in RHS mode?
     */
    rightHanded?: boolean;
}
