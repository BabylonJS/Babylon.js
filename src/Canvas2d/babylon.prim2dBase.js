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
    var PrepareRender2DContext = (function () {
        function PrepareRender2DContext() {
            this.forceRefreshPrimitive = false;
        }
        return PrepareRender2DContext;
    })();
    BABYLON.PrepareRender2DContext = PrepareRender2DContext;
    var Render2DContext = (function () {
        function Render2DContext(renderMode) {
            this._renderMode = renderMode;
            this.useInstancing = false;
            this.groupInfoPartData = null;
            this.partDataStartIndex = this.partDataEndIndex = null;
            this.instancedBuffers = null;
        }
        Object.defineProperty(Render2DContext.prototype, "renderMode", {
            /**
             * Define which render Mode should be used to render the primitive: one of Render2DContext.RenderModeXxxx property
             */
            get: function () {
                return this._renderMode;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render2DContext, "RenderModeOpaque", {
            /**
             * The set of primitives to render is opaque.
             * This is the first rendering pass. All Opaque primitives are rendered. Depth Compare and Write are both enabled.
             */
            get: function () {
                return Render2DContext._renderModeOpaque;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render2DContext, "RenderModeAlphaTest", {
            /**
             * The set of primitives to render is using Alpha Test (aka masking).
             * Alpha Blend is enabled, the AlphaMode must be manually set, the render occurs after the RenderModeOpaque and is depth independent (i.e. primitives are not sorted by depth). Depth Compare and Write are both enabled.
             */
            get: function () {
                return Render2DContext._renderModeAlphaTest;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render2DContext, "RenderModeTransparent", {
            /**
             * The set of primitives to render is transparent.
             * Alpha Blend is enabled, the AlphaMode must be manually set, the render occurs after the RenderModeAlphaTest and is depth dependent (i.e. primitives are stored by depth and rendered back to front). Depth Compare is on, but Depth write is Off.
             */
            get: function () {
                return Render2DContext._renderModeTransparent;
            },
            enumerable: true,
            configurable: true
        });
        Render2DContext._renderModeOpaque = 1;
        Render2DContext._renderModeAlphaTest = 2;
        Render2DContext._renderModeTransparent = 3;
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
     * Defines the horizontal and vertical alignment information for a Primitive.
     */
    var PrimitiveAlignment = (function () {
        function PrimitiveAlignment(changeCallback) {
            this._changedCallback = changeCallback;
            this._horizontal = PrimitiveAlignment.AlignLeft;
            this._vertical = PrimitiveAlignment.AlignBottom;
        }
        Object.defineProperty(PrimitiveAlignment, "AlignLeft", {
            /**
             * Alignment is made relative to the left edge of the Primitive. Valid for horizontal alignment only.
             */
            get: function () { return PrimitiveAlignment._AlignLeft; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment, "AlignTop", {
            /**
             * Alignment is made relative to the top edge of the Primitive. Valid for vertical alignment only.
             */
            get: function () { return PrimitiveAlignment._AlignTop; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment, "AlignRight", {
            /**
             * Alignment is made relative to the right edge of the Primitive. Valid for horizontal alignment only.
             */
            get: function () { return PrimitiveAlignment._AlignRight; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment, "AlignBottom", {
            /**
             * Alignment is made relative to the bottom edge of the Primitive. Valid for vertical alignment only.
             */
            get: function () { return PrimitiveAlignment._AlignBottom; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment, "AlignCenter", {
            /**
             * Alignment is made to center the content from equal distance to the opposite edges of the Primitive
             */
            get: function () { return PrimitiveAlignment._AlignCenter; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment, "AlignStretch", {
            /**
             * The content is stretched toward the opposite edges of the Primitive
             */
            get: function () { return PrimitiveAlignment._AlignStretch; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment.prototype, "horizontal", {
            /**
             * Get/set the horizontal alignment. Use one of the AlignXXX static properties of this class
             */
            get: function () {
                return this._horizontal;
            },
            set: function (value) {
                if (this._horizontal === value) {
                    return;
                }
                this._horizontal = value;
                this._changedCallback();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment.prototype, "vertical", {
            /**
             * Get/set the vertical alignment. Use one of the AlignXXX static properties of this class
             */
            get: function () {
                return this._vertical;
            },
            set: function (value) {
                if (this._vertical === value) {
                    return;
                }
                this._vertical = value;
                this._changedCallback();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Set the horizontal alignment from a string value.
         * @param text can be either: 'left','right','center','stretch'
         */
        PrimitiveAlignment.prototype.setHorizontal = function (text) {
            var v = text.trim().toLocaleLowerCase();
            switch (v) {
                case "left":
                    this.horizontal = PrimitiveAlignment.AlignLeft;
                    return;
                case "right":
                    this.horizontal = PrimitiveAlignment.AlignRight;
                    return;
                case "center":
                    this.horizontal = PrimitiveAlignment.AlignCenter;
                    return;
                case "stretch":
                    this.horizontal = PrimitiveAlignment.AlignStretch;
                    return;
            }
        };
        /**
         * Set the vertical alignment from a string value.
         * @param text can be either: 'top','bottom','center','stretch'
         */
        PrimitiveAlignment.prototype.setVertical = function (text) {
            var v = text.trim().toLocaleLowerCase();
            switch (v) {
                case "top":
                    this.vertical = PrimitiveAlignment.AlignTop;
                    return;
                case "bottom":
                    this.vertical = PrimitiveAlignment.AlignBottom;
                    return;
                case "center":
                    this.vertical = PrimitiveAlignment.AlignCenter;
                    return;
                case "stretch":
                    this.vertical = PrimitiveAlignment.AlignStretch;
                    return;
            }
        };
        /**
         * Set the horizontal and or vertical alignments from a string value.
         * @param text can be: [<h:|horizontal:><left|right|center|stretch>], [<v:|vertical:><top|bottom|center|stretch>]
         */
        PrimitiveAlignment.prototype.fromString = function (value) {
            var m = value.trim().split(",");
            for (var _i = 0; _i < m.length; _i++) {
                var v = m[_i];
                v = v.toLocaleLowerCase().trim();
                // Horizontal
                var i = v.indexOf("h:");
                if (i === -1) {
                    i = v.indexOf("horizontal:");
                }
                if (i !== -1) {
                    v = v.substr(v.indexOf(":") + 1);
                    this.setHorizontal(v);
                    continue;
                }
                // Vertical
                i = v.indexOf("v:");
                if (i === -1) {
                    i = v.indexOf("vertical:");
                }
                if (i !== -1) {
                    v = v.substr(v.indexOf(":") + 1);
                    this.setVertical(v);
                    continue;
                }
            }
        };
        PrimitiveAlignment._AlignLeft = 1;
        PrimitiveAlignment._AlignTop = 1; // Same as left
        PrimitiveAlignment._AlignRight = 2;
        PrimitiveAlignment._AlignBottom = 2; // Same as right
        PrimitiveAlignment._AlignCenter = 3;
        PrimitiveAlignment._AlignStretch = 4;
        return PrimitiveAlignment;
    })();
    BABYLON.PrimitiveAlignment = PrimitiveAlignment;
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
     * Define a thickness toward every edges of a Primitive to allow margin and padding.
     * The thickness can be expressed as pixels, percentages, inherit the value of the parent primitive or be auto.
     */
    var PrimitiveThickness = (function () {
        function PrimitiveThickness(parentAccess, changedCallback) {
            this._parentAccess = parentAccess;
            this._changedCallback = changedCallback;
            this._pixels = new Array(4);
            this._percentages = new Array(4);
            this._setType(0, PrimitiveThickness.Auto);
            this._setType(1, PrimitiveThickness.Auto);
            this._setType(2, PrimitiveThickness.Auto);
            this._setType(3, PrimitiveThickness.Auto);
            this._pixels[0] = 0;
            this._pixels[1] = 0;
            this._pixels[2] = 0;
            this._pixels[3] = 0;
        }
        /**
         * Set the thickness from a string value
         * @param thickness format is "top: <value>, left:<value>, right:<value>, bottom:<value>" or "<value>" (same for all edges) each are optional, auto will be set if it's omitted.
         * Values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         */
        PrimitiveThickness.prototype.fromString = function (thickness) {
            this._clear();
            var m = thickness.trim().split(",");
            // Special case, one value to apply to all edges
            if (m.length === 1 && thickness.indexOf(":") === -1) {
                this._setStringValue(m[0], 0, false);
                this._setStringValue(m[0], 1, false);
                this._setStringValue(m[0], 2, false);
                this._setStringValue(m[0], 3, false);
                this._changedCallback();
                return;
            }
            var res = false;
            for (var _i = 0; _i < m.length; _i++) {
                var cm = m[_i];
                res = this._extractString(cm, false) || res;
            }
            if (!res) {
                throw new Error("Can't parse the string to create a PrimitiveMargin object, format must be: 'top: <value>, left:<value>, right:<value>, bottom:<value>");
            }
            // Check the margin that weren't set and set them in auto
            if ((this._flags & 0x000F) === 0)
                this._flags |= PrimitiveThickness.Pixel << 0;
            if ((this._flags & 0x00F0) === 0)
                this._flags |= PrimitiveThickness.Pixel << 4;
            if ((this._flags & 0x0F00) === 0)
                this._flags |= PrimitiveThickness.Pixel << 8;
            if ((this._flags & 0xF000) === 0)
                this._flags |= PrimitiveThickness.Pixel << 12;
            this._changedCallback();
        };
        /**
         * Set the thickness from multiple string
         * Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         * @param top the top thickness to set
         * @param left the left thickness to set
         * @param right the right thickness to set
         * @param bottom the bottom thickness to set
         */
        PrimitiveThickness.prototype.fromStrings = function (top, left, right, bottom) {
            this._clear();
            this._setStringValue(top, 0, false);
            this._setStringValue(left, 1, false);
            this._setStringValue(right, 2, false);
            this._setStringValue(bottom, 3, false);
            this._changedCallback();
            return this;
        };
        /**
         * Set the thickness from pixel values
         * @param top the top thickness in pixels to set
         * @param left the left thickness in pixels to set
         * @param right the right thickness in pixels to set
         * @param bottom the bottom thickness in pixels to set
         */
        PrimitiveThickness.prototype.fromPixels = function (top, left, right, bottom) {
            this._clear();
            this._pixels[0] = top;
            this._pixels[1] = left;
            this._pixels[2] = right;
            this._pixels[3] = bottom;
            this._changedCallback();
            return this;
        };
        /**
         * Apply the same pixel value to all edges
         * @param margin the value to set, in pixels.
         */
        PrimitiveThickness.prototype.fromUniformPixels = function (margin) {
            this._clear();
            this._pixels[0] = margin;
            this._pixels[1] = margin;
            this._pixels[2] = margin;
            this._pixels[3] = margin;
            this._changedCallback();
            return this;
        };
        /**
         * Set all edges in auto
         */
        PrimitiveThickness.prototype.auto = function () {
            this._clear();
            this._flags = (PrimitiveThickness.Auto << 0) | (PrimitiveThickness.Auto << 4) | (PrimitiveThickness.Auto << 8) | (PrimitiveThickness.Auto << 12);
            this._pixels[0] = 0;
            this._pixels[1] = 0;
            this._pixels[2] = 0;
            this._pixels[3] = 0;
            this._changedCallback();
            return this;
        };
        PrimitiveThickness.prototype._clear = function () {
            this._flags = 0;
            this._pixels[0] = 0;
            this._pixels[1] = 0;
            this._pixels[2] = 0;
            this._pixels[3] = 0;
            this._percentages[0] = null;
            this._percentages[1] = null;
            this._percentages[2] = null;
            this._percentages[3] = null;
        };
        PrimitiveThickness.prototype._extractString = function (value, emitChanged) {
            var v = value.trim().toLocaleLowerCase();
            if (v.indexOf("top:") === 0) {
                v = v.substr(4).trim();
                return this._setStringValue(v, 0, emitChanged);
            }
            if (v.indexOf("left:") === 0) {
                v = v.substr(5).trim();
                return this._setStringValue(v, 1, emitChanged);
            }
            if (v.indexOf("right:") === 0) {
                v = v.substr(6).trim();
                return this._setStringValue(v, 2, emitChanged);
            }
            if (v.indexOf("bottom:") === 0) {
                v = v.substr(7).trim();
                return this._setStringValue(v, 3, emitChanged);
            }
            return false;
        };
        PrimitiveThickness.prototype._setStringValue = function (value, index, emitChanged) {
            // Check for auto
            var v = value.trim().toLocaleLowerCase();
            if (v === "auto") {
                if (this._isType(index, PrimitiveThickness.Auto)) {
                    return true;
                }
                this._setType(index, PrimitiveThickness.Auto);
                this._pixels[index] = 0;
                if (emitChanged) {
                    this._changedCallback();
                }
            }
            else if (v === "inherit") {
                if (this._isType(index, PrimitiveThickness.Inherit)) {
                    return true;
                }
                this._setType(index, PrimitiveThickness.Inherit);
                this._pixels[index] = null;
                if (emitChanged) {
                    this._changedCallback();
                }
            }
            else {
                var pI = v.indexOf("%");
                // Check for percentage
                if (pI !== -1) {
                    var n_1 = v.substr(0, pI);
                    var number_1 = Math.round(Number(n_1)) / 100; // Normalize the percentage to [0;1] with a 0.01 precision
                    if (this._isType(index, PrimitiveThickness.Percentage) && (this._percentages[index] === number_1)) {
                        return true;
                    }
                    this._setType(index, PrimitiveThickness.Percentage);
                    if (isNaN(number_1)) {
                        return false;
                    }
                    this._percentages[index] = number_1;
                    if (emitChanged) {
                        this._changedCallback();
                    }
                    return true;
                }
                // Check for pixel
                var n;
                pI = v.indexOf("px");
                if (pI !== -1) {
                    n = v.substr(0, pI).trim();
                }
                else {
                    n = v;
                }
                var number = Number(n);
                if (this._isType(index, PrimitiveThickness.Pixel) && (this._pixels[index] === number)) {
                    return true;
                }
                if (isNaN(number)) {
                    return false;
                }
                this._pixels[index] = number;
                this._setType(index, PrimitiveThickness.Pixel);
                if (emitChanged) {
                    this._changedCallback();
                }
                return true;
            }
        };
        PrimitiveThickness.prototype._setPixels = function (value, index, emitChanged) {
            // Round the value because, well, it's the thing to do! Otherwise we'll have sub-pixel stuff, and the no change comparison just below will almost never work for PrimitiveThickness values inside a hierarchy of Primitives
            value = Math.round(value);
            if (this._isType(index, PrimitiveThickness.Pixel) && this._pixels[index] === value) {
                return;
            }
            this._setType(index, PrimitiveThickness.Pixel);
            this._pixels[index] = value;
            if (emitChanged) {
                this._changedCallback();
            }
        };
        PrimitiveThickness.prototype._setPercentage = function (value, index, emitChanged) {
            // Clip Value to bounds
            value = Math.min(1, value);
            value = Math.max(0, value);
            value = Math.round(value * 100) / 100; // 0.01 precision
            if (this._isType(index, PrimitiveThickness.Percentage) && this._percentages[index] === value) {
                return;
            }
            this._setType(index, PrimitiveThickness.Percentage);
            this._percentages[index] = value;
            if (emitChanged) {
                this._changedCallback();
            }
        };
        PrimitiveThickness.prototype._getStringValue = function (index) {
            var f = (this._flags >> (index * 4)) & 0xF;
            switch (f) {
                case PrimitiveThickness.Auto:
                    return "auto";
                case PrimitiveThickness.Pixel:
                    return this._pixels[index] + "px";
                case PrimitiveThickness.Percentage:
                    return this._percentages[index] * 100 + "%";
                case PrimitiveThickness.Inherit:
                    return "inherit";
            }
            return "";
        };
        PrimitiveThickness.prototype._isType = function (index, type) {
            var f = (this._flags >> (index * 4)) & 0xF;
            return f === type;
        };
        PrimitiveThickness.prototype._getType = function (index, processInherit) {
            var t = (this._flags >> (index * 4)) & 0xF;
            if (processInherit && (t === PrimitiveThickness.Inherit)) {
                var p = this._parentAccess();
                if (p) {
                    return p._getType(index, true);
                }
                return PrimitiveThickness.Auto;
            }
            return t;
        };
        PrimitiveThickness.prototype._setType = function (index, type) {
            this._flags &= ~(0xF << (index * 4));
            this._flags |= type << (index * 4);
        };
        PrimitiveThickness.prototype.setTop = function (value) {
            if (typeof value === "string") {
                this._setStringValue(value, 0, true);
            }
            else {
                this.topPixels = value;
            }
        };
        PrimitiveThickness.prototype.setLeft = function (value) {
            if (typeof value === "string") {
                this._setStringValue(value, 1, true);
            }
            else {
                this.leftPixels = value;
            }
        };
        PrimitiveThickness.prototype.setRight = function (value) {
            if (typeof value === "string") {
                this._setStringValue(value, 2, true);
            }
            else {
                this.rightPixels = value;
            }
        };
        PrimitiveThickness.prototype.setBottom = function (value) {
            if (typeof value === "string") {
                this._setStringValue(value, 3, true);
            }
            else {
                this.bottomPixels = value;
            }
        };
        Object.defineProperty(PrimitiveThickness.prototype, "top", {
            /**
             * Get/set the top thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
             */
            get: function () {
                return this._getStringValue(0);
            },
            set: function (value) {
                this._setStringValue(value, 0, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "left", {
            /**
             * Get/set the left thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
             */
            get: function () {
                return this._getStringValue(1);
            },
            set: function (value) {
                this._setStringValue(value, 1, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "right", {
            /**
             * Get/set the right thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
             */
            get: function () {
                return this._getStringValue(2);
            },
            set: function (value) {
                this._setStringValue(value, 2, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "bottom", {
            /**
             * Get/set the bottom thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
             */
            get: function () {
                return this._getStringValue(3);
            },
            set: function (value) {
                this._setStringValue(value, 3, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "topPixels", {
            /**
             * Get/set the top thickness in pixel.
             */
            get: function () {
                return this._pixels[0];
            },
            set: function (value) {
                this._setPixels(value, 0, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "leftPixels", {
            /**
             * Get/set the left thickness in pixel.
             */
            get: function () {
                return this._pixels[1];
            },
            set: function (value) {
                this._setPixels(value, 1, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "rightPixels", {
            /**
             * Get/set the right thickness in pixel.
             */
            get: function () {
                return this._pixels[2];
            },
            set: function (value) {
                this._setPixels(value, 2, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "bottomPixels", {
            /**
             * Get/set the bottom thickness in pixel.
             */
            get: function () {
                return this._pixels[3];
            },
            set: function (value) {
                this._setPixels(value, 3, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "topPercentage", {
            /**
             * Get/set the top thickness in percentage.
             * The get will return a valid value only if the edge type is percentage.
             * The Set will change the edge mode if needed
             */
            get: function () {
                return this._percentages[0];
            },
            set: function (value) {
                this._setPercentage(value, 0, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "leftPercentage", {
            /**
             * Get/set the left thickness in percentage.
             * The get will return a valid value only if the edge mode is percentage.
             * The Set will change the edge mode if needed
             */
            get: function () {
                return this._percentages[1];
            },
            set: function (value) {
                this._setPercentage(value, 1, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "rightPercentage", {
            /**
             * Get/set the right thickness in percentage.
             * The get will return a valid value only if the edge mode is percentage.
             * The Set will change the edge mode if needed
             */
            get: function () {
                return this._percentages[2];
            },
            set: function (value) {
                this._setPercentage(value, 2, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "bottomPercentage", {
            /**
             * Get/set the bottom thickness in percentage.
             * The get will return a valid value only if the edge mode is percentage.
             * The Set will change the edge mode if needed
             */
            get: function () {
                return this._percentages[3];
            },
            set: function (value) {
                this._setPercentage(value, 3, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "topMode", {
            /**
             * Get/set the top mode. The setter shouldn't be used, other setters with value should be preferred
             */
            get: function () {
                return this._getType(0, false);
            },
            set: function (mode) {
                this._setType(0, mode);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "leftMode", {
            /**
             * Get/set the left mode. The setter shouldn't be used, other setters with value should be preferred
             */
            get: function () {
                return this._getType(1, false);
            },
            set: function (mode) {
                this._setType(1, mode);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "rightMode", {
            /**
             * Get/set the right mode. The setter shouldn't be used, other setters with value should be preferred
             */
            get: function () {
                return this._getType(2, false);
            },
            set: function (mode) {
                this._setType(2, mode);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "bottomMode", {
            /**
             * Get/set the bottom mode. The setter shouldn't be used, other setters with value should be preferred
             */
            get: function () {
                return this._getType(3, false);
            },
            set: function (mode) {
                this._setType(3, mode);
            },
            enumerable: true,
            configurable: true
        });
        PrimitiveThickness.prototype._computePixels = function (index, sourceArea, emitChanged) {
            var type = this._getType(index, false);
            if (type === PrimitiveThickness.Inherit) {
                this._parentAccess()._computePixels(index, sourceArea, emitChanged);
                return;
            }
            if (type !== PrimitiveThickness.Percentage) {
                return;
            }
            var pixels = ((index === 0 || index === 3) ? sourceArea.height : sourceArea.width) * this._percentages[index];
            this._pixels[index] = pixels;
            if (emitChanged) {
                this._changedCallback();
            }
        };
        /**
         * Compute the positioning/size of an area considering the thickness of this object and a given alignment
         * @param sourceArea the source area
         * @param contentSize the content size to position/resize
         * @param alignment the alignment setting
         * @param dstOffset the position of the content
         * @param dstArea the new size of the content
         */
        PrimitiveThickness.prototype.computeWithAlignment = function (sourceArea, contentSize, alignment, dstOffset, dstArea) {
            // Fetch some data
            var topType = this._getType(0, true);
            var leftType = this._getType(1, true);
            var rightType = this._getType(2, true);
            var bottomType = this._getType(3, true);
            var hasWidth = contentSize && (contentSize.width != null);
            var hasHeight = contentSize && (contentSize.height != null);
            var width = hasWidth ? contentSize.width : 0;
            var height = hasHeight ? contentSize.height : 0;
            var isTopAuto = topType === PrimitiveThickness.Auto;
            var isLeftAuto = leftType === PrimitiveThickness.Auto;
            var isRightAuto = rightType === PrimitiveThickness.Auto;
            var isBottomAuto = bottomType === PrimitiveThickness.Auto;
            switch (alignment.horizontal) {
                case PrimitiveAlignment.AlignLeft:
                    {
                        if (isLeftAuto) {
                            dstOffset.x = 0;
                        }
                        else {
                            this._computePixels(1, sourceArea, true);
                            dstOffset.x = this.leftPixels;
                        }
                        dstArea.width = width;
                        break;
                    }
                case PrimitiveAlignment.AlignRight:
                    {
                        if (isRightAuto) {
                            dstOffset.x = Math.round(sourceArea.width - width);
                        }
                        else {
                            this._computePixels(2, sourceArea, true);
                            dstOffset.x = Math.round(sourceArea.width - (width + this.rightPixels));
                        }
                        dstArea.width = width;
                        break;
                    }
                case PrimitiveAlignment.AlignStretch:
                    {
                        if (isLeftAuto) {
                            dstOffset.x = 0;
                        }
                        else {
                            this._computePixels(1, sourceArea, true);
                            dstOffset.x = this.leftPixels;
                        }
                        var right = 0;
                        if (!isRightAuto) {
                            this._computePixels(2, sourceArea, true);
                            right = this.rightPixels;
                        }
                        dstArea.width = sourceArea.width - (dstOffset.x + right);
                        break;
                    }
                case PrimitiveAlignment.AlignCenter:
                    {
                        if (!isLeftAuto) {
                            this._computePixels(1, sourceArea, true);
                        }
                        if (!isRightAuto) {
                            this._computePixels(2, sourceArea, true);
                        }
                        var offset = (isLeftAuto ? 0 : this.leftPixels) - (isRightAuto ? 0 : this.rightPixels);
                        dstOffset.x = Math.round(((sourceArea.width - width) / 2) + offset);
                        dstArea.width = width;
                        break;
                    }
            }
            switch (alignment.vertical) {
                case PrimitiveAlignment.AlignTop:
                    {
                        if (isTopAuto) {
                            dstOffset.y = sourceArea.height - height;
                        }
                        else {
                            this._computePixels(0, sourceArea, true);
                            dstOffset.y = Math.round(sourceArea.height - (height + this.topPixels));
                        }
                        dstArea.height = height;
                        break;
                    }
                case PrimitiveAlignment.AlignBottom:
                    {
                        if (isBottomAuto) {
                            dstOffset.y = 0;
                        }
                        else {
                            this._computePixels(3, sourceArea, true);
                            dstOffset.y = this.bottomPixels;
                        }
                        dstArea.height = height;
                        break;
                    }
                case PrimitiveAlignment.AlignStretch:
                    {
                        if (isBottomAuto) {
                            dstOffset.y = 0;
                        }
                        else {
                            this._computePixels(3, sourceArea, true);
                            dstOffset.y = this.bottomPixels;
                        }
                        var top_1 = 0;
                        if (!isTopAuto) {
                            this._computePixels(0, sourceArea, true);
                            top_1 = this.topPixels;
                        }
                        dstArea.height = sourceArea.height - (dstOffset.y + top_1);
                        break;
                    }
                case PrimitiveAlignment.AlignCenter:
                    {
                        if (!isTopAuto) {
                            this._computePixels(0, sourceArea, true);
                        }
                        if (!isBottomAuto) {
                            this._computePixels(3, sourceArea, true);
                        }
                        var offset = (isBottomAuto ? 0 : this.bottomPixels) - (isTopAuto ? 0 : this.topPixels);
                        dstOffset.y = Math.round(((sourceArea.height - height) / 2) + offset);
                        dstArea.height = height;
                        break;
                    }
            }
        };
        /**
         * Compute an area and its position considering this thickness properties based on a given source area
         * @param sourceArea the source area
         * @param dstOffset the position of the resulting area
         * @param dstArea the size of the resulting area
         */
        PrimitiveThickness.prototype.compute = function (sourceArea, dstOffset, dstArea) {
            this._computePixels(0, sourceArea, true);
            this._computePixels(1, sourceArea, true);
            this._computePixels(2, sourceArea, true);
            this._computePixels(3, sourceArea, true);
            dstOffset.x = this.leftPixels;
            dstArea.width = sourceArea.width - (dstOffset.x + this.rightPixels);
            dstOffset.y = this.bottomPixels;
            dstArea.height = sourceArea.height - (dstOffset.y + this.topPixels);
        };
        /**
         * Compute an area considering this thickness properties based on a given source area
         * @param sourceArea the source area
         * @param result the resulting area
         */
        PrimitiveThickness.prototype.computeArea = function (sourceArea, result) {
            this._computePixels(0, sourceArea, true);
            this._computePixels(1, sourceArea, true);
            this._computePixels(2, sourceArea, true);
            this._computePixels(3, sourceArea, true);
            result.width = this.leftPixels + sourceArea.width + this.rightPixels;
            result.height = this.bottomPixels + sourceArea.height + this.topPixels;
        };
        PrimitiveThickness.prototype.enlarge = function (sourceArea, dstOffset, enlargedArea) {
            this._computePixels(0, sourceArea, true);
            this._computePixels(1, sourceArea, true);
            this._computePixels(2, sourceArea, true);
            this._computePixels(3, sourceArea, true);
            dstOffset.x = this.leftPixels;
            enlargedArea.width = sourceArea.width + (dstOffset.x + this.rightPixels);
            dstOffset.y = this.bottomPixels;
            enlargedArea.height = sourceArea.height + (dstOffset.y + this.topPixels);
        };
        PrimitiveThickness.Auto = 0x1;
        PrimitiveThickness.Inherit = 0x2;
        PrimitiveThickness.Percentage = 0x4;
        PrimitiveThickness.Pixel = 0x8;
        return PrimitiveThickness;
    })();
    BABYLON.PrimitiveThickness = PrimitiveThickness;
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
        function Prim2DBase(settings) {
            // Avoid checking every time if the object exists
            if (settings == null) {
                settings = {};
            }
            // BASE CLASS CALL
            _super.call(this);
            // Fetch the owner, parent. There're many ways to do it and we can end up with nothing for both
            var owner;
            var parent;
            if (Prim2DBase._isCanvasInit) {
                owner = this;
                parent = null;
                this._canvasPreInit(settings);
            }
            else {
                if (settings.parent != null) {
                    parent = settings.parent;
                    owner = settings.parent.owner;
                    if (!owner) {
                        throw new Error("Parent " + parent.id + " of " + settings.id + " doesn't have a valid owner!");
                    }
                    if (!(this instanceof BABYLON.Group2D) && !(this instanceof BABYLON.Sprite2D && settings.id != null && settings.id.indexOf("__cachedSpriteOfGroup__") === 0) && (owner.cachingStrategy === BABYLON.Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) && (parent === owner)) {
                        throw new Error("Can't create a primitive with the canvas as direct parent when the caching strategy is TOPLEVELGROUPS. You need to create a Group below the canvas and use it as the parent for the primitive");
                    }
                }
            }
            // Fields initialization
            this._layoutEngine = BABYLON.CanvasLayoutEngine.Singleton;
            this._size = null; //Size.Zero();
            this._actualSize = null;
            this._boundingSize = BABYLON.Size.Zero();
            this._layoutArea = BABYLON.Size.Zero();
            this._layoutAreaPos = BABYLON.Vector2.Zero();
            this._marginOffset = BABYLON.Vector2.Zero();
            this._paddingOffset = BABYLON.Vector2.Zero();
            this._parentPaddingOffset = BABYLON.Vector2.Zero();
            this._parentContentArea = BABYLON.Size.Zero();
            this._lastAutoSizeArea = BABYLON.Size.Zero();
            this._contentArea = new BABYLON.Size(null, null);
            this._pointerEventObservable = new BABYLON.Observable();
            this._boundingInfo = new BABYLON.BoundingInfo2D();
            this._owner = owner;
            this._parent = null;
            this._margin = null;
            this._padding = null;
            this._marginAlignment = null;
            this._id = settings.id;
            this.propertyChanged = new BABYLON.Observable();
            this._children = new Array();
            this._localTransform = new BABYLON.Matrix();
            this._globalTransform = null;
            this._invGlobalTransform = null;
            this._globalTransformProcessStep = 0;
            this._globalTransformStep = 0;
            this._renderGroup = null;
            this._primLinearPosition = 0;
            this._manualZOrder = null;
            this._zOrder = 0;
            this._zMax = 0;
            this._firstZDirtyIndex = Prim2DBase._bigInt;
            this._setFlags(BABYLON.SmartPropertyPrim.flagIsPickable | BABYLON.SmartPropertyPrim.flagBoundingInfoDirty | BABYLON.SmartPropertyPrim.flagActualOpacityDirty);
            if (settings.opacity != null) {
                this._opacity = settings.opacity;
            }
            else {
                this._opacity = 1;
            }
            if (settings.childrenFlatZOrder) {
                this._setFlags(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder);
            }
            // If the parent is given, initialize the hierarchy/owner related data
            if (parent != null) {
                parent.addChild(this);
                this._patchHierarchy(parent.owner);
            }
            // If it's a group, detect its own states
            if (this.owner && this instanceof BABYLON.Group2D) {
                var group = this;
                group.detectGroupStates();
            }
            // Time to insert children if some are specified
            if (settings.children != null) {
                for (var _i = 0, _a = settings.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    this.addChild(child);
                    // Good time to patch the hierarchy, it won't go very far if there's no need to
                    child._patchHierarchy(this.owner);
                }
            }
            // Set the model related properties
            if (settings.position != null) {
                this.position = settings.position;
            }
            else if (settings.x != null || settings.y != null) {
                this.position = new BABYLON.Vector2(settings.x || 0, settings.y || 0);
            }
            else {
                this._position = null;
            }
            this.rotation = (settings.rotation == null) ? 0 : settings.rotation;
            this.scale = (settings.scale == null) ? 1 : settings.scale;
            this.levelVisible = (settings.isVisible == null) ? true : settings.isVisible;
            this.origin = settings.origin || new BABYLON.Vector2(0.5, 0.5);
            // Layout Engine
            if (settings.layoutEngine != null) {
                if (typeof settings.layoutEngine === "string") {
                    var name_1 = settings.layoutEngine.toLocaleLowerCase().trim();
                    if (name_1 === "canvas" || name_1 === "canvaslayoutengine") {
                        this.layoutEngine = BABYLON.CanvasLayoutEngine.Singleton;
                    }
                    else if (name_1.indexOf("stackpanel") === 0 || name_1.indexOf("horizontalstackpanel") === 0) {
                        this.layoutEngine = BABYLON.StackPanelLayoutEngine.Horizontal;
                    }
                    else if (name_1.indexOf("verticalstackpanel") === 0) {
                        this.layoutEngine = BABYLON.StackPanelLayoutEngine.Vertical;
                    }
                }
                else if (settings.layoutEngine instanceof BABYLON.LayoutEngineBase) {
                    this.layoutEngine = settings.layoutEngine;
                }
            }
            // Set the layout/margin stuffs
            if (settings.marginTop) {
                this.margin.setTop(settings.marginTop);
            }
            if (settings.marginLeft) {
                this.margin.setLeft(settings.marginLeft);
            }
            if (settings.marginRight) {
                this.margin.setRight(settings.marginRight);
            }
            if (settings.marginBottom) {
                this.margin.setBottom(settings.marginBottom);
            }
            if (settings.margin) {
                if (typeof settings.margin === "string") {
                    this.margin.fromString(settings.margin);
                }
                else {
                    this.margin.fromUniformPixels(settings.margin);
                }
            }
            if (settings.marginHAlignment) {
                this.marginAlignment.horizontal = settings.marginHAlignment;
            }
            if (settings.marginVAlignment) {
                this.marginAlignment.vertical = settings.marginVAlignment;
            }
            if (settings.marginAlignment) {
                this.marginAlignment.fromString(settings.marginAlignment);
            }
            if (settings.paddingTop) {
                this.padding.setTop(settings.paddingTop);
            }
            if (settings.paddingLeft) {
                this.padding.setLeft(settings.paddingLeft);
            }
            if (settings.paddingRight) {
                this.padding.setRight(settings.paddingRight);
            }
            if (settings.paddingBottom) {
                this.padding.setBottom(settings.paddingBottom);
            }
            if (settings.padding) {
                this.padding.fromString(settings.padding);
            }
            // Dirty layout and positioning
            this._parentLayoutDirty();
            this._positioningDirty();
        }
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
        Object.defineProperty(Prim2DBase.prototype, "actualPosition", {
            get: function () {
                if (this._actualPosition != null) {
                    return this._actualPosition;
                }
                if (this._position != null) {
                    return this._position;
                }
                // At least return 0,0, we can't return null on actualPosition
                return Prim2DBase._nullPosition;
            },
            /**
             * DO NOT INVOKE for internal purpose only
             */
            set: function (val) {
                this._actualPosition = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualX", {
            /**
             * Shortcut to actualPosition.x
             */
            get: function () {
                return this.actualPosition.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualY", {
            /**
             * Shortcut to actualPosition.y
             */
            get: function () {
                return this.actualPosition.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "position", {
            /**
             * Position of the primitive, relative to its parent.
             * BEWARE: if you change only position.x or y it won't trigger a property change and you won't have the expected behavior.
             * Use this property to set a new Vector2 object, otherwise to change only the x/y use Prim2DBase.x or y properties.
             * Setting this property may have no effect is specific alignment are in effect.
             */
            get: function () {
                return this._position || Prim2DBase._nullPosition;
            },
            set: function (value) {
                if (!this._checkPositionChange()) {
                    return;
                }
                this._position = value;
                this.markAsDirty("actualPosition");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "x", {
            /**
             * Direct access to the position.x value of the primitive
             * Use this property when you only want to change one component of the position property
             */
            get: function () {
                if (!this._position) {
                    return null;
                }
                return this._position.x;
            },
            set: function (value) {
                if (!this._checkPositionChange()) {
                    return;
                }
                if (!this._position) {
                    this._position = BABYLON.Vector2.Zero();
                }
                if (this._position.x === value) {
                    return;
                }
                this._position.x = value;
                this.markAsDirty("position");
                this.markAsDirty("actualPosition");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "y", {
            /**
             * Direct access to the position.y value of the primitive
             * Use this property when you only want to change one component of the position property
             */
            get: function () {
                if (!this._position) {
                    return null;
                }
                return this._position.y;
            },
            set: function (value) {
                if (!this._checkPositionChange()) {
                    return;
                }
                if (!this._position) {
                    this._position = BABYLON.Vector2.Zero();
                }
                if (this._position.y === value) {
                    return;
                }
                this._position.y = value;
                this.markAsDirty("position");
                this.markAsDirty("actualPosition");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "size", {
            /**
             * Size of the primitive or its bounding area
             * BEWARE: if you change only size.width or height it won't trigger a property change and you won't have the expected behavior.
             * Use this property to set a new Size object, otherwise to change only the width/height use Prim2DBase.width or height properties.
             */
            get: function () {
                if (!this._size || this._size.width == null || this._size.height == null) {
                    if (Prim2DBase.boundinbBoxReentrency) {
                        return Prim2DBase.nullSize;
                    }
                    if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagBoundingInfoDirty)) {
                        return this._boundingSize;
                    }
                    Prim2DBase.boundinbBoxReentrency = true;
                    var b = this.boundingInfo;
                    Prim2DBase.boundinbBoxReentrency = false;
                    return this._boundingSize;
                }
                return this._size;
            },
            set: function (value) {
                this._size = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "width", {
            /**
             * Direct access to the size.width value of the primitive
             * Use this property when you only want to change one component of the size property
             */
            get: function () {
                if (!this.size) {
                    return null;
                }
                return this.size.width;
            },
            set: function (value) {
                if (!this.size) {
                    this.size = new BABYLON.Size(value, 0);
                    return;
                }
                if (this.size.width === value) {
                    return;
                }
                this.size.width = value;
                this.markAsDirty("size");
                this._positioningDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "height", {
            /**
             * Direct access to the size.height value of the primitive
             * Use this property when you only want to change one component of the size property
             */
            get: function () {
                if (!this.size) {
                    return null;
                }
                return this.size.height;
            },
            set: function (value) {
                if (!this.size) {
                    this.size = new BABYLON.Size(0, value);
                    return;
                }
                if (this.size.height === value) {
                    return;
                }
                this.size.height = value;
                this.markAsDirty("size");
                this._positioningDirty();
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
             * Return the size of the primitive as it's being rendered into the target.
             * This value may be different of the size property when layout/alignment is used or specific primitive types can implement a custom logic through this property.
             * BEWARE: don't use the setter, it's for internal purpose only
             * Note to implementers: you have to override this property and declare if necessary a @xxxxInstanceLevel decorator
             */
            get: function () {
                if (this._actualSize) {
                    return this._actualSize;
                }
                return this._size;
            },
            set: function (value) {
                if (this._actualSize.equals(value)) {
                    return;
                }
                this._actualSize = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualZOffset", {
            get: function () {
                if (this._manualZOrder != null) {
                    return this._manualZOrder;
                }
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagZOrderDirty)) {
                    this._updateZOrder();
                }
                return (1 - this._zOrder);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "minSize", {
            /**
             * Get or set the minimal size the Layout Engine should respect when computing the primitive's actualSize.
             * The Primitive's size won't be less than specified.
             * The default value depends of the Primitive type
             */
            get: function () {
                return this._minSize;
            },
            set: function (value) {
                if (this._minSize && value && this._minSize.equals(value)) {
                    return;
                }
                this._minSize = value;
                this._parentLayoutDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "maxSize", {
            /**
             * Get or set the maximal size the Layout Engine should respect when computing the primitive's actualSize.
             * The Primitive's size won't be more than specified.
             * The default value depends of the Primitive type
             */
            get: function () {
                return this._maxSize;
            },
            set: function (value) {
                if (this._maxSize && value && this._maxSize.equals(value)) {
                    return;
                }
                this._maxSize = value;
                this._parentLayoutDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "origin", {
            /**
             * The origin defines the normalized coordinate of the center of the primitive, from the bottom/left corner.
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
                return this._isFlagSet(BABYLON.SmartPropertyPrim.flagLevelVisible);
            },
            set: function (value) {
                this._changeFlags(BABYLON.SmartPropertyPrim.flagLevelVisible, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isVisible", {
            get: function () {
                return this._isFlagSet(BABYLON.SmartPropertyPrim.flagIsVisible);
            },
            set: function (value) {
                this._changeFlags(BABYLON.SmartPropertyPrim.flagIsVisible, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "zOrder", {
            get: function () {
                return this._manualZOrder;
            },
            set: function (value) {
                if (this._manualZOrder === value) {
                    return;
                }
                this._manualZOrder = value;
                this.onZOrderChanged();
                if (this._actualZOrderChangedObservable && this._actualZOrderChangedObservable.hasObservers()) {
                    this._actualZOrderChangedObservable.notifyObservers(value);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isManualZOrder", {
            get: function () {
                return this._manualZOrder != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "margin", {
            get: function () {
                var _this = this;
                if (!this._margin) {
                    this._margin = new PrimitiveThickness(function () {
                        if (!_this.parent) {
                            return null;
                        }
                        return _this.parent.margin;
                    }, function () { return _this._positioningDirty(); });
                }
                return this._margin;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "_hasMargin", {
            get: function () {
                return (this._margin !== null) || (this._marginAlignment !== null);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "padding", {
            get: function () {
                var _this = this;
                if (!this._padding) {
                    this._padding = new PrimitiveThickness(function () {
                        if (!_this.parent) {
                            return null;
                        }
                        return _this.parent.padding;
                    }, function () { return _this._positioningDirty(); });
                }
                return this._padding;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "_hasPadding", {
            get: function () {
                return this._padding !== null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "marginAlignment", {
            get: function () {
                var _this = this;
                if (!this._marginAlignment) {
                    this._marginAlignment = new PrimitiveAlignment(function () { return _this._positioningDirty(); });
                }
                return this._marginAlignment;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "opacity", {
            get: function () {
                return this._opacity;
            },
            set: function (value) {
                if (value < 0) {
                    value = 0;
                }
                else if (value > 1) {
                    value = 1;
                }
                if (this._opacity === value) {
                    return;
                }
                this._opacity = value;
                this._updateRenderMode();
                this._setFlags(BABYLON.SmartPropertyPrim.flagActualOpacityDirty);
                this._spreadActualOpacityChanged();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualOpacity", {
            get: function () {
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagActualOpacityDirty)) {
                    var cur = this.parent;
                    var op = this.opacity;
                    while (cur) {
                        op *= cur.opacity;
                        cur = cur.parent;
                    }
                    this._actualOpacity = op;
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagActualOpacityDirty);
                }
                return this._actualOpacity;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "layoutEngine", {
            /**
             * Get/set the layout engine to use for this primitive.
             * The default layout engine is the CanvasLayoutEngine.
             */
            get: function () {
                if (!this._layoutEngine) {
                    this._layoutEngine = BABYLON.CanvasLayoutEngine.Singleton;
                }
                return this._layoutEngine;
            },
            set: function (value) {
                if (this._layoutEngine === value) {
                    return;
                }
                this._changeLayoutEngine(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "layoutArea", {
            /**
             * Get/set the layout are of this primitive.
             * The Layout area is the zone allocated by the Layout Engine for this particular primitive. Margins/Alignment will be computed based on this area.
             * The setter should only be called by a Layout Engine class.
             */
            get: function () {
                return this._layoutArea;
            },
            set: function (val) {
                if (this._layoutArea.equals(val)) {
                    return;
                }
                this._positioningDirty();
                this._layoutArea = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "layoutAreaPos", {
            /**
             * Get/set the layout area position (relative to the parent primitive).
             * The setter should only be called by a Layout Engine class.
             */
            get: function () {
                return this._layoutAreaPos;
            },
            set: function (val) {
                if (this._layoutAreaPos.equals(val)) {
                    return;
                }
                this._positioningDirty();
                this._layoutAreaPos = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isPickable", {
            /**
             * Define if the Primitive can be subject to intersection test or not (default is true)
             */
            get: function () {
                return this._isFlagSet(BABYLON.SmartPropertyPrim.flagIsPickable);
            },
            set: function (value) {
                this._changeFlags(BABYLON.SmartPropertyPrim.flagIsPickable, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "hierarchyDepth", {
            /**
             * Return the depth level of the Primitive into the Canvas' Graph. A Canvas will be 0, its direct children 1, and so on.
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
        /**
         * return the global position of the primitive, relative to its canvas
         */
        Prim2DBase.prototype.getGlobalPosition = function () {
            var v = new BABYLON.Vector2(0, 0);
            this.getGlobalPositionByRef(v);
            return v;
        };
        /**
         * return the global position of the primitive, relative to its canvas
         * @param v the valid Vector2 object where the global position will be stored
         */
        Prim2DBase.prototype.getGlobalPositionByRef = function (v) {
            v.x = this.globalTransform.m[12];
            v.y = this.globalTransform.m[13];
        };
        Object.defineProperty(Prim2DBase.prototype, "invGlobalTransform", {
            /**
             * Get invert of the global transformation matrix of the primitive
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
             * Get the boundingInfo associated to the primitive and its children.
             * The value is supposed to be always up to date
             */
            get: function () {
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagBoundingInfoDirty)) {
                    if (this.owner) {
                        this.owner.boundingInfoRecomputeCounter.addCount(1, false);
                    }
                    if (this.isSizedByContent) {
                        this._boundingInfo.clear();
                    }
                    else {
                        this._boundingInfo.copyFrom(this.levelBoundingInfo);
                    }
                    var bi = this._boundingInfo;
                    var tps = new BABYLON.BoundingInfo2D();
                    for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                        var curChild = _a[_i];
                        curChild.boundingInfo.transformToRef(curChild.localTransform, tps);
                        bi.unionToRef(tps, bi);
                    }
                    this._boundingInfo.maxToRef(Prim2DBase._bMax);
                    this._boundingSize.copyFromFloats((!this._size || this._size.width == null) ? Math.ceil(Prim2DBase._bMax.x) : this._size.width, (!this._size || this._size.height == null) ? Math.ceil(Prim2DBase._bMax.y) : this._size.height);
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagBoundingInfoDirty);
                }
                return this._boundingInfo;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isSizeAuto", {
            /**
             * Determine if the size is automatically computed or fixed because manually specified.
             * Use the actualSize property to get the final/real size of the primitive
             * @returns true if the size is automatically computed, false if it were manually specified.
             */
            get: function () {
                return this._size == null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isSizedByContent", {
            /**
             * Return true if this prim has an auto size which is set by the children's global bounding box
             */
            get: function () {
                return (this._size == null) && (this._children.length > 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isPositionAuto", {
            /**
             * Determine if the position is automatically computed or fixed because manually specified.
             * Use the actualPosition property to get the final/real position of the primitive
             * @returns true if the position is automatically computed, false if it were manually specified.
             */
            get: function () {
                return this._position == null;
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
        Object.defineProperty(Prim2DBase.prototype, "zActualOrderChangedObservable", {
            get: function () {
                if (!this._actualZOrderChangedObservable) {
                    this._actualZOrderChangedObservable = new BABYLON.Observable();
                }
                return this._actualZOrderChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Prim2DBase.prototype.findById = function (id) {
            if (this._id === id) {
                return this;
            }
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                var r = child.findById(id);
                if (r != null) {
                    return r;
                }
            }
        };
        Prim2DBase.prototype.onZOrderChanged = function () {
        };
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
            if (this.isPickable && !this.boundingInfo.doesIntersect(intersectInfo._localPickPosition)) {
                // Important to call this before each return to allow a good recursion next time this intersectInfo is reused
                intersectInfo._exit(firstLevel);
                return false;
            }
            // We hit the boundingInfo that bounds this primitive and its children, now we have to test on the primitive of this level
            var levelIntersectRes = false;
            if (this.isPickable) {
                levelIntersectRes = this.levelIntersect(intersectInfo);
                if (levelIntersectRes) {
                    var pii = new PrimitiveIntersectedInfo(this, intersectInfo._localPickPosition.clone());
                    intersectInfo.intersectedPrimitives.push(pii);
                    if (!intersectInfo.topMostIntersectedPrimitive || (intersectInfo.topMostIntersectedPrimitive.prim.actualZOffset > pii.prim.actualZOffset)) {
                        intersectInfo.topMostIntersectedPrimitive = pii;
                    }
                    // If we must stop at the first intersection, we're done, quit!
                    if (intersectInfo.findFirstOnly) {
                        intersectInfo._exit(firstLevel);
                        return true;
                    }
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
            var childIndex = this._children.indexOf(child);
            var prevIndex = previous ? this._children.indexOf(previous) : -1;
            if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder)) {
                this._setFlags(BABYLON.SmartPropertyPrim.flagZOrderDirty);
                this._firstZDirtyIndex = Math.min(this._firstZDirtyIndex, prevIndex + 1);
            }
            this._children.splice(prevIndex + 1, 0, this._children.splice(childIndex, 1)[0]);
        };
        Prim2DBase.prototype.addChild = function (child) {
            child._parent = this;
            this._boundingBoxDirty();
            var flat = this._isFlagSet(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder);
            if (flat) {
                child._setFlags(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder);
                child._setZOrder(this._zOrder, true);
                child._zMax = this._zOrder;
            }
            else {
                this._setFlags(BABYLON.SmartPropertyPrim.flagZOrderDirty);
            }
            var length = this._children.push(child);
            this._firstZDirtyIndex = Math.min(this._firstZDirtyIndex, length - 1);
        };
        /**
         * Dispose the primitive, remove it from its parent.
         */
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
        Prim2DBase.prototype.onPrimBecomesDirty = function () {
            if (this._renderGroup) {
                this._renderGroup._addPrimToDirtyList(this);
            }
        };
        Prim2DBase.prototype._needPrepare = function () {
            return this._areSomeFlagsSet(BABYLON.SmartPropertyPrim.flagVisibilityChanged | BABYLON.SmartPropertyPrim.flagModelDirty) || (this._instanceDirtyFlags !== 0) || (this._globalTransformProcessStep !== this._globalTransformStep);
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
            this._clearFlags(BABYLON.SmartPropertyPrim.flagModelDirty);
            this._instanceDirtyFlags = 0;
        };
        Prim2DBase.prototype._canvasPreInit = function (settings) {
        };
        Prim2DBase.CheckParent = function (parent) {
            //if (!Prim2DBase._isCanvasInit && !parent) {
            //    throw new Error("A Primitive needs a valid Parent, it can be any kind of Primitives based types, even the Canvas (with the exception that only Group2D can be direct child of a Canvas if the cache strategy used is TOPLEVELGROUPS)");
            //}
        };
        Prim2DBase.prototype.updateCachedStatesOf = function (list, recurse) {
            for (var _i = 0; _i < list.length; _i++) {
                var cur = list[_i];
                cur.updateCachedStates(recurse);
            }
        };
        Prim2DBase.prototype._parentLayoutDirty = function () {
            if (!this._parent || this._parent.isDisposed) {
                return;
            }
            this._parent._setLayoutDirty();
        };
        Prim2DBase.prototype._setLayoutDirty = function () {
            if (!this.isDirty) {
                this.onPrimBecomesDirty();
            }
            this._setFlags(BABYLON.SmartPropertyPrim.flagLayoutDirty);
        };
        Prim2DBase.prototype._checkPositionChange = function () {
            if (this.parent && this.parent.layoutEngine.isChildPositionAllowed === false) {
                console.log("Can't manually set the position of " + this.id + ", the Layout Engine of its parent doesn't allow it");
                return false;
            }
            return true;
        };
        Prim2DBase.prototype._positioningDirty = function () {
            if (!this.isDirty) {
                this.onPrimBecomesDirty();
            }
            this._setFlags(BABYLON.SmartPropertyPrim.flagPositioningDirty);
        };
        Prim2DBase.prototype._spreadActualOpacityChanged = function () {
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                child._setFlags(BABYLON.SmartPropertyPrim.flagActualOpacityDirty);
                child._spreadActualOpacityChanged();
            }
        };
        Prim2DBase.prototype._changeLayoutEngine = function (engine) {
            this._layoutEngine = engine;
        };
        Prim2DBase.prototype._updateLocalTransform = function () {
            var tflags = Prim2DBase.actualPositionProperty.flagId | Prim2DBase.rotationProperty.flagId | Prim2DBase.scaleProperty.flagId | Prim2DBase.originProperty.flagId;
            if (this.checkPropertiesDirty(tflags)) {
                if (this.owner) {
                    this.owner.addupdateLocalTransformCounter(1);
                }
                var rot = BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 0, 1), this._rotation);
                var local;
                var pos = this.position;
                if (this._origin.x === 0 && this._origin.y === 0) {
                    local = BABYLON.Matrix.Compose(new BABYLON.Vector3(this._scale, this._scale, 1), rot, new BABYLON.Vector3(pos.x, pos.y, 0));
                    this._localTransform = local;
                }
                else {
                    // -Origin offset
                    var as = this.actualSize;
                    BABYLON.Matrix.TranslationToRef((-as.width * this._origin.x), (-as.height * this._origin.y), 0, Prim2DBase._t0);
                    // -Origin * rotation
                    rot.toRotationMatrix(Prim2DBase._t1);
                    Prim2DBase._t0.multiplyToRef(Prim2DBase._t1, Prim2DBase._t2);
                    // -Origin * rotation * scale
                    BABYLON.Matrix.ScalingToRef(this._scale, this._scale, 1, Prim2DBase._t0);
                    Prim2DBase._t2.multiplyToRef(Prim2DBase._t0, Prim2DBase._t1);
                    // -Origin * rotation * scale * (Origin + Position)
                    BABYLON.Matrix.TranslationToRef((as.width * this._origin.x) + pos.x, (as.height * this._origin.y) + pos.y, 0, Prim2DBase._t2);
                    Prim2DBase._t1.multiplyToRef(Prim2DBase._t2, this._localTransform);
                }
                this.clearPropertiesDirty(tflags);
                return true;
            }
            return false;
        };
        Prim2DBase.prototype.updateCachedStates = function (recurse) {
            if (this.isDisposed) {
                return;
            }
            this.owner.addCachedGroupRenderCounter(1);
            // Check if the parent is synced
            if (this._parent && ((this._parent._globalTransformProcessStep !== this.owner._globalTransformProcessStep) || this._parent._areSomeFlagsSet(BABYLON.SmartPropertyPrim.flagLayoutDirty | BABYLON.SmartPropertyPrim.flagPositioningDirty | BABYLON.SmartPropertyPrim.flagZOrderDirty))) {
                this._parent.updateCachedStates(false);
            }
            // Update Z-Order if needed
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagZOrderDirty)) {
                this._updateZOrder();
            }
            // Update actualSize only if there' not positioning to recompute and the size changed
            // Otherwise positioning will take care of it.
            var sizeDirty = this.checkPropertiesDirty(Prim2DBase.sizeProperty.flagId);
            if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutDirty) && !this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty) && sizeDirty) {
                var size = this.size;
                if (size) {
                    if (this.size.width != null) {
                        this.actualSize.width = this.size.width;
                    }
                    if (this.size.height != null) {
                        this.actualSize.height = this.size.height;
                    }
                    this.clearPropertiesDirty(Prim2DBase.sizeProperty.flagId);
                }
            }
            // Check for layout update
            var positioningDirty = this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty);
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutDirty)) {
                this.owner.addUpdateLayoutCounter(1);
                this._layoutEngine.updateLayout(this);
                this._clearFlags(BABYLON.SmartPropertyPrim.flagLayoutDirty);
            }
            var positioningComputed = positioningDirty && !this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty);
            var autoContentChanged = false;
            if (this.isSizeAuto) {
                if (!this._lastAutoSizeArea) {
                    autoContentChanged = this.size !== null;
                }
                else {
                    autoContentChanged = (!this._lastAutoSizeArea.equals(this.size));
                }
            }
            // Check for positioning update
            if (!positioningComputed && (autoContentChanged || sizeDirty || this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty) || (this._parent && !this._parent.contentArea.equals(this._parentContentArea)))) {
                this._updatePositioning();
                this._clearFlags(BABYLON.SmartPropertyPrim.flagPositioningDirty);
                if (sizeDirty) {
                    this.clearPropertiesDirty(Prim2DBase.sizeProperty.flagId);
                }
                positioningComputed = true;
            }
            if (positioningComputed && this._parent) {
                this._parentContentArea.copyFrom(this._parent.contentArea);
            }
            // Check if we must update this prim
            if (this === this.owner || this._globalTransformProcessStep !== this.owner._globalTransformProcessStep) {
                this.owner.addUpdateGlobalTransformCounter(1);
                var curVisibleState = this.isVisible;
                this.isVisible = (!this._parent || this._parent.isVisible) && this.levelVisible;
                // Detect a change of visibility
                this._changeFlags(BABYLON.SmartPropertyPrim.flagVisibilityChanged, curVisibleState !== this.isVisible);
                // Get/compute the localTransform
                var localDirty = this._updateLocalTransform();
                var parentPaddingChanged = false;
                var parentPaddingOffset = Prim2DBase._v0;
                if (this._parent) {
                    parentPaddingOffset = this._parent._paddingOffset;
                    parentPaddingChanged = !parentPaddingOffset.equals(this._parentPaddingOffset);
                }
                // Check if there are changes in the parent that will force us to update the global matrix
                var parentDirty = (this._parent != null) ? (this._parent._globalTransformStep !== this._parentTransformStep) : false;
                // Check if we have to update the globalTransform
                if (!this._globalTransform || localDirty || parentDirty || parentPaddingChanged) {
                    var globalTransform = this._parent ? this._parent._globalTransform : null;
                    var localTransform;
                    Prim2DBase._transMtx.copyFrom(this._localTransform);
                    Prim2DBase._transMtx.m[12] += this._layoutAreaPos.x + this._marginOffset.x + parentPaddingOffset.x;
                    Prim2DBase._transMtx.m[13] += this._layoutAreaPos.y + this._marginOffset.y + parentPaddingOffset.y;
                    localTransform = Prim2DBase._transMtx;
                    this._globalTransform = this._parent ? localTransform.multiply(globalTransform) : localTransform.clone();
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
                    child.updateCachedStates(!(child instanceof BABYLON.Group2D && child.isRenderableGroup));
                }
            }
        };
        Prim2DBase.prototype._updatePositioning = function () {
            if (this.owner) {
                this.owner.addUpdatePositioningCounter(1);
            }
            // From this point we assume that the primitive layoutArea is computed and up to date.
            // We know have to :
            //  1. Determine the PaddingArea and the ActualPosition based on the margin/marginAlignment properties, which will also set the size property of the primitive
            //  2. Determine the contentArea based on the padding property.
            // Auto Create PaddingArea if there's no actualSize on width&|height to allocate the whole content available to the paddingArea where the actualSize is null
            if (!this._hasMargin && (this.actualSize.width == null || this.actualSize.height == null)) {
                if (this.actualSize.width == null) {
                    this.marginAlignment.horizontal = PrimitiveAlignment.AlignStretch;
                }
                if (this.actualSize.height == null) {
                    this.marginAlignment.vertical = PrimitiveAlignment.AlignStretch;
                }
            }
            // Apply margin
            if (this._hasMargin) {
                this.margin.computeWithAlignment(this.layoutArea, this.size, this.marginAlignment, this._marginOffset, Prim2DBase._size);
                this.actualSize = Prim2DBase._size.clone();
            }
            var isSizeAuto = this.isSizeAuto;
            if (this._hasPadding) {
                // Two cases from here: the size of the Primitive is Auto, its content can't be shrink, so me resize the primitive itself
                if (isSizeAuto) {
                    var content = this.size.clone();
                    this._getActualSizeFromContentToRef(content, Prim2DBase._icArea);
                    this.padding.enlarge(Prim2DBase._icArea, this._paddingOffset, Prim2DBase._size);
                    this._contentArea.copyFrom(content);
                    this.actualSize = Prim2DBase._size.clone();
                    // Changing the padding has resize the prim, which forces us to recompute margin again
                    if (this._hasMargin) {
                        this.margin.computeWithAlignment(this.layoutArea, Prim2DBase._size, this.marginAlignment, this._marginOffset, Prim2DBase._size);
                    }
                }
                else {
                    this._getInitialContentAreaToRef(this.actualSize, Prim2DBase._icPos, Prim2DBase._icArea);
                    Prim2DBase._icArea.width = Math.max(0, Prim2DBase._icArea.width);
                    Prim2DBase._icArea.height = Math.max(0, Prim2DBase._icArea.height);
                    this.padding.compute(Prim2DBase._icArea, this._paddingOffset, Prim2DBase._size);
                    this._paddingOffset.x += Prim2DBase._icPos.x;
                    this._paddingOffset.y += Prim2DBase._icPos.y;
                    this._contentArea.copyFrom(Prim2DBase._size);
                }
            }
            else {
                this._getInitialContentAreaToRef(this.actualSize, Prim2DBase._icPos, Prim2DBase._icArea);
                Prim2DBase._icArea.width = Math.max(0, Prim2DBase._icArea.width);
                Prim2DBase._icArea.height = Math.max(0, Prim2DBase._icArea.height);
                this._paddingOffset.copyFrom(Prim2DBase._icPos);
                this._contentArea.copyFrom(Prim2DBase._icArea);
            }
            var aPos = new BABYLON.Vector2(this._layoutAreaPos.x + this._marginOffset.x, this._layoutAreaPos.y + this._marginOffset.y);
            this.actualPosition = aPos;
            if (isSizeAuto) {
                this._lastAutoSizeArea = this.size;
            }
        };
        Object.defineProperty(Prim2DBase.prototype, "contentArea", {
            /**
             * Get the content are of this primitive, this area is computed using the padding property and also possibly the primitive type itself.
             * Children of this primitive will be positioned relative to the bottom/left corner of this area.
             */
            get: function () {
                // Check for positioning update
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty)) {
                    this._updatePositioning();
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagPositioningDirty);
                }
                return this._contentArea;
            },
            enumerable: true,
            configurable: true
        });
        Prim2DBase.prototype._patchHierarchy = function (owner) {
            this._owner = owner;
            // The only place we initialize the _renderGroup is this method, if it's set, we already been there, no need to execute more
            if (this._renderGroup != null) {
                return;
            }
            if (this instanceof BABYLON.Group2D) {
                var group = this;
                group.detectGroupStates();
                if (group._trackedNode && !group._isFlagSet(BABYLON.SmartPropertyPrim.flagTrackedGroup)) {
                    group.owner._registerTrackedNode(this);
                }
            }
            if (this._parent) {
                this._renderGroup = this.parent.traverseUp(function (p) { return p instanceof BABYLON.Group2D && p.isRenderableGroup; });
                this._parentLayoutDirty();
            }
            // Make sure the prim is in the dirtyList if it should be
            if (this._renderGroup && this.isDirty) {
                var list = this._renderGroup._renderableData._primDirtyList;
                var i = list.indexOf(this);
                if (i === -1) {
                    list.push(this);
                }
            }
            // Recurse
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                child._hierarchyDepth = this._hierarchyDepth + 1;
                child._patchHierarchy(owner);
            }
        };
        Prim2DBase.prototype._updateZOrder = function () {
            var prevLinPos = this._primLinearPosition;
            var startI = 0;
            var startZ = this._zOrder;
            // We must start rebuilding Z-Order from the Prim before the first one that changed, because we know its Z-Order is correct, so are its children, but it's better to recompute everything from this point instead of finding the last valid children
            var childrenCount = this._children.length;
            if (this._firstZDirtyIndex > 0) {
                if ((this._firstZDirtyIndex - 1) < childrenCount) {
                    var prevPrim = this._children[this._firstZDirtyIndex - 1];
                    prevLinPos = prevPrim._primLinearPosition;
                    startI = this._firstZDirtyIndex - 1;
                    startZ = prevPrim._zOrder;
                }
            }
            var startPos = prevLinPos;
            // Update the linear position of the primitive from the first one to the last inside this primitive, compute the total number of prim traversed
            Prim2DBase._totalCount = 0;
            for (var i = startI; i < childrenCount; i++) {
                var child = this._children[i];
                prevLinPos = child._updatePrimitiveLinearPosition(prevLinPos);
            }
            // Compute the new Z-Order for all the primitives
            // Add 20% to the current total count to reserve space for future insertions, except if we're rebuilding due to a zMinDelta reached
            var zDelta = (this._zMax - startZ) / (Prim2DBase._totalCount * (Prim2DBase._zRebuildReentrency ? 1 : 1.2));
            // If the computed delta is less than the smallest allowed by the depth buffer, we rebuild the Z-Order from the very beginning of the primitive's children (that is, the first) to redistribute uniformly the Z.
            if (zDelta < BABYLON.Canvas2D._zMinDelta) {
                // Check for re-entrance, if the flag is true we already attempted a rebuild but couldn't get a better zDelta, go up in the hierarchy to rebuilt one level up, hoping to get this time a decent delta, otherwise, recurse until we got it or when no parent is reached, which would mean the canvas would have more than 16 millions of primitives...
                if (Prim2DBase._zRebuildReentrency) {
                    var p = this._parent;
                    if (p == null) {
                        // Can't find a good Z delta and we're in the canvas, which mean we're dealing with too many objects (which should never happen, but well...)
                        console.log("Can't compute Z-Order for " + this.id + "'s children, zDelta is too small, Z-Order is now in an unstable state");
                        Prim2DBase._zRebuildReentrency = false;
                        return;
                    }
                    p._firstZDirtyIndex = 0;
                    return p._updateZOrder();
                }
                Prim2DBase._zRebuildReentrency = true;
                this._firstZDirtyIndex = 0;
                this._updateZOrder();
                Prim2DBase._zRebuildReentrency = false;
            }
            for (var i = startI; i < childrenCount; i++) {
                var child = this._children[i];
                child._updatePrimitiveZOrder(startPos, startZ, zDelta);
            }
            // Notify the Observers that we found during the Z change (we do it after to avoid any kind of re-entrance)
            for (var _i = 0, _a = Prim2DBase._zOrderChangedNotifList; _i < _a.length; _i++) {
                var p = _a[_i];
                p._actualZOrderChangedObservable.notifyObservers(p.actualZOffset);
            }
            Prim2DBase._zOrderChangedNotifList.splice(0);
            this._firstZDirtyIndex = Prim2DBase._bigInt;
            this._clearFlags(BABYLON.SmartPropertyPrim.flagZOrderDirty);
        };
        Prim2DBase.prototype._updatePrimitiveLinearPosition = function (prevLinPos) {
            if (this.isManualZOrder) {
                return prevLinPos;
            }
            this._primLinearPosition = ++prevLinPos;
            Prim2DBase._totalCount++;
            // Check for the FlatZOrder, which means the children won't have a dedicated Z-Order but will all share the same (unique) one.
            if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder)) {
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    prevLinPos = child._updatePrimitiveLinearPosition(prevLinPos);
                }
            }
            return prevLinPos;
        };
        Prim2DBase.prototype._updatePrimitiveZOrder = function (startPos, startZ, deltaZ) {
            if (this.isManualZOrder) {
                return null;
            }
            var newZ = startZ + ((this._primLinearPosition - startPos) * deltaZ);
            var isFlat = this._isFlagSet(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder);
            this._setZOrder(newZ, false);
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagZOrderDirty)) {
                this._firstZDirtyIndex = Prim2DBase._bigInt;
                this._clearFlags(BABYLON.SmartPropertyPrim.flagZOrderDirty);
            }
            var curZ = newZ;
            // Check for the FlatZOrder, which means the children won't have a dedicated Z-Order but will all share the same (unique) one.
            if (isFlat) {
                if (this._children.length > 0) {
                    //let childrenZOrder = startZ + ((this._children[0]._primLinearPosition - startPos) * deltaZ);
                    for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        child._updatePrimitiveFlatZOrder(this._zOrder);
                    }
                }
            }
            else {
                for (var _b = 0, _c = this._children; _b < _c.length; _b++) {
                    var child = _c[_b];
                    var r = child._updatePrimitiveZOrder(startPos, startZ, deltaZ);
                    if (r != null) {
                        curZ = r;
                    }
                }
            }
            this._zMax = isFlat ? newZ : (curZ + deltaZ);
            return curZ;
        };
        Prim2DBase.prototype._updatePrimitiveFlatZOrder = function (newZ) {
            if (this.isManualZOrder) {
                return;
            }
            this._setZOrder(newZ, false);
            this._zMax = newZ;
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagZOrderDirty)) {
                this._firstZDirtyIndex = Prim2DBase._bigInt;
                this._clearFlags(BABYLON.SmartPropertyPrim.flagZOrderDirty);
            }
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                child._updatePrimitiveFlatZOrder(newZ);
            }
        };
        Prim2DBase.prototype._setZOrder = function (newZ, directEmit) {
            if (newZ !== this._zOrder) {
                this._zOrder = newZ;
                if (!this.isDirty) {
                    this.onPrimBecomesDirty();
                }
                this.onZOrderChanged();
                if (this._actualZOrderChangedObservable && this._actualZOrderChangedObservable.hasObservers()) {
                    if (directEmit) {
                        this._actualZOrderChangedObservable.notifyObservers(newZ);
                    }
                    else {
                        Prim2DBase._zOrderChangedNotifList.push(this);
                    }
                }
            }
        };
        Prim2DBase.prototype._updateRenderMode = function () {
        };
        /**
         * This method is used to alter the contentArea of the Primitive before margin is applied.
         * In most of the case you won't need to override this method, but it can prove some usefulness, check the Rectangle2D class for a concrete application.
         * @param primSize the current size of the primitive
         * @param initialContentPosition the position of the initial content area to compute, a valid object is passed, you have to set its properties. PLEASE ROUND the values, we're talking about pixels and fraction of them is not a good thing!
         * @param initialContentArea the size of the initial content area to compute, a valid object is passed, you have to set its properties. PLEASE ROUND the values, we're talking about pixels and fraction of them is not a good thing!
         */
        Prim2DBase.prototype._getInitialContentAreaToRef = function (primSize, initialContentPosition, initialContentArea) {
            initialContentArea.copyFrom(primSize);
            initialContentPosition.x = initialContentPosition.y = 0;
        };
        /**
         * This method is used to calculate the new size of the primitive based on the content which must stay the same
         * Check the Rectangle2D implementation for a concrete application.
         * @param primSize the current size of the primitive
         * @param newPrimSize the new size of the primitive. PLEASE ROUND THE values, we're talking about pixels and fraction of them are not our friends!
         */
        Prim2DBase.prototype._getActualSizeFromContentToRef = function (primSize, newPrimSize) {
            newPrimSize.copyFrom(primSize);
        };
        Prim2DBase.PRIM2DBASE_PROPCOUNT = 15;
        Prim2DBase._bigInt = Math.pow(2, 30);
        Prim2DBase._nullPosition = BABYLON.Vector2.Zero();
        Prim2DBase.boundinbBoxReentrency = false;
        Prim2DBase.nullSize = BABYLON.Size.Zero();
        Prim2DBase._bMax = BABYLON.Vector2.Zero();
        Prim2DBase._isCanvasInit = false;
        Prim2DBase._t0 = new BABYLON.Matrix();
        Prim2DBase._t1 = new BABYLON.Matrix();
        Prim2DBase._t2 = new BABYLON.Matrix();
        Prim2DBase._v0 = BABYLON.Vector2.Zero(); // Must stay with the value 0,0
        Prim2DBase._transMtx = BABYLON.Matrix.Zero();
        Prim2DBase._icPos = BABYLON.Vector2.Zero();
        Prim2DBase._icArea = BABYLON.Size.Zero();
        Prim2DBase._size = BABYLON.Size.Zero();
        Prim2DBase._zOrderChangedNotifList = new Array();
        Prim2DBase._zRebuildReentrency = false;
        Prim2DBase._totalCount = 0;
        __decorate([
            BABYLON.instanceLevelProperty(1, function (pi) { return Prim2DBase.actualPositionProperty = pi; }, false, false, true)
        ], Prim2DBase.prototype, "actualPosition", null);
        __decorate([
            BABYLON.dynamicLevelProperty(2, function (pi) { return Prim2DBase.positionProperty = pi; }, false, false, true)
        ], Prim2DBase.prototype, "position", null);
        __decorate([
            BABYLON.dynamicLevelProperty(3, function (pi) { return Prim2DBase.sizeProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "size", null);
        __decorate([
            BABYLON.instanceLevelProperty(4, function (pi) { return Prim2DBase.rotationProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "rotation", null);
        __decorate([
            BABYLON.instanceLevelProperty(5, function (pi) { return Prim2DBase.scaleProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "scale", null);
        __decorate([
            BABYLON.dynamicLevelProperty(6, function (pi) { return Prim2DBase.originProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "origin", null);
        __decorate([
            BABYLON.dynamicLevelProperty(7, function (pi) { return Prim2DBase.levelVisibleProperty = pi; })
        ], Prim2DBase.prototype, "levelVisible", null);
        __decorate([
            BABYLON.instanceLevelProperty(8, function (pi) { return Prim2DBase.isVisibleProperty = pi; })
        ], Prim2DBase.prototype, "isVisible", null);
        __decorate([
            BABYLON.instanceLevelProperty(9, function (pi) { return Prim2DBase.zOrderProperty = pi; })
        ], Prim2DBase.prototype, "zOrder", null);
        __decorate([
            BABYLON.dynamicLevelProperty(10, function (pi) { return Prim2DBase.marginProperty = pi; })
        ], Prim2DBase.prototype, "margin", null);
        __decorate([
            BABYLON.dynamicLevelProperty(11, function (pi) { return Prim2DBase.paddingProperty = pi; })
        ], Prim2DBase.prototype, "padding", null);
        __decorate([
            BABYLON.dynamicLevelProperty(12, function (pi) { return Prim2DBase.marginAlignmentProperty = pi; })
        ], Prim2DBase.prototype, "marginAlignment", null);
        __decorate([
            BABYLON.instanceLevelProperty(13, function (pi) { return Prim2DBase.opacityProperty = pi; })
        ], Prim2DBase.prototype, "opacity", null);
        Prim2DBase = __decorate([
            BABYLON.className("Prim2DBase")
        ], Prim2DBase);
        return Prim2DBase;
    })(BABYLON.SmartPropertyPrim);
    BABYLON.Prim2DBase = Prim2DBase;
})(BABYLON || (BABYLON = {}));
