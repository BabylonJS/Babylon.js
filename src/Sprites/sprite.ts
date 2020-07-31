import { Vector3 } from "../Maths/math.vector";
import { Nullable } from "../types";
import { ActionManager } from "../Actions/actionManager";
import { ISpriteManager, SpriteManager } from "./spriteManager";
import { Color4 } from '../Maths/math.color';
import { Observable } from '../Misc/observable';
import { IAnimatable } from '../Animations/animatable.interface';
declare type Animation = import("../Animations/animation").Animation;

/**
 * Class used to represent a sprite
 * @see https://doc.babylonjs.com/babylon101/sprites
 */
export class Sprite implements IAnimatable {
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
    public invertU = false;
    /** Gets or sets a boolean indicating if UV coordinates should be inverted in B axis */
    public invertV = false;
    /** Gets or sets a boolean indicating that this sprite should be disposed after animation ends */
    public disposeWhenFinishedAnimating: boolean;
    /** Gets the list of attached animations */
    public animations: Nullable<Array<Animation>> = new Array<Animation>();
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

    /**
    * An event triggered when the control has been disposed
    */
   public onDisposeObservable = new Observable<Sprite>();

    private _animationStarted = false;
    private _loopAnimation = false;
    private _fromIndex = 0;
    private _toIndex = 0;
    private _delay = 0;
    private _direction = 1;
    private _manager: ISpriteManager;
    private _time = 0;
    private _onAnimationEnd: Nullable<() => void> = null;
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
     * Returns a boolean indicating if the animation is started
     */
    public get animationStarted() {
        return this._animationStarted;
    }

    /**
     * Gets or sets the unique id of the sprite
     */
    public uniqueId: number;

    /**
     * Gets the manager of this sprite
     */
    public get manager() {
        return this._manager;
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
        this.uniqueId = this._manager.scene.getUniqueId();

        this.position = Vector3.Zero();
    }

    /**
     * Returns the string "Sprite"
     * @returns "Sprite"
     */
    public getClassName(): string {
        return "Sprite";
    }

    /** Gets or sets the initial key for the animation (setting it will restart the animation)  */
    public get fromIndex() {
        return this._fromIndex;
    }

    public set fromIndex(value: number) {
        this.playAnimation(value, this._toIndex, this._loopAnimation, this._delay, this._onAnimationEnd);
    }

    /** Gets or sets the end key for the animation (setting it will restart the animation)  */
    public get toIndex() {
        return this._toIndex;
    }

    public set toIndex(value: number) {
        this.playAnimation(this._fromIndex, value, this._loopAnimation, this._delay, this._onAnimationEnd);
    }

    /** Gets or sets a boolean indicating if the animation is looping (setting it will restart the animation)  */
    public get loopAnimation() {
        return this._loopAnimation;
    }

    public set loopAnimation(value: boolean) {
        this.playAnimation(this._fromIndex, this._toIndex, value, this._delay, this._onAnimationEnd);
    }

    /** Gets or sets the delay between cell changes (setting it will restart the animation)  */
    public get delay() {
        return Math.max(this._delay, 1);
    }

    public set delay(value: number) {
        this.playAnimation(this._fromIndex, this._toIndex, this._loopAnimation, value, this._onAnimationEnd);
    }

    /**
     * Starts an animation
     * @param from defines the initial key
     * @param to defines the end key
     * @param loop defines if the animation must loop
     * @param delay defines the start delay (in ms)
     * @param onAnimationEnd defines a callback to call when animation ends
     */
    public playAnimation(from: number, to: number, loop: boolean, delay: number, onAnimationEnd: Nullable<() => void> = null): void {
        this._fromIndex = from;
        this._toIndex = to;
        this._loopAnimation = loop;
        this._delay = delay || 1;
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

        // Callback
        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();
    }

    /**
     * Serializes the sprite to a JSON object
     * @returns the JSON object
     */
    public serialize(): any {
        var serializationObject: any = {};

        serializationObject.name = this.name;
        serializationObject.position = this.position.asArray();
        serializationObject.color = this.color.asArray();
        serializationObject.width = this.width;
        serializationObject.height = this.height;
        serializationObject.angle = this.angle;
        serializationObject.cellIndex = this.cellIndex;
        serializationObject.cellRef = this.cellRef;
        serializationObject.invertU = this.invertU;
        serializationObject.invertV = this.invertV;
        serializationObject.disposeWhenFinishedAnimating = this.disposeWhenFinishedAnimating;
        serializationObject.isPickable = this.isPickable;
        serializationObject.isVisible = this.isVisible;
        serializationObject.useAlphaForPicking = this.useAlphaForPicking;

        serializationObject.animationStarted = this.animationStarted;
        serializationObject.fromIndex = this.fromIndex;
        serializationObject.toIndex = this.toIndex;
        serializationObject.loopAnimation = this.loopAnimation;
        serializationObject.delay = this.delay;

        return serializationObject;
    }

    /**
     * Parses a JSON object to create a new sprite
     * @param parsedSprite The JSON object to parse
     * @param manager defines the hosting manager
     * @returns the new sprite
     */
    public static Parse(parsedSprite: any, manager: SpriteManager): Sprite {
        var sprite = new Sprite(parsedSprite.name, manager);

        sprite.position = Vector3.FromArray(parsedSprite.position);
        sprite.color = Color4.FromArray(parsedSprite.color);
        sprite.width = parsedSprite.width;
        sprite.height = parsedSprite.height;
        sprite.angle = parsedSprite.angle;
        sprite.cellIndex = parsedSprite.cellIndex;
        sprite.cellRef = parsedSprite.cellRef;
        sprite.invertU = parsedSprite.invertU;
        sprite.invertV = parsedSprite.invertV;
        sprite.disposeWhenFinishedAnimating = parsedSprite.disposeWhenFinishedAnimating;
        sprite.isPickable = parsedSprite.isPickable;
        sprite.isVisible = parsedSprite.isVisible;
        sprite.useAlphaForPicking = parsedSprite.useAlphaForPicking;

        sprite.fromIndex = parsedSprite.fromIndex;
        sprite.toIndex = parsedSprite.toIndex;
        sprite.loopAnimation = parsedSprite.loopAnimation;
        sprite.delay = parsedSprite.delay;

        if (parsedSprite.animationStarted) {
            sprite.playAnimation(sprite.fromIndex, sprite.toIndex, sprite.loopAnimation, sprite.delay);
        }

        return sprite;
    }
}
