module BABYLON {
    export interface IBorder2D extends ILockable {
        toString(): string;
    }

    export interface IFill2D extends ILockable {
        toString(): string;
    }

    export interface ILockable {
        isLocked(): boolean;
        lock();
    }

    export class LockableBase implements ILockable {
        isLocked(): boolean {
            return this._isLocked;
        }

        private _isLocked: boolean;

        lock() {
            if (this._isLocked) {
                return;
            }

            this.onLock();
            this._isLocked = true;
        }

        protected onLock() {

        }
    }

    export class SolidColorBorder2D extends LockableBase implements IBorder2D {
        constructor(color: Color4, lock: boolean = false) {
            super();
            this._color = color;
            if (lock) {
                this.lock();
            }
        }

        public get color(): Color4 {
            return this._color;
        }

        public set color(value: Color4) {
            if (this.isLocked()) {
                return;
            }

            this._color = value;
        }

        public toString(): string {
            return this._color.toHexString();
        }
        private _color: Color4;
    }

    export class SolidColorFill2D extends LockableBase implements IFill2D {
        constructor(color: Color4, lock: boolean = false) {
            super();
            this._color = color;
            if (lock) {
                this.lock();
            }
        }

        public get color(): Color4 {
            return this._color;
        }

        public set color(value: Color4) {
            if (this.isLocked()) {
                return;
            }

            this._color = value;
        }

        public toString(): string {
            return this._color.toHexString();
        }

        private _color: Color4;
    }


}