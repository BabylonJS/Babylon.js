import { Quaternion, Vector2, Vector3, Vector4 } from "../Maths/math.vector";
import type { Scene } from "../scene";

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
    return className === "Vector2" || className === "Vector3" || className === "Vector4" || className === "Quaternion";
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
    const value = serializationObject[key];
    let finalValue;
    const className = value?.className;
    if (isMeshClassName(className)) {
        finalValue = scene.getMeshByName(value.name);
    } else if (isVectorClassName(className)) {
        finalValue = parseVector(className, value.value);
    } else {
        finalValue = value;
    }
    return finalValue;
}
