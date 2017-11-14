/// <reference path="../../dist/preview release/babylon.d.ts"/>

module INSPECTOR {

    export var PROPERTIES = {
        /** Format the given object : 
         * If a format function exists, returns the result of this function.
         * If this function doesn't exists, return the object type instead */
        format: (obj: any): any => {
            let type = Helpers.GET_TYPE(obj) || 'type_not_defined';
            if ((<any>PROPERTIES)[type] && (<any>PROPERTIES)[type].format) {
                return (<any>PROPERTIES)[type].format(obj);
            } else {
                return Helpers.GET_TYPE(obj);
            }
        },
        'type_not_defined': {
            properties: new Array(),
            format: () => ''
        },
        'Vector2': {
            type: BABYLON.Vector2,
            format: (vec: BABYLON.Vector2) => { return `x:${Helpers.Trunc(vec.x)}, y:${Helpers.Trunc(vec.y)}`; }
        },
        'Vector3': {
            type: BABYLON.Vector3,
            format: (vec: BABYLON.Vector3) => { return `x:${Helpers.Trunc(vec.x)}, y:${Helpers.Trunc(vec.y)}, z:${Helpers.Trunc(vec.z)}` }
        },
        'Color3': {
            type: BABYLON.Color3,
            format: (color: BABYLON.Color3) => { return `R:${color.r}, G:${color.g}, B:${color.b}` },
            slider: {
                r: { min: 0, max: 1, step: 0.01 },
                g: { min: 0, max: 1, step: 0.01 },
                b: { min: 0, max: 1, step: 0.01 }
            }
        },
        'Color4': {
            type: BABYLON.Color4,
            format: (color: BABYLON.Color4) => { return `R:${color.r}, G:${color.g}, B:${color.b}` },
            slider: {
                r: { min: 0, max: 1, step: 0.01 },
                g: { min: 0, max: 1, step: 0.01 },
                b: { min: 0, max: 1, step: 0.01 }
            }
        },
        'Quaternion': {
            type: BABYLON.Quaternion
        },
        'Size': {
            type: BABYLON.Size,
            format: (size: BABYLON.Size) => { return `Size - w:${Helpers.Trunc(size.width)}, h:${Helpers.Trunc(size.height)}` }
        },
        'Texture': {
            type: BABYLON.Texture,
            format: (tex: BABYLON.Texture) => { return tex.name }
        },
        'RenderTargetTexture': {
            type: BABYLON.RenderTargetTexture
        },
        'DynamicTexture': {
            type: BABYLON.DynamicTexture
        },
        'BaseTexture': {
            type: BABYLON.BaseTexture
        },
        'CubeTexture': {
            type: BABYLON.CubeTexture
        },
        'HDRCubeTexture': {
            type: BABYLON.HDRCubeTexture
        },
        'Sound': {
            type: BABYLON.Sound
        },
        'ArcRotateCamera': {
            type: BABYLON.ArcRotateCamera,
            slider: {
                alpha: { min: 0, max: 2 * Math.PI, step: 0.01 },
                beta: { min: -Math.PI, max: Math.PI, step: 0.01 },
                fov: { min: 0, max: 180, step: 1 }
            }
        },
        'FreeCamera': {
            type: BABYLON.FreeCamera,
            slider: {
                fov: { min: 0, max: 180, step: 1 }
            }
        },
        'Scene': {
            type: BABYLON.Scene,
        },
        'TransformNode': {
            type: BABYLON.TransformNode,
            format: (m: BABYLON.TransformNode): string => { return m.name; }
        },        
        'AbstractMesh': {
            type: BABYLON.AbstractMesh,
            format: (m: BABYLON.AbstractMesh): string => { return m.name; }
        },          
        'Mesh': {
            type: BABYLON.Mesh,
            format: (m: BABYLON.Mesh): string => { return m.name; },
            slider: {
                visibility: { min: 0, max: 1, step: 0.1 }
            }
        },
        'StandardMaterial': {
            type: BABYLON.StandardMaterial,
            format: (mat: BABYLON.StandardMaterial): string => { return mat.name; },
            slider: {
                alpha: { min: 0, max: 1, step: 0.01 }
            }
        },
        'PBRMaterial': {
            type: BABYLON.PBRMaterial,
            slider: {
                alpha: { min: 0, max: 1, step: 0.01 }
            }
        },
        'PhysicsImpostor': {
            type: BABYLON.PhysicsImpostor
        },
    }

}