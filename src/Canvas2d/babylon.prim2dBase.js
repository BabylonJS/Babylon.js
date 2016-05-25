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
    })();
    BABYLON.Render2DContext = Render2DContext;
    /**
     * This class store information for the pointerEventObservable Observable.
     * The Observable is divided into many sub events (using the Mask feature of the Observable pattern): PointerOver, PointerEnter, PointerDown, PointerMouseWheel, PointerMove, PointerUp, PointerDown, PointerLeave, PointerGotCapture and PointerLostCapture.
     */
    var PrimitivePointerInfo = (function () {
        function PrimitivePointerInfo() {
            this.primitivePointerPos = BABYLON.Vector2.Zero();
            this.tilt = BABYLON.Vector2.Zero();
            this.cancelBubble = false;
        }
        Object.defineProperty(PrimitivePointerInfo, "PointerOver", {
            // The behavior is based on the HTML specifications of the Pointer Events (https://www.w3.org/TR/pointerevents/#list-of-pointer-events). This is not 100% compliant and not meant to be, but still, it's based on these specs for most use cases to be programmed the same way (as closest as possible) as it would have been in HTML.
            /**
             * This event type is raised when a pointing device is moved into the hit test boundaries of a primitive.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerOver;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerEnter", {
            /**
             * This event type is raised when a pointing device is moved into the hit test boundaries of a primitive or one of its descendants.
             * Bubbles: no
             */
            get: function () {
                return PrimitivePointerInfo._pointerEnter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerDown", {
            /**
             * This event type is raised when a pointer enters the active button state (non-zero value in the buttons property). For mouse it's when the device transitions from no buttons depressed to at least one button depressed. For touch/pen this is when a physical contact is made.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerDown;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerMouseWheel", {
            /**
             * This event type is raised when the pointer is a mouse and it's wheel is rolling
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerMouseWheel;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerMove", {
            /**
             * This event type is raised when a pointer change coordinates or when a pointer changes button state, pressure, tilt, or contact geometry and the circumstances produce no other pointers events.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerMove;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerUp", {
            /**
             * This event type is raised when the pointer leaves the active buttons states (zero value in the buttons property). For mouse, this is when the device transitions from at least one button depressed to no buttons depressed. For touch/pen, this is when physical contact is removed.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerUp;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerOut", {
            /**
             * This event type is raised when a pointing device is moved out of the hit test the boundaries of a primitive.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerOut;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerLeave", {
            /**
             * This event type is raised when a pointing device is moved out of the hit test boundaries of a primitive and all its descendants.
             * Bubbles: no
             */
            get: function () {
                return PrimitivePointerInfo._pointerLeave;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerGotCapture", {
            /**
             * This event type is raised when a primitive receives the pointer capture. This event is fired at the element that is receiving pointer capture. Subsequent events for that pointer will be fired at this element.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerGotCapture;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerLostCapture", {
            /**
             * This event type is raised after pointer capture is released for a pointer.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerLostCapture;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "MouseWheelPrecision", {
            get: function () {
                return PrimitivePointerInfo._mouseWheelPrecision;
            },
            enumerable: true,
            configurable: true
        });
        PrimitivePointerInfo.prototype.updateRelatedTarget = function (prim, primPointerPos) {
            this.relatedTarget = prim;
            this.relatedTargetPointerPos = primPointerPos;
        };
        PrimitivePointerInfo.getEventTypeName = function (mask) {
            switch (mask) {
                case PrimitivePointerInfo.PointerOver: return "PointerOver";
                case PrimitivePointerInfo.PointerEnter: return "PointerEnter";
                case PrimitivePointerInfo.PointerDown: return "PointerDown";
                case PrimitivePointerInfo.PointerMouseWheel: return "PointerMouseWheel";
                case PrimitivePointerInfo.PointerMove: return "PointerMove";
                case PrimitivePointerInfo.PointerUp: return "PointerUp";
                case PrimitivePointerInfo.PointerOut: return "PointerOut";
                case PrimitivePointerInfo.PointerLeave: return "PointerLeave";
                case PrimitivePointerInfo.PointerGotCapture: return "PointerGotCapture";
                case PrimitivePointerInfo.PointerLostCapture: return "PointerLostCapture";
            }
        };
        PrimitivePointerInfo._pointerOver = 0x0001;
        PrimitivePointerInfo._pointerEnter = 0x0002;
        PrimitivePointerInfo._pointerDown = 0x0004;
        PrimitivePointerInfo._pointerMouseWheel = 0x0008;
        PrimitivePointerInfo._pointerMove = 0x0010;
        PrimitivePointerInfo._pointerUp = 0x0020;
        PrimitivePointerInfo._pointerOut = 0x0040;
        PrimitivePointerInfo._pointerLeave = 0x0080;
        PrimitivePointerInfo._pointerGotCapture = 0x0100;
        PrimitivePointerInfo._pointerLostCapture = 0x0200;
        PrimitivePointerInfo._mouseWheelPrecision = 3.0;
        return PrimitivePointerInfo;
    })();
    BABYLON.PrimitivePointerInfo = PrimitivePointerInfo;
    /**
     * Stores information about a Primitive that was intersected
     */
    var PrimitiveIntersectedInfo = (function () {
        function PrimitiveIntersectedInfo(prim, intersectionLocation) {
            this.prim = prim;
            this.intersectionLocation = intersectionLocation;
        }
        return PrimitiveIntersectedInfo;
    })();
    BABYLON.PrimitiveIntersectedInfo = PrimitiveIntersectedInfo;
    /**
     * Main class used for the Primitive Intersection API
     */
    var IntersectInfo2D = (function () {
        function IntersectInfo2D() {
            this.findFirstOnly = false;
            this.intersectHidden = false;
            this.pickPosition = BABYLON.Vector2.Zero();
        }
        Object.defineProperty(IntersectInfo2D.prototype, "isIntersected", {
            /**
             * true if at least one primitive intersected during the test
             */
            get: function () {
                return this.intersectedPrimitives && this.intersectedPrimitives.length > 0;
            },
            enumerable: true,
            configurable: true
        });
        IntersectInfo2D.prototype.isPrimIntersected = function (prim) {
            for (var _i = 0, _a = this.intersectedPrimitives; _i < _a.length; _i++) {
                var cur = _a[_i];
                if (cur.prim === prim) {
                    return cur.intersectionLocation;
                }
            }
            return null;
        };
        // Internals, don't use
        IntersectInfo2D.prototype._exit = function (firstLevel) {
            if (firstLevel) {
                this._globalPickPosition = null;
            }
        };
        return IntersectInfo2D;
    })();
    BABYLON.IntersectInfo2D = IntersectInfo2D;
    var Prim2DBase = (function (_super) {
        __extends(Prim2DBase, _super);
        function Prim2DBase() {
            _super.apply(this, arguments);
        }
        Prim2DBase.prototype.setupPrim2DBase = function (owner, parent, id, position, origin, isVisible) {
            if (isVisible === void 0) { isVisible = true; }
            if (!(this instanceof BABYLON.Group2D) && !(this instanceof BABYLON.Sprite2D && id !== null && id.indexOf("__cachedSpriteOfGroup__") === 0) && (owner.cachingStrategy === BABYLON.Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) && (parent === owner)) {
                throw new Error("Can't create a primitive with the canvas as direct parent when the caching strategy is TOPLEVELGROUPS. You need to create a Group below the canvas and use it as the parent for the primitive");
            }
            this.setupSmartPropertyPrim();
            this._pointerEventObservable = new BABYLON.Observable();
            this._isPickable = true;
            this._siblingDepthOffset = this._hierarchyDepthOffset = 0;
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
            this._globalTransformProcessStep = 0;
            this._globalTransformStep = 0;
            if (this instanceof BABYLON.Group2D) {
                var group = this;
                group.detectGroupStates();
            }
            this.position = position;
            this.rotation = 0;
            this.scale = 1;
            this.levelVisible = isVisible;
            this.origin = origin || new BABYLON.Vector2(0.5, 0.5);
        };
        Object.defineProperty(Prim2DBase.prototype, "actionManager", {
            get: function () {
                if (!this._actionManager) {
                    this._actionManager = new BABYLON.ActionManager(this.owner.scene);
                }
                return this._actionManager;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * From 'this' primitive, traverse up (from parent to parent) until the given predicate is true
         * @param predicate the predicate to test on each parent
         * @return the first primitive where the predicate was successful
         */
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
            /**
             * Retrieve the owner Canvas2D
             */
            get: function () {
                return this._owner;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "parent", {
            /**
             * Get the parent primitive (can be the Canvas, only the Canvas has no parent)
             */
            get: function () {
                return this._parent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "children", {
            /**
             * The array of direct children primitives
             */
            get: function () {
                return this._children;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "id", {
            /**
             * The identifier of this primitive, may not be unique, it's for information purpose only
             */
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
        Object.defineProperty(Prim2DBase.prototype, "actualSize", {
            /**
             * this method must be implemented by the primitive type to return its size
             * @returns The size of the primitive
             */
            get: function () {
                return undefined;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "origin", {
            /**
             * The origin defines the normalized coordinate of the center of the primitive, from the top/left corner.
             * The origin is used only to compute transformation of the primitive, it has no meaning in the primitive local frame of reference
             * For instance:
             * 0,0 means the center is bottom/left. Which is the default for Canvas2D instances
             * 0.5,0.5 means the center is at the center of the primitive, which is default of all types of Primitives
             * 0,1 means the center is top/left
             * @returns The normalized center.
             */
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
        Object.defineProperty(Prim2DBase.prototype, "isPickable", {
            /**
             * Define if the Primitive can be subject to intersection test or not (default is true)
             */
            get: function () {
                return this._isPickable;
            },
            set: function (value) {
                this._isPickable = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "hierarchyDepth", {
            /**
             * Return the depth level of the Primitive into the Canvas' Graph. A Canvas will be 0, its direct children 1, and so on.
             * @returns {}
             */
            get: function () {
                return this._hierarchyDepth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "renderGroup", {
            /**
             * Retrieve the Group that is responsible to render this primitive
             * @returns {}
             */
            get: function () {
                return this._renderGroup;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "globalTransform", {
            /**
             * Get the global transformation matrix of the primitive
             */
            get: function () {
                return this._globalTransform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "invGlobalTransform", {
            /**
             * Get invert of the global transformation matrix of the primitive
             * @returns {}
             */
            get: function () {
                return this._invGlobalTransform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "localTransform", {
            /**
             * Get the local transformation of the primitive
             */
            get: function () {
                this._updateLocalTransform();
                return this._localTransform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "boundingInfo", {
            /**
             * Get the boundingInfo associated to the primitive.
             * The value is supposed to be always up to date
             */
            get: function () {
                if (this._boundingInfoDirty) {
                    this._boundingInfo = this.levelBoundingInfo.clone();
                    var bi = this._boundingInfo;
                    var tps = new BABYLON.BoundingInfo2D();
                    for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                        var curChild = _a[_i];
                        curChild.boundingInfo.transformToRef(curChild.localTransform, tps);
                        bi.unionToRef(tps, bi);
                    }
                    this._boundingInfoDirty = false;
                }
                return this._boundingInfo;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "pointerEventObservable", {
            /**
             * Interaction with the primitive can be create using this Observable. See the PrimitivePointerInfo class for more information
             */
            get: function () {
                return this._pointerEventObservable;
            },
            enumerable: true,
            configurable: true
        });
        Prim2DBase.prototype.levelIntersect = function (intersectInfo) {
            return false;
        };
        /**
         * Capture all the Events of the given PointerId for this primitive.
         * Don't forget to call releasePointerEventsCapture when done.
         * @param pointerId the Id of the pointer to capture the events from.
         */
        Prim2DBase.prototype.setPointerEventCapture = function (pointerId) {
            return this.owner._setPointerCapture(pointerId, this);
        };
        /**
         * Release a captured pointer made with setPointerEventCapture.
         * @param pointerId the Id of the pointer to release the capture from.
         */
        Prim2DBase.prototype.releasePointerEventsCapture = function (pointerId) {
            return this.owner._releasePointerCapture(pointerId, this);
        };
        /**
         * Make an intersection test with the primitive, all inputs/outputs are stored in the IntersectInfo2D class, see its documentation for more information.
         * @param intersectInfo contains the settings of the intersection to perform, to setup before calling this method as well as the result, available after a call to this method.
         */
        Prim2DBase.prototype.intersect = function (intersectInfo) {
            if (!intersectInfo) {
                return false;
            }
            // If this is null it means this method is call for the first level, initialize stuffs
            var firstLevel = !intersectInfo._globalPickPosition;
            if (firstLevel) {
                // Compute the pickPosition in global space and use it to find the local position for each level down, always relative from the world to get the maximum accuracy (and speed). The other way would have been to compute in local every level down relative to its parent's local, which wouldn't be as accurate (even if javascript number is 80bits accurate).
                intersectInfo._globalPickPosition = BABYLON.Vector2.Zero();
                BABYLON.Vector2.TransformToRef(intersectInfo.pickPosition, this.globalTransform, intersectInfo._globalPickPosition);
                intersectInfo._localPickPosition = intersectInfo.pickPosition.clone();
                intersectInfo.intersectedPrimitives = new Array();
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
            var levelIntersectRes = this.levelIntersect(intersectInfo);
            if (levelIntersectRes) {
                var pii = new PrimitiveIntersectedInfo(this, intersectInfo._localPickPosition.clone());
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
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var curChild = _a[_i];
                    // Don't test primitive not pick able or if it's hidden and we don't test hidden ones
                    if (!curChild.isPickable || (!intersectInfo.intersectHidden && !curChild.isVisible)) {
                        continue;
                    }
                    // Must compute the localPickLocation for the children level
                    BABYLON.Vector2.TransformToRef(intersectInfo._globalPickPosition, curChild.invGlobalTransform, intersectInfo._localPickPosition);
                    // If we got an intersection with the child and we only need to find the first one, quit!
                    if (curChild.intersect(intersectInfo) && intersectInfo.findFirstOnly) {
                        intersectInfo._exit(firstLevel);
                        return true;
                    }
                }
            }
            intersectInfo._exit(firstLevel);
            return intersectInfo.isIntersected;
        };
        Prim2DBase.prototype.moveChild = function (child, previous) {
            if (child.parent !== this) {
                return false;
            }
            var prevOffset, nextOffset;
            var childIndex = this._children.indexOf(child);
            var prevIndex = previous ? this._children.indexOf(previous) : -1;
            // Move to first position
            if (!previous) {
                prevOffset = 1;
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
            child._hierarchyDepthOffset = this._hierarchyDepthOffset + ((this._children.length + 1) * this._siblingDepthOffset);
            child._siblingDepthOffset = this._siblingDepthOffset / this.owner.hierarchyLevelMaxSiblingCount;
            this._children.push(child);
        };
        Prim2DBase.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this._actionManager) {
                this._actionManager.dispose();
                this._actionManager = null;
            }
            // If there's a parent, remove this object from its parent list
            if (this._parent) {
                var i = this._parent._children.indexOf(this);
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
        };
        Prim2DBase.prototype.getActualZOffset = function () {
            return this._zOrder || (1 - this._hierarchyDepthOffset);
        };
        Prim2DBase.prototype.onPrimBecomesDirty = function () {
            if (this._renderGroup) {
                this._renderGroup._addPrimToDirtyList(this);
            }
        };
        Prim2DBase.prototype._needPrepare = function () {
            return this._visibilityChanged || this._modelDirty || (this._instanceDirtyFlags !== 0) || (this._globalTransformProcessStep !== this._globalTransformStep);
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
            if (this._children.length > 0 && ((this._globalTransformProcessStep !== this._globalTransformStep) ||
                this.checkPropertiesDirty(Prim2DBase.isVisibleProperty.flagId))) {
                this._children.forEach(function (c) {
                    // As usual stop the recursion if we meet a renderable group
                    if (!(c instanceof BABYLON.Group2D && c.isRenderableGroup)) {
                        c._prepareRender(context);
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
        Prim2DBase.prototype.updateGlobalTransVisOf = function (list, recurse) {
            for (var _i = 0; _i < list.length; _i++) {
                var cur = list[_i];
                cur.updateGlobalTransVis(recurse);
            }
        };
        Prim2DBase.prototype._updateLocalTransform = function () {
            var tflags = Prim2DBase.positionProperty.flagId | Prim2DBase.rotationProperty.flagId | Prim2DBase.scaleProperty.flagId;
            if (this.checkPropertiesDirty(tflags)) {
                var rot = BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 0, 1), this._rotation);
                var local = BABYLON.Matrix.Compose(new BABYLON.Vector3(this._scale, this._scale, this._scale), rot, new BABYLON.Vector3(this._position.x, this._position.y, 0));
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
        };
        Prim2DBase.prototype.updateGlobalTransVis = function (recurse) {
            if (this.isDisposed) {
                return;
            }
            // Check if the parent is synced
            if (this._parent && this._parent._globalTransformProcessStep !== this.owner._globalTransformProcessStep) {
                this._parent.updateGlobalTransVis(false);
            }
            // Check if we must update this prim
            if (this === this.owner || this._globalTransformProcessStep !== this.owner._globalTransformProcessStep) {
                var curVisibleState = this.isVisible;
                this.isVisible = (!this._parent || this._parent.isVisible) && this.levelVisible;
                // Detect a change of visibility
                this._visibilityChanged = curVisibleState !== this.isVisible;
                // Get/compute the localTransform
                var localDirty = this._updateLocalTransform();
                // Check if we have to update the globalTransform
                if (!this._globalTransform || localDirty || (this._parent && this._parent._globalTransformStep !== this._parentTransformStep)) {
                    this._globalTransform = this._parent ? this._localTransform.multiply(this._parent._globalTransform) : this._localTransform;
                    this._invGlobalTransform = BABYLON.Matrix.Invert(this._globalTransform);
                    this._globalTransformStep = this.owner._globalTransformProcessStep + 1;
                    this._parentTransformStep = this._parent ? this._parent._globalTransformStep : 0;
                }
                this._globalTransformProcessStep = this.owner._globalTransformProcessStep;
            }
            if (recurse) {
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    // Stop the recursion if we meet a renderable group
                    child.updateGlobalTransVis(!(child instanceof BABYLON.Group2D && child.isRenderableGroup));
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
    })(BABYLON.SmartPropertyPrim);
    BABYLON.Prim2DBase = Prim2DBase;
})(BABYLON || (BABYLON = {}));
