﻿module BABYLON {

    // This class contains data that lifetime is bounding to the Babylon Engine object
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

    @className("Canvas2D", "BABYLON")
    /**
     * The Canvas2D main class.
     * This class is extended in both ScreenSpaceCanvas2D and WorldSpaceCanvas2D which are designed only for semantic use.
     * User creates a Screen or WorldSpace canvas which is a 2D surface area that will draw the primitives that were added as children.
     */
    export abstract class Canvas2D extends Group2D {
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
         * Observable Mask to be notified before rendering is made
         */
        public static RENDEROBSERVABLE_PRE = 1;

        /**
         * Observable Mask to be notified after rendering is made
         */
        public static RENDEROBSERVABLE_POST = 2;

        private static _INSTANCES : Array<Canvas2D> = [];

        constructor(scene: Scene, settings?: {
            id                            ?: string,
            children                      ?: Array<Prim2DBase>,
            size                          ?: Size,
            renderingPhase                ?: { camera: Camera, renderingGroupID: number },
            designSize                    ?: Size,
            designUseHorizAxis            ?: boolean,
            isScreenSpace                 ?: boolean,
            cachingStrategy               ?: number,
            enableInteraction             ?: boolean,
            enableCollisionManager        ?: boolean,
            customCollisionManager        ?: (owner: Canvas2D, enableBorders: boolean) => PrimitiveCollisionManagerBase,
            collisionManagerUseBorders    ?: boolean,
            origin                        ?: Vector2,
            isVisible                     ?: boolean,
            backgroundRoundRadius         ?: number,
            backgroundFill                ?: IBrush2D | string,
            backgroundBorder              ?: IBrush2D | string,
            backgroundBorderThickNess     ?: number,
        }) {
            super(settings);

            this._cachedCanvasGroup = null;

            this._renderingGroupObserver = null;
            this._beforeRenderObserver = null;
            this._afterRenderObserver = null;

            this._profileInfoText = null;

            Prim2DBase._isCanvasInit = false;

            if (!settings) {
                settings = {};
            }

            if (this._cachingStrategy !== Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                this._background = new Rectangle2D({ parent: this, id: "###CANVAS BACKGROUND###", size: settings.size }); //TODO CHECK when size is null
                this._background.zOrder = 1.0;
                this._background.isPickable = false;
                this._background.origin = Vector2.Zero();
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

                // Put a handler to resize the background whenever the canvas is resizing
                this.propertyChanged.add((e, s) => {
                    if (e.propertyName === "size") {
                        this._background.size = this.size;
                    }
                }, Group2D.sizeProperty.flagId);

                this._background._patchHierarchy(this);
            }

            let engine = scene.getEngine();

            this.__engineData = engine.getOrAddExternalDataWithFactory("__BJSCANVAS2D__", k => new Canvas2DEngineBoundData());
            this._primPointerInfo = new PrimitivePointerInfo();
            this._capturedPointers = new StringDictionary<Prim2DBase>();
            this._pickStartingPosition = Vector2.Zero();
            this._hierarchyLevelMaxSiblingCount = 50;
            this._hierarchyDepth = 0;
            this._zOrder = 0;
            this._zMax = 1;
            this._scene = scene;
            this._engine = engine;
            this._renderingSize = new Size(0, 0);
            this._curHWScale = 0;
            this._canvasLevelScale = new Vector2(1, 1);
            this._designSize = settings.designSize || null;
            this._designUseHorizAxis = settings.designUseHorizAxis === true;
            if (!this._trackedGroups) {
                this._trackedGroups = new Array<Group2D>();
            }
            this._maxAdaptiveWorldSpaceCanvasSize = null;
            this._groupCacheMaps = new StringDictionary<MapTexture[]>();
            this._patchHierarchy(this);

            let enableInteraction = (settings.enableInteraction == null) ? true : settings.enableInteraction;

            this._fitRenderingDevice = !settings.size;
            if (!settings.size) {
                settings.size = new Size(engine.getRenderWidth(), engine.getRenderHeight());
            }

            // Register scene dispose to also dispose the canvas when it'll happens
            scene.onDisposeObservable.add((d, s) => {
                this.dispose();
            });

            if (this._isScreenSpace) {
                if (settings.renderingPhase) {
                    if (!settings.renderingPhase.camera || settings.renderingPhase.renderingGroupID==null) {
                        throw Error("You have to specify a valid camera and renderingGroup");
                    }
                    this._renderingGroupObserver = this._scene.onRenderingGroupObservable.add((e, s) => {
                        if ((this._scene.activeCamera === settings.renderingPhase.camera) && (e.renderStage===RenderingGroupInfo.STAGE_POSTTRANSPARENT)) {
                            this._engine.clear(null, false, true, true);
                            C2DLogging._startFrameRender();
                            this._render();
                            C2DLogging._endFrameRender();
                        }
                    }, Math.pow(2, settings.renderingPhase.renderingGroupID));
                } else {
                    this._afterRenderObserver = this._scene.onAfterRenderObservable.add((d, s) => {
                        this._engine.clear(null, false, true, true);
                        C2DLogging._startFrameRender();
                        this._render();
                        C2DLogging._endFrameRender();
                    });
                }
            } else {
                this._beforeRenderObserver = this._scene.onBeforeRenderObservable.add((d, s) => {
                    C2DLogging._startFrameRender();
                    this._render();
                    C2DLogging._endFrameRender();
                });
            }

            this._supprtInstancedArray = this._engine.getCaps().instancedArrays !== null;
                        //this._supprtInstancedArray = false; // TODO REMOVE!!!

            // Setup the canvas for interaction (or not)
            this._setupInteraction(enableInteraction);

            // Initialize the Primitive Collision Manager
            if (settings.enableCollisionManager) {
                let enableBorders = settings.collisionManagerUseBorders;
                this._primitiveCollisionManager = (settings.customCollisionManager==null) ? PrimitiveCollisionManagerBase.allocBasicPCM(this, enableBorders) : settings.customCollisionManager(this, enableBorders);
            }

            // Register this instance
            Canvas2D._INSTANCES.push(this);
        }

        public get drawCallsOpaqueCounter(): PerfCounter {
            if (!this._drawCallsOpaqueCounter) {
                this._drawCallsOpaqueCounter = new PerfCounter();
            }
            return this._drawCallsOpaqueCounter;
        }

        public get drawCallsAlphaTestCounter(): PerfCounter {
            if (!this._drawCallsAlphaTestCounter) {
                this._drawCallsAlphaTestCounter = new PerfCounter();
            }
            return this._drawCallsAlphaTestCounter;
        }

        public get drawCallsTransparentCounter(): PerfCounter {
            if (!this._drawCallsTransparentCounter) {
                this._drawCallsTransparentCounter = new PerfCounter();
            }
            return this._drawCallsTransparentCounter;
        }

        public get groupRenderCounter(): PerfCounter {
            if (!this._groupRenderCounter) {
                this._groupRenderCounter = new PerfCounter();
            }
            return this._groupRenderCounter;
        }

        public get updateTransparentDataCounter(): PerfCounter {
            if (!this._updateTransparentDataCounter) {
                this._updateTransparentDataCounter = new PerfCounter();
            }
            return this._updateTransparentDataCounter;
        }

        public get updateCachedStateCounter(): PerfCounter {
            if (!this._updateCachedStateCounter) {
                this._updateCachedStateCounter = new PerfCounter();
            }
            return this._updateCachedStateCounter;
        }

        public get updateLayoutCounter(): PerfCounter {
            if (!this._updateLayoutCounter) {
                this._updateLayoutCounter = new PerfCounter();
            }
            return this._updateLayoutCounter;
        }

        public get updatePositioningCounter(): PerfCounter {
            if (!this._updatePositioningCounter) {
                this._updatePositioningCounter = new PerfCounter();
            }
            return this._updatePositioningCounter;
        }

        public get updateLocalTransformCounter(): PerfCounter {
            if (!this._updateLocalTransformCounter) {
                this._updateLocalTransformCounter = new PerfCounter();
            }
            return this._updateLocalTransformCounter;
        }

        public get updateGlobalTransformCounter(): PerfCounter {
            if (!this._updateGlobalTransformCounter) {
                this._updateGlobalTransformCounter = new PerfCounter();
            }
            return this._updateGlobalTransformCounter;
        }

        public get boundingInfoRecomputeCounter(): PerfCounter {
            if (!this._boundingInfoRecomputeCounter) {
                this._boundingInfoRecomputeCounter = new PerfCounter();
            }
            return this._boundingInfoRecomputeCounter;
        }

        public get layoutBoundingInfoUpdateCounter(): PerfCounter {
            if (!this._layoutBoundingInfoUpdateCounter) {
                this._layoutBoundingInfoUpdateCounter = new PerfCounter();
            }
            return this._layoutBoundingInfoUpdateCounter;
        }

        public get canvasRenderTimeCounter(): PerfCounter {
            if (!this._canvasRenderTimeCounter) {
                this._canvasRenderTimeCounter = new PerfCounter();
            }
            return this._canvasRenderTimeCounter;
        }

        public static get instances() : Array<Canvas2D> {
            return Canvas2D._INSTANCES;
        }

        public get primitiveCollisionManager(): PrimitiveCollisionManagerBase {
            return this._primitiveCollisionManager;
        }

        protected _canvasPreInit(settings: any) {
            let cachingStrategy = (settings.cachingStrategy == null) ? Canvas2D.CACHESTRATEGY_DONTCACHE : settings.cachingStrategy;
            this._cachingStrategy = cachingStrategy;
            this._isScreenSpace = (settings.isScreenSpace == null) ? true : settings.isScreenSpace;
            this._hierarchyDepth = 0;
        }

        public static _zMinDelta: number = 1 / (Math.pow(2, 24) - 1);

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
                    if (this.isVisible === false) {
                        return;
                    }
                    this._handlePointerEventForInteraction(e, e.localPosition, s);
                });
            }

            // World Space Mode
            else {
                let scene = this.scene;
                if (enable) {
                    scene.constantlyUpdateMeshUnderPointer = true;
                    this._scenePointerObserver = scene.onPointerObservable.add((e, s) => {

                        if (this.isVisible === false) {
                            return;
                        }

                        if (e.pickInfo.hit && e.pickInfo.pickedMesh === this._worldSpaceNode && this.worldSpaceToNodeLocal) {
                            let localPos = this.worldSpaceToNodeLocal(e.pickInfo.pickedPoint);
                            this._handlePointerEventForInteraction(e, localPos, s);
                        } else if (this._actualIntersectionList && this._actualIntersectionList.length > 0) {
                            this._handlePointerEventForInteraction(e, null, s);
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
         * Beware that you have to take under consideration the origin and unitScaleFactor in your calculations! Good luck!
         */
        public worldSpaceToNodeLocal = (worldPos: Vector3): Vector2 => {
            let node = this._worldSpaceNode;
            if (!node) {
                return;
            }

            let mtx = node.getWorldMatrix().clone();
            mtx.invert();
            let usf = this.unitScaleFactor;
            let v = Vector3.TransformCoordinates(worldPos, mtx);
            let res = new Vector2(v.x, v.y);
            let size = this.actualSize;
            res.x += (size.width/usf) * 0.5;  // res is centered, make it relative to bottom/left
            res.y += (size.height/usf) * 0.5;
            res.x *= usf; // multiply by the unitScaleFactor, which defines if the canvas is nth time bigger than the original world plane
            res.y *= usf;
            return res;
        }

        /**
         * If you use a custom WorldSpaceCanvasNode you have to override this property to update the UV of your object to reflect the changes due to a resizing of the cached bitmap
         */
        public worldSpaceCacheChanged = () => {
            let plane = <Mesh>this.worldSpaceCanvasNode;
            let vd = VertexData.ExtractFromMesh(plane); //new VertexData();
            vd.uvs = new Float32Array(8);

            let material = <StandardMaterial>plane.material;
            let tex = this._renderableData._cacheTexture;
            if (material.diffuseTexture !== tex) {
                material.diffuseTexture = tex;
                tex.hasAlpha = true;
            }

            let nodeuv = this._renderableData._cacheNodeUVs;
            for (let i = 0; i < 4; i++) {
                vd.uvs[i * 2 + 0] = nodeuv[i].x;
                vd.uvs[i * 2 + 1] = nodeuv[i].y;
            }
            vd.applyToMesh(plane);
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
            if (localPosition) {
                if (!this._updatePointerInfo(eventData, localPosition)) {
                    return;
                }
            } else {
                this._primPointerInfo.canvasPointerPos = null;
            }

            let capturedPrim = this.getCapturedPrimitive(this._primPointerInfo.pointerId);

            // Make sure the intersection list is up to date, we maintain this list either in response of a mouse event (here) or before rendering the canvas.
            // Why before rendering the canvas? because some primitives may move and get away/under the mouse cursor (which is not moving). So we need to update at both location in order to always have an accurate list, which is needed for the hover state change.
            this._updateIntersectionList(localPosition ? this._primPointerInfo.canvasPointerPos : null, capturedPrim !== null, true);

            // Update the over status, same as above, it's could be done here or during rendering, but will be performed only once per render frame
            this._updateOverStatus(true);

            // Check if we have nothing to raise
            if (!this._actualOverPrimitive && !capturedPrim) {
                return;
            }

            // Update the relatedTarget info with the over primitive or the captured one (if any)
            let targetPrim = capturedPrim || this._actualOverPrimitive.prim;

            let targetPointerPos = capturedPrim ? this._primPointerInfo.canvasPointerPos.subtract(new Vector2(targetPrim.globalTransform.m[4], targetPrim.globalTransform.m[5])) : this._actualOverPrimitive.intersectionLocation;

            this._primPointerInfo.updateRelatedTarget(targetPrim, targetPointerPos);

            // Analyze the pointer event type and fire proper events on the primitive

            let skip = false;
            if (eventData.type === PointerEventTypes.POINTERWHEEL) {
                skip = !this._bubbleNotifyPrimPointerObserver(targetPrim, PrimitivePointerInfo.PointerMouseWheel, eventData);
            } else if (eventData.type === PointerEventTypes.POINTERMOVE) {
                skip = !this._bubbleNotifyPrimPointerObserver(targetPrim, PrimitivePointerInfo.PointerMove, eventData);
            } else if (eventData.type === PointerEventTypes.POINTERDOWN) {
                skip = !this._bubbleNotifyPrimPointerObserver(targetPrim, PrimitivePointerInfo.PointerDown, eventData);
            } else if (eventData.type === PointerEventTypes.POINTERUP) {
                skip = !this._bubbleNotifyPrimPointerObserver(targetPrim, PrimitivePointerInfo.PointerUp, eventData);
            }

            eventState.skipNextObservers = skip;
        }

        private _updatePointerInfo(eventData: PointerInfoBase, localPosition: Vector2): boolean {
            let s = this._canvasLevelScale.multiplyByFloats(this.scaleX, this.scaleY);
            let pii = this._primPointerInfo;
            pii.cancelBubble = false;
            if (!pii.canvasPointerPos) {
                pii.canvasPointerPos = Vector2.Zero();
            }
            var camera = this._scene.cameraToUseForPointers || this._scene.activeCamera;
            if (!camera || !camera.viewport) {
                return false;
            }

            var engine = this._scene.getEngine();

            if (this._isScreenSpace) {
                var cameraViewport = camera.viewport;
                let renderWidth = engine.getRenderWidth();
                let renderHeight = engine.getRenderHeight();
//                console.log(`Render Width: ${renderWidth} Height: ${renderHeight}, localX: ${localPosition.x}, localY: ${localPosition.y}`);
                var viewport = cameraViewport.toGlobal(renderWidth, renderHeight);

                // Moving coordinates to local viewport world
                var x = localPosition.x - viewport.x;
                var y = localPosition.y - viewport.y;

                pii.canvasPointerPos.x = (x - this.actualPosition.x) / s.x;
                pii.canvasPointerPos.y = (renderHeight - y - this.actualPosition.y) / s.y;
            } else {
                pii.canvasPointerPos.x = localPosition.x / s.x;
                pii.canvasPointerPos.y = localPosition.y / s.x;
            }
            //console.log(`UpdatePointerInfo for ${this.id}, X:${pii.canvasPointerPos.x}, Y:${pii.canvasPointerPos.y}`);
            pii.mouseWheelDelta = 0;

            if (eventData.type === PointerEventTypes.POINTERWHEEL) {
                var event = <MouseWheelEvent>eventData.event;
                if (event.wheelDelta) {
                    pii.mouseWheelDelta = event.wheelDelta / (PrimitivePointerInfo.MouseWheelPrecision * 40);
                } else if (event.detail) {
                    pii.mouseWheelDelta = -event.detail / PrimitivePointerInfo.MouseWheelPrecision;
                }
            } else {
                var pe = <PointerEvent>eventData.event;
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

            return true;
        }

        private _updateIntersectionList(mouseLocalPos: Vector2, isCapture: boolean, force: boolean) {
            if (!force && (this.scene.getRenderId() === this._intersectionRenderId)) {
                return;
            }

            let ii = Canvas2D._interInfo;
            let outCase = mouseLocalPos == null;
            if (!outCase) {
                // A little safe guard, it might happens than the event is triggered before the first render and nothing is computed, this simple check will make sure everything will be fine
                if (!this._globalTransform) {
                    this.updateCachedStates(true);
                }

                ii.pickPosition.x = mouseLocalPos.x;
                ii.pickPosition.y = mouseLocalPos.y;
                ii.findFirstOnly = false;

                // Fast rejection: test if the mouse pointer is outside the canvas's bounding Info
                if (!isCapture && !this.levelBoundingInfo.doesIntersect(ii.pickPosition)) {
                    // Reset intersection info as we don't hit anything
                    ii.intersectedPrimitives = new Array<PrimitiveIntersectedInfo>();
                    ii.topMostIntersectedPrimitive = null;
                } else {
                    // The pointer is inside the Canvas, do an intersection test
                    this.intersect(ii);

                    // Sort primitives to get them from top to bottom
                    ii.intersectedPrimitives = ii.intersectedPrimitives.sort((a, b) => a.prim.actualZOffset - b.prim.actualZOffset);
                }
            }

            {
                // Update prev/actual intersection info, fire "overPrim" property change if needed
                this._previousIntersectionList = this._actualIntersectionList;
                this._actualIntersectionList   = outCase ? new Array<PrimitiveIntersectedInfo>() : ii.intersectedPrimitives;
                this._previousOverPrimitive    = this._actualOverPrimitive;
                this._actualOverPrimitive      = outCase ? null : ii.topMostIntersectedPrimitive;

                let prev = (this._previousOverPrimitive != null) ? this._previousOverPrimitive.prim : null;
                let actual = (this._actualOverPrimitive != null) ? this._actualOverPrimitive.prim : null;
                if (prev !== actual) {
                    this.onPropertyChanged("overPrim", this._previousOverPrimitive ? this._previousOverPrimitive.prim : null, this._actualOverPrimitive ? this._actualOverPrimitive.prim : null);
                }
            }

            this._intersectionRenderId = this.scene.getRenderId();
        }

        // Based on the previousIntersectionList and the actualInstersectionList we can determined which primitives are being hover state or loosing it
        private _updateOverStatus(force: boolean) {
            if ((!force && (this.scene.getRenderId() === this._hoverStatusRenderId)) || !this._actualIntersectionList) {
                return;
            }

            if (this._previousIntersectionList == null) {
                this._previousIntersectionList = [];
            }

            // Detect a change of over
            let prevPrim = this._previousOverPrimitive ? this._previousOverPrimitive.prim : null;
            let actualPrim = this._actualOverPrimitive ? this._actualOverPrimitive.prim : null;

            if (prevPrim !== actualPrim) {
                // Detect if the current pointer is captured, only fire event if they belong to the capture primitive
                let capturedPrim = this.getCapturedPrimitive(this._primPointerInfo.pointerId);

                // See the NOTE section of: https://www.w3.org/TR/pointerevents/#setting-pointer-capture
                if (capturedPrim) {
                    if (capturedPrim === prevPrim) {
                        this._primPointerInfo.updateRelatedTarget(prevPrim, this._previousOverPrimitive.intersectionLocation);
                        this._bubbleNotifyPrimPointerObserver(prevPrim, PrimitivePointerInfo.PointerOut, null);
                    } else if (capturedPrim === actualPrim) {
                        this._primPointerInfo.updateRelatedTarget(actualPrim, this._actualOverPrimitive.intersectionLocation);
                        this._bubbleNotifyPrimPointerObserver(actualPrim, PrimitivePointerInfo.PointerOver, null);
                    }
                } else {
                    // Check for Out & Leave
                    for (let prev of this._previousIntersectionList) {
                        if (!Tools.first(this._actualIntersectionList, (pii) => pii.prim === prev.prim)) {
                            this._primPointerInfo.updateRelatedTarget(prev.prim, prev.intersectionLocation);
                            this._bubbleNotifyPrimPointerObserver(prev.prim, PrimitivePointerInfo.PointerOut, null);
                        }
                    }

                    // Check for Over & Enter
                    for (let actual of this._actualIntersectionList) {
                        if (!Tools.first(this._previousIntersectionList, (pii) => pii.prim === actual.prim)) {
                            this._primPointerInfo.updateRelatedTarget(actual.prim, actual.intersectionLocation);
                            this._bubbleNotifyPrimPointerObserver(actual.prim, PrimitivePointerInfo.PointerOver, null);
                        }
                    }
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
            debug += `[RID:${this.scene.getRenderId()}] [${prim.hierarchyDepth}] event:${PrimitivePointerInfo.getEventTypeName(mask)}, id: ${prim.id} (${Tools.getClassName(prim)}), primPos: ${pii.primitivePointerPos.toString()}, canvasPos: ${pii.canvasPointerPos.toString()}, relatedTarget: ${pii.relatedTarget.id}`;
            console.log(debug);
        }

        private _bubbleNotifyPrimPointerObserver(prim: Prim2DBase, mask: number, eventData: PointerInfoBase): boolean {
            let ppi = this._primPointerInfo;
            let event = eventData ? eventData.event : null;

            let cur = prim;
            while (cur && !cur.isDisposed) {
                this._updatePrimPointerPos(cur);

                // For the first level we have to fire Enter or Leave for corresponding Over or Out
                if (cur === prim) {
                    // Fire the proper notification
                    if (mask === PrimitivePointerInfo.PointerOver) {
                        this._debugExecObserver(prim, PrimitivePointerInfo.PointerEnter);
                        prim._pointerEventObservable.notifyObservers(ppi, PrimitivePointerInfo.PointerEnter);
                    }

                    // Trigger a PointerLeave corresponding to the PointerOut
                    else if (mask === PrimitivePointerInfo.PointerOut) {
                        this._debugExecObserver(prim, PrimitivePointerInfo.PointerLeave);
                        prim._pointerEventObservable.notifyObservers(ppi, PrimitivePointerInfo.PointerLeave);
                    }
                }

                // Exec the observers
                this._debugExecObserver(cur, mask);
                if (!cur._pointerEventObservable.notifyObservers(ppi, mask) && eventData instanceof PointerInfoPre) {
                    eventData.skipOnPointerObservable = true;
                    return false;
                }

                this._triggerActionManager(cur, ppi, mask, event);

                // Bubble canceled? If we're not executing PointerOver or PointerOut, quit immediately
                // If it's PointerOver/Out we have to trigger PointerEnter/Leave no matter what
                if (ppi.cancelBubble) {
                    return false;

                }

                // Loop to the parent
                cur = cur.parent;
            }
            return true;
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
                            this._updateIntersectionList(ppi.canvasPointerPos, capturedPrim !== null, true);
                            this._updateOverStatus(false);

                            let ii = new IntersectInfo2D();
                            ii.pickPosition = ppi.canvasPointerPos.clone();
                            ii.findFirstOnly = false;
                            this.intersect(ii);

                            if (ii.isPrimIntersected(prim) !== null) {
                                if (prim.actionManager) {
                                    if (this._pickStartingTime !== 0 && ((new Date().getTime() - this._pickStartingTime) > Scene.LongPressDelay) && (Math.abs(this._pickStartingPosition.x - ii.pickPosition.x) < Scene.DragMovementThreshold && Math.abs(this._pickStartingPosition.y - ii.pickPosition.y) < Scene.DragMovementThreshold)) {
                                        this._pickStartingTime = 0;
                                        prim.actionManager.processTrigger(ActionManager.OnLongPressTrigger, ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData));
                                    }
                                }
                            }
                        }, Scene.LongPressDelay);
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
                    if (Math.abs(this._pickStartingPosition.x - ppi.canvasPointerPos.x) < Scene.DragMovementThreshold && Math.abs(this._pickStartingPosition.y - ppi.canvasPointerPos.y) < Scene.DragMovementThreshold) {
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

        /**
         * Don't forget to call the dispose method when you're done with the Canvas instance.
         * But don't worry, if you dispose its scene, the canvas will be automatically disposed too.
         */
        public dispose(): boolean {
            if (!super.dispose()) {
                return false;
            }

            if (this._profilingCanvas) {
                this._profilingCanvas.dispose();
                this._profilingCanvas = null;
            }

            if (this.interactionEnabled) {
                this._setupInteraction(false);
            }

            if (this._renderingGroupObserver) {
                this._scene.onRenderingGroupObservable.remove(this._renderingGroupObserver);
                this._renderingGroupObserver = null;
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
                this._groupCacheMaps.forEach((k, m) => m.forEach(e => e.dispose()));
                this._groupCacheMaps = null;
            }       

            // Unregister this instance
            let index = Canvas2D._INSTANCES.indexOf(this);
            if (index > -1) {
                Canvas2D._INSTANCES.splice(index, 1);
            }

            return true;
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
         * And observable called during the Canvas rendering process.
         * This observable is called twice per render, each time with a different mask:
         *  - 1: before render is executed
         *  - 2: after render is executed
         */
        public get renderObservable(): Observable<Canvas2D> {
            if (!this._renderObservable) {
                this._renderObservable = new Observable<Canvas2D>();
            }
            return this._renderObservable;
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
         * Return true if the Canvas is a Screen Space one, false if it's a World Space one.
         * @returns {} 
         */
        public get isScreenSpace(): boolean {
            return this._isScreenSpace;
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

        public get fitRenderingDevice(): boolean {
            return this._fitRenderingDevice;
        }

        public get designSize(): Size {
            return this._designSize;
        }

        public get designSizeUseHorizAxis(): boolean {
            return this._designUseHorizAxis;
        }

        public set designSizeUseHorizeAxis(value: boolean) {
            this._designUseHorizAxis = value;
        }

        /**
         * Return 
         */
        public get overPrim(): Prim2DBase {
            if (this._actualIntersectionList && this._actualIntersectionList.length>0) {
                return this._actualIntersectionList[0].prim;
            }
            return null;
        }

        /**
         * Access the babylon.js' engine bound data, do not invoke this method, it's for internal purpose only
         * @returns {} 
         */
        public get _engineData(): Canvas2DEngineBoundData {
            return this.__engineData;
        }

        public get unitScaleFactor(): number {
            return this._unitScaleFactor;
        }

        public createCanvasProfileInfoCanvas(): Canvas2D {
            if (this._profilingCanvas) {
                return this._profilingCanvas;
            }

            let canvas = new ScreenSpaceCanvas2D(this.scene, {
                id: "ProfileInfoCanvas", cachingStrategy: Canvas2D.CACHESTRATEGY_DONTCACHE, children:
                [
                    new Rectangle2D({
                        id: "ProfileBorder", border: "#FFFFFFFF", borderThickness: 2, roundRadius: 5, fill: "#C04040C0", marginAlignment: "h: left, v: top", margin: "10", padding: "10", children:
                        [
                            new Text2D("Stats", { id: "ProfileInfoText", marginAlignment: "h: left, v: top", fontName: "12pt Lucida Console", fontSignedDistanceField: true })
                        ]
                    })

                ]
            });

            this._profileInfoText = <Text2D>canvas.findById("ProfileInfoText");
            this._profilingCanvas = canvas;
            return canvas;
        }

        /**
         * Instanced Array will be create if there's at least this number of parts/prim that can fit into it
         */
        public minPartCountToUseInstancedArray = 5;

        private checkBackgroundAvailability() {
            if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                throw Error("Can't use Canvas Background with the caching strategy TOPLEVELGROUPS");
            }
        }

        private _initPerfMetrics() {
            this.drawCallsOpaqueCounter.fetchNewFrame();
            this.drawCallsAlphaTestCounter.fetchNewFrame();
            this.drawCallsTransparentCounter.fetchNewFrame();
            this.groupRenderCounter.fetchNewFrame();
            this.updateTransparentDataCounter.fetchNewFrame();
            this.updateCachedStateCounter.fetchNewFrame();
            this.updateLayoutCounter.fetchNewFrame();
            this.updatePositioningCounter.fetchNewFrame();
            this.updateLocalTransformCounter.fetchNewFrame();
            this.updateGlobalTransformCounter.fetchNewFrame();
            this.boundingInfoRecomputeCounter.fetchNewFrame();
            this.layoutBoundingInfoUpdateCounter.fetchNewFrame();
            this.canvasRenderTimeCounter.beginMonitoring();
        }

        private _fetchPerfMetrics() {
            this.drawCallsOpaqueCounter.addCount(0, true);
            this.drawCallsAlphaTestCounter.addCount(0, true);
            this.drawCallsTransparentCounter.addCount(0, true);
            this.groupRenderCounter.addCount(0, true);
            this.updateTransparentDataCounter.addCount(0, true);
            this.updateCachedStateCounter.addCount(0, true);
            this.updateLayoutCounter.addCount(0, true);
            this.updatePositioningCounter.addCount(0, true);
            this.updateLocalTransformCounter.addCount(0, true);
            this.updateGlobalTransformCounter.addCount(0, true);
            this.boundingInfoRecomputeCounter.addCount(0, true);
            this.layoutBoundingInfoUpdateCounter.addCount(0, true);
            this.canvasRenderTimeCounter.endMonitoring(true);
        }

        private _updateProfileCanvas() {
            if (this._profileInfoText == null) {
                return;
            }

            let format = (v: number) => (Math.round(v*100)/100).toString();

            let p = `Render Time: avg:${format(this.canvasRenderTimeCounter.lastSecAverage)}ms ${format(this.canvasRenderTimeCounter.current)}ms\n` +
                    `Draw Calls:\n` +
                    ` - Opaque:      ${format(this.drawCallsOpaqueCounter.current)}, (avg:${format(this.drawCallsOpaqueCounter.lastSecAverage)}, t:${format(this.drawCallsOpaqueCounter.total)})\n` +
                    ` - AlphaTest:   ${format(this.drawCallsAlphaTestCounter.current)}, (avg:${format(this.drawCallsAlphaTestCounter.lastSecAverage)}, t:${format(this.drawCallsAlphaTestCounter.total)})\n` +
                    ` - Transparent: ${format(this.drawCallsTransparentCounter.current)}, (avg:${format(this.drawCallsTransparentCounter.lastSecAverage)}, t:${format(this.drawCallsTransparentCounter.total)})\n` +
                    `Group Render: ${this.groupRenderCounter.current}, (avg:${format(this.groupRenderCounter.lastSecAverage)}, t:${format(this.groupRenderCounter.total)})\n` + 
                    `Update Transparent Data: ${this.updateTransparentDataCounter.current}, (avg:${format(this.updateTransparentDataCounter.lastSecAverage)}, t:${format(this.updateTransparentDataCounter.total)})\n` + 
                    `Update Cached States: ${this.updateCachedStateCounter.current}, (avg:${format(this.updateCachedStateCounter.lastSecAverage)}, t:${format(this.updateCachedStateCounter.total)})\n` + 
                    ` - Update Layout: ${this.updateLayoutCounter.current}, (avg:${format(this.updateLayoutCounter.lastSecAverage)}, t:${format(this.updateLayoutCounter.total)})\n` + 
                    ` - Update Positioning: ${this.updatePositioningCounter.current}, (avg:${format(this.updatePositioningCounter.lastSecAverage)}, t:${format(this.updatePositioningCounter.total)})\n` + 
                    ` - Update Local  Trans: ${this.updateLocalTransformCounter.current}, (avg:${format(this.updateLocalTransformCounter.lastSecAverage)}, t:${format(this.updateLocalTransformCounter.total)})\n` + 
                    ` - Update Global Trans: ${this.updateGlobalTransformCounter.current}, (avg:${format(this.updateGlobalTransformCounter.lastSecAverage)}, t:${format(this.updateGlobalTransformCounter.total)})\n` + 
                    ` - BoundingInfo Recompute: ${this.boundingInfoRecomputeCounter.current}, (avg:${format(this.boundingInfoRecomputeCounter.lastSecAverage)}, t:${format(this.boundingInfoRecomputeCounter.total)})\n` +
                    ` - LayoutBoundingInfo Recompute: ${this.layoutBoundingInfoUpdateCounter.current}, (avg:${format(this.layoutBoundingInfoUpdateCounter.lastSecAverage)}, t:${format(this.layoutBoundingInfoUpdateCounter.total)})` ;
            this._profileInfoText.text = p;
        }

        public _addDrawCallCount(count: number, renderMode: number) {
            switch (renderMode) {
                case Render2DContext.RenderModeOpaque:
                    this._drawCallsOpaqueCounter.addCount(count, false);
                    return;
                case Render2DContext.RenderModeAlphaTest:
                    this._drawCallsAlphaTestCounter.addCount(count, false);
                    return;
                case Render2DContext.RenderModeTransparent:
                    this._drawCallsTransparentCounter.addCount(count, false);
                    return;
            }
        }

        public _addGroupRenderCount(count: number) {
            if (this._groupRenderCounter) {
                this._groupRenderCounter.addCount(count, false);
            }
        }

        public _addUpdateTransparentDataCount(count: number) {
            if (this._updateTransparentDataCounter) {
                this._updateTransparentDataCounter.addCount(count, false);
            }
        }

        public addUpdateCachedStateCounter(count: number) {
            if (this._updateCachedStateCounter) {
                this._updateCachedStateCounter.addCount(count, false);
            }
        }

        public addUpdateLayoutCounter(count: number) {
            if (this._updateLayoutCounter) {
                this._updateLayoutCounter.addCount(count, false);
            }
        }

        public addUpdatePositioningCounter(count: number) {
            if (this._updatePositioningCounter) {
                this._updatePositioningCounter.addCount(count, false);
            }
        }

        public addupdateLocalTransformCounter(count: number) {
            if (this._updateLocalTransformCounter) {
                this._updateLocalTransformCounter.addCount(count, false);
            }
        }

        public addUpdateGlobalTransformCounter(count: number) {
            if (this._updateGlobalTransformCounter) {
                this._updateGlobalTransformCounter.addCount(count, false);
            }
        }

        public addLayoutBoundingInfoUpdateCounter(count: number) {
            if (this._layoutBoundingInfoUpdateCounter) {
                this._layoutBoundingInfoUpdateCounter.addCount(count, false);
            }
        }

        private _renderObservable: Observable<Canvas2D>;
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
        private _groupCacheMaps: StringDictionary<MapTexture[]>;
        private _renderingGroupObserver: Observer<RenderingGroupInfo>;
        private _beforeRenderObserver: Observer<Scene>;
        private _afterRenderObserver: Observer<Scene>;
        private _supprtInstancedArray: boolean;
        protected _unitScaleFactor: number;
        private _trackedGroups: Array<Group2D>;
        protected _trackNode: Node;
        protected _trackNodeOffset :Vector3;
        protected _trackNodeBillboard : boolean;
        protected _maxAdaptiveWorldSpaceCanvasSize: number;
        private _designSize: Size;
        private _designUseHorizAxis: boolean;
        public  _primitiveCollisionManager: PrimitiveCollisionManagerBase;

        public _canvasLevelScale: Vector2;
        public  _renderingSize: Size;
        private _curHWScale;

        private _drawCallsOpaqueCounter          : PerfCounter;
        private _drawCallsAlphaTestCounter       : PerfCounter;
        private _drawCallsTransparentCounter     : PerfCounter;
        private _groupRenderCounter              : PerfCounter;
        private _updateTransparentDataCounter    : PerfCounter;
        private _updateCachedStateCounter        : PerfCounter;
        private _updateLayoutCounter             : PerfCounter;
        private _updatePositioningCounter        : PerfCounter;
        private _updateGlobalTransformCounter    : PerfCounter;
        private _updateLocalTransformCounter     : PerfCounter;
        private _boundingInfoRecomputeCounter    : PerfCounter;
        private _layoutBoundingInfoUpdateCounter : PerfCounter;
        private _canvasRenderTimeCounter         : PerfCounter;

        private _profilingCanvas: Canvas2D;
        private _profileInfoText: Text2D;

        private static _v = Vector3.Zero(); // Must stay zero
        private static _cv1 = Vector2.Zero(); // Must stay zero
        private static _m = Matrix.Identity();
        private static _mI = Matrix.Identity(); // Must stay identity
        private static tS = Vector3.Zero();
        private static tT = Vector3.Zero();
        private static tR = Quaternion.Identity();
        private static _tmpMtx = Matrix.Identity();
        private static _tmpVec3 = Vector3.Zero();

        private _updateTrackedNodes() {
            // Get the used camera
            let cam = this.scene.cameraToUseForPointers || this.scene.activeCamera;

            // Compute some matrix stuff
            cam.getViewMatrix().multiplyToRef(cam.getProjectionMatrix(), Canvas2D._m);
            let rh = this.engine.getRenderHeight();
            let v = cam.viewport.toGlobal(this.engine.getRenderWidth(), rh);
            let tmpVec3 = Canvas2D._tmpVec3;
            let tmpMtx = Canvas2D._tmpMtx;

            // Compute the screen position of each group that track a given scene node
            for (let group of this._trackedGroups) {
                if (group.isDisposed) {
                    continue;
                }

                let node = group.trackedNode;
                let worldMtx = node.getWorldMatrix();

                if(group.trackedNodeOffset){
                    Vector3.TransformCoordinatesToRef(group.trackedNodeOffset, worldMtx, tmpVec3);
                    tmpMtx.copyFrom(worldMtx);
                    worldMtx = tmpMtx;
                    worldMtx.setTranslation(tmpVec3);
                }

                let proj = Vector3.Project(Canvas2D._v, worldMtx, Canvas2D._m, v);

                // Set the visibility state accordingly, if the position is outside the frustum (well on the Z planes only...) set the group to hidden
                group.levelVisible = proj.z >= 0 && proj.z < 1.0;

                let s = this.scale;
                group.x = Math.round(proj.x / s);
                group.y = Math.round((rh - proj.y) / s);
            }

            // If it's a WorldSpaceCanvas and it's tracking a node, let's update the WSC transformation data
            if (this._trackNode) {
                let rot: Quaternion = null;
                let scale: Vector3 = null;

                let worldmtx = this._trackNode.getWorldMatrix();
                let pos = worldmtx.getTranslation().add(this._trackNodeOffset);
                let wsc = <WorldSpaceCanvas2D><any>this;
                let wsn = wsc.worldSpaceCanvasNode;

                if (this._trackNodeBillboard) {
                    let viewMtx = cam.getViewMatrix().clone().invert();
                    viewMtx.decompose(Canvas2D.tS, Canvas2D.tR, Canvas2D.tT);
                    rot = Canvas2D.tR.clone();
                }

                worldmtx.decompose(Canvas2D.tS, Canvas2D.tR, Canvas2D.tT);
                let mtx = Matrix.Compose(Canvas2D.tS, Canvas2D.tR, Vector3.Zero());
                pos = worldmtx.getTranslation().add(Vector3.TransformCoordinates(this._trackNodeOffset, mtx));

                if (Canvas2D.tS.lengthSquared() !== 1) {
                    scale = Canvas2D.tS.clone();
                }

                if (!this._trackNodeBillboard) {
                    rot = Canvas2D.tR.clone();
                }

                if (wsn instanceof AbstractMesh) {
                    wsn.position = pos;
                    wsn.rotationQuaternion = rot;
                    if (scale) {
                        wsn.scaling = scale;
                    }
                } else {
                    throw new Error("Can't Track another Scene Node Type than AbstractMesh right now, call me lazy!");
                }
            }
        }

        /**
         * Call this method change you want to have layout related data computed and up to date (layout area, primitive area, local/global transformation matrices)
         */
        public updateCanvasLayout(forceRecompute: boolean) {
            this._updateCanvasState(forceRecompute);
        }

        private _updateAdaptiveSizeWorldCanvas() {
            if (this._globalTransformStep < 2) {
                return;
            }
            let n: AbstractMesh = <AbstractMesh>this.worldSpaceCanvasNode;
            let bi = n.getBoundingInfo().boundingBox;
            let v = bi.vectorsWorld;

            let cam = this.scene.cameraToUseForPointers || this.scene.activeCamera;

            cam.getViewMatrix().multiplyToRef(cam.getProjectionMatrix(), Canvas2D._m);
            let vp = cam.viewport.toGlobal(this.engine.getRenderWidth(), this.engine.getRenderHeight());


            let projPoints = new Array<Vector3>(4);
            for (let i = 0; i < 4; i++) {
                projPoints[i] = Vector3.Project(v[i], Canvas2D._mI, Canvas2D._m, vp);
            }

            let left   = projPoints[3].subtract(projPoints[0]).length();
            let top    = projPoints[3].subtract(projPoints[1]).length();
            let right  = projPoints[1].subtract(projPoints[2]).length();
            let bottom = projPoints[2].subtract(projPoints[0]).length();

            let w = Math.round(Math.max(top, bottom));
            let h = Math.round(Math.max(right, left));

            let isW = w > h;

            // Basically if it's under 256 we use 256, otherwise we take the biggest power of 2
            let edge = Math.max(w, h);
            if (edge < 256) {
                edge = 256;
            } else {
                edge = Math.pow(2, Math.ceil(Math.log(edge) / Math.log(2)));
            }

            // Clip values if needed
            edge = Math.min(edge, this._maxAdaptiveWorldSpaceCanvasSize-4); // -4 is to consider the border of 2 pixels, other we couldn't allocate a rect

            let newScale = edge / ((isW) ? this.size.width : this.size.height);
            if (newScale !== this._renderableData._renderingScale) {
                let scale = newScale;
                //console.log(`New adaptive scale for Canvas ${this.id}, w: ${w}, h: ${h}, scale: ${scale}, edge: ${edge}, isW: ${isW}`);
                this._setRenderingScale(scale);
            }
        }
        private static _pCLS = Vector2.Zero();

        private _updateCanvasState(forceRecompute: boolean) {
            // Check if the update has already been made for this render Frame
            if (!forceRecompute && this.scene.getRenderId() === this._updateRenderId) {
                return;
            }

            // Detect a change of HWRendering scale
            let hwsl = this.engine.getHardwareScalingLevel();
            this._curHWScale = hwsl;

            // Detect a change of rendering size
            let renderingSizeChanged = false;
            let newWidth = this.engine.getRenderWidth() * hwsl;
            if (newWidth !== this._renderingSize.width) {
                renderingSizeChanged = true;
            }
            this._renderingSize.width = newWidth;

            let newHeight = this.engine.getRenderHeight() * hwsl;
            if (newHeight !== this._renderingSize.height) {
                renderingSizeChanged = true;
            }
            this._renderingSize.height = newHeight;

            let prevCLS = Canvas2D._pCLS;
            prevCLS.copyFrom(this._canvasLevelScale);

            // If there's a design size, update the scale according to the renderingSize
            if (this._designSize) {
                let scale: number;
                if (this._designUseHorizAxis) {
                    scale = this._renderingSize.width / (this._designSize.width * hwsl);
                } else {
                    scale = this._renderingSize.height / (this._designSize.height * hwsl);
                }
                this.size = this._designSize.clone();
                this._canvasLevelScale.copyFromFloats(scale, scale);
            } else {
                let ratio = 1 / this._curHWScale;
                this._canvasLevelScale.copyFromFloats(ratio, ratio);
            }

            if (!prevCLS.equals(this._canvasLevelScale)) {
                for (let child of this.children) {
                    child._setFlags(SmartPropertyPrim.flagLocalTransformDirty|SmartPropertyPrim.flagGlobalTransformDirty);
                }
                this._setLayoutDirty();
            }

            // If the canvas fit the rendering size and it changed, update
            if (renderingSizeChanged && this._fitRenderingDevice) {
                this.size = this._renderingSize.clone();
                if (this._background) {
                    this._background.size = this.size;
                }

                // Dirty the Layout at the Canvas level to recompute as the size changed
                this._setLayoutDirty();
            }

            var context = new PrepareRender2DContext();

            ++this._globalTransformProcessStep;
            this._setFlags(SmartPropertyPrim.flagLocalTransformDirty|SmartPropertyPrim.flagGlobalTransformDirty);
            this.updateCachedStates(false);

            this._prepareGroupRender(context);

            this._updateRenderId = this.scene.getRenderId();
        }

        /**
         * Method that renders the Canvas, you should not invoke
         */
        @logMethod("==========CANVAS RENDER===============")
        private _render() {
            this._initPerfMetrics();

            if (this._renderObservable && this._renderObservable.hasObservers()) {
                this._renderObservable.notifyObservers(this, Canvas2D.RENDEROBSERVABLE_PRE);
            }

            this._updateCanvasState(false);

            this._updateTrackedNodes();

            // Nothing to do is the Canvas is not visible
            if (this.isVisible === false) {
                return;
            }

            if (!this._isScreenSpace) {
                this._updateAdaptiveSizeWorldCanvas();
            }

            this._updateCanvasState(false);

            if (this._primitiveCollisionManager) {
                this._primitiveCollisionManager._update();
            }

            if (this._primPointerInfo.canvasPointerPos) {
                this._updateIntersectionList(this._primPointerInfo.canvasPointerPos, false, false);
                this._updateOverStatus(false);
            }

            this.engine.setState(false, undefined, true);
            this._groupRender();

            if (!this._isScreenSpace) {
                if (this._isFlagSet(SmartPropertyPrim.flagWorldCacheChanged)) {
                    this.worldSpaceCacheChanged();
                    this._clearFlags(SmartPropertyPrim.flagWorldCacheChanged);
                }
            }

            // If the canvas is cached at canvas level, we must manually render the sprite that will display its content
            if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_CANVAS && this._cachedCanvasGroup) {
                this._cachedCanvasGroup._renderCachedCanvas();
            }

            this._fetchPerfMetrics();
            this._updateProfileCanvas();

            if (this._renderObservable && this._renderObservable.hasObservers()) {
                this._renderObservable.notifyObservers(this, Canvas2D.RENDEROBSERVABLE_POST);
            }
        }

        /**
         * Internal method that allocate a cache for the given group.
         * Caching is made using a collection of MapTexture where many groups have their bitmap cache stored inside.
         * @param group The group to allocate the cache of.
         * @return custom type with the PackedRect instance giving information about the cache location into the texture and also the MapTexture instance that stores the cache.
         */
        public _allocateGroupCache(group: Group2D, parent: Group2D, minSize?: Size, useMipMap: boolean = false, anisotropicLevel: number = 1): { node: PackedRect, texture: MapTexture, sprite: Sprite2D } {

            let key = `${useMipMap ? "MipMap" : "NoMipMap"}_${anisotropicLevel}`;

            let rd = group._renderableData;
            let rs = rd._renderingScale;
            let noResizeScale = rd._noResizeOnScale;
            let isCanvas = parent == null;
            let scale: Vector2;
            if (noResizeScale) {
                scale = isCanvas ? Canvas2D._unS : group.parent.actualScale.multiply(this._canvasLevelScale);
            } else {
                scale = group.actualScale.multiply(this._canvasLevelScale);
            }
            scale.x *= rs;
            scale.y *= rs;

            // Determine size
            let size = group.actualSize;
            let scaledSize = new Size(size.width * scale.x, size.height * scale.y);
            let roundedScaledSize = new Size(Math.ceil(scaledSize.width), Math.ceil(scaledSize.height));
            let originalSize = scaledSize.clone();
            if (minSize) {
                roundedScaledSize.width = Math.max(minSize.width, roundedScaledSize.width);
                roundedScaledSize.height = Math.max(minSize.height, roundedScaledSize.height);
            }

            let mapArray = this._groupCacheMaps.getOrAddWithFactory(key, () => new Array<MapTexture>());

            // Try to find a spot in one of the cached texture
            let res = null;
            var map: MapTexture;
            for (var _map of mapArray) {
                map = _map;
                let node = map.allocateRect(roundedScaledSize);
                if (node) {
                    res = { node: node, texture: map }
                    break;
                }
            }

            // Couldn't find a map that could fit the rect, create a new map for it
            if (!res) {
                let mapSize = new Size(Canvas2D._groupTextureCacheSize, Canvas2D._groupTextureCacheSize);

                // Check if the predefined size would fit, other create a custom size using the nearest bigger power of 2
                if (roundedScaledSize.width > mapSize.width || roundedScaledSize.height > mapSize.height) {
                    mapSize.width = Math.pow(2, Math.ceil(Math.log(roundedScaledSize.width) / Math.log(2)));
                    mapSize.height = Math.pow(2, Math.ceil(Math.log(roundedScaledSize.height) / Math.log(2)));
                }

                let id = `groupsMapChache${this._mapCounter++}forCanvas${this.id}`;
                map = new MapTexture(id, this._scene, mapSize, useMipMap ? Texture.TRILINEAR_SAMPLINGMODE : Texture.BILINEAR_SAMPLINGMODE, useMipMap, 2);
                map.hasAlpha = true;
                map.anisotropicFilteringLevel = 4;
                mapArray.splice(0, 0, map);

                //let debug = false;

                //if (debug) {
                //    let sprite = new Sprite2D(map, { parent: this, x: 10, y: 10, id: "__cachedSpriteOfGroup__Debug", alignToPixel: true });
                //}

                let node = map.allocateRect(roundedScaledSize);
                res = { node: node, texture: map }
            }

            // Check if we have to create a Sprite that will display the content of the Canvas which is cached.
            // Don't do it in case of the group being a worldspace canvas (because its texture is bound to a WorldSpaceCanvas node)
            if (group !== <any>this || this._isScreenSpace) {
                let node: PackedRect = res.node;
                let pos = Canvas2D._cv1;
                node.getInnerPosToRef(pos);

                // Special case if the canvas is entirely cached: create a group that will have a single sprite it will be rendered specifically at the very end of the rendering process

                let sprite: Sprite2D;
                if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_CANVAS) {
                    if (this._cachedCanvasGroup) {
                        this._cachedCanvasGroup.dispose();
                    }
                    this._cachedCanvasGroup = Group2D._createCachedCanvasGroup(this);
                    sprite = new Sprite2D(map, { parent: this._cachedCanvasGroup, id: "__cachedCanvasSprite__", spriteSize: originalSize, size: size, alignToPixel: true, spriteLocation: pos });
                    sprite.zOrder = 1;
                    sprite.origin = Vector2.Zero();
                }

                // Create a Sprite that will be used to render this cache, the "__cachedSpriteOfGroup__" starting id is a hack to bypass exception throwing in case of the Canvas doesn't normally allows direct primitives
                else {
                    sprite = new Sprite2D(map, { parent: parent, id: `__cachedSpriteOfGroup__${group.id}`, x: group.x, y: group.y, spriteSize: originalSize, size: size, spriteLocation: pos, alignToPixel: true, dontInheritParentScale: true });
                    sprite.origin = group.origin.clone();
                    sprite.addExternalData("__cachedGroup__", group);
                    sprite.pointerEventObservable.add((e, s) => {
                        if (group.pointerEventObservable !== null) {
                            group.pointerEventObservable.notifyObservers(e, s.mask);
                        }
                    });
                    res.sprite = sprite;
                }
                if (sprite && noResizeScale) {
                    let relScale = isCanvas ? group.actualScale : group.actualScale.divide(group.parent.actualScale);
                    sprite.scaleX = relScale.x;
                    sprite.scaleY = relScale.y;
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
         * Internal method used to register a Scene Node to track position for the given group
         * Do not invoke this method, for internal purpose only.
         * @param group the group to track its associated Scene Node
         */
        public _registerTrackedNode(group: Group2D) {
            if (group._isFlagSet(SmartPropertyPrim.flagTrackedGroup)) {
                return;
            }
            if (!this._trackedGroups) {
                this._trackedGroups = new Array<Group2D>();
            }
            this._trackedGroups.push(group);

            group._setFlags(SmartPropertyPrim.flagTrackedGroup);
        }

        /**
         * Internal method used to unregister a tracked Scene Node
         * Do not invoke this method, it's for internal purpose only.
         * @param group the group to unregister its tracked Scene Node from.
         */
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

        /**
         * Get a Gradient Color Brush
         * @param color1 starting color
         * @param color2 engine color
         * @param translation translation vector to apply. default is [0;0]
         * @param rotation rotation in radian to apply to the brush, initial direction is top to bottom. rotation is counter clockwise. default is 0.
         * @param scale scaling factor to apply. default is 1.
         */
        public static GetGradientColorBrush(color1: Color4, color2: Color4, translation: Vector2 = Vector2.Zero(), rotation: number = 0, scale: number = 1): IBrush2D {
            return Canvas2D._gradientColorBrushes.getOrAddWithFactory(GradientColorBrush2D.BuildKey(color1, color2, translation, rotation, scale), () => new GradientColorBrush2D(color1, color2, translation, rotation, scale, true));
        }

        /**
         * Create a solid or gradient brush from a string value.
         * @param brushString should be either
         *  - "solid: #RRGGBBAA" or "#RRGGBBAA"
         *  - "gradient: #FF808080, #FFFFFFF[, [10:20], 180, 1]" for color1, color2, translation, rotation (degree), scale. The last three are optionals, but if specified must be is this order. "gradient:" can be omitted.
         */
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

    @className("WorldSpaceCanvas2D", "BABYLON")
    /**
     * Class to create a WorldSpace Canvas2D.
     */
    export class WorldSpaceCanvas2D extends Canvas2D {
        /**
         * Create a new 2D WorldSpace Rendering Canvas, it is a 2D rectangle that has a size (width/height) and a world transformation information to place it in the world space.
         * This kind of canvas can't have its Primitives directly drawn in the Viewport, they need to be cached in a bitmap at some point, as a consequence the DONT_CACHE strategy is unavailable. For now only CACHESTRATEGY_CANVAS is supported, but the remaining strategies will be soon.
         * @param scene the Scene that owns the Canvas
         * @param size the dimension of the Canvas in World Space
         * @param settings a combination of settings, possible ones are
         * - children: an array of direct children primitives
         * - id: a text identifier, for information purpose only, default is null.
         * - unitScaleFactor: if specified the created canvas will be with a width of size.width*unitScaleFactor and a height of size.height.unitScaleFactor. If not specified, the unit of 1 is used. You can use this setting when you're dealing with a 3D world with small coordinates and you need a Canvas having bigger coordinates (typically to display text with better quality).
         * - worldPosition the position of the Canvas in World Space, default is [0,0,0]
         * - worldRotation the rotation of the Canvas in World Space, default is Quaternion.Identity()
         * - trackNode: if you want the WorldSpaceCanvas to track the position/rotation/scale of a given Scene Node, use this setting to specify the Node to track
         * - trackNodeOffset: if you use trackNode you may want to specify a 3D Offset to apply to shift the Canvas
         * - trackNodeBillboard: if true the WorldSpaceCanvas will always face the screen
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
        constructor(scene: Scene, size: Size, settings?: {

            children                 ?: Array<Prim2DBase>,
            id                       ?: string,
            unitScaleFactor          ?: number,
            worldPosition            ?: Vector3,
            worldRotation            ?: Quaternion,
            trackNode                ?: Node,
            trackNodeOffset          ?: Vector3,
            trackNodeBillboard       ?: boolean,
            sideOrientation          ?: number,
            cachingStrategy          ?: number,
            enableInteraction        ?: boolean,
            isVisible                ?: boolean,
            backgroundRoundRadius    ?: number,
            backgroundFill           ?: IBrush2D | string,
            backgroundBorder         ?: IBrush2D | string,
            backgroundBorderThickNess?: number,
            customWorldSpaceNode     ?: Node,
            maxAdaptiveCanvasSize    ?: number,
            paddingTop               ?: number | string,
            paddingLeft              ?: number | string,
            paddingRight             ?: number | string,
            paddingBottom            ?: number | string,
            padding                  ?: string,

        }) {
            Prim2DBase._isCanvasInit = true;
            let s = <any>settings;
            s.isScreenSpace = false;
            if (settings.unitScaleFactor != null) {
                s.size = size.multiplyByFloats(settings.unitScaleFactor, settings.unitScaleFactor);
            } else {
                s.size = size.clone();
            }
            settings.cachingStrategy = (settings.cachingStrategy == null) ? Canvas2D.CACHESTRATEGY_CANVAS : settings.cachingStrategy;

            if (settings.cachingStrategy !== Canvas2D.CACHESTRATEGY_CANVAS) {
                throw new Error("Right now only the CACHESTRATEGY_CANVAS cache Strategy is supported for WorldSpace Canvas. More will come soon!");
            }

            super(scene, settings);
            Prim2DBase._isCanvasInit = false;

            this._unitScaleFactor = (settings.unitScaleFactor != null) ? settings.unitScaleFactor : 1;

            this._renderableData._useMipMap = true;
            this._renderableData._anisotropicLevel = 8;

            //if (cachingStrategy === Canvas2D.CACHESTRATEGY_DONTCACHE) {
            //    throw new Error("CACHESTRATEGY_DONTCACHE cache Strategy can't be used for WorldSpace Canvas");
            //}

            this._trackNode          = (settings.trackNode != null)          ? settings.trackNode          : null;
            this._trackNodeOffset    = (settings.trackNodeOffset != null)    ? settings.trackNodeOffset    : Vector3.Zero();
            this._trackNodeBillboard = (settings.trackNodeBillboard != null) ? settings.trackNodeBillboard : true;

            let createWorldSpaceNode = !settings || (settings.customWorldSpaceNode == null);
            this._customWorldSpaceNode = !createWorldSpaceNode;
            let id = settings ? settings.id || null : null;

            // Set the max size of texture allowed for the adaptive render of the world space canvas cached bitmap
            let capMaxTextSize = this.engine.getCaps().maxRenderTextureSize;
            let defaultTextSize = (Math.min(capMaxTextSize, 1024));     // Default is 1K if allowed otherwise the max allowed
            if (settings.maxAdaptiveCanvasSize == null) {
                this._maxAdaptiveWorldSpaceCanvasSize = defaultTextSize;
            } else {
                // We still clip the given value with the max allowed, the user may not be aware of these limitations
                this._maxAdaptiveWorldSpaceCanvasSize = Math.min(settings.maxAdaptiveCanvasSize, capMaxTextSize);
            }

            if (createWorldSpaceNode) {
                let plane = new WorldSpaceCanvas2DNode(id, scene, this);
                let vertexData = VertexData.CreatePlane({
                    width: size.width,
                    height: size.height,
                    sideOrientation: settings && settings.sideOrientation || Mesh.DEFAULTSIDE
                });
                let mtl = new StandardMaterial(id + "_Material", scene);

                this.applyCachedTexture(vertexData, mtl);
                vertexData.applyToMesh(plane, true);

                mtl.specularColor = new Color3(0, 0, 0);
                mtl.disableLighting = true;
                mtl.useAlphaFromDiffuseTexture = true;
                if (settings && settings.sideOrientation) {
                    mtl.backFaceCulling = (settings.sideOrientation === Mesh.DEFAULTSIDE || settings.sideOrientation === Mesh.FRONTSIDE);
                }
                plane.position = settings && settings.worldPosition || Vector3.Zero();
                plane.rotationQuaternion = settings && settings.worldRotation || Quaternion.Identity();
                plane.material = mtl;
                this._worldSpaceNode = plane;
            } else {
                this._worldSpaceNode = settings.customWorldSpaceNode;
                this.applyCachedTexture(null, null);
            }

            this.propertyChanged.add((e, st) => {
                if (e.propertyName !== "isVisible") {
                    return;
                }
                let mesh = this._worldSpaceNode as AbstractMesh;
                if (mesh) {
                    mesh.isVisible = e.newValue;
                }
            }, Prim2DBase.isVisibleProperty.flagId);
        }

        public dispose(): boolean {
            if (!super.dispose()) {
                return false;
            }

            if (!this._customWorldSpaceNode && this._worldSpaceNode) {
                this._worldSpaceNode.dispose();
                this._worldSpaceNode = null;
            }
        }

        public get trackNode(): Node {
            return this._trackNode;
        }

        public set trackNode(value: Node) {
            if (this._trackNode === value) {
                return;
            }

            this._trackNode = value;
        }

        public get trackNodeOffset(): Vector3 {
            return this._trackNodeOffset;
        }

        public set trackNodeOffset(value: Vector3) {
            if (!this._trackNodeOffset) {
                this._trackNodeOffset = value.clone();
            } else {
                this._trackNodeOffset.copyFrom(value);
            }
        }

        public get trackNodeBillboard(): boolean {
            return this._trackNodeBillboard;
        }

        public set trackNodeBillboard(value: boolean) {
            this._trackNodeBillboard = value;
        }

        private _customWorldSpaceNode: boolean;
    }

    @className("ScreenSpaceCanvas2D", "BABYLON")
    /**
     * Class to create a ScreenSpace Canvas2D
     */
    export class ScreenSpaceCanvas2D extends Canvas2D {
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
         *  - renderingPhase: you can specify for which camera and which renderGroup this canvas will render to enable interleaving of 3D/2D content through the use of renderinGroup. As a rendering Group is rendered for each camera, you have to specify in the scope of which camera you want the canvas' render to be made. Default behavior will render the Canvas at the very end of the render loop.
         *  - designSize: if you want to set the canvas content based on fixed coordinates whatever the final canvas dimension would be, set this. For instance a designSize of 360*640 will give you the possibility to specify all the children element in this frame. The Canvas' true size will be the HTMLCanvas' size: for instance it could be 720*1280, then a uniform scale of 2 will be applied on the Canvas to keep the absolute coordinates working as expecting. If the ratios of the designSize and the true Canvas size are not the same, then the scale is computed following the designUseHorizAxis member by using either the size of the horizontal axis or the vertical axis.
         *  - designUseHorizAxis: you can set this member if you use designSize to specify which axis is priority to compute the scale when the ratio of the canvas' size is different from the designSize's one.
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
        constructor(scene: Scene, settings?: {

            children                   ?: Array<Prim2DBase>,
            id                         ?: string,
            x                          ?: number,
            y                          ?: number,
            position                   ?: Vector2,
            origin                     ?: Vector2,
            width                      ?: number,
            height                     ?: number,
            size                       ?: Size,
            renderingPhase             ?: {camera: Camera, renderingGroupID: number },
            designSize                 ?: Size,
            designUseHorizAxis         ?: boolean,
            cachingStrategy            ?: number,
            cacheBehavior              ?: number,
            enableInteraction          ?: boolean,
            enableCollisionManager     ?: boolean,
            customCollisionManager     ?: (owner: Canvas2D, enableBorders: boolean) => PrimitiveCollisionManagerBase,
            collisionManagerUseBorders ?: boolean,
            isVisible                  ?: boolean,
            backgroundRoundRadius      ?: number,
            backgroundFill             ?: IBrush2D | string,
            backgroundBorder           ?: IBrush2D | string,
            backgroundBorderThickNess  ?: number,
            paddingTop                 ?: number | string,
            paddingLeft                ?: number | string,
            paddingRight               ?: number | string,
            paddingBottom              ?: number | string,
            padding                    ?: string,

        }) {
            Prim2DBase._isCanvasInit = true;
            super(scene, settings);
        }
    }

}
