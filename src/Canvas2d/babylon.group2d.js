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
    var Group2D = (function (_super) {
        __extends(Group2D, _super);
        /**
         * Don't invoke directly, rely on Group2D.CreateXXX methods
         */
        function Group2D() {
            _super.call(this);
            this._primDirtyList = new Array();
            this._childrenRenderableGroups = new Array();
            this._renderGroupInstancesInfo = new BABYLON.StringDictionary();
        }
        /**
         * Create an Logical or Renderable Group.
         * @param parent the parent primitive, must be a valid primitive (or the Canvas)
         * options:
         *  - id a text identifier, for information purpose
         *  - position: the X & Y positions relative to its parent, default is [0;0]
         *  - origin: define the normalized origin point location, default [0.5;0.5]
         *  - size: the size of the group, if null the size will be computed from its content, default is null.
         *  - cacheBehavior: Define how the group should behave regarding the Canvas's cache strategy, default is Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY
         */
        Group2D.CreateGroup2D = function (parent, options) {
            BABYLON.Prim2DBase.CheckParent(parent);
            var g = new Group2D();
            g.setupGroup2D(parent.owner, parent, options && options.id || null, options && options.position || BABYLON.Vector2.Zero(), options && options.origin || null, options && options.size || null, options && options.cacheBehavior || Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY);
            return g;
        };
        Group2D._createCachedCanvasGroup = function (owner) {
            var g = new Group2D();
            g.setupGroup2D(owner, null, "__cachedCanvasGroup__", BABYLON.Vector2.Zero(), null);
            g.origin = BABYLON.Vector2.Zero();
            return g;
        };
        Group2D.prototype.applyCachedTexture = function (vertexData, material) {
            this._bindCacheTarget();
            var uv = vertexData.uvs;
            var nodeuv = this._cacheNode.UVs;
            for (var i = 0; i < 4; i++) {
                uv[i * 2 + 0] = nodeuv[i].x;
                uv[i * 2 + 1] = nodeuv[i].y;
            }
            material.diffuseTexture = this._cacheTexture;
            material.emissiveColor = new BABYLON.Color3(1, 1, 1);
            this._cacheTexture.hasAlpha = true;
            this._unbindCacheTarget();
        };
        /**
         * Call this method to remove this Group and its children from the Canvas
         */
        Group2D.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
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
            if (this._primDirtyList) {
                this._primDirtyList.splice(0);
                this._primDirtyList = null;
            }
            if (this._renderGroupInstancesInfo) {
                this._renderGroupInstancesInfo.forEach(function (k, v) {
                    v.dispose();
                });
                this._renderGroupInstancesInfo = null;
            }
            return true;
        };
        Group2D.prototype.setupGroup2D = function (owner, parent, id, position, origin, size, cacheBehavior) {
            if (cacheBehavior === void 0) { cacheBehavior = Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY; }
            this._cacheBehavior = cacheBehavior;
            this.setupPrim2DBase(owner, parent, id, position, origin);
            this.size = size;
            this._viewportPosition = BABYLON.Vector2.Zero();
        };
        Object.defineProperty(Group2D.prototype, "isRenderableGroup", {
            /**
             * @returns Returns true if the Group render content, false if it's a logical group only
             */
            get: function () {
                return this._isRenderableGroup;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "isCachedGroup", {
            /**
             * @returns only meaningful for isRenderableGroup, will be true if the content of the Group is cached into a texture, false if it's rendered every time
             */
            get: function () {
                return this._isCachedGroup;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "size", {
            get: function () {
                return this._size;
            },
            /**
             * Get/Set the size of the group. If null the size of the group will be determine from its content.
             * BEWARE: if the Group is a RenderableGroup and its content is cache the texture will be resized each time the group is getting bigger. For performance reason the opposite won't be true: the texture won't shrink if the group does.
             */
            set: function (val) {
                this._size = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "viewportSize", {
            get: function () {
                return this._viewportSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "actualSize", {
            get: function () {
                // The computed size will be floor on both width and height
                var actualSize;
                // Return the size if set by the user
                if (this._size) {
                    actualSize = new BABYLON.Size(Math.ceil(this._size.width), Math.ceil(this._size.height));
                }
                else {
                    var m = this.boundingInfo.max();
                    actualSize = new BABYLON.Size(Math.ceil(m.x), Math.ceil(m.y));
                }
                // Compare the size with the one we previously had, if it differ we set the property dirty and trigger a GroupChanged to synchronize a displaySprite (if any)
                if (!actualSize.equals(this._actualSize)) {
                    this._instanceDirtyFlags |= Group2D.actualSizeProperty.flagId;
                    this._actualSize = actualSize;
                    this.handleGroupChanged(Group2D.actualSizeProperty);
                }
                return actualSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "cacheBehavior", {
            /**
             * Get/set the Cache Behavior, used in case the Canvas Cache Strategy is set to CACHESTRATEGY_ALLGROUPS. Can be either GROUPCACHEBEHAVIOR_CACHEINPARENTGROUP, GROUPCACHEBEHAVIOR_DONTCACHEOVERRIDE or GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY. See their documentation for more information.
             * It is critical to understand than you HAVE TO play with this behavior in order to achieve a good performance/memory ratio. Caching all groups would certainly be the worst strategy of all.
             */
            get: function () {
                return this._cacheBehavior;
            },
            enumerable: true,
            configurable: true
        });
        Group2D.prototype._addPrimToDirtyList = function (prim) {
            this._primDirtyList.push(prim);
        };
        Group2D.prototype._renderCachedCanvas = function (context) {
            this.updateGlobalTransVis(true);
            this._prepareGroupRender(context);
            this._groupRender(context);
        };
        Group2D.prototype.levelIntersect = function (intersectInfo) {
            // If we've made it so far it means the boundingInfo intersection test succeed, the Group2D is shaped the same, so we always return true
            return true;
        };
        Group2D.prototype.updateLevelBoundingInfo = function () {
            var size;
            // If the size is set by the user, the boundingInfo is computed from this value
            if (this.size) {
                size = this.size;
            }
            else {
                size = new BABYLON.Size(0, 0);
            }
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(size, this._levelBoundingInfo);
        };
        // Method called only on renderable groups to prepare the rendering
        Group2D.prototype._prepareGroupRender = function (context) {
            var sortedDirtyList = null;
            // Update the Global Transformation and visibility status of the changed primitives
            if ((this._primDirtyList.length > 0) || context.forceRefreshPrimitive) {
                sortedDirtyList = this._primDirtyList.sort(function (a, b) { return a.hierarchyDepth - b.hierarchyDepth; });
                this.updateGlobalTransVisOf(sortedDirtyList, true);
            }
            // Setup the size of the rendering viewport
            // In non cache mode, we're rendering directly to the rendering canvas, in this case we have to detect if the canvas size changed since the previous iteration, if it's the case all primitives must be prepared again because their transformation must be recompute
            if (!this._isCachedGroup) {
                // Compute the WebGL viewport's location/size
                var t = this._globalTransform.getTranslation();
                var s = this.actualSize.clone();
                var rs = this.owner._renderingSize;
                s.height = Math.min(s.height, rs.height - t.y);
                s.width = Math.min(s.width, rs.width - t.x);
                var x = t.x;
                var y = t.y;
                // The viewport where we're rendering must be the size of the canvas if this one fit in the rendering screen or clipped to the screen dimensions if needed
                this._viewportPosition.x = x;
                this._viewportPosition.y = y;
                var vw = s.width;
                var vh = s.height;
                if (!this._viewportSize) {
                    this._viewportSize = new BABYLON.Size(vw, vh);
                }
                else {
                    if (this._viewportSize.width !== vw || this._viewportSize.height !== vh) {
                        context.forceRefreshPrimitive = true;
                    }
                    this._viewportSize.width = vw;
                    this._viewportSize.height = vh;
                }
            }
            else {
                var newSize = this.actualSize.clone();
                if (!newSize.equals(this._viewportSize)) {
                    context.forceRefreshPrimitive = true;
                }
                this._viewportSize = newSize;
            }
            if ((this._primDirtyList.length > 0) || context.forceRefreshPrimitive) {
                // If the group is cached, set the dirty flag to true because of the incoming changes
                this._cacheGroupDirty = this._isCachedGroup;
                // If it's a force refresh, prepare all the children
                if (context.forceRefreshPrimitive) {
                    for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                        var p = _a[_i];
                        p._prepareRender(context);
                    }
                }
                else {
                    // Each primitive that changed at least once was added into the primDirtyList, we have to sort this level using
                    //  the hierarchyDepth in order to prepare primitives from top to bottom
                    if (!sortedDirtyList) {
                        sortedDirtyList = this._primDirtyList.sort(function (a, b) { return a.hierarchyDepth - b.hierarchyDepth; });
                    }
                    sortedDirtyList.forEach(function (p) {
                        // We need to check if prepare is needed because even if the primitive is in the dirtyList, its parent primitive may also have been modified, then prepared, then recurse on its children primitives (this one for instance) if the changes where impacting them.
                        // For instance: a Rect's position change, the position of its children primitives will also change so a prepare will be call on them. If a child was in the dirtyList we will avoid a second prepare by making this check.
                        if (!p.isDisposed && p._needPrepare()) {
                            p._prepareRender(context);
                        }
                    });
                    // Everything is updated, clear the dirty list
                    this._primDirtyList.forEach(function (p) { return p._resetPropertiesDirty(); });
                    this._primDirtyList.splice(0);
                }
            }
            // A renderable group has a list of direct children that are also renderable groups, we recurse on them to also prepare them
            this._childrenRenderableGroups.forEach(function (g) {
                g._prepareGroupRender(context);
            });
        };
        Group2D.prototype._groupRender = function (context) {
            var _this = this;
            var engine = this.owner.engine;
            var failedCount = 0;
            // First recurse to children render group to render them (in their cache or on screen)
            for (var _i = 0, _a = this._childrenRenderableGroups; _i < _a.length; _i++) {
                var childGroup = _a[_i];
                childGroup._groupRender(context);
            }
            // Render the primitives if needed: either if we don't cache the content or if the content is cached but has changed
            if (!this.isCachedGroup || this._cacheGroupDirty) {
                if (this.isCachedGroup) {
                    this._bindCacheTarget();
                }
                else {
                    var curVP = engine.setDirectViewport(this._viewportPosition.x, this._viewportPosition.y, this._viewportSize.width, this._viewportSize.height);
                }
                // For each different model of primitive to render
                var totalRenderCount_1 = 0;
                this._renderGroupInstancesInfo.forEach(function (k, v) {
                    // This part will pack the dynamicfloatarray and update the instanced array WebGLBufffer
                    // Skip it if instanced arrays are not supported
                    if (_this.owner.supportInstancedArray) {
                        for (var i = 0; i < v._instancesPartsData.length; i++) {
                            // If the instances of the model was changed, pack the data
                            var array = v._instancesPartsData[i];
                            var instanceData_1 = array.pack();
                            totalRenderCount_1 += array.usedElementCount;
                            // Compute the size the instance buffer should have
                            var neededSize = array.usedElementCount * array.stride * 4;
                            // Check if we have to (re)create the instancesBuffer because there's none or the size is too small
                            if (!v._instancesPartsBuffer[i] || (v._instancesPartsBufferSize[i] < neededSize)) {
                                if (v._instancesPartsBuffer[i]) {
                                    engine.deleteInstancesBuffer(v._instancesPartsBuffer[i]);
                                }
                                v._instancesPartsBuffer[i] = engine.createInstancesBuffer(neededSize);
                                v._instancesPartsBufferSize[i] = neededSize;
                                v._dirtyInstancesData = false;
                                // Update the WebGL buffer to match the new content of the instances data
                                engine._gl.bufferSubData(engine._gl.ARRAY_BUFFER, 0, instanceData_1);
                            }
                            else if (v._dirtyInstancesData) {
                                // Update the WebGL buffer to match the new content of the instances data
                                engine._gl.bindBuffer(engine._gl.ARRAY_BUFFER, v._instancesPartsBuffer[i]);
                                engine._gl.bufferSubData(engine._gl.ARRAY_BUFFER, 0, instanceData_1);
                            }
                        }
                        v._dirtyInstancesData = false;
                    }
                    // Submit render only if we have something to render (everything may be hidden and the floatarray empty)
                    if (!_this.owner.supportInstancedArray || totalRenderCount_1 > 0) {
                        // render all the instances of this model, if the render method returns true then our instances are no longer dirty
                        var renderFailed = !v._modelCache.render(v, context);
                        // Update dirty flag/related
                        v._dirtyInstancesData = renderFailed;
                        failedCount += renderFailed ? 1 : 0;
                    }
                });
                // The group's content is no longer dirty
                this._cacheGroupDirty = failedCount !== 0;
                if (this.isCachedGroup) {
                    this._unbindCacheTarget();
                }
                else {
                    if (curVP) {
                        engine.setViewport(curVP);
                    }
                }
            }
        };
        Group2D.prototype._bindCacheTarget = function () {
            var curWidth;
            var curHeight;
            if (this._cacheNode) {
                var size = this._cacheNode.contentSize;
                var groupWidth = Math.ceil(this.actualSize.width);
                var groupHeight = Math.ceil(this.actualSize.height);
                if ((size.width < groupWidth) || (size.height < groupHeight)) {
                    curWidth = Math.floor(size.width * 1.07); // Grow 5% more to avoid frequent resizing for few pixels...
                    curHeight = Math.floor(size.height * 1.07);
                    //console.log(`[${this._globalTransformProcessStep}] Resize group ${this.id}, width: ${curWidth}, height: ${curHeight}`);
                    this._cacheTexture.freeRect(this._cacheNode);
                    this._cacheNode = null;
                }
            }
            if (!this._cacheNode) {
                // Check if we have to allocate a rendering zone in the global cache texture
                var res = this.owner._allocateGroupCache(this, this.renderGroup, curWidth ? new BABYLON.Size(curWidth, curHeight) : null);
                this._cacheNode = res.node;
                this._cacheTexture = res.texture;
                this._cacheRenderSprite = res.sprite;
                var size = this._cacheNode.contentSize;
            }
            var n = this._cacheNode;
            this._cacheTexture.bindTextureForPosSize(n.pos, this.actualSize, true);
        };
        Group2D.prototype._unbindCacheTarget = function () {
            if (this._cacheTexture) {
                this._cacheTexture.unbindTexture();
            }
        };
        Group2D.prototype.handleGroupChanged = function (prop) {
            // This method is only for cachedGroup
            if (!this.isCachedGroup || !this._cacheRenderSprite) {
                return;
            }
            // For now we only support these property changes
            // TODO: add more! :)
            if (prop.id === BABYLON.Prim2DBase.positionProperty.id) {
                this._cacheRenderSprite.position = this.position.clone();
            }
            else if (prop.id === BABYLON.Prim2DBase.rotationProperty.id) {
                this._cacheRenderSprite.rotation = this.rotation;
            }
            else if (prop.id === BABYLON.Prim2DBase.scaleProperty.id) {
                this._cacheRenderSprite.scale = this.scale;
            }
            else if (prop.id === BABYLON.Prim2DBase.originProperty.id) {
                this._cacheRenderSprite.origin = this.origin.clone();
            }
            else if (prop.id === Group2D.actualSizeProperty.id) {
                this._cacheRenderSprite.spriteSize = this.actualSize.clone();
            }
        };
        Group2D.prototype.detectGroupStates = function () {
            var isCanvas = this instanceof BABYLON.Canvas2D;
            var canvasStrat = this.owner.cachingStrategy;
            // In Don't Cache mode, only the canvas is renderable, all the other groups are logical. There are not a single cached group.
            if (canvasStrat === BABYLON.Canvas2D.CACHESTRATEGY_DONTCACHE) {
                this._isRenderableGroup = isCanvas;
                this._isCachedGroup = false;
            }
            else if (canvasStrat === BABYLON.Canvas2D.CACHESTRATEGY_CANVAS) {
                if (isCanvas) {
                    this._isRenderableGroup = true;
                    this._isCachedGroup = true;
                }
                else {
                    this._isRenderableGroup = this.id === "__cachedCanvasGroup__";
                    this._isCachedGroup = false;
                }
            }
            else if (canvasStrat === BABYLON.Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                if (isCanvas) {
                    this._isRenderableGroup = true;
                    this._isCachedGroup = false;
                }
                else {
                    if (this.hierarchyDepth === 1) {
                        this._isRenderableGroup = true;
                        this._isCachedGroup = true;
                    }
                    else {
                        this._isRenderableGroup = false;
                        this._isCachedGroup = false;
                    }
                }
            }
            else if (canvasStrat === BABYLON.Canvas2D.CACHESTRATEGY_ALLGROUPS) {
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
                var cur = this.parent;
                while (cur) {
                    if (cur instanceof Group2D && cur._isRenderableGroup) {
                        cur._childrenRenderableGroups.push(this);
                        break;
                    }
                    cur = cur.parent;
                }
            }
        };
        Group2D.GROUP2D_PROPCOUNT = BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 5;
        /**
         * Default behavior, the group will use the caching strategy defined at the Canvas Level
         */
        Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY = 0;
        /**
         * When used, this group's content won't be cached, no matter which strategy used.
         * If the group is part of a WorldSpace Canvas, its content will be drawn in the Canvas cache bitmap.
         */
        Group2D.GROUPCACHEBEHAVIOR_DONTCACHEOVERRIDE = 1;
        /**
         * When used, the group's content will be cached in the nearest cached parent group/canvas
         */
        Group2D.GROUPCACHEBEHAVIOR_CACHEINPARENTGROUP = 2;
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 1, function (pi) { return Group2D.sizeProperty = pi; }, false, true)
        ], Group2D.prototype, "size", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 2, function (pi) { return Group2D.actualSizeProperty = pi; })
        ], Group2D.prototype, "actualSize", null);
        Group2D = __decorate([
            BABYLON.className("Group2D")
        ], Group2D);
        return Group2D;
    }(BABYLON.Prim2DBase));
    BABYLON.Group2D = Group2D;
})(BABYLON || (BABYLON = {}));
