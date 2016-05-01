module BABYLON {
    export class Render2DContext {
        camera: Camera;
        parentVisibleState: boolean;
        parentTransform: Matrix;
        parentTransformStep: number;
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
            this._parentTranformStep = 0;
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

                let localTransform = new Matrix();
                if (this.parent) {
                    this.globalTransform.multiplyToRef(Matrix.Invert(this.parent.globalTransform), localTransform);
                } else {
                    localTransform = this.globalTransform;
                }
                let invLocalTransform = Matrix.Invert(localTransform);

                this.levelBoundingInfo.transformToRef(localTransform, bi);

                var tps = new BoundingInfo2D();
                for (let curChild of this._children) {
                    curChild.boundingInfo.transformToRef(curChild.globalTransform.multiply(invLocalTransform), tps);
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
                prevOffset = 0;
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
            this._children.push(child);

        }

        protected getActualZOffset(): number {
            return this._zOrder || this._siblingDepthOffset;
        }

        protected onPrimBecomesDirty() {
            if (this._renderGroup) {
                this._renderGroup._addPrimToDirtyList(this);
            }
        }

        public needPrepare(): boolean {
            return this._modelDirty || (this._instanceDirtyFlags !== 0) || (this._globalTransformPreviousStep !== this._globalTransformStep);
        }

        protected _buildChildContext(context: Render2DContext): Render2DContext {
            var childContext = new Render2DContext();
            childContext.camera = context.camera;
            childContext.parentVisibleState = context.parentVisibleState && this.levelVisible;
            childContext.parentTransform = this._globalTransform;
            childContext.parentTransformStep = this._globalTransformStep;
            childContext.forceRefreshPrimitive = context.forceRefreshPrimitive;

            return childContext;
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
            if (this._children.length > 0 && ((this._globalTransformPreviousStep !== this._globalTransformStep) ||
                this.checkPropertiesDirty(Prim2DBase.isVisibleProperty.flagId))) {

                var childContext = this._buildChildContext(context);
                this._children.forEach(c => {
                    // As usual stop the recursion if we meet a renderable group
                    if (!(c instanceof Group2D && c.isRenderableGroup)) {
                        c._prepareRender(childContext);
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

        protected updateGlobalTransVisOf(list: Prim2DBase[], context: Render2DContext, recurse: boolean) {
            for (let cur of list) {
                cur.updateGlobalTransVis(context, recurse);
            }
        }

        protected updateGlobalTransVis(context: Render2DContext, recurse: boolean) {
            this._globalTransformPreviousStep = this._globalTransformStep;
            this.isVisible = context.parentVisibleState && this.levelVisible;

            // Detect if nothing changed
            let tflags = Prim2DBase.positionProperty.flagId | Prim2DBase.rotationProperty.flagId | Prim2DBase.scaleProperty.flagId;
            if ((context.parentTransformStep === this._parentTranformStep) && !this.checkPropertiesDirty(tflags)) {
                return;
            }

            var rot = Quaternion.RotationAxis(new Vector3(0, 0, 1), this._rotation);
            var local = Matrix.Compose(new Vector3(this._scale, this._scale, this._scale), rot, new Vector3(this._position.x, this._position.y, 0));

            this._globalTransform = context.parentTransform.multiply(local);
            this._invGlobalTransform = Matrix.Invert(this._globalTransform);

            ++this._globalTransformStep;
            this._parentTranformStep = context.parentTransformStep;

            this.clearPropertiesDirty(tflags);

            if (recurse) {
                var childrenContext = this._buildChildContext(context);

                for (let child of this._children) {
                    // Stop the recursion if we meet a renderable group
                    child.updateGlobalTransVis(childrenContext, !(child instanceof Group2D && child.isRenderableGroup));
                }

            }
        }

        private _owner: Canvas2D;
        private _parent: Prim2DBase;
        protected _children: Array<Prim2DBase>;
        private _renderGroup: Group2D;
        private _hierarchyDepth: number;
        private _siblingDepthOffset: number;
        private _zOrder: number;
        private _levelVisible: boolean;
        public _boundingInfoDirty: boolean;
        private _isVisible: boolean;
        private _id: string;
        private _position: Vector2;
        private _rotation: number;
        private _scale: number;
        private _origin: Vector2;
        protected _parentTranformStep: number;
        protected _globalTransformStep: number;
        protected _globalTransformPreviousStep: number;
        protected _globalTransform: Matrix;
        protected _invGlobalTransform: Matrix;
    }

}