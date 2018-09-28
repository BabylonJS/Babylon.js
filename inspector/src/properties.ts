import { Helpers } from "./helpers/Helpers";
import { Vector2, Vector3, Color3, Color4, Quaternion, Size, Texture, RenderTargetTexture, DynamicTexture, BaseTexture, CubeTexture, HDRCubeTexture, Sound, ArcRotateCamera, FreeCamera, Scene, TransformNode, AbstractMesh, Mesh, StandardMaterial, PBRMaterial, PhysicsImpostor, ImageProcessingConfiguration, ColorCurves } from "babylonjs";

export const PROPERTIES = {

    /** Format the given object :
     * If a format function exists, returns the result of this function.
     * If this function doesn't exists, return the object type instead
     */
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
        type: Vector2,
        format: (vec: Vector2) => { return `x:${Helpers.Trunc(vec.x)}, y:${Helpers.Trunc(vec.y)}`; }
    },
    'Vector3': {
        type: Vector3,
        format: (vec: Vector3) => { return `x:${Helpers.Trunc(vec.x)}, y:${Helpers.Trunc(vec.y)}, z:${Helpers.Trunc(vec.z)}`; }
    },
    'Color3': {
        type: Color3,
        format: (color: Color3) => { return `R:${color.r.toPrecision(2)}, G:${color.g.toPrecision(2)}, B:${color.b.toPrecision(2)}`; },
        slider: {
            r: { min: 0, max: 1, step: 0.01 },
            g: { min: 0, max: 1, step: 0.01 },
            b: { min: 0, max: 1, step: 0.01 }
        }
    },
    'Color4': {
        type: Color4,
        format: (color: Color4) => { return `R:${color.r}, G:${color.g}, B:${color.b}`; },
        slider: {
            r: { min: 0, max: 1, step: 0.01 },
            g: { min: 0, max: 1, step: 0.01 },
            b: { min: 0, max: 1, step: 0.01 }
        }
    },
    'Quaternion': {
        type: Quaternion
    },
    'Size': {
        type: Size,
        format: (size: Size) => { return `Size - w:${Helpers.Trunc(size.width)}, h:${Helpers.Trunc(size.height)}`; }
    },
    'Texture': {
        type: Texture,
        format: (tex: Texture) => { return tex.name; }
    },
    'RenderTargetTexture': {
        type: RenderTargetTexture
    },
    'DynamicTexture': {
        type: DynamicTexture
    },
    'BaseTexture': {
        type: BaseTexture
    },
    'CubeTexture': {
        type: CubeTexture
    },
    'HDRCubeTexture': {
        type: HDRCubeTexture
    },
    'Sound': {
        type: Sound
    },
    'ArcRotateCamera': {
        type: ArcRotateCamera,
        slider: {
            alpha: { min: 0, max: 2 * Math.PI, step: 0.01 },
            beta: { min: -Math.PI, max: Math.PI, step: 0.01 },
            fov: { min: 0, max: 180, step: 1 }
        }
    },
    'FreeCamera': {
        type: FreeCamera,
        slider: {
            fov: { min: 0, max: 180, step: 1 }
        }
    },
    'Scene': {
        type: Scene,
    },
    'TransformNode': {
        type: TransformNode,
        format: (m: TransformNode): string => { return m.name; }
    },
    'AbstractMesh': {
        type: AbstractMesh,
        format: (m: AbstractMesh): string => { return m.name; }
    },
    'Mesh': {
        type: Mesh,
        format: (m: Mesh): string => { return m.name; },
        slider: {
            visibility: { min: 0, max: 1, step: 0.1 }
        }
    },
    'StandardMaterial': {
        type: StandardMaterial,
        format: (mat: StandardMaterial): string => { return mat.name; },
        slider: {
            alpha: { min: 0, max: 1, step: 0.01 }
        }
    },
    'PBRMaterial': {
        type: PBRMaterial,
        slider: {
            alpha: { min: 0, max: 1, step: 0.01 }
        }
    },
    'PhysicsImpostor': {
        type: PhysicsImpostor
    },
    'ImageProcessingConfiguration': {
        type: ImageProcessingConfiguration
    },
    'ColorCurves': {
        type: ColorCurves
    }
};
