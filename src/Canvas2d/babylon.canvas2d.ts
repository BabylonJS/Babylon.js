module BABYLON {

    export class Canvas2DEngineBoundData {
        public GetOrAddModelCache<TInstData>(key: string, factory: (key: string) => ModelRenderCache): ModelRenderCache {
            return this._modelCache.getOrAddWithFactory(key, factory);
        }

        private _modelCache: StringDictionary<ModelRenderCache> = new StringDictionary<ModelRenderCache>();

        public DisposeModelRenderCache(modelRenderCache: ModelRenderCache): boolean {
            if (!modelRenderCache.isDisposed) {
                return false;
            }

            this._modelCache.remove(modelRenderCache.modelKey);

            return true;
        }
    }

    @className("Canvas2D")
    export class Canvas2D extends Group2D {
        /**
         * In this strategy only the direct children groups of the Canvas will be cached, their whole content (whatever the sub groups they have) into a single bitmap.
         * This strategy doesn't allow primitives added directly as children of the Canvas.
         * You typically want to use this strategy of a screenSpace fullscreen canvas: you don't want a bitmap cache taking the whole screen resolution but still want the main contents (say UI in the topLeft and rightBottom for instance) to be efficiently cached.
         */
        public static CACHESTRATEGY_TOPLEVELGROUPS = 1;

        /**
         * In this strategy each group will have its own cache bitmap (except if a given group explicitly defines the DONTCACHEOVERRIDE or CACHEINPARENTGROUP behaviors).
         * This strategy is typically used if the canvas has some groups that are frequently animated. Unchanged ones will have a steady cache and the others will be refreshed when they change, reducing the redraw operation count to their content only.
         * When using this strategy, group instances can rely on the DONTCACHEOVERRIDE or CACHEINPARENTGROUP behaviors to minize the amount of cached bitmaps.
         */
        public static CACHESTRATEGY_ALLGROUPS = 2;

        /**
         * In this strategy the whole canvas is cached into a single bitmap containing every primitives it owns, at the exception of the ones that are owned by a group having the DONTCACHEOVERRIDE behavior (these primitives will be directly drawn to the viewport at each render for screenSpace Canvas or be part of the Canvas cache bitmap for worldSpace Canvas).
         */
        public static CACHESTRATEGY_CANVAS = 3;

        /**
         * This strategy is used to recompose/redraw the canvas entierely at each viewport render.
         * Use this strategy if memory is a concern above rendering performances and/or if the canvas is frequently animated (hence reducing the benefits of caching).
         * Note that you can't use this strategy for WorldSpace Canvas, they need at least a top level group caching.
         */
        public static CACHESTRATEGY_DONTCACHE = 4;

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
        static CreateScreenSpace(scene: Scene, name: string, pos: Vector2, size: Size, cachingStrategy: number = Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS): Canvas2D {
            let c = new Canvas2D();
            c.setupCanvas(scene, name, size, true, cachingStrategy);
            c.position = pos;

            return c;
        }

        /**
         * Create a new 2D WorldSpace Rendering Canvas, it is a 2D rectangle that has a size (width/height) and a world transformation matrix to place it in the world space.
         * This kind of canvas can't have its Primitives directly drawn in the Viewport, they need to be cached in a bitmap at some point, as a consequence the DONT_CACHE strategy is unavailable. All remaining strategies are supported.
         */
        static CreateWorldSpace(scene: Scene, name: string, position: Vector3, rotation: Quaternion, size: Size, renderScaleFactor: number=1, sideOrientation?: number, cachingStrategy: number = Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS): Canvas2D {
            if (cachingStrategy !== Canvas2D.CACHESTRATEGY_CANVAS) {
                throw new Error("Right now only the CACHESTRATEGY_CANVAS cache Strategy is supported for WorldSpace Canvas. More will come soon!");
            }

            //if (cachingStrategy === Canvas2D.CACHESTRATEGY_DONTCACHE) {
            //    throw new Error("CACHESTRATEGY_DONTCACHE cache Strategy can't be used for WorldSpace Canvas");
            //}

            let c = new Canvas2D();
            c.setupCanvas(scene, name, new Size(size.width*renderScaleFactor, size.height*renderScaleFactor), false, cachingStrategy);

            let plane = new WorldSpaceCanvas2d(name, scene, c);
            let vertexData = VertexData.CreatePlane({ width: size.width/2, height: size.height/2, sideOrientation: sideOrientation });
            let mtl = new StandardMaterial(name + "_Material", scene);

            c.applyCachedTexture(vertexData, mtl);
            vertexData.applyToMesh(plane, false);

            mtl.specularColor = new Color3(0, 0, 0);
            mtl.disableLighting =true;
            mtl.useAlphaFromDiffuseTexture = true;
            plane.position = position;
            plane.rotationQuaternion = rotation;
            plane.material = mtl;

            return c;
        }

        protected setupCanvas(scene: Scene, name: string, size: Size, isScreenSpace: boolean = true, cachingstrategy: number = Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
            this._engineData = scene.getEngine().getOrAddExternalDataWithFactory("__BJSCANVAS2D__", k => new Canvas2DEngineBoundData());
            this._cachingStrategy = cachingstrategy;
            this._depthLevel = 0;
            this._hierarchyMaxDepth = 100;
            this._hierarchyLevelZFactor = 1 / this._hierarchyMaxDepth;
            this._hierarchyLevelMaxSiblingCount = 1000;
            this._hierarchySiblingZDelta = this._hierarchyLevelZFactor / this._hierarchyLevelMaxSiblingCount;

            this.setupGroup2D(this, null, name, Vector2.Zero(), size);

            this._scene = scene;
            this._engine = scene.getEngine();
            this._renderingSize = new Size(0, 0);

            // Register scene dispose to also dispose the canvas when it'll happens
            scene.onDisposeObservable.add((d, s) => {
                this.dispose();
            });

            if (cachingstrategy !== Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                this._background = Rectangle2D.Create(this, "###CANVAS BACKGROUND###", 0, 0, size.width, size.height);
                this._background.origin = Vector2.Zero();
            }
            this._isScreeSpace = isScreenSpace;

            if (this._isScreeSpace) {
                this._afterRenderObserver = this._scene.onAfterRenderObservable.add((d, s) => {
                    this._engine.clear(null, false, true);
                    this.render();
                });
            } else {
                this._beforeRenderObserver = this._scene.onBeforeRenderObservable.add((d, s) => {
                    this.render();
                });
            }

            this._supprtInstancedArray = this._engine.getCaps().instancedArrays !== null;
//            this._supprtInstancedArray = false; // TODO REMOVE!!!
        }

        public dispose(): boolean {
            if (!super.dispose()) {
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
                this._groupCacheMaps.forEach(m => m.dispose());
                this._groupCacheMaps = null;
            }
        }

        /**
         * Accessor to the Scene that owns the Canvas
         * @returns The instance of the Scene object
         */
        public get scene(): Scene {
            return this._scene;
        }

        /**
         * Accessor to the Engine that drives the Scene used by this Canvas
         * @returns The instance of the Engine object
         */
        public get engine(): Engine {
            return this._engine;
        }

        /**
         * Accessor of the Caching Strategy used by this Canvas.
         * See Canvas2D.CACHESTRATEGY_xxxx static members for more information
         * @returns the value corresponding to the used strategy.
         */
        public get cachingStrategy(): number {
            return this._cachingStrategy;
        }

        public get supportInstancedArray() {
            return this._supprtInstancedArray;
        }

        /**
         * Property that defines the fill object used to draw the background of the Canvas.
         * Note that Canvas with a Caching Strategy of
         * @returns If the background is not set, null will be returned, otherwise a valid fill object is returned.
         */
        public get backgroundFill(): IBrush2D {
            if (!this._background || !this._background.isVisible) {
                return null;
            }
            return this._background.fill;
        }

        public set backgroundFill(value: IBrush2D) {
            this.checkBackgroundAvailability();

            if (value === this._background.fill) {
                return;
            }

            this._background.fill = value;
            this._background.isVisible = true;
        }

        /**
         * Property that defines the border object used to draw the background of the Canvas.
         * @returns If the background is not set, null will be returned, otherwise a valid border object is returned.
         */
        public get backgroundBorder(): IBrush2D {
            if (!this._background || !this._background.isVisible) {
                return null;
            }
            return this._background.border;
        }

        public set backgroundBorder(value: IBrush2D) {
            this.checkBackgroundAvailability();

            if (value === this._background.border) {
                return;
            }

            this._background.border = value;
            this._background.isVisible = true;
        }

        public get backgroundRoundRadius(): number {
            if (!this._background || !this._background.isVisible) {
                return null;
            }
            return this._background.roundRadius;
        }

        public set backgroundRoundRadius(value: number) {
            this.checkBackgroundAvailability();

            if (value === this._background.roundRadius) {
                return;
            }

            this._background.roundRadius = value;
            this._background.isVisible = true;
        }

        public get engineData(): Canvas2DEngineBoundData {
            return this._engineData;
        }

        private checkBackgroundAvailability() {
            if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                throw Error("Can't use Canvas Background with the caching strategy TOPLEVELGROUPS");
            }
        }

        /**
         * Read-only property that return the Z delta to apply for each sibling primitives inside of a given one.
         * Sibling Primitives are defined in a specific order, the first ones will be draw below the next ones.
         * This property define the Z value to apply between each sibling Primitive. Current implementation allows 1000 Siblings Primitives per level.
         * @returns The Z Delta
         */
        public get hierarchySiblingZDelta(): number {
            return this._hierarchySiblingZDelta;
        }

        public get hierarchyLevelZFactor(): number {
            return this._hierarchyLevelZFactor;
        }

        private _engineData: Canvas2DEngineBoundData;
        private _mapCounter = 0;
        private _background: Rectangle2D;
        private _scene: Scene;
        private _engine: Engine;
        private _isScreeSpace: boolean;
        private _cachingStrategy: number;
        private _hierarchyMaxDepth: number;
        private _hierarchyLevelZFactor: number;
        private _hierarchyLevelMaxSiblingCount: number;
        private _hierarchySiblingZDelta: number;
        private _groupCacheMaps: MapTexture[];
        private _beforeRenderObserver: Observer<Scene>;
        private _afterRenderObserver: Observer<Scene>;
        private _supprtInstancedArray : boolean;

        public _renderingSize: Size;

        /**
         * Method that renders the Canvas
         * @param camera the current camera.
         */
        public render() {
            this._renderingSize.width = this.engine.getRenderWidth();
            this._renderingSize.height = this.engine.getRenderHeight();

            var context = new Render2DContext();
            context.forceRefreshPrimitive = false;

            ++this._globalTransformProcessStep;
            this.updateGlobalTransVis(false);

            this._prepareGroupRender(context);
            this._groupRender(context);
        }

        /**
         * Internal method that alloc a cache for the given group.
         * Caching is made using a collection of MapTexture where many groups have their bitmapt cache stored inside.
         * @param group The group to allocate the cache of.
         * @return custom type with the PackedRect instance giving information about the cache location into the texture and also the MapTexture instance that stores the cache.
         */
        public _allocateGroupCache(group: Group2D): { node: PackedRect, texture: MapTexture, sprite: Sprite2D } {
            // Determine size
            let size = group.actualSize;
            size = new Size(Math.ceil(size.width), Math.ceil(size.height));
            if (!this._groupCacheMaps) {
                this._groupCacheMaps = new Array<MapTexture>();
            }

            // Try to find a spot in one of the cached texture
            let res = null;
            for (var map of this._groupCacheMaps) {
                let node = map.allocateRect(size);
                if (node) {
                    res = { node: node, texture: map }
                    break;
                }
            }

            // Couldn't find a map that could fit the rect, create a new map for it
            if (!res) {
                let mapSize = new Size(Canvas2D._groupTextureCacheSize, Canvas2D._groupTextureCacheSize);

                // Check if the predefined size would fit, other create a custom size using the nearest bigger power of 2
                if (size.width > mapSize.width || size.height > mapSize.height) {
                    mapSize.width = Math.pow(2, Math.ceil(Math.log(size.width) / Math.log(2)));
                    mapSize.height = Math.pow(2, Math.ceil(Math.log(size.height) / Math.log(2)));
                }

                let id = `groupsMapChache${this._mapCounter}forCanvas${this.id}`;
                map = new MapTexture(id, this._scene, mapSize);
                this._groupCacheMaps.push(map);

                let node = map.allocateRect(size);
                res = { node: node, texture: map }
            }

            // Create a Sprite that will be used to render this cache, the "__cachedSpriteOfGroup__" starting id is a hack to bypass exception throwing in case of the Canvas doesn't normally allows direct primitives
            // Don't do it in case of the group being a worldspace canvas (because its texture is bound to a WorldSpaceCanvas node)
            if (group !== <any>this || this._isScreeSpace) {
                let node: PackedRect = res.node;
                let sprite = Sprite2D.Create(this, `__cachedSpriteOfGroup__${group.id}`, group.position.x, group.position.y, map, node.contentSize, node.pos, false);
                sprite.origin = Vector2.Zero();
                res.sprite = sprite;
            }
            return res;
        }

        /**
         * Define the default size used for both the width and height of a MapTexture to allocate.
         * Note that some MapTexture might be bigger than this size if the first node to allocate is bigger in width or height
         */
        private static _groupTextureCacheSize = 1024;

        /**
         * Get a Solid Color Brush instance matching the given color.
         * @param color The color to retrieve
         * @return A shared instance of the SolidColorBrush2D class that use the given color
         */
        public static GetSolidColorBrush(color: Color4): IBrush2D {
            return Canvas2D._solidColorBrushes.getOrAddWithFactory(color.toHexString(), () => new SolidColorBrush2D(color.clone(), true));
        }

        /**
         * Get a Solid Color Brush instance matching the given color expressed as a CSS formatted hexadecimal value.
         * @param color The color to retrieve
         * @return A shared instance of the SolidColorBrush2D class that uses the given color
         */
        public static GetSolidColorBrushFromHex(hexValue: string): IBrush2D {
            return Canvas2D._solidColorBrushes.getOrAddWithFactory(hexValue, () => new SolidColorBrush2D(Color4.FromHexString(hexValue), true));
        }

        public static GetGradientColorBrush(color1: Color4, color2: Color4, translation: Vector2 = Vector2.Zero(), rotation: number = 0, scale: number = 1): IBrush2D {
            return Canvas2D._gradientColorBrushes.getOrAddWithFactory(GradientColorBrush2D.BuildKey(color1, color2, translation, rotation, scale), () => new GradientColorBrush2D(color1, color2, translation, rotation, scale, true));
        }

        private static _solidColorBrushes: StringDictionary<IBrush2D> = new StringDictionary<IBrush2D>();
        private static _gradientColorBrushes: StringDictionary<IBrush2D> = new StringDictionary<IBrush2D>();
    }
}