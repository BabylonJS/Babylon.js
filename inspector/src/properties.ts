module INSPECTOR {
    
    export const PROPERTIES = {
        /** Format the given object : 
         * If a format function exists, returns the result of this function.
         * If this function doesn't exists, return the object type instead */
        format : (obj:any) => {
            let type = Helpers.GET_TYPE(obj) ||  'type_not_defined';
            if (PROPERTIES[type] && PROPERTIES[type].format) {
                return PROPERTIES[type].format(obj);
            } else {
                return Helpers.GET_TYPE(obj);
            }
        },
        'type_not_defined' : {
            properties : [],
            format: () => ''
        },
        
        'Vector2' : {
            type: BABYLON.Vector2,
            properties: ['x', 'y'],
            format: (vec : BABYLON.Vector2) => {return `x:${Helpers.Trunc(vec.x)}, y:${Helpers.Trunc(vec.y)}`;}
        },
        'Vector3' : {
            type: BABYLON.Vector3,
            properties: ['x', 'y', 'z'],
            format: (vec : BABYLON.Vector3) => {return `x:${Helpers.Trunc(vec.x)}, y:${Helpers.Trunc(vec.y)}, z:${Helpers.Trunc(vec.z)}`} 
        },
        'Color3' : {
            type: BABYLON.Color3,
            properties : ['r', 'g', 'b'],
            format: (color: BABYLON.Color3) => { return `R:${color.r}, G:${color.g}, B:${color.b}`}
        },
        'Quaternion' : {
            type: BABYLON.Quaternion,
            properties : ['x', 'y', 'z', 'w']
        },
        'Size' : {
            type: BABYLON.Size,
            properties :['width', 'height'],
            format: (size:BABYLON.Size) => { return `Size - w:${Helpers.Trunc(size.width)}, h:${Helpers.Trunc(size.height)}`} 
        },
        'Texture' : {
            type: BABYLON.Texture,
            properties :[
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
            format: (tex:BABYLON.Texture) => { return tex.name} 
        },
        
        'ArcRotateCamera' : {
            type: BABYLON.ArcRotateCamera,
            properties : [
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
        
        'Scene' : {
            type: BABYLON.Scene,
            properties:[
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
            properties : [
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
            format : (m:BABYLON.Mesh) : string => {return m.name;}
        },        
        'StandardMaterial' : {
            type: BABYLON.StandardMaterial,
            properties : [
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
            format : (mat:BABYLON.StandardMaterial) : string => {return mat.name;}
        },
        'PrimitiveAlignment':{
            type: BABYLON.PrimitiveAlignment,
            properties:['horizontal', 'vertical']
        },
        'PrimitiveThickness':{
            type: BABYLON.PrimitiveThickness,
            properties:['topPixels', 'leftPixels', 'rightPixels', 'bottomPixels']
        },
        'BoundingInfo2D':{
            type: BABYLON.BoundingInfo2D,
            properties:['radius','center', 'extent']
        },
        'SolidColorBrush2D':{
            type: BABYLON.SolidColorBrush2D,
            properties:['color']
        },
        'GradientColorBrush2D':{
            type: BABYLON.GradientColorBrush2D,
            properties:['color1', 'color2', 'translation', 'rotation', 'scale']
        },
        'PBRMaterial' : {
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
        }
        
    }
    
}