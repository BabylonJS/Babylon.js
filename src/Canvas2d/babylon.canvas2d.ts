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
         * When using this strategy, group instances can rely on the DONTCACHEOVERRIDE or CACHEINPARENTGROUP behaviors to minimize the amount of cached bitmaps.
         * Note that in this mode the Canvas itself is not cached, it only contains the sprites of its direct children group to render, there's no point to cache the whole canvas, sprites will be rendered pretty efficiently, the memory cost would be too great for the value of it.
         */
        public static CACHESTRATEGY_ALLGROUPS = 2;

        /**
         * In this strategy the whole canvas is cached into a single bitmap containing every primitives it owns, at the exception of the ones that are owned by a group having the DONTCACHEOVERRIDE behavior (these primitives will be directly drawn to the viewport at each render for screenSpace Canvas or be part of the Canvas cache bitmap for worldSpace Canvas).
         */
        public static CACHESTRATEGY_CANVAS = 3;

        /**
         * This strategy is used to recompose/redraw the canvas entirely at each viewport render.
         * Use this strategy if memory is a concern above rendering performances and/or if the canvas is frequently animated (hence reducing the benefits of caching).
         * Note that you can't use this strategy for WorldSpace Canvas, they need at least a top level group caching.
         */
        public static CACHESTRATEGY_DONTCACHE = 4;

        constructor(scene: Scene, settings?: {
            id                        ?: string,
            children                  ?: Array<Prim2DBase>,
            size                      ?: Size,
            renderScaleFactor         ?: number,
            isScreenSpace             ?: boolean,
            cachingStrategy           ?: number,
            enableInteraction         ?: boolean,
            origin                    ?: Vector2,
            isVisible                 ?: boolean,
            backgroundRoundRadius     ?: number,
            backgroundFill            ?: IBrush2D | string,
            backgroundBorder          ?: IBrush2D | string,
            backgroundBorderThickNess ?: number,
        }) {
            super(settings);

            Prim2DBase._isCanvasInit = false;

            if (!settings) {
                settings = {};
            }

            let renderScaleFactor = (settings.renderScaleFactor == null) ? 1 : settings.renderScaleFactor;
            if (this._cachingStrategy !== Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                this._background              = new Rectangle2D({ parent: this, id: "###CANVAS BACKGROUND###", size: settings.size }); //TODO CHECK when size is null
                this._background.zOrder       = 1.0;
                this._background.isPickable   = false;
                this._background.origin       = Vector2.Zero();
                this._background.levelVisible = false;

                if (settings.backgroundRoundRadius != null) {
                    this.backgroundRoundRadius = settings.backgroundRoundRadius;
                }

                if (settings.backgroundBorder != null) {
                    if (typeof (settings.backgroundBorder) === "string") {
                        this.backgroundBorder = Canvas2D.GetBrushFromString(<string>settings.backgroundBorder);
                    } else {
                        this.backgroundBorder = <IBrush2D>settings.backgroundBorder;
                    }
                }

                if (settings.backgroundBorderThickNess != null) {
                    this.backgroundBorderThickness = settings.backgroundBorderThickNess;
                }

                if (settings.backgroundFill != null) {
                    if (typeof (settings.backgroundFill) === "string") {
                        this.backgroundFill = Canvas2D.GetBrushFromString(<string>settings.backgroundFill);
                    } else {
                        this.backgroundFill = <IBrush2D>settings.backgroundFill;
                    }
                }

                this._background._patchHierarchy(this);
            }

            let engine = scene.getEngine();

            this.__engineData                   = engine.getOrAddExternalDataWithFactory("__BJSCANVAS2D__", k => new Canvas2DEngineBoundData());
            this._renderScaleFactor             = renderScaleFactor;
            this._primPointerInfo               = new PrimitivePointerInfo();
            this._capturedPointers              = new StringDictionary<Prim2DBase>();
            this._pickStartingPosition          = Vector2.Zero();
            this._hierarchyLevelMaxSiblingCount = 50;
            this._hierarchyDepthOffset          = 0;
            this._siblingDepthOffset            = 1 / this._hierarchyLevelMaxSiblingCount;
            this._scene                         = scene;
            this._engine                        = engine;
            this._renderingSize                 = new Size(0, 0);
            this._trackedGroups                 = new Array<Group2D>();

            this._patchHierarchy(this);

            let enableInteraction = (settings.enableInteraction == null) ? true : settings.enableInteraction;

            this._fitRenderingDevice = !settings.size;
            if (!settings.size) {
                settings.size = new Size(engine.getRenderWidth(), engine.getRenderHeight());
            } else {
                settings.size.height *= renderScaleFactor;
                settings.size.width *= renderScaleFactor;
            }

            // Register scene dispose to also dispose the canvas when it'll happens
            scene.onDisposeObservable.add((d, s) => {
                this.dispose();
            });

            if (this._isScreenSpace) {
                this._afterRenderObserver = this._scene.onAfterRenderObservable.add((d, s) => {
                    this._engine.clear(null, false, true);
                    this._render();
                });
            } else {
                this._beforeRenderObserver = this._scene.onBeforeRenderObservable.add((d, s) => {
                    this._render();
                });
            }

            this._supprtInstancedArray = this._engine.getCaps().instancedArrays !== null;
//            this._supprtInstancedArray = false; // TODO REMOVE!!!

            this._setupInteraction(enableInteraction);
        }

        protected _canvasPreInit(settings: any) {
            let cachingStrategy   = (settings.cachingStrategy == null) ? Canvas2D.CACHESTRATEGY_DONTCACHE : settings.cachingStrategy;
            this._cachingStrategy = cachingStrategy;
            this._isScreenSpace = (settings.isScreenSpace == null) ? true : settings.isScreenSpace;
        }

        public static hierarchyLevelMaxSiblingCount: number = 10;

        private _setupInteraction(enable: boolean) {
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
                this._scenePrePointerObserver = this.scene.onPrePointerObservable.add((e, s) => {
                    let hs = 1/this.engine.getHardwareScalingLevel();
                    let localPos = e.localPosition.multiplyByFloats(hs, hs);
                    this._handlePointerEventForInteraction(e, localPos, s);
                });
            }

            // World Space Mode
            else {
                let scene = this.scene;
                if (enable) {
                    scene.constantlyUpdateMeshUnderPointer = true;
                    this._scenePointerObserver = scene.onPointerObservable.add((e, s) => {

                        if (e.pickInfo.hit && e.pickInfo.pickedMesh === this._worldSpaceNode && this.worldSpaceToNodeLocal) {
                            let localPos = this.worldSpaceToNodeLocal(e.pickInfo.pickedPoint);
                            this._handlePointerEventForInteraction(e, localPos, s);
                        }
                    });
                }

                // Disable
                else {
                    if (this._scenePointerObserver) {
                        this.scene.onPointerObservable.remove(this._scenePointerObserver);
                        this._scenePointerObserver = null;
                    }
                }
            }
        }

        /**
         * If you set your own WorldSpaceNode to display the Canvas2D you have to provide your own implementation of this method which computes the local position in the Canvas based on the given 3D World one.
         * Beware that you have to take under consideration the origin and the renderScaleFactor in your calculations! Good luck!
         */
        public worldSpaceToNodeLocal = (worldPos: Vector3): Vector2 => {
            let node = this._worldSpaceNode;
            if (!node) {
                return;
            }

            let mtx = node.getWorldMatrix().clone();
            mtx.invert();
            let v = Vector3.TransformCoordinates(worldPos, mtx);
            let rsf = this._renderScaleFactor;
            let res = new Vector2(v.x*rsf, v.y*rsf);
            let size = this.actualSize;
            let o = this.origin;
            res.x += size.width * 0.5;  // res is centered, make it relative to bottom/left
            res.y += size.width * 0.5;
            return res;
        }

        /**
         * Internal method, you should use the Prim2DBase version instead
         */
        public _setPointerCapture(pointerId: number, primitive: Prim2DBase): boolean {
            if (this.isPointerCaptured(pointerId)) {
                return false;
            }

            // Try to capture the pointer on the HTML side
            try {
                this.engine.getRenderingCanvas().setPointerCapture(pointerId);
            } catch (e) {
                //Nothing to do with the error. Execution will continue.
            }

            this._primPointerInfo.updateRelatedTarget(primitive, Vector2.Zero());
            this._bubbleNotifyPrimPointerObserver(primitive, PrimitivePointerInfo.PointerGotCapture, null);

            this._capturedPointers.add(pointerId.toString(), primitive);
            return true;
        }

        /**
         * Internal method, you should use the Prim2DBase version instead
         */
        public _releasePointerCapture(pointerId: number, primitive: Prim2DBase): boolean {
            if (this._capturedPointers.get(pointerId.toString()) !== primitive) {
                return false;
            }

            // Try to release the pointer on the HTML side
            try {
                this.engine.getRenderingCanvas().releasePointerCapture(pointerId);
            } catch (e) {
                //Nothing to do with the error. Execution will continue.
            }

            this._primPointerInfo.updateRelatedTarget(primitive, Vector2.Zero());
            this._bubbleNotifyPrimPointerObserver(primitive, PrimitivePointerInfo.PointerLostCapture, null);
            this._capturedPointers.remove(pointerId.toString());
            return true;
        }

        /**
         * Determine if the given pointer is captured or not
         * @param pointerId the Id of the pointer
         * @return true if it's captured, false otherwise
         */
        public isPointerCaptured(pointerId: number): boolean {
            return this._capturedPointers.contains(pointerId.toString());
        }

        private getCapturedPrimitive(pointerId: number): Prim2DBase {
            // Avoid unnecessary lookup
            if (this._capturedPointers.count === 0) {
                return null;
            }
            return this._capturedPointers.get(pointerId.toString());
        }
           
        private static _interInfo = new IntersectInfo2D();
        private _handlePointerEventForInteraction(eventData: PointerInfoBase, localPosition: Vector2, eventState: EventState) {
            // Dispose check
            if (this.isDisposed) {
                return;
            }

            // Update the this._primPointerInfo structure we'll send to observers using the PointerEvent data
            this._updatePointerInfo(eventData, localPosition);

            let capturedPrim = this.getCapturedPrimitive(this._primPointerInfo.pointerId);

            // Make sure the intersection list is up to date, we maintain this list either in response of a mouse event (here) or before rendering the canvas.
            // Why before rendering the canvas? because some primitives may move and get away/under the mouse cursor (which is not moving). So we need to update at both location in order to always have an accurate list, which is needed for the hover state change.
            this._updateIntersectionList(this._primPointerInfo.canvasPointerPos, capturedPrim!==null);

            // Update the over status, same as above, it's could be done here or during rendering, but will be performed only once per render frame
            this._updateOverStatus();

            // Check if we have nothing to raise
            if (!this._actualOverPrimitive && !capturedPrim) {
                return;
            }

            // Update the relatedTarget info with the over primitive or the captured one (if any)
            let targetPrim = capturedPrim || this._actualOverPrimitive.prim;

            let targetPointerPos = capturedPrim ? this._primPointerInfo.canvasPointerPos.subtract(new Vector2(targetPrim.globalTransform.m[12], targetPrim.globalTransform.m[13])) : this._actualOverPrimitive.intersectionLocation;

            this._primPointerInfo.updateRelatedTarget(targetPrim, targetPointerPos);

            // Analyze the pointer event type and fire proper events on the primitive

            if (eventData.type === PointerEventTypes.POINTERWHEEL) {
                this._bubbleNotifyPrimPointerObserver(targetPrim, PrimitivePointerInfo.PointerMouseWheel, <MouseWheelEvent>eventData.event);
            } else if (eventData.type === PointerEventTypes.POINTERMOVE) {
                this._bubbleNotifyPrimPointerObserver(targetPrim, PrimitivePointerInfo.PointerMove, <PointerEvent>eventData.event);
            } else if (eventData.type === PointerEventTypes.POINTERDOWN) {
                this._bubbleNotifyPrimPointerObserver(targetPrim, PrimitivePointerInfo.PointerDown, <PointerEvent>eventData.event);
            } else if (eventData.type === PointerEventTypes.POINTERUP) {
                this._bubbleNotifyPrimPointerObserver(targetPrim, PrimitivePointerInfo.PointerUp, <PointerEvent>eventData.event);
            }
        }

        private _updatePointerInfo(eventData: PointerInfoBase, localPosition: Vector2) {
            let pii = this._primPointerInfo;
            if (!pii.canvasPointerPos) {
                pii.canvasPointerPos = Vector2.Zero();
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
                pii.canvasPointerPos.y = engine.getRenderHeight() -y - this.actualPosition.y;
            } else {
                pii.canvasPointerPos.x = localPosition.x;
                pii.canvasPointerPos.y = localPosition.y;
            }
            pii.mouseWheelDelta = 0;

            if (eventData.type === PointerEventTypes.POINTERWHEEL) {
                var event = <MouseWheelEvent>eventData.event;
                if (event.wheelDelta) {
                    pii.mouseWheelDelta = event.wheelDelta / (PrimitivePointerInfo.MouseWheelPrecision * 40);
                } else if (event.detail) {
                    pii.mouseWheelDelta = -event.detail / PrimitivePointerInfo.MouseWheelPrecision;
                }
            } else {
                var pe         = <PointerEvent>eventData.event;
                pii.ctrlKey    = pe.ctrlKey;
                pii.altKey     = pe.altKey;
                pii.shiftKey   = pe.shiftKey;
                pii.metaKey    = pe.metaKey;
                pii.button     = pe.button;
                pii.buttons    = pe.buttons;
                pii.pointerId  = pe.pointerId;
                pii.width      = pe.width;
                pii.height     = pe.height;
                pii.presssure  = pe.pressure;
                pii.tilt.x     = pe.tiltX;
                pii.tilt.y     = pe.tiltY;
                pii.isCaptured = this.getCapturedPrimitive(pe.pointerId)!==null;
            }
        }

        private _updateIntersectionList(mouseLocalPos: Vector2, isCapture: boolean) {
            if (this.scene.getRenderId() === this._intersectionRenderId) {
                return;
            }

            // A little safe guard, it might happens than the event is triggered before the first render and nothing is computed, this simple check will make sure everything will be fine
            if (!this._globalTransform) {
                this.updateCachedStates(true);
            }

            let ii = Canvas2D._interInfo;
            ii.pickPosition.x = mouseLocalPos.x;
            ii.pickPosition.y = mouseLocalPos.y;
            ii.findFirstOnly = false;

            // Fast rejection: test if the mouse pointer is outside the canvas's bounding Info
            if (!isCapture && !this.boundingInfo.doesIntersect(ii.pickPosition)) {
                this._previousIntersectionList = this._actualIntersectionList;
                this._actualIntersectionList   = null;
                this._previousOverPrimitive    = this._actualOverPrimitive;
                this._actualOverPrimitive      = null;
                return;
            }

            this.intersect(ii);

            this._previousIntersectionList = this._actualIntersectionList;
            this._actualIntersectionList   = ii.intersectedPrimitives;
            this._previousOverPrimitive    = this._actualOverPrimitive;
            this._actualOverPrimitive      = ii.topMostIntersectedPrimitive;

            this._intersectionRenderId = this.scene.getRenderId();
        }

        // Based on the previousIntersectionList and the actualInstersectionList we can determined which primitives are being hover state or loosing it
        private _updateOverStatus() {
            if ((this.scene.getRenderId() === this._hoverStatusRenderId) || !this._previousIntersectionList || !this._actualIntersectionList) {
                return;
            }

            // Detect a change of over
            let prevPrim = this._previousOverPrimitive ? this._previousOverPrimitive.prim : null;
            let actualPrim = this._actualOverPrimitive ? this._actualOverPrimitive.prim   : null;

            if (prevPrim !== actualPrim) {
                // Detect if the current pointer is captured, only fire event if they belong to the capture primitive
                let capturedPrim = this.getCapturedPrimitive(this._primPointerInfo.pointerId);

                // Notify the previous "over" prim that the pointer is no longer over it
                if ((capturedPrim && capturedPrim===prevPrim) || (!capturedPrim && prevPrim)) {
                    this._primPointerInfo.updateRelatedTarget(prevPrim, this._previousOverPrimitive.intersectionLocation);
                    this._bubbleNotifyPrimPointerObserver(prevPrim, PrimitivePointerInfo.PointerOut, null);
                }

                // Notify the new "over" prim that the pointer is over it
                if ((capturedPrim && capturedPrim === actualPrim) || (!capturedPrim && actualPrim)) {
                    this._primPointerInfo.updateRelatedTarget(actualPrim, this._actualOverPrimitive.intersectionLocation);
                    this._bubbleNotifyPrimPointerObserver(actualPrim, PrimitivePointerInfo.PointerOver, null);
                }
            }

            this._hoverStatusRenderId = this.scene.getRenderId();
        }

        private _updatePrimPointerPos(prim: Prim2DBase) {
            if (this._primPointerInfo.isCaptured) {
                this._primPointerInfo.primitivePointerPos = this._primPointerInfo.relatedTargetPointerPos;
            } else {
                for (let pii of this._actualIntersectionList) {
                    if (pii.prim === prim) {
                        this._primPointerInfo.primitivePointerPos = pii.intersectionLocation;
                        return;
                    }
                }
            }
        }

        private _notifDebugMode = false;
        private _debugExecObserver(prim: Prim2DBase, mask: number) {
            if (!this._notifDebugMode) {
                return;
            }

            let debug = "";
            for (let i = 0; i < prim.hierarchyDepth; i++) {
                debug += "  ";
            }

            let pii = this._primPointerInfo;
            debug += `[RID:${this.scene.getRenderId()}] [${prim.hierarchyDepth}] event:${PrimitivePointerInfo.getEventTypeName(mask)}, id: ${prim.id} (${Tools.getClassName(prim)}), primPos: ${pii.primitivePointerPos.toString()}, canvasPos: ${pii.canvasPointerPos.toString()}`;
            console.log(debug);
        }

        private _bubbleNotifyPrimPointerObserver(prim: Prim2DBase, mask: number, eventData: any) {
            let ppi = this._primPointerInfo;

            // In case of PointerOver/Out we will first notify the parent with PointerEnter/Leave
            if ((mask & (PrimitivePointerInfo.PointerOver | PrimitivePointerInfo.PointerOut)) !== 0) {
                this._notifParents(prim, mask);
            }

            let bubbleCancelled = false;
            let cur = prim;
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
                        if ((mask & (PrimitivePointerInfo.PointerOver | PrimitivePointerInfo.PointerOut)) === 0) {
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
                if (mask === PrimitivePointerInfo.PointerOver) {
                    this._debugExecObserver(cur, PrimitivePointerInfo.PointerEnter);
                    cur._pointerEventObservable.notifyObservers(ppi, PrimitivePointerInfo.PointerEnter);
                }

                // Trigger a PointerLeave corresponding to the PointerOut
                else if (mask === PrimitivePointerInfo.PointerOut) {
                    this._debugExecObserver(cur, PrimitivePointerInfo.PointerLeave);
                    cur._pointerEventObservable.notifyObservers(ppi, PrimitivePointerInfo.PointerLeave);
                }

                // Loop to the parent
                cur = cur.parent;
            }
        }

        private _triggerActionManager(prim: Prim2DBase, ppi: PrimitivePointerInfo, mask: number, eventData) {

            // A little safe guard, it might happens than the event is triggered before the first render and nothing is computed, this simple check will make sure everything will be fine
            if (!this._globalTransform) {
                this.updateCachedStates(true);
            }

            // Process Trigger related to PointerDown
            if ((mask & PrimitivePointerInfo.PointerDown) !== 0) {
                // On pointer down, record the current position and time to be able to trick PickTrigger and LongPressTrigger
                this._pickStartingPosition = ppi.primitivePointerPos.clone();
                this._pickStartingTime = new Date().getTime();
                this._pickedDownPrim = null;

                if (prim.actionManager) {
                    this._pickedDownPrim = prim;
                    if (prim.actionManager.hasPickTriggers) {
                        let actionEvent = ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData);

                        switch (eventData.button) {
                        case 0:
                            prim.actionManager.processTrigger(ActionManager.OnLeftPickTrigger, actionEvent);
                            break;
                        case 1:
                            prim.actionManager.processTrigger(ActionManager.OnCenterPickTrigger, actionEvent);
                            break;
                        case 2:
                            prim.actionManager.processTrigger(ActionManager.OnRightPickTrigger, actionEvent);
                            break;
                        }
                        prim.actionManager.processTrigger(ActionManager.OnPickDownTrigger, actionEvent);
                    }

                    if (prim.actionManager.hasSpecificTrigger(ActionManager.OnLongPressTrigger)) {
                        window.setTimeout(() => {
                            let ppi = this._primPointerInfo;
                            let capturedPrim = this.getCapturedPrimitive(ppi.pointerId);
                            this._updateIntersectionList(ppi.canvasPointerPos, capturedPrim !== null);

                            let ii = new IntersectInfo2D();
                            ii.pickPosition = ppi.canvasPointerPos.clone();
                            ii.findFirstOnly = false;
                            this.intersect(ii);

                            if (ii.isPrimIntersected(prim) !== null) {
                                if (prim.actionManager) {
                                    if (this._pickStartingTime !== 0 && ((new Date().getTime() - this._pickStartingTime) > ActionManager.LongPressDelay) && (Math.abs(this._pickStartingPosition.x - ii.pickPosition.x) < ActionManager.DragMovementThreshold && Math.abs(this._pickStartingPosition.y - ii.pickPosition.y) < ActionManager.DragMovementThreshold)) {
                                        this._pickStartingTime = 0;
                                        prim.actionManager.processTrigger(ActionManager.OnLongPressTrigger, ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData));
                                    }
                                }
                            }
                        }, ActionManager.LongPressDelay);
                    }
                }
            }

            // Process Triggers related to Pointer Up
            else if ((mask & PrimitivePointerInfo.PointerUp) !== 0) {
                this._pickStartingTime = 0;

                let actionEvent = ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData);
                if (prim.actionManager) {
                    // OnPickUpTrigger
                    prim.actionManager.processTrigger(ActionManager.OnPickUpTrigger, actionEvent);

                    // OnPickTrigger
                    if (Math.abs(this._pickStartingPosition.x - ppi.canvasPointerPos.x) < ActionManager.DragMovementThreshold && Math.abs(this._pickStartingPosition.y - ppi.canvasPointerPos.y) < ActionManager.DragMovementThreshold) {
                        prim.actionManager.processTrigger(ActionManager.OnPickTrigger, actionEvent);
                    }
                }

                // OnPickOutTrigger
                if (this._pickedDownPrim && this._pickedDownPrim.actionManager && (this._pickedDownPrim !== prim)) {
                    this._pickedDownPrim.actionManager.processTrigger(ActionManager.OnPickOutTrigger, actionEvent);
                }
            }

            else if ((mask & PrimitivePointerInfo.PointerOver) !== 0) {
                if (prim.actionManager) {
                    let actionEvent = ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData);
                    prim.actionManager.processTrigger(ActionManager.OnPointerOverTrigger, actionEvent);
                }
            }

            else if ((mask & PrimitivePointerInfo.PointerOut) !== 0) {
                if (prim.actionManager) {
                    let actionEvent = ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData);
                    prim.actionManager.processTrigger(ActionManager.OnPointerOutTrigger, actionEvent);
                }
            }
        }

        _notifParents(prim: Prim2DBase, mask: number) {
            let pii = this._primPointerInfo;

            let curPrim: Prim2DBase = this;

            while (curPrim) {
                this._updatePrimPointerPos(curPrim);

                // Fire the proper notification
                if (mask === PrimitivePointerInfo.PointerOver) {
                    this._debugExecObserver(curPrim, PrimitivePointerInfo.PointerEnter);
                    curPrim._pointerEventObservable.notifyObservers(pii, PrimitivePointerInfo.PointerEnter);
                }

                // Trigger a PointerLeave corresponding to the PointerOut
                else if (mask === PrimitivePointerInfo.PointerOut) {
                    this._debugExecObserver(curPrim, PrimitivePointerInfo.PointerLeave);
                    curPrim._pointerEventObservable.notifyObservers(pii, PrimitivePointerInfo.PointerLeave);
                }
                curPrim = curPrim.parent;
            }
        }

        /**
         * Don't forget to call the dispose method when you're done with the Canvas instance.
         * But don't worry, if you dispose its scene, the canvas will be automatically disposed too.
         */
        public dispose(): boolean {
            if (!super.dispose()) {
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

        /**
         * Only valid for World Space Canvas, returns the scene node that displays the canvas
         */
        public get worldSpaceCanvasNode(): Node {
            return this._worldSpaceNode;
        }

        public set worldSpaceCanvasNode(val: Node) {
            this._worldSpaceNode = val;
        }

        /**
         * Check if the WebGL Instanced Array extension is supported or not
         * @returns {} 
         */
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
            this._background.levelVisible = true;
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
            this._background.levelVisible = true;
        }

        /**
         * Property that defines the thickness of the border object used to draw the background of the Canvas.
         * @returns If the background is not set, null will be returned, otherwise a valid number matching the thickness is returned.
         */
        public get backgroundBorderThickness(): number {
            if (!this._background || !this._background.isVisible) {
                return null;
            }
            return this._background.borderThickness;
        }

        public set backgroundBorderThickness(value: number) {
            this.checkBackgroundAvailability();

            if (value === this._background.borderThickness) {
                return;
            }

            this._background.borderThickness = value;
        }

        /**
         * You can set the roundRadius of the background
         * @returns The current roundRadius
         */
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
            this._background.levelVisible = true;
        }

        /**
         * Enable/Disable interaction for this Canvas
         * When enabled the Prim2DBase.pointerEventObservable property will notified when appropriate events occur
         */
        public get interactionEnabled(): boolean {
            return this._interactionEnabled;
        }

        public set interactionEnabled(enable: boolean) {
            this._setupInteraction(enable);
        }

        public get _engineData(): Canvas2DEngineBoundData {
            return this.__engineData;
        }

        private checkBackgroundAvailability() {
            if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                throw Error("Can't use Canvas Background with the caching strategy TOPLEVELGROUPS");
            }
        }


        private __engineData: Canvas2DEngineBoundData;
        private _interactionEnabled: boolean;
        private _primPointerInfo: PrimitivePointerInfo;
        private _updateRenderId: number;
        private _intersectionRenderId: number;
        private _hoverStatusRenderId: number;
        private _pickStartingPosition: Vector2;
        private _renderScaleFactor: number;
        private _pickedDownPrim: Prim2DBase;
        private _pickStartingTime: number;
        private _previousIntersectionList: Array<PrimitiveIntersectedInfo>;
        private _actualIntersectionList: Array<PrimitiveIntersectedInfo>;
        private _previousOverPrimitive: PrimitiveIntersectedInfo;
        private _actualOverPrimitive: PrimitiveIntersectedInfo;
        private _capturedPointers: StringDictionary<Prim2DBase>;
        private _scenePrePointerObserver: Observer<PointerInfoPre>;
        private _scenePointerObserver: Observer<PointerInfo>;
        protected _worldSpaceNode: Node;
        private _mapCounter = 0;
        private _background: Rectangle2D;
        private _scene: Scene;
        private _engine: Engine;
        private _fitRenderingDevice: boolean;
        private _isScreenSpace: boolean;
        private _cachedCanvasGroup: Group2D;
        private _cachingStrategy: number;
        private _hierarchyLevelMaxSiblingCount: number;
        private _groupCacheMaps: MapTexture[];
        private _beforeRenderObserver: Observer<Scene>;
        private _afterRenderObserver: Observer<Scene>;
        private _supprtInstancedArray: boolean;
        private _trackedGroups: Array<Group2D>;

        public _renderingSize: Size;

        protected onPrimBecomesDirty() {
            this._addPrimToDirtyList(this);
        }

        private static _v = Vector3.Zero();
        private static _m = Matrix.Identity();

        private _updateTrackedNodes() {
            let cam = this.scene.activeCamera;

            cam.getViewMatrix().multiplyToRef(cam.getProjectionMatrix(), Canvas2D._m);
            let rh = this.engine.getRenderHeight();
            let v = cam.viewport.toGlobal(this.engine.getRenderWidth(), rh);

            for (let group of this._trackedGroups) {
                if (group.isDisposed || !group.isVisible) {
                    continue;
                }

                let node = group.trackedNode;
                let worldMtx = node.getWorldMatrix();

                let proj = Vector3.Project(Canvas2D._v, worldMtx, Canvas2D._m, v);
                group.x = Math.round(proj.x);
                group.y = Math.round(rh - proj.y);
            }
        }

        private _updateCanvasState() {
            // Check if the update has already been made for this render Frame
            if (this.scene.getRenderId() === this._updateRenderId) {
                return;
            }

            // Detect a change of rendering size
            let renderingSizeChanged = false;
            let newWidth = this.engine.getRenderWidth();
            if (newWidth !== this._renderingSize.width) {
                renderingSizeChanged = true;
            }
            this._renderingSize.width = newWidth;

            let newHeight = this.engine.getRenderHeight();
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

            var context = new PrepareRender2DContext();

            ++this._globalTransformProcessStep;
            this.updateCachedStates(false);

            this._prepareGroupRender(context);

            this._updateRenderId = this.scene.getRenderId();
        }

        /**
         * Method that renders the Canvas, you should not invoke
         */
        private _render() {

            this._updateTrackedNodes();

            this._updateCanvasState();

            if (this._primPointerInfo.canvasPointerPos) {
                this._updateIntersectionList(this._primPointerInfo.canvasPointerPos, false);
                this._updateOverStatus();   // TODO this._primPointerInfo may not be up to date!
            }

            this.engine.setState(false);
            this._groupRender();

            // If the canvas is cached at canvas level, we must manually render the sprite that will display its content
            if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_CANVAS && this._cachedCanvasGroup) {
                this._cachedCanvasGroup._renderCachedCanvas();
            }
        }

        /**
         * Internal method that allocate a cache for the given group.
         * Caching is made using a collection of MapTexture where many groups have their bitmap cache stored inside.
         * @param group The group to allocate the cache of.
         * @return custom type with the PackedRect instance giving information about the cache location into the texture and also the MapTexture instance that stores the cache.
         */
        public _allocateGroupCache(group: Group2D, parent: Group2D, minSize?: Size): { node: PackedRect, texture: MapTexture, sprite: Sprite2D } {
            // Determine size
            let size = group.actualSize;
            size = new Size(Math.ceil(size.width), Math.ceil(size.height));
            if (minSize) {
                size.width  = Math.max(minSize.width, size.width);
                size.height = Math.max(minSize.height, size.height);
            }

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

            // Check if we have to create a Sprite that will display the content of the Canvas which is cached.
            // Don't do it in case of the group being a worldspace canvas (because its texture is bound to a WorldSpaceCanvas node)
            if (group !== <any>this || this._isScreenSpace) {
                let node: PackedRect = res.node;

                // Special case if the canvas is entirely cached: create a group that will have a single sprite it will be rendered specifically at the very end of the rendering process
                if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_CANVAS) {
                    this._cachedCanvasGroup = Group2D._createCachedCanvasGroup(this);
                    let sprite = new Sprite2D(map, { parent: this._cachedCanvasGroup, id: "__cachedCanvasSprite__", spriteSize:node.contentSize, spriteLocation:node.pos});
                    sprite.zOrder = 1;
                    sprite.origin = Vector2.Zero();
                }

                // Create a Sprite that will be used to render this cache, the "__cachedSpriteOfGroup__" starting id is a hack to bypass exception throwing in case of the Canvas doesn't normally allows direct primitives
                else {
                    let sprite = new Sprite2D(map, { parent: parent, id:`__cachedSpriteOfGroup__${group.id}`, x: group.actualPosition.x, y: group.actualPosition.y, spriteSize:node.contentSize, spriteLocation:node.pos});
                    sprite.origin = group.origin.clone();
                    res.sprite = sprite;
                }
            }
            return res;
        }

        /**
         * Define the default size used for both the width and height of a MapTexture to allocate.
         * Note that some MapTexture might be bigger than this size if the first node to allocate is bigger in width or height
         */
        private static _groupTextureCacheSize = 1024;


        public _registerTrackedNode(group: Group2D) {
            if (group._isFlagSet(SmartPropertyPrim.flagTrackedGroup)) {
                return;
            }
            this._trackedGroups.push(group);

            group._setFlags(SmartPropertyPrim.flagTrackedGroup);
        }

        public _unregisterTrackedNode(group: Group2D) {
            if (!group._isFlagSet(SmartPropertyPrim.flagTrackedGroup)) {
                return;
            }

            let i = this._trackedGroups.indexOf(group);
            if (i !== -1) {
                this._trackedGroups.splice(i, 1);
            }

            group._clearFlags(SmartPropertyPrim.flagTrackedGroup);
        }

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

        public static GetBrushFromString(brushString: string): IBrush2D {
            // Note: yes, I hate/don't know RegEx.. Feel free to add your contribution to the cause!

            brushString = brushString.trim();
            let split = brushString.split(",");

            // Solid, formatted as: "[solid:]#FF808080"
            if (split.length === 1) {
                let value: string = null;
                if (brushString.indexOf("solid:") === 0) {
                    value = brushString.substr(6).trim();
                } else if (brushString.indexOf("#") === 0) {
                    value = brushString;
                } else {
                    return null;
                }
                return Canvas2D.GetSolidColorBrushFromHex(value);
            }

            // Gradient, formatted as: "[gradient:]#FF808080, #FFFFFFF[, [10:20], 180, 1]" [10:20] is a real formatting expected not a EBNF notation
            // Order is: gradient start, gradient end, translation, rotation (degree), scale
            else {
                if (split[0].indexOf("gradient:") === 0) {
                    split[0] = split[0].substr(9).trim();
                }

                try {
                    let start = Color4.FromHexString(split[0].trim());
                    let end = Color4.FromHexString(split[1].trim());

                    let t: Vector2 = Vector2.Zero();
                    if (split.length > 2) {
                        let v = split[2].trim();
                        if (v.charAt(0) !== "[" || v.charAt(v.length - 1) !== "]") {
                            return null;
                        }
                        let sep = v.indexOf(":");
                        let x = parseFloat(v.substr(1, sep));
                        let y = parseFloat(v.substr(sep + 1, v.length - (sep + 1)));
                        t = new Vector2(x, y);
                    }

                    let r: number = 0;
                    if (split.length > 3) {
                        r = Tools.ToRadians(parseFloat(split[3].trim()));
                    }

                    let s: number = 1;
                    if (split.length > 4) {
                        s = parseFloat(split[4].trim());
                    }

                    return Canvas2D.GetGradientColorBrush(start, end, t, r, s);
                } catch (e) {
                    return null;
                } 
            }
        }

        private static _solidColorBrushes: StringDictionary<IBrush2D> = new StringDictionary<IBrush2D>();
        private static _gradientColorBrushes: StringDictionary<IBrush2D> = new StringDictionary<IBrush2D>();
    }
    @className("WorldSpaceCanvas2D")
    export class WorldSpaceCanvas2D extends Canvas2D {
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
        constructor(scene: Scene, size: Size, settings?: {

            children                 ?: Array<Prim2DBase>,
            id                       ?: string,
            worldPosition            ?: Vector3,
            worldRotation            ?: Quaternion,
            renderScaleFactor        ?: number,
            sideOrientation          ?: number,
            cachingStrategy          ?: number,
            enableInteraction        ?: boolean,
            isVisible                ?: boolean,
            backgroundRoundRadius    ?: number,
            backgroundFill           ?: IBrush2D | string,
            backgroundBorder         ?: IBrush2D | string,
            backgroundBorderThickNess?: number,
            customWorldSpaceNode     ?: Node,
            marginTop                ?: number | string,
            marginLeft               ?: number | string,
            marginRight              ?: number | string,
            marginBottom             ?: number | string,
            margin                   ?: number | string,
            marginHAlignment         ?: number,
            marginVAlignment         ?: number,
            marginAlignment          ?: string,

        }) {
            Prim2DBase._isCanvasInit = true;
            let s = <any>settings;
            s.isScreenSpace = false;
            s.size = size.clone();
            settings.cachingStrategy = (settings.cachingStrategy==null) ? Canvas2D.CACHESTRATEGY_CANVAS : settings.cachingStrategy;

            if (settings.cachingStrategy !== Canvas2D.CACHESTRATEGY_CANVAS) {
                throw new Error("Right now only the CACHESTRATEGY_CANVAS cache Strategy is supported for WorldSpace Canvas. More will come soon!");
            }

            super(scene, settings);
            Prim2DBase._isCanvasInit = false;


            //if (cachingStrategy === Canvas2D.CACHESTRATEGY_DONTCACHE) {
            //    throw new Error("CACHESTRATEGY_DONTCACHE cache Strategy can't be used for WorldSpace Canvas");
            //}

            let createWorldSpaceNode = !settings || (settings.customWorldSpaceNode == null);
            let id = settings ? settings.id || null : null;

            if (createWorldSpaceNode) {
                let plane = new WorldSpaceCanvas2DNode(id, scene, this);
                let vertexData = VertexData.CreatePlane({
                    width: size.width,
                    height: size.height,
                    sideOrientation: settings && settings.sideOrientation || Mesh.DEFAULTSIDE
                });
                let mtl = new StandardMaterial(id + "_Material", scene);

                this.applyCachedTexture(vertexData, mtl);
                vertexData.applyToMesh(plane, false);

                mtl.specularColor = new Color3(0, 0, 0);
                mtl.disableLighting = true;
                mtl.useAlphaFromDiffuseTexture = true;
                plane.position = settings && settings.worldPosition || Vector3.Zero();
                plane.rotationQuaternion = settings && settings.worldRotation || Quaternion.Identity();
                plane.material = mtl;
                this._worldSpaceNode = plane;
            } else {
                this._worldSpaceNode = settings.customWorldSpaceNode;
                this.applyCachedTexture(null, null);
            }
        }
    }

    @className("ScreenSpaceCanvas2D")
    export class ScreenSpaceCanvas2D extends Canvas2D {
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
        constructor(scene: Scene, settings?: {

            children                  ?: Array<Prim2DBase>,
            id                        ?: string,
            x                         ?: number,
            y                         ?: number,
            position                  ?: Vector2,
            origin                    ?: Vector2,
            width                     ?: number,
            height                    ?: number,
            size                      ?: Size,
            cachingStrategy           ?: number,
            enableInteraction         ?: boolean,
            isVisible                 ?: boolean,
            backgroundRoundRadius     ?: number,
            backgroundFill            ?: IBrush2D | string,
            backgroundBorder          ?: IBrush2D | string,
            backgroundBorderThickNess ?: number,
            marginTop                 ?: number | string,
            marginLeft                ?: number | string,
            marginRight               ?: number | string,
            marginBottom              ?: number | string,
            margin                    ?: string,
            marginHAlignment          ?: number,
            marginVAlignment          ?: number,
            marginAlignment           ?: string,

        }) {
            Prim2DBase._isCanvasInit = true;
            super(scene, settings);

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
    }

}