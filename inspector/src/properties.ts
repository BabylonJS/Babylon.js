module INSPECTOR {

    export const PROPERTIES = {
        /** Format the given object : 
         * If a format function exists, returns the result of this function.
         * If this function doesn't exists, return the object type instead */
        format: (obj: any) => {
            let type = Helpers.GET_TYPE(obj) || 'type_not_defined';
            if (PROPERTIES[type] && PROPERTIES[type].format) {
                return PROPERTIES[type].format(obj);
            } else {
                return Helpers.GET_TYPE(obj);
            }
        },
        'type_not_defined': {
            properties: [],
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
            format: (color: BABYLON.Color3) => { return `R:${color.r}, G:${color.g}, B:${color.b}` }
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
        'MapTexture': {
            type: BABYLON.MapTexture
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
        'FontTexture': {
            type: BABYLON.FontTexture
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
            ]
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
            ]
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
            format: (m: BABYLON.Mesh): string => { return m.name; }
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
            format: (mat: BABYLON.StandardMaterial): string => { return mat.name; }
        },
        'PrimitiveAlignment': {
            type: BABYLON.PrimitiveAlignment,
            properties: ['horizontal', 'vertical']
        },
        'PrimitiveThickness': {
            type: BABYLON.PrimitiveThickness,
            properties: ['topPixels', 'leftPixels', 'rightPixels', 'bottomPixels']
        },
        'BoundingInfo2D': {
            type: BABYLON.BoundingInfo2D,
            properties: ['radius', 'center', 'extent']
        },
        'SolidColorBrush2D': {
            type: BABYLON.SolidColorBrush2D,
            properties: ['color']
        },
        'GradientColorBrush2D': {
            type: BABYLON.GradientColorBrush2D,
            properties: ['color1', 'color2', 'translation', 'rotation', 'scale']
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
            ]
        },
        'Canvas2D': {
            type: BABYLON.Canvas2D
        },
        'Canvas2DEngineBoundData': {
            type: BABYLON.Canvas2DEngineBoundData
        },
        'Ellipse2D': {
            type: BABYLON.Ellipse2D
        },
        'Ellipse2DInstanceData': {
            type: BABYLON.Ellipse2DInstanceData
        },
        'Ellipse2DRenderCache': {
            type: BABYLON.Ellipse2DRenderCache
        },
        'Group2D': {
            type: BABYLON.Group2D
        },
        'IntersectInfo2D': {
            type: BABYLON.IntersectInfo2D
        },
        'Lines2D': {
            type: BABYLON.Lines2D
        },
        'Lines2DInstanceData': {
            type: BABYLON.Lines2DInstanceData
        },
        'Lines2DRenderCache': {
            type: BABYLON.Lines2DRenderCache
        },
        'PrepareRender2DContext': {
            type: BABYLON.PrepareRender2DContext
        },
        'Prim2DBase': {
            type: BABYLON.Prim2DBase
        },
        'Prim2DClassInfo': {
            type: BABYLON.Prim2DClassInfo
        },
        'Prim2DPropInfo': {
            type: BABYLON.Prim2DPropInfo
        },
        'Rectangle2D': {
            type: BABYLON.Rectangle2D
        },
        'Rectangle2DInstanceData': {
            type: BABYLON.Rectangle2DInstanceData
        },
        'Rectangle2DRenderCache': {
            type: BABYLON.Rectangle2DRenderCache
        },
        'Render2DContext': {
            type: BABYLON.Render2DContext
        },
        'RenderablePrim2D': {
            type: BABYLON.RenderablePrim2D
        },
        'ScreenSpaceCanvas2D': {
            type: BABYLON.ScreenSpaceCanvas2D
        },
        'Shape2D': {
            type: BABYLON.Shape2D
        },
        'Shape2DInstanceData': {
            type: BABYLON.Shape2DInstanceData
        },
        'Sprite2D': {
            type: BABYLON.Sprite2D
        },
        'Sprite2DInstanceData': {
            type: BABYLON.Sprite2DInstanceData
        },
        'Sprite2DRenderCache': {
            type: BABYLON.Sprite2DRenderCache
        },
        'Text2D': {
            type: BABYLON.Text2D
        },
        'Text2DInstanceData': {
            type: BABYLON.Text2DInstanceData
        },
        'Text2DRenderCache': {
            type: BABYLON.Text2DRenderCache
        },
        'WorldSpaceCanvas2D': {
            type: BABYLON.WorldSpaceCanvas2D
        },
        'WorldSpaceCanvas2DNode': {
            type: BABYLON.WorldSpaceCanvas2DNode
        }
    }

}