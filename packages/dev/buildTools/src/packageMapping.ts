/* eslint-disable @typescript-eslint/naming-convention */
import { kebabize } from "./utils";

export type BuildType = /*"lts" | */ "umd" | "esm" | "es6" | "namespace";
export type PrivateDevPackageName = "shared-ui-components";
export type DevPackageName =
    | "core"
    | "gui"
    | "materials"
    | "loaders"
    | "serializers"
    | "inspector"
    | "post-processes"
    | "procedural-textures"
    | "node-editor"
    | "gui-editor"
    | "viewer"
    | "ktx2decoder";
export type UMDPackageName =
    | "babylonjs"
    | "babylonjs-gui"
    | "babylonjs-serializers"
    | "babylonjs-loaders"
    | "babylonjs-materials"
    | "babylonjs-procedural-textures"
    | "babylonjs-inspector"
    | "babylonjs-node-editor"
    | "babylonjs-gui-editor"
    | "babylonjs-viewer"
    | "babylonjs-post-process"
    | "babylonjs-ktx2decoder";
export type NamespacePackageName =
    | "BABYLON"
    | "BABYLON.GUI"
    | "BABYLON.GLTF1"
    | "BABYLON.GLTF2"
    | "BABYLON.GLTF2.Loader"
    | "BABYLON.GLTF2.Loader.Extensions"
    | "BABYLON.Debug"
    | "BABYLON.NodeEditor"
    | "BABYLON.GuiEditor"
    | "INSPECTOR"
    | "BabylonViewer"
    | "KTX2DECODER";
export type ES6PackageName =
    | "@babylonjs/core"
    | "@babylonjs/gui"
    | "@babylonjs/materials"
    | "@babylonjs/loaders"
    | "@babylonjs/serializers"
    | "@babylonjs/procedural-textures"
    | "@babylonjs/inspector"
    | "@babylonjs/node-editor"
    | "@babylonjs/gui-editor"
    | "@babylonjs/post-processes"
    | "@babylonjs/viewer"
    | "@babylonjs/ktx2decoder";

export const PrivateDevPackagesDirectoryMapping: { [key in PrivateDevPackageName]: string } = {
    "shared-ui-components": "sharedUiComponents",
};

export const umdPackageMapping: { [key in UMDPackageName]: { baseDir: string; baseFilename: string; isBundle?: boolean } } = {
    babylonjs: {
        baseDir: "",
        baseFilename: "babylon",
    },
    "babylonjs-gui": {
        baseDir: "gui",
        baseFilename: "babylon.gui",
    },
    "babylonjs-serializers": {
        baseDir: "serializers",
        baseFilename: "babylonjs.serializers",
    },
    "babylonjs-loaders": {
        baseDir: "loaders",
        baseFilename: "babylonjs.loaders",
    },
    "babylonjs-materials": {
        baseDir: "materialsLibrary",
        baseFilename: "babylonjs.materials",
    },
    "babylonjs-procedural-textures": {
        baseDir: "proceduralTexturesLibrary",
        baseFilename: "babylonjs.proceduralTextures",
    },
    "babylonjs-inspector": {
        baseDir: "inspector",
        baseFilename: "babylon.inspector",
        isBundle: true,
    },
    "babylonjs-node-editor": {
        baseDir: "nodeEditor",
        baseFilename: "babylon.nodeEditor",
    },
    "babylonjs-gui-editor": {
        baseDir: "guiEditor",
        baseFilename: "babylon.guiEditor",
    },
    "babylonjs-post-process": {
        baseDir: "postProcessesLibrary",
        baseFilename: "babylonjs.postProcess",
    },
    "babylonjs-ktx2decoder": {
        baseDir: "",
        baseFilename: "babylon.ktx2Decoder",
    },
    "babylonjs-viewer": {
        baseDir: "",
        baseFilename: "babylon.viewer",
    },
};
export type ESMPackageName = "@babylonjs/esm";

export type PublicPackageName = UMDPackageName | ES6PackageName | ESMPackageName | NamespacePackageName;

export type PublicPackageVariable = PublicPackageName | ((data?: any) => PublicPackageName);

export type PackageMap = { [buildType in BuildType]: PublicPackageVariable };

