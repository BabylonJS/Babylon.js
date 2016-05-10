module BABYLON {
    @className("Group2D")
    export class Group2D extends Prim2DBase {
        static GROUP2D_PROPCOUNT: number = Prim2DBase.PRIM2DBASE_PROPCOUNT + 5;

        public static sizeProperty: Prim2DPropInfo;
        public static actualSizeProperty: Prim2DPropInfo;

      /**
         * Default behavior, the group will use the caching strategy defined at the Canvas Level
         */
        public static GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY = 0;

        /**
         * When used, this group's content won't be cached, no matter which strategy used.
         * If the group is part of a WorldSpace Canvas, its content will be drawn in the Canvas cache bitmap.
         */
        public static GROUPCACHEBEHAVIOR_DONTCACHEOVERRIDE = 1;

        /**
         * When used, the group's content will be cached in the nearest cached parent group/canvas
         */
        public static GROUPCACHEBEHAVIOR_CACHEINPARENTGROUP = 2;

        constructor() {
            super();
            this._primDirtyList = new Array<Prim2DBase>();
            this._childrenRenderableGroups = new Array<Group2D>();
            this.groupRenderInfo = new StringDictionary<GroupInstanceInfo>();
        }

        static CreateGroup2D(parent: Prim2DBase, id: string, position: Vector2, size?: Size, cacheBehabior: number = Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY): Group2D {
            Prim2DBase.CheckParent(parent);
            var g = new Group2D();
            g.setupGroup2D(parent.owner, parent, id, position, size, cacheBehabior);

            return g;
        }

        applyCachedTexture(vertexData: VertexData, material: StandardMaterial) {
            this._bindCacheTarget();

            var uv = vertexData.uvs;
            let nodeuv = this._cacheNode.UVs;
            for (let i = 0; i < 4; i++) {
                uv[i * 2 + 0] = nodeuv[i].x;
                uv[i * 2 + 1] = nodeuv[i].y;
            }

            material.diffuseTexture = this._cacheTexture;
            material.emissiveColor = new Color3(1, 1, 1);
            this._cacheTexture.hasAlpha = true;
            this._unbindCacheTarget();
        }

        public dispose(): boolean {
            if (!super.dispose()) {
                return false;
            }

            if (this._cacheRenderSprite) {
                this._cacheRenderSprite.dispose();
                this._cacheRenderSprite = null;
            }

            if (this._cacheTexture && this._cacheNode) {
                this._cacheTexture.freeRect(this._cacheNode);
                this._cacheTexture = null;
                this._cacheNode = null;
            }

            if(this._primDirtyList) {
                this._primDirtyList.splice(0);
                this._primDirtyList = null;
            }

            if (this.groupRenderInfo) {
                this.groupRenderInfo.forEach((k, v) => {
                    v.dispose();
                });
                this.groupRenderInfo = null;
            }

            return true;
        }

        /**
         * Create an instance of the Group Primitive.
         * A group act as a container for many sub primitives, if features:
         * - Maintain a size, not setting one will determine it based on its content.
         * - Play an essential role in the rendering pipeline. A group and its content can be cached into a bitmap to enhance rendering performance (at the cost of memory storage in GPU)
         * @param owner
         * @param id
         * @param position
         * @param size
         * @param dontcache
         */
        protected setupGroup2D(owner: Canvas2D,
            parent: Prim2DBase,
            id: string,
            position: Vector2,
            size?: Size,
            cacheBehavior: number = Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY) {
            this._cacheBehavior = cacheBehavior;
            this.setupPrim2DBase(owner, parent, id, position);
            this.size = size;
            this._viewportPosition = Vector2.Zero();
        }

        public get isRenderableGroup(): boolean {
            return this._isRenderableGroup;
        }

        public get isCachedGroup(): boolean {
            return this._isCachedGroup;
        }

        @instanceLevelProperty(Prim2DBase.PRIM2DBASE_PROPCOUNT + 1, pi => Group2D.sizeProperty = pi, false, true)
        public get size(): Size {
            return this._size;
        }

        public set size(val: Size) {
            this._size = val;
        }

        public get viewportSize(): ISize {
            return this._viewportSize;
        }

        @instanceLevelProperty(Prim2DBase.PRIM2DBASE_PROPCOUNT + 2, pi => Group2D.actualSizeProperty = pi)
        public get actualSize(): Size {
            // Return the size if set by the user
            if (this._size) {
                return this._size;
            }

            // Otherwise the size is computed based on the boundingInfo
            let m = this.boundingInfo.max();
            return new Size(m.x, m.y);
        }

        public get cacheBehavior(): number {
            return this._cacheBehavior;
        }

        public _addPrimToDirtyList(prim: Prim2DBase) {
            this._primDirtyList.push(prim);
        }

        protected updateLevelBoundingInfo() {
            let size: Size;

            // If the size is set by the user, the boundingInfo is computed from this value
            if (this.size) {
                size = this.size;
            }
            // Otherwise the group's level bouding info is "collapsed"
            else {
                size = new Size(0, 0);
            }

            BoundingInfo2D.CreateFromSizeToRef(size, this._levelBoundingInfo);
        }

        // Method called only on renderable groups to prepare the rendering
        protected _prepareGroupRender(context: Render2DContext) {
            let sortedDirtyList: Prim2DBase[] = null;

            // Update the Global Transformation and visibility status of the changed primitives
            if ((this._primDirtyList.length > 0) || context.forceRefreshPrimitive) {
                sortedDirtyList = this._primDirtyList.sort((a, b) => a.hierarchyDepth - b.hierarchyDepth);
                this.updateGlobalTransVisOf(sortedDirtyList, true);
            }

            // Setup the size of the rendering viewport
            // In non cache mode, we're rendering directly to the rendering canvas, in this case we have to detect if the canvas size changed since the previous iteration, if it's the case all primitives must be preprared again because their transformation must be recompute
            if (!this._isCachedGroup) {
                // Compute the WebGL viewport's location/size
                let t = this._globalTransform.getTranslation();
                let s = this.actualSize.clone();
                let rs = this.owner._renderingSize;
                s.height = Math.min(s.height, rs.height - t.y);
                s.width = Math.min(s.width, rs.width - t.x);
                let x = t.x;
                let y = (rs.height - s.height) - t.y;

                // The viewport where we're rendering must be the size of the canvas if this one fit in the rendering screen or clipped to the screen dimensions if needed
                this._viewportPosition.x = x;
                this._viewportPosition.y = y;
                let vw = s.width;
                let vh = s.height;

                if (!this._viewportSize) {
                    this._viewportSize = new Size(vw, vh);
                } else {
                    if (this._viewportSize.width !== vw || this._viewportSize.height !== vh) {
                        context.forceRefreshPrimitive = true;
                    }
                    this._viewportSize.width = vw;
                    this._viewportSize.height = vh;
                }
            } else {
                this._viewportSize = this.actualSize;
            }

            if ((this._primDirtyList.length > 0) || context.forceRefreshPrimitive) {
                // If the group is cached, set the dirty flag to true because of the incoming changes
                this._cacheGroupDirty = this._isCachedGroup;

                // If it's a force refresh, prepare all the children
                if (context.forceRefreshPrimitive) {
                    for (let p of this._children) {
                        p._prepareRender(context);
                    }
                } else {
                    // Each primitive that changed at least once was added into the primDirtyList, we have to sort this level using
                    //  the hierarchyDepth in order to prepare primitives from top to bottom
                    if (!sortedDirtyList) {
                        sortedDirtyList = this._primDirtyList.sort((a, b) => a.hierarchyDepth - b.hierarchyDepth);
                    }

                    sortedDirtyList.forEach(p => {

                        // We need to check if prepare is needed because even if the primitive is in the dirtyList, its parent primitive may also have been modified, then prepared, then recurse on its children primitives (this one for instance) if the changes where impacting them.
                        // For instance: a Rect's position change, the position of its children primitives will also change so a prepare will be call on them. If a child was in the dirtyList we will avoid a second prepare by making this check.
                        if (p.needPrepare()) {
                            p._prepareRender(context);
                        }
                    });

                    // Everything is updated, clear the dirty list
                    this._primDirtyList.splice(0);
                }
            }

            // A renderable group has a list of direct children that are also renderable groups, we recurse on them to also prepare them
            this._childrenRenderableGroups.forEach(g => {
                g._prepareGroupRender(context);
            });
        }

        protected _groupRender(context: Render2DContext) {
            let engine = this.owner.engine;
            let failedCount = 0;

            // First recurse to children render group to render them (in their cache or on screen)
            for (let childGroup of this._childrenRenderableGroups) {
                childGroup._groupRender(context);
            }

            // Render the primitives if needed: either if we don't cache the content or if the content is cached but has changed
            if (!this.isCachedGroup || this._cacheGroupDirty) {
                if (this.isCachedGroup) {
                    this._bindCacheTarget();
                } else {
                    var curVP = engine.setDirectViewport(this._viewportPosition.x, this._viewportPosition.y, this._viewportSize.width, this._viewportSize.height);
                }

                // For each different model of primitive to render
                this.groupRenderInfo.forEach((k, v) => {
                    for (let i = 0; i < v._instancesPartsData.length; i++) {
                        // If the instances of the model was changed, pack the data
                        let instanceData = v._instancesPartsData[i].pack();

                        // Compute the size the instance buffer should have
                        let neededSize = v._instancesPartsData[i].usedElementCount * v._instancesPartsData[i].stride * 4;

                        // Check if we have to (re)create the instancesBuffer because there's none or the size doesn't match
                        if (!v._instancesPartsBuffer[i] || (v._instancesPartsBufferSize[i] !== neededSize)) {
                            if (v._instancesPartsBuffer[i]) {
                                engine.deleteInstancesBuffer(v._instancesPartsBuffer[i]);
                            }
                            v._instancesPartsBuffer[i] = engine.createInstancesBuffer(neededSize);
                            v._instancesPartsBufferSize[i] = neededSize;
                            v._dirtyInstancesData = true;

                            // Update the WebGL buffer to match the new content of the instances data
                            engine._gl.bufferSubData(engine._gl.ARRAY_BUFFER, 0, instanceData);
                        } else if (v._dirtyInstancesData) {
                            // Update the WebGL buffer to match the new content of the instances data
                            engine._gl.bindBuffer(engine._gl.ARRAY_BUFFER, v._instancesPartsBuffer[i]);
                            engine._gl.bufferSubData(engine._gl.ARRAY_BUFFER, 0, instanceData);

                            v._dirtyInstancesData = false;
                        }
                    }
                    // render all the instances of this model, if the render method returns true then our instances are no longer dirty
                    let renderFailed = !v._modelCache.render(v, context);

                    // Update dirty flag/related
                    v._dirtyInstancesData = renderFailed;
                    failedCount += renderFailed ? 1 : 0;
                });

                // The group's content is no longer dirty
                this._cacheGroupDirty = failedCount !== 0;

                if (this.isCachedGroup) {
                    this._unbindCacheTarget();
                } else {
                    if (curVP) {
                        engine.setViewport(curVP);
                    }
                }
            }
        }

        private _bindCacheTarget() {
            // Check if we have to allocate a rendering zone in the global cache texture
            if (!this._cacheNode) {
                var res = this.owner._allocateGroupCache(this);
                this._cacheNode = res.node;
                this._cacheTexture = res.texture;
                this._cacheRenderSprite = res.sprite;
            }

            let n = this._cacheNode;
            this._cacheTexture.bindTextureForRect(n, true);
        }

        private _unbindCacheTarget() {
            if (this._cacheTexture) {
                this._cacheTexture.unbindTexture();
            }
        }

        protected handleGroupChanged(prop: Prim2DPropInfo) {
            // This method is only for cachedGroup
            if (!this.isCachedGroup || !this._cacheRenderSprite) {
                return;
            }

            // For now we only support these property changes
            // TODO: add more! :)
            if (prop.id === Prim2DBase.positionProperty.id) {
                this._cacheRenderSprite.position = this.position.clone();
            } else if (prop.id === Prim2DBase.rotationProperty.id) {
                this._cacheRenderSprite.rotation = this.rotation;
            } else if (prop.id === Prim2DBase.scaleProperty.id) {
                this._cacheRenderSprite.scale = this.scale;
            }
        }

        private detectGroupStates() {
            var isCanvas = this instanceof Canvas2D;
            var canvasStrat = this.owner.cachingStrategy;

            // In Don't Cache mode, only the canvas is renderable, all the other groups are logical. There are not a single cached group.
            if (canvasStrat === Canvas2D.CACHESTRATEGY_DONTCACHE) {
                this._isRenderableGroup = isCanvas;
                this._isCachedGroup = false;
            }

            // In Canvas cached only mode, only the Canvas is cached and renderable, all other groups are logicals
            else if (canvasStrat === Canvas2D.CACHESTRATEGY_CANVAS) {
                if (isCanvas) {
                    this._isRenderableGroup = true;
                    this._isCachedGroup = true;
                } else {
                    this._isRenderableGroup = false;
                    this._isCachedGroup = false;
                }
            }

            // Top Level Groups cached only mode, the canvas is a renderable/not cached, its direct Groups are cached/renderable, all other group are logicals
            else if (canvasStrat === Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                if (isCanvas) {
                    this._isRenderableGroup = true;
                    this._isCachedGroup = false;
                } else {
                    if (this.hierarchyDepth === 1) {
                        this._isRenderableGroup = true;
                        this._isCachedGroup = true;
                    } else {
                        this._isRenderableGroup = false;
                        this._isCachedGroup = false;
                    }
                }
            }

            // All Group cached mode, all groups are renderable/cached, including the Canvas, groups with the behavior DONTCACHE are renderable/not cached, groups with CACHEINPARENT are logical ones
            else if (canvasStrat === Canvas2D.CACHESTRATEGY_ALLGROUPS) {
                var gcb = this.cacheBehavior;
                if ((gcb === Group2D.GROUPCACHEBEHAVIOR_DONTCACHEOVERRIDE) || (gcb === Group2D.GROUPCACHEBEHAVIOR_CACHEINPARENTGROUP)) {
                    this._isRenderableGroup = gcb === Group2D.GROUPCACHEBEHAVIOR_DONTCACHEOVERRIDE;
                    this._isCachedGroup = false;
                }

                if (gcb === Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY) {
                    this._isRenderableGroup = true;
                    this._isCachedGroup = true;
                }
            }

            // If the group is tagged as renderable we add it to the renderable tree
            if (this._isCachedGroup) {
                let cur = this.parent;
                while (cur) {
                    if (cur instanceof Group2D && cur._isRenderableGroup) {
                        cur._childrenRenderableGroups.push(this);
                        break;
                    }
                    cur = cur.parent;
                }
            }
        }

        protected _isRenderableGroup: boolean;
        protected _isCachedGroup: boolean;
        private _cacheGroupDirty: boolean;
        protected _childrenRenderableGroups: Array<Group2D>;
        private _size: Size;
        private _cacheBehavior: number;
        private _primDirtyList: Array<Prim2DBase>;
        private _cacheNode: PackedRect;
        private _cacheTexture: MapTexture;
        private _cacheRenderSprite: Sprite2D;
        private _viewportPosition: Vector2;
        private _viewportSize: Size;

        groupRenderInfo: StringDictionary<GroupInstanceInfo>;
    }

}