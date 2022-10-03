import type { Nullable } from "../types";
import { Vector3, Vector2 } from "../Maths/math.vector";
import { StringDictionary } from "./stringDictionary";

// Mainly based on these 2 articles :
// Creating an universal virtual touch joystick working for all Touch models thanks to Hand.JS : http://blogs.msdn.com/b/davrous/archive/2013/02/22/creating-an-universal-virtual-touch-joystick-working-for-all-touch-models-thanks-to-hand-js.aspx
// & on Seb Lee-Delisle original work: http://seb.ly/2011/04/multi-touch-game-controller-in-javascripthtml5-for-ipad/

/**
 * Defines the potential axis of a Joystick
 */
export enum JoystickAxis {
    /** X axis */
    X,
    /** Y axis */
    Y,
    /** Z axis */
    Z,
}

/**
 * Represents the different customization options available
 * for VirtualJoystick
 */
interface VirtualJoystickCustomizations {
    /**
     * Size of the joystick's puck
     */
    puckSize: number;
    /**
     * Size of the joystick's container
     */
    containerSize: number;
    /**
     * Color of the joystick && puck
     */
    color: string;
    /**
     * Image URL for the joystick's puck
     */
    puckImage?: string;
    /**
     * Image URL for the joystick's container
     */
    containerImage?: string;
    /**
     * Defines the unmoving position of the joystick container
     */
    position?: { x: number; y: number };
    /**
     * Defines whether or not the joystick container is always visible
     */
    alwaysVisible: boolean;
    /**
     * Defines whether or not to limit the movement of the puck to the joystick's container
     */
    limitToContainer: boolean;
}

/**
 * Class used to define virtual joystick (used in touch mode)
 */
export class VirtualJoystick {
    /**
     * Gets or sets a boolean indicating that left and right values must be inverted
     */
    public reverseLeftRight: boolean;
    /**
     * Gets or sets a boolean indicating that up and down values must be inverted
     */
    public reverseUpDown: boolean;
    /**
     * Gets the offset value for the position (ie. the change of the position value)
     */
    public deltaPosition: Vector3;
    /**
     * Gets a boolean indicating if the virtual joystick was pressed
     */
    public pressed: boolean;
    /**
     * Canvas the virtual joystick will render onto, default z-index of this is 5
     */
    public static Canvas: Nullable<HTMLCanvasElement>;

    /**
     * boolean indicating whether or not the joystick's puck's movement should be limited to the joystick's container area
     */
    public limitToContainer: boolean;

    // Used to draw the virtual joystick inside a 2D canvas on top of the WebGL rendering canvas
    private static _GlobalJoystickIndex: number = 0;
    private static _AlwaysVisibleSticks: number = 0;
    private static _VJCanvasContext: CanvasRenderingContext2D;
    private static _VJCanvasWidth: number;
    private static _VJCanvasHeight: number;
    private static _HalfWidth: number;
    private static _GetDefaultOptions(): VirtualJoystickCustomizations {
        return {
            puckSize: 40,
            containerSize: 60,
            color: "cyan",
            puckImage: undefined,
            containerImage: undefined,
            position: undefined,
            alwaysVisible: false,
            limitToContainer: false,
        };
    }

    private _action: () => any;
    private _axisTargetedByLeftAndRight: JoystickAxis;
    private _axisTargetedByUpAndDown: JoystickAxis;
    private _joystickSensibility: number;
    private _inversedSensibility: number;
    private _joystickPointerId: number;
    private _joystickColor: string;
    private _joystickPointerPos: Vector2;
    private _joystickPreviousPointerPos: Vector2;
    private _joystickPointerStartPos: Vector2;
    private _deltaJoystickVector: Vector2;
    private _leftJoystick: boolean;
    private _touches: StringDictionary<{ x: number; y: number; prevX: number; prevY: number } | PointerEvent>;
    private _joystickPosition: Nullable<Vector2>;
    private _alwaysVisible: boolean;
    private _puckImage: HTMLImageElement;
    private _containerImage: HTMLImageElement;

