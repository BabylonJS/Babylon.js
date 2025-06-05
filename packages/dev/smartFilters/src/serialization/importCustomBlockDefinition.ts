import { ConnectionPointType } from "../connection/connectionPointType.js";
import { hasGlslHeader, parseFragmentShader } from "../utils/buildTools/shaderConverter.js";
import type { SerializedBlockDefinition } from "./serializedBlockDefinition.js";
import type { SerializedShaderBlockDefinition } from "./serializedShaderBlockDefinition.js";
import type { InputAutoBindV1, SerializedInputConnectionPointV1 } from "./v1/shaderBlockSerialization.types.js";

/**
 * Imports a serialized custom block definition. Supports either serialized CustomShaderBlock definitions or
 * CustomAggregateBlock definitions. Can throw an exception if the serialized data is invalid.
 *
 * CustomShaderBlock definitions can be supplied either as serialized SerializedBlockDefinition object
 * or a glsl shader with the required annotations (see readme.md for details).
 *
 * CustomAggregateBlock definitions must be supplied as serialized SerializedBlockDefinition object.
 *
 * @param serializedData - The serialized data
 * @returns The serialized block definition
 */
export function importCustomBlockDefinition(serializedData: string): SerializedBlockDefinition {
    if (hasGlslHeader(serializedData)) {
        return importAnnotatedGlsl(serializedData);
    } else {
        // Assume this is a serialized JSON object
        const blockDefinition = JSON.parse(serializedData);

        // Some old SmartFilters didn't have a format property - default to smartFilter if missing
        if (blockDefinition.format === undefined) {
            blockDefinition.format = "smartFilter";
        }

        // SmartFilters can be serialized without a blockType
        // By convention, we use the SmartFilter name as the blockType when importing them as SerializedBlockDefinitions
        if (blockDefinition.format === "smartFilter" && blockDefinition.name && !blockDefinition.blockType) {
            blockDefinition.blockType = blockDefinition.name;
        }

        // Validation
        if (!blockDefinition.blockType) {
            throw new Error("Could not find a blockType");
        }

        return blockDefinition;
    }
}

/**
 * Converts a fragment shader .glsl file to an SerializedBlockDefinition instance for use
 * as a CustomShaderBlock. The .glsl file must contain certain annotations to be imported.
 * See readme.md for more information.
 * @param fragmentShader - The contents of the .glsl fragment shader file
 * @returns The serialized block definition
 */
function importAnnotatedGlsl(fragmentShader: string): SerializedShaderBlockDefinition {
    const fragmentShaderInfo = parseFragmentShader(fragmentShader);

    if (!fragmentShaderInfo.blockType) {
        throw new Error("blockType must be defined");
    }

    // Calculate the input connection points
    const inputConnectionPoints: SerializedInputConnectionPointV1[] = [];
    for (const uniform of fragmentShaderInfo.uniforms) {
        // Add to input connection point list
        const inputConnectionPoint: SerializedInputConnectionPointV1 = {
            name: uniform.name,
            type: uniform.type,
            autoBind: uniform.properties?.autoBind as InputAutoBindV1,
        };
        if (inputConnectionPoint.type !== ConnectionPointType.Texture && uniform.properties?.default !== undefined) {
            inputConnectionPoint.defaultValue = uniform.properties.default;
        }
        inputConnectionPoints.push(inputConnectionPoint);
    }

    return {
        format: "shaderBlockDefinition",
        formatVersion: 1,
        blockType: fragmentShaderInfo.blockType,
        namespace: fragmentShaderInfo.namespace,
        shaderProgram: {
            fragment: fragmentShaderInfo.shaderCode,
        },
        inputConnectionPoints,
        disableOptimization: !!fragmentShaderInfo.disableOptimization,
    };
}
