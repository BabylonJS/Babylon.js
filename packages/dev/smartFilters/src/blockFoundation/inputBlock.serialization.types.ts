import type { Nullable } from "core/types.js";
import type { ConnectionPointType } from "../connection/connectionPointType.js";
import type { IColor3Like, IColor4Like, IVector2Like } from "core/Maths/math.like.js";

/**
 * Data that all serialized InputBlocks share
 */
export type CommonInputBlockData = {
    /**
     * Metadata the hosting app wants to track for this input. For example, a hint for what data to
     * assign to this input, or hints about how to draw dynamic UI to allow users to control this value.
     */
    appMetadata: unknown;
};

/**
 * The data for an InputBlock for ConnectionPointType.Texture inputs
 */
export type TextureInputBlockData = CommonInputBlockData & {
    /** The type of the input block */
    inputType: ConnectionPointType.Texture;

    /** The URL, if available, of the texture */
    url: Nullable<string>;

    /**
     * If supplied, gives a hint as to which type of texture the URL points to.
     * Default is assumed to be "image"
     */
    urlTypeHint: Nullable<"image" | "video">;

    /**
     * Defines the anisotropic level to use, or default if null
     */
    anisotropicFilteringLevel: Nullable<number>;

    /**
     * Indicates if the Y axis should be flipped, or default if null
     */
    flipY: Nullable<boolean>;

    /**
     * The file extension to use, or default if null.
     */
    forcedExtension: Nullable<string>;
};

/**
 * The data for an InputBlock for ConnectionPointType.Boolean inputs
 */
export type BooleanInputBlockData = CommonInputBlockData & {
    /** The type of the input block */
    inputType: ConnectionPointType.Boolean;

    /** The value of the input block */
    value: boolean;
};

/**
 * The data for an InputBlock for ConnectionPointType.Float inputs
 */
export type FloatInputBlockData = CommonInputBlockData & {
    /** The type of the input block */
    inputType: ConnectionPointType.Float;

    /** The value of the input block */
    value: number;

    /**
     * If supplied, how this should be animated by the editor.  Will not affect runtime behavior.
     */
    animationType: Nullable<"time">;

    /**
     * If supplied, the amount to change the value per millisecond when animating.
     */
    valueDeltaPerMs: Nullable<number>;

    /**
     * The minimum value of the float, used for slider control.
     */
    min: Nullable<number>;

    /**
     * The maximum value of the float, used for slider control.
     */
    max: Nullable<number>;
};

/**
 * The data for an InputBlock for ConnectionPointType.Color3 inputs
 */
export type Color3InputBlockData = CommonInputBlockData & {
    /** The type of the input block */
    inputType: ConnectionPointType.Color3;

    /** The value of the input block */
    value: IColor3Like;
};

/**
 * The data for an InputBlock for ConnectionPointType.Color4 inputs
 */
export type Color4InputBlockData = CommonInputBlockData & {
    /** The type of the input block */
    inputType: ConnectionPointType.Color4;

    /** The value of the input block */
    value: IColor4Like;
};

/**
 * The data for an InputBlock for ConnectionPointType.Vector2 inputs
 */
export type Vector2InputBlockData = CommonInputBlockData & {
    /** The type of the input block */
    inputType: ConnectionPointType.Vector2;

    /** The value of the input block */
    value: IVector2Like;
};

/**
 * Type union of all possible InputBlock data types
 */
export type SerializedInputBlockData = TextureInputBlockData | BooleanInputBlockData | FloatInputBlockData | Color3InputBlockData | Color4InputBlockData | Vector2InputBlockData;
