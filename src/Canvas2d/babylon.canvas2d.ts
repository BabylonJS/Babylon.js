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

        /**
         * Create a new 2D ScreenSpace Rendering Canvas, it is a 2D rectangle that has a size (width/height) and a position relative to the top/left corner of the screen.
         * ScreenSpace Canvas will be drawn in the Viewport as a 2D Layer lying to the top of the 3D Scene. Typically used for traditional UI.
         * All caching strategies will be available.
         * PLEASE NOTE: the origin of a Screen Space Canvas is set to [0;0] (bottom/left) which is different than the default origin of a Primitive which is centered [0.5;0.5]
         * @param scene the Scene that owns the Canvas
         * @param name the name of the Canvas, for information purpose only
         * @param pos the position of the canvas, relative from the bottom/left of the scene's viewport
         * @param size the Size of the canvas. If null two behaviors depend on the cachingStrategy: if it's CACHESTRATEGY_CACHECANVAS then it will always auto-fit the rendering device, in all the other modes it will fit the content of the Canvas
         * @param cachingStrategy either CACHESTRATEGY_TOPLEVELGROUPS, CACHESTRATEGY_ALLGROUPS, CACHESTRATEGY_CANVAS, CACHESTRATEGY_DONTCACHE. Please refer to their respective documentation for more information.
         */
        static CreateScreenSpace(scene: Scene, name: string, pos: Vector2, size: Size, cachingStrategy: number = Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS, enableInteraction: boolean = true): Canvas2D {
            let c = new Canvas2D();
            c.setupCanvas(scene, name, size, true, cachingStrategy, enableInteraction);
            c.position = pos;
            c.origin = Vector2.Zero();

            return c;
        }

        /**
         * Create a new 2D WorldSpace Rendering Canvas, it is a 2D rectangle that has a size (width/height) and a world transformation information to place it in the world space.
         * This kind of canvas can't have its Primitives directly drawn in the Viewport, they need to be cached in a bitmap at some point, as a consequence the DONT_CACHE strategy is unavailable. For now only CACHESTRATEGY_CANVAS is supported, but the remaining strategies will be soon.
         * @param scene the Scene that owns the Canvas
         * @param name the name of the Canvas, for information purpose only
         * @param position the position of the Canvas in World Space
         * @param rotation the rotation of the Canvas in World Space
         * @param size the dimension of the Canvas in World Space
         * @param renderScaleFactor A scale factor applied to create the rendering texture that will be mapped in the Scene Rectangle. If you set 2 for instance the texture will be twice large in width and height. A greater value will allow to achieve a better rendering quality.
         * BE AWARE that the Canvas true dimension will be size*renderScaleFactor, then all coordinates and size will have to be express regarding this size.
         * TIPS: if you want a renderScaleFactor independent reference of frame, create a child Group2D in the Canvas with position 0,0 and size set to null, then set its scale property to the same amount than the renderScaleFactor, put all your primitive inside using coordinates regarding the size property you pick for the Canvas and you'll be fine.
         * @param sideOrientation Unexpected behavior occur if the value is different from Mesh.DEFAULTSIDE right now, so please use this one.
         * @param cachingStrategy Must be CACHESTRATEGY_CANVAS for now
         */
        static CreateWorldSpace(scene: Scene, name: string, position: Vector3, rotation: Quaternion, size: Size, renderScaleFactor: number = 1, sideOrientation?: number, cachingStrategy: number = Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS, enableInteraction: boolean = true): Canvas2D {
            if (cachingStrategy !== Canvas2D.CACHESTRATEGY_CANVAS) {
                throw new Error("Right now only the CACHESTRATEGY_CANVAS cache Strategy is supported for WorldSpace Canvas. More will come soon!");
            }

            //if (cachingStrategy === Canvas2D.CACHESTRATEGY_DONTCACHE) {
            //    throw new Error("CACHESTRATEGY_DONTCACHE cache Strategy can't be used for WorldSpace Canvas");
            //}

            if (!sideOrientation) {
                sideOrientation = Mesh.DEFAULTSIDE;
            }

            let c = new Canvas2D();
            c.setupCanvas(scene, name, new Size(size.width*renderScaleFactor, size.height*renderScaleFactor), false, cachingStrategy, enableInteraction);

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
            c._worldSpaceNode = plane;

            return c;
        }

        protected setupCanvas(scene: Scene, name: string, size: Size, isScreenSpace: boolean, cachingstrategy: number, enableInteraction: boolean) {
            let engine = scene.getEngine();
            this._fitRenderingDevice = !size;
            if (!size) {
                size = new Size(engine.getRenderWidth(), engine.getRenderHeight());
            }
            this.__engineData = engine.getOrAddExternalDataWithFactory("__BJSCANVAS2D__", k => new Canvas2DEngineBoundData());
            this._cachingStrategy = cachingstrategy;
            this._depthLevel = 0;
            this._hierarchyMaxDepth = 100;
            this._hierarchyLevelZFactor = 1 / this._hierarchyMaxDepth;
            this._hierarchyLevelMaxSiblingCount = 1000;
            this._hierarchySiblingZDelta = this._hierarchyLevelZFactor / this._hierarchyLevelMaxSiblingCount;
            this._primPointerInfo = new PrimitivePointerInfo();
            this._capturedPointers = new StringDictionary<Prim2DBase>();
            this._pickStartingPosition = Vector2.Zero();

            this.setupGroup2D(this, null, name, Vector2.Zero(), size, this._cachingStrategy===Canvas2D.CACHESTRATEGY_ALLGROUPS ? Group2D.GROUPCACHEBEHAVIOR_DONTCACHEOVERRIDE : Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY);

            this._scene = scene;
            this._engine = engine;
            this._renderingSize = new Size(0, 0);

            // Register scene dispose to also dispose the canvas when it'll happens
            scene.onDisposeObservable.add((d, s) => {
                this.dispose();
            });

            if (cachingstrategy !== Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                this._background = Rectangle2D.Create(this, "###CANVAS BACKGROUND###", 0, 0, size.width, size.height);
                this._background.isPickable = false;
                this._background.origin = Vector2.Zero();
                this._background.levelVisible = false;
            }
            this._isScreeSpace = isScreenSpace;

            if (this._isScreeSpace) {
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

        private _setupInteraction(enable: boolean) {
            // No change detection
            if (enable === this._interactionEnabled) {
                return;
            }

            // Set the new state
            this._interactionEnabled = enable;

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
            this.scene.onPrePointerObservable.add((e, s) => this._handlePointerEventForInteraction(e, s));
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
        private _handlePointerEventForInteraction(eventData: PointerInfoPre, eventState: EventState) {
            // Update the this._primPointerInfo structure we'll send to observers using the PointerEvent data
            this._updatePointerInfo(eventData);

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

        private _updatePointerInfo(eventData: PointerInfoPre) {
            let pii = this._primPointerInfo;
            if (!pii.canvasPointerPos) {
                pii.canvasPointerPos = Vector2.Zero();
            }
            pii.canvasPointerPos.x = eventData.localPosition.x - this.position.x;
            pii.canvasPointerPos.y = (this.engine.getRenderHeight() - eventData.localPosition.y) - this.position.y;
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

            this._updateCanvasState();

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

            // In case of PointerOver/Out we will first notify the children (but the deepest to the closest) with PointerEnter/Leave
            if ((mask & (PrimitivePointerInfo.PointerOver | PrimitivePointerInfo.PointerOut)) !== 0) {
                this._notifChildren(prim, mask);
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

                            if (ii.isIntersected) {
                                let iprim = ii.topMostIntersectedPrimitive.prim;
                                if (iprim.actionManager) {
                                    if (this._pickStartingTime !== 0 && ((new Date().getTime() - this._pickStartingTime) > ActionManager.LongPressDelay) && (Math.abs(this._pickStartingPosition.x - ii.pickPosition.x) < ActionManager.DragMovementThreshold && Math.abs(this._pickStartingPosition.y - ii.pickPosition.y) < ActionManager.DragMovementThreshold)) {
                                        this._pickStartingTime = 0;
                                        iprim.actionManager.processTrigger(ActionManager.OnLongPressTrigger, ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData));
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

        _notifChildren(prim: Prim2DBase, mask: number) {
            let pii = this._primPointerInfo;

            prim.children.forEach(curChild => {
                // Recurse first, we want the deepest to be notified first
                this._notifChildren(curChild, mask);

                this._updatePrimPointerPos(curChild);

                // Fire the proper notification
                if (mask === PrimitivePointerInfo.PointerOver) {
                    this._debugExecObserver(curChild, PrimitivePointerInfo.PointerEnter);
                    curChild._pointerEventObservable.notifyObservers(pii, PrimitivePointerInfo.PointerEnter);
                }

                // Trigger a PointerLeave corresponding to the PointerOut
                else if (mask === PrimitivePointerInfo.PointerOut) {
                    this._debugExecObserver(curChild, PrimitivePointerInfo.PointerLeave);
                    curChild._pointerEventObservable.notifyObservers(pii, PrimitivePointerInfo.PointerLeave);
                }
            });
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
         * Only valid for World Space Canvas, returns the scene node that display the canvas
         */
        public get worldSpaceCanvasNode(): WorldSpaceCanvas2d {
            return this._worldSpaceNode;
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

        /**
         * Read-only property that return the Z delta to apply for each sibling primitives inside of a given one.
         * Sibling Primitives are defined in a specific order, the first ones will be draw below the next ones.
         * This property define the Z value to apply between each sibling Primitive. Current implementation allows 1000 Siblings Primitives per level.
         * @returns The Z Delta
         */
        public get hierarchySiblingZDelta(): number {
            return this._hierarchySiblingZDelta;
        }

        /**
         * Return the Z Factor that will be applied for each new hierarchy level.
         * @returns The Z Factor
         */
        public get hierarchyLevelZFactor(): number {
            return this._hierarchyLevelZFactor;
        }

        private __engineData: Canvas2DEngineBoundData;
        private _interactionEnabled: boolean;
        private _primPointerInfo: PrimitivePointerInfo;
        private _updateRenderId: number;
        private _intersectionRenderId: number;
        private _hoverStatusRenderId: number;
        private _pickStartingPosition: Vector2;
        private _pickedDownPrim: Prim2DBase;
        private _pickStartingTime: number;
        private _previousIntersectionList: Array<PrimitiveIntersectedInfo>;
        private _actualIntersectionList: Array<PrimitiveIntersectedInfo>;
        private _previousOverPrimitive: PrimitiveIntersectedInfo;
        private _actualOverPrimitive: PrimitiveIntersectedInfo;
        private _capturedPointers: StringDictionary<Prim2DBase>;
        private _scenePrePointerObserver: Observer<PointerInfoPre>;
        private _worldSpaceNode: WorldSpaceCanvas2d;
        private _mapCounter = 0;
        private _background: Rectangle2D;
        private _scene: Scene;
        private _engine: Engine;
        private _fitRenderingDevice: boolean;
        private _isScreeSpace: boolean;
        private _cachedCanvasGroup: Group2D;
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

        private _updateCanvasState() {
            // Check if the update has already been made for this render Frame
            if (this.scene.getRenderId() === this._updateRenderId) {
                return;
            }

            this._renderingSize.width = this.engine.getRenderWidth();
            this._renderingSize.height = this.engine.getRenderHeight();

            if (this._fitRenderingDevice) {
                this.size = this._renderingSize;
                if (this._background) {
                    this._background.size = this.size;
                }
            }

            var context = new Render2DContext();
            context.forceRefreshPrimitive = false;

            ++this._globalTransformProcessStep;
            this.updateGlobalTransVis(false);

            this._prepareGroupRender(context);

            this._updateRenderId = this.scene.getRenderId();
        }

        /**
         * Method that renders the Canvas, you should not invoke
         */
        private _render() {

            this._updateCanvasState();

            if (this._primPointerInfo.canvasPointerPos) {
                this._updateIntersectionList(this._primPointerInfo.canvasPointerPos, false);
                this._updateOverStatus();   // TODO this._primPointerInfo may not be up to date!
            }

            var context = new Render2DContext();
            this._groupRender(context);

            // If the canvas is cached at canvas level, we must manually render the sprite that will display its content
            if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_CANVAS && this._cachedCanvasGroup) {
                this._cachedCanvasGroup._renderCachedCanvas(context);
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
            if (group !== <any>this || this._isScreeSpace) {
                let node: PackedRect = res.node;

                // Special case if the canvas is entirely cached: create a group that will have a single sprite it will be rendered specifically at the very end of the rendering process
                if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_CANVAS) {
                    this._cachedCanvasGroup = Group2D._createCachedCanvasGroup(this);
                    let sprite = Sprite2D.Create(this._cachedCanvasGroup, "__cachedCanvasSprite__", 0, 0, map, node.contentSize, node.pos);
                    sprite.zOrder = 1;
                    sprite.origin = Vector2.Zero();
                }

                // Create a Sprite that will be used to render this cache, the "__cachedSpriteOfGroup__" starting id is a hack to bypass exception throwing in case of the Canvas doesn't normally allows direct primitives
                else {
                    let sprite = Sprite2D.Create(parent, `__cachedSpriteOfGroup__${group.id}`, group.position.x, group.position.y, map, node.contentSize, node.pos, false);
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