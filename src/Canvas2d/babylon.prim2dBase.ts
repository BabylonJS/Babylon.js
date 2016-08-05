module BABYLON {

    export class PrepareRender2DContext {
        constructor() {
            this.forceRefreshPrimitive = false;
        }

        /**
         * True if the primitive must be refreshed no matter what
         * This mode is needed because sometimes the primitive doesn't change by itself, but external changes make a refresh of its InstanceData necessary
         */
        forceRefreshPrimitive: boolean;
    }

    export class Render2DContext {

        constructor(renderMode: number) {
            this._renderMode = renderMode;
            this.useInstancing = false;
            this.groupInfoPartData = null;
            this.partDataStartIndex = this.partDataEndIndex = null;
            this.instancedBuffers = null;
        }
        /**
         * Define which render Mode should be used to render the primitive: one of Render2DContext.RenderModeXxxx property
         */
        get renderMode(): number {
            return this._renderMode;
        }

        /**
         * If true hardware instancing is supported and must be used for the rendering. The groupInfoPartData._partBuffer must be used.
         * If false rendering on a per primitive basis must be made. The following properties must be used
         *  - groupInfoPartData._partData: contains the primitive instances data to render
         *  - partDataStartIndex: the index into instanceArrayData of the first instance to render.
         *  - partDataCount: the number of primitive to render
         */
        useInstancing: boolean;

        /**
         * If specified, must take precedence from the groupInfoPartData. partIndex is the same as groupInfoPardData
         */
        instancedBuffers: WebGLBuffer[];

        /**
         * To use when instancedBuffers is specified, gives the count of instances to draw
         */
        instancesCount: number;

        /**
         * Contains the data related to the primitives instances to render
         */
        groupInfoPartData: GroupInfoPartData[];

        /**
         * The index into groupInfoPartData._partData of the first primitive to render. This is an index, not an offset: it represent the nth primitive which is the first to render.
         */
        partDataStartIndex: number;

        /**
         * The exclusive end index, you have to render the primitive instances until you reach this one, but don't render this one!
         */
        partDataEndIndex: number;

        /**
         * The set of primitives to render is opaque.
         * This is the first rendering pass. All Opaque primitives are rendered. Depth Compare and Write are both enabled.
         */
        public static get RenderModeOpaque(): number {
            return Render2DContext._renderModeOpaque;
        }

        /**
         * The set of primitives to render is using Alpha Test (aka masking).
         * Alpha Blend is enabled, the AlphaMode must be manually set, the render occurs after the RenderModeOpaque and is depth independent (i.e. primitives are not sorted by depth). Depth Compare and Write are both enabled.
         */
        public static get RenderModeAlphaTest(): number {
            return Render2DContext._renderModeAlphaTest;
        }

        /**
         * The set of primitives to render is transparent.
         * Alpha Blend is enabled, the AlphaMode must be manually set, the render occurs after the RenderModeAlphaTest and is depth dependent (i.e. primitives are stored by depth and rendered back to front). Depth Compare is on, but Depth write is Off.
         */
        public static get RenderModeTransparent(): number {
            return Render2DContext._renderModeTransparent;
        }

        private static _renderModeOpaque: number = 1;
        private static _renderModeAlphaTest: number = 2;
        private static _renderModeTransparent: number = 3;

        private _renderMode: number;
    }

    /**
     * This class store information for the pointerEventObservable Observable.
     * The Observable is divided into many sub events (using the Mask feature of the Observable pattern): PointerOver, PointerEnter, PointerDown, PointerMouseWheel, PointerMove, PointerUp, PointerDown, PointerLeave, PointerGotCapture and PointerLostCapture.
     */
    export class PrimitivePointerInfo {
        private static _pointerOver = 0x0001;
        private static _pointerEnter = 0x0002;
        private static _pointerDown = 0x0004;
        private static _pointerMouseWheel = 0x0008;
        private static _pointerMove = 0x0010;
        private static _pointerUp = 0x0020;
        private static _pointerOut = 0x0040;
        private static _pointerLeave = 0x0080;
        private static _pointerGotCapture = 0x0100;
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
        }
    }

    /**
     * Defines the horizontal and vertical alignment information for a Primitive.
     */
    export class PrimitiveAlignment {
        constructor(changeCallback: () => void) {
            this._changedCallback = changeCallback;
            this._horizontal = PrimitiveAlignment.AlignLeft;
            this._vertical = PrimitiveAlignment.AlignBottom;
        }

        /**
         * Alignment is made relative to the left edge of the Primitive. Valid for horizontal alignment only.
         */
        public static get AlignLeft(): number { return PrimitiveAlignment._AlignLeft; }

        /**
         * Alignment is made relative to the top edge of the Primitive. Valid for vertical alignment only.
         */
        public static get AlignTop(): number { return PrimitiveAlignment._AlignTop; }

        /**
         * Alignment is made relative to the right edge of the Primitive. Valid for horizontal alignment only.
         */
        public static get AlignRight(): number { return PrimitiveAlignment._AlignRight; }

        /**
         * Alignment is made relative to the bottom edge of the Primitive. Valid for vertical alignment only.
         */
        public static get AlignBottom(): number { return PrimitiveAlignment._AlignBottom; }

        /**
         * Alignment is made to center the content from equal distance to the opposite edges of the Primitive
         */
        public static get AlignCenter(): number { return PrimitiveAlignment._AlignCenter; }

        /**
         * The content is stretched toward the opposite edges of the Primitive
         */
        public static get AlignStretch(): number { return PrimitiveAlignment._AlignStretch; }

        private static _AlignLeft = 1;
        private static _AlignTop = 1;   // Same as left
        private static _AlignRight = 2;
        private static _AlignBottom = 2;   // Same as right
        private static _AlignCenter = 3;
        private static _AlignStretch = 4;

        /**
         * Get/set the horizontal alignment. Use one of the AlignXXX static properties of this class
         */
        public get horizontal(): number {
            return this._horizontal;
        }

        public set horizontal(value: number) {
            if (this._horizontal === value) {
                return;
            }

            this._horizontal = value;
            this._changedCallback();
        }

        /**
         * Get/set the vertical alignment. Use one of the AlignXXX static properties of this class
         */
        public get vertical(): number {
            return this._vertical;
        }

        public set vertical(value: number) {
            if (this._vertical === value) {
                return;
            }

            this._vertical = value;
            this._changedCallback();
        }

        private _changedCallback: () => void;
        private _horizontal: number;
        private _vertical: number;

        /**
         * Set the horizontal alignment from a string value.
         * @param text can be either: 'left','right','center','stretch'
         */
        setHorizontal(text: string) {
            let v = text.trim().toLocaleLowerCase();
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
        }

        /**
         * Set the vertical alignment from a string value.
         * @param text can be either: 'top','bottom','center','stretch'
         */
        setVertical(text: string) {
            let v = text.trim().toLocaleLowerCase();
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
        }

        /**
         * Set the horizontal and or vertical alignments from a string value.
         * @param text can be: [<h:|horizontal:><left|right|center|stretch>], [<v:|vertical:><top|bottom|center|stretch>]
         */
        fromString(value: string) {
            let m = value.trim().split(",");
            for (let v of m) {
                v = v.toLocaleLowerCase().trim();

                // Horizontal
                let i = v.indexOf("h:");
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
     * Define a thickness toward every edges of a Primitive to allow margin and padding.
     * The thickness can be expressed as pixels, percentages, inherit the value of the parent primitive or be auto.
     */
    export class PrimitiveThickness {
        constructor(parentAccess: () => PrimitiveThickness, changedCallback: () => void) {
            this._parentAccess = parentAccess;
            this._changedCallback = changedCallback;
            this._pixels = new Array<number>(4);
            this._percentages = new Array<number>(4);
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
        public fromString(thickness: string) {
            this._clear();

            let m = thickness.trim().split(",");

            // Special case, one value to apply to all edges
            if (m.length === 1 && thickness.indexOf(":") === -1) {
                this._setStringValue(m[0], 0, false);
                this._setStringValue(m[0], 1, false);
                this._setStringValue(m[0], 2, false);
                this._setStringValue(m[0], 3, false);

                this._changedCallback();
                return;
            }

            let res = false;
            for (let cm of m) {
                res = this._extractString(cm, false) || res;
            }

            if (!res) {
                throw new Error("Can't parse the string to create a PrimitiveMargin object, format must be: 'top: <value>, left:<value>, right:<value>, bottom:<value>");
            }

            // Check the margin that weren't set and set them in auto
            if ((this._flags & 0x000F) === 0) this._flags |= PrimitiveThickness.Pixel << 0;
            if ((this._flags & 0x00F0) === 0) this._flags |= PrimitiveThickness.Pixel << 4;
            if ((this._flags & 0x0F00) === 0) this._flags |= PrimitiveThickness.Pixel << 8;
            if ((this._flags & 0xF000) === 0) this._flags |= PrimitiveThickness.Pixel << 12;

            this._changedCallback();

        }

        /**
         * Set the thickness from multiple string
         * Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         * @param top the top thickness to set
         * @param left the left thickness to set
         * @param right the right thickness to set
         * @param bottom the bottom thickness to set
         */
        public fromStrings(top: string, left: string, right: string, bottom: string): PrimitiveThickness {
            this._clear();

            this._setStringValue(top, 0, false);
            this._setStringValue(left, 1, false);
            this._setStringValue(right, 2, false);
            this._setStringValue(bottom, 3, false);
            this._changedCallback();
            return this;
        }

        /**
         * Set the thickness from pixel values
         * @param top the top thickness in pixels to set
         * @param left the left thickness in pixels to set
         * @param right the right thickness in pixels to set
         * @param bottom the bottom thickness in pixels to set
         */
        public fromPixels(top: number, left: number, right: number, bottom: number): PrimitiveThickness {
            this._clear();

            this._pixels[0] = top;
            this._pixels[1] = left;
            this._pixels[2] = right;
            this._pixels[3] = bottom;
            this._changedCallback();
            return this;
        }

        /**
         * Apply the same pixel value to all edges
         * @param margin the value to set, in pixels.
         */
        public fromUniformPixels(margin: number): PrimitiveThickness {
            this._clear();

            this._pixels[0] = margin;
            this._pixels[1] = margin;
            this._pixels[2] = margin;
            this._pixels[3] = margin;
            this._changedCallback();
            return this;
        }

        /**
         * Set all edges in auto
         */
        public auto(): PrimitiveThickness {
            this._clear();

            this._flags = (PrimitiveThickness.Auto << 0) | (PrimitiveThickness.Auto << 4) | (PrimitiveThickness.Auto << 8) | (PrimitiveThickness.Auto << 12);
            this._pixels[0] = 0;
            this._pixels[1] = 0;
            this._pixels[2] = 0;
            this._pixels[3] = 0;
            this._changedCallback();
            return this;
        }

        private _clear() {
            this._flags = 0;
            this._pixels[0] = 0;
            this._pixels[1] = 0;
            this._pixels[2] = 0;
            this._pixels[3] = 0;
            this._percentages[0] = null;
            this._percentages[1] = null;
            this._percentages[2] = null;
            this._percentages[3] = null;
        }

        private _extractString(value: string, emitChanged: boolean): boolean {
            let v = value.trim().toLocaleLowerCase();

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
        }

        private _setStringValue(value: string, index: number, emitChanged: boolean): boolean {
            // Check for auto
            let v = value.trim().toLocaleLowerCase();
            if (v === "auto") {
                if (this._isType(index, PrimitiveThickness.Auto)) {
                    return true;
                }
                this._setType(index, PrimitiveThickness.Auto);
                this._pixels[index] = 0;
                if (emitChanged) {
                    this._changedCallback();
                }
            } else if (v === "inherit") {
                if (this._isType(index, PrimitiveThickness.Inherit)) {
                    return true;
                }
                this._setType(index, PrimitiveThickness.Inherit);
                this._pixels[index] = null;
                if (emitChanged) {
                    this._changedCallback();
                }
            } else {
                let pI = v.indexOf("%");

                // Check for percentage
                if (pI !== -1) {
                    let n = v.substr(0, pI);
                    let number = Math.round(Number(n)) / 100; // Normalize the percentage to [0;1] with a 0.01 precision
                    if (this._isType(index, PrimitiveThickness.Percentage) && (this._percentages[index] === number)) {
                        return true;
                    }

                    this._setType(index, PrimitiveThickness.Percentage);

                    if (isNaN(number)) {
                        return false;
                    }
                    this._percentages[index] = number;

                    if (emitChanged) {
                        this._changedCallback();
                    }

                    return true;
                }

                // Check for pixel
                let n: string;
                pI = v.indexOf("px");
                if (pI !== -1) {
                    n = v.substr(0, pI).trim();
                } else {
                    n = v;
                }
                let number = Number(n);
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
        }

        private _setPixels(value: number, index: number, emitChanged: boolean) {
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
        }

        private _setPercentage(value: number, index: number, emitChanged: boolean) {
            // Clip Value to bounds
            value = Math.min(1, value);
            value = Math.max(0, value);
            value = Math.round(value * 100) / 100;  // 0.01 precision

            if (this._isType(index, PrimitiveThickness.Percentage) && this._percentages[index] === value) {
                return;
            }
            this._setType(index, PrimitiveThickness.Percentage);
            this._percentages[index] = value;

            if (emitChanged) {
                this._changedCallback();
            }
        }

        private _getStringValue(index: number): string {
            let f = (this._flags >> (index * 4)) & 0xF;
            switch (f) {
                case PrimitiveThickness.Auto:
                    return "auto";
                case PrimitiveThickness.Pixel:
                    return `${this._pixels[index]}px`;
                case PrimitiveThickness.Percentage:
                    return `${this._percentages[index] * 100}%`;
                case PrimitiveThickness.Inherit:
                    return "inherit";
            }
            return "";
        }

        private _isType(index: number, type: number): boolean {
            let f = (this._flags >> (index * 4)) & 0xF;
            return f === type;
        }

        private _getType(index: number, processInherit: boolean): number {
            let t = (this._flags >> (index * 4)) & 0xF;
            if (processInherit && (t === PrimitiveThickness.Inherit)) {
                let p = this._parentAccess();
                if (p) {
                    return p._getType(index, true);
                }
                return PrimitiveThickness.Auto;
            }
            return t;
        }

        private _setType(index: number, type: number) {
            this._flags &= ~(0xF << (index * 4));
            this._flags |= type << (index * 4);
        }

        public setTop(value: number | string) {
            if (typeof value === "string") {
                this._setStringValue(value, 0, true);
            } else {
                this.topPixels = value;
            }
        }

        public setLeft(value: number | string) {
            if (typeof value === "string") {
                this._setStringValue(value, 1, true);
            } else {
                this.leftPixels = value;
            }
        }

        public setRight(value: number | string) {
            if (typeof value === "string") {
                this._setStringValue(value, 2, true);
            } else {
                this.rightPixels = value;
            }
        }

        public setBottom(value: number | string) {
            if (typeof value === "string") {
                this._setStringValue(value, 3, true);
            } else {
                this.bottomPixels = value;
            }
        }

        /**
         * Get/set the top thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         */
        public get top(): string {
            return this._getStringValue(0);
        }

        public set top(value: string) {
            this._setStringValue(value, 0, true);
        }

        /**
         * Get/set the left thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         */
        public get left(): string {
            return this._getStringValue(1);
        }

        public set left(value: string) {
            this._setStringValue(value, 1, true);
        }

        /**
         * Get/set the right thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         */
        public get right(): string {
            return this._getStringValue(2);
        }

        public set right(value: string) {
            this._setStringValue(value, 2, true);
        }

        /**
         * Get/set the bottom thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         */
        public get bottom(): string {
            return this._getStringValue(3);
        }

        public set bottom(value: string) {
            this._setStringValue(value, 3, true);
        }

        /**
         * Get/set the top thickness in pixel.
         */
        public get topPixels(): number {
            return this._pixels[0];
        }

        public set topPixels(value: number) {
            this._setPixels(value, 0, true);

        }

        /**
         * Get/set the left thickness in pixel.
         */
        public get leftPixels(): number {
            return this._pixels[1];
        }

        public set leftPixels(value: number) {
            this._setPixels(value, 1, true);

        }

        /**
         * Get/set the right thickness in pixel.
         */
        public get rightPixels(): number {
            return this._pixels[2];
        }

        public set rightPixels(value: number) {
            this._setPixels(value, 2, true);

        }

        /**
         * Get/set the bottom thickness in pixel.
         */
        public get bottomPixels(): number {
            return this._pixels[3];
        }

        public set bottomPixels(value: number) {
            this._setPixels(value, 3, true);

        }

        /**
         * Get/set the top thickness in percentage.
         * The get will return a valid value only if the edge type is percentage.
         * The Set will change the edge mode if needed
         */
        public get topPercentage(): number {
            return this._percentages[0];
        }

        public set topPercentage(value: number) {
            this._setPercentage(value, 0, true);

        }
        /**
         * Get/set the left thickness in percentage.
         * The get will return a valid value only if the edge mode is percentage.
         * The Set will change the edge mode if needed
         */
        public get leftPercentage(): number {
            return this._percentages[1];
        }

        public set leftPercentage(value: number) {
            this._setPercentage(value, 1, true);

        }
        /**
         * Get/set the right thickness in percentage.
         * The get will return a valid value only if the edge mode is percentage.
         * The Set will change the edge mode if needed
         */
        public get rightPercentage(): number {
            return this._percentages[2];
        }

        public set rightPercentage(value: number) {
            this._setPercentage(value, 2, true);

        }
        /**
         * Get/set the bottom thickness in percentage.
         * The get will return a valid value only if the edge mode is percentage.
         * The Set will change the edge mode if needed
         */
        public get bottomPercentage(): number {
            return this._percentages[3];
        }

        public set bottomPercentage(value: number) {
            this._setPercentage(value, 3, true);

        }

        /**
         * Get/set the top mode. The setter shouldn't be used, other setters with value should be preferred
         */
        public get topMode(): number {
            return this._getType(0, false);
        }

        public set topMode(mode: number) {
            this._setType(0, mode);
        }

        /**
         * Get/set the left mode. The setter shouldn't be used, other setters with value should be preferred
         */
        public get leftMode(): number {
            return this._getType(1, false);
        }

        public set leftMode(mode: number) {
            this._setType(1, mode);
        }

        /**
         * Get/set the right mode. The setter shouldn't be used, other setters with value should be preferred
         */
        public get rightMode(): number {
            return this._getType(2, false);
        }

        public set rightMode(mode: number) {
            this._setType(2, mode);
        }

        /**
         * Get/set the bottom mode. The setter shouldn't be used, other setters with value should be preferred
         */
        public get bottomMode(): number {
            return this._getType(3, false);
        }

        public set bottomMode(mode: number) {
            this._setType(3, mode);
        }

        private _parentAccess: () => PrimitiveThickness;
        private _changedCallback: () => void;
        private _pixels: number[];
        private _percentages: number[];     // Percentages are in fact stored in a normalized range [0;1] with a 0.01 precision
        private _flags: number;

        public static Auto = 0x1;
        public static Inherit = 0x2;
        public static Percentage = 0x4;
        public static Pixel = 0x8;

        private _computePixels(index: number, sourceArea: Size, emitChanged: boolean) {
            let type = this._getType(index, false);

            if (type === PrimitiveThickness.Inherit) {
                this._parentAccess()._computePixels(index, sourceArea, emitChanged);
                return;
            }

            if (type !== PrimitiveThickness.Percentage) {
                return;
            }

            let pixels = ((index === 0 || index === 3) ? sourceArea.height : sourceArea.width) * this._percentages[index];
            this._pixels[index] = pixels;

            if (emitChanged) {
                this._changedCallback();
            }
        }

        /**
         * Compute the positioning/size of an area considering the thickness of this object and a given alignment
         * @param sourceArea the source area
         * @param contentSize the content size to position/resize
         * @param alignment the alignment setting
         * @param dstOffset the position of the content
         * @param dstArea the new size of the content
         */
        public computeWithAlignment(sourceArea: Size, contentSize: Size, alignment: PrimitiveAlignment, dstOffset: Vector2, dstArea: Size) {
            // Fetch some data
            let topType = this._getType(0, true);
            let leftType = this._getType(1, true);
            let rightType = this._getType(2, true);
            let bottomType = this._getType(3, true);
            let hasWidth = contentSize && (contentSize.width != null);
            let hasHeight = contentSize && (contentSize.height != null);
            let width = hasWidth ? contentSize.width : 0;
            let height = hasHeight ? contentSize.height : 0;
            let isTopAuto = topType === PrimitiveThickness.Auto;
            let isLeftAuto = leftType === PrimitiveThickness.Auto;
            let isRightAuto = rightType === PrimitiveThickness.Auto;
            let isBottomAuto = bottomType === PrimitiveThickness.Auto;

            switch (alignment.horizontal) {
                case PrimitiveAlignment.AlignLeft:
                    {
                        if (isLeftAuto) {
                            dstOffset.x = 0;
                        } else {
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
                        } else {
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
                        } else {
                            this._computePixels(1, sourceArea, true);
                            dstOffset.x = this.leftPixels;
                        }

                        let right = 0;
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

                        let offset = (isLeftAuto ? 0 : this.leftPixels) - (isRightAuto ? 0 : this.rightPixels);
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
                        } else {
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
                        } else {
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
                        } else {
                            this._computePixels(3, sourceArea, true);
                            dstOffset.y = this.bottomPixels;
                        }

                        let top = 0;
                        if (!isTopAuto) {
                            this._computePixels(0, sourceArea, true);
                            top = this.topPixels;
                        }
                        dstArea.height = sourceArea.height - (dstOffset.y + top);
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

                        let offset = (isBottomAuto ? 0 : this.bottomPixels) - (isTopAuto ? 0 : this.topPixels);
                        dstOffset.y = Math.round(((sourceArea.height - height) / 2) + offset);
                        dstArea.height = height;
                        break;
                    }
            }
        }

        /**
         * Compute an area and its position considering this thickness properties based on a given source area
         * @param sourceArea the source area
         * @param dstOffset the position of the resulting area
         * @param dstArea the size of the resulting area
         */
        public compute(sourceArea: Size, dstOffset: Vector2, dstArea: Size) {
            this._computePixels(0, sourceArea, true);
            this._computePixels(1, sourceArea, true);
            this._computePixels(2, sourceArea, true);
            this._computePixels(3, sourceArea, true);

            dstOffset.x = this.leftPixels;
            dstArea.width = sourceArea.width - (dstOffset.x + this.rightPixels);

            dstOffset.y = this.bottomPixels;
            dstArea.height = sourceArea.height - (dstOffset.y + this.topPixels);
        }

        /**
         * Compute an area considering this thickness properties based on a given source area
         * @param sourceArea the source area
         * @param result the resulting area
         */
        computeArea(sourceArea: Size, result: Size) {
            this._computePixels(0, sourceArea, true);
            this._computePixels(1, sourceArea, true);
            this._computePixels(2, sourceArea, true);
            this._computePixels(3, sourceArea, true);

            result.width = this.leftPixels + sourceArea.width + this.rightPixels;
            result.height = this.bottomPixels + sourceArea.height + this.topPixels;
        }

        enlarge(sourceArea: Size, dstOffset: Vector2, enlargedArea: Size) {
            this._computePixels(0, sourceArea, true);
            this._computePixels(1, sourceArea, true);
            this._computePixels(2, sourceArea, true);
            this._computePixels(3, sourceArea, true);

            dstOffset.x = this.leftPixels;
            enlargedArea.width = sourceArea.width + (dstOffset.x + this.rightPixels);

            dstOffset.y = this.bottomPixels;
            enlargedArea.height = sourceArea.height + (dstOffset.y + this.topPixels);
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

        public isPrimIntersected(prim: Prim2DBase): Vector2 {
            for (let cur of this.intersectedPrimitives) {
                if (cur.prim === prim) {
                    return cur.intersectionLocation;
                }
            }
            return null;
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
        static PRIM2DBASE_PROPCOUNT: number = 16;
        public  static _bigInt = Math.pow(2, 30);

        constructor(settings: {
            parent?: Prim2DBase,
            id?: string,
            children?: Array<Prim2DBase>,
            position?: Vector2,
            x?: number,
            y?: number,
            rotation?: number,
            scale?: number,
            scaleX?: number,
            scaleY?: number,
            opacity?: number,
            origin?: Vector2,
            layoutEngine?: LayoutEngineBase | string,
            isVisible?: boolean,
            childrenFlatZOrder?: boolean,
            marginTop?: number | string,
            marginLeft?: number | string,
            marginRight?: number | string,
            marginBottom?: number | string,
            margin?: number | string,
            marginHAlignment?: number,
            marginVAlignment?: number,
            marginAlignment?: string,
            paddingTop?: number | string,
            paddingLeft?: number | string,
            paddingRight?: number | string,
            paddingBottom?: number | string,
            padding?: string,
        }) {

            // Avoid checking every time if the object exists
            if (settings == null) {
                settings = {};
            }

            // BASE CLASS CALL
            super();

            // Fetch the owner, parent. There're many ways to do it and we can end up with nothing for both
            let owner: Canvas2D;
            let parent: Prim2DBase;
            if (Prim2DBase._isCanvasInit) {
                owner = <Canvas2D><any>this;
                parent = null;
                this._canvasPreInit(settings);
            } else {
                if (settings.parent != null) {
                    parent = settings.parent;
                    owner = settings.parent.owner;
                    if (!owner) {
                        throw new Error(`Parent ${parent.id} of ${settings.id} doesn't have a valid owner!`);
                    }

                    if (!(this instanceof Group2D) && !(this instanceof Sprite2D && settings.id != null && settings.id.indexOf("__cachedSpriteOfGroup__") === 0) && (owner.cachingStrategy === Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) && (parent === owner)) {
                        throw new Error("Can't create a primitive with the canvas as direct parent when the caching strategy is TOPLEVELGROUPS. You need to create a Group below the canvas and use it as the parent for the primitive");
                    }
                }
            }

            // Fields initialization
            this._layoutEngine = CanvasLayoutEngine.Singleton;
            this._size = null; //Size.Zero();
            this._scale = new Vector2(1, 1);
            this._actualSize = null;
            this._boundingSize = Size.Zero();
            this._layoutArea = Size.Zero();
            this._layoutAreaPos = Vector2.Zero();
            this._marginOffset = Vector2.Zero();
            this._paddingOffset = Vector2.Zero();
            this._parentPaddingOffset = Vector2.Zero();
            this._parentContentArea = Size.Zero();
            this._lastAutoSizeArea = Size.Zero();
            this._contentArea = new Size(null, null);
            this._pointerEventObservable = new Observable<PrimitivePointerInfo>();
            this._boundingInfo = new BoundingInfo2D();
            this._owner = owner;
            this._parent = null;
            this._margin = null;
            this._padding = null;
            this._marginAlignment = null;
            this._id = settings.id;
            this.propertyChanged = new Observable<PropertyChangedInfo>();
            this._children = new Array<Prim2DBase>();
            this._localTransform = new Matrix();
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
            this._setFlags(SmartPropertyPrim.flagIsPickable | SmartPropertyPrim.flagBoundingInfoDirty | SmartPropertyPrim.flagActualOpacityDirty);

            if (settings.opacity != null) {
                this._opacity = settings.opacity;
            } else {
                this._opacity = 1;
            }

            this._updateRenderMode();

            if (settings.childrenFlatZOrder) {
                this._setFlags(SmartPropertyPrim.flagChildrenFlatZOrder);
            }

            // If the parent is given, initialize the hierarchy/owner related data
            if (parent != null) {
                parent.addChild(this);
                this._patchHierarchy(parent.owner);
            }

            // If it's a group, detect its own states
            if (this.owner && this instanceof Group2D) {
                var group: any = this;
                group.detectGroupStates();
            }

            // Time to insert children if some are specified
            if (settings.children != null) {
                for (let child of settings.children) {
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
                this.position = new Vector2(settings.x || 0, settings.y || 0);
            } else {
                this._position = null;
            }
            this.rotation = (settings.rotation == null) ? 0 : settings.rotation;

            if (settings.scale != null) {
                this.scale = settings.scale;
            } else {
                if (settings.scaleX != null) {
                    this.scaleX = settings.scaleX;
                }
                if (settings.scaleY != null) {
                    this.scaleY = settings.scaleY;
                }
            }
            this.levelVisible = (settings.isVisible == null) ? true : settings.isVisible;
            this.origin = settings.origin || new Vector2(0.5, 0.5);

            // Layout Engine
            if (settings.layoutEngine != null) {
                if (typeof settings.layoutEngine === "string") {
                    let name = (<string>settings.layoutEngine).toLocaleLowerCase().trim();
                    if (name === "canvas" || name === "canvaslayoutengine") {
                        this.layoutEngine = CanvasLayoutEngine.Singleton;
                    } else if (name.indexOf("stackpanel") === 0 || name.indexOf("horizontalstackpanel") === 0) {
                        this.layoutEngine = StackPanelLayoutEngine.Horizontal;
                    } else if (name.indexOf("verticalstackpanel") === 0) {
                        this.layoutEngine = StackPanelLayoutEngine.Vertical;
                    }
                } else if (settings.layoutEngine instanceof LayoutEngineBase) {
                    this.layoutEngine = <LayoutEngineBase>settings.layoutEngine;
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
                    this.margin.fromString(<string>settings.margin);
                } else {
                    this.margin.fromUniformPixels(<number>settings.margin);
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
         * Metadata of the actualPosition property
         */
        public static actualPositionProperty: Prim2DPropInfo;

        /**
         * Metadata of the size property
         */
        public static sizeProperty: Prim2DPropInfo;

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

        /**
         * Metadata of the margin property
         */
        public static marginProperty: Prim2DPropInfo;

        /**
         * Metadata of the margin property
         */
        public static paddingProperty: Prim2DPropInfo;

        /**
         * Metadata of the hAlignment property
         */
        public static marginAlignmentProperty: Prim2DPropInfo;

        /**
         * Metadata of the opacity property
         */
        public static opacityProperty: Prim2DPropInfo;


        /**
         * Metadata of the scaleX property
         */
        public static scaleXProperty: Prim2DPropInfo;

        /**
         * Metadata of the scaleY property
         */
        public static scaleYProperty: Prim2DPropInfo;

        @instanceLevelProperty(1, pi => Prim2DBase.actualPositionProperty = pi, false, false, true)
        /**
         * Return the position where the primitive is rendered in the Canvas, this position may be different than the one returned by the position property due to layout/alignment/margin/padding computing
         */
        public get actualPosition(): Vector2 {
            if (this._actualPosition != null) {
                return this._actualPosition;
            }
            if (this._position != null) {
                return this._position;
            }

            // At least return 0,0, we can't return null on actualPosition
            return Prim2DBase._nullPosition;
        }
        private static _nullPosition = Vector2.Zero();

        /**
         * DO NOT INVOKE for internal purpose only
         */
        public set actualPosition(val: Vector2) {
            this._actualPosition = val;
        }

        /**
         * Shortcut to actualPosition.x
         */
        public get actualX(): number {
            return this.actualPosition.x;
        }

        /**
         * Shortcut to actualPosition.y
         */
        public get actualY(): number {
            return this.actualPosition.y;
        }

        /**
         * Position of the primitive, relative to its parent.
         * BEWARE: if you change only position.x or y it won't trigger a property change and you won't have the expected behavior.
         * Use this property to set a new Vector2 object, otherwise to change only the x/y use Prim2DBase.x or y properties.
         * Setting this property may have no effect is specific alignment are in effect.
         */
        @dynamicLevelProperty(2, pi => Prim2DBase.positionProperty = pi, false, false, true)
        public get position(): Vector2 {
            return this._position || Prim2DBase._nullPosition;
        }

        public set position(value: Vector2) {
            if (!this._checkPositionChange()) {
                return;
            }
            this._position = value;
            this.markAsDirty("actualPosition");
        }

        /**
         * Direct access to the position.x value of the primitive
         * Use this property when you only want to change one component of the position property
         */
        public get x(): number {
            if (!this._position) {
                return null;
            }
            return this._position.x;
        }

        public set x(value: number) {
            if (!this._checkPositionChange()) {
                return;
            }
            if (!this._position) {
                this._position = Vector2.Zero();
            }

            if (this._position.x === value) {
                return;
            }

            this._position.x = value;
            this.markAsDirty("position");
            this.markAsDirty("actualPosition");
        }

        /**
         * Direct access to the position.y value of the primitive
         * Use this property when you only want to change one component of the position property
         */
        public get y(): number {
            if (!this._position) {
                return null;
            }
            return this._position.y;
        }

        public set y(value: number) {
            if (!this._checkPositionChange()) {
                return;
            }
            if (!this._position) {
                this._position = Vector2.Zero();
            }

            if (this._position.y === value) {
                return;
            }

            this._position.y = value;
            this.markAsDirty("position");
            this.markAsDirty("actualPosition");
        }

        private static boundinbBoxReentrency = false;
        protected static nullSize = Size.Zero();

        /**
         * Size of the primitive or its bounding area
         * BEWARE: if you change only size.width or height it won't trigger a property change and you won't have the expected behavior.
         * Use this property to set a new Size object, otherwise to change only the width/height use Prim2DBase.width or height properties.
         */
        @dynamicLevelProperty(3, pi => Prim2DBase.sizeProperty = pi, false, true)
        public get size(): Size {

            if (!this._size || this._size.width == null || this._size.height == null) {

                if (Prim2DBase.boundinbBoxReentrency) {
                    return Prim2DBase.nullSize;
                }

                if (!this._isFlagSet(SmartPropertyPrim.flagBoundingInfoDirty)) {
                    return this._boundingSize;
                }

                Prim2DBase.boundinbBoxReentrency = true;
                let b = this.boundingInfo;
                Prim2DBase.boundinbBoxReentrency = false;

                return this._boundingSize;

            }

            return this._size;
        }

        public set size(value: Size) {
            this._size = value;
        }

        /**
         * Direct access to the size.width value of the primitive
         * Use this property when you only want to change one component of the size property
         */
        public get width(): number {
            if (!this.size) {
                return null;
            }
            return this.size.width;
        }

        public set width(value: number) {
            if (!this.size) {
                this.size = new Size(value, 0);
                return;
            }

            if (this.size.width === value) {
                return;
            }

            this.size.width = value;
            this.markAsDirty("size");
            this._positioningDirty();
        }

        /**
         * Direct access to the size.height value of the primitive
         * Use this property when you only want to change one component of the size property
         */
        public get height(): number {
            if (!this.size) {
                return null;
            }
            return this.size.height;
        }

        public set height(value: number) {
            if (!this.size) {
                this.size = new Size(0, value);
                return;
            }

            if (this.size.height === value) {
                return;
            }

            this.size.height = value;
            this.markAsDirty("size");
            this._positioningDirty();
        }

        @instanceLevelProperty(4, pi => Prim2DBase.rotationProperty = pi, false, true)
        /**
         * Rotation of the primitive, in radian, along the Z axis
         */
        public get rotation(): number {
            return this._rotation;
        }

        public set rotation(value: number) {
            this._rotation = value;
        }

        @instanceLevelProperty(5, pi => Prim2DBase.scaleProperty = pi, false, true)
        /**
         * Uniform scale applied on the primitive. If a non-uniform scale is applied through scaleX/scaleY property the getter of this property will return scaleX.
         */
        public set scale(value: number) {
            this._scale.x = this._scale.y = value;
        }

        public get scale(): number {
            return this._scale.x;
        }

        /**
         * Return the size of the primitive as it's being rendered into the target.
         * This value may be different of the size property when layout/alignment is used or specific primitive types can implement a custom logic through this property.
         * BEWARE: don't use the setter, it's for internal purpose only
         * Note to implementers: you have to override this property and declare if necessary a @xxxxInstanceLevel decorator
         */
        public get actualSize(): Size {
            if (this._actualSize) {
                return this._actualSize;
            }
            return this._size;
        }

        public set actualSize(value: Size) {
            if (this._actualSize.equals(value)) {
                return;
            }

            this._actualSize = value;
        }

        public get actualZOffset(): number {
            if (this._manualZOrder!=null) {
                return this._manualZOrder;
            }
            if (this._isFlagSet(SmartPropertyPrim.flagZOrderDirty)) {
                this._updateZOrder();
            }
            return (1 - this._zOrder);
        }

        /**
         * Get or set the minimal size the Layout Engine should respect when computing the primitive's actualSize.
         * The Primitive's size won't be less than specified.
         * The default value depends of the Primitive type
         */
        public get minSize(): Size {
            return this._minSize;
        }

        public set minSize(value: Size) {
            if (this._minSize && value && this._minSize.equals(value)) {
                return;
            }

            this._minSize = value;
            this._parentLayoutDirty();
        }

        /**
         * Get or set the maximal size the Layout Engine should respect when computing the primitive's actualSize.
         * The Primitive's size won't be more than specified.
         * The default value depends of the Primitive type
         */
        public get maxSize(): Size {
            return this._maxSize;
        }

        public set maxSize(value: Size) {
            if (this._maxSize && value && this._maxSize.equals(value)) {
                return;
            }

            this._maxSize = value;
            this._parentLayoutDirty();
        }

        /**
         * The origin defines the normalized coordinate of the center of the primitive, from the bottom/left corner.
         * The origin is used only to compute transformation of the primitive, it has no meaning in the primitive local frame of reference
         * For instance:
         * 0,0 means the center is bottom/left. Which is the default for Canvas2D instances
         * 0.5,0.5 means the center is at the center of the primitive, which is default of all types of Primitives
         * 0,1 means the center is top/left
         * @returns The normalized center.
         */
        @dynamicLevelProperty(6, pi => Prim2DBase.originProperty = pi, false, true)
        public get origin(): Vector2 {
            return this._origin;
        }

        public set origin(value: Vector2) {
            this._origin = value;
        }

        @dynamicLevelProperty(7, pi => Prim2DBase.levelVisibleProperty = pi)
        /**
         * Let the user defines if the Primitive is hidden or not at its level. As Primitives inherit the hidden status from their parent, only the isVisible property give properly the real visible state.
         * Default is true, setting to false will hide this primitive and its children.
         */
        public get levelVisible(): boolean {
            return this._isFlagSet(SmartPropertyPrim.flagLevelVisible);
        }

        public set levelVisible(value: boolean) {
            this._changeFlags(SmartPropertyPrim.flagLevelVisible, value);
        }

        @instanceLevelProperty(8, pi => Prim2DBase.isVisibleProperty = pi)
        /**
         * Use ONLY THE GETTER to determine if the primitive is visible or not.
         * The Setter is for internal purpose only!
         */
        public get isVisible(): boolean {
            return this._isFlagSet(SmartPropertyPrim.flagIsVisible);
        }

        public set isVisible(value: boolean) {
            this._changeFlags(SmartPropertyPrim.flagIsVisible, value);
        }

        @instanceLevelProperty(9, pi => Prim2DBase.zOrderProperty = pi)
        /**
         * You can override the default Z Order through this property, but most of the time the default behavior is acceptable
         */
        public get zOrder(): number {
            return this._manualZOrder;
        }

        public set zOrder(value: number) {
            if (this._manualZOrder === value) {
                return;
            }

            this._manualZOrder = value;
            this.onZOrderChanged();
            if (this._actualZOrderChangedObservable && this._actualZOrderChangedObservable.hasObservers()) {
                this._actualZOrderChangedObservable.notifyObservers(value);
            }
        }

        public get isManualZOrder(): boolean {
            return this._manualZOrder != null;
        }

        @dynamicLevelProperty(10, pi => Prim2DBase.marginProperty = pi)
        /**
         * You can get/set a margin on the primitive through this property
         * @returns the margin object, if there was none, a default one is created and returned
         */
        public get margin(): PrimitiveThickness {
            if (!this._margin) {
                this._margin = new PrimitiveThickness(() => {
                    if (!this.parent) {
                        return null;
                    }
                    return this.parent.margin;
                }, () => this._positioningDirty());
            }
            return this._margin;
        }

        private get _hasMargin(): boolean {
            return (this._margin !== null) || (this._marginAlignment !== null);
        }

        @dynamicLevelProperty(11, pi => Prim2DBase.paddingProperty = pi)
        /**
         * You can get/set a margin on the primitive through this property
         * @returns the margin object, if there was none, a default one is created and returned
         */
        public get padding(): PrimitiveThickness {
            if (!this._padding) {
                this._padding = new PrimitiveThickness(() => {
                    if (!this.parent) {
                        return null;
                    }
                    return this.parent.padding;
                }, () => this._positioningDirty());
            }
            return this._padding;
        }

        private get _hasPadding(): boolean {
            return this._padding !== null;
        }

        @dynamicLevelProperty(12, pi => Prim2DBase.marginAlignmentProperty = pi)
        /**
         * You can get/set the margin alignment through this property
         */
        public get marginAlignment(): PrimitiveAlignment {
            if (!this._marginAlignment) {
                this._marginAlignment = new PrimitiveAlignment(() => this._positioningDirty());
            }
            return this._marginAlignment;
        }

        @instanceLevelProperty(13, pi => Prim2DBase.opacityProperty = pi)
        /**
         * Get/set the opacity of the whole primitive
         */
        public get opacity(): number {
            return this._opacity;
        }

        public set opacity(value: number) {
            if (value < 0) {
                value = 0;
            } else if (value > 1) {
                value = 1;
            }

            if (this._opacity === value) {
                return;
            }

            this._opacity = value;
            this._updateRenderMode();
            this._setFlags(SmartPropertyPrim.flagActualOpacityDirty);
            this._spreadActualOpacityChanged();
        }

        @instanceLevelProperty(14, pi => Prim2DBase.scaleXProperty = pi, false, true)
        /**
         * Scale applied on the X axis of the primitive
         */
        public set scaleX(value: number) {
            this._scale.x = value;
        }

        public get scaleX(): number {
            return this._scale.x;
        }

        @instanceLevelProperty(15, pi => Prim2DBase.scaleYProperty = pi, false, true)
        /**
         * Scale applied on the Y axis of the primitive
         */
        public set scaleY(value: number) {
            this._scale.y = value;
        }

        public get scaleY(): number {
            return this._scale.y;
        }

        public get actualOpacity(): number {
            if (this._isFlagSet(SmartPropertyPrim.flagActualOpacityDirty)) {
                let cur = this.parent;
                let op = this.opacity;
                while (cur) {
                    op *= cur.opacity;
                    cur = cur.parent;
                }

                this._actualOpacity = op;
                this._clearFlags(SmartPropertyPrim.flagActualOpacityDirty);
            }
            return this._actualOpacity;
        }

        /**
         * Get/set the layout engine to use for this primitive.
         * The default layout engine is the CanvasLayoutEngine.
         */
        public get layoutEngine(): LayoutEngineBase {
            if (!this._layoutEngine) {
                this._layoutEngine = CanvasLayoutEngine.Singleton;
            }
            return this._layoutEngine;
        }

        public set layoutEngine(value: LayoutEngineBase) {
            if (this._layoutEngine === value) {
                return;
            }

            this._changeLayoutEngine(value);
        }

        /**
         * Get/set the layout are of this primitive.
         * The Layout area is the zone allocated by the Layout Engine for this particular primitive. Margins/Alignment will be computed based on this area.
         * The setter should only be called by a Layout Engine class.
         */
        public get layoutArea(): Size {
            return this._layoutArea;
        }

        public set layoutArea(val: Size) {
            if (this._layoutArea.equals(val)) {
                return;
            }
            this._positioningDirty();
            this._layoutArea = val;
        }

        /**
         * Get/set the layout area position (relative to the parent primitive).
         * The setter should only be called by a Layout Engine class.
         */
        public get layoutAreaPos(): Vector2 {
            return this._layoutAreaPos;
        }

        public set layoutAreaPos(val: Vector2) {
            if (this._layoutAreaPos.equals(val)) {
                return;
            }
            this._positioningDirty();
            this._layoutAreaPos = val;
        }

        /**
         * Define if the Primitive can be subject to intersection test or not (default is true)
         */
        public get isPickable(): boolean {
            return this._isFlagSet(SmartPropertyPrim.flagIsPickable);
        }

        public set isPickable(value: boolean) {
            this._changeFlags(SmartPropertyPrim.flagIsPickable, value);
        }

        /**
         * Return the depth level of the Primitive into the Canvas' Graph. A Canvas will be 0, its direct children 1, and so on.
         */
        public get hierarchyDepth(): number {
            return this._hierarchyDepth;
        }

        /**
         * Retrieve the Group that is responsible to render this primitive
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
         * return the global position of the primitive, relative to its canvas
         */
        public getGlobalPosition(): Vector2 {
            let v = new Vector2(0, 0);
            this.getGlobalPositionByRef(v);
            return v;
        }

        /**
         * return the global position of the primitive, relative to its canvas
         * @param v the valid Vector2 object where the global position will be stored
         */
        public getGlobalPositionByRef(v: Vector2) {
            v.x = this.globalTransform.m[12];
            v.y = this.globalTransform.m[13];
        }

        /**
         * Get invert of the global transformation matrix of the primitive
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

        private static _bMax = Vector2.Zero();

        /**
         * Get the boundingInfo associated to the primitive and its children.
         * The value is supposed to be always up to date
         */
        public get boundingInfo(): BoundingInfo2D {
            if (this._isFlagSet(SmartPropertyPrim.flagBoundingInfoDirty)) {
                if (this.owner) {
                    this.owner.boundingInfoRecomputeCounter.addCount(1, false);
                }
                if (this.isSizedByContent) {
                    this._boundingInfo.clear();
                } else {
                    this._boundingInfo.copyFrom(this.levelBoundingInfo);
                }
                let bi = this._boundingInfo;

                var tps = new BoundingInfo2D();
                for (let curChild of this._children) {
                    curChild.boundingInfo.transformToRef(curChild.localTransform, tps);
                    bi.unionToRef(tps, bi);
                }

                this._boundingInfo.maxToRef(Prim2DBase._bMax);
                this._boundingSize.copyFromFloats(
                    (!this._size || this._size.width == null) ? Math.ceil(Prim2DBase._bMax.x) : this._size.width,
                    (!this._size || this._size.height == null) ? Math.ceil(Prim2DBase._bMax.y) : this._size.height);

                this._clearFlags(SmartPropertyPrim.flagBoundingInfoDirty);
            }
            return this._boundingInfo;
        }

        /**
         * Determine if the size is automatically computed or fixed because manually specified.
         * Use the actualSize property to get the final/real size of the primitive
         * @returns true if the size is automatically computed, false if it were manually specified.
         */
        public get isSizeAuto(): boolean {
            return this._size == null;
        }

        /**
         * Return true if this prim has an auto size which is set by the children's global bounding box
         */
        public get isSizedByContent(): boolean {
            return (this._size == null) && (this._children.length > 0);
        }

        /**
         * Determine if the position is automatically computed or fixed because manually specified.
         * Use the actualPosition property to get the final/real position of the primitive
         * @returns true if the position is automatically computed, false if it were manually specified.
         */
        public get isPositionAuto(): boolean {
            return this._position == null;
        }

        /**
         * Interaction with the primitive can be create using this Observable. See the PrimitivePointerInfo class for more information
         */
        public get pointerEventObservable(): Observable<PrimitivePointerInfo> {
            return this._pointerEventObservable;
        }

        public get zActualOrderChangedObservable(): Observable<number> {
            if (!this._actualZOrderChangedObservable) {
                this._actualZOrderChangedObservable = new Observable<number>();
            }
            return this._actualZOrderChangedObservable;
        }

        public findById(id: string): Prim2DBase {
            if (this._id === id) {
                return this;
            }

            for (let child of this._children) {
                let r = child.findById(id);
                if (r != null) {
                    return r;
                }
            }
        }

        protected onZOrderChanged() {

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
            if (this.isPickable && !this.boundingInfo.doesIntersect(intersectInfo._localPickPosition)) {
                // Important to call this before each return to allow a good recursion next time this intersectInfo is reused
                intersectInfo._exit(firstLevel);
                return false;
            }

            // We hit the boundingInfo that bounds this primitive and its children, now we have to test on the primitive of this level
            let levelIntersectRes = false;
            if (this.isPickable) {
                levelIntersectRes = this.levelIntersect(intersectInfo);
                if (levelIntersectRes) {
                    let pii = new PrimitiveIntersectedInfo(this, intersectInfo._localPickPosition.clone());
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

            let childIndex = this._children.indexOf(child);
            let prevIndex = previous ? this._children.indexOf(previous) : -1;

            if (!this._isFlagSet(SmartPropertyPrim.flagChildrenFlatZOrder)) {
                this._setFlags(SmartPropertyPrim.flagZOrderDirty);
                this._firstZDirtyIndex = Math.min(this._firstZDirtyIndex, prevIndex+1);
            }

            this._children.splice(prevIndex + 1, 0, this._children.splice(childIndex, 1)[0]);
        }

        private addChild(child: Prim2DBase) {
            child._parent = this;
            this._boundingBoxDirty();
            let flat = this._isFlagSet(SmartPropertyPrim.flagChildrenFlatZOrder);
            if (flat) {
                child._setFlags(SmartPropertyPrim.flagChildrenFlatZOrder);
                child._setZOrder(this._zOrder, true);
                child._zMax = this._zOrder;
            } else {
                this._setFlags(SmartPropertyPrim.flagZOrderDirty);
            }
            let length = this._children.push(child);
            this._firstZDirtyIndex = Math.min(this._firstZDirtyIndex, length - 1);
        }

        /**
         * Dispose the primitive, remove it from its parent.
         */
        public dispose(): boolean {
            if (!super.dispose()) {
                return false;
            }

            if (this._actionManager) {
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

        protected onPrimBecomesDirty() {
            if (this._renderGroup && !this._isFlagSet(SmartPropertyPrim.flagPrimInDirtyList)) {
                this._renderGroup._addPrimToDirtyList(this);
                this._setFlags(SmartPropertyPrim.flagPrimInDirtyList);
            }
        }

        public _needPrepare(): boolean {
            return this._areSomeFlagsSet(SmartPropertyPrim.flagVisibilityChanged | SmartPropertyPrim.flagModelDirty) || (this._instanceDirtyFlags !== 0) || (this._globalTransformProcessStep !== this._globalTransformStep);
        }

        public _prepareRender(context: PrepareRender2DContext) {
            this._prepareRenderPre(context);
            this._prepareRenderPost(context);
        }

        public _prepareRenderPre(context: PrepareRender2DContext) {
        }

        public _prepareRenderPost(context: PrepareRender2DContext) {
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
            this._clearFlags(SmartPropertyPrim.flagModelDirty);
            this._instanceDirtyFlags = 0;
        }

        protected _canvasPreInit(settings: any) {

        }

        protected static _isCanvasInit: boolean = false;
        protected static CheckParent(parent: Prim2DBase) {  // TODO remove
            //if (!Prim2DBase._isCanvasInit && !parent) {
            //    throw new Error("A Primitive needs a valid Parent, it can be any kind of Primitives based types, even the Canvas (with the exception that only Group2D can be direct child of a Canvas if the cache strategy used is TOPLEVELGROUPS)");
            //}
        }

        protected updateCachedStatesOf(list: Prim2DBase[], recurse: boolean) {
            for (let cur of list) {
                cur.updateCachedStates(recurse);
            }
        }

        private _parentLayoutDirty() {
            if (!this._parent || this._parent.isDisposed) {
                return;
            }

            this._parent._setLayoutDirty();
        }

        protected _setLayoutDirty() {
            this.onPrimBecomesDirty();
            this._setFlags(SmartPropertyPrim.flagLayoutDirty);

        }

        private _checkPositionChange(): boolean {
            if (this.parent && this.parent.layoutEngine.isChildPositionAllowed === false) {
                console.log(`Can't manually set the position of ${this.id}, the Layout Engine of its parent doesn't allow it`);
                return false;
            }
            return true;
        }

        protected _positioningDirty() {
            this.onPrimBecomesDirty();
            this._setFlags(SmartPropertyPrim.flagPositioningDirty);
        }

        protected _spreadActualOpacityChanged() {
            for (let child of this._children) {
                child._setFlags(SmartPropertyPrim.flagActualOpacityDirty);
                child._spreadActualOpacityChanged();
            }
        }

        private _changeLayoutEngine(engine: LayoutEngineBase) {
            this._layoutEngine = engine;
        }

        private static _t0: Matrix = new Matrix();
        private static _t1: Matrix = new Matrix();
        private static _t2: Matrix = new Matrix();
        private static _v0: Vector2 = Vector2.Zero();   // Must stay with the value 0,0

        private _updateLocalTransform(): boolean {
            let tflags = Prim2DBase.actualPositionProperty.flagId | Prim2DBase.rotationProperty.flagId | Prim2DBase.scaleProperty.flagId | Prim2DBase.scaleXProperty.flagId | Prim2DBase.scaleYProperty.flagId | Prim2DBase.originProperty.flagId;
            if (this.checkPropertiesDirty(tflags)) {
                if (this.owner) {
                    this.owner.addupdateLocalTransformCounter(1);
                }

                var rot = Quaternion.RotationAxis(new Vector3(0, 0, 1), this._rotation);
                var local: Matrix;
                let pos = this.position;

                if (this._origin.x === 0 && this._origin.y === 0) {
                    local = Matrix.Compose(new Vector3(this._scale.x, this._scale.y, 1), rot, new Vector3(pos.x, pos.y, 0));
                    this._localTransform = local;
                } else {
                    // -Origin offset
                    let as = this.actualSize;
                    Matrix.TranslationToRef((-as.width * this._origin.x), (-as.height * this._origin.y), 0, Prim2DBase._t0);

                    // -Origin * rotation
                    rot.toRotationMatrix(Prim2DBase._t1);
                    Prim2DBase._t0.multiplyToRef(Prim2DBase._t1, Prim2DBase._t2);

                    // -Origin * rotation * scale
                    Matrix.ScalingToRef(this._scale.x, this._scale.y, 1, Prim2DBase._t0);
                    Prim2DBase._t2.multiplyToRef(Prim2DBase._t0, Prim2DBase._t1);

                    // -Origin * rotation * scale * (Origin + Position)
                    Matrix.TranslationToRef((as.width * this._origin.x) + pos.x, (as.height * this._origin.y) + pos.y, 0, Prim2DBase._t2);
                    Prim2DBase._t1.multiplyToRef(Prim2DBase._t2, this._localTransform);
                }

                this.clearPropertiesDirty(tflags);
                return true;
            }
            return false;
        }

        private static _transMtx = Matrix.Zero();

        protected updateCachedStates(recurse: boolean) {
            if (this.isDisposed) {
                return;
            }

            this.owner.addCachedGroupRenderCounter(1);
            
            // Check if the parent is synced
            if (this._parent && ((this._parent._globalTransformProcessStep !== this.owner._globalTransformProcessStep) || this._parent._areSomeFlagsSet(SmartPropertyPrim.flagLayoutDirty | SmartPropertyPrim.flagPositioningDirty | SmartPropertyPrim.flagZOrderDirty))) {
                this._parent.updateCachedStates(false);
            }

            // Update Z-Order if needed
            if (this._isFlagSet(SmartPropertyPrim.flagZOrderDirty)) {
                this._updateZOrder();
            }

            // Update actualSize only if there' not positioning to recompute and the size changed
            // Otherwise positioning will take care of it.
            let sizeDirty = this.checkPropertiesDirty(Prim2DBase.sizeProperty.flagId);
            if (!this._isFlagSet(SmartPropertyPrim.flagLayoutDirty) && !this._isFlagSet(SmartPropertyPrim.flagPositioningDirty) && sizeDirty) {
                let size = this.size;
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
            let positioningDirty = this._isFlagSet(SmartPropertyPrim.flagPositioningDirty);
            if (this._isFlagSet(SmartPropertyPrim.flagLayoutDirty)) {
                this.owner.addUpdateLayoutCounter(1);
                this._layoutEngine.updateLayout(this);

                this._clearFlags(SmartPropertyPrim.flagLayoutDirty);
            }

            let positioningComputed = positioningDirty && !this._isFlagSet(SmartPropertyPrim.flagPositioningDirty);
            let autoContentChanged = false;
            if (this.isSizeAuto) {
                if (!this._lastAutoSizeArea) {
                    autoContentChanged = this.size!==null;
                } else {
                    autoContentChanged = (!this._lastAutoSizeArea.equals(this.size));
                }
            }

            // Check for positioning update
            if (!positioningComputed && (autoContentChanged || sizeDirty || this._isFlagSet(SmartPropertyPrim.flagPositioningDirty) || (this._parent && !this._parent.contentArea.equals(this._parentContentArea)))) {
                this._updatePositioning();

                this._clearFlags(SmartPropertyPrim.flagPositioningDirty);
                if (sizeDirty) {
                    this.clearPropertiesDirty(Prim2DBase.sizeProperty.flagId);
                }
                positioningComputed = true;
            }

            if (positioningComputed && this._parent) {
                this._parentContentArea.copyFrom(this._parent.contentArea);
            }

            // Check if we must update this prim
            if (this === <any>this.owner || this._globalTransformProcessStep !== this.owner._globalTransformProcessStep) {
                this.owner.addUpdateGlobalTransformCounter(1);

                let curVisibleState = this.isVisible;
                this.isVisible = (!this._parent || this._parent.isVisible) && this.levelVisible;

                // Detect a change of visibility
                this._changeFlags(SmartPropertyPrim.flagVisibilityChanged, curVisibleState !== this.isVisible);

                // Get/compute the localTransform
                let localDirty = this._updateLocalTransform();

                let parentPaddingChanged = false;
                let parentPaddingOffset: Vector2 = Prim2DBase._v0;
                if (this._parent) {
                    parentPaddingOffset = this._parent._paddingOffset;
                    parentPaddingChanged = !parentPaddingOffset.equals(this._parentPaddingOffset);
                }

                // Check if there are changes in the parent that will force us to update the global matrix
                let parentDirty = (this._parent != null) ? (this._parent._globalTransformStep !== this._parentTransformStep) : false;

                // Check if we have to update the globalTransform
                if (!this._globalTransform || localDirty || parentDirty || parentPaddingChanged) {
                    let globalTransform = this._parent ? this._parent._globalTransform : null;

                    let localTransform: Matrix;
                    Prim2DBase._transMtx.copyFrom(this._localTransform);
                    Prim2DBase._transMtx.m[12] += this._layoutAreaPos.x + this._marginOffset.x + parentPaddingOffset.x;
                    Prim2DBase._transMtx.m[13] += this._layoutAreaPos.y + this._marginOffset.y + parentPaddingOffset.y;
                    localTransform = Prim2DBase._transMtx;

                    this._globalTransform = this._parent ? localTransform.multiply(globalTransform) : localTransform.clone();

                    this._invGlobalTransform = Matrix.Invert(this._globalTransform);

                    this._globalTransformStep = this.owner._globalTransformProcessStep + 1;
                    this._parentTransformStep = this._parent ? this._parent._globalTransformStep : 0;
                }
                this._globalTransformProcessStep = this.owner._globalTransformProcessStep;
            }
            if (recurse) {
                for (let child of this._children) {
                    // Stop the recursion if we meet a renderable group
                    child.updateCachedStates(!(child instanceof Group2D && child.isRenderableGroup));
                }
            }
        }

        private static _icPos = Vector2.Zero();
        private static _icArea = Size.Zero();
        private static _size = Size.Zero();

        private _updatePositioning() {
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

            let isSizeAuto = this.isSizeAuto;
            if (this._hasPadding) {
                // Two cases from here: the size of the Primitive is Auto, its content can't be shrink, so me resize the primitive itself
                if (isSizeAuto) {
                    let content = this.size.clone();
                    this._getActualSizeFromContentToRef(content, Prim2DBase._icArea);
                    this.padding.enlarge(Prim2DBase._icArea, this._paddingOffset, Prim2DBase._size);
                    this._contentArea.copyFrom(content);
                    this.actualSize = Prim2DBase._size.clone();

                    // Changing the padding has resize the prim, which forces us to recompute margin again
                    if (this._hasMargin) {
                        this.margin.computeWithAlignment(this.layoutArea, Prim2DBase._size, this.marginAlignment, this._marginOffset, Prim2DBase._size);
                    }

                } else {
                    this._getInitialContentAreaToRef(this.actualSize, Prim2DBase._icPos, Prim2DBase._icArea);
                    Prim2DBase._icArea.width = Math.max(0, Prim2DBase._icArea.width);
                    Prim2DBase._icArea.height = Math.max(0, Prim2DBase._icArea.height);
                    this.padding.compute(Prim2DBase._icArea, this._paddingOffset, Prim2DBase._size);
                    this._paddingOffset.x += Prim2DBase._icPos.x;
                    this._paddingOffset.y += Prim2DBase._icPos.y;
                    this._contentArea.copyFrom(Prim2DBase._size);
                }
            } else {
                this._getInitialContentAreaToRef(this.actualSize, Prim2DBase._icPos, Prim2DBase._icArea);
                Prim2DBase._icArea.width = Math.max(0, Prim2DBase._icArea.width);
                Prim2DBase._icArea.height = Math.max(0, Prim2DBase._icArea.height);
                this._paddingOffset.copyFrom(Prim2DBase._icPos);
                this._contentArea.copyFrom(Prim2DBase._icArea);
            }

            if (!this._position) {
                let aPos = new Vector2(this._layoutAreaPos.x + this._marginOffset.x, this._layoutAreaPos.y + this._marginOffset.y);
                this.actualPosition = aPos;
            }
            if (isSizeAuto) {
                this._lastAutoSizeArea = this.size;                
            }
        }

        /**
         * Get the content are of this primitive, this area is computed using the padding property and also possibly the primitive type itself.
         * Children of this primitive will be positioned relative to the bottom/left corner of this area.
         */
        public get contentArea(): Size {
            // Check for positioning update
            if (this._isFlagSet(SmartPropertyPrim.flagPositioningDirty)) {
                this._updatePositioning();

                this._clearFlags(SmartPropertyPrim.flagPositioningDirty);
            }
            return this._contentArea;
        }

        public _patchHierarchy(owner: Canvas2D) {
            this._owner = owner;

            // The only place we initialize the _renderGroup is this method, if it's set, we already been there, no need to execute more
            if (this._renderGroup != null) {
                return;
            }

            if (this instanceof Group2D) {
                var group: any = this;
                group.detectGroupStates();
                if (group._trackedNode && !group._isFlagSet(SmartPropertyPrim.flagTrackedGroup)) {
                    group.owner._registerTrackedNode(this);
                }
            }

            this._renderGroup = <Group2D>this.traverseUp(p => p instanceof Group2D && p.isRenderableGroup);
            if (this._parent) {
                this._parentLayoutDirty();
            }

            // Make sure the prim is in the dirtyList if it should be
            if (this._renderGroup && this.isDirty) {
                let list = this._renderGroup._renderableData._primDirtyList;
                let i = list.indexOf(this);
                if (i === -1) {
                    list.push(this);
                }
            }

            // Recurse
            for (let child of this._children) {
                child._hierarchyDepth = this._hierarchyDepth + 1;
                child._patchHierarchy(owner);
            }
        }
        private static _zOrderChangedNotifList = new Array<Prim2DBase>();
        private static _zRebuildReentrency = false;

        private _updateZOrder() {
            let prevLinPos = this._primLinearPosition;
            let startI = 0;
            let startZ = this._zOrder;

            // We must start rebuilding Z-Order from the Prim before the first one that changed, because we know its Z-Order is correct, so are its children, but it's better to recompute everything from this point instead of finding the last valid children
            let childrenCount = this._children.length;
            if (this._firstZDirtyIndex > 0) {
                if ((this._firstZDirtyIndex - 1) < childrenCount) {
                    let prevPrim = this._children[this._firstZDirtyIndex - 1];
                    prevLinPos = prevPrim._primLinearPosition;
                    startI = this._firstZDirtyIndex - 1;
                    startZ = prevPrim._zOrder;
                }
            }

            let startPos = prevLinPos;

            // Update the linear position of the primitive from the first one to the last inside this primitive, compute the total number of prim traversed
            Prim2DBase._totalCount = 0;
            for (let i = startI; i < childrenCount; i++) {
                let child = this._children[i];
                prevLinPos = child._updatePrimitiveLinearPosition(prevLinPos);
            }

            // Compute the new Z-Order for all the primitives
            // Add 20% to the current total count to reserve space for future insertions, except if we're rebuilding due to a zMinDelta reached
            let zDelta = (this._zMax - startZ) / (Prim2DBase._totalCount * (Prim2DBase._zRebuildReentrency ? 1 : 1.2));

            // If the computed delta is less than the smallest allowed by the depth buffer, we rebuild the Z-Order from the very beginning of the primitive's children (that is, the first) to redistribute uniformly the Z.
            if (zDelta < Canvas2D._zMinDelta) {
                // Check for re-entrance, if the flag is true we already attempted a rebuild but couldn't get a better zDelta, go up in the hierarchy to rebuilt one level up, hoping to get this time a decent delta, otherwise, recurse until we got it or when no parent is reached, which would mean the canvas would have more than 16 millions of primitives...
                if (Prim2DBase._zRebuildReentrency) {
                    let p = this._parent;
                    if (p == null) {
                        // Can't find a good Z delta and we're in the canvas, which mean we're dealing with too many objects (which should never happen, but well...)
                        console.log(`Can't compute Z-Order for ${this.id}'s children, zDelta is too small, Z-Order is now in an unstable state`);
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

            for (let i = startI; i < childrenCount; i++) {
                let child = this._children[i];
                child._updatePrimitiveZOrder(startPos, startZ, zDelta);
            }

            // Notify the Observers that we found during the Z change (we do it after to avoid any kind of re-entrance)
            for (let p of Prim2DBase._zOrderChangedNotifList) {
                p._actualZOrderChangedObservable.notifyObservers(p.actualZOffset);
            }
            Prim2DBase._zOrderChangedNotifList.splice(0);

            this._firstZDirtyIndex = Prim2DBase._bigInt;
            this._clearFlags(SmartPropertyPrim.flagZOrderDirty);
        }

        private static _totalCount: number = 0;

        private _updatePrimitiveLinearPosition(prevLinPos: number): number {
            if (this.isManualZOrder) {
                return prevLinPos;
            }

            this._primLinearPosition = ++prevLinPos;
            Prim2DBase._totalCount++;

            // Check for the FlatZOrder, which means the children won't have a dedicated Z-Order but will all share the same (unique) one.
            if (!this._isFlagSet(SmartPropertyPrim.flagChildrenFlatZOrder)) {
                for (let child of this._children) {
                    prevLinPos = child._updatePrimitiveLinearPosition(prevLinPos);
                }
            }

            return prevLinPos;
        }

        private _updatePrimitiveZOrder(startPos: number, startZ: number, deltaZ: number): number {
            if (this.isManualZOrder) {
                return null;
            }

            let newZ = startZ + ((this._primLinearPosition - startPos) * deltaZ);
            let isFlat = this._isFlagSet(SmartPropertyPrim.flagChildrenFlatZOrder);
            this._setZOrder(newZ, false);


            if (this._isFlagSet(SmartPropertyPrim.flagZOrderDirty)) {
                this._firstZDirtyIndex = Prim2DBase._bigInt;
                this._clearFlags(SmartPropertyPrim.flagZOrderDirty);
            }

            let curZ: number = newZ;

            // Check for the FlatZOrder, which means the children won't have a dedicated Z-Order but will all share the same (unique) one.
            if (isFlat) {
                if (this._children.length > 0) {
                    //let childrenZOrder = startZ + ((this._children[0]._primLinearPosition - startPos) * deltaZ);
                    for (let child of this._children) {
                        child._updatePrimitiveFlatZOrder(this._zOrder);
                    }
                }
            } else {
                for (let child of this._children) {
                    let r = child._updatePrimitiveZOrder(startPos, startZ, deltaZ);
                    if (r != null) {
                        curZ = r;
                    }
                }
            }

            this._zMax = isFlat ? newZ : (curZ + deltaZ);

            return curZ;
        }

        private _updatePrimitiveFlatZOrder(newZ: number) {
            if (this.isManualZOrder) {
                return;
            }

            this._setZOrder(newZ, false);
            this._zMax = newZ;

            if (this._isFlagSet(SmartPropertyPrim.flagZOrderDirty)) {
                this._firstZDirtyIndex = Prim2DBase._bigInt;
                this._clearFlags(SmartPropertyPrim.flagZOrderDirty);
            }

            for (let child of this._children) {
                child._updatePrimitiveFlatZOrder(newZ);
            }

        }

        private _setZOrder(newZ: number, directEmit: boolean) {
            if (newZ !== this._zOrder) {
                this._zOrder = newZ;
                this.onPrimBecomesDirty();
                this.onZOrderChanged();
                if (this._actualZOrderChangedObservable && this._actualZOrderChangedObservable.hasObservers()) {
                    if (directEmit) {
                        this._actualZOrderChangedObservable.notifyObservers(newZ);
                    } else {
                        Prim2DBase._zOrderChangedNotifList.push(this);
                    }
                }
            }
        }

        protected _updateRenderMode() {
        }

        /**
         * This method is used to alter the contentArea of the Primitive before margin is applied.
         * In most of the case you won't need to override this method, but it can prove some usefulness, check the Rectangle2D class for a concrete application.
         * @param primSize the current size of the primitive
         * @param initialContentPosition the position of the initial content area to compute, a valid object is passed, you have to set its properties. PLEASE ROUND the values, we're talking about pixels and fraction of them is not a good thing!
         * @param initialContentArea the size of the initial content area to compute, a valid object is passed, you have to set its properties. PLEASE ROUND the values, we're talking about pixels and fraction of them is not a good thing!
         */
        protected _getInitialContentAreaToRef(primSize: Size, initialContentPosition: Vector2, initialContentArea: Size) {
            initialContentArea.copyFrom(primSize);
            initialContentPosition.x = initialContentPosition.y = 0;
        }

        /**
         * This method is used to calculate the new size of the primitive based on the content which must stay the same
         * Check the Rectangle2D implementation for a concrete application.
         * @param primSize the current size of the primitive
         * @param newPrimSize the new size of the primitive. PLEASE ROUND THE values, we're talking about pixels and fraction of them are not our friends!
         */
        protected _getActualSizeFromContentToRef(primSize: Size, newPrimSize: Size) {
            newPrimSize.copyFrom(primSize);
        }

        private _owner: Canvas2D;
        private _parent: Prim2DBase;
        private _actionManager: ActionManager;
        protected _children: Array<Prim2DBase>;
        private _renderGroup: Group2D;
        protected _hierarchyDepth: number;
        protected _zOrder: number;
        private _manualZOrder: number;
        protected _zMax: number;
        private _firstZDirtyIndex: number;
        private _primLinearPosition: number;
        private _margin: PrimitiveThickness;
        private _padding: PrimitiveThickness;
        private _marginAlignment: PrimitiveAlignment;
        public _pointerEventObservable: Observable<PrimitivePointerInfo>;
        private _actualZOrderChangedObservable: Observable<number>;
        private _id: string;
        private _position: Vector2;
        private _actualPosition: Vector2;
        protected _size: Size;
        protected _actualSize: Size;
        public _boundingSize: Size;
        protected _minSize: Size;
        protected _maxSize: Size;
        protected _desiredSize: Size;
        private _layoutEngine: LayoutEngineBase;
        private _marginOffset: Vector2;
        private _paddingOffset: Vector2;
        private _parentPaddingOffset: Vector2;
        private _parentContentArea: Size;
        private _lastAutoSizeArea: Size;
        private _layoutAreaPos: Vector2;
        private _layoutArea: Size;
        private _contentArea: Size;
        private _rotation: number;
        private _scale: Vector2;
        private _origin: Vector2;
        protected _opacity: number;
        private _actualOpacity: number;

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