import { Vector3 } from "../Maths/math.vector";
import { Nullable } from "../types";
import { ActionManager } from "../Actions/actionManager";
import { ISpriteManager } from "./spriteManager";
import { Color4 } from '../Maths/math.color';

/**
 * Class used to represent a sprite
 * @see http://doc.babylonjs.com/babylon101/sprites
 */
export class Sprite {
    /** Gets or sets the current world position */
    public position: Vector3;
    /** Gets or sets the main color */
    public color = new Color4(1.0, 1.0, 1.0, 1.0);
    /** Gets or sets the width */
    public width = 1.0;
    /** Gets or sets the height */
    public height = 1.0;
    /** Gets or sets rotation angle */
    public angle = 0;
    /** Gets or sets the cell index in the sprite sheet */
    public cellIndex: number;
    /** Gets or sets the cell reference in the sprite sheet, uses sprite's filename when added to sprite sheet */
    public cellRef: string;
    /** Gets or sets a boolean indicating if UV coordinates should be inverted in U axis */
    public invertU = 0;
    /** Gets or sets a boolean indicating if UV coordinates should be inverted in B axis */
    public invertV = 0;
    /** Gets or sets a boolean indicating that this sprite should be disposed after animation ends */
    public disposeWhenFinishedAnimating: boolean;
    /** Gets the list of attached animations */
    public animations = new Array<Animation>();
    /** Gets or sets a boolean indicating if the sprite can be picked */
    public isPickable = false;
    /** Gets or sets a boolean indicating that sprite texture alpha will be used for precise picking (false by default) */
    public useAlphaForPicking = false;

    /** @hidden */
    public _xOffset: number;
    /** @hidden */
    public _yOffset: number;
    /** @hidden */
    public _xSize: number;
    /** @hidden */
    public _ySize: number;

    /**
     * Gets or sets the associated action manager
     */
    public actionManager: Nullable<ActionManager>;

    private _animationStarted = false;
    private _loopAnimation = false;
    private _fromIndex = 0;
    private _toIndex = 0;
    private _delay = 0;
    private _direction = 1;
    private _manager: ISpriteManager;
    private _time = 0;
    private _onAnimationEnd: () => void;
    /**
     * Gets or sets a boolean indicating if the sprite is visible (renderable). Default is true
     */
    public isVisible = true;

    /**
     * Gets or sets the sprite size
     */
    public get size(): number {
        return this.width;
    }

    public set size(value: number) {
        this.width = value;
        this.height = value;
    }

    /**
     * Creates a new Sprite
     * @param name defines the name
     * @param manager defines the manager
     */
    constructor(
        /** defines the name */
        public name: string,
        manager: ISpriteManager) {
        this._manager = manager;

        this._manager.sprites.push(this);

        this.position = Vector3.Zero();
    }

    /**
     * Starts an animation
     * @param from defines the initial key
     * @param to defines the end key
     * @param loop defines if the animation must loop
     * @param delay defines the start delay (in ms)
     * @param onAnimationEnd defines a callback to call when animation ends
     */
    public playAnimation(from: number, to: number, loop: boolean, delay: number, onAnimationEnd: () => void): void {
        this._fromIndex = from;
        this._toIndex = to;
        this._loopAnimation = loop;
        this._delay = delay;
        this._animationStarted = true;

        if (from < to) {
            this._direction = 1;
        } else {
            this._direction = -1;
            this._toIndex = from;
            this._fromIndex = to;
        }

        this.cellIndex = from;
        this._time = 0;

        this._onAnimationEnd = onAnimationEnd;
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
                    if (this._onAnimationEnd) {
                        this._onAnimationEnd();
                    }
                    if (this.disposeWhenFinishedAnimating) {
                        this.dispose();
                    }
                }
            }
        }
    }

    /** Release associated resources */
    public dispose(): void {
        for (var i = 0; i < this._manager.sprites.length; i++) {
            if (this._manager.sprites[i] == this) {
                this._manager.sprites.splice(i, 1);
            }
        }
    }
}
