/**
 * ----------------------------------------------------------------------------
 * Data Types Used For Block Serialization
 * ----------------------------------------------------------------------------
 */

import type { Nullable } from "core/types.js";
import type { AllConnectionPointTypes, ConnectionPointValue } from "../../connection/connectionPointType.js";
import type { ShaderProgram } from "../../utils/shaderCodeUtils.js";

/**
 * The V1 definition of a serialized shader block. This block definition is loaded by a CustomShaderBlock and defines how a
 * blockType works. This should not be confused with an ISerializedBockV1, which is a serialized instance of a block in a
 * serialized SmartFilter graph. It is referenced by blockType in a serialized SmartFilter.
 */
export type SerializedShaderBlockDefinitionV1 = {
    /**
     * Which type of serialized data this is.
     */
    format: "shaderBlockDefinition";

    /**
     * The version of the block definition format (format of the serialized data, not the version of the block definition itself).
     */
    formatVersion: 1;

    /**
     * The type used to refer to the block in serialized SmartFilters and in the editor UI.
     * The application doing the deserialization will use this to instantiate the correct block definition.
     * Block types are expected to be unique and their behavior should be semantically equivalent across implementations
     * (their results must be similar enough that the differences are not perceivable).
     */
    blockType: string;

    /**
     * The namespace of the block, which is used to reduce name collisions between blocks and also to group blocks in the editor UI.
     * By convention, sub namespaces are separated by a period (e.g. "Babylon.Demo.Effects").
     */
    namespace: Nullable<string>;

    /**
     * The shader program for the block.
     */
    shaderProgram: ShaderProgram;

    /**
     * The input connection points of the block.
     */
    inputConnectionPoints: SerializedInputConnectionPointV1[];

    /**
     * If true, the optimizer will not attempt to optimize this block.
     */
    disableOptimization: boolean;
};

/**
 * Possible V1 auto bind values for input connection points.
 */
export type InputAutoBindV1 = "outputResolution" | "outputAspectRatio";

/**
 * A V1 input connection point of a serialized block definition.
 */
export type SerializedInputConnectionPointV1<U extends AllConnectionPointTypes = AllConnectionPointTypes> = {
    /**
     * The name of the connection point.
     */
    name: string;

    /**
     * The type of the connection point.
     */
    type: U;

    /**
     * The optional default value of the connection point.
     */
    defaultValue?: ConnectionPointValue<U>;

    /**
     * If supplied, the input will be automatically bound to this value, instead of creating an input connection point.
     */
    autoBind?: InputAutoBindV1;
};
