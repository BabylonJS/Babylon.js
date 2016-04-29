module BABYLON {
    class GroupsCacheMap {
        constructor() {
            this.groupSprites = new Array<{ group: Group2D, sprite: Sprite2D }>();
        }
        texture: MapTexture;
        groupSprites: Array<{ group: Group2D, sprite: Sprite2D }>;
    }

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
         * @param engine
         * @param name
         * @param transform
         * @param size
         * @param cachingStrategy
         */
        static CreateWorldSpace(scene: Scene, name: string, transform: Matrix, size: Size, cachingStrategy: number = Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS): Canvas2D {
            if (cachingStrategy === Canvas2D.CACHESTRATEGY_DONTCACHE) {
                throw new Error("CACHESTRATEGY_DONTCACHE cache Strategy can't be used for WorldSpace Canvas");
            }

            let c = new Canvas2D();
            c.setupCanvas(scene, name, size, false, cachingStrategy);
            c._worldTransform = transform;

            return c;
        }

        protected setupCanvas(scene: Scene, name: string, size: Size, isScreenSpace: boolean = true, cachingstrategy: number = Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
            this._cachingStrategy = cachingstrategy;
            this._hierarchyLevelZFactor = 100;
            this._hierarchyLevelMaxSiblingCount = 1000;
            this._hierarchySiblingZDelta = this._hierarchyLevelZFactor / this._hierarchyLevelMaxSiblingCount;

            this.setupGroup2D(this, null, name, Vector2.Zero(), size);

            this._scene = scene;
            this._engine = scene.getEngine();
            this._renderingSize = new Size(0, 0);

            if (cachingstrategy !== Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                this._background = Rectangle2D.Create(this, "###CANVAS BACKGROUND###", 0, 0, size.width, size.height);
                this._background.levelVisible = false;
            }
            this._isScreeSpace = isScreenSpace;
        }

        public get scene(): Scene {
            return this._scene;
        }

        public get engine(): Engine {
            return this._engine;
        }

        public get cachingStrategy(): number {
            return this._cachingStrategy;
        }

        public get backgroundFill(): IFill2D {
            if (!this._background || !this._background.isVisible) {
                return null;
            }
            return this._background.fill;
        }

        public set backgroundFill(value: IFill2D) {
            this.checkBackgroundAvailability();

            if (value === this._background.fill) {
                return;
            }

            this._background.fill = value;
            this._background.isVisible = true;
        }

        public get border(): IBorder2D {
            if (!this._background || !this._background.isVisible) {
                return null;
            }
            return this._background.border;
        }

        public set border(value: IBorder2D) {
            this.checkBackgroundAvailability();

            if (value === this._background.border) {
                return;
            }

            this._background.border = value;
            this._background.isVisible = true;
        }

        private checkBackgroundAvailability() {
            if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                throw Error("Can't use Canvas Background with the caching strategy TOPLEVELGROUPS");
            }
        }

        public get hierarchySiblingZDelta(): number {
            return this._hierarchySiblingZDelta;
        }
        private _mapCounter = 0;
        private _background: Rectangle2D;
        private _scene: Scene;
        private _engine: Engine;
        private _isScreeSpace: boolean;
        private _worldTransform: Matrix;
        private _cachingStrategy: number;
        private _hierarchyLevelZFactor: number;
        private _hierarchyLevelMaxSiblingCount: number;
        private _hierarchySiblingZDelta: number;
        private _groupCacheMaps: GroupsCacheMap[];
        public _renderingSize: Size;

        public render(camera: Camera) {
            this._renderingSize.width = this.engine.getRenderWidth();
            this._renderingSize.height = this.engine.getRenderHeight();

            var context = new Render2DContext();
            context.camera = camera;
            context.parentVisibleState = this.levelVisible;
            context.parentTransform = Matrix.Identity();
            context.parentTransformStep = 1;
            context.forceRefreshPrimitive = false;

            this.updateGlobalTransVis(context, false);

            this._prepareGroupRender(context);
            this._groupRender(context);
        }

        public _allocateGroupCache(group: Group2D): { node: PackedRect, texture: MapTexture } {
            // Determine size
            let size = group.actualSize;
            size = new Size(Math.ceil(size.width), Math.ceil(size.height));
            if (!this._groupCacheMaps) {
                this._groupCacheMaps = new Array<GroupsCacheMap>();
            }

            // Try to find a spot in one of the cached texture
            let res = null;
            for (var g of this._groupCacheMaps) {
                let node = g.texture.allocateRect(size);
                if (node) {
                    res = { node: node, texture: g.texture }
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

                g = new GroupsCacheMap();
                let id = `groupsMapChache${this._mapCounter}forCanvas${this.id}`;
                g.texture = new MapTexture(id, this._scene, mapSize);
                this._groupCacheMaps.push(g);

                let node = g.texture.allocateRect(size);
                res = { node: node, texture: g.texture }
            }

            // Create a Sprite that will be used to render this cache, the "__cachedSpriteOfGroup__" starting id is a hack to bypass exception throwing in case of the Canvas doesn't normally allows direct primitives
            let sprite = Sprite2D.Create(this, `__cachedSpriteOfGroup__${group.id}`, 10, 10, g.texture, res.node.contentSize, res.node.pos, true);
            sprite.origin = Vector2.Zero();
            g.groupSprites.push({ group: group, sprite: sprite });
            return res;
        }

        private static _groupTextureCacheSize = 1024;

        public static getSolidColorFill(color: Color4): IFill2D {
            return Canvas2D._solidColorFills.getOrAddWithFactory(color.toHexString(), () => new SolidColorFill2D(color.clone(), true));
        }

        public static getSolidColorBorder(color: Color4): IBorder2D {
            return Canvas2D._solidColorBorders.getOrAddWithFactory(color.toHexString(), () => new SolidColorBorder2D(color.clone(), true));
        }

        public static getSolidColorFillFromHex(hexValue: string): IFill2D {
            return Canvas2D._solidColorFills.getOrAddWithFactory(hexValue, () => new SolidColorFill2D(Color4.FromHexString(hexValue), true));
        }

        public static getSolidColorBorderFromHex(hexValue: string): IBorder2D {
            return Canvas2D._solidColorBorders.getOrAddWithFactory(hexValue, () => new SolidColorBorder2D(Color4.FromHexString(hexValue), true));
        }

        private static _solidColorFills: StringDictionary<IFill2D> = new StringDictionary<IFill2D>();
        private static _solidColorBorders: StringDictionary<IBorder2D> = new StringDictionary<IBorder2D>();
    }


}