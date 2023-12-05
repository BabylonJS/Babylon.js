import type { Camera } from "core/Cameras/camera";
import type { FlowGraphPath } from "core/FlowGraph/flowGraphPath";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { Tools } from "core/Misc/tools";
import type { IGLTF } from "../glTFLoaderInterfaces";

const camerasRegex = /^\/cameras\/(\d+)\/(orthographic|perspective)\/(xmag|ymag|zfar|znear|aspectRatio|yfov)$/;

function getBabylonCamera(path: FlowGraphPath, context: FlowGraphContext): { babylonCamera: Camera; gltfProperty: string } {
    const fullPath = path.getFinalPath();
    const gltfTree = context.getVariable("gltf") as IGLTF;
    if (!gltfTree) {
        throw new Error(`No glTF tree found for path ${fullPath}`);
    }
    const matches = fullPath.match(camerasRegex);
    if (!matches || matches.length !== 4) {
        throw new Error(`Invalid path ${fullPath}`);
    }
    const cameraIndex = parseInt(matches[1]);
    const camera = gltfTree.cameras && gltfTree.cameras[cameraIndex];
    if (!camera) {
        throw new Error(`Invalid camera index for path ${fullPath}`);
    }
    const babylonCamera = camera._babylonCamera;
    if (!babylonCamera) {
        throw new Error(`No Babylon camera found for path ${fullPath}`);
    }
    const gltfProperty = matches[3];
    if (!gltfProperty) {
        throw new Error(`Invalid property for path ${fullPath}`);
    }

    return { babylonCamera, gltfProperty };
}

export const camerasExtension = {
    shouldProcess(path: FlowGraphPath): boolean {
        const fullPath = path.getFinalPath();
        return !!fullPath.match(camerasRegex);
    },
    processGet(path: FlowGraphPath, context: FlowGraphContext): any {
        const { babylonCamera, gltfProperty } = getBabylonCamera(path, context);
        switch (gltfProperty) {
            case "aspectRatio":
                Tools.Warn("Getting aspect ratio is not supported.");
                return -1;
            case "zNear":
                return babylonCamera.minZ;
            case "zFar":
                return babylonCamera.maxZ;
            case "yfov":
                return babylonCamera.fov;
            case "xmag":
                return babylonCamera.orthoRight;
            case "ymag":
                return babylonCamera.orthoTop;
        }
    },
    processSet(path: FlowGraphPath, context: FlowGraphContext, value: any) {
        const { babylonCamera, gltfProperty } = getBabylonCamera(path, context);
        switch (gltfProperty) {
            case "aspectRatio":
                Tools.Warn("Setting aspect ratio is not supported.");
                break;
            case "zNear":
                babylonCamera.minZ = value;
                break;
            case "zFar":
                babylonCamera.maxZ = value;
                break;
            case "yfov":
                babylonCamera.fov = value;
                break;
            case "xmag":
                babylonCamera.orthoLeft = -value;
                babylonCamera.orthoRight = value;
                break;
            case "ymag":
                babylonCamera.orthoTop = value;
                babylonCamera.orthoBottom = -value;
                break;
        }
    },
};
