var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Canvas2DEngineBoundData = (function () {
        function Canvas2DEngineBoundData() {
            this._modelCache = new BABYLON.StringDictionary();
        }
        Canvas2DEngineBoundData.prototype.GetOrAddModelCache = function (key, factory) {
            return this._modelCache.getOrAddWithFactory(key, factory);
        };
        Canvas2DEngineBoundData.prototype.DisposeModelRenderCache = function (modelRenderCache) {
            if (!modelRenderCache.isDisposed) {
                return false;
            }
            this._modelCache.remove(modelRenderCache.modelKey);
            return true;
        };
        return Canvas2DEngineBoundData;
    }());
    BABYLON.Canvas2DEngineBoundData = Canvas2DEngineBoundData;
    var Canvas2D = (function (_super) {
        __extends(Canvas2D, _super);
        function Canvas2D() {
            _super.apply(this, arguments);
            this._mapCounter = 0;
        }
        /**
         * Create a new 2D ScreenSpace Rendering Canvas, it is a 2D rectangle that has a size (width/height) and a position relative to the top/left corner of the screen.
         * ScreenSpace Canvas will be drawn in the Viewport as a 2D Layer lying to the top of the 3D Scene. Typically used for traditional UI.
         * All caching strategies will be available.
         * @param engine
         * @param name
         * @param pos
         * @param size
         * @param cachingStrategy
         */
        Canvas2D.CreateScreenSpace = function (scene, name, pos, size, cachingStrategy) {
            if (cachingStrategy === void 0) { cachingStrategy = Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS; }
            var c = new Canvas2D();
            c.setupCanvas(scene, name, size, true, cachingStrategy);
            c.position = pos;
            return c;
        };
        /**
         * Create a new 2D WorldSpace Rendering Canvas, it is a 2D rectangle that has a size (width/height) and a world transformation matrix to place it in the world space.
         * This kind of canvas can't have its Primitives directly drawn in the Viewport, they need to be cached in a bitmap at some point, as a consequence the DONT_CACHE strategy is unavailable. All remaining strategies are supported.
         */
        Canvas2D.CreateWorldSpace = function (scene, name, position, rotation, size, renderScaleFactor, sideOrientation, cachingStrategy) {
            if (renderScaleFactor === void 0) { renderScaleFactor = 1; }
            if (cachingStrategy === void 0) { cachingStrategy = Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS; }
            if (cachingStrategy !== Canvas2D.CACHESTRATEGY_CANVAS) {
                throw new Error("Right now only the CACHESTRATEGY_CANVAS cache Strategy is supported for WorldSpace Canvas. More will come soon!");
            }
            //if (cachingStrategy === Canvas2D.CACHESTRATEGY_DONTCACHE) {
            //    throw new Error("CACHESTRATEGY_DONTCACHE cache Strategy can't be used for WorldSpace Canvas");
            //}
            var c = new Canvas2D();
            c.setupCanvas(scene, name, new BABYLON.Size(size.width * renderScaleFactor, size.height * renderScaleFactor), false, cachingStrategy);
            var plane = new BABYLON.WorldSpaceCanvas2d(name, scene, c);
            var vertexData = BABYLON.VertexData.CreatePlane({ width: size.width / 2, height: size.height / 2, sideOrientation: sideOrientation });
            var mtl = new BABYLON.StandardMaterial(name + "_Material", scene);
            c.applyCachedTexture(vertexData, mtl);
            vertexData.applyToMesh(plane, false);
            mtl.specularColor = new BABYLON.Color3(0, 0, 0);
            mtl.disableLighting = true;
            mtl.useAlphaFromDiffuseTexture = true;
            plane.position = position;
            plane.rotationQuaternion = rotation;
            plane.material = mtl;
            return c;
        };
        Canvas2D.prototype.setupCanvas = function (scene, name, size, isScreenSpace, cachingstrategy) {
            var _this = this;
            if (isScreenSpace === void 0) { isScreenSpace = true; }
            if (cachingstrategy === void 0) { cachingstrategy = Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS; }
            this._engineData = scene.getEngine().getOrAddExternalDataWithFactory("__BJSCANVAS2D__", function (k) { return new Canvas2DEngineBoundData(); });
            this._cachingStrategy = cachingstrategy;
            this._depthLevel = 0;
            this._hierarchyMaxDepth = 100;
            this._hierarchyLevelZFactor = 1 / this._hierarchyMaxDepth;
            this._hierarchyLevelMaxSiblingCount = 1000;
            this._hierarchySiblingZDelta = this._hierarchyLevelZFactor / this._hierarchyLevelMaxSiblingCount;
            this.setupGroup2D(this, null, name, BABYLON.Vector2.Zero(), size);
            this._scene = scene;
            this._engine = scene.getEngine();
            this._renderingSize = new BABYLON.Size(0, 0);
            // Register scene dispose to also dispose the canvas when it'll happens
            scene.onDisposeObservable.add(function (d, s) {
                _this.dispose();
            });
            if (cachingstrategy !== Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                this._background = BABYLON.Rectangle2D.Create(this, "###CANVAS BACKGROUND###", 0, 0, size.width, size.height);
                this._background.origin = BABYLON.Vector2.Zero();
            }
            this._isScreeSpace = isScreenSpace;
            if (this._isScreeSpace) {
                this._afterRenderObserver = this._scene.onAfterRenderObservable.add(function (d, s) {
                    _this._engine.clear(null, false, true);
                    _this.render();
                });
            }
            else {
                this._beforeRenderObserver = this._scene.onBeforeRenderObservable.add(function (d, s) {
                    _this.render();
                });
            }
            this._supprtInstancedArray = this._engine.getCaps().instancedArrays !== null;
            //            this._supprtInstancedArray = false; // TODO REMOVE!!!
        };
        Canvas2D.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this._beforeRenderObserver) {
                this._scene.onBeforeRenderObservable.remove(this._beforeRenderObserver);
                this._beforeRenderObserver = null;
            }
            if (this._afterRenderObserver) {
                this._scene.onAfterRenderObservable.remove(this._afterRenderObserver);
                this._afterRenderObserver = null;
            }
            if (this._groupCacheMaps) {
                this._groupCacheMaps.forEach(function (m) { return m.dispose(); });
                this._groupCacheMaps = null;
            }
        };
        Object.defineProperty(Canvas2D.prototype, "scene", {
            /**
             * Accessor to the Scene that owns the Canvas
             * @returns The instance of the Scene object
             */
            get: function () {
                return this._scene;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "engine", {
            /**
             * Accessor to the Engine that drives the Scene used by this Canvas
             * @returns The instance of the Engine object
             */
            get: function () {
                return this._engine;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "cachingStrategy", {
            /**
             * Accessor of the Caching Strategy used by this Canvas.
             * See Canvas2D.CACHESTRATEGY_xxxx static members for more information
             * @returns the value corresponding to the used strategy.
             */
            get: function () {
                return this._cachingStrategy;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "supportInstancedArray", {
            get: function () {
                return this._supprtInstancedArray;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "backgroundFill", {
            /**
             * Property that defines the fill object used to draw the background of the Canvas.
             * Note that Canvas with a Caching Strategy of
             * @returns If the background is not set, null will be returned, otherwise a valid fill object is returned.
             */
            get: function () {
                if (!this._background || !this._background.isVisible) {
                    return null;
                }
                return this._background.fill;
            },
            set: function (value) {
                this.checkBackgroundAvailability();
                if (value === this._background.fill) {
                    return;
                }
                this._background.fill = value;
                this._background.isVisible = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "backgroundBorder", {
            /**
             * Property that defines the border object used to draw the background of the Canvas.
             * @returns If the background is not set, null will be returned, otherwise a valid border object is returned.
             */
            get: function () {
                if (!this._background || !this._background.isVisible) {
                    return null;
                }
                return this._background.border;
            },
            set: function (value) {
                this.checkBackgroundAvailability();
                if (value === this._background.border) {
                    return;
                }
                this._background.border = value;
                this._background.isVisible = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "backgroundRoundRadius", {
            get: function () {
                if (!this._background || !this._background.isVisible) {
                    return null;
                }
                return this._background.roundRadius;
            },
            set: function (value) {
                this.checkBackgroundAvailability();
                if (value === this._background.roundRadius) {
                    return;
                }
                this._background.roundRadius = value;
                this._background.isVisible = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "engineData", {
            get: function () {
                return this._engineData;
            },
            enumerable: true,
            configurable: true
        });
        Canvas2D.prototype.checkBackgroundAvailability = function () {
            if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                throw Error("Can't use Canvas Background with the caching strategy TOPLEVELGROUPS");
            }
        };
        Object.defineProperty(Canvas2D.prototype, "hierarchySiblingZDelta", {
            /**
             * Read-only property that return the Z delta to apply for each sibling primitives inside of a given one.
             * Sibling Primitives are defined in a specific order, the first ones will be draw below the next ones.
             * This property define the Z value to apply between each sibling Primitive. Current implementation allows 1000 Siblings Primitives per level.
             * @returns The Z Delta
             */
            get: function () {
                return this._hierarchySiblingZDelta;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "hierarchyLevelZFactor", {
            get: function () {
                return this._hierarchyLevelZFactor;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Method that renders the Canvas
         * @param camera the current camera.
         */
        Canvas2D.prototype.render = function () {
            this._renderingSize.width = this.engine.getRenderWidth();
            this._renderingSize.height = this.engine.getRenderHeight();
            var context = new BABYLON.Render2DContext();
            context.forceRefreshPrimitive = false;
            ++this._globalTransformProcessStep;
            this.updateGlobalTransVis(false);
            this._prepareGroupRender(context);
            this._groupRender(context);
        };
        /**
         * Internal method that alloc a cache for the given group.
         * Caching is made using a collection of MapTexture where many groups have their bitmapt cache stored inside.
         * @param group The group to allocate the cache of.
         * @return custom type with the PackedRect instance giving information about the cache location into the texture and also the MapTexture instance that stores the cache.
         */
        Canvas2D.prototype._allocateGroupCache = function (group) {
            // Determine size
            var size = group.actualSize;
            size = new BABYLON.Size(Math.ceil(size.width), Math.ceil(size.height));
            if (!this._groupCacheMaps) {
                this._groupCacheMaps = new Array();
            }
            // Try to find a spot in one of the cached texture
            var res = null;
            for (var _i = 0, _a = this._groupCacheMaps; _i < _a.length; _i++) {
                var map = _a[_i];
                var node = map.allocateRect(size);
                if (node) {
                    res = { node: node, texture: map };
                    break;
                }
            }
            // Couldn't find a map that could fit the rect, create a new map for it
            if (!res) {
                var mapSize = new BABYLON.Size(Canvas2D._groupTextureCacheSize, Canvas2D._groupTextureCacheSize);
                // Check if the predefined size would fit, other create a custom size using the nearest bigger power of 2
                if (size.width > mapSize.width || size.height > mapSize.height) {
                    mapSize.width = Math.pow(2, Math.ceil(Math.log(size.width) / Math.log(2)));
                    mapSize.height = Math.pow(2, Math.ceil(Math.log(size.height) / Math.log(2)));
                }
                var id = "groupsMapChache" + this._mapCounter + "forCanvas" + this.id;
                map = new BABYLON.MapTexture(id, this._scene, mapSize);
                this._groupCacheMaps.push(map);
                var node = map.allocateRect(size);
                res = { node: node, texture: map };
            }
            // Create a Sprite that will be used to render this cache, the "__cachedSpriteOfGroup__" starting id is a hack to bypass exception throwing in case of the Canvas doesn't normally allows direct primitives
            // Don't do it in case of the group being a worldspace canvas (because its texture is bound to a WorldSpaceCanvas node)
            if (group !== this || this._isScreeSpace) {
                var node = res.node;
                var sprite = BABYLON.Sprite2D.Create(this, "__cachedSpriteOfGroup__" + group.id, group.position.x, group.position.y, map, node.contentSize, node.pos, false);
                sprite.origin = BABYLON.Vector2.Zero();
                res.sprite = sprite;
            }
            return res;
        };
        /**
         * Get a Solid Color Brush instance matching the given color.
         * @param color The color to retrieve
         * @return A shared instance of the SolidColorBrush2D class that use the given color
         */
        Canvas2D.GetSolidColorBrush = function (color) {
            return Canvas2D._solidColorBrushes.getOrAddWithFactory(color.toHexString(), function () { return new BABYLON.SolidColorBrush2D(color.clone(), true); });
        };
        /**
         * Get a Solid Color Brush instance matching the given color expressed as a CSS formatted hexadecimal value.
         * @param color The color to retrieve
         * @return A shared instance of the SolidColorBrush2D class that uses the given color
         */
        Canvas2D.GetSolidColorBrushFromHex = function (hexValue) {
            return Canvas2D._solidColorBrushes.getOrAddWithFactory(hexValue, function () { return new BABYLON.SolidColorBrush2D(BABYLON.Color4.FromHexString(hexValue), true); });
        };
        Canvas2D.GetGradientColorBrush = function (color1, color2, translation, rotation, scale) {
            if (translation === void 0) { translation = BABYLON.Vector2.Zero(); }
            if (rotation === void 0) { rotation = 0; }
            if (scale === void 0) { scale = 1; }
            return Canvas2D._gradientColorBrushes.getOrAddWithFactory(BABYLON.GradientColorBrush2D.BuildKey(color1, color2, translation, rotation, scale), function () { return new BABYLON.GradientColorBrush2D(color1, color2, translation, rotation, scale, true); });
        };
        /**
         * In this strategy only the direct children groups of the Canvas will be cached, their whole content (whatever the sub groups they have) into a single bitmap.
         * This strategy doesn't allow primitives added directly as children of the Canvas.
         * You typically want to use this strategy of a screenSpace fullscreen canvas: you don't want a bitmap cache taking the whole screen resolution but still want the main contents (say UI in the topLeft and rightBottom for instance) to be efficiently cached.
         */
        Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS = 1;
        /**
         * In this strategy each group will have its own cache bitmap (except if a given group explicitly defines the DONTCACHEOVERRIDE or CACHEINPARENTGROUP behaviors).
         * This strategy is typically used if the canvas has some groups that are frequently animated. Unchanged ones will have a steady cache and the others will be refreshed when they change, reducing the redraw operation count to their content only.
         * When using this strategy, group instances can rely on the DONTCACHEOVERRIDE or CACHEINPARENTGROUP behaviors to minize the amount of cached bitmaps.
         */
        Canvas2D.CACHESTRATEGY_ALLGROUPS = 2;
        /**
         * In this strategy the whole canvas is cached into a single bitmap containing every primitives it owns, at the exception of the ones that are owned by a group having the DONTCACHEOVERRIDE behavior (these primitives will be directly drawn to the viewport at each render for screenSpace Canvas or be part of the Canvas cache bitmap for worldSpace Canvas).
         */
        Canvas2D.CACHESTRATEGY_CANVAS = 3;
        /**
         * This strategy is used to recompose/redraw the canvas entierely at each viewport render.
         * Use this strategy if memory is a concern above rendering performances and/or if the canvas is frequently animated (hence reducing the benefits of caching).
         * Note that you can't use this strategy for WorldSpace Canvas, they need at least a top level group caching.
         */
        Canvas2D.CACHESTRATEGY_DONTCACHE = 4;
        /**
         * Define the default size used for both the width and height of a MapTexture to allocate.
         * Note that some MapTexture might be bigger than this size if the first node to allocate is bigger in width or height
         */
        Canvas2D._groupTextureCacheSize = 1024;
        Canvas2D._solidColorBrushes = new BABYLON.StringDictionary();
        Canvas2D._gradientColorBrushes = new BABYLON.StringDictionary();
        Canvas2D = __decorate([
            BABYLON.className("Canvas2D")
        ], Canvas2D);
        return Canvas2D;
    }(BABYLON.Group2D));
    BABYLON.Canvas2D = Canvas2D;
})(BABYLON || (BABYLON = {}));
