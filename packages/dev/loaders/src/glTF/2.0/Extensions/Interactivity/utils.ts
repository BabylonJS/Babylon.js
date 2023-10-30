import type { GLTFLoader } from "../../glTFLoader";

const gltfPropertyNameToBabylonPropertyName: any = {
    translation: "position",
};

export function _parsePath(context: string, pointer: string, _loader: GLTFLoader): { target: any; path: string } {
    if (!pointer.startsWith("/")) {
        throw new Error(`${context}: Value (${pointer}) must start with a slash`);
    }

    const parts = pointer.split("/");

    // Remove the first part since it will be empty string as pointers must start with a slash.
    parts.shift();

    // index until the last part, which is the property name
    let currentNode: any = _loader.gltf;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        currentNode = currentNode && currentNode[part];
    }

    if (currentNode._babylonTransformNode) {
        currentNode = currentNode._babylonTransformNode;
    }

    const propertyName = gltfPropertyNameToBabylonPropertyName[parts[parts.length - 1]] ?? parts[parts.length - 1];

    return {
        target: currentNode,
        path: propertyName,
    };
}