    // size properties
    private _joystickPuckSize: number;
    private _joystickContainerSize: number;
    private _clearPuckSize: number;
    private _clearContainerSize: number;
    private _clearPuckSizeOffset: number;
    private _clearContainerSizeOffset: number;

    private _onPointerDownHandlerRef: (e: PointerEvent) => any;
    private _onPointerMoveHandlerRef: (e: PointerEvent) => any;
    private _onPointerUpHandlerRef: (e: PointerEvent) => any;
    private _onResize: (e: any) => any;

    /**
     * Creates a new virtual joystick
     * @param leftJoystick defines that the joystick is for left hand (false by default)
     * @param customizations Defines the options we want to customize the VirtualJoystick
     */
    constructor(leftJoystick?: boolean, customizations?: Partial<VirtualJoystickCustomizations>) {
        const options = {
            ...VirtualJoystick._GetDefaultOptions(),
            ...customizations,
        };

        if (leftJoystick) {
            this._leftJoystick = true;
        } else {
            this._leftJoystick = false;
        }

        VirtualJoystick._GlobalJoystickIndex++;

        // By default left & right arrow keys are moving the X
        // and up & down keys are moving the Y
        this._axisTargetedByLeftAndRight = JoystickAxis.X;
        this._axisTargetedByUpAndDown = JoystickAxis.Y;

        this.reverseLeftRight = false;
        this.reverseUpDown = false;

        // collections of pointers
        this._touches = new StringDictionary<{ x: number; y: number; prevX: number; prevY: number } | PointerEvent>();
        this.deltaPosition = Vector3.Zero();

        this._joystickSensibility = 25;
        this._inversedSensibility = 1 / (this._joystickSensibility / 1000);

        this._onResize = () => {
            VirtualJoystick._VJCanvasWidth = window.innerWidth;
            VirtualJoystick._VJCanvasHeight = window.innerHeight;
            if (VirtualJoystick.Canvas) {
                VirtualJoystick.Canvas.width = VirtualJoystick._VJCanvasWidth;
                VirtualJoystick.Canvas.height = VirtualJoystick._VJCanvasHeight;
            }
            VirtualJoystick._HalfWidth = VirtualJoystick._VJCanvasWidth / 2;
        };

        // injecting a canvas element on top of the canvas 3D game
        if (!VirtualJoystick.Canvas) {
            window.addEventListener("resize", this._onResize, false);
            VirtualJoystick.Canvas = document.createElement("canvas");
            VirtualJoystick._VJCanvasWidth = window.innerWidth;
            VirtualJoystick._VJCanvasHeight = window.innerHeight;
            VirtualJoystick.Canvas.width = window.innerWidth;
            VirtualJoystick.Canvas.height = window.innerHeight;
            VirtualJoystick.Canvas.style.width = "100%";
            VirtualJoystick.Canvas.style.height = "100%";
            VirtualJoystick.Canvas.style.position = "absolute";
            VirtualJoystick.Canvas.style.backgroundColor = "transparent";
            VirtualJoystick.Canvas.style.top = "0px";
            VirtualJoystick.Canvas.style.left = "0px";
            VirtualJoystick.Canvas.style.zIndex = "5";
            VirtualJoystick.Canvas.style.touchAction = "none"; // fix https://forum.babylonjs.com/t/virtualjoystick-needs-to-set-style-touch-action-none-explicitly/9562
            // Support for jQuery PEP polyfill
            VirtualJoystick.Canvas.setAttribute("touch-action", "none");
            const context = VirtualJoystick.Canvas.getContext("2d");

            if (!context) {
                throw new Error("Unable to create canvas for virtual joystick");
            }

            VirtualJoystick._VJCanvasContext = context;
            VirtualJoystick._VJCanvasContext.strokeStyle = "#ffffff";
            VirtualJoystick._VJCanvasContext.lineWidth = 2;
            document.body.appendChild(VirtualJoystick.Canvas);
        }
        VirtualJoystick._HalfWidth = VirtualJoystick.Canvas.width / 2;
        this.pressed = false;
        this.limitToContainer = options.limitToContainer;

        // default joystick color
        this._joystickColor = options.color;

        // default joystick size
        this.containerSize = options.containerSize;
        this.puckSize = options.puckSize;

        if (options.position) {
            this.setPosition(options.position.x, options.position.y);
        }
        if (options.puckImage) {
            this.setPuckImage(options.puckImage);
        }
        if (options.containerImage) {
            this.setContainerImage(options.containerImage);
        }
        if (options.alwaysVisible) {
            VirtualJoystick._AlwaysVisibleSticks++;
        }

        // must come after position potentially set
        this.alwaysVisible = options.alwaysVisible;

        this._joystickPointerId = -1;
        // current joystick position
        this._joystickPointerPos = new Vector2(0, 0);
        this._joystickPreviousPointerPos = new Vector2(0, 0);
        // origin joystick position
        this._joystickPointerStartPos = new Vector2(0, 0);
        this._deltaJoystickVector = new Vector2(0, 0);

        this._onPointerDownHandlerRef = (evt) => {
            this._onPointerDown(evt);
        };
        this._onPointerMoveHandlerRef = (evt) => {
            this._onPointerMove(evt);
        };
        this._onPointerUpHandlerRef = (evt) => {
            this._onPointerUp(evt);
        };

        VirtualJoystick.Canvas.addEventListener("pointerdown", this._onPointerDownHandlerRef, false);
        VirtualJoystick.Canvas.addEventListener("pointermove", this._onPointerMoveHandlerRef, false);
        VirtualJoystick.Canvas.addEventListener("pointerup", this._onPointerUpHandlerRef, false);
        VirtualJoystick.Canvas.addEventListener("pointerout", this._onPointerUpHandlerRef, false);
        VirtualJoystick.Canvas.addEventListener(
            "contextmenu",
            (evt) => {
                evt.preventDefault(); // Disables system menu
            },
            false
        );
        requestAnimationFrame(() => {
            this._drawVirtualJoystick();
        });
    }

