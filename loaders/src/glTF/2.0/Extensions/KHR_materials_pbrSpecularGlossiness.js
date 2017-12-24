/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            var KHRMaterialsPbrSpecularGlossiness = /** @class */ (function (_super) {
                __extends(KHRMaterialsPbrSpecularGlossiness, _super);
                function KHRMaterialsPbrSpecularGlossiness() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                Object.defineProperty(KHRMaterialsPbrSpecularGlossiness.prototype, "name", {
                    get: function () {
                        return "KHR_materials_pbrSpecularGlossiness";
                    },
                    enumerable: true,
                    configurable: true
                });
                KHRMaterialsPbrSpecularGlossiness.prototype._loadMaterial = function (loader, context, material, assign) {
                    var _this = this;
                    return this._loadExtension(context, material, function (context, extension, onComplete) {
                        loader._createPbrMaterial(material);
                        loader._loadMaterialBaseProperties(context, material);
                        _this._loadSpecularGlossinessProperties(loader, context, material, extension);
                        assign(material.babylonMaterial, true);
                        onComplete();
                    });
                };
                KHRMaterialsPbrSpecularGlossiness.prototype._loadSpecularGlossinessProperties = function (loader, context, material, properties) {
                    var babylonMaterial = material.babylonMaterial;
                    babylonMaterial.albedoColor = properties.diffuseFactor ? BABYLON.Color3.FromArray(properties.diffuseFactor) : new BABYLON.Color3(1, 1, 1);
                    babylonMaterial.reflectivityColor = properties.specularFactor ? BABYLON.Color3.FromArray(properties.specularFactor) : new BABYLON.Color3(1, 1, 1);
                    babylonMaterial.microSurface = properties.glossinessFactor == null ? 1 : properties.glossinessFactor;
                    if (properties.diffuseTexture) {
                        var texture = GLTF2.GLTFLoader._GetProperty(loader._gltf.textures, properties.diffuseTexture.index);
                        if (!texture) {
                            throw new Error(context + ": Failed to find diffuse texture " + properties.diffuseTexture.index);
                        }
                        babylonMaterial.albedoTexture = loader._loadTexture("textures[" + texture.index + "]", texture, properties.diffuseTexture.texCoord);
                    }
                    if (properties.specularGlossinessTexture) {
                        var texture = GLTF2.GLTFLoader._GetProperty(loader._gltf.textures, properties.specularGlossinessTexture.index);
                        if (!texture) {
                            throw new Error(context + ": Failed to find diffuse texture " + properties.specularGlossinessTexture.index);
                        }
                        babylonMaterial.reflectivityTexture = loader._loadTexture("textures[" + texture.index + "]", texture, properties.specularGlossinessTexture.texCoord);
                        babylonMaterial.reflectivityTexture.hasAlpha = true;
                        babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
                    }
                    loader._loadMaterialAlphaProperties(context, material, properties.diffuseFactor);
                };
                return KHRMaterialsPbrSpecularGlossiness;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.KHRMaterialsPbrSpecularGlossiness = KHRMaterialsPbrSpecularGlossiness;
            GLTF2.GLTFLoader.RegisterExtension(new KHRMaterialsPbrSpecularGlossiness());
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_materials_pbrSpecularGlossiness.js.map
