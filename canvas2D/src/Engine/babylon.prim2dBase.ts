﻿module BABYLON {

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
    @className("PrimitiveAlignment", "BABYLON")
    export class PrimitiveAlignment {
        constructor(changeCallback?: () => void) {
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
            this.onChangeCallback();
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
            this.onChangeCallback();
        }

        private onChangeCallback() {
            if (this._changedCallback) {
                this._changedCallback();
            }
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
            if (m.length === 1) {
                this.setHorizontal(m[0]);
                this.setVertical(m[0]);
            } else {
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

        copyFrom(pa: PrimitiveAlignment) {
            this._horizontal = pa._horizontal;
            this._vertical = pa._vertical;
            this.onChangeCallback();
        }

        clone(): PrimitiveAlignment {
            let pa = new PrimitiveAlignment();
            pa._horizontal = this._horizontal;
            pa._vertical = this._vertical;
            return pa;
        }

        public get isDefault(): boolean {
            return this.horizontal === PrimitiveAlignment.AlignLeft && this.vertical === PrimitiveAlignment.AlignBottom;
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
    @className("PrimitiveThickness", "BABYLON")
    export class PrimitiveThickness {
        constructor(parentAccess: () => PrimitiveThickness, changedCallback?: () => void) {
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

                this.onChangeCallback();
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

            this.onChangeCallback();

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
            this.onChangeCallback();
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
            this.onChangeCallback();
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
            this.onChangeCallback();
            return this;
        }

        public copyFrom(pt: PrimitiveThickness) {
            this._clear();
            for (let i = 0; i < 4; i++) {
                this._pixels[i] = pt._pixels[i];
                this._percentages[i] = pt._percentages[i];
            }
            this._flags = pt._flags;
            this.onChangeCallback();
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
            this.onChangeCallback();
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
                    this.onChangeCallback();
                }
            } else if (v === "inherit") {
                if (this._isType(index, PrimitiveThickness.Inherit)) {
                    return true;
                }
                this._setType(index, PrimitiveThickness.Inherit);
                this._pixels[index] = null;
                if (emitChanged) {
                    this.onChangeCallback();
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
                        this.onChangeCallback();
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
                    this.onChangeCallback();
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
                this.onChangeCallback();
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
                this.onChangeCallback();
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

        public get isDefault(): boolean {
            return this._flags === 0x1111;
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

        public static ComputeH = 0x1;
        public static ComputeV = 0x2;
        public static ComputeAll = 0x03;

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
                this.onChangeCallback();
            }
        }

        private onChangeCallback() {
            if (this._changedCallback) {
                this._changedCallback();
            }
        }

        /**
         * Compute the positioning/size of an area considering the thickness of this object and a given alignment
         * @param sourceArea the source area where the content must be sized/positioned
         * @param contentSize the content size to position/resize
         * @param alignment the alignment setting
         * @param dstOffset the position of the content, x, y, z, w are left, bottom, right, top
         * @param dstArea the new size of the content
         */
        public computeWithAlignment(sourceArea: Size, contentSize: Size, alignment: PrimitiveAlignment, contentScale: Vector2, dstOffset: Vector4, dstArea: Size, computeLayoutArea = false, computeAxis = PrimitiveThickness.ComputeAll) {
            // Fetch some data
            let topType = this._getType(0, true);
            let leftType = this._getType(1, true);
            let rightType = this._getType(2, true);
            let bottomType = this._getType(3, true);
            let hasWidth = contentSize && (contentSize.width != null);
            let hasHeight = contentSize && (contentSize.height != null);
            let sx = contentScale.x;
            let sy = contentScale.y;
            let isx = 1 / sx;
            let isy = 1 / sy;
            let width = hasWidth ? contentSize.width : 0;
            let height = hasHeight ? contentSize.height : 0;
            let isTopAuto = topType === PrimitiveThickness.Auto;
            let isLeftAuto = leftType === PrimitiveThickness.Auto;
            let isRightAuto = rightType === PrimitiveThickness.Auto;
            let isBottomAuto = bottomType === PrimitiveThickness.Auto;

            if (computeAxis & PrimitiveThickness.ComputeH) {
                switch (alignment.horizontal) {
                    case PrimitiveAlignment.AlignLeft:
                    {
                        let leftPixels = 0;
                        if (!isLeftAuto) {
                            this._computePixels(1, sourceArea, true);
                            leftPixels = this.leftPixels;
                        }

                        dstOffset.x = leftPixels;
                        dstArea.width = width * isx;
                        dstOffset.z = sourceArea.width - (width * sx + leftPixels);

                        if (computeLayoutArea) {
                            let rightPixels = 0;
                            if (!isRightAuto) {
                                this._computePixels(2, sourceArea, true);
                                rightPixels = this.rightPixels;
                            }
                            dstArea.width += (leftPixels + rightPixels) * isx;
                        }
                        break;
                    }
                    case PrimitiveAlignment.AlignRight:
                    {
                        let rightPixels = 0;
                        if (!isRightAuto) {
                            this._computePixels(2, sourceArea, true);
                            rightPixels = this.rightPixels;
                        }

                        dstOffset.x = sourceArea.width - (width * sx + rightPixels);
                        dstArea.width = width * isx;
                        dstOffset.z = rightPixels;

                        if (computeLayoutArea) {
                            let leftPixels = 0;
                            if (!isLeftAuto) {
                                this._computePixels(1, sourceArea, true);
                                leftPixels = this.leftPixels;
                            }
                            dstArea.width += (leftPixels + rightPixels) * isx;
                        }
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

                        let rightPixels = 0;
                        if (!isRightAuto) {
                            this._computePixels(2, sourceArea, true);
                            rightPixels = this.rightPixels;
                        }

                        if (computeLayoutArea) {
                            dstArea.width = sourceArea.width * isx;
                        } else {
                            dstArea.width = (sourceArea.width * isx) - (dstOffset.x + rightPixels) * isx;
                        }

                        dstOffset.z = this.rightPixels;
                        break;
                    }
                    case PrimitiveAlignment.AlignCenter:
                    {
                        let leftPixels = 0;
                        if (!isLeftAuto) {
                            this._computePixels(1, sourceArea, true);
                            leftPixels = this.leftPixels;
                        }
                        let rightPixels = 0;
                        if (!isRightAuto) {
                            this._computePixels(2, sourceArea, true);
                            rightPixels = this.rightPixels;
                        }

                        let center = ((sourceArea.width - (width * sx)) / 2);
                        dstOffset.x = center + (leftPixels - rightPixels);

                        if (computeLayoutArea) {
                            dstArea.width = (width * isx) + (this.leftPixels + this.rightPixels) * isx;
                        } else {
                            dstArea.width = (width * isx);
                        }

                        dstOffset.z = rightPixels + center;
                        break;
                    }
                }

            }

            if (computeAxis & PrimitiveThickness.ComputeV) {
                switch (alignment.vertical) {
                    case PrimitiveAlignment.AlignBottom:
                    {
                        let bottomPixels = 0;
                        if (!isBottomAuto) {
                            this._computePixels(3, sourceArea, true);
                            bottomPixels = this.bottomPixels;
                        }

                        dstOffset.y = bottomPixels;
                        dstArea.height = height * isy;
                        dstOffset.w = sourceArea.height - (height * sy + bottomPixels);

                        if (computeLayoutArea) {
                            let topPixels = 0;
                            if (!isTopAuto) {
                                this._computePixels(0, sourceArea, true);
                                topPixels = this.topPixels;
                            }
                            dstArea.height += (bottomPixels + topPixels) * isy;
                        }
                        break;
                    }
                    case PrimitiveAlignment.AlignTop:
                    {
                        let topPixels = 0;
                        if (!isTopAuto) {
                            this._computePixels(0, sourceArea, true);
                            topPixels = this.topPixels;
                        }

                        dstOffset.y = sourceArea.height - ((height * sy) + topPixels);
                        dstArea.height = height * isy;
                        dstOffset.w = topPixels;

                        if (computeLayoutArea) {
                            let bottomPixels = 0;
                            if (!isBottomAuto) {
                                this._computePixels(3, sourceArea, true);
                                bottomPixels = this.bottomPixels;
                            }
                            dstArea.height += (bottomPixels + topPixels) * isy;
                        }
                        break;
                    }
                    case PrimitiveAlignment.AlignStretch:
                    {
                        let bottom = 0;
                        if (!isBottomAuto) {
                            this._computePixels(3, sourceArea, true);
                            bottom = this.bottomPixels;
                        }
                        dstOffset.y = bottom;

                        let top = 0;
                        if (!isTopAuto) {
                            this._computePixels(0, sourceArea, true);
                            top = this.topPixels;
                        }
                        dstOffset.w = top;

                        if (computeLayoutArea) {
                            dstArea.height = sourceArea.height * isy;
                        } else {
                            dstArea.height = (sourceArea.height * isy) - (top + bottom) * isy;
                        }

                        break;
                    }
                    case PrimitiveAlignment.AlignCenter:
                    {
                        let bottomPixels = 0;
                        if (!isBottomAuto) {
                            this._computePixels(3, sourceArea, true);
                            bottomPixels = this.bottomPixels;
                        }

                        let topPixels = 0;
                        if (!isTopAuto) {
                            this._computePixels(0, sourceArea, true);
                            topPixels = this.topPixels;
                        }

                        let center = ((sourceArea.height - (height * sy)) / 2);
                        dstOffset.y = center + (bottomPixels - topPixels);

                        if (computeLayoutArea) {
                            dstArea.height = (height * isy) + (bottomPixels + topPixels) * isy;
                        } else {
                            dstArea.height = (height * isy);
                        }

                        dstOffset.w = topPixels + center;

                        break;
                    }
                }
            }
        }

        /**
         * Compute an area and its position considering this thickness properties based on a given source area
         * @param sourceArea the source area
         * @param dstOffset the position of the resulting area
         * @param dstArea the size of the resulting area
         */
        public compute(sourceArea: Size, dstOffset: Vector4, dstArea: Size, computeLayoutArea = false) {
            this._computePixels(0, sourceArea, true);
            this._computePixels(1, sourceArea, true);
            this._computePixels(2, sourceArea, true);
            this._computePixels(3, sourceArea, true);

            dstOffset.x = this.leftPixels;

            if (computeLayoutArea) {
                dstArea.width = (sourceArea.width) + (dstOffset.x + this.rightPixels);
            } else {
                dstArea.width = (sourceArea.width) - (dstOffset.x + this.rightPixels);
            }

            dstOffset.y = this.bottomPixels;

            if (computeLayoutArea) {
                dstArea.height = (sourceArea.height) + (dstOffset.y + this.topPixels);
            } else {
                dstArea.height = (sourceArea.height) - (dstOffset.y + this.topPixels);
            }

            dstOffset.z = this.rightPixels;
            dstOffset.w = this.topPixels;
        }

        /**
         * Compute an area considering this thickness properties based on a given source area
         * @param sourceArea the source area
         * @param result the resulting area
         */
        computeArea(sourceArea: Size, sourceScale: Vector2, result: Size) {
            this._computePixels(0, sourceArea, true);
            this._computePixels(1, sourceArea, true);
            this._computePixels(2, sourceArea, true);
            this._computePixels(3, sourceArea, true);

            result.width = this.leftPixels + (sourceArea.width * sourceScale.x) + this.rightPixels;
            result.height = this.bottomPixels + (sourceArea.height * sourceScale.y) + this.topPixels;
        }

        enlarge(sourceArea: Size, sourceScale: Vector2, dstOffset: Vector4, enlargedArea: Size) {
            this._computePixels(0, sourceArea, true);
            this._computePixels(1, sourceArea, true);
            this._computePixels(2, sourceArea, true);
            this._computePixels(3, sourceArea, true);

            dstOffset.x = this.leftPixels;
            enlargedArea.width = (sourceArea.width * sourceScale.x) + (dstOffset.x + this.rightPixels);

            dstOffset.y = this.bottomPixels;
            enlargedArea.height = (sourceArea.height * sourceScale.y) + (dstOffset.y + this.topPixels);

            dstOffset.z = this.rightPixels;
            dstOffset.w = this.topPixels;
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

    @className("Prim2DBase", "BABYLON")
    /**
     * Base class for a Primitive of the Canvas2D feature
     */
    export class Prim2DBase extends SmartPropertyPrim {
        static PRIM2DBASE_PROPCOUNT: number = 25;

        public static _bigInt = Math.pow(2, 30);

        constructor(settings: {
            parent                  ?: Prim2DBase,
            id                      ?: string,
            children                ?: Array<Prim2DBase>,
            position                ?: Vector2,
            x                       ?: number,
            y                       ?: number,
            rotation                ?: number,
            scale                   ?: number,
            scaleX                  ?: number,
            scaleY                  ?: number,
            dontInheritParentScale  ?: boolean,
            alignToPixel            ?: boolean,
            opacity                 ?: number,
            zOrder                  ?: number,
            origin                  ?: Vector2,
            layoutEngine            ?: LayoutEngineBase | string,
            isVisible               ?: boolean,
            isPickable              ?: boolean,
            isContainer             ?: boolean,
            childrenFlatZOrder      ?: boolean,
            levelCollision          ?: boolean,
            deepCollision           ?: boolean,
            layoutData              ?: ILayoutData,
            marginTop               ?: number | string,
            marginLeft              ?: number | string,
            marginRight             ?: number | string,
            marginBottom            ?: number | string,
            margin                  ?: number | string,
            marginHAlignment        ?: number,
            marginVAlignment        ?: number,
            marginAlignment         ?: string,
            paddingTop              ?: number | string,
            paddingLeft             ?: number | string,
            paddingRight            ?: number | string,
            paddingBottom           ?: number | string,
            padding                 ?: number | string,
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
            this._layoutEngine               = CanvasLayoutEngine.Singleton;
            this._size                       = null; //Size.Zero();
            this._scale                      = new Vector2(1, 1);
            this._postScale                  = new Vector2(1, 1);
            this._actualSize                 = null;
            this._internalSize               = Size.Zero();
            this._layoutArea                 = null;
            this._layoutAreaPos              = null;
            this._layoutBoundingInfo         = null;
            this._marginOffset               = Vector4.Zero();
            this._paddingOffset              = Vector4.Zero();
            this._parentPaddingOffset        = Vector2.Zero();
            this._parentContentArea          = Size.Zero();
            this._lastAutoSizeArea           = Size.Zero();
            this._contentArea                = Size.Zero();
            this._pointerEventObservable     = new Observable<PrimitivePointerInfo>();
            this._owner                      = owner;
            this._parent                     = null;
            this._margin                     = null;
            this._padding                    = null;
            this._marginAlignment            = null;
            this._id                         = settings.id;
            this._children                   = new Array<Prim2DBase>();
            this._localTransform             = new Matrix2D();
            this._localLayoutTransform       = new Matrix2D();
            this._globalTransform            = null;
            this._invGlobalTransform         = null;
            this._globalTransformProcessStep = 0;
            this._globalTransformStep        = 0;
            this._prepareProcessStep         = 0;
            this._updateCachesProcessStep    = 0;
            this._renderGroup                = null;
            this._primLinearPosition         = 0;
            this._manualZOrder               = null;
            this._zOrder                     = 0;
            this._zMax                       = 0;
            this._firstZDirtyIndex           = Prim2DBase._bigInt;
            this._actualOpacity              = 0;
            this._actualScale                = Vector2.Zero();
            this._displayDebugAreas          = false;
            this._debugAreaGroup             = null;
            this._primTriArray               = null;
            this._primTriArrayDirty          = true;

            if (owner) {
                this.onSetOwner();
            }

            this._levelBoundingInfo.worldMatrixAccess = () => this.globalTransform;
            this._boundingInfo.worldMatrixAccess = () => this.globalTransform;

            let isPickable = true;
            let isContainer = true;
            if (settings.isPickable !== undefined) {
                isPickable = settings.isPickable;
            }
            if (settings.isContainer !== undefined) {
                isContainer = settings.isContainer;
            }
            if (settings.dontInheritParentScale) {
                this._setFlags(SmartPropertyPrim.flagDontInheritParentScale);
            }
            if (settings.alignToPixel) {
                this.alignToPixel = true;
            }
            this._setFlags((isPickable ? SmartPropertyPrim.flagIsPickable : 0) | SmartPropertyPrim.flagBoundingInfoDirty | SmartPropertyPrim.flagActualOpacityDirty | (isContainer ? SmartPropertyPrim.flagIsContainer : 0) | SmartPropertyPrim.flagActualScaleDirty | SmartPropertyPrim.flagLayoutBoundingInfoDirty);

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
                this._hierarchyDepth = parent._hierarchyDepth + 1;
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
                    if (this.owner != null && this._hierarchyDepth != null) {
                        child._patchHierarchy(this.owner);
                    }
                }
            }

            if (settings.zOrder != null) {
                this.zOrder = settings.zOrder;
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
                if (typeof settings.padding === "string") {
                    this.padding.fromString(<string>settings.padding);
                } else {
                    this.padding.fromUniformPixels(<number>settings.padding);
                }
            }

            if (settings.layoutData) {
                this.layoutData = settings.layoutData;
            }

            this._updatePositioningState();

            // Dirty layout and positioning
            this._parentLayoutDirty();
            this._positioningDirty();

            // Add in the PCM
            if (settings.levelCollision || settings.deepCollision) {
                this._actorInfo = this.owner._primitiveCollisionManager._addActor(this, settings.deepCollision === true);
                this._setFlags(SmartPropertyPrim.flagCollisionActor);
            } else {
                this._actorInfo = null;
            }

        }

        /**
         * Return the ChangedDictionary observable of the StringDictionary containing the primitives intersecting with this one
         */
        public get intersectWithObservable(): Observable<DictionaryChanged<ActorInfoBase>> {
            if (!this._actorInfo) {
                return null;
            }
            return this._actorInfo.intersectWith.dictionaryChanged;
        }

        /**
         * Return the ObservableStringDictionary containing all the primitives intersecting with this one.
         * The key is the primitive uid, the value is the ActorInfo object
         * @returns {}
         */
        public get intersectWith(): ObservableStringDictionary<ActorInfoBase> {
            if (!this._actorInfo) {
                return null;
            }
            return this._actorInfo.intersectWith;
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

        public set id(value: string) {
            if (this._id === value) {
                return;
            }
            let oldValue = this._id;
            this.onPropertyChanged("id", oldValue, this._id);
        }

        /**
         * Metadata of the position property
         */
        public static positionProperty: Prim2DPropInfo;

        /**
         * Metadata of the left property
         */
        public static xProperty: Prim2DPropInfo;

        /**
         * Metadata of the bottom property
         */
        public static yProperty: Prim2DPropInfo;

        /**
         * Metadata of the actualPosition property
         */
        public static actualPositionProperty: Prim2DPropInfo;

        /**
         * Metadata of the actualX (Left) property
         */
        public static actualXProperty: Prim2DPropInfo;

        /**
         * Metadata of the actualY (Bottom) property
         */
        public static actualYProperty: Prim2DPropInfo;

        /**
         * Metadata of the size property
         */
        public static sizeProperty: Prim2DPropInfo;

        /**
         * Metadata of the width property
         */
        public static widthProperty: Prim2DPropInfo;

        /**
         * Metadata of the height property
         */
        public static heightProperty: Prim2DPropInfo;

        /**
         * Metadata of the rotation property
         */
        public static rotationProperty: Prim2DPropInfo;

        /**
         * Metadata of the scale property
         */
        public static scaleProperty: Prim2DPropInfo;

        /**
         * Metadata of the actualSize property
         */
        public static actualSizeProperty: Prim2DPropInfo;

        /**
         * Metadata of the actualWidth property
         */
        public static actualWidthProperty: Prim2DPropInfo;

        /**
         * Metadata of the actualHeight property
         */
        public static actualHeightProperty: Prim2DPropInfo;

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
         * Metadata of the marginAlignment property
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

        /**
         * Metadata of the actualScale property
         */
        public static actualScaleProperty: Prim2DPropInfo;

        @logProp(null, false, false, false)
        @instanceLevelProperty(1, pi => Prim2DBase.actualPositionProperty = pi, false, false, true)
        /**
         * Return the position where the primitive is rendered in the Canvas, this position may be different than the one returned by the position property due to layout/alignment/margin/padding computing.
         * BEWARE: don't change this value, it's read-only!
         */
        public get actualPosition(): Vector2 {
            // If we don't use positioning engine the actual position is the position
            if (!this._isFlagSet(SmartPropertyPrim.flagUsePositioning)) {
                return this.position;
            }

            // We use the positioning engine, if the variable is fetched, it's up to date, return it
            if (this._actualPosition != null) {
                return this._actualPosition;
            }

            this._updatePositioning();

            return this._actualPosition;
        }
        private static _nullPosition = Vector2.Zero();
        private static _nullSize = Size.Zero();

        /**
         * DO NOT INVOKE for internal purpose only
         */
        public set actualPosition(val: Vector2) {
            if (!this._actualPosition) {
                this._actualPosition = val.clone();
            } else {
                this._actualPosition.copyFrom(val);
            }
        }

        /**
         * Shortcut to actualPosition.x
         */
        @instanceLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 1, pi => Prim2DBase.actualXProperty = pi, false, false, true)
        public get actualX(): number {
            return this.actualPosition.x;
        }

        /**
         * DO NOT INVOKE for internal purpose only
         */
        public set actualX(val: number) {
            this._actualPosition.x = val;
            this._triggerPropertyChanged(Prim2DBase.actualPositionProperty, this._actualPosition);
        }

        /**
         * Shortcut to actualPosition.y
         */
        @instanceLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 2, pi => Prim2DBase.actualYProperty = pi, false, false, true)
        public get actualY(): number {
            return this.actualPosition.y;
        }

        /**
        * DO NOT INVOKE for internal purpose only
        */
        public set actualY(val: number) {
            this._actualPosition.y = val;
            this._triggerPropertyChanged(Prim2DBase.actualPositionProperty, this._actualPosition);
        }

        /**
         * Position of the primitive, relative to its parent.
         * BEWARE: if you change only position.x or y it won't trigger a property change and you won't have the expected behavior.
         * Use this property to set a new Vector2 object, otherwise to change only the x/y use Prim2DBase.x or y properties.
         * Setting this property may have no effect is specific alignment are in effect.
         */
        @dynamicLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 3, pi => Prim2DBase.positionProperty = pi, false, false, true)
        public get position(): Vector2 {
            if (!this._position) {
                this._position = Vector2.Zero();
            }
            return this._position;
        }

        public set position(value: Vector2) {
            //if (!this._checkPositionChange()) {
            //    return;
            //}
            if (this._checkUseMargin()) {
                switch (this.marginAlignment.horizontal) {
                    case PrimitiveAlignment.AlignLeft:
                    case PrimitiveAlignment.AlignStretch:
                    case PrimitiveAlignment.AlignCenter:
                        this.margin.leftPixels = value.x;
                        break;
                    case PrimitiveAlignment.AlignRight:
                        this.margin.rightPixels = value.x;
                        break;
                    }
                switch (this.marginAlignment.vertical) {
                    case PrimitiveAlignment.AlignBottom:
                    case PrimitiveAlignment.AlignStretch:
                    case PrimitiveAlignment.AlignCenter:
                        this.margin.bottomPixels = value.y;
                        break;
                    case PrimitiveAlignment.AlignTop:
                        this.margin.topPixels = value.y;
                        break;
                }
                return;
            } else {
                if (!value) {
                    this._position = null;
                } else {
                    if (!this._position) {
                        this._position = value.clone();
                    } else {
                        this._position.copyFrom(value);
                    }
                }
                this._actualPosition = null;
                this._triggerPropertyChanged(Prim2DBase.actualPositionProperty, value);
            }
        }

        /**
         * Direct access to the position.x value of the primitive
         * Use this property when you only want to change one component of the position property
         */
        @dynamicLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 4, pi => Prim2DBase.xProperty = pi, false, false, true)
        public get x(): number {
            if (!this._position) {
                return null;
            }
            return this._position.x;
        }

        public set x(value: number) {
            //if (!this._checkPositionChange()) {
            //    return;
            //}
            if (value == null) {
                throw new Error(`Can't set a null x in primitive ${this.id}, only the position can be turned to null`);
            }
            if (this._checkUseMargin()) {
                switch (this.marginAlignment.horizontal) {
                    case PrimitiveAlignment.AlignLeft:
                    case PrimitiveAlignment.AlignStretch:
                    case PrimitiveAlignment.AlignCenter:
                        this.margin.leftPixels = value;
                        break;
                    case PrimitiveAlignment.AlignRight:
                        this.margin.rightPixels = value;
                        break;
                    }
                return;
            } else {
                if (!this._position) {
                    this._position = Vector2.Zero();
                }

                if (this._position.x === value) {
                    return;
                }

                this._position.x = value;
                this._actualPosition = null;
                this._triggerPropertyChanged(Prim2DBase.positionProperty, value);
                this._triggerPropertyChanged(Prim2DBase.actualPositionProperty, value);
            }
        }

        /**
         * Direct access to the position.y value of the primitive
         * Use this property when you only want to change one component of the position property
         */
        @dynamicLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 5, pi => Prim2DBase.yProperty = pi, false, false, true)
        public get y(): number {
            if (!this._position) {
                return null;
            }
            return this._position.y;
        }

        public set y(value: number) {
            //if (!this._checkPositionChange()) {
            //    return;
            //}
            if (value == null) {
                throw new Error(`Can't set a null y in primitive ${this.id}, only the position can be turned to null`);
            }
            if (this._checkUseMargin()) {
                switch (this.marginAlignment.vertical) {
                    case PrimitiveAlignment.AlignBottom:
                    case PrimitiveAlignment.AlignStretch:
                    case PrimitiveAlignment.AlignCenter:
                        this.margin.bottomPixels = value;
                        break;
                    case PrimitiveAlignment.AlignTop:
                        this.margin.topPixels = value;
                        break;
                }
                return;
            } else {
                if (!this._position) {
                    this._position = Vector2.Zero();
                }

                if (this._position.y === value) {
                    return;
                }

                this._position.y = value;
                this._actualPosition = null;
                this._triggerPropertyChanged(Prim2DBase.positionProperty, value);
                this._triggerPropertyChanged(Prim2DBase.actualPositionProperty, value);
            }
        }

        private static boundinbBoxReentrency: number = -1;
        protected static nullSize = Size.Zero();

        @logProp()
        @dynamicLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 6, pi => Prim2DBase.sizeProperty = pi, false, true)
        /**
         * Size of the primitive or its bounding area
         * BEWARE: if you change only size.width or height it won't trigger a property change and you won't have the expected behavior.
         * Use this property to set a new Size object, otherwise to change only the width/height use Prim2DBase.width or height properties.
         */
        public get size(): Size {
            return this.internalGetSize();
        }

        @logMethod()
        protected internalGetSize(): Size {
            if (!this._size || this._size.width == null || this._size.height == null) {

                let bbr = Prim2DBase.boundinbBoxReentrency;
                if (bbr !== -1 && bbr <= (this.hierarchyDepth || 0)) {
                    C2DLogging.setPostMessage(() => "re entrancy detected");
                    return Prim2DBase.nullSize;
                }

                if (!this._isFlagSet(SmartPropertyPrim.flagLayoutBoundingInfoDirty)) {
                    C2DLogging.setPostMessage(() => "cache hit");
                    return this._internalSize;
                }

                C2DLogging.setPostMessage(() => "cache miss");
                Prim2DBase.boundinbBoxReentrency = this.hierarchyDepth || 0;
                let b = this.boundingInfo;
                Prim2DBase.boundinbBoxReentrency = -1;

                Prim2DBase._size.copyFrom(this._internalSize);
                b.sizeToRef(this._internalSize);

                if (!this._internalSize.equals(Prim2DBase._size)) {
                    this._triggerPropertyChanged(Prim2DBase.sizeProperty, this._internalSize);
                    this._positioningDirty();
                }

                return this._internalSize || Prim2DBase._nullSize;
            } else {
                C2DLogging.setPostMessage(() => "user set size");
            }
            return this._size || Prim2DBase._nullSize;
        }

        public set size(value: Size) {
            this.internalSetSize(value);
        }

        @logMethod()
        protected internalSetSize(value: Size) {
            if (!value) {
                this._size = null;
            } else {
                if (!this._size) {
                    this._size = value.clone();
                } else {
                   this._size.copyFrom(value);
                }
            }
            this._actualSize = null;
            this._updatePositioningState();
            this._positioningDirty();
        }

        @logProp()
        @dynamicLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 7, pi => Prim2DBase.widthProperty = pi, false, true)
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
            if (this.size && this.size.width === value) {
                return;
            }

            if (!this.size) {
                this.size = new Size(value, 0);
            } else {
                this.size.width = value;
            }

            this._actualSize = null;
            this._triggerPropertyChanged(Prim2DBase.sizeProperty, value);
            this._positioningDirty();
        }

        @logProp()
        @dynamicLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 8, pi => Prim2DBase.heightProperty = pi, false, true)
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
            if (this.size && this.size.height === value) {
                return;
            }

            if (!this.size) {
                this.size = new Size(0, value);
            } else {
                this.size.height = value;
            }

            this._actualSize = null;
            this._triggerPropertyChanged(Prim2DBase.sizeProperty, value);
            this._positioningDirty();
        }

        @logProp()
        @instanceLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 9, pi => Prim2DBase.rotationProperty = pi, false, true)
        /**
         * Rotation of the primitive, in radian, along the Z axis
         */
        public get rotation(): number {
            return this._rotation;
        }

        public set rotation(value: number) {
            this._rotation = value;
            if (this._hasMargin) {
                this._positioningDirty();
            }
        }

        @logProp()
        @instanceLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 10, pi => Prim2DBase.scaleProperty = pi, false, true)
        /**
         * Uniform scale applied on the primitive. If a non-uniform scale is applied through scaleX/scaleY property the getter of this property will return scaleX.
         */
        public set scale(value: number) {
            if (value <= 0) {
                throw new Error("You can't set the scale to less or equal to 0");
            }
            this._scale.x = this._scale.y = value;
            this._setFlags(SmartPropertyPrim.flagActualScaleDirty);
            this._spreadActualScaleDirty();
            this._positioningDirty();
        }

        public get scale(): number {
            return this._scale.x;
        }

        @logProp()
        @dynamicLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 11, pi => Prim2DBase.actualSizeProperty = pi, false, true)
        /**
         * Return the size of the primitive as it's being rendered into the target.
         * This value may be different of the size property when layout/alignment is used or specific primitive types can implement a custom logic through this property.
         * BEWARE: don't use the setter, it's for internal purpose only
         * Note to implementers: you have to override this property and declare if necessary a @xxxxInstanceLevel decorator
         */
        public get actualSize(): Size {
            // If we don't use positioning engine the actual size is the size
            if (!this._isFlagSet(SmartPropertyPrim.flagUsePositioning)) {
                return this.size;
            }

            // We use the positioning engine, if the variable is fetched, it's up to date, return it
            if (this._actualSize) {
                return this._actualSize;
            }

            this._updatePositioning();

            return this._actualSize;
        }

        public set actualSize(value: Size) {
            if (this._actualSize && this._actualSize.equals(value)) {
                return;
            }

            if (!this._actualSize) {
                this._actualSize = value.clone();
            } else {
                this._actualSize.copyFrom(value);
            }
        }

        @dynamicLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 12, pi => Prim2DBase.actualWidthProperty = pi, false, true)
        /**
         * Shortcut to actualSize.width
         */
        public get actualWidth(): number {
            return this.actualSize.width;
        }

        public set actualWidth(val: number) {
            this._actualSize.width = val;
            this._triggerPropertyChanged(Prim2DBase.actualSizeProperty, this._actualSize);
        }

        @dynamicLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 13, pi => Prim2DBase.actualHeightProperty = pi, false, true)
        /**
         * Shortcut to actualPosition.height
         */
        public get actualHeight(): number {
            return this.actualSize.height;
        }

        public set actualHeight(val: number) {
            this._actualSize.height = val;
            this._triggerPropertyChanged(Prim2DBase.actualPositionProperty, this._actualSize);
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

            if (!this._minSize) {
                this._minSize = value.clone();
            } else {
                this._minSize.copyFrom(value);
            }
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

            if (!this._maxSize) {
                this._maxSize = value.clone();
            } else {
                this._maxSize.copyFrom(value);
            }
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
        @dynamicLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 14, pi => Prim2DBase.originProperty = pi, false, true)
        public get origin(): Vector2 {
            return this._origin;
        }

        public set origin(value: Vector2) {
            if (!this._origin) {
                this._origin = value.clone();
            } else {
                this._origin.copyFrom(value);
            }
        }

        @dynamicLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 15, pi => Prim2DBase.levelVisibleProperty = pi)
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

        @instanceLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 16, pi => Prim2DBase.isVisibleProperty = pi)
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

        @instanceLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 17, pi => Prim2DBase.zOrderProperty = pi)
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

        @dynamicLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 18, pi => Prim2DBase.marginProperty = pi)
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
                }, () => {
                    this._positioningDirty();
                    this._updatePositioningState();
                });
                this._updatePositioningState();
            }
            return this._margin;
        }

        public set margin(value: PrimitiveThickness) {
            if (!value) {
                this._margin = null;
            } else {
                this.margin.copyFrom(value);
            }
            this._updatePositioningState();
        }

        /**
         * Set the margin from a string value
         * @param value is "top: <value>, left:<value>, right:<value>, bottom:<value>" or "<value>" (same for all edges) each are optional, auto will be set if it's omitted.
         * Values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         */
        public setMargin(value: string) {
            this.margin.fromString(value);
            this._updatePositioningState();
        }

        /**
         * Check for both margin and marginAlignment, return true if at least one of them is specified with a non default value
         */
        public get _hasMargin(): boolean {
            return (this._margin !== null && !this._margin.isDefault) || (this._marginAlignment !== null && !this._marginAlignment.isDefault);
        }

        @dynamicLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 19, pi => Prim2DBase.paddingProperty = pi)
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
                this._updatePositioningState();
            }
            return this._padding;
        }

        public set padding(value: PrimitiveThickness) {
            if (!value) {
                this._padding = null;
            } else {
                this.padding.copyFrom(value);
            }
            this._updatePositioningState();
        }

        /**
         * Set the padding from a string value
         * @param value is "top: <value>, left:<value>, right:<value>, bottom:<value>" or "<value>" (same for all edges) each are optional, auto will be set if it's omitted.
         * Values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.         */
        public setPadding(value: string) {
            this.padding.fromString(value);
            this._updatePositioningState();
        }

        private get _hasPadding(): boolean {
            return this._padding !== null && !this._padding.isDefault;
        }

        @dynamicLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 20, pi => Prim2DBase.marginAlignmentProperty = pi)
        /**
         * You can get/set the margin alignment through this property
         */
        public get marginAlignment(): PrimitiveAlignment {
            if (!this._marginAlignment) {
                this._marginAlignment = new PrimitiveAlignment(() => {
                    this._positioningDirty();
                    this._updatePositioningState();
                });
                this._updatePositioningState();
            }
            return this._marginAlignment;
        }

        public set marginAlignment(value: PrimitiveAlignment) {
            if (!value) {
                this._marginAlignment = null;
            } else {
                this.marginAlignment.copyFrom(value);
            }
            this._updatePositioningState();
        }

        /**
         * Set the margin's horizontal and or vertical alignments from a string value.
         * @param value can be: [<h:|horizontal:><left|right|center|stretch>], [<v:|vertical:><top|bottom|center|stretch>]
         */
        public setMarginalignment(value: string) {
            this.marginAlignment.fromString(value);
            this._updatePositioningState();
        }

        /**
         * Check if there a marginAlignment specified (non null and not default)
         */
        public get _hasMarginAlignment(): boolean {
            return (this._marginAlignment !== null && !this._marginAlignment.isDefault);
        }

        protected _updatePositioningState() {
            let value = this._hasMargin || this._hasPadding || this.isSizeAuto;
//            console.log(`${this.id} with parent ${this._parent ? this._parent.id : "[none]"} state: ${value} `);
            this._changeFlags(SmartPropertyPrim.flagUsePositioning, value);
        }

        @instanceLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 21, pi => Prim2DBase.opacityProperty = pi)
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
            this._setFlags(SmartPropertyPrim.flagActualOpacityDirty);
            this._spreadActualOpacityChanged();
            this._updateRenderMode();
        }

        @instanceLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 22, pi => Prim2DBase.scaleXProperty = pi, false, true)
        /**
         * Scale applied on the X axis of the primitive
         */
        public set scaleX(value: number) {
            if (value <= 0) {
                throw new Error("You can't set the scaleX to less or equal to 0");
            }
            this._scale.x = value;
            this._setFlags(SmartPropertyPrim.flagActualScaleDirty);
            this._spreadActualScaleDirty();
            this._positioningDirty();
        }

        public get scaleX(): number {
            return this._scale.x;
        }

        @instanceLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 23, pi => Prim2DBase.scaleYProperty = pi, false, true)
        /**
         * Scale applied on the Y axis of the primitive
         */
        public set scaleY(value: number) {
            if (value <= 0) {
                throw new Error("You can't set the scaleY to less or equal to 0");
            }
            this._scale.y = value;
            this._setFlags(SmartPropertyPrim.flagActualScaleDirty);
            this._spreadActualScaleDirty();
            this._positioningDirty();
        }

        public get scaleY(): number {
            return this._scale.y;
        }

        protected _spreadActualScaleDirty() {
            for (let child of this._children) {
                child._setFlags(SmartPropertyPrim.flagActualScaleDirty);
                child._spreadActualScaleDirty();
            }
        }

        /**
         * Returns the actual scale of this Primitive, the value is computed from the scale property of this primitive, multiplied by the actualScale of its parent one (if any). The Vector2 object returned contains the scale for both X and Y axis
         */
        @instanceLevelProperty(SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 24, pi => Prim2DBase.actualScaleProperty = pi, false, true)
        public get actualScale(): Vector2 {
            if (this._isFlagSet(SmartPropertyPrim.flagActualScaleDirty)) {
                let cur = this._isFlagSet(SmartPropertyPrim.flagDontInheritParentScale) ? null : this.parent;
                let sx = this.scaleX;
                let sy = this.scaleY;
                while (cur) {
                    sx *= cur.scaleX;
                    sy *= cur.scaleY;
                    cur = cur._isFlagSet(SmartPropertyPrim.flagDontInheritParentScale) ? null : cur.parent;
                }

                this._actualScale.copyFromFloats(sx, sy);
                this._clearFlags(SmartPropertyPrim.flagActualScaleDirty);
            }
            return this._actualScale;
        }

        /**
         * Get the actual Scale of the X axis, shortcut for this.actualScale.x
         */
        public get actualScaleX(): number {
            return this.actualScale.x;
        }

        /**
         * This method stores the actual global scale (including DesignMode and DPR related scales) in the given Vector2
         * @param res the object that will receive the actual global scale: this is actualScale * DPRScale * DesignModeScale
         */
        public getActualGlobalScaleToRef(res: Vector2) {
            let as = this.actualScale;
            let cls = this.owner._canvasLevelScale || Prim2DBase._iv2;
            res.x = as.x * cls.x;
            res.y = as.y * cls.y;
        }

        /**
         * Get the actual Scale of the Y axis, shortcut for this.actualScale.y
         */
        public get actualScaleY(): number {
            return this.actualScale.y;
        }

        /**
         * Get the actual opacity level, this property is computed from the opacity property, multiplied by the actualOpacity of its parent (if any)
         */
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
            if (this._layoutArea && this._layoutArea.equals(val)) {
                return;
            }
            this._positioningDirty();
            this._setFlags(SmartPropertyPrim.flagLayoutBoundingInfoDirty);
            if (this.parent) {
                this.parent._setFlags(SmartPropertyPrim.flagLayoutBoundingInfoDirty | SmartPropertyPrim.flagGlobalTransformDirty);
            }
            if (!this._layoutArea) {
                this._layoutArea = val.clone();
            } else {
                this._layoutArea.copyFrom(val);
            }
        }

        /**
         * Get/set the layout area position (relative to the parent primitive).
         * The setter should only be called by a Layout Engine class.
         */
        public get layoutAreaPos(): Vector2 {
             return this._layoutAreaPos;
        }

        public set layoutAreaPos(val: Vector2) {
            if (this._layoutAreaPos && this._layoutAreaPos.equals(val)) {
                return;
            }
            if (this.parent) {
                this.parent._setFlags(SmartPropertyPrim.flagLayoutBoundingInfoDirty | SmartPropertyPrim.flagGlobalTransformDirty);
            }
            this._positioningDirty();
            if (!this._layoutAreaPos) {
                this._layoutAreaPos = val.clone();
            } else {
                this._layoutAreaPos.copyFrom(val);
            }
            this._setFlags(SmartPropertyPrim.flagLocalTransformDirty);
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
         * Define if the Primitive acts as a container or not
         * A container will encapsulate its children for interaction event.
         * If it's not a container events will be process down to children if the primitive is not pickable.
         * Default value is true
         */
        public get isContainer(): boolean {
            return this._isFlagSet(SmartPropertyPrim.flagIsContainer);
        }

        public set isContainer(value: boolean) {
            this._changeFlags(SmartPropertyPrim.flagIsContainer, value);
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
        public get globalTransform(): Matrix2D {
            if (!this._globalTransform || (this._globalTransformProcessStep !== this.owner._globalTransformProcessStep)) {
                this.updateCachedStates(false);
            }
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
            v.x = this.globalTransform.m[4];
            v.y = this.globalTransform.m[5];
        }

        /**
         * Get invert of the global transformation matrix of the primitive
         */
        public get invGlobalTransform(): Matrix2D {
            this._updateLocalTransform();
            return this._invGlobalTransform;
        }

        /**
         * Get the local transformation of the primitive
         */
        public get localTransform(): Matrix2D {
            this._updateLocalTransform();
            return this._localTransform;
        }

        public get localLayoutTransform(): Matrix2D {
            this._updateLocalTransform();
            return this._localLayoutTransform;
        }

        /**
         * Get/set if the sprite rendering should be aligned to the target rendering device pixel or not
         */
        public get alignToPixel(): boolean {
            return this._isFlagSet(SmartPropertyPrim.flagAlignPrimitive);
        }

        public set alignToPixel(value: boolean) {
            this._changeFlags(SmartPropertyPrim.flagAlignPrimitive, value);
        }

        private static _bMinMax = Vector4.Zero();
        private static _bMax = Vector2.Zero();
        private static _bSize = Size.Zero();
        private static _tpsBB = new BoundingInfo2D();
        private static _tpsBB2 = new BoundingInfo2D();
        /**
         * Get the boundingInfo associated to the primitive and its children.
         */
        @logProp("", true)
        public get boundingInfo(): BoundingInfo2D {
            // Check if we must update the boundingInfo
            if (this._isFlagSet(SmartPropertyPrim.flagBoundingInfoDirty)) {
                if (this.owner) {
                    this.owner.boundingInfoRecomputeCounter.addCount(1, false);
                }

                C2DLogging.setPostMessage(() => "cache miss");

                let sizedByContent = this.isSizedByContent;

                if (sizedByContent) {
                    this._boundingInfo.clear();
                } else {
                    this._boundingInfo.copyFrom(this.levelBoundingInfo);
                }

                if (this._children.length > 0) {

                    var contentBI = new BoundingInfo2D();
                    var tps = Prim2DBase._tpsBB2;

                    for (let curChild of this._children) {
                        if (curChild._isFlagSet(SmartPropertyPrim.flagNoPartOfLayout)) {
                            continue;
                        }

                        let bb = curChild.layoutBoundingInfo;
                        bb.transformToRef(curChild.localLayoutTransform, tps);

                        contentBI.unionToRef(tps, contentBI);
                    }

                    // Apply padding
                    if (this._hasPadding) {
                        let padding = this.padding;
                        let minmax = Prim2DBase._bMinMax;
                        contentBI.minMaxToRef(minmax);
                        this._paddingOffset.copyFromFloats(padding.leftPixels, padding.bottomPixels, padding.rightPixels, padding.topPixels);
                        let size = Prim2DBase._size2;
                        contentBI.sizeToRef(size);
                        this._getActualSizeFromContentToRef(size, this._paddingOffset, size);
                        minmax.z += this._paddingOffset.z + this._paddingOffset.x;
                        minmax.w += this._paddingOffset.w + this._paddingOffset.y;
                        BoundingInfo2D.CreateFromMinMaxToRef(minmax.x, minmax.z, minmax.y, minmax.w, contentBI);
                    } else {
                        this._paddingOffset.copyFromFloats(0, 0, 0, 0);
                    }
                    this._boundingInfo.unionToRef(contentBI, this._boundingInfo);
                }

                if (sizedByContent || !this._isFlagSet(SmartPropertyPrim.flagLevelBoundingInfoDirty)) {
                    this._clearFlags(SmartPropertyPrim.flagBoundingInfoDirty);
                }
            } else {
                C2DLogging.setPostMessage(() => "cache hit");
            }
            return this._boundingInfo;
        }

        /**
         * Get the boundingInfo of the primitive's content arranged by a layout Engine
         * If a particular child is not arranged by layout, it's boundingInfo is used instead to produce something as accurate as possible
         */
        @logProp("", true)
        public get layoutBoundingInfo(): BoundingInfo2D {
            let usePositioning = this._isFlagSet(SmartPropertyPrim.flagUsePositioning);
            if (this._isFlagSet(SmartPropertyPrim.flagLayoutBoundingInfoDirty)) {
                C2DLogging.setPostMessage(() => "cache miss");

                if (this._owner) {
                    this._owner.addLayoutBoundingInfoUpdateCounter(1);
                }

                if (this._isFlagSet(SmartPropertyPrim.flagLayoutDirty)) {
                    if (this._owner) {
                        this._owner.addUpdateLayoutCounter(1);
                    }
                    this._layoutEngine.updateLayout(this);

                    this._clearFlags(SmartPropertyPrim.flagLayoutDirty);
                }

                if (usePositioning) {
                    if (this._isFlagSet(SmartPropertyPrim.flagPositioningDirty)) {
                        this._updatePositioning();
                    }

                    // Safety check, code re entrance is a PITA in this part of the code
                    if (!this._layoutBoundingInfo) {
                        C2DLogging.setPostMessage(() => "re entrance detected, boundingInfo returned");
                        return this.boundingInfo;
                    }

                    if (this._isFlagSet(SmartPropertyPrim.flagPositioningDirty)) {
                        C2DLogging.setPostMessage(() => "couldn't compute positioning, boundingInfo returned");
                        return this.boundingInfo;
                    }
                }

                if (!usePositioning) {
                    let bi = this.boundingInfo;
                    if (!this._isFlagSet(SmartPropertyPrim.flagBoundingInfoDirty)) {
                        this._clearFlags(SmartPropertyPrim.flagLayoutBoundingInfoDirty);
                    }
                    return bi;
                }
                this._clearFlags(SmartPropertyPrim.flagLayoutBoundingInfoDirty);
            } else {
                C2DLogging.setPostMessage(() => "cache hit");
            }
            return usePositioning ? this._layoutBoundingInfo : this.boundingInfo;
        }

        /**
         * Determine if the size is automatically computed or fixed because manually specified.
         * Use the actualSize property to get the final/real size of the primitive
         * @returns true if the size is automatically computed, false if it were manually specified.
         */
        public get isSizeAuto(): boolean {
            let size = this._size;
            return size == null || (size.width==null && size.height==null);
        }

        /**
         * Determine if the horizontal size is automatically computed or fixed because manually specified.
         * Use the actualSize property to get the final/real size of the primitive
         * @returns true if the horizontal size is automatically computed, false if it were manually specified.
         */
        public get isHorizontalSizeAuto(): boolean {
            let size = this._size;
            return size == null || size.width == null;
        }

        /**
         * Determine if the vertical size is automatically computed or fixed because manually specified.
         * Use the actualSize property to get the final/real size of the primitive
         * @returns true if the vertical size is automatically computed, false if it were manually specified.
         */
        public get isVerticalSizeAuto(): boolean {
            let size = this._size;
            return size == null || size.height == null;
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

        public get displayDebugAreas(): boolean {
            return this._displayDebugAreas;
        }

        public set displayDebugAreas(value: boolean) {
            if (this._displayDebugAreas === value) {
                return;
            }

            if (value === false) {
                this._debugAreaGroup.dispose();
                this._debugAreaGroup = null;
            } else {
                let layoutFill    = "#F0808040";    // Red - Layout area
                let layoutBorder  = "#F08080FF";
                let marginFill    = "#F0F04040";    // Yellow - Margin area
                let marginBorder  = "#F0F040FF";
                let paddingFill   = "#F040F040";    // Magenta - Padding Area
                let paddingBorder = "#F040F0FF";
                let contentFill   = "#40F0F040";    // Cyan - Content area
                let contentBorder = "#40F0F0FF";
                let s = new Size(10, 10);
                let p = Vector2.Zero();

                this._debugAreaGroup = new Group2D
                    (
                    {   /*dontInheritParentScale: true,*/
                        parent: (this.parent!=null) ? this.parent : this, id: "###DEBUG AREA GROUP###", children:
                        [
                            new Group2D({
                                id: "###Layout Area###", position: p, size: s, children:
                                [
                                    new Rectangle2D({ id: "###Layout Frame###", position: Vector2.Zero(), size: s, fill: null, border: layoutBorder }),
                                    new Rectangle2D({ id: "###Layout Top###", position: Vector2.Zero(), size: s, fill: layoutFill }),
                                    new Rectangle2D({ id: "###Layout Left###", position: Vector2.Zero(), size: s, fill: layoutFill }),
                                    new Rectangle2D({ id: "###Layout Right###", position: Vector2.Zero(), size: s, fill: layoutFill }),
                                    new Rectangle2D({ id: "###Layout Bottom###", position: Vector2.Zero(), size: s, fill: layoutFill })
                                ]
                            }),
                            new Group2D({
                                id: "###Margin Area###", position: p, size: s, children:
                                [
                                    new Rectangle2D({ id: "###Margin Frame###", position: Vector2.Zero(), size: s, fill: null, border: marginBorder }),
                                    new Rectangle2D({ id: "###Margin Top###", position: Vector2.Zero(), size: s, fill: marginFill }),
                                    new Rectangle2D({ id: "###Margin Left###", position: Vector2.Zero(), size: s, fill: marginFill }),
                                    new Rectangle2D({ id: "###Margin Right###", position: Vector2.Zero(), size: s, fill: marginFill }),
                                    new Rectangle2D({ id: "###Margin Bottom###", position: Vector2.Zero(), size: s, fill: marginFill })
                                ]
                            }),
                            new Group2D({
                                id: "###Padding Area###", position: p, size: s, children:
                                [
                                    new Rectangle2D({ id: "###Padding Frame###", position: Vector2.Zero(), size: s, fill: null, border: paddingBorder }),
                                    new Rectangle2D({ id: "###Padding Top###", position: Vector2.Zero(), size: s, fill: paddingFill }),
                                    new Rectangle2D({ id: "###Padding Left###", position: Vector2.Zero(), size: s, fill: paddingFill }),
                                    new Rectangle2D({ id: "###Padding Right###", position: Vector2.Zero(), size: s, fill: paddingFill }),
                                    new Rectangle2D({ id: "###Padding Bottom###", position: Vector2.Zero(), size: s, fill: paddingFill })
                                ]
                            }),
                            new Group2D({
                                id: "###Content Area###", position: p, size: s, children:
                                [
                                    new Rectangle2D({ id: "###Content Frame###", position: Vector2.Zero(), size: s, fill: null, border: contentBorder }),
                                    new Rectangle2D({ id: "###Content Top###", position: Vector2.Zero(), size: s, fill: contentFill }),
                                    new Rectangle2D({ id: "###Content Left###", position: Vector2.Zero(), size: s, fill: contentFill }),
                                    new Rectangle2D({ id: "###Content Right###", position: Vector2.Zero(), size: s, fill: contentFill }),
                                    new Rectangle2D({ id: "###Content Bottom###", position: Vector2.Zero(), size: s, fill: contentFill })
                                ]
                            })
                        ]
                    }
                );
                this._debugAreaGroup._setFlags(SmartPropertyPrim.flagNoPartOfLayout);
                this._updateDebugArea();
            }

            this._displayDebugAreas = value;
        }

        private static _updatingDebugArea = false;
        private _updateDebugArea() {
            if (Prim2DBase._updatingDebugArea === true) {
                return;
            }
            Prim2DBase._updatingDebugArea = true;

            let areaNames = ["Layout", "Margin", "Padding", "Content"];
            let areaZones = ["Area", "Frame", "Top", "Left", "Right", "Bottom"];

            let prims = new Array<Array<Prim2DBase>>(4);

            // Get all the primitives used to display the areas
            for (let i = 0; i < 4; i++) {
                prims[i] = new Array<Prim2DBase>(6);
                for (let j = 0; j < 6; j++) {
                    prims[i][j] = this._debugAreaGroup.findById(`###${areaNames[i]} ${areaZones[j]}###`);
                    if (j > 1) {
                        prims[i][j].levelVisible = false;
                    }
                }
            }

            // Update the visibility status of layout/margin/padding
            let hasLayout = this._layoutAreaPos != null;
            let hasPos = (this.actualPosition.x!==0) || (this.actualPosition.y!==0);
            let hasMargin = this._hasMargin;
            let hasPadding = this._hasPadding;
            prims[0][0].levelVisible = hasLayout;
            prims[1][0].levelVisible = hasMargin;
            prims[2][0].levelVisible = hasPadding;
            prims[3][0].levelVisible = true;

            // Current offset
            let curOffset = Vector2.Zero();

            // Store the area info of the layout area
            let curAreaIndex = 0;

            // Store data about each area
            let areaInfo = new Array<{ off: Vector2, size: Size, min: Vector2, max: Vector2 }>(4);

            let storeAreaInfo = (pos: Vector2, size: Size) => {
                let min = pos.clone();
                let max = pos.clone();
                if (size.width > 0) {
                    max.x += size.width;
                }
                if (size.height > 0) {
                    max.y += size.height;
                }

                areaInfo[curAreaIndex++] = { off: pos, size: size, min: min, max: max };
            }

            let isCanvas = this instanceof Canvas2D;
            let marginH = this._marginOffset.x + this._marginOffset.z;
            let marginV = this._marginOffset.y + this._marginOffset.w;
            let actualSize = this.actualSize.multiplyByFloats(isCanvas ? 1 : this.scaleX, isCanvas ? 1 : this.scaleY);

            let w = hasLayout ? (this.layoutAreaPos.x + this.layoutArea.width)  : (marginH + actualSize.width);
            let h = hasLayout ? (this.layoutAreaPos.y + this.layoutArea.height) : (marginV + actualSize.height);
            let pos = (!hasLayout && !hasMargin && !hasPadding && hasPos) ? this.actualPosition : Vector2.Zero();

            storeAreaInfo(pos, new Size(w, h));

            // Compute the layout related data
            if (hasLayout) {
                let layoutOffset = this.layoutAreaPos.clone();

                storeAreaInfo(layoutOffset, (hasMargin || hasPadding) ? this.layoutArea.clone() : actualSize.clone());
                curOffset = layoutOffset.clone();
            }

            // Compute margin data
            if (hasMargin) {
                let marginOffset = curOffset.clone();
                marginOffset.x += this._marginOffset.x;
                marginOffset.y += this._marginOffset.y;
                let marginArea = actualSize;

                storeAreaInfo(marginOffset, marginArea);
                curOffset = marginOffset.clone();
            }

            if (hasPadding) {
                let contentOffset = curOffset.clone();
                contentOffset.x += this._paddingOffset.x;
                contentOffset.y += this._paddingOffset.y;
                let contentArea = this.contentArea;

                storeAreaInfo(contentOffset, contentArea);
                curOffset = curOffset.add(contentOffset);
            }

            // Helper function that set the pos and size of a given prim
            let setArea = (i: number, j: number, pos: Vector2, size: Size) => {
                prims[i][j].position = pos;
                prims[i][j].size = size;
            }

            let setFullRect = (i: number, pos: Vector2, size: Size) => {
                let plist = prims[i];
                plist[2].levelVisible = true;
                plist[3].levelVisible = false;
                plist[4].levelVisible = false;
                plist[5].levelVisible = false;

                setArea(i, 1, pos, size);
                setArea(i, 2, pos, size);
            }

            let setQuadRect = (i: number, areaIndex: number) => {
                let plist = prims[i];
                plist[2].levelVisible = true;
                plist[3].levelVisible = true;
                plist[4].levelVisible = true;
                plist[5].levelVisible = true;

                let ca = areaInfo[areaIndex];
                let na = areaInfo[areaIndex + 1];

                let tp = new Vector2(ca.min.x, na.max.y);
                let ts = new Size(ca.size.width, ca.max.y - tp.y);
                let lp = new Vector2(ca.min.x, na.min.y);
                let ls = new Size(na.min.x - ca.min.x, na.max.y - na.min.y);
                let rp = new Vector2(na.max.x, na.min.y);
                let rs = new Size(ca.max.x - na.max.x, na.max.y - na.min.y);
                let bp = new Vector2(ca.min.x, ca.min.y);
                let bs = new Size(ca.size.width, na.min.y - ca.min.y);

                // Frame
                plist[1].position = ca.off;
                plist[1].size = ca.size;

                // Top rect
                plist[2].position = tp;
                plist[2].size = ts;

                // Left rect
                plist[3].position = lp;
                plist[3].size = ls;

                // Right rect
                plist[4].position = rp;
                plist[4].size = rs;

                // Bottom rect
                plist[5].position = bp;
                plist[5].size = bs;
            }

            let areaCount = curAreaIndex;
            curAreaIndex = 0;

            // Available zones
            let availableZones = [false, hasLayout, hasMargin, hasPadding, true];

            for (let k = 1; k < 5; k++) {
                if (availableZones[k]) {

                    let ai = areaInfo[curAreaIndex];

                    setArea(k-1, 0, Vector2.Zero(), ai.size);
//                    setArea(k-1, 1, Vector2.Zero(), ai.size);

                    if (k === 4) {
                        setFullRect(k-1, ai.off, ai.size);
                    } else {
                        setQuadRect(k-1, curAreaIndex);
                    }
                    ++curAreaIndex;
                }
            }

            Prim2DBase._updatingDebugArea = false;
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

        private static _bypassGroup2DExclusion = false;

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
                this.globalTransform.transformPointToRef(intersectInfo.pickPosition, intersectInfo._globalPickPosition);
                intersectInfo._localPickPosition = intersectInfo.pickPosition.clone();
                intersectInfo.intersectedPrimitives = new Array<PrimitiveIntersectedInfo>();
                intersectInfo.topMostIntersectedPrimitive = null;
            }

            if (!Prim2DBase._bypassGroup2DExclusion && this instanceof Group2D && (<Group2D><any>this).isCachedGroup && !(<Group2D><any>this).isRenderableGroup) {
                // Important to call this before each return to allow a good recursion next time this intersectInfo is reused
                intersectInfo._exit(firstLevel);
                return false;
            }

            if (!intersectInfo.intersectHidden && !this.isVisible) {
                // Important to call this before each return to allow a good recursion next time this intersectInfo is reused
                intersectInfo._exit(firstLevel);
                return false;
            }

            let id = this.id;
            if (id != null && id.indexOf("__cachedSpriteOfGroup__") === 0) {
                try {
                    Prim2DBase._bypassGroup2DExclusion = true;
                    let ownerGroup = this.getExternalData<Group2D>("__cachedGroup__");
                    if (!ownerGroup) {
                        return false;
                    }
                    return ownerGroup.intersect(intersectInfo);
                } finally  {
                    Prim2DBase._bypassGroup2DExclusion = false;
                }
            }

            // If we're testing a cachedGroup, we must reject pointer outside its levelBoundingInfo because children primitives could be partially clipped outside so we must not accept them as intersected when it's the case (because they're not visually visible).
            let isIntersectionTest = false;
            if (this instanceof Group2D) {
                let g = <Group2D><any>this;
                isIntersectionTest = g.isCachedGroup;
            }
            if (isIntersectionTest && !this.levelBoundingInfo.doesIntersect(intersectInfo._localPickPosition)) {
                // Important to call this before each return to allow a good recursion next time this intersectInfo is reused
                intersectInfo._exit(firstLevel);
                return false;
            }

            // Fast rejection test with boundingInfo
            let boundingIntersected = true;
            if (this.isPickable && !this.boundingInfo.doesIntersect(intersectInfo._localPickPosition)) {
                if (this.isContainer) {
                    // Important to call this before each return to allow a good recursion next time this intersectInfo is reused
                    intersectInfo._exit(firstLevel);
                    return false;
                }
                boundingIntersected = false;
            }

            // We hit the boundingInfo that bounds this primitive and its children, now we have to test on the primitive of this level
            let levelIntersectRes = false;
            if (this.isPickable) {
                levelIntersectRes = boundingIntersected && this.levelIntersect(intersectInfo);
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
                    if ((!curChild.isPickable && curChild.isContainer) || (!intersectInfo.intersectHidden && !curChild.isVisible)) {
                        continue;
                    }

                    // Must compute the localPickLocation for the children level
                    curChild.invGlobalTransform.transformPointToRef(intersectInfo._globalPickPosition, intersectInfo._localPickPosition);

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

        public intersectOtherPrim(other: Prim2DBase): boolean {
            let setA = this.triList;
            let setB = other.triList;

            return Tri2DArray.doesIntersect(setA, setB, other.globalTransform.multiply(this.globalTransform.clone().invert()));
        }

        public get triList(): Tri2DArray {
            if (this._primTriArrayDirty) {
                this.updateTriArray();
                this._primTriArrayDirty = false;
            }
            return this._primTriArray;
        }

        // This is the worst implementation, if the top level primitive doesn't override this method we will just store a quad that defines the bounding rect of the prim
        protected updateTriArray() {
            if (this._primTriArray == null) {
                this._primTriArray = new Tri2DArray(2);
            } else {
                this._primTriArray.clear(2);
            }

            let size = this.actualSize;
            let lb = new Vector2(0, 0);
            let rt = new Vector2(size.width, size.height);
            let lt = new Vector2(0, size.height);
            let rb = new Vector2(size.width, 0);
            this._primTriArray.storeTriangle(0, lb, lt, rt);
            this._primTriArray.storeTriangle(1, lb, rt, rb);
        }

        /**
         * Move a child object into a new position regarding its siblings to change its rendering order.
         * You can also use the shortcut methods to move top/bottom: moveChildToTop, moveChildToBottom, moveToTop, moveToBottom.
         * @param child the object to move
         * @param previous the object which will be before "child", if child has to be the first among sibling, set "previous" to null.
         */
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
            return true;
        }

        /**
         * Move the given child so it's displayed on the top of all its siblings
         * @param child the primitive to move to the top
         */
        public moveChildToTop(child: Prim2DBase): boolean {
            return this.moveChild(child, this._children[this._children.length - 1]);
        }

        /**
         * Move the given child so it's displayed on the bottom of all its siblings
         * @param child the primitive to move to the top
         */
        public moveChildToBottom(child: Prim2DBase): boolean {
            return this.moveChild(child, null);
        }

        /**
         * Move this primitive to be at the top among all its sibling
         */
        public moveToTop(): boolean {
            if (this.parent == null) {
                return false;
            }
            return this.parent.moveChildToTop(this);
        }

        /**
         * Move this primitive to be at the bottom among all its sibling
         */
        public moveToBottom() {
            if (this.parent == null) {
                return false;
            }
            return this.parent.moveChildToBottom(this);
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
            child._setFlags(SmartPropertyPrim.flagActualOpacityDirty);
        }

        /**
         * Dispose the primitive, remove it from its parent.
         */
        public dispose(): boolean {
            if (!super.dispose()) {
                return false;
            }

            if (this._isFlagSet(SmartPropertyPrim.flagCollisionActor)) {
                this.owner._primitiveCollisionManager._removeActor(this);
                this._actorInfo = null;
            }

            if (this._pointerEventObservable) {
                this._pointerEventObservable.clear();
                this._pointerEventObservable = null;
            }

            if (this._actionManager) {
                this._actionManager.dispose();
                this._actionManager = null;
            }
            this.owner.scene.stopAnimation(this);

            // If there's a parent, remove this object from its parent list
            if (this._parent) {
                if (this instanceof Group2D) {
                    let g = <Group2D><any>this;
                    if (g.isRenderableGroup) {
                        let parentRenderable = <Group2D>this.parent.traverseUp(p => (p instanceof Group2D && p.isRenderableGroup));
                        if (parentRenderable != null) {
                            let l = parentRenderable._renderableData._childrenRenderableGroups;
                            let i = l.indexOf(g);
                            if (i !== -1) {
                                l.splice(i, 1);
                            }
                        }
                    }
                }

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
            return this._areSomeFlagsSet(SmartPropertyPrim.flagVisibilityChanged | SmartPropertyPrim.flagModelDirty | SmartPropertyPrim.flagModelUpdate | SmartPropertyPrim.flagNeedRefresh) || (this._instanceDirtyFlags !== 0) || (this._globalTransformProcessStep !== this._globalTransformStep);
        }

        public _prepareRender(context: PrepareRender2DContext) {
            let globalTransformStep = this.owner._globalTransformStep;
            if (this._prepareProcessStep < globalTransformStep) {
                this._prepareRenderPre(context);
                this._prepareRenderPost(context);
                this._prepareProcessStep = globalTransformStep;
            }
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

        @logMethod("", true)
        protected _setLayoutDirty() {
            this.onPrimBecomesDirty();
            this._setFlags(SmartPropertyPrim.flagLayoutDirty);

        }

        //private _checkPositionChange(): boolean {
        //    if (this.parent && this.parent.layoutEngine.isChildPositionAllowed === false) {
        //        console.log(`Can't manually set the position of ${this.id}, the Layout Engine of its parent doesn't allow it`);
        //        return false;
        //    }
        //    if (this._isFlagSet(SmartPropertyPrim.flagUsePositioning)) {
        //        if (<any>this instanceof Group2D && (<Group2D><any>this).trackedNode == null) {
        //            console.log(`You can't set the position/x/y of ${this.id} properties while positioning engine is used (margin, margin alignment and/or padding are set`);
        //            return false;
        //        }
        //    }
        //    return true;
        //}

        private _checkUseMargin(): boolean {
            // Special cae: tracked node
            if (<any>this instanceof Group2D && (<Group2D><any>this).trackedNode != null) {
                return false;
            }

            return this._isFlagSet(SmartPropertyPrim.flagUsePositioning);
        }

        @logMethod("", true)
        protected _positioningDirty() {
            if (!this._isFlagSet(SmartPropertyPrim.flagUsePositioning)) {
                return;
            }
            this.onPrimBecomesDirty();
            this._setFlags(SmartPropertyPrim.flagPositioningDirty);
        }

        protected _spreadActualOpacityChanged() {
            for (let child of this._children) {
                child._setFlags(SmartPropertyPrim.flagActualOpacityDirty);
                child._updateRenderMode();
                child.onPrimBecomesDirty();
                child._spreadActualOpacityChanged();
            }
        }

        private _changeLayoutEngine(engine: LayoutEngineBase) {
            this._layoutEngine = engine;
        }

        private static _t0: Matrix2D = new Matrix2D();
        private static _t1: Matrix2D = new Matrix2D();
        private static _t2: Matrix2D = new Matrix2D();
        private static _v0: Vector2 = Vector2.Zero();    // Must stay with the value 0,0
        private static _v30: Vector3 = Vector3.Zero();   // Must stay with the value 0,0,0
        private static _iv2: Vector2 = new Vector2(1,1); // Must stay identity vector
        private static _ts0 = Size.Zero();

        private _updateLocalTransform(): boolean {
            let tflags = Prim2DBase.actualPositionProperty.flagId | Prim2DBase.rotationProperty.flagId | Prim2DBase.scaleProperty.flagId | Prim2DBase.scaleXProperty.flagId | Prim2DBase.scaleYProperty.flagId | Prim2DBase.originProperty.flagId;

            if (this.checkPropertiesDirty(tflags) || this._areSomeFlagsSet(SmartPropertyPrim.flagLocalTransformDirty | SmartPropertyPrim.flagPositioningDirty)) {
                if (this.owner) {
                    this.owner.addupdateLocalTransformCounter(1);
                }

                // Check for positioning update
                if (this._isFlagSet(SmartPropertyPrim.flagPositioningDirty)) {
                    this._updatePositioning();
                }

                var rot = this._rotation;
                var local: Matrix2D;
                let pos = this._position ? this.position : (this.layoutAreaPos || Prim2DBase._v0);
                let postScale = this._postScale;
                let canvasScale = Prim2DBase._iv2;
                //let hasCanvasScale = false;
                //if (this._parent instanceof Canvas2D) {
                //    hasCanvasScale = true;
                //    canvasScale = (this._parent as Canvas2D)._canvasLevelScale || Prim2DBase._iv2;
                //}
                let globalScale = this._scale.multiplyByFloats(/*postScale.x**/canvasScale.x, /*postScale.y**/canvasScale.y);

                if ((this._origin.x === 0 && this._origin.y === 0) || this._hasMargin) {
                    local = Matrix2D.Compose(globalScale, rot, new Vector2(pos.x + this._marginOffset.x, pos.y + this._marginOffset.y));
                    this._localTransform = local;
                    this._localLayoutTransform = Matrix2D.Compose(globalScale, rot, new Vector2(pos.x, pos.y));
                } else {
                    // -Origin offset
                    let t0 = Prim2DBase._t0;
                    let t1 = Prim2DBase._t1;
                    let t2 = Prim2DBase._t2;
                    let as = Prim2DBase._ts0;
                    as.copyFrom(this.actualSize);
                    //as.width /= postScale.x;
                    //as.height /= postScale.y;
                    Matrix2D.TranslationToRef((-as.width * this._origin.x), (-as.height * this._origin.y), t0);

                    // -Origin * rotation
                    Matrix2D.RotationToRef(rot, t1);
                    t0.multiplyToRef(t1, t2);

                    Matrix2D.ScalingToRef(this._scale.x, this._scale.y, t0);
                    t2.multiplyToRef(t0, t1);

                    Matrix2D.TranslationToRef((as.width * this._origin.x), (as.height * this._origin.y), t2);
                    t1.multiplyToRef(t2, t0);

                    Matrix2D.ScalingToRef(postScale.x, postScale.y, t1);
                    t0.multiplyToRef(t1, t2);

                    Matrix2D.TranslationToRef(pos.x + this._marginOffset.x, pos.y + this._marginOffset.y, t0);
                    t2.multiplyToRef(t0, this._localTransform);

                    //if (hasCanvasScale) {
                    //    Matrix2D.ScalingToRef(canvasScale.x, canvasScale.y, Prim2DBase._t1);
                    //    this._localTransform.multiplyToRef(Prim2DBase._t1, this._localTransform);
                    //}

                    this._localLayoutTransform = Matrix2D.Compose(globalScale, rot, pos);
                }

                this.clearPropertiesDirty(tflags);
                this._setFlags(SmartPropertyPrim.flagGlobalTransformDirty);
                this._clearFlags(SmartPropertyPrim.flagLocalTransformDirty);
                return true;
            }
            return false;
        }

        private static _transMtx = Matrix2D.Zero();

        @logMethod()
        protected updateCachedStates(recurse: boolean) {
            if (this.isDisposed) {
                C2DLogging.setPostMessage(() => "disposed");
                return;
            }

            let ownerProcessStep = this.owner._globalTransformProcessStep;
            if (this._updateCachesProcessStep === ownerProcessStep) {
                return;
            }
            this._updateCachesProcessStep = ownerProcessStep;

            this.owner.addUpdateCachedStateCounter(1);

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
                this.onPropertyChanged("actualSize", size, size, Prim2DBase.actualSizeProperty.flagId);
                this.clearPropertiesDirty(Prim2DBase.sizeProperty.flagId);
            }

            let positioningDirty = this._isFlagSet(SmartPropertyPrim.flagPositioningDirty);
            let positioningComputed = positioningDirty && !this._isFlagSet(SmartPropertyPrim.flagPositioningDirty);

            // Check for layout update
            if (this._isFlagSet(SmartPropertyPrim.flagLayoutDirty)) {
                this.owner.addUpdateLayoutCounter(1);
                this._layoutEngine.updateLayout(this);

                this._clearFlags(SmartPropertyPrim.flagLayoutDirty);
            }

            let autoContentChanged = false;
            if (this.isSizeAuto) {
                if (!this._lastAutoSizeArea) {
                    autoContentChanged = this.actualSize!==null;
                } else {
                    autoContentChanged = (!this._lastAutoSizeArea.equals(this.actualSize));
                }
            }

            // Check for positioning update
            if (!positioningComputed && (autoContentChanged || sizeDirty || this._isFlagSet(SmartPropertyPrim.flagPositioningDirty) || (this._parent && !this._parent.contentArea.equals(this._parentContentArea)))) {
                this._updatePositioning();
                if (sizeDirty) {
                    this.clearPropertiesDirty(Prim2DBase.sizeProperty.flagId);
                }
                positioningComputed = true;
            }

            if (positioningComputed && this._parent) {
                this._parentContentArea.copyFrom(this._parent.contentArea);
            }

            // Check if we must update this prim
            if (!this._globalTransform || (this._globalTransformProcessStep !== this.owner._globalTransformProcessStep) || (this._areSomeFlagsSet(SmartPropertyPrim.flagGlobalTransformDirty))) {
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
                    parentPaddingOffset = new Vector2(this._parent._paddingOffset.x, this._parent._paddingOffset.y);
                    parentPaddingChanged = !parentPaddingOffset.equals(this._parentPaddingOffset);
                }

                // Check if there are changes in the parent that will force us to update the global matrix
                let parentDirty = (this._parent != null) ? (this._parent._globalTransformStep !== this._parentTransformStep) : false;

                // Check if we have to update the globalTransform
                if (!this._globalTransform || localDirty || parentDirty || parentPaddingChanged || this._areSomeFlagsSet(SmartPropertyPrim.flagGlobalTransformDirty)) {
                    let globalTransform = this._parent ? this._parent._globalTransform : null;

                    let localTransform: Matrix2D;
                    Prim2DBase._transMtx.copyFrom(this._localTransform);
                    Prim2DBase._transMtx.m[4] += parentPaddingOffset.x;
                    Prim2DBase._transMtx.m[5] += parentPaddingOffset.y;
                    localTransform = Prim2DBase._transMtx;

                    this._globalTransform = this._parent ? localTransform.multiply(globalTransform) : localTransform.clone();

                    this._invGlobalTransform = Matrix2D.Invert(this._globalTransform);

                    this._levelBoundingInfo.dirtyWorldAABB();
                    this._boundingInfo.dirtyWorldAABB();

                    this._globalTransformStep = this.owner._globalTransformProcessStep + 1;
                    this._parentTransformStep = this._parent ? this._parent._globalTransformStep : 0;
                    this._clearFlags(SmartPropertyPrim.flagGlobalTransformDirty);
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
        private static _icZone = Vector4.Zero();
        private static _icArea = Size.Zero();
        private static _size = Size.Zero();
        private static _size2 = Size.Zero();
        private static _size3 = Size.Zero();
        private static _size4 = Size.Zero();
        private static _pv0 = Vector2.Zero();
        private static _curContentArea = Size.Zero();
        private static _piv = new Vector2(1, 1);
        private static _tbi = new BoundingInfo2D();
        private static _pv1 = Vector2.Zero();
        private static _pv2 = Vector2.Zero();

        @logMethod()
        private _updatePositioning() {
            if (!this._isFlagSet(SmartPropertyPrim.flagUsePositioning)) {
                C2DLogging.setPostMessage(() => "Not using positioning engine");

                // Just in case, if may happen and if we don't clear some computation will keep going on forever
                this._clearFlags(SmartPropertyPrim.flagPositioningDirty);
                return;
            }

            let success = true;

            // Check if re-entrance is occurring
            if (this._isFlagSet(SmartPropertyPrim.flagComputingPositioning)/* || (hasMargin && !this._layoutArea)*/) {
                if (!this._actualSize) {
                    this._actualSize = this.size.clone() || Size.Zero();
                    this._contentArea.copyFrom(this._actualSize);
                }
                if (!this._actualPosition) {
                    this._actualPosition = Vector2.Zero();
                }
                C2DLogging.setPostMessage(() => "Re entrance detected");
                return;
            }

            if (this.owner) {
                this.owner.addUpdatePositioningCounter(1);
            }

            // Set the flag to avoid re-entrance
            this._setFlags(SmartPropertyPrim.flagComputingPositioning);
            try {
                let isSizeAuto = this.isSizeAuto;
                let isVSizeAuto = this.isVerticalSizeAuto;
                let isHSizeAuto = this.isHorizontalSizeAuto;
                let ma = this._marginAlignment ? this._marginAlignment.clone() : new PrimitiveAlignment();
                let levelScale = this._scale;

                let primSize = this.size;

                // If the primitive has no size and is autoSized without margin, then set a Stretch/Stretch margin alignment for the primitive to take all the available space
                if (!this._hasMarginAlignment && (isSizeAuto && (primSize===Prim2DBase.nullSize || (primSize===this._internalSize && primSize.width===0 && primSize.height===0)))) {
                    if (isSizeAuto || this.actualSize.width == null) {
                        ma.horizontal = PrimitiveAlignment.AlignStretch;
                    }

                    if (isSizeAuto || this.actualSize.height == null) {
                        ma.vertical = PrimitiveAlignment.AlignStretch;
                    }
                }

                let transformedBSize = Prim2DBase._size3;
                let bSize = Prim2DBase._size4;
                let bi = this.boundingInfo;
                if (this._isFlagSet(SmartPropertyPrim.flagBoundingInfoDirty)) {
                    success = false;
                }
                let tbi = Prim2DBase._tbi;
                bi.transformToRef(Matrix2D.Rotation(this.rotation), tbi);
                tbi.sizeToRef(transformedBSize);
                bi.sizeToRef(bSize);
                bi.extent.subtractToRef(bi.center, Prim2DBase._pv1);
                tbi.center.subtractToRef(tbi.extent, Prim2DBase._pv2);
                let transbi = Prim2DBase._pv2.add(Prim2DBase._pv1);
                let setSize = false;

                let hasMargin = (this._margin !== null && !this._margin.isDefault) || (ma !== null && !ma.isDefault);
                let primNewSize: Size = Prim2DBase._size;
                let hasH = false;
                let hasV = false;
                //let paddingApplied = false;
                let hasPadding = this._hasPadding;

                // Compute the size
                // The size is the size of the prim or the computed one if there's a marginAlignment of Stretch
                if (hasMargin) {
                    let layoutArea = this.layoutArea;

                    if (layoutArea /*&& layoutArea.width >= size.width */&& ma.horizontal === PrimitiveAlignment.AlignStretch) {
                        this.margin.computeWithAlignment(layoutArea, primSize, ma, levelScale, this._marginOffset, primNewSize, false, PrimitiveThickness.ComputeH);
                        hasH = true;
                        setSize = true;
                    }

                    if (layoutArea /*&& layoutArea.height >= size.height */&& ma.vertical === PrimitiveAlignment.AlignStretch) {
                        this.margin.computeWithAlignment(layoutArea, primSize, ma, levelScale, this._marginOffset, primNewSize, false, PrimitiveThickness.ComputeV);
                        hasV = true;
                        setSize = true;
                    }
                }

                if (!hasH) {
                    // If the Horizontal size is Auto, we have to compute it from its content and padding
                    if (isHSizeAuto) {
                        primNewSize.width = bSize.width;
                        setSize = true;
                    } else {
                        primNewSize.width = primSize.width;
                    }
                }

                if (!hasV) {
                    // If the Vertical size is Auto, we have to compute it from its content and padding
                    if (isVSizeAuto) {
                        primNewSize.height = bSize.height;
                        setSize = true;
                    } else {
                        primNewSize.height = primSize.height;
                    }
                }

                Prim2DBase._curContentArea.copyFrom(this._contentArea);

                if (hasPadding) {
                    let area = Prim2DBase._icArea;
                    let zone = Prim2DBase._icZone;

                    this._getInitialContentAreaToRef(primNewSize, zone, area);
                    area.width = Math.max(0, area.width);
                    area.height = Math.max(0, area.height);

                    this.padding.compute(area, this._paddingOffset, Prim2DBase._size2);

                    if (!isHSizeAuto) {
                        this._paddingOffset.x += zone.x;
                        this._paddingOffset.z -= zone.z;
                        this._contentArea.width = Prim2DBase._size2.width;
                    }

                    if (!isVSizeAuto) {
                        this._paddingOffset.y += zone.y;
                        this._paddingOffset.w -= zone.w;
                        this._contentArea.height = Prim2DBase._size2.height;
                    }
                } else {
                    this._contentArea.copyFrom(primNewSize);
                }

                if (!Prim2DBase._curContentArea.equals(this._contentArea)) {
                    this._setLayoutDirty();
                }

                // Finally we apply margin to determine the position
                if (hasMargin) {
                    let layoutArea = this.layoutArea;
                    let mo = this._marginOffset;
                    let margin = this.margin;

                    // We compute margin only if the layoutArea is "real": a valid object with dimensions greater than 0
                    //  otherwise sometimes this code would be triggered with and invalid layoutArea, resulting to an invalid positioning
                    // So we make sure with compute alignment only if the layoutArea is good
                    if (layoutArea && layoutArea.width > 0 && layoutArea.height > 0) {
                        margin.computeWithAlignment(layoutArea, transformedBSize, ma, levelScale, mo, Prim2DBase._size2);
                    } else {
                        mo.copyFromFloats(0, 0, 0, 0);
                    }

                    let tbi = Prim2DBase._tpsBB;
                    tbi.copyFrom(bi);
                    let minmax = Prim2DBase._bMinMax;
                    tbi.minMaxToRef(minmax);
                    minmax.z += margin.leftPixels + margin.rightPixels;
                    minmax.w += margin.topPixels + margin.bottomPixels;
                    BoundingInfo2D.CreateFromMinMaxToRef(minmax.x, minmax.z, minmax.y, minmax.w, tbi);

                    // Check if the layoutBoundingInfo changed
                    let changed = false;
                    if (!this._layoutBoundingInfo) {
                        this._layoutBoundingInfo = tbi.clone();
                        changed = true;
                    } else if (!this._layoutBoundingInfo.equals(tbi)) {
                        this._layoutBoundingInfo.copyFrom(tbi);
                        changed = true;
                    }

                    if (changed) {
                        let p = this._parent;
                        while (p) {
                            if (p.isSizedByContent) {
                                p._setFlags(SmartPropertyPrim.flagLayoutBoundingInfoDirty);
                                p.onPrimitivePropertyDirty(Prim2DBase.actualSizeProperty.flagId);
                            } else {
                                break;
                            }
                            p = p._parent;
                        }
                        this.onPrimitivePropertyDirty(Prim2DBase.actualSizeProperty.flagId);
                    }

                }

                let lap = this.layoutAreaPos;
                this._marginOffset.x -= transbi.x * levelScale.x;
                this._marginOffset.y -= transbi.y * levelScale.y;
                this.actualPosition = new Vector2(this._marginOffset.x + (lap ? lap.x : 0), this._marginOffset.y + (lap ? lap.y : 0));
//                if (setSize) {
                    this.actualSize = primNewSize.clone();
//                }
                this._setFlags(SmartPropertyPrim.flagLocalTransformDirty);

                if (isSizeAuto) {
                    this._lastAutoSizeArea = this.actualSize;
                }

                if (this.displayDebugAreas) {
                    this._updateDebugArea();
                }
            } finally {
                C2DLogging.setPostMessage(() => "Succeeded");
                this._clearFlags(SmartPropertyPrim.flagComputingPositioning);

                // Remove dirty flag
                if (success) {
                    this._clearFlags(SmartPropertyPrim.flagPositioningDirty);
                }
            }
        }

        /**
         * Get the content are of this primitive, this area is computed the primitive size and using the padding property.
         * Children of this primitive will be positioned relative to the bottom/left corner of this area.
         */
        public get contentArea(): Size {
            if (this._isFlagSet(SmartPropertyPrim.flagUsePositioning)) {
                if (this._isFlagSet(SmartPropertyPrim.flagPositioningDirty)) {
                    this._updatePositioning();
                }
                return this._contentArea;
            } else {
                return this.size;
            }
        }

        public _patchHierarchy(owner: Canvas2D) {
            if (this._owner == null) {
                this._owner = owner;
                this.onSetOwner();
                this._setFlags(SmartPropertyPrim.flagLayoutBoundingInfoDirty);
            }

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
                    this._setFlags(SmartPropertyPrim.flagPrimInDirtyList);
                    list.push(this);
                }
            }

            // Recurse
            for (let child of this._children) {
                child._hierarchyDepth = this._hierarchyDepth + 1;
                child._patchHierarchy(owner);
            }
        }

        protected onSetOwner() {

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
         * @param initialContentPosition the position of the initial content area to compute, a valid object is passed, you have to set its properties. PLEASE ROUND the values, we're talking about pixels and fraction of them is not a good thing! x, y, z, w area left, bottom, right, top
         * @param initialContentArea the size of the initial content area to compute, a valid object is passed, you have to set its properties. PLEASE ROUND the values, we're talking about pixels and fraction of them is not a good thing!
         */
        protected _getInitialContentAreaToRef(primSize: Size, initialContentPosition: Vector4, initialContentArea: Size) {
            initialContentArea.copyFrom(primSize);
            initialContentPosition.x = initialContentPosition.y = initialContentPosition.z = initialContentPosition.w = 0;
        }

        /**
         * This method is used to calculate the new size of the primitive based on the content which must stay the same
         * Check the Rectangle2D implementation for a concrete application.
         * @param primSize the current size of the primitive
         * @param newPrimSize the new size of the primitive. PLEASE ROUND THE values, we're talking about pixels and fraction of them are not our friends!
         */
        protected _getActualSizeFromContentToRef(primSize: Size, paddingOffset: Vector4, newPrimSize: Size) {
            newPrimSize.copyFrom(primSize);
        }

        /**
         * Get/set the layout data to use for this primitive.
         */
        public get layoutData(): ILayoutData {
            return this._layoutData;
        }

        public set layoutData(value: ILayoutData) {
            if (this._layoutData === value) {
                return;
            }

            this._layoutData = value;
        }

        private   _owner: Canvas2D;
        private   _parent: Prim2DBase;
        private   _actionManager: ActionManager;
        protected _children: Array<Prim2DBase>;
        private   _renderGroup: Group2D;
        protected _hierarchyDepth: number;
        protected _zOrder: number;
        private   _manualZOrder: number;
        protected _zMax: number;
        private   _firstZDirtyIndex: number;
        private   _primLinearPosition: number;
        private   _margin: PrimitiveThickness;
        private   _padding: PrimitiveThickness;
        private   _marginAlignment: PrimitiveAlignment;
        public    _pointerEventObservable: Observable<PrimitivePointerInfo>;
        private   _actualZOrderChangedObservable: Observable<number>;
        private   _id: string;
        private   _position: Vector2;
        private   _actualPosition: Vector2;
        protected _size: Size;
        protected _actualSize: Size;
        private   _internalSize: Size;
        protected _minSize: Size;
        protected _maxSize: Size;
        protected _desiredSize: Size;
        private   _layoutEngine: LayoutEngineBase;
        private   _marginOffset: Vector4;
        private   _paddingOffset: Vector4;
        private   _parentPaddingOffset: Vector2;
        private   _parentContentArea: Size;
        private   _lastAutoSizeArea: Size;
        private   _layoutAreaPos: Vector2;
        private   _layoutArea: Size;
        private   _layoutData: ILayoutData;
        private   _contentArea: Size;
        private   _rotation: number;
        private   _scale: Vector2;
        protected _postScale: Vector2;
        private   _origin: Vector2;
        protected _opacity: number;
        private   _actualOpacity: number;
        private   _actualScale : Vector2;
        private   _displayDebugAreas: boolean;
        private   _debugAreaGroup: Group2D;
        private   _actorInfo: ActorInfoBase;

        // Stores the step of the parent for which the current global transform was computed
        // If the parent has a new step, it means this prim's global transform must be updated
        protected _parentTransformStep: number;

        // Stores the step corresponding of the global transform for this prim
        // If a child prim has an older _parentTransformStep it means the child's transform should be updated
        protected _globalTransformStep: number;

        // Stores the previous
        protected _globalTransformProcessStep: number;
        protected _prepareProcessStep: number;
        protected _updateCachesProcessStep: number;
        protected _localTransform: Matrix2D;
        protected _localLayoutTransform: Matrix2D;
        protected _globalTransform: Matrix2D;
        protected _invGlobalTransform: Matrix2D;

        // Intersection related data
        protected _primTriArrayDirty: boolean;
        protected _primTriArray: Tri2DArray;
    }

}