    /**
     * Defines joystick sensibility (ie. the ratio between a physical move and virtual joystick position change)
     * @param newJoystickSensibility defines the new sensibility
     */
    public setJoystickSensibility(newJoystickSensibility: number) {
        this._joystickSensibility = newJoystickSensibility;
        this._inversedSensibility = 1 / (this._joystickSensibility / 1000);
    }

    private _onPointerDown(e: PointerEvent) {
        let positionOnScreenCondition: boolean;

        e.preventDefault();

        if (this._leftJoystick === true) {
            positionOnScreenCondition = e.clientX < VirtualJoystick._HalfWidth;
        } else {
            positionOnScreenCondition = e.clientX > VirtualJoystick._HalfWidth;
        }

        if (positionOnScreenCondition && this._joystickPointerId < 0) {
            // First contact will be dedicated to the virtual joystick
            this._joystickPointerId = e.pointerId;

            if (this._joystickPosition) {
                this._joystickPointerStartPos = this._joystickPosition.clone();
                this._joystickPointerPos = this._joystickPosition.clone();
                this._joystickPreviousPointerPos = this._joystickPosition.clone();

                // in case the user only clicks down && doesn't move:
                // this ensures the delta is properly set
                this._onPointerMove(e);
            } else {
                this._joystickPointerStartPos.x = e.clientX;
                this._joystickPointerStartPos.y = e.clientY;
                this._joystickPointerPos = this._joystickPointerStartPos.clone();
                this._joystickPreviousPointerPos = this._joystickPointerStartPos.clone();
            }

            this._deltaJoystickVector.x = 0;
            this._deltaJoystickVector.y = 0;
            this.pressed = true;
            this._touches.add(e.pointerId.toString(), e);
        } else {
            // You can only trigger the action buttons with a joystick declared
            if (VirtualJoystick._GlobalJoystickIndex < 2 && this._action) {
                this._action();
                this._touches.add(e.pointerId.toString(), { x: e.clientX, y: e.clientY, prevX: e.clientX, prevY: e.clientY });
            }
        }
    }

