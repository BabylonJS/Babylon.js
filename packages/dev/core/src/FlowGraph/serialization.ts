import { Vector2, Vector3, Vector4 } from "../Maths/math.vector";
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

function isVectorClass(className: string) {
    return className === "Vector2" || className === "Vector3" || className === "Vector4";
}

export function defaultValueSerializationFunction(key: string, value: any, serializationObject: any) {
    if (value?.getClassName && isMeshClassName(value?.getClassName())) {
        serializationObject[key] = {
            name: value.name,
            className: value.getClassName(),
        };
    } else if (value?.getClassName && isVectorClass(value.getClassName())) {
        serializationObject[key] = value.asArray();
    } else {
        serializationObject[key] = value;
    }
}

export function defaultValueParseFunction(key: string, serializationObject: any, scene: Scene) {
    const value = serializationObject[key];
    let finalValue = value;
    // todo: if its a 3 element array, interpret as vector3
    if (Array.isArray(value)) {
        if (value.length === 2) {
            finalValue = Vector2.FromArray(value);
        } else if (value.length === 3) {
            finalValue = Vector3.FromArray(value);
        } else if (value.length === 4) {
            finalValue = Vector4.FromArray(value);
        }
    }
    const className = value?.className;
    if (isMeshClassName(className)) {
        finalValue = scene.getMeshByName(value.name);
    }
    return finalValue;
}
