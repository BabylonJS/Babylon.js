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

export function defaultValueSerializationFunction(key: string, value: any, serializationObject: any) {
    if (value?.getClassName && isMeshClassName(value?.getClassName())) {
        serializationObject[key] = {
            name: value.name,
            className: value.getClassName(),
        };
    } else if (value?.getClassName && isVectorClassName(value.getClassName())) {
        serializationObject[key] = {
            className: value.getClassName(),
            value: value.asArray(),
        };
    } else {
        serializationObject[key] = value;
    }
}

export function defaultValueParseFunction(key: string, serializationObject: any, scene: Scene) {
    const intermediateValue = serializationObject[key];
    let finalValue = intermediateValue;
    const className = intermediateValue?.className;
    if (isVectorClassName(className)) {
        const valueProperty = intermediateValue["value"];
        if (className === "Vector2") {
            finalValue = Vector2.FromArray(valueProperty);
        } else if (className === "Vector3") {
            finalValue = Vector3.FromArray(valueProperty);
        } else if (className === "Vector4") {
            finalValue = Vector4.FromArray(valueProperty);
        } else if (className === "Quaternion") {
            finalValue = Quaternion.FromArray(valueProperty);
        }
    } else if (isMeshClassName(className)) {
        finalValue = scene.getMeshByName(intermediateValue.name);
    } else if (intermediateValue.value !== undefined) {
        finalValue = intermediateValue.value;
    }

    return finalValue;
}