    private _onPointerMove(e: PointerEvent) {
        // If the current pointer is the one associated to the joystick (first touch contact)
        if (this._joystickPointerId == e.pointerId) {
            // limit to container if need be
            if (this.limitToContainer) {
                const vector = new Vector2(e.clientX - this._joystickPointerStartPos.x, e.clientY - this._joystickPointerStartPos.y);
                const distance = vector.length();

                if (distance > this.containerSize) {
                    vector.scaleInPlace(this.containerSize / distance);
                }

                this._joystickPointerPos.x = this._joystickPointerStartPos.x + vector.x;
                this._joystickPointerPos.y = this._joystickPointerStartPos.y + vector.y;
            } else {
                this._joystickPointerPos.x = e.clientX;
                this._joystickPointerPos.y = e.clientY;
            }

            // create delta vector
            this._deltaJoystickVector = this._joystickPointerPos.clone();
            this._deltaJoystickVector = this._deltaJoystickVector.subtract(this._joystickPointerStartPos);

            // if a joystick is always visible, there will be clipping issues if
            // you drag the puck from one over the container of the other
            if (0 < VirtualJoystick._AlwaysVisibleSticks) {
                if (this._leftJoystick) {
                    this._joystickPointerPos.x = Math.min(VirtualJoystick._HalfWidth, this._joystickPointerPos.x);
                } else {
                    this._joystickPointerPos.x = Math.max(VirtualJoystick._HalfWidth, this._joystickPointerPos.x);
                }
            }

            const directionLeftRight = this.reverseLeftRight ? -1 : 1;
            const deltaJoystickX = (directionLeftRight * this._deltaJoystickVector.x) / this._inversedSensibility;
            switch (this._axisTargetedByLeftAndRight) {
                case JoystickAxis.X:
                    this.deltaPosition.x = Math.min(1, Math.max(-1, deltaJoystickX));
                    break;
                case JoystickAxis.Y:
                    this.deltaPosition.y = Math.min(1, Math.max(-1, deltaJoystickX));
                    break;
                case JoystickAxis.Z:
                    this.deltaPosition.z = Math.min(1, Math.max(-1, deltaJoystickX));
                    break;
            }
            const directionUpDown = this.reverseUpDown ? 1 : -1;
            const deltaJoystickY = (directionUpDown * this._deltaJoystickVector.y) / this._inversedSensibility;
            switch (this._axisTargetedByUpAndDown) {
                case JoystickAxis.X:
                    this.deltaPosition.x = Math.min(1, Math.max(-1, deltaJoystickY));
                    break;
                case JoystickAxis.Y:
                    this.deltaPosition.y = Math.min(1, Math.max(-1, deltaJoystickY));
                    break;
                case JoystickAxis.Z:
                    this.deltaPosition.z = Math.min(1, Math.max(-1, deltaJoystickY));
                    break;
            }
        } else {
            const data = this._touches.get(e.pointerId.toString());
            if (data) {
                (data as any).x = e.clientX;
                (data as any).y = e.clientY;
            }
        }
    }

    private _onPointerUp(e: PointerEvent) {
        if (this._joystickPointerId == e.pointerId) {
            this._clearPreviousDraw();

            this._joystickPointerId = -1;
            this.pressed = false;
        } else {
            const touch = <{ x: number; y: number; prevX: number; prevY: number }>this._touches.get(e.pointerId.toString());
            if (touch) {
                VirtualJoystick._VJCanvasContext.clearRect(touch.prevX - 44, touch.prevY - 44, 88, 88);
            }
        }
        this._deltaJoystickVector.x = 0;
        this._deltaJoystickVector.y = 0;

        this._touches.remove(e.pointerId.toString());
    }

    /**
     * Change the color of the virtual joystick
     * @param newColor a string that must be a CSS color value (like "red") or the hexa value (like "#FF0000")
     */
    public setJoystickColor(newColor: string) {
        this._joystickColor = newColor;
    }

    /**
     * Size of the joystick's container
     */
    public set containerSize(newSize: number) {
        this._joystickContainerSize = newSize;
        this._clearContainerSize = ~~(this._joystickContainerSize * 2.1);
        this._clearContainerSizeOffset = ~~(this._clearContainerSize / 2);
    }
    public get containerSize() {
        return this._joystickContainerSize;
    }

