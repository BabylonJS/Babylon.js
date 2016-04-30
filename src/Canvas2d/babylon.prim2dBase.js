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
    var Render2DContext = (function () {
        function Render2DContext() {
        }
        return Render2DContext;
    }());
    BABYLON.Render2DContext = Render2DContext;
    var Prim2DBase = (function (_super) {
        __extends(Prim2DBase, _super);
        function Prim2DBase() {
            _super.apply(this, arguments);
        }
        Prim2DBase.prototype.setupPrim2DBase = function (owner, parent, id, position, isVisible) {
            if (isVisible === void 0) { isVisible = true; }
            if (!(this instanceof BABYLON.Group2D) && !(this instanceof BABYLON.Sprite2D && id !== null && id.indexOf("__cachedSpriteOfGroup__") === 0) && (owner.cachingStrategy === BABYLON.Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) && (parent === owner)) {
                throw new Error("Can't create a primitive with the canvas as direct parent when the caching strategy is TOPLEVELGROUPS. You need to create a Group below the canvas and use it as the parent for the primitive");
            }
            this.setupSmartPropertyPrim();
            this._boundingInfoDirty = true;
            this._boundingInfo = new BABYLON.BoundingInfo2D();
            this._owner = owner;
            this._parent = parent;
            if (parent != null) {
                this._hierarchyDepth = parent._hierarchyDepth + 1;
                this._renderGroup = this.parent.traverseUp(function (p) { return p instanceof BABYLON.Group2D && p.isRenderableGroup; });
                parent.addChild(this);
            }
            else {
                this._hierarchyDepth = 0;
                this._renderGroup = null;
            }
            this._id = id;
            this.propertyChanged = new BABYLON.Observable();
            this._children = new Array();
            this._parentTranformStep = 0;
            this._globalTransformStep = 0;
            if (this instanceof BABYLON.Group2D) {
                var group = this;
                group.detectGroupStates();
            }
            this.position = position;
            this.rotation = 0;
            this.scale = 1;
            this.levelVisible = isVisible;
            this.origin = new BABYLON.Vector2(0.5, 0.5);
        };
        Prim2DBase.prototype.traverseUp = function (predicate) {
            var p = this;
            while (p != null) {
                if (predicate(p)) {
                    return p;
                }
                p = p._parent;
            }
            return null;
        };
        Object.defineProperty(Prim2DBase.prototype, "owner", {
            get: function () {
                return this._owner;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "parent", {
            get: function () {
                return this._parent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "id", {
            get: function () {
                return this._id;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "position", {
            get: function () {
                return this._position;
            },
            set: function (value) {
                this._position = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "rotation", {
            get: function () {
                return this._rotation;
            },
            set: function (value) {
                this._rotation = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "scale", {
            get: function () {
                return this._scale;
            },
            set: function (value) {
                this._scale = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "origin", {
            get: function () {
                return this._origin;
            },
            set: function (value) {
                this._origin = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "levelVisible", {
            get: function () {
                return this._levelVisible;
            },
            set: function (value) {
                this._levelVisible = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isVisible", {
            get: function () {
                return this._isVisible;
            },
            set: function (value) {
                this._isVisible = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "zOrder", {
            get: function () {
                return this._zOrder;
            },
            set: function (value) {
                this._zOrder = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "hierarchyDepth", {
            get: function () {
                return this._hierarchyDepth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "renderGroup", {
            get: function () {
                return this._renderGroup;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "globalTransform", {
            get: function () {
                return this._globalTransform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "invGlobalTransform", {
            get: function () {
                return this._invGlobalTransform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "boundingInfo", {
            get: function () {
                if (this._boundingInfoDirty) {
                    this._boundingInfo = this.levelBoundingInfo.clone();
                    var bi = this._boundingInfo;
                    var localTransform = new BABYLON.Matrix();
                    if (this.parent) {
                        this.globalTransform.multiplyToRef(BABYLON.Matrix.Invert(this.parent.globalTransform), localTransform);
                    }
                    else {
                        localTransform = this.globalTransform;
                    }
                    var invLocalTransform = BABYLON.Matrix.Invert(localTransform);
                    this.levelBoundingInfo.transformToRef(localTransform, bi);
                    var tps = new BABYLON.BoundingInfo2D();
                    for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                        var curChild = _a[_i];
                        curChild.boundingInfo.transformToRef(curChild.globalTransform.multiply(invLocalTransform), tps);
                        bi.unionToRef(tps, bi);
                    }
                    this._boundingInfoDirty = false;
                }
                return this._boundingInfo;
            },
            enumerable: true,
            configurable: true
        });
        Prim2DBase.prototype.moveChild = function (child, previous) {
            if (child.parent !== this) {
                return false;
            }
            var prevOffset, nextOffset;
            var childIndex = this._children.indexOf(child);
            var prevIndex = previous ? this._children.indexOf(previous) : -1;
            // Move to first position
            if (!previous) {
                prevOffset = 0;
                nextOffset = this._children[1]._siblingDepthOffset;
            }
            else {
                prevOffset = this._children[prevIndex]._siblingDepthOffset;
                nextOffset = this._children[prevIndex + 1]._siblingDepthOffset;
            }
            child._siblingDepthOffset = (nextOffset - prevOffset) / 2;
            this._children.splice(prevIndex + 1, 0, this._children.splice(childIndex, 1)[0]);
        };
        Prim2DBase.prototype.addChild = function (child) {
            child._siblingDepthOffset = (this._children.length + 1) * this.owner.hierarchySiblingZDelta;
            this._children.push(child);
        };
        Prim2DBase.prototype.getActualZOffset = function () {
            return this._zOrder || this._siblingDepthOffset;
        };
        Prim2DBase.prototype.onPrimBecomesDirty = function () {
            if (this._renderGroup) {
                //if (this instanceof Group2D) {
                //    var group: any= this;
                //    if (group.isRenderableGroup) {
                //        return;
                //    }
                //}
                this._renderGroup._addPrimToDirtyList(this);
            }
        };
        Prim2DBase.prototype.needPrepare = function () {
            return this._modelDirty || (this._instanceDirtyFlags !== 0) || (this._globalTransformPreviousStep !== this._globalTransformStep);
        };
        Prim2DBase.prototype._buildChildContext = function (context) {
            var childContext = new Render2DContext();
            childContext.camera = context.camera;
            childContext.parentVisibleState = context.parentVisibleState && this.levelVisible;
            childContext.parentTransform = this._globalTransform;
            childContext.parentTransformStep = this._globalTransformStep;
            childContext.forceRefreshPrimitive = context.forceRefreshPrimitive;
            return childContext;
        };
        Prim2DBase.prototype._prepareRender = function (context) {
            this._prepareRenderPre(context);
            this._prepareRenderPost(context);
        };
        Prim2DBase.prototype._prepareRenderPre = function (context) {
        };
        Prim2DBase.prototype._prepareRenderPost = function (context) {
            // Don't recurse if it's a renderable group, the content will be processed by the group itself
            if (this instanceof BABYLON.Group2D) {
                var self = this;
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
                this._children.forEach(function (c) {
                    // As usual stop the recursion if we meet a renderable group
                    if (!(c instanceof BABYLON.Group2D && c.isRenderableGroup)) {
                        c._prepareRender(childContext);
                    }
                });
            }
            // Finally reset the dirty flags as we've processed everything
            this._modelDirty = false;
            this._instanceDirtyFlags = 0;
        };
        Prim2DBase.CheckParent = function (parent) {
            if (!parent) {
                throw new Error("A Primitive needs a valid Parent, it can be any kind of Primitives based types, even the Canvas (with the exception that only Group2D can be direct child of a Canvas if the cache strategy used is TOPLEVELGROUPS)");
            }
        };
        Prim2DBase.prototype.updateGlobalTransVisOf = function (list, context, recurse) {
            for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
                var cur = list_1[_i];
                cur.updateGlobalTransVis(context, recurse);
            }
        };
        Prim2DBase.prototype.updateGlobalTransVis = function (context, recurse) {
            this._globalTransformPreviousStep = this._globalTransformStep;
            this.isVisible = context.parentVisibleState && this.levelVisible;
            // Detect if nothing changed
            var tflags = Prim2DBase.positionProperty.flagId | Prim2DBase.rotationProperty.flagId | Prim2DBase.scaleProperty.flagId;
            if ((context.parentTransformStep === this._parentTranformStep) && !this.checkPropertiesDirty(tflags)) {
                return;
            }
            var rot = BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 0, 1), this._rotation);
            var local = BABYLON.Matrix.Compose(new BABYLON.Vector3(this._scale, this._scale, this._scale), rot, new BABYLON.Vector3(this._position.x, this._position.y, 0));
            this._globalTransform = context.parentTransform.multiply(local);
            this._invGlobalTransform = BABYLON.Matrix.Invert(this._globalTransform);
            ++this._globalTransformStep;
            this._parentTranformStep = context.parentTransformStep;
            this.clearPropertiesDirty(tflags);
            if (recurse) {
                var childrenContext = this._buildChildContext(context);
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    // Stop the recursion if we meet a renderable group
                    child.updateGlobalTransVis(childrenContext, !(child instanceof BABYLON.Group2D && child.isRenderableGroup));
                }
            }
        };
        Prim2DBase.PRIM2DBASE_PROPCOUNT = 10;
        __decorate([
            BABYLON.instanceLevelProperty(1, function (pi) { return Prim2DBase.positionProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "position", null);
        __decorate([
            BABYLON.instanceLevelProperty(2, function (pi) { return Prim2DBase.rotationProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "rotation", null);
        __decorate([
            BABYLON.instanceLevelProperty(3, function (pi) { return Prim2DBase.scaleProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "scale", null);
        __decorate([
            BABYLON.instanceLevelProperty(4, function (pi) { return Prim2DBase.originProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "origin", null);
        __decorate([
            BABYLON.dynamicLevelProperty(5, function (pi) { return Prim2DBase.levelVisibleProperty = pi; })
        ], Prim2DBase.prototype, "levelVisible", null);
        __decorate([
            BABYLON.instanceLevelProperty(6, function (pi) { return Prim2DBase.isVisibleProperty = pi; })
        ], Prim2DBase.prototype, "isVisible", null);
        __decorate([
            BABYLON.instanceLevelProperty(7, function (pi) { return Prim2DBase.zOrderProperty = pi; })
        ], Prim2DBase.prototype, "zOrder", null);
        Prim2DBase = __decorate([
            BABYLON.className("Prim2DBase")
        ], Prim2DBase);
        return Prim2DBase;
    }(BABYLON.SmartPropertyPrim));
    BABYLON.Prim2DBase = Prim2DBase;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.prim2dBase.js.map