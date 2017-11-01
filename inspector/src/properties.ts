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
            properties: ['x', 'y'],
            format: (vec: BABYLON.Vector2) => { return `x:${Helpers.Trunc(vec.x)}, y:${Helpers.Trunc(vec.y)}`; }
        },
        'Vector3': {
            type: BABYLON.Vector3,
            properties: ['x', 'y', 'z'],
            format: (vec: BABYLON.Vector3) => { return `x:${Helpers.Trunc(vec.x)}, y:${Helpers.Trunc(vec.y)}, z:${Helpers.Trunc(vec.z)}` }
        },
        'Color3': {
            type: BABYLON.Color3,
            properties: ['r', 'g', 'b'],
            format: (color: BABYLON.Color3) => { return `R:${color.r}, G:${color.g}, B:${color.b}` },
            slider: {
                r: {min: 0, max: 1, step: 0.01},
                g: {min: 0, max: 1, step: 0.01},
                b: {min: 0, max: 1, step: 0.01}
            }
        },
        'Color4': {
            type: BABYLON.Color4,
            properties: ['r', 'g', 'b'],
            format: (color: BABYLON.Color4) => { return `R:${color.r}, G:${color.g}, B:${color.b}` },
            slider: {
                r: {min: 0, max: 1, step: 0.01},
                g: {min: 0, max: 1, step: 0.01},
                b: {min: 0, max: 1, step: 0.01}
            }
        },
        'Quaternion': {
            type: BABYLON.Quaternion,
            properties: ['x', 'y', 'z', 'w']
        },
        'Size': {
            type: BABYLON.Size,
            properties: ['width', 'height'],
            format: (size: BABYLON.Size) => { return `Size - w:${Helpers.Trunc(size.width)}, h:${Helpers.Trunc(size.height)}` }
        },
        'Texture': {
            type: BABYLON.Texture,
            properties: [
                'hasAlpha',
                'level',
                'name',
                'wrapU',
                'wrapV',
                'uScale',
                'vScale',
                'uAng',
                'vAng',
                'wAng',
                'uOffset',
                'vOffset'
            ],
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
            type: BABYLON.Sound,
            properties: [
                'name',
                'autoplay',
                'loop',
                'useCustomAttenuation',
                'soundTrackId',
                'spatialSound',
                'refDistance',
                'rolloffFactor',
                'maxDistance',
                'distanceModel',
                'isPlaying',
                'isPaused'
            ]
        },
        'ArcRotateCamera': {
            type: BABYLON.ArcRotateCamera,
            properties: [
                'position',
                'alpha',
                'beta',
                'radius',
                'angularSensibilityX',
                'angularSensibilityY',
                'target',
                'lowerAlphaLimit',
                'lowerBetaLimit',
                'upperAlphaLimit',
                'upperBetaLimit',
                'lowerRadiusLimit',
                'upperRadiusLimit',

                'pinchPrecision',
                'wheelPrecision',
                'allowUpsideDown',
                'checkCollisions'
            ],
            slider: {
                alpha: {min: 0, max: 2*Math.PI, step: 0.01},
                beta: {min: -Math.PI, max: Math.PI, step: 0.01},
                fov: {min: 0, max: 180, step: 1}
            }
        },
        'FreeCamera': {
            type: BABYLON.FreeCamera,
            properties: [
                'position',
                'rotation',
                'rotationQuaternion',
                'cameraDirection',
                'cameraRotation',
                'ellipsoid',
                'applyGravity',
                'angularSensibility',
                'keysUp',
                'keysDown',
                'keysLeft',
                'keysRight',
                'checkCollisions',
                'speed',
                'lockedTarget',
                'noRotationConstraint',
                'fov',
                'inertia',
                'minZ', 'maxZ',
                'layerMask',
                'mode',
                'orthoBottom',
                'orthoTop',
                'orthoLeft',
                'orthoRight'
            ],
            slider: {
                fov: {min: 0, max: 180, step: 1}
            }
        },
        'Scene': {
            type: BABYLON.Scene,
            properties: [
                'actionManager',
                'activeCamera',
                'ambientColor',
                'clearColor',
                'forceWireframe',
                'forcePointsCloud',
                'forceShowBoundingBoxes',
                'useRightHandedSystem',
                'hoverCursor',
                'cameraToUseForPointers',
                'fogEnabled',
                'fogColor',
                'fogDensity',
                'fogStart',
                'fogEnd',
                'shadowsEnabled',
                'lightsEnabled',
                'collisionsEnabled',
                'gravity',
                'meshUnderPointer',
                'pointerX',
                'pointerY',
                'uid'
            ]
        },
        'Mesh': {
            type: BABYLON.Mesh,
            properties: [
                'name',
                'position',
                'rotation',
                'rotationQuaternion',
                'absolutePosition',
                'material',
                'actionManager',
                'visibility',
                'isVisible',
                'isPickable',
                'renderingGroupId',
                'receiveShadows',
                'renderOutline',
                'outlineColor',
                'outlineWidth',
                'renderOverlay',
                'overlayColor',
                'overlayAlpha',
                'hasVertexAlpha',
                'useVertexColors',
                'layerMask',
                'alwaysSelectAsActiveMesh',
                'ellipsoid',
                'ellipsoidOffset',
                'edgesWidth',
                'edgesColor',
                'checkCollisions',
                'hasLODLevels'
            ],
            format: (m: BABYLON.Mesh): string => { return m.name; },
            slider: {
                visibility: {min: 0, max: 1, step: 0.1}
            }
        },
        'StandardMaterial': {
            type: BABYLON.StandardMaterial,
            properties: [
                'name',
                'alpha',
                'alphaMode',
                'wireframe',
                'isFrozen',
                'zOffset',

                'ambientColor',
                'emissiveColor',
                'diffuseColor',
                'specularColor',

                'specularPower',
                'useAlphaFromDiffuseTexture',
                'linkEmissiveWithDiffuse',
                'useSpecularOverAlpha',

                'diffuseFresnelParameters',
                'opacityFresnelParameters',
                'reflectionFresnelParameters',
                'refractionFresnelParameters',
                'emissiveFresnelParameters',

                'diffuseTexture',
                'emissiveTexture',
                'specularTexture',
                'ambientTexture',
                'bumpTexture',
                'lightMapTexture',
                'opacityTexture',
                'reflectionTexture',
                'refractionTexture'
            ],
            format: (mat: BABYLON.StandardMaterial): string => { return mat.name; },
            slider: {
                alpha: {min: 0, max: 1, step: 0.01}
            }
        },
        'PBRMaterial': {
            type: BABYLON.PBRMaterial,
            properties: [
                'name',
                'albedoColor',
                'albedoTexture',

                'opacityTexture',
                'reflectionTexture',
                'emissiveTexture',
                'bumpTexture',
                'lightmapTexture',

                'opacityFresnelParameters',
                'emissiveFresnelParameters',

                'linkEmissiveWithAlbedo',
                'useLightmapAsShadowmap',

                'useAlphaFromAlbedoTexture',
                'useSpecularOverAlpha',
                'useAutoMicroSurfaceFromReflectivityMap',
                'useLogarithmicDepth',

                'reflectivityColor',
                'reflectivityTexture',
                'reflectionTexture',
                'reflectionColor',

                'alpha',
                'linkRefractionWithTransparency',
                'indexOfRefraction',

                'microSurface',
                'useMicroSurfaceFromReflectivityMapAlpha',

                'directIntensity',
                'emissiveIntensity',
                'specularIntensity',
                'environmentIntensity',
                'cameraExposure',
                'cameraContrast',
                'cameraColorGradingTexture',
                'cameraColorCurves'
            ],
            slider: {
                alpha: {min: 0, max: 1, step: 0.01}
            }
        },  
        'PhysicsImpostor': {
            type: BABYLON.PhysicsImpostor,
            properties: [
                'friction',
                'mass',
                'restitution',
            ]
        },
    }

}