    /**
     * Size of the joystick's puck
     */
    public set puckSize(newSize: number) {
        this._joystickPuckSize = newSize;
        this._clearPuckSize = ~~(this._joystickPuckSize * 2.1);
        this._clearPuckSizeOffset = ~~(this._clearPuckSize / 2);
    }
    public get puckSize() {
        return this._joystickPuckSize;
    }

    /**
     * Clears the set position of the joystick
     */
    public clearPosition() {
        this.alwaysVisible = false;

        this._joystickPosition = null;
    }

    /**
     * Defines whether or not the joystick container is always visible
     */
    public set alwaysVisible(value: boolean) {
        if (this._alwaysVisible === value) {
            return;
        }

        if (value && this._joystickPosition) {
            VirtualJoystick._AlwaysVisibleSticks++;

            this._alwaysVisible = true;
        } else {
            VirtualJoystick._AlwaysVisibleSticks--;

            this._alwaysVisible = false;
        }
    }
    public get alwaysVisible() {
        return this._alwaysVisible;
    }

    /**
     * Sets the constant position of the Joystick container
     * @param x X axis coordinate
     * @param y Y axis coordinate
     */
    public setPosition(x: number, y: number) {
        // just in case position is moved while the container is visible
        if (this._joystickPointerStartPos) {
            this._clearPreviousDraw();
        }

        this._joystickPosition = new Vector2(x, y);
    }

    /**
     * Defines a callback to call when the joystick is touched
     * @param action defines the callback
     */
    public setActionOnTouch(action: () => any) {
        this._action = action;
    }

    /**
     * Defines which axis you'd like to control for left & right
     * @param axis defines the axis to use
     */
    public setAxisForLeftRight(axis: JoystickAxis) {
        switch (axis) {
            case JoystickAxis.X:
            case JoystickAxis.Y:
            case JoystickAxis.Z:
                this._axisTargetedByLeftAndRight = axis;
                break;
            default:
                this._axisTargetedByLeftAndRight = JoystickAxis.X;
                break;
        }
    }

    /**
     * Defines which axis you'd like to control for up & down
     * @param axis defines the axis to use
     */
    public setAxisForUpDown(axis: JoystickAxis) {
        switch (axis) {
            case JoystickAxis.X:
            case JoystickAxis.Y:
            case JoystickAxis.Z:
                this._axisTargetedByUpAndDown = axis;
                break;
            default:
                this._axisTargetedByUpAndDown = JoystickAxis.Y;
                break;
        }
    }

    /**
     * Clears the canvas from the previous puck / container draw
     */
    private _clearPreviousDraw() {
        const jp = this._joystickPosition || this._joystickPointerStartPos;

        // clear container pixels
        VirtualJoystick._VJCanvasContext.clearRect(
            jp.x - this._clearContainerSizeOffset,
            jp.y - this._clearContainerSizeOffset,
            this._clearContainerSize,
            this._clearContainerSize
        );

        // clear puck pixels
        VirtualJoystick._VJCanvasContext.clearRect(
            this._joystickPreviousPointerPos.x - this._clearPuckSizeOffset,
            this._joystickPreviousPointerPos.y - this._clearPuckSizeOffset,
            this._clearPuckSize,
            this._clearPuckSize
        );
    }

    /**
     * Loads `urlPath` to be used for the container's image
     * @param urlPath defines the urlPath of an image to use
     */
    public setContainerImage(urlPath: string) {
        const image = new Image();
        image.src = urlPath;

        image.onload = () => (this._containerImage = image);
    }

    /**
     * Loads `urlPath` to be used for the puck's image
     * @param urlPath defines the urlPath of an image to use
     */
    public setPuckImage(urlPath: string) {
        const image = new Image();
        image.src = urlPath;

        image.onload = () => (this._puckImage = image);
    }

