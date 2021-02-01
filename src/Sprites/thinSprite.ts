import { IVector3Like, IColor4Like } from "../Maths/math.like";
import { Nullable } from "../types";

/**
 * ThinSprite Class used to represent a thin sprite
 * This is the base class for sprites but can also directly be used with ThinEngine
 * @see https://doc.babylonjs.com/babylon101/sprites
 */
export class ThinSprite {
    /** Gets or sets the cell index in the sprite sheet */
    public cellIndex: number;
    /** Gets or sets the cell reference in the sprite sheet, uses sprite's filename when added to sprite sheet */
    public cellRef: string;
    /** Gets or sets the current world position */
    public position: IVector3Like;
    /** Gets or sets the main color */
    public color: IColor4Like;
    /** Gets or sets the width */
    public width = 1.0;
    /** Gets or sets the height */
    public height = 1.0;
    /** Gets or sets rotation angle */
    public angle = 0;
    /** Gets or sets a boolean indicating if UV coordinates should be inverted in U axis */
    public invertU = false;
    /** Gets or sets a boolean indicating if UV coordinates should be inverted in B axis */
    public invertV = false;
    /** Gets or sets a boolean indicating if the sprite is visible (renderable). Default is true */
    public isVisible = true;

    /**
     * Returns a boolean indicating if the animation is started
     */
    public get animationStarted() {
        return this._animationStarted;
    }

    /** Gets the initial key for the animation (setting it will restart the animation)  */
    public get fromIndex() {
        return this._fromIndex;
    }

    /** Gets or sets the end key for the animation (setting it will restart the animation)  */
    public get toIndex() {
        return this._toIndex;
    }

    /** Gets or sets a boolean indicating if the animation is looping (setting it will restart the animation)  */
    public get loopAnimation() {
        return this._loopAnimation;
    }

    /** Gets or sets the delay between cell changes (setting it will restart the animation)  */
    public get delay() {
        return Math.max(this._delay, 1);
    }

    /** @hidden */
    public _xOffset: number;
    /** @hidden */
    public _yOffset: number;
    /** @hidden */
    public _xSize: number;
    /** @hidden */
    public _ySize: number;

    private _animationStarted = false;
    protected _loopAnimation = false;
    protected _fromIndex = 0;
    protected _toIndex = 0;
    protected _delay = 0;
    private _direction = 1;
    private _time = 0;
    private _onBaseAnimationEnd: Nullable<() => void> = null;

    /**
     * Creates a new Thin Sprite
     */
    constructor() {
        this.position = { x: 1.0, y: 1.0, z: 1.0 };
        this.color = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
    }

    /**
     * Starts an animation
     * @param from defines the initial key
     * @param to defines the end key
     * @param loop defines if the animation must loop
     * @param delay defines the start delay (in ms)
     * @param onAnimationEnd defines a callback for when the animation ends
     */
    public playAnimation(from: number, to: number, loop: boolean, delay: number, onAnimationEnd: Nullable<() => void>): void {
        this._fromIndex = from;
        this._toIndex = to;
        this._loopAnimation = loop;
        this._delay = delay || 1;
        this._animationStarted = true;
        this._onBaseAnimationEnd = onAnimationEnd;

        if (from < to) {
            this._direction = 1;
        } else {
            this._direction = -1;
            this._toIndex = from;
            this._fromIndex = to;
        }

        this.cellIndex = from;
        this._time = 0;
    }

    /** Stops current animation (if any) */
    public stopAnimation(): void {
        this._animationStarted = false;
    }

    /** @hidden */
    public _animate(deltaTime: number): void {
        if (!this._animationStarted) {
            return;
        }

        this._time += deltaTime;
        if (this._time > this._delay) {
            this._time = this._time % this._delay;
            this.cellIndex += this._direction;
            if (this._direction > 0 && this.cellIndex > this._toIndex || this._direction < 0 && this.cellIndex < this._fromIndex) {
                if (this._loopAnimation) {
                    this.cellIndex = this._direction > 0 ? this._fromIndex : this._toIndex;
                } else {
                    this.cellIndex = this._toIndex;
                    this._animationStarted = false;
                    if (this._onBaseAnimationEnd) {
                        this._onBaseAnimationEnd();
                    }
                }
            }
        }
    }
}
