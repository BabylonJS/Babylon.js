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
    })();
    BABYLON.Canvas2DEngineBoundData = Canvas2DEngineBoundData;
    var Canvas2D = (function (_super) {
        __extends(Canvas2D, _super);
        function Canvas2D(scene, settings) {
            var _this = this;
            _super.call(this, settings);
            /**
             * If you set your own WorldSpaceNode to display the Canvas2D you have to provide your own implementation of this method which computes the local position in the Canvas based on the given 3D World one.
             * Beware that you have to take under consideration the origin and the renderScaleFactor in your calculations! Good luck!
             */
            this.worldSpaceToNodeLocal = function (worldPos) {
                var node = _this._worldSpaceNode;
                if (!node) {
                    return;
                }
                var mtx = node.getWorldMatrix().clone();
                mtx.invert();
                var v = BABYLON.Vector3.TransformCoordinates(worldPos, mtx);
                var rsf = _this._renderScaleFactor;
                var res = new BABYLON.Vector2(v.x * rsf, v.y * rsf);
                var size = _this.actualSize;
                var o = _this.origin;
                res.x += size.width * 0.5; // res is centered, make it relative to bottom/left
                res.y += size.width * 0.5;
                return res;
            };
            this._notifDebugMode = false;
            this._mapCounter = 0;
            BABYLON.Prim2DBase._isCanvasInit = false;
            if (!settings) {
                settings = {};
            }
            var renderScaleFactor = (settings.renderScaleFactor == null) ? 1 : settings.renderScaleFactor;
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
                    this.backgroundBorder = settings.backgroundBorder; // TOFIX
                }
                if (settings.backgroundBorderThickNess != null) {
                    this.backgroundBorderThickness = settings.backgroundBorderThickNess;
                }
                if (settings.backgroundFill != null) {
                    this.backgroundFill = settings.backgroundFill;
                }
                this._background._patchHierarchy(this);
            }
            var engine = scene.getEngine();
            this.__engineData = engine.getOrAddExternalDataWithFactory("__BJSCANVAS2D__", function (k) { return new Canvas2DEngineBoundData(); });
            this._renderScaleFactor = renderScaleFactor;
            this._primPointerInfo = new BABYLON.PrimitivePointerInfo();
            this._capturedPointers = new BABYLON.StringDictionary();
            this._pickStartingPosition = BABYLON.Vector2.Zero();
            this._hierarchyLevelMaxSiblingCount = 10;
            this._hierarchyDepthOffset = 0;
            this._siblingDepthOffset = 1 / this._hierarchyLevelMaxSiblingCount;
            this._scene = scene;
            this._engine = engine;
            this._renderingSize = new BABYLON.Size(0, 0);
            this._trackedGroups = new Array();
            this._patchHierarchy(this);
            var enableInteraction = (settings.enableInteraction == null) ? true : settings.enableInteraction;
            this._fitRenderingDevice = !settings.size;
            if (!settings.size) {
                settings.size = new BABYLON.Size(engine.getRenderWidth(), engine.getRenderHeight());
            }
            else {
                settings.size.height *= renderScaleFactor;
                settings.size.width *= renderScaleFactor;
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
            //            this._supprtInstancedArray = false; // TODO REMOVE!!!
            this._setupInteraction(enableInteraction);
        }
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
            var camera = this._scene.activeCamera;
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
        Object.defineProperty(Canvas2D.prototype, "worldSpaceCanvasNode", {
            /**
             * Only valid for World Space Canvas, returns the scene node that displays the canvas
             */
            get: function () {
                return this._worldSpaceNode;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "supportInstancedArray", {
            /**
             * Check if the WebGL Instanced Array extension is supported or not
             * @returns {}
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
            get: function () {
                return this.__engineData;
            },
            enumerable: true,
            configurable: true
        });
        Canvas2D.prototype.checkBackgroundAvailability = function () {
            if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                throw Error("Can't use Canvas Background with the caching strategy TOPLEVELGROUPS");
            }
        };
        Canvas2D.prototype.onPrimBecomesDirty = function () {
            this._addPrimToDirtyList(this);
        };
        Canvas2D.prototype._updateTrackedNodes = function () {
            var cam = this.scene.activeCamera;
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
        Canvas2D.prototype._updateCanvasState = function () {
            // Check if the update has already been made for this render Frame
            if (this.scene.getRenderId() === this._updateRenderId) {
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
            this._updateTrackedNodes();
            this._updateCanvasState();
            if (this._primPointerInfo.canvasPointerPos) {
                this._updateIntersectionList(this._primPointerInfo.canvasPointerPos, false);
                this._updateOverStatus(); // TODO this._primPointerInfo may not be up to date!
            }
            this.engine.setState(false);
            this._groupRender();
            // If the canvas is cached at canvas level, we must manually render the sprite that will display its content
            if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_CANVAS && this._cachedCanvasGroup) {
                this._cachedCanvasGroup._renderCachedCanvas();
            }
        };
        /**
         * Internal method that allocate a cache for the given group.
         * Caching is made using a collection of MapTexture where many groups have their bitmap cache stored inside.
         * @param group The group to allocate the cache of.
         * @return custom type with the PackedRect instance giving information about the cache location into the texture and also the MapTexture instance that stores the cache.
         */
        Canvas2D.prototype._allocateGroupCache = function (group, parent, minSize) {
            // Determine size
            var size = group.actualSize;
            size = new BABYLON.Size(Math.ceil(size.width), Math.ceil(size.height));
            if (minSize) {
                size.width = Math.max(minSize.width, size.width);
                size.height = Math.max(minSize.height, size.height);
            }
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
        Canvas2D.prototype._registerTrackedNode = function (group) {
            if (group._isFlagSet(BABYLON.SmartPropertyPrim.flagTrackedGroup)) {
                return;
            }
            this._trackedGroups.push(group);
            group._setFlags(BABYLON.SmartPropertyPrim.flagTrackedGroup);
        };
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
        Canvas2D.GetGradientColorBrush = function (color1, color2, translation, rotation, scale) {
            if (translation === void 0) { translation = BABYLON.Vector2.Zero(); }
            if (rotation === void 0) { rotation = 0; }
            if (scale === void 0) { scale = 1; }
            return Canvas2D._gradientColorBrushes.getOrAddWithFactory(BABYLON.GradientColorBrush2D.BuildKey(color1, color2, translation, rotation, scale), function () { return new BABYLON.GradientColorBrush2D(color1, color2, translation, rotation, scale, true); });
        };
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
        Canvas2D.hierarchyLevelMaxSiblingCount = 10;
        Canvas2D._interInfo = new BABYLON.IntersectInfo2D();
        Canvas2D._v = BABYLON.Vector3.Zero();
        Canvas2D._m = BABYLON.Matrix.Identity();
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
    })(BABYLON.Group2D);
    BABYLON.Canvas2D = Canvas2D;
    var WorldSpaceCanvas2D = (function (_super) {
        __extends(WorldSpaceCanvas2D, _super);
        /**
         * Create a new 2D WorldSpace Rendering Canvas, it is a 2D rectangle that has a size (width/height) and a world transformation information to place it in the world space.
         * This kind of canvas can't have its Primitives directly drawn in the Viewport, they need to be cached in a bitmap at some point, as a consequence the DONT_CACHE strategy is unavailable. For now only CACHESTRATEGY_CANVAS is supported, but the remaining strategies will be soon.
         * @param scene the Scene that owns the Canvas
         * @param size the dimension of the Canvas in World Space
         * Options:
         *  - id: a text identifier, for information purpose only, default is null.
         *  - position the position of the Canvas in World Space, default is [0,0,0]
         *  - rotation the rotation of the Canvas in World Space, default is Quaternion.Identity()
         *  - renderScaleFactor A scale factor applied to create the rendering texture that will be mapped in the Scene Rectangle. If you set 2 for instance the texture will be twice large in width and height. A greater value will allow to achieve a better rendering quality. Default value is 1.
         * BE AWARE that the Canvas true dimension will be size*renderScaleFactor, then all coordinates and size will have to be express regarding this size.
         * TIPS: if you want a renderScaleFactor independent reference of frame, create a child Group2D in the Canvas with position 0,0 and size set to null, then set its scale property to the same amount than the renderScaleFactor, put all your primitive inside using coordinates regarding the size property you pick for the Canvas and you'll be fine.
         * - sideOrientation: Unexpected behavior occur if the value is different from Mesh.DEFAULTSIDE right now, so please use this one, which is the default.
         * - cachingStrategy Must be CACHESTRATEGY_CANVAS for now, which is the default.
         *  - enableInteraction: if true the pointer events will be listened and rerouted to the appropriate primitives of the Canvas2D through the Prim2DBase.onPointerEventObservable observable property. Default is false (the opposite of ScreenSpace).
         * - isVisible: true if the canvas must be visible, false for hidden. Default is true.
         * - customWorldSpaceNode: if specified the Canvas will be rendered in this given Node. But it's the responsibility of the caller to set the "worldSpaceToNodeLocal" property to compute the hit of the mouse ray into the node (in world coordinate system) as well as rendering the cached bitmap in the node itself. The properties cachedRect and cachedTexture of Group2D will give you what you need to do that.
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
            //if (cachingStrategy === Canvas2D.CACHESTRATEGY_DONTCACHE) {
            //    throw new Error("CACHESTRATEGY_DONTCACHE cache Strategy can't be used for WorldSpace Canvas");
            //}
            //let enableInteraction = settings ? settings.enableInteraction : true;
            var createWorldSpaceNode = !settings || (settings.customWorldSpaceNode == null);
            //let isVisible = settings ? settings.isVisible || true : true;
            var id = settings ? settings.id || null : null;
            //let rsf = settings ? settings.renderScaleFactor || 1 : 1;
            //let c = new Canvas2D();
            //c.setupCanvas(scene, id, new Size(size.width, size.height), rsf, false, cs, enableInteraction, new Vector2(0.5, 0.5), isVisible, null, null, null, null, null, null);
            if (createWorldSpaceNode) {
                var plane = new BABYLON.WorldSpaceCanvas2DNode(id, scene, this);
                var vertexData = BABYLON.VertexData.CreatePlane({
                    width: size.width,
                    height: size.height,
                    sideOrientation: settings && settings.sideOrientation || BABYLON.Mesh.DEFAULTSIDE
                });
                var mtl = new BABYLON.StandardMaterial(id + "_Material", scene);
                this.applyCachedTexture(vertexData, mtl);
                vertexData.applyToMesh(plane, false);
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
            }
            //            return c;
        }
        WorldSpaceCanvas2D = __decorate([
            BABYLON.className("WorldSpaceCanvas2D")
        ], WorldSpaceCanvas2D);
        return WorldSpaceCanvas2D;
    })(Canvas2D);
    BABYLON.WorldSpaceCanvas2D = WorldSpaceCanvas2D;
    var ScreenSpaceCanvas2D = (function (_super) {
        __extends(ScreenSpaceCanvas2D, _super);
        /**
         * Create a new 2D ScreenSpace Rendering Canvas, it is a 2D rectangle that has a size (width/height) and a position relative to the bottom/left corner of the screen.
         * ScreenSpace Canvas will be drawn in the Viewport as a 2D Layer lying to the top of the 3D Scene. Typically used for traditional UI.
         * All caching strategies will be available.
         * PLEASE NOTE: the origin of a Screen Space Canvas is set to [0;0] (bottom/left) which is different than the default origin of a Primitive which is centered [0.5;0.5]
         * @param scene the Scene that owns the Canvas
         * Options:
         *  - id: a text identifier, for information purpose only
         *  - pos: the position of the canvas, relative from the bottom/left of the scene's viewport. Alternatively you can set the x and y properties directly. Default value is [0, 0]
         *  - size: the Size of the canvas. Alternatively the width and height properties can be set. If null two behaviors depend on the cachingStrategy: if it's CACHESTRATEGY_CACHECANVAS then it will always auto-fit the rendering device, in all the other modes it will fit the content of the Canvas
         *  - cachingStrategy: either CACHESTRATEGY_TOPLEVELGROUPS, CACHESTRATEGY_ALLGROUPS, CACHESTRATEGY_CANVAS, CACHESTRATEGY_DONTCACHE. Please refer to their respective documentation for more information. Default is Canvas2D.CACHESTRATEGY_DONTCACHE
         *  - enableInteraction: if true the pointer events will be listened and rerouted to the appropriate primitives of the Canvas2D through the Prim2DBase.onPointerEventObservable observable property. Default is true.
         *  - isVisible: true if the canvas must be visible, false for hidden. Default is true.
         *  - marginTop/Left/Right/Bottom: define the margin for the corresponding edge, if all of them are null, margin is not used in layout computing. Default Value is null for each.
         *  - hAlighment: define horizontal alignment of the Canvas, alignment is optional, default value null: no alignment.
         *  - vAlighment: define horizontal alignment of the Canvas, alignment is optional, default value null: no alignment.
         */
        function ScreenSpaceCanvas2D(scene, settings) {
            BABYLON.Prim2DBase._isCanvasInit = true;
            _super.call(this, scene, settings);
            //let c = new Canvas2D();
            //if (!settings) {
            //    c.setupCanvas(scene, null, null, 1, true, Canvas2D.CACHESTRATEGY_DONTCACHE, true, Vector2.Zero(), true, null, null, null, null, null, null);
            //    c.position = Vector2.Zero();
            //} else {
            //    let pos = settings.position || new Vector2(settings.x || 0, settings.y || 0);
            //    let size = (!settings.size && !settings.width && !settings.height) ? null : (settings.size || (new Size(settings.width || 0, settings.height || 0)));
            //    c.setupCanvas(scene, settings.id || null, size, 1, true, settings.cachingStrategy || Canvas2D.CACHESTRATEGY_DONTCACHE, settings.enableInteraction || true, settings.origin || Vector2.Zero(), settings.isVisible || true, settings.marginTop, settings.marginLeft, settings.marginRight, settings.marginBottom, settings.hAlignment || PrimitiveAlignment.AlignLeft, settings.vAlignment || PrimitiveAlignment.AlignTop);
            //    c.position = pos;
            //}
            //return c;
        }
        ScreenSpaceCanvas2D = __decorate([
            BABYLON.className("ScreenSpaceCanvas2D")
        ], ScreenSpaceCanvas2D);
        return ScreenSpaceCanvas2D;
    })(Canvas2D);
    BABYLON.ScreenSpaceCanvas2D = ScreenSpaceCanvas2D;
})(BABYLON || (BABYLON = {}));
