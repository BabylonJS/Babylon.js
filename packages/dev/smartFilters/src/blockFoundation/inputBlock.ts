import type { SmartFilter } from "../smartFilter.js";
import type { ConnectionPointValue } from "../connection/connectionPointType.js";
import type { RuntimeData } from "../connection/connectionPoint.js";
import type { ConnectionPointWithDefault } from "../connection/connectionPointWithDefault.js";
import type { DisableableShaderBlock } from "./disableableShaderBlock.js";
import { BaseBlock } from "./baseBlock.js";
import { CreateStrongRef } from "../runtime/strongRef.js";
import { ConnectionPointType } from "../connection/connectionPointType.js";
import type { Nullable } from "core/types.js";

/**
 * Type predicate to check if value is a strong ref or a direct value
 * @param value - The value to check
 * @returns true if the value is a strong ref, otherwise false
 */
function IsRuntimeData<U extends ConnectionPointType>(value: ConnectionPointValue<U> | RuntimeData<U>): value is RuntimeData<U> {
    return value && (value as RuntimeData<ConnectionPointType>).value !== undefined;
}

/**
 * Predicate to check if a block is a texture input block.
 * @param block - The block to check
 * @returns true if the block is a texture input block, otherwise false
 */
export function IsTextureInputBlock(block: BaseBlock): block is InputBlock<ConnectionPointType.Texture> {
    return (block as InputBlock<ConnectionPointType.Texture>).type === ConnectionPointType.Texture;
}

/**
 * Predicate to check if a block is a disableable block.
 * @param block - The block to check
 * @returns true if the block is a disableable block, otherwise false
 */
export function IsDisableableShaderBlock(block: BaseBlock): block is DisableableShaderBlock {
    return (block as DisableableShaderBlock).disabled !== undefined;
}

/**
 * This base class exists to provide a type that the serializer can use to represent
 * any InputBlock without knowing the exact type it is.
 */
export abstract class InputBlockBase extends BaseBlock {
    /**
     * The class name of the block.
     */
    public static override ClassName = "InputBlock";

    /**
     * The type of the input.
     */
    public abstract readonly type: ConnectionPointType;
}

/**
 * Describes the editor data that can be stored with an InputBlock of a given type.
 */
export type InputBlockEditorData<T extends ConnectionPointType> = T extends ConnectionPointType.Texture
    ? {
          /**
           * The URL of the texture, or default if null.
           */
          url: Nullable<string>;

          /**
           * If supplied, gives a hint as to which type of texture the URL points to.
           * Default is assumed to be "image"
           */
          urlTypeHint: Nullable<"image" | "video">;

          /**
           * The anisotropic filtering level of the texture, or default if null.
           */
          anisotropicFilteringLevel: Nullable<number>;

          /**
           * Whether the Y axis should be flipped, or default if null.
           */
          flipY: Nullable<boolean>;

          /**
           * The file extension to use, or default if null.
           */
          forcedExtension: Nullable<string>;
      }
    : T extends ConnectionPointType.Float
      ? {
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
        }
      : {};

/**
 * This represents any inputs used in the graph.
 *
 * This is used to provide a way to connect the graph to the outside world.
 *
 * The value is dynamically set by the user.
 */
export class InputBlock<U extends ConnectionPointType, V = unknown> extends InputBlockBase {
    /**
     * The output connection point of the block.
     */
    public readonly output: ConnectionPointWithDefault<U>;

    /**
     * The type of the input.
     */
    public readonly type: U;

    /**
     * Data used by the Editor to store options required for instantiating the block in the Editor.
     */
    public editorData: Nullable<InputBlockEditorData<U>> = null;

    /**
     * Metadata the hosting app wants to track for this input. For example, a hint for what data to
     * assign to this input, or hints about how to draw dynamic UI to allow users to control this value.
     */
    public appMetadata: Nullable<V> = null;

    /**
     * Gets the current value of the input.
     */
    public get runtimeValue(): RuntimeData<U> {
        return this.output.runtimeData;
    }

    /**
     * Sets the current value of the input.
     */
    public set runtimeValue(value: RuntimeData<U>) {
        this.output.runtimeData = value;
    }

    /**
     * Creates a new InputBlock.
     * @param smartFilter - The smart filter to add the block to
     * @param name - The friendly name of the block
     * @param type - The type of the input
     * @param initialValue - The initial value of the input
     * @remarks the initial value can either be a strong reference or a value
     */
    constructor(smartFilter: SmartFilter, name: string, type: U, initialValue: ConnectionPointValue<U> | RuntimeData<U>) {
        super(smartFilter, name);
        this.type = type;

        // Creates the output connection point
        this.output = this._registerOutputWithDefault("output", type, IsRuntimeData(initialValue) ? initialValue : CreateStrongRef(initialValue));

        // Creates a strong reference to the initial value in case a reference has not been provided
        if (IsRuntimeData(initialValue)) {
            this.runtimeValue = initialValue;
        } else {
            this.runtimeValue = CreateStrongRef(initialValue);
        }
    }
}

/**
 * Unionized type of all the possible input types.
 */
export type AnyInputBlock = {
    [T in keyof typeof ConnectionPointType]: InputBlock<(typeof ConnectionPointType)[T]>;
}[keyof typeof ConnectionPointType];
