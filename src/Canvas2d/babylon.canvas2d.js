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
    // This class contains data that lifetime is bounding to the Babylon Engine object
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
        function Canvas2D(scene, settings) {
            var _this = this;
            _super.call(this, settings);
            /**
             * If you set your own WorldSpaceNode to display the Canvas2D you have to provide your own implementation of this method which computes the local position in the Canvas based on the given 3D World one.
             * Beware that you have to take under consideration the origin in your calculations! Good luck!
             */
            this.worldSpaceToNodeLocal = function (worldPos) {
                var node = _this._worldSpaceNode;
                if (!node) {
                    return;
                }
                var mtx = node.getWorldMatrix().clone();
                mtx.invert();
                var v = BABYLON.Vector3.TransformCoordinates(worldPos, mtx);
                var res = new BABYLON.Vector2(v.x, v.y);
                var size = _this.actualSize;
                res.x += size.width * 0.5; // res is centered, make it relative to bottom/left
                res.y += size.height * 0.5;
                return res;
            };
            /**
             * If you use a custom WorldSpaceCanvasNode you have to override this property to update the UV of your object to reflect the changes due to a resizing of the cached bitmap
             */
            this.worldSpaceCacheChanged = function () {
                var plane = _this.worldSpaceCanvasNode;
                var vd = BABYLON.VertexData.ExtractFromMesh(plane); //new VertexData();
                vd.uvs = new Float32Array(8);
                var material = plane.material;
                var tex = _this._renderableData._cacheTexture;
                if (material.diffuseTexture !== tex) {
                    material.diffuseTexture = tex;
                    tex.hasAlpha = true;
                }
                var nodeuv = _this._renderableData._cacheNodeUVs;
                for (var i = 0; i < 4; i++) {
                    vd.uvs[i * 2 + 0] = nodeuv[i].x;
                    vd.uvs[i * 2 + 1] = nodeuv[i].y;
                }
                vd.applyToMesh(plane);
            };
            this._notifDebugMode = false;
            this._mapCounter = 0;
            this._drawCallsOpaqueCounter = new BABYLON.PerfCounter();
            this._drawCallsAlphaTestCounter = new BABYLON.PerfCounter();
            this._drawCallsTransparentCounter = new BABYLON.PerfCounter();
            this._groupRenderCounter = new BABYLON.PerfCounter();
            this._updateTransparentDataCounter = new BABYLON.PerfCounter();
            this._cachedGroupRenderCounter = new BABYLON.PerfCounter();
            this._updateCachedStateCounter = new BABYLON.PerfCounter();
            this._updateLayoutCounter = new BABYLON.PerfCounter();
            this._updatePositioningCounter = new BABYLON.PerfCounter();
            this._updateLocalTransformCounter = new BABYLON.PerfCounter();
            this._updateGlobalTransformCounter = new BABYLON.PerfCounter();
            this._boundingInfoRecomputeCounter = new BABYLON.PerfCounter();
            this._profileInfoText = null;
            BABYLON.Prim2DBase._isCanvasInit = false;
            if (!settings) {
                settings = {};
            }
            if (this._cachingStrategy !== Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                this._background = new BABYLON.Rectangle2D({ parent: this, id: "###CANVAS BACKGROUND###", size: settings.size }); //TODO CHECK when size is null
                this._background.zOrder = 1.0;
                this._background.isPickable = false;
                this._background.origin = BABYLON.Vector2.Zero();
                this._background.levelVisible = false;
                if (settings.backgroundRoundRadius != null) {
                    this.backgroundRoundRadius = settings.backgroundRoundRadius;
                }
                if (settings.backgroundBorder != null) {
                    if (typeof (settings.backgroundBorder) === "string") {
                        this.backgroundBorder = Canvas2D.GetBrushFromString(settings.backgroundBorder);
                    }
                    else {
                        this.backgroundBorder = settings.backgroundBorder;
                    }
                }
                if (settings.backgroundBorderThickNess != null) {
                    this.backgroundBorderThickness = settings.backgroundBorderThickNess;
                }
                if (settings.backgroundFill != null) {
                    if (typeof (settings.backgroundFill) === "string") {
                        this.backgroundFill = Canvas2D.GetBrushFromString(settings.backgroundFill);
                    }
                    else {
                        this.backgroundFill = settings.backgroundFill;
                    }
                }
                this._background._patchHierarchy(this);
            }
            var engine = scene.getEngine();
            this.__engineData = engine.getOrAddExternalDataWithFactory("__BJSCANVAS2D__", function (k) { return new Canvas2DEngineBoundData(); });
            this._primPointerInfo = new BABYLON.PrimitivePointerInfo();
            this._capturedPointers = new BABYLON.StringDictionary();
            this._pickStartingPosition = BABYLON.Vector2.Zero();
            this._hierarchyLevelMaxSiblingCount = 50;
            this._hierarchyDepth = 0;
            this._zOrder = 0;
            this._zMax = 1;
            this._scene = scene;
            this._engine = engine;
            this._renderingSize = new BABYLON.Size(0, 0);
            this._trackedGroups = new Array();
            this._maxAdaptiveWorldSpaceCanvasSize = null;
            this._groupCacheMaps = new BABYLON.StringDictionary();
            this._patchHierarchy(this);
            var enableInteraction = (settings.enableInteraction == null) ? true : settings.enableInteraction;
            this._fitRenderingDevice = !settings.size;
            if (!settings.size) {
                settings.size = new BABYLON.Size(engine.getRenderWidth(), engine.getRenderHeight());
            }
            // Register scene dispose to also dispose the canvas when it'll happens
            scene.onDisposeObservable.add(function (d, s) {
                _this.dispose();
            });
            if (this._isScreenSpace) {
                this._afterRenderObserver = this._scene.onAfterRenderObservable.add(function (d, s) {
                    _this._engine.clear(null, false, true);
                    _this._render();
                });
            }
            else {
                this._beforeRenderObserver = this._scene.onBeforeRenderObservable.add(function (d, s) {
                    _this._render();
                });
            }
            this._supprtInstancedArray = this._engine.getCaps().instancedArrays !== null;
            //this._supprtInstancedArray = false; // TODO REMOVE!!!
            this._setupInteraction(enableInteraction);
        }
        Object.defineProperty(Canvas2D.prototype, "drawCallsOpaqueCounter", {
            get: function () {
                return this._drawCallsOpaqueCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "drawCallsAlphaTestCounter", {
            get: function () {
                return this._drawCallsAlphaTestCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "drawCallsTransparentCounter", {
            get: function () {
                return this._drawCallsTransparentCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "groupRenderCounter", {
            get: function () {
                return this._groupRenderCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updateTransparentDataCounter", {
            get: function () {
                return this._updateTransparentDataCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "cachedGroupRenderCounter", {
            get: function () {
                return this._cachedGroupRenderCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updateCachedStateCounter", {
            get: function () {
                return this._updateCachedStateCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updateLayoutCounter", {
            get: function () {
                return this._updateLayoutCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updatePositioningCounter", {
            get: function () {
                return this._updatePositioningCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updateLocalTransformCounter", {
            get: function () {
                return this._updateLocalTransformCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updateGlobalTransformCounter", {
            get: function () {
                return this._updateGlobalTransformCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "boundingInfoRecomputeCounter", {
            get: function () {
                return this._boundingInfoRecomputeCounter;
            },
            enumerable: true,
            configurable: true
        });
        Canvas2D.prototype._canvasPreInit = function (settings) {
            var cachingStrategy = (settings.cachingStrategy == null) ? Canvas2D.CACHESTRATEGY_DONTCACHE : settings.cachingStrategy;
            this._cachingStrategy = cachingStrategy;
            this._isScreenSpace = (settings.isScreenSpace == null) ? true : settings.isScreenSpace;
        };
        Canvas2D.prototype._setupInteraction = function (enable) {
            var _this = this;
            // No change detection
            if (enable === this._interactionEnabled) {
                return;
            }
            // Set the new state
            this._interactionEnabled = enable;
            // ScreenSpace mode
            if (this._isScreenSpace) {
                // Disable interaction
                if (!enable) {
                    if (this._scenePrePointerObserver) {
                        this.scene.onPrePointerObservable.remove(this._scenePrePointerObserver);
                        this._scenePrePointerObserver = null;
                    }
                    return;
                }
                // Enable Interaction
                // Register the observable
                this._scenePrePointerObserver = this.scene.onPrePointerObservable.add(function (e, s) {
                    var hs = 1 / _this.engine.getHardwareScalingLevel();
                    var localPos = e.localPosition.multiplyByFloats(hs, hs);
                    _this._handlePointerEventForInteraction(e, localPos, s);
                });
            }
            else {
                var scene = this.scene;
                if (enable) {
                    scene.constantlyUpdateMeshUnderPointer = true;
                    this._scenePointerObserver = scene.onPointerObservable.add(function (e, s) {
                        if (e.pickInfo.hit && e.pickInfo.pickedMesh === _this._worldSpaceNode && _this.worldSpaceToNodeLocal) {
                            var localPos = _this.worldSpaceToNodeLocal(e.pickInfo.pickedPoint);
                            _this._handlePointerEventForInteraction(e, localPos, s);
                        }
                    });
                }
                else {
                    if (this._scenePointerObserver) {
                        this.scene.onPointerObservable.remove(this._scenePointerObserver);
                        this._scenePointerObserver = null;
                    }
                }
            }
        };
        /**
         * Internal method, you should use the Prim2DBase version instead
         */
        Canvas2D.prototype._setPointerCapture = function (pointerId, primitive) {
            if (this.isPointerCaptured(pointerId)) {
                return false;
            }
            // Try to capture the pointer on the HTML side
            try {
                this.engine.getRenderingCanvas().setPointerCapture(pointerId);
            }
            catch (e) {
            }
            this._primPointerInfo.updateRelatedTarget(primitive, BABYLON.Vector2.Zero());
            this._bubbleNotifyPrimPointerObserver(primitive, BABYLON.PrimitivePointerInfo.PointerGotCapture, null);
            this._capturedPointers.add(pointerId.toString(), primitive);
            return true;
        };
        /**
         * Internal method, you should use the Prim2DBase version instead
         */
        Canvas2D.prototype._releasePointerCapture = function (pointerId, primitive) {
            if (this._capturedPointers.get(pointerId.toString()) !== primitive) {
                return false;
            }
            // Try to release the pointer on the HTML side
            try {
                this.engine.getRenderingCanvas().releasePointerCapture(pointerId);
            }
            catch (e) {
            }
            this._primPointerInfo.updateRelatedTarget(primitive, BABYLON.Vector2.Zero());
            this._bubbleNotifyPrimPointerObserver(primitive, BABYLON.PrimitivePointerInfo.PointerLostCapture, null);
            this._capturedPointers.remove(pointerId.toString());
            return true;
        };
        /**
         * Determine if the given pointer is captured or not
         * @param pointerId the Id of the pointer
         * @return true if it's captured, false otherwise
         */
        Canvas2D.prototype.isPointerCaptured = function (pointerId) {
            return this._capturedPointers.contains(pointerId.toString());
        };
        Canvas2D.prototype.getCapturedPrimitive = function (pointerId) {
            // Avoid unnecessary lookup
            if (this._capturedPointers.count === 0) {
                return null;
            }
            return this._capturedPointers.get(pointerId.toString());
        };
        Canvas2D.prototype._handlePointerEventForInteraction = function (eventData, localPosition, eventState) {
            // Dispose check
            if (this.isDisposed) {
                return;
            }
            // Update the this._primPointerInfo structure we'll send to observers using the PointerEvent data
            this._updatePointerInfo(eventData, localPosition);
            var capturedPrim = this.getCapturedPrimitive(this._primPointerInfo.pointerId);
            // Make sure the intersection list is up to date, we maintain this list either in response of a mouse event (here) or before rendering the canvas.
            // Why before rendering the canvas? because some primitives may move and get away/under the mouse cursor (which is not moving). So we need to update at both location in order to always have an accurate list, which is needed for the hover state change.
            this._updateIntersectionList(this._primPointerInfo.canvasPointerPos, capturedPrim !== null);
            // Update the over status, same as above, it's could be done here or during rendering, but will be performed only once per render frame
            this._updateOverStatus();
            // Check if we have nothing to raise
            if (!this._actualOverPrimitive && !capturedPrim) {
                return;
            }
            // Update the relatedTarget info with the over primitive or the captured one (if any)
            var targetPrim = capturedPrim || this._actualOverPrimitive.prim;
            var targetPointerPos = capturedPrim ? this._primPointerInfo.canvasPointerPos.subtract(new BABYLON.Vector2(targetPrim.globalTransform.m[12], targetPrim.globalTransform.m[13])) : this._actualOverPrimitive.intersectionLocation;
            this._primPointerInfo.updateRelatedTarget(targetPrim, targetPointerPos);
            // Analyze the pointer event type and fire proper events on the primitive
            if (eventData.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
                this._bubbleNotifyPrimPointerObserver(targetPrim, BABYLON.PrimitivePointerInfo.PointerMouseWheel, eventData.event);
            }
            else if (eventData.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                this._bubbleNotifyPrimPointerObserver(targetPrim, BABYLON.PrimitivePointerInfo.PointerMove, eventData.event);
            }
            else if (eventData.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                this._bubbleNotifyPrimPointerObserver(targetPrim, BABYLON.PrimitivePointerInfo.PointerDown, eventData.event);
            }
            else if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
                this._bubbleNotifyPrimPointerObserver(targetPrim, BABYLON.PrimitivePointerInfo.PointerUp, eventData.event);
            }
        };
        Canvas2D.prototype._updatePointerInfo = function (eventData, localPosition) {
            var pii = this._primPointerInfo;
            if (!pii.canvasPointerPos) {
                pii.canvasPointerPos = BABYLON.Vector2.Zero();
            }
            var camera = this._scene.cameraToUseForPointers || this._scene.activeCamera;
            var engine = this._scene.getEngine();
            if (this._isScreenSpace) {
                var cameraViewport = camera.viewport;
                var viewport = cameraViewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
                // Moving coordinates to local viewport world
                var x = localPosition.x - viewport.x;
                var y = localPosition.y - viewport.y;
                pii.canvasPointerPos.x = x - this.actualPosition.x;
                pii.canvasPointerPos.y = engine.getRenderHeight() - y - this.actualPosition.y;
            }
            else {
                pii.canvasPointerPos.x = localPosition.x;
                pii.canvasPointerPos.y = localPosition.y;
            }
            pii.mouseWheelDelta = 0;
            if (eventData.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
                var event = eventData.event;
                if (event.wheelDelta) {
                    pii.mouseWheelDelta = event.wheelDelta / (BABYLON.PrimitivePointerInfo.MouseWheelPrecision * 40);
                }
                else if (event.detail) {
                    pii.mouseWheelDelta = -event.detail / BABYLON.PrimitivePointerInfo.MouseWheelPrecision;
                }
            }
            else {
                var pe = eventData.event;
                pii.ctrlKey = pe.ctrlKey;
                pii.altKey = pe.altKey;
                pii.shiftKey = pe.shiftKey;
                pii.metaKey = pe.metaKey;
                pii.button = pe.button;
                pii.buttons = pe.buttons;
                pii.pointerId = pe.pointerId;
                pii.width = pe.width;
                pii.height = pe.height;
                pii.presssure = pe.pressure;
                pii.tilt.x = pe.tiltX;
                pii.tilt.y = pe.tiltY;
                pii.isCaptured = this.getCapturedPrimitive(pe.pointerId) !== null;
            }
        };
        Canvas2D.prototype._updateIntersectionList = function (mouseLocalPos, isCapture) {
            if (this.scene.getRenderId() === this._intersectionRenderId) {
                return;
            }
            // A little safe guard, it might happens than the event is triggered before the first render and nothing is computed, this simple check will make sure everything will be fine
            if (!this._globalTransform) {
                this.updateCachedStates(true);
            }
            var ii = Canvas2D._interInfo;
            ii.pickPosition.x = mouseLocalPos.x;
            ii.pickPosition.y = mouseLocalPos.y;
            ii.findFirstOnly = false;
            // Fast rejection: test if the mouse pointer is outside the canvas's bounding Info
            if (!isCapture && !this.boundingInfo.doesIntersect(ii.pickPosition)) {
                this._previousIntersectionList = this._actualIntersectionList;
                this._actualIntersectionList = null;
                this._previousOverPrimitive = this._actualOverPrimitive;
                this._actualOverPrimitive = null;
                return;
            }
            this.intersect(ii);
            this._previousIntersectionList = this._actualIntersectionList;
            this._actualIntersectionList = ii.intersectedPrimitives;
            this._previousOverPrimitive = this._actualOverPrimitive;
            this._actualOverPrimitive = ii.topMostIntersectedPrimitive;
            this._intersectionRenderId = this.scene.getRenderId();
        };
        // Based on the previousIntersectionList and the actualInstersectionList we can determined which primitives are being hover state or loosing it
        Canvas2D.prototype._updateOverStatus = function () {
            if ((this.scene.getRenderId() === this._hoverStatusRenderId) || !this._previousIntersectionList || !this._actualIntersectionList) {
                return;
            }
            // Detect a change of over
            var prevPrim = this._previousOverPrimitive ? this._previousOverPrimitive.prim : null;
            var actualPrim = this._actualOverPrimitive ? this._actualOverPrimitive.prim : null;
            if (prevPrim !== actualPrim) {
                // Detect if the current pointer is captured, only fire event if they belong to the capture primitive
                var capturedPrim = this.getCapturedPrimitive(this._primPointerInfo.pointerId);
                // Notify the previous "over" prim that the pointer is no longer over it
                if ((capturedPrim && capturedPrim === prevPrim) || (!capturedPrim && prevPrim)) {
                    this._primPointerInfo.updateRelatedTarget(prevPrim, this._previousOverPrimitive.intersectionLocation);
                    this._bubbleNotifyPrimPointerObserver(prevPrim, BABYLON.PrimitivePointerInfo.PointerOut, null);
                }
                // Notify the new "over" prim that the pointer is over it
                if ((capturedPrim && capturedPrim === actualPrim) || (!capturedPrim && actualPrim)) {
                    this._primPointerInfo.updateRelatedTarget(actualPrim, this._actualOverPrimitive.intersectionLocation);
                    this._bubbleNotifyPrimPointerObserver(actualPrim, BABYLON.PrimitivePointerInfo.PointerOver, null);
                }
            }
            this._hoverStatusRenderId = this.scene.getRenderId();
        };
        Canvas2D.prototype._updatePrimPointerPos = function (prim) {
            if (this._primPointerInfo.isCaptured) {
                this._primPointerInfo.primitivePointerPos = this._primPointerInfo.relatedTargetPointerPos;
            }
            else {
                for (var _i = 0, _a = this._actualIntersectionList; _i < _a.length; _i++) {
                    var pii = _a[_i];
                    if (pii.prim === prim) {
                        this._primPointerInfo.primitivePointerPos = pii.intersectionLocation;
                        return;
                    }
                }
            }
        };
        Canvas2D.prototype._debugExecObserver = function (prim, mask) {
            if (!this._notifDebugMode) {
                return;
            }
            var debug = "";
            for (var i = 0; i < prim.hierarchyDepth; i++) {
                debug += "  ";
            }
            var pii = this._primPointerInfo;
            debug += "[RID:" + this.scene.getRenderId() + "] [" + prim.hierarchyDepth + "] event:" + BABYLON.PrimitivePointerInfo.getEventTypeName(mask) + ", id: " + prim.id + " (" + BABYLON.Tools.getClassName(prim) + "), primPos: " + pii.primitivePointerPos.toString() + ", canvasPos: " + pii.canvasPointerPos.toString();
            console.log(debug);
        };
        Canvas2D.prototype._bubbleNotifyPrimPointerObserver = function (prim, mask, eventData) {
            var ppi = this._primPointerInfo;
            // In case of PointerOver/Out we will first notify the parent with PointerEnter/Leave
            if ((mask & (BABYLON.PrimitivePointerInfo.PointerOver | BABYLON.PrimitivePointerInfo.PointerOut)) !== 0) {
                this._notifParents(prim, mask);
            }
            var bubbleCancelled = false;
            var cur = prim;
            while (cur) {
                // Only trigger the observers if the primitive is intersected (except for out)
                if (!bubbleCancelled) {
                    this._updatePrimPointerPos(cur);
                    // Exec the observers
                    this._debugExecObserver(cur, mask);
                    cur._pointerEventObservable.notifyObservers(ppi, mask);
                    this._triggerActionManager(cur, ppi, mask, eventData);
                    // Bubble canceled? If we're not executing PointerOver or PointerOut, quit immediately
                    // If it's PointerOver/Out we have to trigger PointerEnter/Leave no matter what
                    if (ppi.cancelBubble) {
                        if ((mask & (BABYLON.PrimitivePointerInfo.PointerOver | BABYLON.PrimitivePointerInfo.PointerOut)) === 0) {
                            return;
                        }
                        // We're dealing with PointerOver/Out, let's keep looping to fire PointerEnter/Leave, but not Over/Out anymore
                        bubbleCancelled = true;
                    }
                }
                // If bubble is cancel we didn't update the Primitive Pointer Pos yet, let's do it
                if (bubbleCancelled) {
                    this._updatePrimPointerPos(cur);
                }
                // Trigger a PointerEnter corresponding to the PointerOver
                if (mask === BABYLON.PrimitivePointerInfo.PointerOver) {
                    this._debugExecObserver(cur, BABYLON.PrimitivePointerInfo.PointerEnter);
                    cur._pointerEventObservable.notifyObservers(ppi, BABYLON.PrimitivePointerInfo.PointerEnter);
                }
                else if (mask === BABYLON.PrimitivePointerInfo.PointerOut) {
                    this._debugExecObserver(cur, BABYLON.PrimitivePointerInfo.PointerLeave);
                    cur._pointerEventObservable.notifyObservers(ppi, BABYLON.PrimitivePointerInfo.PointerLeave);
                }
                // Loop to the parent
                cur = cur.parent;
            }
        };
        Canvas2D.prototype._triggerActionManager = function (prim, ppi, mask, eventData) {
            var _this = this;
            // A little safe guard, it might happens than the event is triggered before the first render and nothing is computed, this simple check will make sure everything will be fine
            if (!this._globalTransform) {
                this.updateCachedStates(true);
            }
            // Process Trigger related to PointerDown
            if ((mask & BABYLON.PrimitivePointerInfo.PointerDown) !== 0) {
                // On pointer down, record the current position and time to be able to trick PickTrigger and LongPressTrigger
                this._pickStartingPosition = ppi.primitivePointerPos.clone();
                this._pickStartingTime = new Date().getTime();
                this._pickedDownPrim = null;
                if (prim.actionManager) {
                    this._pickedDownPrim = prim;
                    if (prim.actionManager.hasPickTriggers) {
                        var actionEvent = BABYLON.ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData);
                        switch (eventData.button) {
                            case 0:
                                prim.actionManager.processTrigger(BABYLON.ActionManager.OnLeftPickTrigger, actionEvent);
                                break;
                            case 1:
                                prim.actionManager.processTrigger(BABYLON.ActionManager.OnCenterPickTrigger, actionEvent);
                                break;
                            case 2:
                                prim.actionManager.processTrigger(BABYLON.ActionManager.OnRightPickTrigger, actionEvent);
                                break;
                        }
                        prim.actionManager.processTrigger(BABYLON.ActionManager.OnPickDownTrigger, actionEvent);
                    }
                    if (prim.actionManager.hasSpecificTrigger(BABYLON.ActionManager.OnLongPressTrigger)) {
                        window.setTimeout(function () {
                            var ppi = _this._primPointerInfo;
                            var capturedPrim = _this.getCapturedPrimitive(ppi.pointerId);
                            _this._updateIntersectionList(ppi.canvasPointerPos, capturedPrim !== null);
                            var ii = new BABYLON.IntersectInfo2D();
                            ii.pickPosition = ppi.canvasPointerPos.clone();
                            ii.findFirstOnly = false;
                            _this.intersect(ii);
                            if (ii.isPrimIntersected(prim) !== null) {
                                if (prim.actionManager) {
                                    if (_this._pickStartingTime !== 0 && ((new Date().getTime() - _this._pickStartingTime) > BABYLON.ActionManager.LongPressDelay) && (Math.abs(_this._pickStartingPosition.x - ii.pickPosition.x) < BABYLON.ActionManager.DragMovementThreshold && Math.abs(_this._pickStartingPosition.y - ii.pickPosition.y) < BABYLON.ActionManager.DragMovementThreshold)) {
                                        _this._pickStartingTime = 0;
                                        prim.actionManager.processTrigger(BABYLON.ActionManager.OnLongPressTrigger, BABYLON.ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData));
                                    }
                                }
                            }
                        }, BABYLON.ActionManager.LongPressDelay);
                    }
                }
            }
            else if ((mask & BABYLON.PrimitivePointerInfo.PointerUp) !== 0) {
                this._pickStartingTime = 0;
                var actionEvent = BABYLON.ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData);
                if (prim.actionManager) {
                    // OnPickUpTrigger
                    prim.actionManager.processTrigger(BABYLON.ActionManager.OnPickUpTrigger, actionEvent);
                    // OnPickTrigger
                    if (Math.abs(this._pickStartingPosition.x - ppi.canvasPointerPos.x) < BABYLON.ActionManager.DragMovementThreshold && Math.abs(this._pickStartingPosition.y - ppi.canvasPointerPos.y) < BABYLON.ActionManager.DragMovementThreshold) {
                        prim.actionManager.processTrigger(BABYLON.ActionManager.OnPickTrigger, actionEvent);
                    }
                }
                // OnPickOutTrigger
                if (this._pickedDownPrim && this._pickedDownPrim.actionManager && (this._pickedDownPrim !== prim)) {
                    this._pickedDownPrim.actionManager.processTrigger(BABYLON.ActionManager.OnPickOutTrigger, actionEvent);
                }
            }
            else if ((mask & BABYLON.PrimitivePointerInfo.PointerOver) !== 0) {
                if (prim.actionManager) {
                    var actionEvent = BABYLON.ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData);
                    prim.actionManager.processTrigger(BABYLON.ActionManager.OnPointerOverTrigger, actionEvent);
                }
            }
            else if ((mask & BABYLON.PrimitivePointerInfo.PointerOut) !== 0) {
                if (prim.actionManager) {
                    var actionEvent = BABYLON.ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData);
                    prim.actionManager.processTrigger(BABYLON.ActionManager.OnPointerOutTrigger, actionEvent);
                }
            }
        };
        Canvas2D.prototype._notifParents = function (prim, mask) {
            var pii = this._primPointerInfo;
            var curPrim = this;
            while (curPrim) {
                this._updatePrimPointerPos(curPrim);
                // Fire the proper notification
                if (mask === BABYLON.PrimitivePointerInfo.PointerOver) {
                    this._debugExecObserver(curPrim, BABYLON.PrimitivePointerInfo.PointerEnter);
                    curPrim._pointerEventObservable.notifyObservers(pii, BABYLON.PrimitivePointerInfo.PointerEnter);
                }
                else if (mask === BABYLON.PrimitivePointerInfo.PointerOut) {
                    this._debugExecObserver(curPrim, BABYLON.PrimitivePointerInfo.PointerLeave);
                    curPrim._pointerEventObservable.notifyObservers(pii, BABYLON.PrimitivePointerInfo.PointerLeave);
                }
                curPrim = curPrim.parent;
            }
        };
        /**
         * Don't forget to call the dispose method when you're done with the Canvas instance.
         * But don't worry, if you dispose its scene, the canvas will be automatically disposed too.
         */
        Canvas2D.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this._profilingCanvas) {
                this._profilingCanvas.dispose();
                this._profilingCanvas = null;
            }
            if (this.interactionEnabled) {
                this._setupInteraction(false);
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
                this._groupCacheMaps.forEach(function (k, m) { return m.forEach(function (e) { return e.dispose(); }); });
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
        Object.defineProperty(Canvas2D.prototype, "isScreenSpace", {
            /**
             * Return true if the Canvas is a Screen Space one, false if it's a World Space one.
             * @returns {}
             */
            get: function () {
                return this._isScreenSpace;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "worldSpaceCanvasNode", {
            /**
             * Only valid for World Space Canvas, returns the scene node that displays the canvas
             */
            get: function () {
                return this._worldSpaceNode;
            },
            set: function (val) {
                this._worldSpaceNode = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "supportInstancedArray", {
            /**
             * Check if the WebGL Instanced Array extension is supported or not
             */
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
                this._background.levelVisible = true;
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
                this._background.levelVisible = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "backgroundBorderThickness", {
            /**
             * Property that defines the thickness of the border object used to draw the background of the Canvas.
             * @returns If the background is not set, null will be returned, otherwise a valid number matching the thickness is returned.
             */
            get: function () {
                if (!this._background || !this._background.isVisible) {
                    return null;
                }
                return this._background.borderThickness;
            },
            set: function (value) {
                this.checkBackgroundAvailability();
                if (value === this._background.borderThickness) {
                    return;
                }
                this._background.borderThickness = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "backgroundRoundRadius", {
            /**
             * You can set the roundRadius of the background
             * @returns The current roundRadius
             */
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
                this._background.levelVisible = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "interactionEnabled", {
            /**
             * Enable/Disable interaction for this Canvas
             * When enabled the Prim2DBase.pointerEventObservable property will notified when appropriate events occur
             */
            get: function () {
                return this._interactionEnabled;
            },
            set: function (enable) {
                this._setupInteraction(enable);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "_engineData", {
            /**
             * Access the babylon.js' engine bound data, do not invoke this method, it's for internal purpose only
             * @returns {}
             */
            get: function () {
                return this.__engineData;
            },
            enumerable: true,
            configurable: true
        });
        Canvas2D.prototype.createCanvasProfileInfoCanvas = function () {
            if (this._profilingCanvas) {
                return this._profilingCanvas;
            }
            var canvas = new ScreenSpaceCanvas2D(this.scene, {
                id: "ProfileInfoCanvas", cachingStrategy: Canvas2D.CACHESTRATEGY_DONTCACHE, children: [
                    new BABYLON.Rectangle2D({
                        id: "ProfileBorder", border: "#FFFFFFFF", borderThickness: 2, roundRadius: 5, fill: "#C04040C0", marginAlignment: "h: left, v: top", margin: "10", padding: "10", children: [
                            new BABYLON.Text2D("Stats", { id: "ProfileInfoText", marginAlignment: "h: left, v: top", fontName: "10pt Lucida Console" })
                        ]
                    })
                ]
            });
            this._profileInfoText = canvas.findById("ProfileInfoText");
            this._profilingCanvas = canvas;
            return canvas;
        };
        Canvas2D.prototype.checkBackgroundAvailability = function () {
            if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                throw Error("Can't use Canvas Background with the caching strategy TOPLEVELGROUPS");
            }
        };
        Canvas2D.prototype._initPerfMetrics = function () {
            this._drawCallsOpaqueCounter.fetchNewFrame();
            this._drawCallsAlphaTestCounter.fetchNewFrame();
            this._drawCallsTransparentCounter.fetchNewFrame();
            this._groupRenderCounter.fetchNewFrame();
            this._updateTransparentDataCounter.fetchNewFrame();
            this._cachedGroupRenderCounter.fetchNewFrame();
            this._updateCachedStateCounter.fetchNewFrame();
            this._updateLayoutCounter.fetchNewFrame();
            this._updatePositioningCounter.fetchNewFrame();
            this._updateLocalTransformCounter.fetchNewFrame();
            this._updateGlobalTransformCounter.fetchNewFrame();
            this._boundingInfoRecomputeCounter.fetchNewFrame();
        };
        Canvas2D.prototype._fetchPerfMetrics = function () {
            this._drawCallsOpaqueCounter.addCount(0, true);
            this._drawCallsAlphaTestCounter.addCount(0, true);
            this._drawCallsTransparentCounter.addCount(0, true);
            this._groupRenderCounter.addCount(0, true);
            this._updateTransparentDataCounter.addCount(0, true);
            this._cachedGroupRenderCounter.addCount(0, true);
            this._updateCachedStateCounter.addCount(0, true);
            this._updateLayoutCounter.addCount(0, true);
            this._updatePositioningCounter.addCount(0, true);
            this._updateLocalTransformCounter.addCount(0, true);
            this._updateGlobalTransformCounter.addCount(0, true);
            this._boundingInfoRecomputeCounter.addCount(0, true);
        };
        Canvas2D.prototype._updateProfileCanvas = function () {
            if (this._profileInfoText == null) {
                return;
            }
            var format = function (v) { return (Math.round(v * 100) / 100).toString(); };
            var p = "Draw Calls:\n" +
                (" - Opaque:      " + format(this.drawCallsOpaqueCounter.current) + ", (avg:" + format(this.drawCallsOpaqueCounter.lastSecAverage) + ", t:" + format(this.drawCallsOpaqueCounter.total) + ")\n") +
                (" - AlphaTest:   " + format(this.drawCallsAlphaTestCounter.current) + ", (avg:" + format(this.drawCallsAlphaTestCounter.lastSecAverage) + ", t:" + format(this.drawCallsAlphaTestCounter.total) + ")\n") +
                (" - Transparent: " + format(this.drawCallsTransparentCounter.current) + ", (avg:" + format(this.drawCallsTransparentCounter.lastSecAverage) + ", t:" + format(this.drawCallsTransparentCounter.total) + ")\n") +
                ("Group Render: " + this.groupRenderCounter.current + ", (avg:" + format(this.groupRenderCounter.lastSecAverage) + ", t:" + format(this.groupRenderCounter.total) + ")\n") +
                ("Update Transparent Data: " + this.updateTransparentDataCounter.current + ", (avg:" + format(this.updateTransparentDataCounter.lastSecAverage) + ", t:" + format(this.updateTransparentDataCounter.total) + ")\n") +
                ("Cached Group Render: " + this.cachedGroupRenderCounter.current + ", (avg:" + format(this.cachedGroupRenderCounter.lastSecAverage) + ", t:" + format(this.cachedGroupRenderCounter.total) + ")\n") +
                ("Update Cached States: " + this.updateCachedStateCounter.current + ", (avg:" + format(this.updateCachedStateCounter.lastSecAverage) + ", t:" + format(this.updateCachedStateCounter.total) + ")\n") +
                (" - Update Layout: " + this.updateLayoutCounter.current + ", (avg:" + format(this.updateLayoutCounter.lastSecAverage) + ", t:" + format(this.updateLayoutCounter.total) + ")\n") +
                (" - Update Positioning: " + this.updatePositioningCounter.current + ", (avg:" + format(this.updatePositioningCounter.lastSecAverage) + ", t:" + format(this.updatePositioningCounter.total) + ")\n") +
                (" - Update Local  Trans: " + this.updateLocalTransformCounter.current + ", (avg:" + format(this.updateLocalTransformCounter.lastSecAverage) + ", t:" + format(this.updateLocalTransformCounter.total) + ")\n") +
                (" - Update Global Trans: " + this.updateGlobalTransformCounter.current + ", (avg:" + format(this.updateGlobalTransformCounter.lastSecAverage) + ", t:" + format(this.updateGlobalTransformCounter.total) + ")\n") +
                (" - BoundingInfo Recompute: " + this.boundingInfoRecomputeCounter.current + ", (avg:" + format(this.boundingInfoRecomputeCounter.lastSecAverage) + ", t:" + format(this.boundingInfoRecomputeCounter.total) + ")\n");
            this._profileInfoText.text = p;
        };
        Canvas2D.prototype._addDrawCallCount = function (count, renderMode) {
            switch (renderMode) {
                case BABYLON.Render2DContext.RenderModeOpaque:
                    this._drawCallsOpaqueCounter.addCount(count, false);
                    return;
                case BABYLON.Render2DContext.RenderModeAlphaTest:
                    this._drawCallsAlphaTestCounter.addCount(count, false);
                    return;
                case BABYLON.Render2DContext.RenderModeTransparent:
                    this._drawCallsTransparentCounter.addCount(count, false);
                    return;
            }
        };
        Canvas2D.prototype._addGroupRenderCount = function (count) {
            this._groupRenderCounter.addCount(count, false);
        };
        Canvas2D.prototype._addUpdateTransparentDataCount = function (count) {
            this._updateTransparentDataCounter.addCount(count, false);
        };
        Canvas2D.prototype.addCachedGroupRenderCounter = function (count) {
            this._cachedGroupRenderCounter.addCount(count, false);
        };
        Canvas2D.prototype.addUpdateCachedStateCounter = function (count) {
            this._updateCachedStateCounter.addCount(count, false);
        };
        Canvas2D.prototype.addUpdateLayoutCounter = function (count) {
            this._updateLayoutCounter.addCount(count, false);
        };
        Canvas2D.prototype.addUpdatePositioningCounter = function (count) {
            this._updatePositioningCounter.addCount(count, false);
        };
        Canvas2D.prototype.addupdateLocalTransformCounter = function (count) {
            this._updateLocalTransformCounter.addCount(count, false);
        };
        Canvas2D.prototype.addUpdateGlobalTransformCounter = function (count) {
            this._updateGlobalTransformCounter.addCount(count, false);
        };
        Canvas2D.prototype.onPrimBecomesDirty = function () {
            this._addPrimToDirtyList(this);
        };
        Canvas2D.prototype._updateTrackedNodes = function () {
            var cam = this.scene.cameraToUseForPointers || this.scene.activeCamera;
            cam.getViewMatrix().multiplyToRef(cam.getProjectionMatrix(), Canvas2D._m);
            var rh = this.engine.getRenderHeight();
            var v = cam.viewport.toGlobal(this.engine.getRenderWidth(), rh);
            for (var _i = 0, _a = this._trackedGroups; _i < _a.length; _i++) {
                var group = _a[_i];
                if (group.isDisposed || !group.isVisible) {
                    continue;
                }
                var node = group.trackedNode;
                var worldMtx = node.getWorldMatrix();
                var proj = BABYLON.Vector3.Project(Canvas2D._v, worldMtx, Canvas2D._m, v);
                group.x = Math.round(proj.x);
                group.y = Math.round(rh - proj.y);
            }
        };
        /**
         * Call this method change you want to have layout related data computed and up to date (layout area, primitive area, local/global transformation matrices)
         */
        Canvas2D.prototype.updateCanvasLayout = function (forceRecompute) {
            this._updateCanvasState(forceRecompute);
        };
        Canvas2D.prototype._updateAdaptiveSizeWorldCanvas = function () {
            if (this._globalTransformStep < 2) {
                return;
            }
            var n = this.worldSpaceCanvasNode;
            var bi = n.getBoundingInfo().boundingBox;
            var v = bi.vectorsWorld;
            var cam = this.scene.cameraToUseForPointers || this.scene.activeCamera;
            cam.getViewMatrix().multiplyToRef(cam.getProjectionMatrix(), Canvas2D._m);
            var vp = cam.viewport.toGlobal(this.engine.getRenderWidth(), this.engine.getRenderHeight());
            var projPoints = new Array(4);
            for (var i = 0; i < 4; i++) {
                projPoints[i] = BABYLON.Vector3.Project(v[i], Canvas2D._mI, Canvas2D._m, vp);
            }
            var left = projPoints[3].subtract(projPoints[0]).length();
            var top = projPoints[3].subtract(projPoints[1]).length();
            var right = projPoints[1].subtract(projPoints[2]).length();
            var bottom = projPoints[2].subtract(projPoints[0]).length();
            var w = Math.round(Math.max(top, bottom));
            var h = Math.round(Math.max(right, left));
            var isW = w > h;
            // Basically if it's under 256 we use 256, otherwise we take the biggest power of 2
            var edge = Math.max(w, h);
            if (edge < 256) {
                edge = 256;
            }
            else {
                edge = Math.pow(2, Math.ceil(Math.log(edge) / Math.log(2)));
            }
            // Clip values if needed
            edge = Math.min(edge, this._maxAdaptiveWorldSpaceCanvasSize);
            var newScale = edge / ((isW) ? this.size.width : this.size.height);
            if (newScale !== this.scale) {
                var scale = newScale;
                //                console.log(`New adaptive scale for Canvas ${this.id}, w: ${w}, h: ${h}, scale: ${scale}, edge: ${edge}, isW: ${isW}`);
                this._setRenderingScale(scale);
            }
        };
        Canvas2D.prototype._updateCanvasState = function (forceRecompute) {
            // Check if the update has already been made for this render Frame
            if (!forceRecompute && this.scene.getRenderId() === this._updateRenderId) {
                return;
            }
            // Detect a change of rendering size
            var renderingSizeChanged = false;
            var newWidth = this.engine.getRenderWidth();
            if (newWidth !== this._renderingSize.width) {
                renderingSizeChanged = true;
            }
            this._renderingSize.width = newWidth;
            var newHeight = this.engine.getRenderHeight();
            if (newHeight !== this._renderingSize.height) {
                renderingSizeChanged = true;
            }
            this._renderingSize.height = newHeight;
            // If the canvas fit the rendering size and it changed, update
            if (renderingSizeChanged && this._fitRenderingDevice) {
                this.size = this._renderingSize;
                if (this._background) {
                    this._background.size = this.size;
                }
                // Dirty the Layout at the Canvas level to recompute as the size changed
                this._setLayoutDirty();
            }
            var context = new BABYLON.PrepareRender2DContext();
            ++this._globalTransformProcessStep;
            this.updateCachedStates(false);
            this._prepareGroupRender(context);
            this._updateRenderId = this.scene.getRenderId();
        };
        /**
         * Method that renders the Canvas, you should not invoke
         */
        Canvas2D.prototype._render = function () {
            this._initPerfMetrics();
            this._updateTrackedNodes();
            this._updateCanvasState(false);
            if (!this._isScreenSpace) {
                this._updateAdaptiveSizeWorldCanvas();
            }
            this._updateCanvasState(false);
            if (this._primPointerInfo.canvasPointerPos) {
                this._updateIntersectionList(this._primPointerInfo.canvasPointerPos, false);
                this._updateOverStatus(); // TODO this._primPointerInfo may not be up to date!
            }
            this.engine.setState(false);
            this._groupRender();
            if (!this._isScreenSpace) {
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagWorldCacheChanged)) {
                    this.worldSpaceCacheChanged();
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagWorldCacheChanged);
                }
            }
            // If the canvas is cached at canvas level, we must manually render the sprite that will display its content
            if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_CANVAS && this._cachedCanvasGroup) {
                this._cachedCanvasGroup._renderCachedCanvas();
            }
            this._fetchPerfMetrics();
            this._updateProfileCanvas();
        };
        /**
         * Internal method that allocate a cache for the given group.
         * Caching is made using a collection of MapTexture where many groups have their bitmap cache stored inside.
         * @param group The group to allocate the cache of.
         * @return custom type with the PackedRect instance giving information about the cache location into the texture and also the MapTexture instance that stores the cache.
         */
        Canvas2D.prototype._allocateGroupCache = function (group, parent, minSize, useMipMap, anisotropicLevel) {
            if (useMipMap === void 0) { useMipMap = false; }
            if (anisotropicLevel === void 0) { anisotropicLevel = 1; }
            var key = (useMipMap ? "MipMap" : "NoMipMap") + "_" + anisotropicLevel;
            // Determine size
            var size = group.actualSize;
            size = new BABYLON.Size(Math.ceil(size.width), Math.ceil(size.height));
            if (minSize) {
                size.width = Math.max(minSize.width, size.width);
                size.height = Math.max(minSize.height, size.height);
            }
            var mapArray = this._groupCacheMaps.getOrAddWithFactory(key, function () { return new Array(); });
            // Try to find a spot in one of the cached texture
            var res = null;
            var map;
            for (var _i = 0, mapArray_1 = mapArray; _i < mapArray_1.length; _i++) {
                var _map = mapArray_1[_i];
                map = _map;
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
                map = new BABYLON.MapTexture(id, this._scene, mapSize, useMipMap ? BABYLON.Texture.TRILINEAR_SAMPLINGMODE : BABYLON.Texture.BILINEAR_SAMPLINGMODE, useMipMap);
                map.anisotropicFilteringLevel = 4;
                mapArray.splice(0, 0, map);
                var node = map.allocateRect(size);
                res = { node: node, texture: map };
            }
            // Check if we have to create a Sprite that will display the content of the Canvas which is cached.
            // Don't do it in case of the group being a worldspace canvas (because its texture is bound to a WorldSpaceCanvas node)
            if (group !== this || this._isScreenSpace) {
                var node = res.node;
                // Special case if the canvas is entirely cached: create a group that will have a single sprite it will be rendered specifically at the very end of the rendering process
                if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_CANVAS) {
                    this._cachedCanvasGroup = BABYLON.Group2D._createCachedCanvasGroup(this);
                    var sprite = new BABYLON.Sprite2D(map, { parent: this._cachedCanvasGroup, id: "__cachedCanvasSprite__", spriteSize: node.contentSize, spriteLocation: node.pos });
                    sprite.zOrder = 1;
                    sprite.origin = BABYLON.Vector2.Zero();
                }
                else {
                    var sprite = new BABYLON.Sprite2D(map, { parent: parent, id: "__cachedSpriteOfGroup__" + group.id, x: group.actualPosition.x, y: group.actualPosition.y, spriteSize: node.contentSize, spriteLocation: node.pos });
                    sprite.origin = group.origin.clone();
                    res.sprite = sprite;
                }
            }
            return res;
        };
        /**
         * Internal method used to register a Scene Node to track position for the given group
         * Do not invoke this method, for internal purpose only.
         * @param group the group to track its associated Scene Node
         */
        Canvas2D.prototype._registerTrackedNode = function (group) {
            if (group._isFlagSet(BABYLON.SmartPropertyPrim.flagTrackedGroup)) {
                return;
            }
            this._trackedGroups.push(group);
            group._setFlags(BABYLON.SmartPropertyPrim.flagTrackedGroup);
        };
        /**
         * Internal method used to unregister a tracked Scene Node
         * Do not invoke this method, it's for internal purpose only.
         * @param group the group to unregister its tracked Scene Node from.
         */
        Canvas2D.prototype._unregisterTrackedNode = function (group) {
            if (!group._isFlagSet(BABYLON.SmartPropertyPrim.flagTrackedGroup)) {
                return;
            }
            var i = this._trackedGroups.indexOf(group);
            if (i !== -1) {
                this._trackedGroups.splice(i, 1);
            }
            group._clearFlags(BABYLON.SmartPropertyPrim.flagTrackedGroup);
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
        /**
         * Get a Gradient Color Brush
         * @param color1 starting color
         * @param color2 engine color
         * @param translation translation vector to apply. default is [0;0]
         * @param rotation rotation in radian to apply to the brush, initial direction is top to bottom. rotation is counter clockwise. default is 0.
         * @param scale scaling factor to apply. default is 1.
         */
        Canvas2D.GetGradientColorBrush = function (color1, color2, translation, rotation, scale) {
            if (translation === void 0) { translation = BABYLON.Vector2.Zero(); }
            if (rotation === void 0) { rotation = 0; }
            if (scale === void 0) { scale = 1; }
            return Canvas2D._gradientColorBrushes.getOrAddWithFactory(BABYLON.GradientColorBrush2D.BuildKey(color1, color2, translation, rotation, scale), function () { return new BABYLON.GradientColorBrush2D(color1, color2, translation, rotation, scale, true); });
        };
        /**
         * Create a solid or gradient brush from a string value.
         * @param brushString should be either
         *  - "solid: #RRGGBBAA" or "#RRGGBBAA"
         *  - "gradient: #FF808080, #FFFFFFF[, [10:20], 180, 1]" for color1, color2, translation, rotation (degree), scale. The last three are optionals, but if specified must be is this order. "gradient:" can be omitted.
         */
        Canvas2D.GetBrushFromString = function (brushString) {
            // Note: yes, I hate/don't know RegEx.. Feel free to add your contribution to the cause!
            brushString = brushString.trim();
            var split = brushString.split(",");
            // Solid, formatted as: "[solid:]#FF808080"
            if (split.length === 1) {
                var value = null;
                if (brushString.indexOf("solid:") === 0) {
                    value = brushString.substr(6).trim();
                }
                else if (brushString.indexOf("#") === 0) {
                    value = brushString;
                }
                else {
                    return null;
                }
                return Canvas2D.GetSolidColorBrushFromHex(value);
            }
            else {
                if (split[0].indexOf("gradient:") === 0) {
                    split[0] = split[0].substr(9).trim();
                }
                try {
                    var start = BABYLON.Color4.FromHexString(split[0].trim());
                    var end = BABYLON.Color4.FromHexString(split[1].trim());
                    var t = BABYLON.Vector2.Zero();
                    if (split.length > 2) {
                        var v = split[2].trim();
                        if (v.charAt(0) !== "[" || v.charAt(v.length - 1) !== "]") {
                            return null;
                        }
                        var sep = v.indexOf(":");
                        var x = parseFloat(v.substr(1, sep));
                        var y = parseFloat(v.substr(sep + 1, v.length - (sep + 1)));
                        t = new BABYLON.Vector2(x, y);
                    }
                    var r = 0;
                    if (split.length > 3) {
                        r = BABYLON.Tools.ToRadians(parseFloat(split[3].trim()));
                    }
                    var s = 1;
                    if (split.length > 4) {
                        s = parseFloat(split[4].trim());
                    }
                    return Canvas2D.GetGradientColorBrush(start, end, t, r, s);
                }
                catch (e) {
                    return null;
                }
            }
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
         * When using this strategy, group instances can rely on the DONTCACHEOVERRIDE or CACHEINPARENTGROUP behaviors to minimize the amount of cached bitmaps.
         * Note that in this mode the Canvas itself is not cached, it only contains the sprites of its direct children group to render, there's no point to cache the whole canvas, sprites will be rendered pretty efficiently, the memory cost would be too great for the value of it.
         */
        Canvas2D.CACHESTRATEGY_ALLGROUPS = 2;
        /**
         * In this strategy the whole canvas is cached into a single bitmap containing every primitives it owns, at the exception of the ones that are owned by a group having the DONTCACHEOVERRIDE behavior (these primitives will be directly drawn to the viewport at each render for screenSpace Canvas or be part of the Canvas cache bitmap for worldSpace Canvas).
         */
        Canvas2D.CACHESTRATEGY_CANVAS = 3;
        /**
         * This strategy is used to recompose/redraw the canvas entirely at each viewport render.
         * Use this strategy if memory is a concern above rendering performances and/or if the canvas is frequently animated (hence reducing the benefits of caching).
         * Note that you can't use this strategy for WorldSpace Canvas, they need at least a top level group caching.
         */
        Canvas2D.CACHESTRATEGY_DONTCACHE = 4;
        Canvas2D._zMinDelta = 1 / (Math.pow(2, 24) - 1);
        Canvas2D._interInfo = new BABYLON.IntersectInfo2D();
        Canvas2D._v = BABYLON.Vector3.Zero(); // Must stay zero
        Canvas2D._m = BABYLON.Matrix.Identity();
        Canvas2D._mI = BABYLON.Matrix.Identity(); // Must stay identity
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
    var WorldSpaceCanvas2D = (function (_super) {
        __extends(WorldSpaceCanvas2D, _super);
        /**
         * Create a new 2D WorldSpace Rendering Canvas, it is a 2D rectangle that has a size (width/height) and a world transformation information to place it in the world space.
         * This kind of canvas can't have its Primitives directly drawn in the Viewport, they need to be cached in a bitmap at some point, as a consequence the DONT_CACHE strategy is unavailable. For now only CACHESTRATEGY_CANVAS is supported, but the remaining strategies will be soon.
         * @param scene the Scene that owns the Canvas
         * @param size the dimension of the Canvas in World Space
         * @param settings a combination of settings, possible ones are
         *  - children: an array of direct children primitives
         *  - id: a text identifier, for information purpose only, default is null.
         *  - worldPosition the position of the Canvas in World Space, default is [0,0,0]
         *  - worldRotation the rotation of the Canvas in World Space, default is Quaternion.Identity()
         * - sideOrientation: Unexpected behavior occur if the value is different from Mesh.DEFAULTSIDE right now, so please use this one, which is the default.
         * - cachingStrategy Must be CACHESTRATEGY_CANVAS for now, which is the default.
         * - enableInteraction: if true the pointer events will be listened and rerouted to the appropriate primitives of the Canvas2D through the Prim2DBase.onPointerEventObservable observable property. Default is false (the opposite of ScreenSpace).
         * - isVisible: true if the canvas must be visible, false for hidden. Default is true.
         * - backgroundRoundRadius: the round radius of the background, either backgroundFill or backgroundBorder must be specified.
         * - backgroundFill: the brush to use to create a background fill for the canvas. can be a string value (see Canvas2D.GetBrushFromString) or a IBrush2D instance.
         * - backgroundBorder: the brush to use to create a background border for the canvas. can be a string value (see Canvas2D.GetBrushFromString) or a IBrush2D instance.
         * - backgroundBorderThickness: if a backgroundBorder is specified, its thickness can be set using this property
         * - customWorldSpaceNode: if specified the Canvas will be rendered in this given Node. But it's the responsibility of the caller to set the "worldSpaceToNodeLocal" property to compute the hit of the mouse ray into the node (in world coordinate system) as well as rendering the cached bitmap in the node itself. The properties cachedRect and cachedTexture of Group2D will give you what you need to do that.
         * - maxAdaptiveCanvasSize: set the max size (width and height) of the bitmap that will contain the cached version of the WorldSpace Canvas. Default is 1024 or less if it's not supported. In any case the value you give will be clipped by the maximum that WebGL supports on the running device. You can set any size, more than 1024 if you want, but testing proved it's a good max value for non "retina" like screens.
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function WorldSpaceCanvas2D(scene, size, settings) {
            BABYLON.Prim2DBase._isCanvasInit = true;
            var s = settings;
            s.isScreenSpace = false;
            s.size = size.clone();
            settings.cachingStrategy = (settings.cachingStrategy == null) ? Canvas2D.CACHESTRATEGY_CANVAS : settings.cachingStrategy;
            if (settings.cachingStrategy !== Canvas2D.CACHESTRATEGY_CANVAS) {
                throw new Error("Right now only the CACHESTRATEGY_CANVAS cache Strategy is supported for WorldSpace Canvas. More will come soon!");
            }
            _super.call(this, scene, settings);
            BABYLON.Prim2DBase._isCanvasInit = false;
            this._renderableData._useMipMap = true;
            this._renderableData._anisotropicLevel = 8;
            //if (cachingStrategy === Canvas2D.CACHESTRATEGY_DONTCACHE) {
            //    throw new Error("CACHESTRATEGY_DONTCACHE cache Strategy can't be used for WorldSpace Canvas");
            //}
            var createWorldSpaceNode = !settings || (settings.customWorldSpaceNode == null);
            var id = settings ? settings.id || null : null;
            // Set the max size of texture allowed for the adaptive render of the world space canvas cached bitmap
            var capMaxTextSize = this.engine.getCaps().maxRenderTextureSize;
            var defaultTextSize = (Math.min(capMaxTextSize, 1024)); // Default is 4K if allowed otherwise the max allowed
            if (settings.maxAdaptiveCanvasSize == null) {
                this._maxAdaptiveWorldSpaceCanvasSize = defaultTextSize;
            }
            else {
                // We still clip the given value with the max allowed, the user may not be aware of these limitations
                this._maxAdaptiveWorldSpaceCanvasSize = Math.min(settings.maxAdaptiveCanvasSize, capMaxTextSize);
            }
            if (createWorldSpaceNode) {
                var plane = new BABYLON.WorldSpaceCanvas2DNode(id, scene, this);
                var vertexData = BABYLON.VertexData.CreatePlane({
                    width: size.width,
                    height: size.height,
                    sideOrientation: settings && settings.sideOrientation || BABYLON.Mesh.DEFAULTSIDE
                });
                var mtl = new BABYLON.StandardMaterial(id + "_Material", scene);
                this.applyCachedTexture(vertexData, mtl);
                vertexData.applyToMesh(plane, true);
                mtl.specularColor = new BABYLON.Color3(0, 0, 0);
                mtl.disableLighting = true;
                mtl.useAlphaFromDiffuseTexture = true;
                plane.position = settings && settings.worldPosition || BABYLON.Vector3.Zero();
                plane.rotationQuaternion = settings && settings.worldRotation || BABYLON.Quaternion.Identity();
                plane.material = mtl;
                this._worldSpaceNode = plane;
            }
            else {
                this._worldSpaceNode = settings.customWorldSpaceNode;
                this.applyCachedTexture(null, null);
            }
        }
        WorldSpaceCanvas2D = __decorate([
            BABYLON.className("WorldSpaceCanvas2D")
        ], WorldSpaceCanvas2D);
        return WorldSpaceCanvas2D;
    }(Canvas2D));
    BABYLON.WorldSpaceCanvas2D = WorldSpaceCanvas2D;
    var ScreenSpaceCanvas2D = (function (_super) {
        __extends(ScreenSpaceCanvas2D, _super);
        /**
         * Create a new 2D ScreenSpace Rendering Canvas, it is a 2D rectangle that has a size (width/height) and a position relative to the bottom/left corner of the screen.
         * ScreenSpace Canvas will be drawn in the Viewport as a 2D Layer lying to the top of the 3D Scene. Typically used for traditional UI.
         * All caching strategies will be available.
         * PLEASE NOTE: the origin of a Screen Space Canvas is set to [0;0] (bottom/left) which is different than the default origin of a Primitive which is centered [0.5;0.5]
         * @param scene the Scene that owns the Canvas
         * @param settings a combination of settings, possible ones are
         *  - children: an array of direct children primitives
         *  - id: a text identifier, for information purpose only
         *  - x: the position along the x axis (horizontal), relative to the left edge of the viewport. you can alternatively use the position setting.
         *  - y: the position along the y axis (vertically), relative to the bottom edge of the viewport. you can alternatively use the position setting.
         *  - position: the position of the canvas, relative from the bottom/left of the scene's viewport. Alternatively you can set the x and y properties directly. Default value is [0, 0]
         *  - width: the width of the Canvas. you can alternatively use the size setting.
         *  - height: the height of the Canvas. you can alternatively use the size setting.
         *  - size: the Size of the canvas. Alternatively the width and height properties can be set. If null two behaviors depend on the cachingStrategy: if it's CACHESTRATEGY_CACHECANVAS then it will always auto-fit the rendering device, in all the other modes it will fit the content of the Canvas
         *  - cachingStrategy: either CACHESTRATEGY_TOPLEVELGROUPS, CACHESTRATEGY_ALLGROUPS, CACHESTRATEGY_CANVAS, CACHESTRATEGY_DONTCACHE. Please refer to their respective documentation for more information. Default is Canvas2D.CACHESTRATEGY_DONTCACHE
         *  - enableInteraction: if true the pointer events will be listened and rerouted to the appropriate primitives of the Canvas2D through the Prim2DBase.onPointerEventObservable observable property. Default is true.
         *  - isVisible: true if the canvas must be visible, false for hidden. Default is true.
         * - backgroundRoundRadius: the round radius of the background, either backgroundFill or backgroundBorder must be specified.
         * - backgroundFill: the brush to use to create a background fill for the canvas. can be a string value (see BABYLON.Canvas2D.GetBrushFromString) or a IBrush2D instance.
         * - backgroundBorder: the brush to use to create a background border for the canvas. can be a string value (see BABYLON.Canvas2D.GetBrushFromString) or a IBrush2D instance.
         * - backgroundBorderThickness: if a backgroundBorder is specified, its thickness can be set using this property
         * - customWorldSpaceNode: if specified the Canvas will be rendered in this given Node. But it's the responsibility of the caller to set the "worldSpaceToNodeLocal" property to compute the hit of the mouse ray into the node (in world coordinate system) as well as rendering the cached bitmap in the node itself. The properties cachedRect and cachedTexture of Group2D will give you what you need to do that.
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see BABYLON.PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see BABYLON.PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see BABYLON.PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see BABYLON.PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see BABYLON.PrimitiveThickness.fromString)
         */
        function ScreenSpaceCanvas2D(scene, settings) {
            BABYLON.Prim2DBase._isCanvasInit = true;
            _super.call(this, scene, settings);
        }
        ScreenSpaceCanvas2D = __decorate([
            BABYLON.className("ScreenSpaceCanvas2D")
        ], ScreenSpaceCanvas2D);
        return ScreenSpaceCanvas2D;
    }(Canvas2D));
    BABYLON.ScreenSpaceCanvas2D = ScreenSpaceCanvas2D;
})(BABYLON || (BABYLON = {}));
