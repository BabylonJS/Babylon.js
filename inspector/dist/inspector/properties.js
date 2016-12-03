var INSPECTOR;
(function (INSPECTOR) {
    INSPECTOR.PROPERTIES = {
        /** Format the given object :
         * If a format function exists, returns the result of this function.
         * If this function doesn't exists, return the object type instead */
        format: function (obj) {
            var type = INSPECTOR.Helpers.GET_TYPE(obj) || 'default';
            if (INSPECTOR.PROPERTIES[type] && INSPECTOR.PROPERTIES[type].format) {
                return INSPECTOR.PROPERTIES[type].format(obj);
            }
            else {
                return INSPECTOR.Helpers.GET_TYPE(obj);
            }
        },
        'Vector2': {
            properties: ['x', 'y'],
            format: function (vec) { return "x:" + INSPECTOR.Helpers.Trunc(vec.x) + ", y:" + INSPECTOR.Helpers.Trunc(vec.y); }
        },
        'Vector3': {
            properties: ['x', 'y', 'z'],
            format: function (vec) { return "x:" + INSPECTOR.Helpers.Trunc(vec.x) + ", y:" + INSPECTOR.Helpers.Trunc(vec.y) + ", z:" + INSPECTOR.Helpers.Trunc(vec.z); }
        },
        'Color3': {
            properties: ['r', 'g', 'b'],
            format: function (color) { return "R:" + color.r + ", G:" + color.g + ", B:" + color.b; }
        },
        'Quaternion': {
            properties: ['x', 'y', 'z', 'w']
        },
        'Size': {
            properties: ['width', 'height'],
            format: function (size) { return "Size - w:" + INSPECTOR.Helpers.Trunc(size.width) + ", h:" + INSPECTOR.Helpers.Trunc(size.height); }
        },
        'Texture': {
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
        },
        'ArcRotateCamera': {
            properties: ['alpha', 'beta', 'radius']
        },
        'Scene': {
            properties: ['actionManager', 'activeCamera', 'ambientColor', 'clearColor']
        },
        'Mesh': {
            properties: [
                'name',
                'position',
                'rotation',
                'rotationQuaternion',
                'absolutePosition',
                'material'
            ],
            format: function (m) { return m.name; }
        },
        'StandardMaterial': {
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
            format: function (mat) { return mat.name; }
        },
        'PrimitiveAlignment': {
            properties: ['horizontal', 'vertical']
        },
        'PrimitiveThickness': {
            properties: ['topPixels', 'leftPixels', 'rightPixels', 'bottomPixels']
        },
        'BoundingInfo2D': {
            properties: ['radius', 'center', 'extent']
        },
        'SolidColorBrush2D': {
            properties: ['color']
        },
        'GradientColorBrush2D': {
            properties: ['color1', 'color2', 'translation', 'rotation', 'scale']
        },
        'PBRMaterial': {
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
    };
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=properties.js.map