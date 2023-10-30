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

export function defaultValueSerializationFunction(key: string, value: any, serializationObject: any) {
    if (value?.getClassName && isMeshClassName(value?.getClassName())) {
        serializationObject[key] = {
            name: value.name,
            className: value.getClassName(),
        };
    } else {
        serializationObject[key] = value;
    }
}

export function defaultValueParseFunction(key: string, serializationObject: any, scene: Scene) {
    const value = serializationObject[key];
    let finalValue;
    const className = value?.className;
    if (isMeshClassName(className)) {
        finalValue = scene.getMeshByName(value.name);
    } else {
        finalValue = value;
    }
    return finalValue;
}
