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

        private static _renderModeOpaque:      number = 1;
        private static _renderModeAlphaTest:   number = 2;
        private static _renderModeTransparent: number = 3;

        private _renderMode: number;
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

    export class PrimitiveAlignment {
        constructor(changeCallback: () => void) {
            this._changedCallback = changeCallback;
            this._horizontal = PrimitiveAlignment.AlignLeft;
            this._vertical = PrimitiveAlignment.AlignTop;
        }

        public static get AlignLeft():    number { return PrimitiveAlignment._AlignLeft;   }
        public static get AlignTop():     number { return PrimitiveAlignment._AlignTop;    }
        public static get AlignRight():   number { return PrimitiveAlignment._AlignRight;  }
        public static get AlignBottom():  number { return PrimitiveAlignment._AlignBottom; }
        public static get AlignCenter():  number { return PrimitiveAlignment._AlignCenter; }
        public static get AlignStretch(): number { return PrimitiveAlignment._AlignStretch;}

        private static _AlignLeft    = 1;
        private static _AlignTop     = 1;   // Same as left
        private static _AlignRight   = 2;
        private static _AlignBottom  = 2;   // Same as right
        private static _AlignCenter  = 3;
        private static _AlignStretch = 4;

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
    }

    /**
     * Stores information about a Primitive that was intersected
     */
    export class PrimitiveIntersectedInfo {
        constructor(public prim: Prim2DBase, public intersectionLocation: Vector2) {
            
        }
    }

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
        }

        public fromString(margin: string) {
            this._clear();

            let m = margin.trim().split(",");

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

        public fromStrings(owner: Prim2DBase, top: string, left: string, right: string, bottom: string): PrimitiveThickness {
            this._clear();

            this._setStringValue(top, 0, false);
            this._setStringValue(left, 1, false);
            this._setStringValue(right, 2, false);
            this._setStringValue(bottom, 3, false);
            this._changedCallback();
            return this;
        }

        public fromPixels(owner: Prim2DBase, top: number, left: number, right: number, bottom: number): PrimitiveThickness {
            this._clear();

            this._pixels[0] = top;
            this._pixels[1] = left;
            this._pixels[2] = right;
            this._pixels[3] = bottom;
            this._changedCallback();
            return this;
        }

        public auto(): PrimitiveThickness {
            this._clear();

            this._flags = (PrimitiveThickness.Auto << 0) | (PrimitiveThickness.Auto << 4) | (PrimitiveThickness.Auto << 8) | (PrimitiveThickness.Auto << 12);
            this._changedCallback();
            return this;
        }

        private _clear() {
            this._flags = 0;
            this._pixels[0] = null;
            this._pixels[1] = null;
            this._pixels[2] = null;
            this._pixels[3] = null;
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
                this._pixels[index] = null;
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
            value = Math.round(value*100)/100;  // 0.01 precision

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
                    return `${this._percentages[index]*100}%`;
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

        public get top(): string {
            return this._getStringValue(0);
        }

        public set top(value: string) {
            this._setStringValue(value, 0, true);
        }

        public get left(): string {
            return this._getStringValue(1);
        }

        public set left(value: string) {
            this._setStringValue(value, 1, true);
        }

        public get right(): string {
            return this._getStringValue(2);
        }

        public set right(value: string) {
            this._setStringValue(value, 2, true);
        }

        public get bottom(): string {
            return this._getStringValue(3);
        }

        public set bottom(value: string) {
            this._setStringValue(value, 3, true);
        }

        public get topPixels(): number {
            return this._pixels[0];
        }

        public set topPixels(value: number) {
            this._setPixels(value, 0, true);

        }
        public get leftPixels(): number {
            return this._pixels[1];
        }

        public set leftPixels(value: number) {
            this._setPixels(value, 1, true);

        }
        public get rightPixels(): number {
            return this._pixels[2];
        }

        public set rightPixels(value: number) {
            this._setPixels(value, 2, true);

        }
        public get bottomPixels(): number {
            return this._pixels[3];
        }

        public set bottomPixels(value: number) {
            this._setPixels(value, 3, true);

        }

        public get topPercentage(): number {
            return this._percentages[0];
        }

        public set topPercentage(value: number) {
            this._setPercentage(value, 0, true);

        }
        public get leftPercentage(): number {
            return this._percentages[1];
        }

        public set leftPercentage(value: number) {
            this._setPercentage(value, 1, true);

        }
        public get rightPercentage(): number {
            return this._percentages[2];
        }

        public set rightPercentage(value: number) {
            this._setPercentage(value, 2, true);

        }
        public get bottomPercentage(): number {
            return this._percentages[3];
        }

        public set bottomPercentage(value: number) {
            this._setPercentage(value, 3, true);

        }
        public get topMode(): number {
            return this._getType(0, false);
        }

        public get leftMode(): number {
            return this._getType(1, false);
        }

        public get rightMode(): number {
            return this._getType(2, false);
        }

        public get bottomMode(): number {
            return this._getType(3, false);
        }

        public set topMode(mode: number) {
            this._setType(0, mode);
        }

        public set leftMode(mode: number) {
            this._setType(1, mode);
        }

        public set rightMode(mode: number) {
            this._setType(2, mode);
        }

        public set bottomMode(mode: number) {
            this._setType(3, mode);
        }

        private _parentAccess: () => PrimitiveThickness;
        private _changedCallback: () => void;
        private _pixels: number[];
        private _percentages: number[];     // Percentages are in fact stored in a normalized range [0;1] with a 0.01 precision
        private _flags: number;

        public static Auto       = 0x1;
        public static Inherit    = 0x2;
        public static Percentage = 0x4;
        public static Pixel      = 0x8;

        private _computePixels(index: number, type: number, sourceArea: Size, emitChanged: boolean) {
            if (this._getType(index, false) !== PrimitiveThickness.Percentage) {
                return;
            }

            let pixels = ((index === 0 || index === 3) ? sourceArea.height : sourceArea.width) * this._percentages[index];
            this._pixels[index] = pixels;

            if (emitChanged) {
                this._changedCallback();
            }
        }

        public compute(sourceArea: Size, contentSize: Size, alignment: PrimitiveAlignment, dstOffset: Vector2, dstArea: Size) {
            // Fetch some data
            let topType      = this._getType(0, true);
            let leftType     = this._getType(1, true);
            let rightType    = this._getType(2, true);
            let bottomType   = this._getType(3, true);
            let hasWidth     = contentSize && (contentSize.width  != null);
            let hasHeight    = contentSize && (contentSize.height != null);
            let width        = hasWidth  ? contentSize.width  : 0;
            let height       = hasHeight ? contentSize.height : 0;
            let isTopAuto    = topType    === PrimitiveThickness.Auto;
            let isLeftAuto   = leftType   === PrimitiveThickness.Auto;
            let isRightAuto  = rightType  === PrimitiveThickness.Auto;
            let isBottomAuto = bottomType === PrimitiveThickness.Auto;

            switch (alignment.horizontal) {
                case PrimitiveAlignment.AlignLeft:
                {
                    if (isLeftAuto) {
                        dstOffset.x = 0;
                    } else {
                        this._computePixels(1, leftType, sourceArea, true);
                        dstOffset.x = this.leftPixels;
                    }
                    dstArea.width = width;
                    break;
                    
                }
                case PrimitiveAlignment.AlignRight:
                {
                    if (isRightAuto) {
                        dstOffset.x = sourceArea.width - width;
                    } else {
                        this._computePixels(2, rightType, sourceArea, true);
                        dstOffset.x = Math.round(sourceArea.width - (width + this.rightPixels));
                    }
                    dstArea.width = width;
                    break;
                }
                case PrimitiveAlignment.AlignStretch:
                {
                    if (hasWidth) {
                        let left = 0;
                        if (!isLeftAuto) {
                            this._computePixels(1, leftType, sourceArea, true);
                            left = this.leftPixels;
                        }
                        let right = 0;
                        if (!isRightAuto) {
                            this._computePixels(2, rightType, sourceArea, true);
                            right = this.rightPixels;
                        }
                        let offset = left - right;
                        dstOffset.x = Math.round(((sourceArea.width - width) / 2) + offset);
                        dstArea.width = width;
                    } else {
                        if (isLeftAuto) {
                            dstOffset.x = 0;
                        } else {
                            this._computePixels(1, leftType, sourceArea, true);
                            dstOffset.x = this.leftPixels;
                        }

                        let right = 0;
                        if (!isRightAuto) {
                            this._computePixels(2, rightType, sourceArea, true);
                            right = this.rightPixels;
                        }
                        dstArea.width = sourceArea.width - (dstOffset.x + right);
                    }
                    break;
                }
                case PrimitiveAlignment.AlignCenter:
                {
                    if (!isLeftAuto) {
                        this._computePixels(1, leftType, sourceArea, true);
                    }
                    if (!isRightAuto) {
                        this._computePixels(2, rightType, sourceArea, true);
                    }

                    let offset = (isLeftAuto ? 0 : this.leftPixels) - (isRightAuto ? 0 : this.rightPixels);
                    dstOffset.x = Math.round(((sourceArea.width-width) / 2) + offset);
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
                        this._computePixels(0, topType, sourceArea, true);
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
                        this._computePixels(3, bottomType, sourceArea, true);
                        dstOffset.y = this.bottomPixels;
                    }
                    dstArea.height = height;
                    break;
                    
                }
                case PrimitiveAlignment.AlignStretch:
                {
                    if (hasHeight) {
                        let top = 0;
                        if (!isTopAuto) {
                            this._computePixels(0, topType, sourceArea, true);
                            top = this.topPixels;
                        }
                        let bottom = 0;
                        if (!isBottomAuto) {
                            this._computePixels(3, bottomType, sourceArea, true);
                            bottom = this.bottomPixels;
                        }
                        let offset = bottom - top;
                        dstOffset.y = Math.round(((sourceArea.height - height) / 2) + offset);
                        dstArea.height = height;
                    } else {
                        if (isBottomAuto) {
                            dstOffset.y = 0;
                        } else {
                            this._computePixels(3, bottomType, sourceArea, true);
                            dstOffset.y = this.bottomPixels;
                        }

                        let top = 0;
                        if (!isTopAuto) {
                            this._computePixels(0, topType, sourceArea, true);
                            top = this.topPixels;
                        }
                        dstArea.height = sourceArea.height - (dstOffset.y + top);
                    }
                    break;
                }
                case PrimitiveAlignment.AlignCenter:
                {
                    if (!isTopAuto) {
                        this._computePixels(0, topType, sourceArea, true);
                    }
                    if (!isBottomAuto) {
                        this._computePixels(3, bottomType, sourceArea, true);
                    }

                    let offset = (isBottomAuto ? 0 : this.bottomPixels) - (isTopAuto ? 0 : this.topPixels);
                    dstOffset.y = Math.round(((sourceArea.height-height) / 2) + offset);
                    dstArea.height = height;
                    break;
                }
            }
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
        static PRIM2DBASE_PROPCOUNT: number = 15;

        protected setupPrim2DBase(owner: Canvas2D, parent: Prim2DBase, id: string, position: Vector2, origin: Vector2, isVisible: boolean, marginTop?: number | string, marginLeft?: number | string, marginRight?: number | string, marginBottom?: number | string, vAlignment?: number, hAlignment?: number) {
            if (!(this instanceof Group2D) && !(this instanceof Sprite2D && id !== null && id.indexOf("__cachedSpriteOfGroup__") === 0) && (owner.cachingStrategy === Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) && (parent === owner)) {
                throw new Error("Can't create a primitive with the canvas as direct parent when the caching strategy is TOPLEVELGROUPS. You need to create a Group below the canvas and use it as the parent for the primitive");
            }

            this.setupSmartPropertyPrim();
            this._layoutEngine = CanvasLayoutEngine.Singleton;
            this._size = Size.Zero();
            this._layoutArea = Size.Zero();
            this._paddingOffset = Vector2.Zero();
            this._paddingArea = Size.Zero();
            this._margingOffset = Vector2.Zero();
            this._parentMargingOffset = Vector2.Zero();
            this._parentContentArea = Size.Zero();
            this._contentArea = new Size(null, null);
            this._pointerEventObservable = new Observable<PrimitivePointerInfo>();
            this._setFlags(SmartPropertyPrim.flagIsPickable);
            this._siblingDepthOffset = this._hierarchyDepthOffset = 0;
            this._setFlags(SmartPropertyPrim.flagBoundingInfoDirty);
            this._boundingInfo = new BoundingInfo2D();
            this._owner = owner;
            this._parent = parent;
            this._margin = null;
            this._padding = null;
            this._id = id;
            if (parent != null) {
                this._hierarchyDepth = parent._hierarchyDepth + 1;
                this._renderGroup = <Group2D>this.parent.traverseUp(p => p instanceof Group2D && p.isRenderableGroup);
                parent.addChild(this);
            } else {
                this._hierarchyDepth = 0;
                this._renderGroup = null;
            }

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
            this.origin = origin || new Vector2(0.5, 0.5);

            if (marginTop) {
                this.margin.setTop(marginTop);
            }
            if (marginLeft) {
                this.margin.setLeft(marginLeft);
            }
            if (marginRight) {
                this.margin.setRight(marginRight);
            }
            if (marginBottom) {
                this.margin.setBottom(marginBottom);
            }

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
         * Metadata of the vAlignment property
         */
        public static paddingAlignmentProperty: Prim2DPropInfo;

        /**
         * Metadata of the hAlignment property
         */
        public static marginAlignmentProperty: Prim2DPropInfo;

        @instanceLevelProperty(1, pi => Prim2DBase.positionProperty = pi, false, true)
        /**
         * Position of the primitive, relative to its parent.
         * BEWARE: if you change only position.x or y it won't trigger a property change and you won't have the expected behavior.
         * Use this property to set a new Vector2 object, otherwise to change only the x/y use Prim2DBase.x or y properties.
         */
        public get position(): Vector2 {
            return this._position;
        }

        public set position(value: Vector2) {
            if (!this._checkPositionChange()) {
                return;
            }
            this._position = value;
        }

        /**
         * Direct access to the position.x value of the primitive
         * Use this property when you only want to change one component of the position property
         */
        public get x(): number {
            if (!this.position) {
                return null;
            }
            return this.position.x;
        }

        public set x(value: number) {
            if (!this._checkPositionChange()) {
                return;
            }
            if (!this.position) {
                this._position = Vector2.Zero();
            }

            if (this.position.x === value) {
                return;
            }

            this.position.x = value;
            this.markAsDirty("position");
        }

        /**
         * Direct access to the position.y value of the primitive
         * Use this property when you only want to change one component of the position property
         */
        public get y(): number {
            if (!this.position) {
                return null;
            }
            return this.position.y;
        }

        public set y(value: number) {
            if (!this._checkPositionChange()) {
                return;
            }
            if (!this.position) {
                this._position = Vector2.Zero();
            }

            if (this.position.y === value) {
                return;
            }

            this.position.y = value;
            this.markAsDirty("position");
        }

        /**
         * Size of the primitive or its bounding area
         * BEWARE: if you change only size.width or height it won't trigger a property change and you won't have the expected behavior.
         * Use this property to set a new Size object, otherwise to change only the width/height use Prim2DBase.width or height properties.
         */
        @dynamicLevelProperty(2, pi => Prim2DBase.sizeProperty = pi, false, true)
        public get size(): Size {
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
            this.markAsDirty("actualSize");
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
            this.markAsDirty("actualSize");
            this._positioningDirty();
        }

        @instanceLevelProperty(3, pi => Prim2DBase.rotationProperty = pi, false, true)
        /**
         * Rotation of the primitive, in radian, along the Z axis
         */
        public get rotation(): number {
            return this._rotation;
        }

        public set rotation(value: number) {
            this._rotation = value;
        }

        @instanceLevelProperty(4, pi => Prim2DBase.scaleProperty = pi, false, true)
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
         * Return the size of the primitive as it's being rendered into the target.
         * This value may be different of the size property when layout/alignment is used or specific primitive types can implement a custom logic through this property.
         * BEWARE: don't use the setter, it's for internal purpose only
         * Note to implementers: you have to override this property and declare if necessary a @xxxxInstanceLevel decorator
         */
        public get actualSize(): Size {
            return this._actualSize;
        }

        public set actualSize(value: Size) {
            if (this._actualSize.equals(value)) {
                return;
            }

            this._actualSize = value;
        }

        public get actualZOffset(): number {
            return this._zOrder || (1 - this._hierarchyDepthOffset);
        }

        @instanceLevelProperty(5, pi => Prim2DBase.originProperty = pi, false, true)
        public set origin(value: Vector2) {
            this._origin = value;
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

        @dynamicLevelProperty(6, pi => Prim2DBase.levelVisibleProperty = pi)
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

        @instanceLevelProperty(7, pi => Prim2DBase.isVisibleProperty = pi)
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

        @instanceLevelProperty(8, pi => Prim2DBase.zOrderProperty = pi)
        /**
         * You can override the default Z Order through this property, but most of the time the default behavior is acceptable
         */
        public get zOrder(): number {
            return this._zOrder;
        }

        public set zOrder(value: number) {
            this._zOrder = value;
            this.onZOrderChanged();
        }

        @dynamicLevelProperty(9, pi => Prim2DBase.marginProperty = pi)
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

        public get hasMargin(): boolean {
            return this._margin !== null;
        }

        @dynamicLevelProperty(10, pi => Prim2DBase.paddingProperty = pi)
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

        public get hasPadding(): boolean {
            return this._padding !== null;
        }

        @dynamicLevelProperty(11, pi => Prim2DBase.marginAlignmentProperty = pi)
        /**
         * You can get/set the margin alignment through this property
         */
        public get marginAlignment(): PrimitiveAlignment {
            if (!this._marginAlignment) {
                this._marginAlignment = new PrimitiveAlignment(() => this._positioningDirty());
            }
            return this._marginAlignment;
        }


        @dynamicLevelProperty(12, pi => Prim2DBase.paddingAlignmentProperty = pi)
        /**
         * You can get/set the vertical alignment through this property
         */
        public get paddingAlignment(): PrimitiveAlignment {
            if (!this._paddingAlignment) {
                this._paddingAlignment = new PrimitiveAlignment(() => this._positioningDirty());
            }
            return this._paddingAlignment;
        }

        public get layoutEngine(): LayoutEngineBase {
            if (!this._layoutEngine) {
                this._layoutEngine = new CanvasLayoutEngine();
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

        /**
         * Get the boundingInfo associated to the primitive and its children.
         * The value is supposed to be always up to date
         */
        public get boundingInfo(): BoundingInfo2D {
            if (this._isFlagSet(SmartPropertyPrim.flagBoundingInfoDirty)) {
                this._boundingInfo = this.levelBoundingInfo.clone();
                let bi = this._boundingInfo;

                var tps = new BoundingInfo2D();
                for (let curChild of this._children) {
                    curChild.boundingInfo.transformToRef(curChild.localTransform, tps);
                    bi.unionToRef(tps, bi);
                }

                this._clearFlags(SmartPropertyPrim.flagBoundingInfoDirty);
            }
            return this._boundingInfo;
        }

        /**
         * Determine if the size is automatically computed or fixed because manually specified.
         * Use getActualSize() to get the final/real size of the primitive
         * @returns true if the size is automatically computed, false if it were manually specified.
         */
        public get isSizeAuto(): boolean {
            return this.size == null;
        }

        /**
         * Determine if the position is automatically computed or fixed because manually specified.
         * Use getActualPosition() to get the final/real position of the primitive
         * @returns true if the position is automatically computed, false if it were manually specified.
         */
        public get isPositionAuto(): boolean {
            return this.position == null;
        }

        /**
         * Interaction with the primitive can be create using this Observable. See the PrimitivePointerInfo class for more information
         */
        public get pointerEventObservable(): Observable<PrimitivePointerInfo> {
            return this._pointerEventObservable;
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
            child._hierarchyDepthOffset = this._hierarchyDepthOffset + ((this._children.length + 1) * this._siblingDepthOffset);
//            console.log(`Node: ${child.id} has depth: ${child._hierarchyDepthOffset}`);
            child._siblingDepthOffset = this._siblingDepthOffset / this.owner.hierarchyLevelMaxSiblingCount;
            this._children.push(child);
        }

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
            if (this._renderGroup) {
                this._renderGroup._addPrimToDirtyList(this);
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

        protected static CheckParent(parent: Prim2DBase) {
            if (!parent) {
                throw new Error("A Primitive needs a valid Parent, it can be any kind of Primitives based types, even the Canvas (with the exception that only Group2D can be direct child of a Canvas if the cache strategy used is TOPLEVELGROUPS)");
            }
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

            this.parent._setFlags(SmartPropertyPrim.flagLayoutDirty);
        }

        private _checkPositionChange(): boolean {
            if (this.parent && this.parent.layoutEngine.isChildPositionAllowed === false) {
                console.log(`Can't manually set the position of ${this.id}, the Layout Engine of its parent doesn't allow it`);
                return false;
            }
            return true;
        }

        protected _positioningDirty() {
            if (!this.isDirty) {
                this.onPrimBecomesDirty();
            }
            this._setFlags(SmartPropertyPrim.flagPositioningDirty);
        }

        private _changeLayoutEngine(engine: LayoutEngineBase) {
            
        }

        private _updateLocalTransform(): boolean {
            let tflags = Prim2DBase.positionProperty.flagId | Prim2DBase.rotationProperty.flagId | Prim2DBase.scaleProperty.flagId;
            if (this.checkPropertiesDirty(tflags)) {
                var rot = Quaternion.RotationAxis(new Vector3(0, 0, 1), this._rotation);
                var local = Matrix.Compose(new Vector3(this._scale, this._scale, this._scale), rot, new Vector3(this._position.x, this._position.y, 0));

                this._localTransform = local;
                this.clearPropertiesDirty(tflags);
                return true;
            }
            return false;
        }

        protected updateCachedStates(recurse: boolean) {
            if (this.isDisposed) {
                return;
            }

            // Check if the parent is synced
            if (this._parent && ((this._parent._globalTransformProcessStep !== this.owner._globalTransformProcessStep) || this._parent._areSomeFlagsSet(SmartPropertyPrim.flagLayoutDirty|SmartPropertyPrim.flagPositioningDirty))) {
                this._parent.updateCachedStates(false);
            }

            // Update actualSize only if there' not positioning to recompute and the size changed
            // Otherwise positioning will take care of it.
            if (!this._isFlagSet(SmartPropertyPrim.flagLayoutDirty) && this.checkPropertiesDirty(Prim2DBase.sizeProperty.flagId)) {
                if (this.size.width != null) {
                    this.actualSize.width = this.size.width;
                }
                if (this.size.height != null) {
                    this.actualSize.height = this.size.height;
                }
                this.clearPropertiesDirty(Prim2DBase.sizeProperty.flagId);
            }

            // Check for layout update
            if (this._isFlagSet(SmartPropertyPrim.flagLayoutDirty)) {
                this._layoutEngine.updateLayout(this);

                this._clearFlags(SmartPropertyPrim.flagLayoutDirty);
            }

            // Check for positioning update
            if (this._isFlagSet(SmartPropertyPrim.flagPositioningDirty) || (this._parent && !this._parent.contentArea.equals(this._parentContentArea))) {
                this._updatePositioning();

                this._clearFlags(SmartPropertyPrim.flagPositioningDirty);

                if (this._parent) {
                    this._parentContentArea.copyFrom(this._parent.contentArea);
                }
            }

            // Check if we must update this prim
            if (this === <any>this.owner || this._globalTransformProcessStep !== this.owner._globalTransformProcessStep) {
                let curVisibleState = this.isVisible;
                this.isVisible = (!this._parent || this._parent.isVisible) && this.levelVisible;

                // Detect a change of visibility
                this._changeFlags(SmartPropertyPrim.flagVisibilityChanged, curVisibleState !== this.isVisible);

                // Get/compute the localTransform
                let localDirty = this._updateLocalTransform();

                // Check if there are changes in the parent that will force us to update the global matrix
                let parentDirty = false;
                let parentMarginOffsetChanged = false;
                let parentMarginOffset: Vector2 = null;
                if (this._parent) {
                    parentMarginOffset = this._parent._margingOffset;
                    parentDirty = this._parent._globalTransformStep !== this._parentTransformStep;
                    parentMarginOffsetChanged = !parentMarginOffset.equals(this._parentMargingOffset);
                }

                // Check if we have to update the globalTransform
                if (!this._globalTransform || localDirty || parentDirty || parentMarginOffsetChanged) {
                    let globalTransform = this._parent ? this._parent._globalTransform : null;
                    if (parentMarginOffset && (parentMarginOffset.x !== 0 || parentMarginOffset.y !== 0)) {
                        globalTransform = globalTransform.clone();
                        globalTransform.m[12] += parentMarginOffset.x;
                        globalTransform.m[13] += parentMarginOffset.y;
                    }

                    this._globalTransform = this._parent ? this._localTransform.multiply(globalTransform) : this._localTransform;
                    this._invGlobalTransform = Matrix.Invert(this._globalTransform);

                    this._globalTransformStep = this.owner._globalTransformProcessStep + 1;
                    this._parentTransformStep = this._parent ? this._parent._globalTransformStep : 0;

                    if (parentMarginOffsetChanged) {
                        this._parentMargingOffset.x = parentMarginOffset.x;
                        this._parentMargingOffset.y = parentMarginOffset.y;
                    }
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

        private static _icPos           = Vector2.Zero();
        private static _icArea          = Size.Zero();
        private static _newContent      = Size.Zero();

        private _updatePositioning() {
            // From this point we assume that the primitive layoutArea is computed and up to date.
            // We know have to :
            //  1. Determine the PaddingArea based on the padding property, which will set the size property of the primitive
            //  2. Determine the contentArea based on the primitive's initialContentArea and the margin property.

            // Auto Create PaddingArea if there's no actualSize on width&|height to allocate the whole content available to the paddingArea where the actualSize is null
            if (!this.hasPadding && (this.actualSize.width == null || this.actualSize.height == null)) {
                if (this.actualSize.width == null) {
                    this.paddingAlignment.horizontal = PrimitiveAlignment.AlignStretch;
                    this.padding.leftPixels = 0;    // Ugly, but we need to fetch the padding object for the PaddingArea computing to trigger below
                }

                if (this.actualSize.height == null) {
                    this.paddingAlignment.vertical = PrimitiveAlignment.AlignStretch;
                    this.padding.topPixels = 0;     // Same ugly thing as above
                }
            }

            // Compute the PaddingArea
            if (this.hasPadding) {
                this.padding.compute(this._layoutArea, this.size, this.paddingAlignment, this._paddingOffset, this._paddingArea);
                this.position = this._paddingOffset.clone();
                if (this.size.width != null) {
                    this.size.width = this._paddingArea.width;
                }
                if (this.size.height != null) {
                    this.size.height = this._paddingArea.height;
                }
                this.actualSize = this._paddingArea.clone();
            }

            // No Padding property, the padding area is the same as the actualSize
            else {
                this._paddingOffset.x    = 0;
                this._paddingOffset.y    = 0;
                this._paddingArea.copyFrom(this.actualSize);
            }

            if (this.hasMargin) {
                this._getInitialContentAreaToRef(this._paddingArea, Prim2DBase._icPos, Prim2DBase._icArea);
                this.margin.compute(Prim2DBase._icArea, this._contentArea, this.marginAlignment, this._margingOffset, Prim2DBase._newContent);
                this._margingOffset.x += Prim2DBase._icPos.x;
                this._margingOffset.y += Prim2DBase._icPos.y;
                this._contentArea.copyFrom(Prim2DBase._newContent);              
            } else {
                this._getInitialContentAreaToRef(this._paddingArea, Prim2DBase._icPos, Prim2DBase._icArea);
                this._margingOffset.copyFrom(Prim2DBase._icPos);
                this._contentArea.copyFrom(Prim2DBase._icArea);
            }
        }

        public get contentArea(): Size {
            // Check for positioning update
            if (this._isFlagSet(SmartPropertyPrim.flagPositioningDirty)) {
                this._updatePositioning();

                this._clearFlags(SmartPropertyPrim.flagPositioningDirty);
            }
            return this._contentArea;
        }

        /**
         * This method is used to alter the contentArea of the Primitive before margin is applied.
         * In most of the case you won't need to override this method, but it can prove some usefulness, check the Rectangle2D class for a concrete application.
         * @param primSize the current size of the primitive
         * @param initialContentPosition the position of the initial content area to compute, a valid object is passed, you have to set its properties
         * @param initialContentArea the size of the initial content area to compute, a valid object is passed, you have to set its properties
         */
        protected _getInitialContentAreaToRef(primSize: Size, initialContentPosition: Vector2, initialContentArea: Size) {
            initialContentArea.width = primSize.width;
            initialContentPosition.x = initialContentPosition.y = 0;
            initialContentArea.height = primSize.height;
        }

        private   _owner                 : Canvas2D;
        private   _parent                : Prim2DBase;
        private   _actionManager         : ActionManager;
        protected _children              : Array<Prim2DBase>;
        private   _renderGroup           : Group2D;
        private   _hierarchyDepth        : number;
        protected _hierarchyDepthOffset  : number;
        protected _siblingDepthOffset    : number;
        private   _zOrder                : number;
        private   _margin                : PrimitiveThickness;
        private   _padding               : PrimitiveThickness;
        private   _marginAlignment       : PrimitiveAlignment;
        private   _paddingAlignment      : PrimitiveAlignment;
        public    _pointerEventObservable: Observable<PrimitivePointerInfo>;
        private   _id                    : string;
        private   _position              : Vector2;
        protected _size                  : Size;
        protected _actualSize            : Size;
        protected _minSize               : Size;
        protected _maxSize               : Size;
        protected _desiredSize           : Size;
        private   _layoutEngine          : LayoutEngineBase;
        private   _paddingOffset         : Vector2;
        private   _paddingArea           : Size;
        private   _margingOffset         : Vector2;
        private   _parentMargingOffset   : Vector2;
        private   _parentContentArea     : Size;
        public    _layoutArea            : Size;
        private   _contentArea           : Size;
        private   _rotation              : number;
        private   _scale                 : number;
        private   _origin                : Vector2;

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