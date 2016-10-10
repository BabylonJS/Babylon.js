module BABYLON {
    /**
     * This interface is used to implement a lockable instance pattern.
     * Classes that implements it may be locked at any time, making their content immutable from now on.
     * You also can query if a given instance is locked or not.
     * This allow instances to be shared among several 'consumers'.
     */
    export interface ILockable {
        /**
         * Query the lock state
         * @returns returns true if the object is locked and immutable, false if it's not
         */
        isLocked(): boolean;

        /**
         * A call to this method will definitely lock the instance, making its content immutable
         * @returns the previous lock state of the object. so if true is returned the object  were already locked and this method does nothing, if false is returned it means the object wasn't locked and this call locked it for good.
         */
        lock(): boolean;
    }

    /**
     * This interface defines the IBrush2D contract.
     * Classes implementing a new type of Brush2D must implement this interface
     */
    export interface IBrush2D extends ILockable {
        /**
         * Define if the brush will use transparency / alpha blending
         * @returns true if the brush use transparency
         */
        isTransparent(): boolean;

        /**
         * It is critical for each instance of a given Brush2D type to return a unique string that identifies it because the Border instance will certainly be part of the computed ModelKey for a given Primitive
         * @returns A string identifier that uniquely identify the instance
         */
        toString(): string;
    }

    /**
     * Base class implementing the ILocable interface.
     * The particularity of this class is to call the protected onLock() method when the instance is about to be locked for good.
     */
    export class LockableBase implements ILockable {
        isLocked(): boolean {
            return this._isLocked;
        }

        private _isLocked: boolean;

        lock(): boolean {
            if (this._isLocked) {
                return true;
            }

            this.onLock();
            this._isLocked = true;
            return false;
        }

        /**
         * Protected handler that will be called when the instance is about to be locked.
         */
        protected onLock() {

        }
    }

    @className("SolidColorBrush2D")
    /**
     * This class implements a Brush that will be drawn with a uniform solid color (i.e. the same color everywhere in the content where the brush is assigned to).
     */
    export class SolidColorBrush2D extends LockableBase implements IBrush2D {
        constructor(color: Color4, lock: boolean = false) {
            super();
            this._color = color;
            if (lock) {
                {
                    this.lock();
                }
            }
        }

        /**
         * Return true if the brush is transparent, false if it's totally opaque
         */
        isTransparent(): boolean {
            return this._color && this._color.a < 1.0;
        }

        /**
         * The color used by this instance to render
         * @returns the color object. Note that it's not a clone of the actual object stored in the instance so you MUST NOT modify it, otherwise unexpected behavior might occurs.
         */
        public get color(): Color4 {
            return this._color;
        }

        public set color(value: Color4) {
            if (this.isLocked()) {
                return;
            }

            this._color = value;
        }

        /**
         * Return a unique identifier of the instance, which is simply the hexadecimal representation (CSS Style) of the solid color.
         */
        public toString(): string {
            return this._color.toHexString();
        }
        private _color: Color4;
    }

    @className("GradientColorBrush2D")
    /**
     * This class implements a Gradient Color Brush, the brush color will blend from a first given color to a second one.
     */
    export class GradientColorBrush2D extends LockableBase implements IBrush2D {
        constructor(color1: Color4, color2: Color4, translation: Vector2 = Vector2.Zero(), rotation: number = 0, scale: number = 1, lock: boolean = false) {
            super();

            this._color1 = color1;
            this._color2 = color2;
            this._translation = translation;
            this._rotation = rotation;
            this._scale = scale;

            if (lock) {
                this.lock();
            }
        }

        /**
         * Return true if the brush is transparent, false if it's totally opaque
         */
        isTransparent(): boolean {
            return (this._color1 && this._color1.a < 1.0) || (this._color2 && this._color2.a < 1.0);
        }

        /**
         * First color, the blend will start from this color
         */
        public get color1(): Color4 {
            return this._color1;
        }

        public set color1(value: Color4) {
            if (this.isLocked()) {
                return;
            }

            this._color1 = value;
        }

        /**
         * Second color, the blend will end to this color
         */
        public get color2(): Color4 {
            return this._color2;
        }

        public set color2(value: Color4) {
            if (this.isLocked()) {
                return;
            }

            this._color2 = value;
        }

        /**
         * Translation vector to apply on the blend
         * Default is [0;0]
         */
        public get translation(): Vector2 {
            return this._translation;
        }

        public set translation(value: Vector2) {
            if (this.isLocked()) {
                return;
            }

            this._translation = value;
        }

        /**
         * Rotation in radian to apply to the brush
         * Default direction of the brush is vertical, you can change this using this property.
         * Default is 0.
         */
        public get rotation(): number {
            return this._rotation;
        }

        public set rotation(value: number) {
            if (this.isLocked()) {
                return;
            }

            this._rotation = value;
        }

        /**
         * Scale factor to apply to the gradient.
         * Default is 1: no scale.
         */
        public get scale(): number {
            return this._scale;
        }

        public set scale(value: number) {
            if (this.isLocked()) {
                return;
            }

            this._scale = value;
        }

        /**
         * Return a string describing the brush
         */
        public toString(): string {
            return `C1:${this._color1};C2:${this._color2};T:${this._translation.toString()};R:${this._rotation};S:${this._scale};`;
        }

        /**
         * Build a unique key string for the given parameters
         */
        public static BuildKey(color1: Color4, color2: Color4, translation: Vector2, rotation: number, scale: number) {
            return `C1:${color1};C2:${color2};T:${translation.toString()};R:${rotation};S:${scale};`;
        }

        private _color1: Color4;
        private _color2: Color4;
        private _translation: Vector2;
        private _rotation: number;
        private _scale: number;
    }

}