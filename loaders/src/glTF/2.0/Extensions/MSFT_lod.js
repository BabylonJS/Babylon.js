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
            // See https://github.com/sbtron/glTF/tree/MSFT_lod/extensions/Vendor/MSFT_lod for more information about this extension.
            var MSFTLOD = /** @class */ (function (_super) {
                __extends(MSFTLOD, _super);
                function MSFTLOD() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    /**
                     * Specify the minimal delay between LODs in ms (default = 250)
                     */
                    _this.Delay = 250;
                    return _this;
                }
                Object.defineProperty(MSFTLOD.prototype, "name", {
                    get: function () {
                        return "MSFT_lod";
                    },
                    enumerable: true,
                    configurable: true
                });
                MSFTLOD.prototype._traverseNode = function (loader, context, node, action, parentNode) {
                    return this._loadExtension(context, node, function (context, extension, onComplete) {
                        for (var i = extension.ids.length - 1; i >= 0; i--) {
                            var lodNode = GLTF2.GLTFLoader._GetProperty(loader._gltf.nodes, extension.ids[i]);
                            if (!lodNode) {
                                throw new Error(context + ": Failed to find node " + extension.ids[i]);
                            }
                            loader._traverseNode(context, lodNode, action, parentNode);
                        }
                        loader._traverseNode(context, node, action, parentNode);
                        onComplete();
                    });
                };
                MSFTLOD.prototype._loadNode = function (loader, context, node) {
                    var _this = this;
                    return this._loadExtension(context, node, function (context, extension, onComplete) {
                        var nodes = [node];
                        for (var _i = 0, _a = extension.ids; _i < _a.length; _i++) {
                            var index = _a[_i];
                            var lodNode = GLTF2.GLTFLoader._GetProperty(loader._gltf.nodes, index);
                            if (!lodNode) {
                                throw new Error(context + ": Failed to find node " + index);
                            }
                            nodes.push(lodNode);
                        }
                        loader._addLoaderPendingData(node);
                        _this._loadNodeLOD(loader, context, nodes, nodes.length - 1, function () {
                            loader._removeLoaderPendingData(node);
                            onComplete();
                        });
                    });
                };
                MSFTLOD.prototype._loadNodeLOD = function (loader, context, nodes, index, onComplete) {
                    var _this = this;
                    loader._whenAction(function () {
                        loader._loadNode(context, nodes[index]);
                    }, function () {
                        if (index !== nodes.length - 1) {
                            var previousNode = nodes[index + 1];
                            previousNode.babylonMesh.setEnabled(false);
                        }
                        if (index === 0) {
                            onComplete();
                            return;
                        }
                        setTimeout(function () {
                            loader._tryCatchOnError(function () {
                                _this._loadNodeLOD(loader, context, nodes, index - 1, onComplete);
                            });
                        }, _this.Delay);
                    });
                };
                MSFTLOD.prototype._loadMaterial = function (loader, context, material, assign) {
                    var _this = this;
                    return this._loadExtension(context, material, function (context, extension, onComplete) {
                        var materials = [material];
                        for (var _i = 0, _a = extension.ids; _i < _a.length; _i++) {
                            var index = _a[_i];
                            var lodMaterial = GLTF2.GLTFLoader._GetProperty(loader._gltf.materials, index);
                            if (!lodMaterial) {
                                throw new Error(context + ": Failed to find material " + index);
                            }
                            materials.push(lodMaterial);
                        }
                        loader._addLoaderPendingData(material);
                        _this._loadMaterialLOD(loader, context, materials, materials.length - 1, assign, function () {
                            loader._removeLoaderPendingData(material);
                            onComplete();
                        });
                    });
                };
                MSFTLOD.prototype._loadMaterialLOD = function (loader, context, materials, index, assign, onComplete) {
                    var _this = this;
                    loader._loadMaterial(context, materials[index], function (babylonMaterial, isNew) {
                        if (index === materials.length - 1) {
                            assign(babylonMaterial, isNew);
                            // Load the next LOD when the loader is ready to render.
                            loader._executeWhenRenderReady(function () {
                                _this._loadMaterialLOD(loader, context, materials, index - 1, assign, onComplete);
                            });
                        }
                        else {
                            BABYLON.BaseTexture.WhenAllReady(babylonMaterial.getActiveTextures(), function () {
                                assign(babylonMaterial, isNew);
                                if (index === 0) {
                                    onComplete();
                                }
                                else {
                                    setTimeout(function () {
                                        loader._tryCatchOnError(function () {
                                            _this._loadMaterialLOD(loader, context, materials, index - 1, assign, onComplete);
                                        });
                                    }, _this.Delay);
                                }
                            });
                        }
                    });
                };
                return MSFTLOD;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.MSFTLOD = MSFTLOD;
            GLTF2.GLTFLoader.RegisterExtension(new MSFTLOD());
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=MSFT_lod.js.map
