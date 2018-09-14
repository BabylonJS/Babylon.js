module BABYLON {
    /**
     * @hidden
     **/        
    export class _DepthCullingState {
        private _isDepthTestDirty = false;
        private _isDepthMaskDirty = false;
        private _isDepthFuncDirty = false;
        private _isCullFaceDirty = false;
        private _isCullDirty = false;
        private _isZOffsetDirty = false;
        private _isFrontFaceDirty = false;

        private _depthTest: boolean;
        private _depthMask: boolean;
        private _depthFunc: Nullable<number>;
        private _cull: Nullable<boolean>;
        private _cullFace: Nullable<number>;
        private _zOffset: number;
        private _frontFace: Nullable<number>;

        /**
         * Initializes the state.
         */
        public constructor() {
            this.reset();
        }

        public get isDirty(): boolean {
            return this._isDepthFuncDirty || this._isDepthTestDirty || this._isDepthMaskDirty || this._isCullFaceDirty || this._isCullDirty || this._isZOffsetDirty || this._isFrontFaceDirty;
        }

        public get zOffset(): number {
            return this._zOffset;
        }

        public set zOffset(value: number) {
            if (this._zOffset === value) {
                return;
            }

            this._zOffset = value;
            this._isZOffsetDirty = true;
        }

        public get cullFace(): Nullable<number> {
            return this._cullFace;
        }

        public set cullFace(value: Nullable<number>) {
            if (this._cullFace === value) {
                return;
            }

            this._cullFace = value;
            this._isCullFaceDirty = true;
        }

        public get cull(): Nullable<boolean> {
            return this._cull;
        }

        public set cull(value: Nullable<boolean>) {
            if (this._cull === value) {
                return;
            }

            this._cull = value;
            this._isCullDirty = true;
        }

        public get depthFunc(): Nullable<number> {
            return this._depthFunc;
        }

        public set depthFunc(value: Nullable<number>) {
            if (this._depthFunc === value) {
                return;
            }

            this._depthFunc = value;
            this._isDepthFuncDirty = true;
        }

        public get depthMask(): boolean {
            return this._depthMask;
        }

        public set depthMask(value: boolean) {
            if (this._depthMask === value) {
                return;
            }

            this._depthMask = value;
            this._isDepthMaskDirty = true;
        }

        public get depthTest(): boolean {
            return this._depthTest;
        }

        public set depthTest(value: boolean) {
            if (this._depthTest === value) {
                return;
            }

            this._depthTest = value;
            this._isDepthTestDirty = true;
        }

        public get frontFace(): Nullable<number> {
            return this._frontFace;
        }

        public set frontFace(value: Nullable<number>) {
            if (this._frontFace === value) {
                return;
            }

            this._frontFace = value;
            this._isFrontFaceDirty = true;
        }

        public reset() {
            this._depthMask = true;
            this._depthTest = true;
            this._depthFunc = null;
            this._cullFace = null;
            this._cull = null;
            this._zOffset = 0;
            this._frontFace = null;

            this._isDepthTestDirty = true;
            this._isDepthMaskDirty = true;
            this._isDepthFuncDirty = false;
            this._isCullFaceDirty = false;
            this._isCullDirty = false;
            this._isZOffsetDirty = false;
            this._isFrontFaceDirty = false;
        }

        public apply(engine: Engine) {
            if (!this.isDirty) {
                return;
            }

            // Cull
            if (this._isCullDirty) {
                engine._applyCull(this.cull);
                this._isCullDirty = false;
            }

            // Cull face
            if (this._isCullFaceDirty) {
                engine._applyCullFace(this.cullFace);
                this._isCullFaceDirty = false;
            }

            // Depth mask
            if (this._isDepthMaskDirty) {
                engine._applyDepthMask(this.depthMask);
                this._isDepthMaskDirty = false;
            }

            // Depth test
            if (this._isDepthTestDirty) {
                engine._applyDepthTest(this.depthTest);
                this._isDepthTestDirty = false;
            }

            // Depth func
            if (this._isDepthFuncDirty) {
                engine._applyDepthFunc(this.depthFunc);
            }

            // zOffset
            if (this._isZOffsetDirty) {
                engine._applyZOffset(this.zOffset);
                this._isZOffsetDirty = false;
            }

            // Front face
            if (this._isFrontFaceDirty) {
                engine._applyFrontFace(this.frontFace);
                this._isFrontFaceDirty = false;
            }
        }
    }
}