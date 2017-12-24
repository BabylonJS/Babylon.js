/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var GLTFLoaderExtension = /** @class */ (function () {
            function GLTFLoaderExtension() {
                this.enabled = true;
            }
            GLTFLoaderExtension.prototype._traverseNode = function (loader, context, node, action, parentNode) { return false; };
            GLTFLoaderExtension.prototype._loadNode = function (loader, context, node) { return false; };
            GLTFLoaderExtension.prototype._loadMaterial = function (loader, context, material, assign) { return false; };
            GLTFLoaderExtension.prototype._loadExtension = function (context, property, action) {
                var _this = this;
                if (!property.extensions) {
                    return false;
                }
                var extension = property.extensions[this.name];
                if (!extension) {
                    return false;
                }
                // Clear out the extension before executing the action to avoid recursing into the same property.
                property.extensions[this.name] = undefined;
                action(context + "extensions/" + this.name, extension, function () {
                    // Restore the extension after completing the action.
                    property.extensions[_this.name] = extension;
                });
                return true;
            };
            GLTFLoaderExtension.TraverseNode = function (loader, context, node, action, parentNode) {
                return this._ApplyExtensions(function (extension) { return extension._traverseNode(loader, context, node, action, parentNode); });
            };
            GLTFLoaderExtension.LoadNode = function (loader, context, node) {
                return this._ApplyExtensions(function (extension) { return extension._loadNode(loader, context, node); });
            };
            GLTFLoaderExtension.LoadMaterial = function (loader, context, material, assign) {
                return this._ApplyExtensions(function (extension) { return extension._loadMaterial(loader, context, material, assign); });
            };
            GLTFLoaderExtension._ApplyExtensions = function (action) {
                var extensions = GLTFLoaderExtension._Extensions;
                if (!extensions) {
                    return false;
                }
                for (var _i = 0, extensions_1 = extensions; _i < extensions_1.length; _i++) {
                    var extension = extensions_1[_i];
                    if (extension.enabled && action(extension)) {
                        return true;
                    }
                }
                return false;
            };
            //
            // Utilities
            //
            GLTFLoaderExtension._Extensions = [];
            return GLTFLoaderExtension;
        }());
        GLTF2.GLTFLoaderExtension = GLTFLoaderExtension;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderExtension.js.map
