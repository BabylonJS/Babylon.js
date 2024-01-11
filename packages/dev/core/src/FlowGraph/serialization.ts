import { Color3, Color4 } from "../Maths/math.color";
import { Matrix, Quaternion, Vector2, Vector3, Vector4 } from "../Maths/math.vector";
import type { Scene } from "../scene";
import { FlowGraphInteger } from "./flowGraphInteger";

function isMeshClassName(className: string) {
    return (
        className === "Mesh" ||
        className === "AbstractMesh" ||
        className === "GroundMesh" ||
        className === "InstanceMesh" ||
        className === "LinesMesh" ||
        className === "GoldbergMesh" ||
        className === "GreasedLineMesh" ||
        className === "TrailMesh"
    );
}

function isVectorClassName(className: string) {
    return className === "Vector2" || className === "Vector3" || className === "Vector4" || className === "Quaternion" || className === "Color3" || className === "Color4";
}

function parseVector(className: string, value: Array<number>) {
    if (className === "Vector2") {
        return Vector2.FromArray(value);
    } else if (className === "Vector3") {
        return Vector3.FromArray(value);
    } else if (className === "Vector4") {
        return Vector4.FromArray(value);
    } else if (className === "Quaternion") {
        return Quaternion.FromArray(value);
    } else if (className === "Color3") {
        return new Color3(value[0], value[1], value[2]);
    } else if (className === "Color4") {
        return new Color4(value[0], value[1], value[2], value[3]);
    } else {
        throw new Error(`Unknown vector class name ${className}`);
    }
}

/**
 * The default function that serializes values in a context object to a serialization object
 * @param key the key where the value should be stored in the serialization object
 * @param value the value to store
 * @param serializationObject the object where the value will be stored
 */
export function defaultValueSerializationFunction(key: string, value: any, serializationObject: any) {
    const className = value?.getClassName?.() ?? "";
    if (isMeshClassName(className)) {
        serializationObject[key] = {
            name: value.name,
            className,
        };
    } else if (isVectorClassName(className)) {
        serializationObject[key] = {
            value: value.asArray(),
            className,
        };
    } else {
        serializationObject[key] = value;
    }
}

/**
 * The default function that parses values stored in a serialization object
 * @param key the key to the value that will be parsed
 * @param serializationObject the object that will be parsed
 * @param scene
 * @returns
 */
export function defaultValueParseFunction(key: string, serializationObject: any, scene: Scene) {
    const intermediateValue = serializationObject[key];
    let finalValue;
    const className = intermediateValue?.className;
    if (isMeshClassName(className)) {
        finalValue = scene.getMeshByName(intermediateValue.name);
    } else if (isVectorClassName(className)) {
        finalValue = parseVector(className, intermediateValue.value);
    } else if (className === "Matrix") {
        finalValue = Matrix.FromArray(intermediateValue.value);
    } else if (className === FlowGraphInteger.ClassName) {
        finalValue = FlowGraphInteger.Parse(intermediateValue);
    } else if (intermediateValue && intermediateValue.value !== undefined) {
        finalValue = intermediateValue.value;
    } else {
        finalValue = intermediateValue;
    }
    return finalValue;
}

/**
 * Given a name of a flow graph block class, return if this
 * class needs to be created with a path converter. Used in
 * parsing.
 * @param className the name of the flow graph block class
 * @returns a boolean indicating if the class needs a path converter
 */
export function needsPathConverter(className: string) {
    // I am not using the ClassName property here because it was causing a circular dependency
    // that jest didn't like!
    return className === "FGSetPropertyBlock" || className === "FGGetPropertyBlock" || className === "FGPlayAnimationBlock" || className === "FGMeshPickEventBlock";
}
