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
        function Group2D() {
            _super.call(this);
            this._primDirtyList = new Array();
            this._childrenRenderableGroups = new Array();
            this.groupRenderInfo = new BABYLON.StringDictionary();
        }
        Group2D.CreateGroup2D = function (parent, id, position, size, cacheBehabior) {
            if (cacheBehabior === void 0) { cacheBehabior = Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY; }
            BABYLON.Prim2DBase.CheckParent(parent);
            var g = new Group2D();
            g.setupGroup2D(parent.owner, parent, id, position, size, cacheBehabior);
            return g;
        };
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
        Group2D.prototype.setupGroup2D = function (owner, parent, id, position, size, cacheBehavior) {
            if (cacheBehavior === void 0) { cacheBehavior = Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY; }
            this._cacheBehavior = cacheBehavior;
            this.setupPrim2DBase(owner, parent, id, position);
            this.size = size;
            this._viewportPosition = BABYLON.Vector2.Zero();
        };
        Object.defineProperty(Group2D.prototype, "isRenderableGroup", {
            get: function () {
                return this._isRenderableGroup;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "isCachedGroup", {
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
                // Return the size if set by the user
                if (this._size) {
                    return this._size;
                }
                // Otherwise the size is computed based on the boundingInfo
                var size = this.boundingInfo.extent.clone();
                return size;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "cacheBehavior", {
            get: function () {
                return this._cacheBehavior;
            },
            enumerable: true,
            configurable: true
        });
        Group2D.prototype._addPrimToDirtyList = function (prim) {
            this._primDirtyList.push(prim);
        };
        Group2D.prototype.updateLevelBoundingInfo = function () {
            var size;
            // If the size is set by the user, the boundingInfo is compute from this value
            if (this.size) {
                size = this.size;
            }
            else {
                size = new BABYLON.Size(0, 0);
            }
            this._levelBoundingInfo.radius = Math.sqrt(size.width * size.width + size.height * size.height);
            this._levelBoundingInfo.extent = size.clone();
        };
        // Method called only on renderable groups to prepare the rendering
        Group2D.prototype._prepareGroupRender = function (context) {
            var childrenContext = this._buildChildContext(context);
            var sortedDirtyList = null;
            // Update the Global Transformation and visibility status of the changed primitives
            if ((this._primDirtyList.length > 0) || context.forceRefreshPrimitive) {
                sortedDirtyList = this._primDirtyList.sort(function (a, b) { return a.hierarchyDepth - b.hierarchyDepth; });
                this.updateGlobalTransVisOf(sortedDirtyList, childrenContext, true);
            }
            // Setup the size of the rendering viewport
            // In non cache mode, we're rendering directly to the rendering canvas, in this case we have to detect if the canvas size changed since the previous iteration, if it's the case all primitives must be preprared again because their transformation must be recompute
            if (!this._isCachedGroup) {
                // Compute the WebGL viewport's location/size
                var t = this._globalTransform.getTranslation();
                var s = this.actualSize.clone();
                var rs = this.owner._renderingSize;
                s.height = Math.min(s.height, rs.height - t.y);
                s.width = Math.min(s.width, rs.width - t.x);
                var x = t.x;
                var y = (rs.height - s.height) - t.y;
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
                this._viewportSize = this.actualSize;
            }
            if ((this._primDirtyList.length > 0) || context.forceRefreshPrimitive) {
                // If the group is cached, set the dirty flag to true because of the incoming changes
                this._cacheGroupDirty = this._isCachedGroup;
                // If it's a force refresh, prepare all the children
                if (context.forceRefreshPrimitive) {
                    for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                        var p = _a[_i];
                        p._prepareRender(childrenContext);
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
                        if (p.needPrepare()) {
                            p._prepareRender(childrenContext);
                        }
                    });
                    // Everything is updated, clear the dirty list
                    this._primDirtyList.splice(0);
                }
            }
            // A renderable group has a list of direct children that are also renderable groups, we recurse on them to also prepare them
            this._childrenRenderableGroups.forEach(function (g) {
                g._prepareGroupRender(childrenContext);
            });
        };
        Group2D.prototype._groupRender = function (context) {
            var engine = this.owner.engine;
            var failedCount = 0;
            // First recurse to children render group to render them (in their cache or on screen)
            var childrenContext = this._buildChildContext(context);
            for (var _i = 0, _a = this._childrenRenderableGroups; _i < _a.length; _i++) {
                var childGroup = _a[_i];
                childGroup._groupRender(childrenContext);
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
                this.groupRenderInfo.forEach(function (k, v) {
                    // If the instances of the model was changed, pack the data
                    var instanceData = v._instancesData.pack();
                    // Compute the size the instance buffer should have
                    var neededSize = v._instancesData.usedElementCount * v._instancesData.stride * 4;
                    // Check if we have to (re)create the instancesBuffer because there's none or the size doesn't match
                    if (!v._instancesBuffer || (v._instancesBufferSize !== neededSize)) {
                        if (v._instancesBuffer) {
                            engine.deleteInstancesBuffer(v._instancesBuffer);
                        }
                        v._instancesBuffer = engine.createInstancesBuffer(neededSize);
                        v._instancesBufferSize = neededSize;
                        v._dirtyInstancesData = true;
                        // Update the WebGL buffer to match the new content of the instances data
                        engine._gl.bufferSubData(engine._gl.ARRAY_BUFFER, 0, instanceData);
                    }
                    else if (v._dirtyInstancesData) {
                        // Update the WebGL buffer to match the new content of the instances data
                        engine._gl.bindBuffer(engine._gl.ARRAY_BUFFER, v._instancesBuffer);
                        engine._gl.bufferSubData(engine._gl.ARRAY_BUFFER, 0, instanceData);
                        v._dirtyInstancesData = false;
                    }
                    // render all the instances of this model, if the render method returns true then our instances are no longer dirty
                    var renderFailed = !v._modelCache.render(v, context);
                    // Update dirty flag/related
                    v._dirtyInstancesData = renderFailed;
                    failedCount += renderFailed ? 1 : 0;
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
            // Check if we have to allocate a rendering zone in the global cache texture
            if (!this._cacheNode) {
                var res = this.owner._allocateGroupCache(this);
                this._cacheNode = res.node;
                this._cacheTexture = res.texture;
            }
            var n = this._cacheNode;
            this._cacheTexture.bindTextureForRect(n);
        };
        Group2D.prototype._unbindCacheTarget = function () {
            if (this._cacheTexture) {
                this._cacheTexture.unbindTexture();
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
                    this._isRenderableGroup = false;
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
        Group2D.GROUP2D_PROPCOUNT = BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 10;
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
//# sourceMappingURL=babylon.group2d.js.map