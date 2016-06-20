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
         * Create an Logical or Renderable Group.
         * @param settings a combination of settings, possible ones are
         *  - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         *  - children: an array of direct children
         *  - id a text identifier, for information purpose
         *  - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         *  - rotation: the initial rotation (in radian) of the primitive. default is 0
         *  - scale: the initial scale of the primitive. default is 1
         *  - origin: define the normalized origin point location, default [0.5;0.5]
         *  - size: the size of the group. Alternatively the width and height properties can be set. If null the size will be computed from its content, default is null.
         *  - cacheBehavior: Define how the group should behave regarding the Canvas's cache strategy, default is Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY
         *  - layoutEngine: either an instance of a layout engine based class (StackPanel.Vertical, StackPanel.Horizontal) or a string ('canvas' for Canvas layout, 'StackPanel' or 'HorizontalStackPanel' for horizontal Stack Panel layout, 'VerticalStackPanel' for vertical Stack Panel layout).
         *  - isVisible: true if the group must be visible, false for hidden. Default is true.
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function Group2D(settings) {
            if (settings == null) {
                settings = {};
            }
            if (settings.origin == null) {
                settings.origin = new BABYLON.Vector2(0, 0);
            }
            _super.call(this, settings);
            var size = (!settings.size && !settings.width && !settings.height) ? null : (settings.size || (new BABYLON.Size(settings.width || 0, settings.height || 0)));
            this._trackedNode = (settings.trackNode == null) ? null : settings.trackNode;
            if (this._trackedNode && this.owner) {
                this.owner._registerTrackedNode(this);
            }
            this._cacheBehavior = (settings.cacheBehavior == null) ? Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY : settings.cacheBehavior;
            this.size = size;
            this._viewportPosition = BABYLON.Vector2.Zero();
        }
        Group2D._createCachedCanvasGroup = function (owner) {
            var g = new Group2D({ parent: owner, id: "__cachedCanvasGroup__", position: BABYLON.Vector2.Zero(), origin: BABYLON.Vector2.Zero(), size: null, isVisible: true });
            return g;
        };
        Group2D.prototype.applyCachedTexture = function (vertexData, material) {
            this._bindCacheTarget();
            if (vertexData) {
                var uv = vertexData.uvs;
                var nodeuv = this._renderableData._cacheNode.UVs;
                for (var i = 0; i < 4; i++) {
                    uv[i * 2 + 0] = nodeuv[i].x;
                    uv[i * 2 + 1] = nodeuv[i].y;
                }
            }
            if (material) {
                material.diffuseTexture = this._renderableData._cacheTexture;
                material.emissiveColor = new BABYLON.Color3(1, 1, 1);
            }
            this._renderableData._cacheTexture.hasAlpha = true;
            this._unbindCacheTarget();
        };
        Object.defineProperty(Group2D.prototype, "cachedRect", {
            /**
             * Allow you to access the information regarding the cached rectangle of the Group2D into the MapTexture.
             * If the `noWorldSpaceNode` options was used at the creation of a WorldSpaceCanvas, the rendering of the canvas must be made by the caller, so typically you want to bind the cacheTexture property to some material/mesh and you must use the cachedRect.UVs property to get the UV coordinates to use for your quad that will display the Canvas.
             */
            get: function () {
                if (!this._renderableData) {
                    return null;
                }
                return this._renderableData._cacheNode;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "cacheTexture", {
            /**
             * Access the texture that maintains a cached version of the Group2D.
             * This is useful only if you're not using a WorldSpaceNode for your WorldSpace Canvas and therefore need to perform the rendering yourself.
             */
            get: function () {
                if (!this._renderableData) {
                    return null;
                }
                return this._renderableData._cacheTexture;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Call this method to remove this Group and its children from the Canvas
         */
        Group2D.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this._trackedNode != null) {
                this.owner._unregisterTrackedNode(this);
                this._trackedNode = null;
            }
            if (this._renderableData) {
                this._renderableData.dispose();
                this._renderableData = null;
            }
            return true;
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
                // Compare the size with the one we previously had, if it differs we set the property dirty and trigger a GroupChanged to synchronize a displaySprite (if any)
                if (!actualSize.equals(this._actualSize)) {
                    this.onPrimitivePropertyDirty(Group2D.actualSizeProperty.flagId);
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
            this._renderableData._primDirtyList.push(prim);
        };
        Group2D.prototype._renderCachedCanvas = function () {
            this.updateCachedStates(true);
            var context = new BABYLON.PrepareRender2DContext();
            this._prepareGroupRender(context);
            this._groupRender();
        };
        Object.defineProperty(Group2D.prototype, "trackedNode", {
            /**
             * Get/set the Scene's Node that should be tracked, the group's position will follow the projected position of the Node.
             */
            get: function () {
                return this._trackedNode;
            },
            set: function (val) {
                if (val != null) {
                    if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagTrackedGroup)) {
                        this.owner._registerTrackedNode(this);
                    }
                    this._trackedNode = val;
                }
                else {
                    if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagTrackedGroup)) {
                        this.owner._unregisterTrackedNode(this);
                    }
                    this._trackedNode = null;
                }
            },
            enumerable: true,
            configurable: true
        });
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
            if ((this._renderableData._primDirtyList.length > 0) || context.forceRefreshPrimitive) {
                sortedDirtyList = this._renderableData._primDirtyList.sort(function (a, b) { return a.hierarchyDepth - b.hierarchyDepth; });
                this.updateCachedStatesOf(sortedDirtyList, true);
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
            if ((this._renderableData._primDirtyList.length > 0) || context.forceRefreshPrimitive) {
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
                        sortedDirtyList = this._renderableData._primDirtyList.sort(function (a, b) { return a.hierarchyDepth - b.hierarchyDepth; });
                    }
                    sortedDirtyList.forEach(function (p) {
                        // We need to check if prepare is needed because even if the primitive is in the dirtyList, its parent primitive may also have been modified, then prepared, then recurse on its children primitives (this one for instance) if the changes where impacting them.
                        // For instance: a Rect's position change, the position of its children primitives will also change so a prepare will be call on them. If a child was in the dirtyList we will avoid a second prepare by making this check.
                        if (!p.isDisposed && p._needPrepare()) {
                            p._prepareRender(context);
                        }
                    });
                    // Everything is updated, clear the dirty list
                    this._renderableData._primDirtyList.forEach(function (p) { return p._resetPropertiesDirty(); });
                    this._renderableData._primDirtyList.splice(0);
                }
            }
            // A renderable group has a list of direct children that are also renderable groups, we recurse on them to also prepare them
            this._renderableData._childrenRenderableGroups.forEach(function (g) {
                g._prepareGroupRender(context);
            });
        };
        Group2D.prototype._groupRender = function () {
            var _this = this;
            var engine = this.owner.engine;
            var failedCount = 0;
            // First recurse to children render group to render them (in their cache or on screen)
            for (var _i = 0, _a = this._renderableData._childrenRenderableGroups; _i < _a.length; _i++) {
                var childGroup = _a[_i];
                childGroup._groupRender();
            }
            // Render the primitives if needed: either if we don't cache the content or if the content is cached but has changed
            if (!this.isCachedGroup || this._cacheGroupDirty) {
                if (this.isCachedGroup) {
                    this._bindCacheTarget();
                }
                else {
                    var curVP = engine.setDirectViewport(this._viewportPosition.x, this._viewportPosition.y, this._viewportSize.width, this._viewportSize.height);
                }
                var curAlphaTest = engine.getAlphaTesting() === true;
                var curDepthWrite = engine.getDepthWrite() === true;
                // ===================================================================
                // First pass, update the InstancedArray and render Opaque primitives
                // Disable Alpha Testing, Enable Depth Write
                engine.setAlphaTesting(false);
                engine.setDepthWrite(true);
                // For each different model of primitive to render
                var context = new BABYLON.Render2DContext(BABYLON.Render2DContext.RenderModeOpaque);
                this._renderableData._renderGroupInstancesInfo.forEach(function (k, v) {
                    // Prepare the context object, update the WebGL Instanced Array buffer if needed
                    var renderCount = _this._prepareContext(engine, context, v);
                    // If null is returned, there's no opaque data to render
                    if (renderCount === null) {
                        return;
                    }
                    // Submit render only if we have something to render (everything may be hidden and the floatarray empty)
                    if (!_this.owner.supportInstancedArray || renderCount > 0) {
                        // render all the instances of this model, if the render method returns true then our instances are no longer dirty
                        var renderFailed = !v.modelRenderCache.render(v, context);
                        // Update dirty flag/related
                        v.opaqueDirty = renderFailed;
                        failedCount += renderFailed ? 1 : 0;
                    }
                });
                // =======================================================================
                // Second pass, update the InstancedArray and render AlphaTest primitives
                // Enable Alpha Testing, Enable Depth Write
                engine.setAlphaTesting(true);
                engine.setDepthWrite(true);
                // For each different model of primitive to render
                context = new BABYLON.Render2DContext(BABYLON.Render2DContext.RenderModeAlphaTest);
                this._renderableData._renderGroupInstancesInfo.forEach(function (k, v) {
                    // Prepare the context object, update the WebGL Instanced Array buffer if needed
                    var renderCount = _this._prepareContext(engine, context, v);
                    // If null is returned, there's no opaque data to render
                    if (renderCount === null) {
                        return;
                    }
                    // Submit render only if we have something to render (everything may be hidden and the floatarray empty)
                    if (!_this.owner.supportInstancedArray || renderCount > 0) {
                        // render all the instances of this model, if the render method returns true then our instances are no longer dirty
                        var renderFailed = !v.modelRenderCache.render(v, context);
                        // Update dirty flag/related
                        v.opaqueDirty = renderFailed;
                        failedCount += renderFailed ? 1 : 0;
                    }
                });
                // =======================================================================
                // Third pass, transparent primitive rendering
                // Enable Alpha Testing, Disable Depth Write
                engine.setAlphaTesting(true);
                engine.setDepthWrite(false);
                // First Check if the transparent List change so we can update the TransparentSegment and PartData (sort if needed)
                if (this._renderableData._transparentListChanged) {
                    this._updateTransparentData();
                }
                // From this point on we have up to date data to render, so let's go
                failedCount += this._renderTransparentData();
                // =======================================================================
                //  Unbind target/restore viewport setting, clear dirty flag, and quit
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
                // Restore saved states
                engine.setAlphaTesting(curAlphaTest);
                engine.setDepthWrite(curDepthWrite);
            }
        };
        Group2D.prototype._updateTransparentData = function () {
            var rd = this._renderableData;
            // If null, there was no change of ZOrder, we have nothing to do
            if (rd._firstChangedPrim === null) {
                return;
            }
            // Sort all the primitive from their depth, max (bottom) to min (top)
            rd._transparentPrimitives.sort(function (a, b) { return b._primitive.actualZOffset - a._primitive.actualZOffset; });
            var checkAndAddPrimInSegment = function (seg, tpiI) {
                var tpi = rd._transparentPrimitives[tpiI];
                // Fast rejection: if gii are different
                if (seg.groupInsanceInfo !== tpi._groupInstanceInfo) {
                    return false;
                }
                var tpiZ = tpi._primitive.actualZOffset;
                // We've made it so far, the tpi can be part of the segment, add it
                tpi._transparentSegment = seg;
                // Check if we have to update endZ, a smaller value means one above the current one
                if (tpiZ < seg.endZ) {
                    seg.endZ = tpiZ;
                    seg.endDataIndex = tpi._primitive._getLastIndexInDataBuffer() + 1; // Still exclusive
                }
                return true;
            };
            rd._transparentSegments.splice(0);
            var prevSeg = null;
            for (var tpiI = 0; tpiI < rd._transparentPrimitives.length; tpiI++) {
                var tpi = rd._transparentPrimitives[tpiI];
                // Check if the Data in which the primitive is stored is not sorted properly
                if (tpi._groupInstanceInfo.transparentOrderDirty) {
                    tpi._groupInstanceInfo.sortTransparentData();
                }
                // Reset the segment, we have to create/rebuild it
                tpi._transparentSegment = null;
                // If there's a previous valid segment, check if this prim can be part of it
                if (prevSeg) {
                    checkAndAddPrimInSegment(prevSeg, tpiI);
                }
                // If we couldn't insert in the adjacent segments, he have to create one
                if (!tpi._transparentSegment) {
                    var ts = new BABYLON.TransparentSegment();
                    ts.groupInsanceInfo = tpi._groupInstanceInfo;
                    var prim = tpi._primitive;
                    ts.startZ = prim.actualZOffset;
                    ts.startDataIndex = prim._getFirstIndexInDataBuffer();
                    ts.endDataIndex = prim._getLastIndexInDataBuffer() + 1; // Make it exclusive, more natural to use in a for loop
                    ts.endZ = ts.startZ;
                    tpi._transparentSegment = ts;
                    rd._transparentSegments.push(ts);
                }
                // Update prevSeg
                prevSeg = tpi._transparentSegment;
            }
            rd._firstChangedPrim = null;
            rd._transparentListChanged = false;
        };
        Group2D.prototype._renderTransparentData = function () {
            var failedCount = 0;
            var context = new BABYLON.Render2DContext(BABYLON.Render2DContext.RenderModeTransparent);
            var rd = this._renderableData;
            var length = rd._transparentSegments.length;
            for (var i = 0; i < length; i++) {
                var ts = rd._transparentSegments[i];
                var gii = ts.groupInsanceInfo;
                var mrc = gii.modelRenderCache;
                context.useInstancing = false;
                context.partDataStartIndex = ts.startDataIndex;
                context.partDataEndIndex = ts.endDataIndex;
                context.groupInfoPartData = gii.transparentData;
                var renderFailed = !mrc.render(gii, context);
                failedCount += renderFailed ? 1 : 0;
            }
            return failedCount;
        };
        Group2D.prototype._prepareContext = function (engine, context, gii) {
            var gipd = null;
            var setDirty;
            var getDirty;
            // Render Mode specifics
            switch (context.renderMode) {
                case BABYLON.Render2DContext.RenderModeOpaque:
                    {
                        if (!gii.hasOpaqueData) {
                            return null;
                        }
                        setDirty = function (dirty) { gii.opaqueDirty = dirty; };
                        getDirty = function () { return gii.opaqueDirty; };
                        context.groupInfoPartData = gii.opaqueData;
                        gipd = gii.opaqueData;
                        break;
                    }
                case BABYLON.Render2DContext.RenderModeAlphaTest:
                    {
                        if (!gii.hasAlphaTestData) {
                            return null;
                        }
                        setDirty = function (dirty) { gii.alphaTestDirty = dirty; };
                        getDirty = function () { return gii.alphaTestDirty; };
                        context.groupInfoPartData = gii.alphaTestData;
                        gipd = gii.alphaTestData;
                        break;
                    }
                default:
                    throw new Error("_prepareContext is only for opaque or alphaTest");
            }
            var renderCount = 0;
            // This part will pack the dynamicfloatarray and update the instanced array WebGLBufffer
            // Skip it if instanced arrays are not supported
            if (this.owner.supportInstancedArray) {
                // Flag for instancing
                context.useInstancing = true;
                // Make sure all the WebGLBuffers of the Instanced Array are created/up to date for the parts to render.
                for (var i = 0; i < gipd.length; i++) {
                    var pid = gipd[i];
                    // If the instances of the model was changed, pack the data
                    var array = pid._partData;
                    var instanceData_1 = array.pack();
                    renderCount += array.usedElementCount;
                    // Compute the size the instance buffer should have
                    var neededSize = array.usedElementCount * array.stride * 4;
                    // Check if we have to (re)create the instancesBuffer because there's none or the size is too small
                    if (!pid._partBuffer || (pid._partBufferSize < neededSize)) {
                        if (pid._partBuffer) {
                            engine.deleteInstancesBuffer(pid._partBuffer);
                        }
                        pid._partBuffer = engine.createInstancesBuffer(neededSize); // Create + bind
                        pid._partBufferSize = neededSize;
                        setDirty(false);
                        // Update the WebGL buffer to match the new content of the instances data
                        engine.updateArrayBuffer(instanceData_1);
                    }
                    else if (getDirty()) {
                        // Update the WebGL buffer to match the new content of the instances data
                        engine.bindArrayBuffer(pid._partBuffer);
                        engine.updateArrayBuffer(instanceData_1);
                    }
                }
                setDirty(false);
            }
            else {
                context.partDataStartIndex = 0;
                if (context.groupInfoPartData.length > 0) {
                    // Find the first valid object to get the count
                    var i = 0;
                    while (!context.groupInfoPartData[i]) {
                        i++;
                    }
                    context.partDataEndIndex = context.groupInfoPartData[i]._partData.usedElementCount;
                }
            }
            return renderCount;
        };
        Group2D.prototype._bindCacheTarget = function () {
            var curWidth;
            var curHeight;
            var rd = this._renderableData;
            if (rd._cacheNode) {
                var size = rd._cacheNode.contentSize;
                var groupWidth = Math.ceil(this.actualSize.width);
                var groupHeight = Math.ceil(this.actualSize.height);
                if ((size.width < groupWidth) || (size.height < groupHeight)) {
                    curWidth = Math.floor(size.width * 1.07); // Grow 5% more to avoid frequent resizing for few pixels...
                    curHeight = Math.floor(size.height * 1.07);
                    //console.log(`[${this._globalTransformProcessStep}] Resize group ${this.id}, width: ${curWidth}, height: ${curHeight}`);
                    rd._cacheTexture.freeRect(rd._cacheNode);
                    rd._cacheNode = null;
                }
            }
            if (!rd._cacheNode) {
                // Check if we have to allocate a rendering zone in the global cache texture
                var res = this.owner._allocateGroupCache(this, this.renderGroup, curWidth ? new BABYLON.Size(curWidth, curHeight) : null);
                rd._cacheNode = res.node;
                rd._cacheTexture = res.texture;
                rd._cacheRenderSprite = res.sprite;
                var size = rd._cacheNode.contentSize;
            }
            var n = rd._cacheNode;
            rd._cacheTexture.bindTextureForPosSize(n.pos, this.actualSize, true);
        };
        Group2D.prototype._unbindCacheTarget = function () {
            if (this._renderableData._cacheTexture) {
                this._renderableData._cacheTexture.unbindTexture();
            }
        };
        Group2D.prototype.handleGroupChanged = function (prop) {
            // This method is only for cachedGroup
            var rd = this._renderableData;
            if (!this.isCachedGroup || !rd._cacheRenderSprite) {
                return;
            }
            // For now we only support these property changes
            // TODO: add more! :)
            if (prop.id === BABYLON.Prim2DBase.actualPositionProperty.id) {
                rd._cacheRenderSprite.actualPosition = this.actualPosition.clone();
            }
            else if (prop.id === BABYLON.Prim2DBase.rotationProperty.id) {
                rd._cacheRenderSprite.rotation = this.rotation;
            }
            else if (prop.id === BABYLON.Prim2DBase.scaleProperty.id) {
                rd._cacheRenderSprite.scale = this.scale;
            }
            else if (prop.id === BABYLON.Prim2DBase.originProperty.id) {
                rd._cacheRenderSprite.origin = this.origin.clone();
            }
            else if (prop.id === Group2D.actualSizeProperty.id) {
                rd._cacheRenderSprite.size = this.actualSize.clone();
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
            if (this._isRenderableGroup) {
                // Yes, we do need that check, trust me, unfortunately we can call _detectGroupStates many time on the same object...
                if (!this._renderableData) {
                    this._renderableData = new RenderableGroupData();
                }
            }
            // If the group is tagged as renderable we add it to the renderable tree
            if (this._isCachedGroup) {
                var cur = this.parent;
                while (cur) {
                    if (cur instanceof Group2D && cur._isRenderableGroup) {
                        if (cur._renderableData._childrenRenderableGroups.indexOf(this) === -1) {
                            cur._renderableData._childrenRenderableGroups.push(this);
                        }
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
    })(BABYLON.Prim2DBase);
    BABYLON.Group2D = Group2D;
    var RenderableGroupData = (function () {
        function RenderableGroupData() {
            this._primDirtyList = new Array();
            this._childrenRenderableGroups = new Array();
            this._renderGroupInstancesInfo = new BABYLON.StringDictionary();
            this._transparentPrimitives = new Array();
            this._transparentSegments = new Array();
            this._firstChangedPrim = null;
            this._transparentListChanged = false;
            this._cacheNode = null;
            this._cacheTexture = null;
            this._cacheRenderSprite = null;
        }
        RenderableGroupData.prototype.dispose = function () {
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
        };
        RenderableGroupData.prototype.addNewTransparentPrimitiveInfo = function (prim, gii) {
            var tpi = new TransparentPrimitiveInfo();
            tpi._primitive = prim;
            tpi._groupInstanceInfo = gii;
            tpi._transparentSegment = null;
            this._transparentPrimitives.push(tpi);
            this._transparentListChanged = true;
            this.updateSmallestZChangedPrim(tpi);
            return tpi;
        };
        RenderableGroupData.prototype.removeTransparentPrimitiveInfo = function (tpi) {
            var index = this._transparentPrimitives.indexOf(tpi);
            if (index !== -1) {
                this._transparentPrimitives.splice(index, 1);
                this._transparentListChanged = true;
                this.updateSmallestZChangedPrim(tpi);
            }
        };
        RenderableGroupData.prototype.transparentPrimitiveZChanged = function (tpi) {
            this._transparentListChanged = true;
            this.updateSmallestZChangedPrim(tpi);
        };
        RenderableGroupData.prototype.updateSmallestZChangedPrim = function (tpi) {
            if (tpi._primitive) {
                var newZ = tpi._primitive.actualZOffset;
                var curZ = this._firstChangedPrim ? this._firstChangedPrim._primitive.actualZOffset : Number.MIN_VALUE;
                if (newZ > curZ) {
                    this._firstChangedPrim = tpi;
                }
            }
        };
        return RenderableGroupData;
    })();
    BABYLON.RenderableGroupData = RenderableGroupData;
    var TransparentPrimitiveInfo = (function () {
        function TransparentPrimitiveInfo() {
        }
        return TransparentPrimitiveInfo;
    })();
    BABYLON.TransparentPrimitiveInfo = TransparentPrimitiveInfo;
})(BABYLON || (BABYLON = {}));
