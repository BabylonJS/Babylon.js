module BABYLON {

    export class Render2DContext {
        forceRefreshPrimitive: boolean;
    }

    /**
     * This class store information for the pointerEventObservable Observable.
     * The Observable is divided into many sub events (using the Mask feature of the Observable pattern): PointerOver, PointerEnter, PointerDown, PointerMouseWheel, PointerMove, PointerUp, PointerDown, PointerLeave, PointerGotCapture and PointerLostCapture.
     */
    export class PrimitivePointerInfo {
        private static _pointerOver        = 0x0001;
        private static _pointerEnter       = 0x0002;
        private static _pointerDown        = 0x0004;
        private static _pointerMouseWheel  = 0x0008;
        private static _pointerMove        = 0x0010;
        private static _pointerUp          = 0x0020;
        private static _pointerOut         = 0x0040;
        private static _pointerLeave       = 0x0080;
        private static _pointerGotCapture  = 0x0100;
        private static _pointerLostCapture = 0x0200;

        private static _mouseWheelPrecision = 3.0;

        // The behavior is based on the HTML specifications of the Pointer Events (https://www.w3.org/TR/pointerevents/#list-of-pointer-events). This is not 100% compliant and not meant to be, but still, it's based on these specs for most use cases to be programmed the same way (as closest as possible) as it would have been in HTML.

        /**
         * This event type is raised when a pointing device is moved into the hit test boundaries of a primitive.
         * Bubbles: yes
         */
        public static get PointerOver(): number {
            return PrimitivePointerInfo._pointerOver;
        }

        /**
         * This event type is raised when a pointing device is moved into the hit test boundaries of a primitive or one of its descendants.
         * Bubbles: no
         */
        public static get PointerEnter(): number {
            return PrimitivePointerInfo._pointerEnter;
        }

        /**
         * This event type is raised when a pointer enters the active button state (non-zero value in the buttons property). For mouse it's when the device transitions from no buttons depressed to at least one button depressed. For touch/pen this is when a physical contact is made.
         * Bubbles: yes
         */
        public static get PointerDown(): number {
            return PrimitivePointerInfo._pointerDown;
        }

        /**
         * This event type is raised when the pointer is a mouse and it's wheel is rolling
         * Bubbles: yes
         */
        public static get PointerMouseWheel(): number {
            return PrimitivePointerInfo._pointerMouseWheel;
        }

        /**
         * This event type is raised when a pointer change coordinates or when a pointer changes button state, pressure, tilt, or contact geometry and the circumstances produce no other pointers events.
         * Bubbles: yes
         */
        public static get PointerMove(): number {
            return PrimitivePointerInfo._pointerMove;
        }

        /**
         * This event type is raised when the pointer leaves the active buttons states (zero value in the buttons property). For mouse, this is when the device transitions from at least one button depressed to no buttons depressed. For touch/pen, this is when physical contact is removed.
         * Bubbles: yes
         */
        public static get PointerUp(): number {
            return PrimitivePointerInfo._pointerUp;
        }

        /**
         * This event type is raised when a pointing device is moved out of the hit test the boundaries of a primitive.
         * Bubbles: yes
         */
        public static get PointerOut(): number {
            return PrimitivePointerInfo._pointerOut;
        }

        /**
         * This event type is raised when a pointing device is moved out of the hit test boundaries of a primitive and all its descendants.
         * Bubbles: no
         */
        public static get PointerLeave(): number {
            return PrimitivePointerInfo._pointerLeave;
        }

        /**
         * This event type is raised when a primitive receives the pointer capture. This event is fired at the element that is receiving pointer capture. Subsequent events for that pointer will be fired at this element.
         * Bubbles: yes
         */
        public static get PointerGotCapture(): number {
            return PrimitivePointerInfo._pointerGotCapture;
        }

        /**
         * This event type is raised after pointer capture is released for a pointer.
         * Bubbles: yes
         */
        public static get PointerLostCapture(): number {
            return PrimitivePointerInfo._pointerLostCapture;
        }

        public static get MouseWheelPrecision(): number {
            return PrimitivePointerInfo._mouseWheelPrecision;
        }

        /**
         * Event Type, one of the static PointerXXXX property defined above (PrimitivePointerInfo.PointerOver to PrimitivePointerInfo.PointerLostCapture)
         */
        eventType: number;

        /**
         * Position of the pointer relative to the bottom/left of the Canvas
         */
        canvasPointerPos: Vector2;

        /**
         * Position of the pointer relative to the bottom/left of the primitive that registered the Observer
         */
        primitivePointerPos: Vector2;

        /**
         * The primitive where the event was initiated first (in case of bubbling)
         */
        relatedTarget: Prim2DBase;

        /**
         * Position of the pointer relative to the bottom/left of the relatedTarget
         */
        relatedTargetPointerPos: Vector2;

        /**
         * An observable can set this property to true to stop bubbling on the upper levels
         */
        cancelBubble: boolean;

        /**
         * True if the Control keyboard key is down
         */
        ctrlKey: boolean;

        /**
         * true if the Shift keyboard key is down
         */
        shiftKey: boolean;

        /**
         * true if the Alt keyboard key is down
         */
        altKey: boolean;

        /**
         * true if the Meta keyboard key is down
         */
        metaKey: boolean;

        /**
         * For button, buttons, refer to https://www.w3.org/TR/pointerevents/#button-states
         */
        button: number;
        /**
         * For button, buttons, refer to https://www.w3.org/TR/pointerevents/#button-states
         */
        buttons: number;

        /**
         * The amount of mouse wheel rolled
         */
        mouseWheelDelta: number;

        /**
         * Id of the Pointer involved in the event
         */
        pointerId: number;
        width: number;
        height: number;
        presssure: number;
        tilt: Vector2;

        /**
         * true if the involved pointer is captured for a particular primitive, false otherwise.
         */
        isCaptured: boolean;

        constructor() {
            this.primitivePointerPos = Vector2.Zero();
            this.tilt = Vector2.Zero();
            this.cancelBubble = false;
        }

        updateRelatedTarget(prim: Prim2DBase, primPointerPos: Vector2) {
            this.relatedTarget = prim;
            this.relatedTargetPointerPos = primPointerPos;
        }

        public static getEventTypeName(mask: number): string {
            switch (mask) {
                case PrimitivePointerInfo.PointerOver:        return "PointerOver";
                case PrimitivePointerInfo.PointerEnter:       return "PointerEnter";
                case PrimitivePointerInfo.PointerDown:        return "PointerDown";
                case PrimitivePointerInfo.PointerMouseWheel:  return "PointerMouseWheel";
                case PrimitivePointerInfo.PointerMove:        return "PointerMove";
                case PrimitivePointerInfo.PointerUp:          return "PointerUp";
                case PrimitivePointerInfo.PointerOut:         return "PointerOut";
                case PrimitivePointerInfo.PointerLeave:       return "PointerLeave";
                case PrimitivePointerInfo.PointerGotCapture:  return "PointerGotCapture";
                case PrimitivePointerInfo.PointerLostCapture: return "PointerLostCapture";
            }
        }
    }

    /**
     * Stores information about a Primitive that was intersected
     */
    export class PrimitiveIntersectedInfo {
        constructor(public prim: Prim2DBase, public intersectionLocation: Vector2) {
            
        }
    }

    /**
     * Main class used for the Primitive Intersection API
     */
    export class IntersectInfo2D {
        constructor() {
            this.findFirstOnly = false;
            this.intersectHidden = false;
            this.pickPosition = Vector2.Zero();
        }

        // Input settings, to setup before calling an intersection related method

        /**
         * Set the pick position, relative to the primitive where the intersection test is made
         */
        public pickPosition: Vector2;

        /**
         * If true the intersection will stop at the first hit, if false all primitives will be tested and the intersectedPrimitives array will be filled accordingly (false default)
         */
        public findFirstOnly: boolean;

        /**
         * If true the intersection test will also be made on hidden primitive (false default)
         */
        public intersectHidden: boolean;

        // Intermediate data, don't use!
        public _globalPickPosition: Vector2;
        public _localPickPosition: Vector2;

        // Output settings, up to date in return of a call to an intersection related method

        /**
         * The topmost intersected primitive
         */
        public topMostIntersectedPrimitive: PrimitiveIntersectedInfo;

        /**
         * The array containing all intersected primitive, in no particular order.
         */
        public intersectedPrimitives: Array<PrimitiveIntersectedInfo>;

        /**
         * true if at least one primitive intersected during the test
         */
        public get isIntersected(): boolean {
            return this.intersectedPrimitives && this.intersectedPrimitives.length > 0;
        }

        // Internals, don't use
        public _exit(firstLevel: boolean) {
            if (firstLevel) {
                this._globalPickPosition = null;
            }
        }
    }

    @className("Prim2DBase")
    /**
     * Base class for a Primitive of the Canvas2D feature
     */
    export class Prim2DBase extends SmartPropertyPrim {
        static PRIM2DBASE_PROPCOUNT: number = 10;

        protected setupPrim2DBase(owner: Canvas2D, parent: Prim2DBase, id: string, position: Vector2, isVisible: boolean = true) {
            if (!(this instanceof Group2D) && !(this instanceof Sprite2D && id !== null && id.indexOf("__cachedSpriteOfGroup__") === 0) && (owner.cachingStrategy === Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) && (parent === owner)) {
                throw new Error("Can't create a primitive with the canvas as direct parent when the caching strategy is TOPLEVELGROUPS. You need to create a Group below the canvas and use it as the parent for the primitive");
            }

            this.setupSmartPropertyPrim();
            this._pointerEventObservable = new Observable<PrimitivePointerInfo>();
            this._isPickable = true;
            this._siblingDepthOffset = this._hierarchyDepthOffset = 0;
            this._boundingInfoDirty = true;
            this._boundingInfo = new BoundingInfo2D();
            this._owner = owner;
            this._parent = parent;
            if (parent != null) {
                this._hierarchyDepth = parent._hierarchyDepth + 1;
                this._renderGroup = <Group2D>this.parent.traverseUp(p => p instanceof Group2D && p.isRenderableGroup);
                parent.addChild(this);
            } else {
                this._hierarchyDepth = 0;
                this._renderGroup = null;
            }

            this._id = id;
            this.propertyChanged = new Observable<PropertyChangedInfo>();
            this._children = new Array<Prim2DBase>();
            this._globalTransformProcessStep = 0;
            this._globalTransformStep = 0;

            if (this instanceof Group2D) {
                var group: any = this;
                group.detectGroupStates();
            }

            this.position = position;
            this.rotation = 0;
            this.scale = 1;
            this.levelVisible = isVisible;
            this.origin = new Vector2(0.5, 0.5);
        }


        public get actionManager(): ActionManager {
            if (!this._actionManager) {
                this._actionManager = new ActionManager(this.owner.scene);
            }
            return this._actionManager;
        }

        /**
         * From 'this' primitive, traverse up (from parent to parent) until the given predicate is true
         * @param predicate the predicate to test on each parent
         * @return the first primitive where the predicate was successful
         */
        public traverseUp(predicate: (p: Prim2DBase) => boolean): Prim2DBase {
            let p: Prim2DBase = this;
            while (p != null) {
                if (predicate(p)) {
                    return p;
                }
                p = p._parent;
            }
            return null;
        }

        /**
         * Retrieve the owner Canvas2D
         */
        public get owner(): Canvas2D {
            return this._owner;
        }

        /**
         * Get the parent primitive (can be the Canvas, only the Canvas has no parent)
         */
        public get parent(): Prim2DBase {
            return this._parent;
        }

        /**
         * The array of direct children primitives
         */
        public get children(): Prim2DBase[] {
            return this._children;
        }

        /**
         * The identifier of this primitive, may not be unique, it's for information purpose only
         */
        public get id(): string {
            return this._id;
        }

        /**
         * Metadata of the position property
         */
        public static positionProperty: Prim2DPropInfo;

        /**
         * Metadata of the rotation property
         */
        public static rotationProperty: Prim2DPropInfo;

        /**
         * Metadata of the scale property
         */
        public static scaleProperty: Prim2DPropInfo;

        /**
         * Metadata of the origin property
         */
        public static originProperty: Prim2DPropInfo;

        /**
         * Metadata of the levelVisible property
         */
        public static levelVisibleProperty: Prim2DPropInfo;

        /**
         * Metadata of the isVisible property
         */
        public static isVisibleProperty: Prim2DPropInfo;

        /**
         * Metadata of the zOrder property
         */
        public static zOrderProperty: Prim2DPropInfo;

        @instanceLevelProperty(1, pi => Prim2DBase.positionProperty = pi, false, true)
        /**
         * Position of the primitive, relative to its parent.
         */
        public get position(): Vector2 {
            return this._position;
        }

        public set position(value: Vector2) {
            this._position = value;
        }

        @instanceLevelProperty(2, pi => Prim2DBase.rotationProperty = pi, false, true)
        /**
         * Rotation of the primitive, in radian, along the Z axis
         * @returns {} 
         */
        public get rotation(): number {
            return this._rotation;
        }

        public set rotation(value: number) {
            this._rotation = value;
        }

        @instanceLevelProperty(3, pi => Prim2DBase.scaleProperty = pi, false, true)
        /**
         * Uniform scale applied on the primitive
         */
        public set scale(value: number) {
            this._scale = value;
        }

        public get scale(): number {
            return this._scale;
        }

        /**
         * this method must be implemented by the primitive type to return its size
         * @returns The size of the primitive
         */
        public get actualSize(): Size {
            return undefined;
        }

        @instanceLevelProperty(4, pi => Prim2DBase.originProperty = pi, false, true)
        public set origin(value: Vector2) {
            this._origin = value;
        }

        /**
         * The origin defines the normalized coordinate of the center of the primitive, from the top/left corner.
         * The origin is used only to compute transformation of the primitive, it has no meaning in the primitive local frame of reference
         * For instance:
         * 0,0 means the center is bottom/left. Which is the default for Canvas2D instances
         * 0.5,0.5 means the center is at the center of the primitive, which is default of all types of Primitives
         * 0,1 means the center is top/left
         * @returns The normalized center.
         */
        public get origin(): Vector2 {
            return this._origin;
        }

        @dynamicLevelProperty(5, pi => Prim2DBase.levelVisibleProperty = pi)
        /**
         * Let the user defines if the Primitive is hidden or not at its level. As Primitives inherit the hidden status from their parent, only the isVisible property give properly the real visible state.
         * Default is true, setting to false will hide this primitive and its children.
         */
        public get levelVisible(): boolean {
            return this._levelVisible;
        }

        public set levelVisible(value: boolean) {
            this._levelVisible = value;
        }

        @instanceLevelProperty(6, pi => Prim2DBase.isVisibleProperty = pi)
        /**
         * Use ONLY THE GETTER to determine if the primitive is visible or not.
         * The Setter is for internal purpose only!
         */
        public get isVisible(): boolean {
            return this._isVisible;
        }

        public set isVisible(value: boolean) {
            this._isVisible = value;
        }

        @instanceLevelProperty(7, pi => Prim2DBase.zOrderProperty = pi)
        /**
         * You can override the default Z Order through this property, but most of the time the default behavior is acceptable
         * @returns {} 
         */
        public get zOrder(): number {
            return this._zOrder;
        }

        public set zOrder(value: number) {
            this._zOrder = value;
        }

        /**
         * Define if the Primitive can be subject to intersection test or not (default is true)
         */
        public get isPickable(): boolean {
            return this._isPickable;
        }

        public set isPickable(value: boolean) {
            this._isPickable = value;
        }

        /**
         * Return the depth level of the Primitive into the Canvas' Graph. A Canvas will be 0, its direct children 1, and so on.
         * @returns {} 
         */
        public get hierarchyDepth(): number {
            return this._hierarchyDepth;
        }

        /**
         * Retrieve the Group that is responsible to render this primitive
         * @returns {} 
         */
        public get renderGroup(): Group2D {
            return this._renderGroup;
        }

        /**
         * Get the global transformation matrix of the primitive
         */
        public get globalTransform(): Matrix {
            return this._globalTransform;
        }

        /**
         * Get invert of the global transformation matrix of the primitive
         * @returns {} 
         */
        public get invGlobalTransform(): Matrix {
            return this._invGlobalTransform;
        }

        /**
         * Get the local transformation of the primitive
         */
        public get localTransform(): Matrix {
            this._updateLocalTransform();
            return this._localTransform;
        }

        /**
         * Get the boundingInfo associated to the primitive.
         * The value is supposed to be always up to date
         */
        public get boundingInfo(): BoundingInfo2D {
            if (this._boundingInfoDirty) {
                this._boundingInfo = this.levelBoundingInfo.clone();
                let bi = this._boundingInfo;

                var tps = new BoundingInfo2D();
                for (let curChild of this._children) {
                    curChild.boundingInfo.transformToRef(curChild.localTransform, tps);
                    bi.unionToRef(tps, bi);
                }

                this._boundingInfoDirty = false;
            }
            return this._boundingInfo;
        }

        /**
         * Interaction with the primitive can be create using this Observable. See the PrimitivePointerInfo class for more information
         */
        public get pointerEventObservable(): Observable<PrimitivePointerInfo> {
            return this._pointerEventObservable;
        }

        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean {

            return false;
        }

        /**
         * Capture all the Events of the given PointerId for this primitive.
         * Don't forget to call releasePointerEventsCapture when done.
         * @param pointerId the Id of the pointer to capture the events from.
         */
        public setPointerEventCapture(pointerId: number): boolean {
            return this.owner._setPointerCapture(pointerId, this);
        }

        /**
         * Release a captured pointer made with setPointerEventCapture.
         * @param pointerId the Id of the pointer to release the capture from.
         */
        public releasePointerEventsCapture(pointerId: number): boolean {
            return this.owner._releasePointerCapture(pointerId, this);
        }

        /**
         * Make an intersection test with the primitive, all inputs/outputs are stored in the IntersectInfo2D class, see its documentation for more information.
         * @param intersectInfo contains the settings of the intersection to perform, to setup before calling this method as well as the result, available after a call to this method.
         */
        public intersect(intersectInfo: IntersectInfo2D): boolean {
            if (!intersectInfo) {
                return false;
            }

            // If this is null it means this method is call for the first level, initialize stuffs
            let firstLevel = !intersectInfo._globalPickPosition;
            if (firstLevel) {
                // Compute the pickPosition in global space and use it to find the local position for each level down, always relative from the world to get the maximum accuracy (and speed). The other way would have been to compute in local every level down relative to its parent's local, which wouldn't be as accurate (even if javascript number is 80bits accurate).
                intersectInfo._globalPickPosition = Vector2.Zero();
                Vector2.TransformToRef(intersectInfo.pickPosition, this.globalTransform, intersectInfo._globalPickPosition);
                intersectInfo._localPickPosition = intersectInfo.pickPosition.clone();
                intersectInfo.intersectedPrimitives = new Array<PrimitiveIntersectedInfo>();
                intersectInfo.topMostIntersectedPrimitive = null;
            }

            if (!intersectInfo.intersectHidden && !this.isVisible) {
                return false;
            }

            // Fast rejection test with boundingInfo
            if (!this.boundingInfo.doesIntersect(intersectInfo._localPickPosition)) {
                // Important to call this before each return to allow a good recursion next time this intersectInfo is reused
                intersectInfo._exit(firstLevel);
                return false;
            }

            // We hit the boundingInfo that bounds this primitive and its children, now we have to test on the primitive of this level
            let levelIntersectRes = this.levelIntersect(intersectInfo);
            if (levelIntersectRes) {
                let pii = new PrimitiveIntersectedInfo(this, intersectInfo._localPickPosition.clone());
                intersectInfo.intersectedPrimitives.push(pii);
                if (!intersectInfo.topMostIntersectedPrimitive || (intersectInfo.topMostIntersectedPrimitive.prim.getActualZOffset() > pii.prim.getActualZOffset())) {
                    intersectInfo.topMostIntersectedPrimitive = pii;
                }

                // If we must stop at the first intersection, we're done, quit!
                if (intersectInfo.findFirstOnly) {
                    intersectInfo._exit(firstLevel);
                    return true;
                }
            }

            // Recurse to children if needed
            if (!levelIntersectRes || !intersectInfo.findFirstOnly) {
                for (let curChild of this._children) {
                    // Don't test primitive not pick able or if it's hidden and we don't test hidden ones
                    if (!curChild.isPickable || (!intersectInfo.intersectHidden && !curChild.isVisible)) {
                        continue;
                    }

                    // Must compute the localPickLocation for the children level
                    Vector2.TransformToRef(intersectInfo._globalPickPosition, curChild.invGlobalTransform, intersectInfo._localPickPosition);

                    // If we got an intersection with the child and we only need to find the first one, quit!
                    if (curChild.intersect(intersectInfo) && intersectInfo.findFirstOnly) {
                        intersectInfo._exit(firstLevel);
                        return true;
                    }
                }
            }

            intersectInfo._exit(firstLevel);
            return intersectInfo.isIntersected;
        }

        public moveChild(child: Prim2DBase, previous: Prim2DBase): boolean {
            if (child.parent !== this) {
                return false;
            }

            let prevOffset: number, nextOffset: number;
            let childIndex = this._children.indexOf(child);
            let prevIndex = previous ? this._children.indexOf(previous) : -1;

            // Move to first position
            if (!previous) {
                prevOffset = 1;
                nextOffset = this._children[1]._siblingDepthOffset;
            } else {
                prevOffset = this._children[prevIndex]._siblingDepthOffset;
                nextOffset = this._children[prevIndex + 1]._siblingDepthOffset;
            }

            child._siblingDepthOffset = (nextOffset - prevOffset) / 2;

            this._children.splice(prevIndex + 1, 0, this._children.splice(childIndex, 1)[0]);
        }

        private addChild(child: Prim2DBase) {
            child._siblingDepthOffset = (this._children.length + 1) * this.owner.hierarchySiblingZDelta;
            child._depthLevel = this._depthLevel + 1;
            child._hierarchyDepthOffset = child._depthLevel * this.owner.hierarchyLevelZFactor;
            this._children.push(child);

        }

        public dispose(): boolean {
            if (!super.dispose()) {
                return false;
            }

            if (!this._actionManager) {
                this._actionManager.dispose();
                this._actionManager = null;
            }

            // If there's a parent, remove this object from its parent list
            if (this._parent) {
                let i = this._parent._children.indexOf(this);
                if (i !== undefined) {
                    this._parent._children.splice(i, 1);
                }
                this._parent = null;
            }

            // Recurse dispose to children
            if (this._children) {
                while (this._children.length > 0) {
                    this._children[this._children.length - 1].dispose();
                }
            }

            return true;
        }

        public getActualZOffset(): number {
            return this._zOrder || 1 - (this._siblingDepthOffset + this._hierarchyDepthOffset);
        }

        protected onPrimBecomesDirty() {
            if (this._renderGroup) {
                this._renderGroup._addPrimToDirtyList(this);
            }
        }

        public _needPrepare(): boolean {
            return this._visibilityChanged && (this._modelDirty || (this._instanceDirtyFlags !== 0) || (this._globalTransformProcessStep !== this._globalTransformStep));
        }

        public _prepareRender(context: Render2DContext) {
            this._prepareRenderPre(context);
            this._prepareRenderPost(context);
        }

        public _prepareRenderPre(context: Render2DContext) {
        }

        public _prepareRenderPost(context: Render2DContext) {
            // Don't recurse if it's a renderable group, the content will be processed by the group itself
            if (this instanceof Group2D) {
                var self: any = this;
                if (self.isRenderableGroup) {
                    return;
                }
            }

            // Check if we need to recurse the prepare to children primitives
            //  - must have children
            //  - the global transform of this level have changed, or
            //  - the visible state of primitive has changed
            if (this._children.length > 0 && ((this._globalTransformProcessStep !== this._globalTransformStep) ||
                this.checkPropertiesDirty(Prim2DBase.isVisibleProperty.flagId))) {

                this._children.forEach(c => {
                    // As usual stop the recursion if we meet a renderable group
                    if (!(c instanceof Group2D && c.isRenderableGroup)) {
                        c._prepareRender(context);
                    }
                });
            }

            // Finally reset the dirty flags as we've processed everything
            this._modelDirty = false;
            this._instanceDirtyFlags = 0;
        }

        protected static CheckParent(parent: Prim2DBase) {
            if (!parent) {
                throw new Error("A Primitive needs a valid Parent, it can be any kind of Primitives based types, even the Canvas (with the exception that only Group2D can be direct child of a Canvas if the cache strategy used is TOPLEVELGROUPS)");
            }
        }

        protected updateGlobalTransVisOf(list: Prim2DBase[], recurse: boolean) {
            for (let cur of list) {
                cur.updateGlobalTransVis(recurse);
            }
        }

        private _updateLocalTransform(): boolean {
            let tflags = Prim2DBase.positionProperty.flagId | Prim2DBase.rotationProperty.flagId | Prim2DBase.scaleProperty.flagId;
            if (this.checkPropertiesDirty(tflags)) {
                var rot = Quaternion.RotationAxis(new Vector3(0, 0, 1), this._rotation);
                var local = Matrix.Compose(new Vector3(this._scale, this._scale, this._scale), rot, new Vector3(this._position.x, this._position.y, 0));

                this._localTransform = local;
                this.clearPropertiesDirty(tflags);

                // this is important to access actualSize AFTER fetching a first version of the local transform and reset the dirty flag, because accessing actualSize on a Group2D which actualSize is built from its content will trigger a call to this very method on this very object. We won't mind about the origin offset not being computed, as long as we return a local transform based on the position/rotation/scale
                //var actualSize = this.actualSize;
                //if (!actualSize) {
                //    throw new Error(`The primitive type: ${Tools.getClassName(this)} must implement the actualSize get property!`);
                //}

                //local.m[12] -= (actualSize.width * this.origin.x) * local.m[0] + (actualSize.height * this.origin.y) * local.m[4];
                //local.m[13] -= (actualSize.width * this.origin.x) * local.m[1] + (actualSize.height * this.origin.y) * local.m[5];
                return true;
            }
            return false;
        }

        protected updateGlobalTransVis(recurse: boolean) {
            if (this.isDisposed) {
                return;
            }

            // Check if the parent is synced
            if (this._parent && this._parent._globalTransformProcessStep !== this.owner._globalTransformProcessStep) {
                this._parent.updateGlobalTransVis(false);
            }

            // Check if we must update this prim
            if (this === <any>this.owner || this._globalTransformProcessStep !== this.owner._globalTransformProcessStep) {
                let curVisibleState = this.isVisible;
                this.isVisible = (!this._parent || this._parent.isVisible) && this.levelVisible;

                // Detect a change of visibility
                this._visibilityChanged = curVisibleState !== this.isVisible;

                // Get/compute the localTransform
                let localDirty = this._updateLocalTransform();

                // Check if we have to update the globalTransform
                if (!this._globalTransform || localDirty || (this._parent && this._parent._globalTransformStep !== this._parentTransformStep)) {
                    this._globalTransform = this._parent ? this._localTransform.multiply(this._parent._globalTransform) : this._localTransform;
                    this._invGlobalTransform = Matrix.Invert(this._globalTransform);

                    this._globalTransformStep = this.owner._globalTransformProcessStep + 1;
                    this._parentTransformStep = this._parent ? this._parent._globalTransformStep : 0;
                }
                this._globalTransformProcessStep = this.owner._globalTransformProcessStep;
            }
            if (recurse) {
                for (let child of this._children) {
                    // Stop the recursion if we meet a renderable group
                    child.updateGlobalTransVis(!(child instanceof Group2D && child.isRenderableGroup));
                }
            }
        }

        private _owner: Canvas2D;
        private _parent: Prim2DBase;
        private _actionManager: ActionManager;
        protected _children: Array<Prim2DBase>;
        private _renderGroup: Group2D;
        private _hierarchyDepth: number;
        protected _depthLevel: number;
        private _hierarchyDepthOffset: number;
        private _siblingDepthOffset: number;
        private _zOrder: number;
        private _levelVisible: boolean;
        public _pointerEventObservable: Observable<PrimitivePointerInfo>;
        public _boundingInfoDirty: boolean;
        protected _visibilityChanged;
        private _isPickable;
        private _isVisible: boolean;
        private _id: string;
        private _position: Vector2;
        private _rotation: number;
        private _scale: number;
        private _origin: Vector2;

        // Stores the step of the parent for which the current global transform was computed
        // If the parent has a new step, it means this prim's global transform must be updated
        protected _parentTransformStep: number;

        // Stores the step corresponding of the global transform for this prim
        // If a child prim has an older _parentTransformStep it means the child's transform should be updated
        protected _globalTransformStep: number;

        // Stores the previous 
        protected _globalTransformProcessStep: number;
        protected _localTransform: Matrix;
        protected _globalTransform: Matrix;
        protected _invGlobalTransform: Matrix;
    }

}