const packageMapping: {
    [buildType in BuildType]: {
        [devPackage in DevPackageName]: PublicPackageVariable;
    };
} = {
    umd: {
        core: "babylonjs",
        gui: "babylonjs-gui",
        materials: "babylonjs-materials",
        loaders: "babylonjs-loaders",
        serializers: "babylonjs-serializers",
        inspector: "babylonjs-inspector",
        "node-editor": "babylonjs-node-editor",
        "gui-editor": "babylonjs-gui-editor",
        "post-processes": "babylonjs-post-process",
        "procedural-textures": "babylonjs-procedural-textures",
        ktx2decoder: "babylonjs-ktx2decoder",
        viewer: "babylonjs-viewer",
    },
    es6: {
        core: "@babylonjs/core",
        gui: "@babylonjs/gui",
        materials: "@babylonjs/materials",
        loaders: "@babylonjs/loaders",
        serializers: "@babylonjs/serializers",
        inspector: "@babylonjs/inspector",
        "node-editor": "@babylonjs/node-editor",
        "gui-editor": "@babylonjs/gui-editor",
        "post-processes": "@babylonjs/post-processes",
        "procedural-textures": "@babylonjs/procedural-textures",
        ktx2decoder: "@babylonjs/ktx2decoder",
        viewer: "@babylonjs/viewer",
    },
    esm: {
        core: "@babylonjs/esm",
        gui: "@babylonjs/esm",
        materials: "@babylonjs/esm",
        loaders: "@babylonjs/esm",
        serializers: "@babylonjs/esm",
        inspector: "@babylonjs/esm",
        "node-editor": "@babylonjs/esm",
        "gui-editor": "@babylonjs/esm",
        "post-processes": "@babylonjs/esm",
        "procedural-textures": "@babylonjs/esm",
        ktx2decoder: "@babylonjs/esm",
        viewer: "@babylonjs/esm",
    },
    // lts: {
    //     core: "@babylonjs/esm",
    //     gui: "@babylonjs/esm",
    //     materials: "@babylonjs/esm",
    //     loaders: "@babylonjs/esm",
    //     serializers: "@babylonjs/esm",
    // },
    namespace: {
        core: (filePath?: string) => {
            if (
                filePath &&
                (filePath.includes("/Debug/axesViewer") ||
                    filePath.includes("/Debug/boneAxesViewer") ||
                    filePath.includes("/Debug/physicsViewer") ||
                    filePath.includes("/Debug/skeletonViewer"))
            ) {
                return "BABYLON.Debug";
            }
            return "BABYLON";
        },
        gui: "BABYLON.GUI",
        materials: "BABYLON",
        loaders: (filePath?: string) => {
            if (filePath) {
                if (filePath.includes("/glTF/1.0")) {
                    // was .endsWith
                    return "BABYLON.GLTF1";
                } else if (filePath.includes("/glTF/2.0/Extensions")) {
                    return "BABYLON.GLTF2.Loader.Extensions";
                } else if (filePath.includes("/glTF/2.0/glTFLoaderInterfaces")) {
                    return "BABYLON.GLTF2.Loader";
                } else if (filePath.includes("/glTF/2.0")) {
                    return "BABYLON.GLTF2";
                }
            }
            return "BABYLON";
        },
        serializers: "BABYLON",
        inspector: "INSPECTOR",
        "node-editor": "BABYLON.NodeEditor",
        "gui-editor": "BABYLON.GuiEditor",
        "post-processes": "BABYLON",
        "procedural-textures": "BABYLON",
        ktx2decoder: "KTX2DECODER",
        viewer: "BabylonViewer",
    },
};

export function getAllDevNames(): DevPackageName[] {
    return Object.keys(packageMapping.umd) as DevPackageName[];
}

export function getAllBuildTypes(): BuildType[] {
    return Object.keys(packageMapping) as BuildType[];
}

export function isValidPackageMap(packageMap: { [key: string]: string | ((data?: any) => string) }): packageMap is PackageMap {
    const packageNames = Object.keys(packageMap);
    const buildTypes = getAllBuildTypes();

    return packageNames.every((packageName) => buildTypes.includes(packageName as BuildType));
}

export function getPackageMappingByDevName(devName: DevPackageName): PackageMap {
    const returnMap: { [buildType in BuildType]?: PublicPackageVariable } = {};
    Object.keys(packageMapping).forEach((buildType) => {
        if (isValidBuildType(buildType)) {
            returnMap[buildType] = packageMapping[buildType][kebabize(devName) as DevPackageName];
        }
    });
    if (isValidPackageMap(returnMap)) {
        return returnMap;
    } else {
        throw new Error(`Invalid package mapping for ${devName}`);
    }
}

export function getAllPackageMappingsByDevNames(): { [devName in DevPackageName]: PackageMap } {
    const returnMap: { [devName in DevPackageName]?: PackageMap } = {};
    getAllDevNames().forEach((devName) => {
        returnMap[devName] = getPackageMappingByDevName(devName);
    });
    return returnMap as { [devName in DevPackageName]: PackageMap };
}

export function getDevPackagesByBuildType(buildType: BuildType): { [key in DevPackageName]: PublicPackageVariable } {
    return packageMapping[buildType];
}

export function getPublicPackageName(publicVariable: PublicPackageVariable, data?: any, sourceFile?: string): PublicPackageName | PrivateDevPackageName {
    // check if it's a package that is not in the mapping
    if (sourceFile && sourceFile.includes("/packages/")) {
        // a different sourcefile was provided, check if it's in the right package
        const packageDirectoryArray = sourceFile.split("/packages/")[1].split("/");
        packageDirectoryArray.shift();
        const packageDirectory = packageDirectoryArray[0];
        let privatePackage: PrivateDevPackageName | null = null;
        Object.keys(PrivateDevPackagesDirectoryMapping).forEach((packageName) => {
            if (packageDirectory === PrivateDevPackagesDirectoryMapping[packageName as PrivateDevPackageName]) {
                privatePackage = packageName as PrivateDevPackageName;
            }
        });
        if (privatePackage !== null) {
            return privatePackage;
        }
        // TODO - should we also support public dev packages here?
    }
    if (typeof publicVariable === "string") {
        return publicVariable;
    } else if (typeof publicVariable === "function") {
        return publicVariable(data);
    } else {
        throw new Error(`Invalid public package variable: ${publicVariable}`);
    }
}

export function isValidDevPackageName(devName: string): devName is DevPackageName {
    return Object.keys(packageMapping).some((buildType) => {
        if (isValidBuildType(buildType)) {
            return packageMapping[buildType][kebabize(devName) as DevPackageName] !== undefined;
        }
        return false;
    });
}

export function isValidBuildType(buildType: string): buildType is BuildType {
    return Object.keys(packageMapping).some((localBuildType) => {
        return localBuildType === buildType;
    });
}
