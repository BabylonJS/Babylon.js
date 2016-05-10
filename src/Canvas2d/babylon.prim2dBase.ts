module BABYLON {

    export class Render2DContext {
        forceRefreshPrimitive: boolean;
    }

    @className("Prim2DBase")
    export class Prim2DBase extends SmartPropertyPrim {
        static PRIM2DBASE_PROPCOUNT: number = 10;

        protected setupPrim2DBase(owner: Canvas2D, parent: Prim2DBase, id: string, position: Vector2, isVisible: boolean = true) {
            if (!(this instanceof Group2D) && !(this instanceof Sprite2D && id !== null && id.indexOf("__cachedSpriteOfGroup__") === 0) && (owner.cachingStrategy === Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) && (parent === owner)) {
                throw new Error("Can't create a primitive with the canvas as direct parent when the caching strategy is TOPLEVELGROUPS. You need to create a Group below the canvas and use it as the parent for the primitive");
            }

            this.setupSmartPropertyPrim();
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

        public get owner(): Canvas2D {
            return this._owner;
        }

        public get parent(): Prim2DBase {
            return this._parent;
        }

        public get id(): string {
            return this._id;
        }

        public static positionProperty: Prim2DPropInfo;
        public static rotationProperty: Prim2DPropInfo;
        public static scaleProperty: Prim2DPropInfo;
        public static originProperty: Prim2DPropInfo;
        public static levelVisibleProperty: Prim2DPropInfo;
        public static isVisibleProperty: Prim2DPropInfo;
        public static zOrderProperty: Prim2DPropInfo;

        @instanceLevelProperty(1, pi => Prim2DBase.positionProperty = pi, false, true)
        public get position(): Vector2 {
            return this._position;
        }

        public set position(value: Vector2) {
            this._position = value;
        }

        @instanceLevelProperty(2, pi => Prim2DBase.rotationProperty = pi, false, true)
        public get rotation(): number {
            return this._rotation;
        }

        public set rotation(value: number) {
            this._rotation = value;
        }

        @instanceLevelProperty(3, pi => Prim2DBase.scaleProperty = pi, false, true)
        public set scale(value: number) {
            this._scale = value;
        }

        public get scale(): number {
            return this._scale;
        }
        
        @instanceLevelProperty(4, pi => Prim2DBase.originProperty = pi, false, true)
        public set origin(value: Vector2) {
            this._origin = value;
        }

        /**
         * The origin defines the normalized coordinate of the center of the primitive, from the top/left corner.
         * The origin is used only to compute transformation of the primitive, it has no meaning in the primitive local frame of reference
         * For instance:
         * 0,0 means the center is top/left
         * 0.5,0.5 means the center is at the center of the primtive
         * 0,1 means the center is bottom/left
         * @returns The normalized center.
         */
        public get origin(): Vector2 {
            return this._origin;
        }

        @dynamicLevelProperty(5, pi => Prim2DBase.levelVisibleProperty = pi)
        public get levelVisible(): boolean {
            return this._levelVisible;
        }

        public set levelVisible(value: boolean) {
            this._levelVisible = value;
        }

        @instanceLevelProperty(6, pi => Prim2DBase.isVisibleProperty = pi)
        public get isVisible(): boolean {
            return this._isVisible;
        }

        public set isVisible(value: boolean) {
            this._isVisible = value;
        }

        @instanceLevelProperty(7, pi => Prim2DBase.zOrderProperty = pi)
        public get zOrder(): number {
            return this._zOrder;
        }

        public set zOrder(value: number) {
            this._zOrder = value;
        }

        public get hierarchyDepth(): number {
            return this._hierarchyDepth;
        }

        public get renderGroup(): Group2D {
            return this._renderGroup;
        }

        public get globalTransform(): Matrix {
            return this._globalTransform;
        }

        public get invGlobalTransform(): Matrix {
            return this._invGlobalTransform;
        }

        public get boundingInfo(): BoundingInfo2D {
            if (this._boundingInfoDirty) {
                this._boundingInfo = this.levelBoundingInfo.clone();
                let bi = this._boundingInfo;

                var tps = new BoundingInfo2D();
                for (let curChild of this._children) {
                    let t = curChild.globalTransform.multiply(this.invGlobalTransform);
                    curChild.boundingInfo.transformToRef(t, curChild.origin, tps);
                    bi.unionToRef(tps, bi);
                }

                this._boundingInfoDirty = false;
            }
            return this._boundingInfo;
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

            // If there's a parent, remove this object from its parent list
            if (this._parent) {
                let i = this._parent._children.indexOf(this);
                if (i!==undefined) {
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

        protected getActualZOffset(): number {
            return this._zOrder || 1-(this._siblingDepthOffset + this._hierarchyDepthOffset);
        }

        protected onPrimBecomesDirty() {
            if (this._renderGroup) {
                this._renderGroup._addPrimToDirtyList(this);
            }
        }

        public needPrepare(): boolean {
            return (this.isVisible || this._visibilityChanged) && (this._modelDirty || (this._instanceDirtyFlags !== 0) || (this._globalTransformProcessStep !== this._globalTransformStep));
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
                this._visibilityChanged = (curVisibleState!==undefined) && curVisibleState !== this.isVisible;

                // Detect if either the parent or this node changed
                let tflags = Prim2DBase.positionProperty.flagId | Prim2DBase.rotationProperty.flagId | Prim2DBase.scaleProperty.flagId;
                if (this.isVisible && (this._parent && this._parent._globalTransformStep !== this._parentTransformStep) || this.checkPropertiesDirty(tflags)) {
                    var rot = Quaternion.RotationAxis(new Vector3(0, 0, 1), this._rotation);
                    var local = Matrix.Compose(new Vector3(this._scale, this._scale, this._scale), rot, new Vector3(this._position.x, this._position.y, 0));

                    this._globalTransform = this._parent ? local.multiply(this._parent._globalTransform) : local;
                    this._invGlobalTransform = Matrix.Invert(this._globalTransform);

                    this._globalTransformStep = this.owner._globalTransformProcessStep + 1;
                    this._parentTransformStep = this._parent ? this._parent._globalTransformStep : 0;

                    this.clearPropertiesDirty(tflags);
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
        protected _children: Array<Prim2DBase>;
        private _renderGroup: Group2D;
        private _hierarchyDepth: number;
        protected _depthLevel: number;
        private _hierarchyDepthOffset: number;
        private _siblingDepthOffset: number;
        private _zOrder: number;
        private _levelVisible: boolean;
        public _boundingInfoDirty: boolean;
        protected _visibilityChanged;
        private _isVisible: boolean;
        private _id: string;
        private _position: Vector2;
        private _rotation: number;
        private _scale: number;
        private _origin: Vector2;

        // Stores the step of the parent for which the current global tranform was computed
        // If the parent has a new step, it means this prim's global transform must be updated
        protected _parentTransformStep: number;

        // Stores the step corresponding of the global transform for this prim
        // If a child prim has an older _parentTransformStep it means the chidl's transform should be updated
        protected _globalTransformStep: number;

        // Stores the previous 
        protected _globalTransformProcessStep: number;
        protected _globalTransform: Matrix;
        protected _invGlobalTransform: Matrix;
    }

}