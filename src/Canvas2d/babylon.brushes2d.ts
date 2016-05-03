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
         * It is critical for each instance of a given Brush2D type to return a unique string that identifies it because the Border instance will certainly be part of the computed ModelKey for a given Primitive
         * @returns A string identifier that uniquely identify the instance
         */
        toString(): string;
    }

    /**
     * Base class implemting the ILocable interface.
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

    /**
     * This classs implements a Brush that will be drawn with a uniform solid color (i.e. the same color everywhere in the content where the brush is assigned to).
     */
    export class SolidColorBrush2D extends LockableBase implements IBrush2D {
        constructor(color: Color4, lock: boolean = false) {
            super();
            this._color = color;
            if (lock) {
                this.lock();
            }
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
}