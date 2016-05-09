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
    var GroupsCacheMap = (function () {
        function GroupsCacheMap() {
            this.groupSprites = new Array();
        }
        return GroupsCacheMap;
    }());
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
         * @param engine
         * @param name
         * @param transform
         * @param size
         * @param cachingStrategy
         */
        Canvas2D.CreateWorldSpace = function (scene, name, transform, size, cachingStrategy) {
            if (cachingStrategy === void 0) { cachingStrategy = Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS; }
            if (cachingStrategy === Canvas2D.CACHESTRATEGY_DONTCACHE) {
                throw new Error("CACHESTRATEGY_DONTCACHE cache Strategy can't be used for WorldSpace Canvas");
            }
            var c = new Canvas2D();
            c.setupCanvas(scene, name, size, false, cachingStrategy);
            c._worldTransform = transform;
            return c;
        };
        Canvas2D.prototype.setupCanvas = function (scene, name, size, isScreenSpace, cachingstrategy) {
            if (isScreenSpace === void 0) { isScreenSpace = true; }
            if (cachingstrategy === void 0) { cachingstrategy = Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS; }
            this._cachingStrategy = cachingstrategy;
            this._hierarchyLevelZFactor = 100;
            this._hierarchyLevelMaxSiblingCount = 1000;
            this._hierarchySiblingZDelta = this._hierarchyLevelZFactor / this._hierarchyLevelMaxSiblingCount;
            this.setupGroup2D(this, null, name, BABYLON.Vector2.Zero(), size);
            this._scene = scene;
            this._engine = scene.getEngine();
            this._renderingSize = new BABYLON.Size(0, 0);
            if (cachingstrategy !== Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                this._background = BABYLON.Rectangle2D.Create(this, "###CANVAS BACKGROUND###", 0, 0, size.width, size.height);
                this._background.levelVisible = false;
            }
            this._isScreeSpace = isScreenSpace;
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
        Object.defineProperty(Canvas2D.prototype, "border", {
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
        /**
         * Method that renders the Canvas
         * @param camera the current camera.
         */
        Canvas2D.prototype.render = function (camera) {
            this._renderingSize.width = this.engine.getRenderWidth();
            this._renderingSize.height = this.engine.getRenderHeight();
            var context = new BABYLON.Render2DContext();
            context.camera = camera;
            context.parentVisibleState = this.levelVisible;
            context.parentTransform = BABYLON.Matrix.Identity();
            context.parentTransformStep = 1;
            context.forceRefreshPrimitive = false;
            this.updateGlobalTransVis(context, false);
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
                var g = _a[_i];
                var node = g.texture.allocateRect(size);
                if (node) {
                    res = { node: node, texture: g.texture };
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
                g = new GroupsCacheMap();
                var id = "groupsMapChache" + this._mapCounter + "forCanvas" + this.id;
                g.texture = new BABYLON.MapTexture(id, this._scene, mapSize);
                this._groupCacheMaps.push(g);
                var node = g.texture.allocateRect(size);
                res = { node: node, texture: g.texture };
            }
            // Create a Sprite that will be used to render this cache, the "__cachedSpriteOfGroup__" starting id is a hack to bypass exception throwing in case of the Canvas doesn't normally allows direct primitives
            var sprite = BABYLON.Sprite2D.Create(this, "__cachedSpriteOfGroup__" + group.id, 10, 10, g.texture, res.node.contentSize, res.node.pos, true);
            sprite.origin = BABYLON.Vector2.Zero();
            g.groupSprites.push({ group: group, sprite: sprite });
            return res;
        };
        /**
         * Get a Solid Color Fill instance matching the given color.
         * @param color The color to retrieve
         * @return A shared instance of the SolidColorFill2D class that use the given color
         */
        Canvas2D.GetSolidColorFill = function (color) {
            return Canvas2D._solidColorFills.getOrAddWithFactory(color.toHexString(), function () { return new BABYLON.SolidColorFill2D(color.clone(), true); });
        };
        /**
         * Get a Solid Color Border instance matching the given color.
         * @param color The color to retrieve
         * @return A shared instance of the SolidColorBorder2D class that use the given color
         */
        Canvas2D.GetSolidColorBorder = function (color) {
            return Canvas2D._solidColorBorders.getOrAddWithFactory(color.toHexString(), function () { return new BABYLON.SolidColorBorder2D(color.clone(), true); });
        };
        /**
         * Get a Solid Color Fill instance matching the given color expressed as a CSS formatted hexadecimal value.
         * @param color The color to retrieve
         * @return A shared instance of the SolidColorFill2D class that use the given color
         */
        Canvas2D.GetSolidColorFillFromHex = function (hexValue) {
            return Canvas2D._solidColorFills.getOrAddWithFactory(hexValue, function () { return new BABYLON.SolidColorFill2D(BABYLON.Color4.FromHexString(hexValue), true); });
        };
        /**
         * Get a Solid Color Border instance matching the given color expressed as a CSS formatted hexadecimal value.
         * @param color The color to retrieve
         * @return A shared instance of the SolidColorBorder2D class that use the given color
         */
        Canvas2D.GetSolidColorBorderFromHex = function (hexValue) {
            return Canvas2D._solidColorBorders.getOrAddWithFactory(hexValue, function () { return new BABYLON.SolidColorBorder2D(BABYLON.Color4.FromHexString(hexValue), true); });
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
        Canvas2D._solidColorFills = new BABYLON.StringDictionary();
        Canvas2D._solidColorBorders = new BABYLON.StringDictionary();
        Canvas2D = __decorate([
            BABYLON.className("Canvas2D")
        ], Canvas2D);
        return Canvas2D;
    }(BABYLON.Group2D));
    BABYLON.Canvas2D = Canvas2D;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.canvas2d.js.map