    /**
     * Draws the Virtual Joystick's container
     */
    private _drawContainer() {
        const jp = this._joystickPosition || this._joystickPointerStartPos;

        this._clearPreviousDraw();

        if (this._containerImage) {
            VirtualJoystick._VJCanvasContext.drawImage(this._containerImage, jp.x - this.containerSize, jp.y - this.containerSize, this.containerSize * 2, this.containerSize * 2);
        } else {
            // outer container
            VirtualJoystick._VJCanvasContext.beginPath();
            VirtualJoystick._VJCanvasContext.strokeStyle = this._joystickColor;
            VirtualJoystick._VJCanvasContext.lineWidth = 2;
            VirtualJoystick._VJCanvasContext.arc(jp.x, jp.y, this.containerSize, 0, Math.PI * 2, true);
            VirtualJoystick._VJCanvasContext.stroke();
            VirtualJoystick._VJCanvasContext.closePath();

            // inner container
            VirtualJoystick._VJCanvasContext.beginPath();
            VirtualJoystick._VJCanvasContext.lineWidth = 6;
            VirtualJoystick._VJCanvasContext.strokeStyle = this._joystickColor;
            VirtualJoystick._VJCanvasContext.arc(jp.x, jp.y, this.puckSize, 0, Math.PI * 2, true);
            VirtualJoystick._VJCanvasContext.stroke();
            VirtualJoystick._VJCanvasContext.closePath();
        }
    }

    /**
     * Draws the Virtual Joystick's puck
     */
    private _drawPuck() {
        if (this._puckImage) {
            VirtualJoystick._VJCanvasContext.drawImage(
                this._puckImage,
                this._joystickPointerPos.x - this.puckSize,
                this._joystickPointerPos.y - this.puckSize,
                this.puckSize * 2,
                this.puckSize * 2
            );
        } else {
            VirtualJoystick._VJCanvasContext.beginPath();
            VirtualJoystick._VJCanvasContext.strokeStyle = this._joystickColor;
            VirtualJoystick._VJCanvasContext.lineWidth = 2;
            VirtualJoystick._VJCanvasContext.arc(this._joystickPointerPos.x, this._joystickPointerPos.y, this.puckSize, 0, Math.PI * 2, true);
            VirtualJoystick._VJCanvasContext.stroke();
            VirtualJoystick._VJCanvasContext.closePath();
        }
    }

    private _drawVirtualJoystick() {
        if (this.alwaysVisible) {
            this._drawContainer();
        }

        if (this.pressed) {
            this._touches.forEach((key, touch) => {
                if ((<PointerEvent>touch).pointerId === this._joystickPointerId) {
                    if (!this.alwaysVisible) {
                        this._drawContainer();
                    }

                    this._drawPuck();

                    // store current pointer for next clear
                    this._joystickPreviousPointerPos = this._joystickPointerPos.clone();
                } else {
                    VirtualJoystick._VJCanvasContext.clearRect((<any>touch).prevX - 44, (<any>touch).prevY - 44, 88, 88);
                    VirtualJoystick._VJCanvasContext.beginPath();
                    VirtualJoystick._VJCanvasContext.fillStyle = "white";
                    VirtualJoystick._VJCanvasContext.beginPath();
                    VirtualJoystick._VJCanvasContext.strokeStyle = "red";
                    VirtualJoystick._VJCanvasContext.lineWidth = 6;
                    VirtualJoystick._VJCanvasContext.arc(touch.x, touch.y, 40, 0, Math.PI * 2, true);
                    VirtualJoystick._VJCanvasContext.stroke();
                    VirtualJoystick._VJCanvasContext.closePath();
                    (<any>touch).prevX = touch.x;
                    (<any>touch).prevY = touch.y;
                }
            });
        }
        requestAnimationFrame(() => {
            this._drawVirtualJoystick();
        });
    }

    /**
     * Release internal HTML canvas
     */
    public releaseCanvas() {
        if (VirtualJoystick.Canvas) {
            VirtualJoystick.Canvas.removeEventListener("pointerdown", this._onPointerDownHandlerRef);
            VirtualJoystick.Canvas.removeEventListener("pointermove", this._onPointerMoveHandlerRef);
            VirtualJoystick.Canvas.removeEventListener("pointerup", this._onPointerUpHandlerRef);
            VirtualJoystick.Canvas.removeEventListener("pointerout", this._onPointerUpHandlerRef);
            window.removeEventListener("resize", this._onResize);
            document.body.removeChild(VirtualJoystick.Canvas);
            VirtualJoystick.Canvas = null;
        }
    }
}
