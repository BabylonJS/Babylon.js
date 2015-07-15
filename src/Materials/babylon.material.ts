module BABYLON {
    export class Material {
        private static _TriangleFillMode = 0;
        private static _WireFrameFillMode = 1;
        private static _PointFillMode = 2;

        public static get TriangleFillMode(): number {
            return Material._TriangleFillMode;
        }

        public static get WireFrameFillMode(): number {
            return Material._WireFrameFillMode;
        }

        public static get PointFillMode(): number {
            return Material._PointFillMode;
        }

        public id: string;
        public checkReadyOnEveryCall = true;
        public checkReadyOnlyOnce = false;
        public state = "";
        public alpha = 1.0;
        public backFaceCulling = true;
        public onCompiled: (effect: Effect) => void;
        public onError: (effect: Effect, errors: string) => void;
        public onDispose: () => void;
        public onBind: (material: Material, mesh: Mesh) => void;
        public getRenderTargetTextures: () => SmartArray<RenderTargetTexture>;
        public alphaMode = Engine.ALPHA_COMBINE;

        public _effect: Effect;
        public _wasPreviouslyReady = false;
        private _scene: Scene;
        private _fillMode = Material.TriangleFillMode;

        public pointSize = 1.0;

        public zOffset = 0;

        public get wireframe(): boolean {
            return this._fillMode === Material.WireFrameFillMode;
        }

        public set wireframe(value: boolean) {
            this._fillMode = (value ? Material.WireFrameFillMode : Material.TriangleFillMode);
        }

        public get pointsCloud(): boolean {
            return this._fillMode === Material.PointFillMode;
        }

        public set pointsCloud(value: boolean) {
            this._fillMode = (value ? Material.PointFillMode : Material.TriangleFillMode);
        }

        public get fillMode(): number {
            return this._fillMode;
        }

        public set fillMode(value: number) {
            this._fillMode = value;
        }

        constructor(public name: string, scene: Scene, doNotAdd?: boolean) {
            this.id = name;

            this._scene = scene;

            if (!doNotAdd) {
                scene.materials.push(this);
            }
        }

        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
            return true;
        }

        public getEffect(): Effect {
            return this._effect;
        }

        public getScene(): Scene {
            return this._scene;
        }

        public needAlphaBlending(): boolean {
            return (this.alpha < 1.0);
        }

        public needAlphaTesting(): boolean {
            return false;
        }

        public getAlphaTestTexture(): BaseTexture {
            return null;
        }

        public trackCreation(onCompiled: (effect: Effect) => void, onError: (effect: Effect, errors: string) => void) {
        }

        public _preBind(): void {
            var engine = this._scene.getEngine();

            engine.enableEffect(this._effect);
            engine.setState(this.backFaceCulling, this.zOffset);
        }

        public bind(world: Matrix, mesh?: Mesh): void {
            this._scene._cachedMaterial = this;

            if (this.onBind) {
                this.onBind(this, mesh);
            }
        }

        public bindOnlyWorldMatrix(world: Matrix): void {
        }

        public unbind(): void {
        }

        public clone(name: string): Material {
            return null;
        }

        public dispose(forceDisposeEffect?: boolean): void {
            // Remove from scene
            var index = this._scene.materials.indexOf(this);
            this._scene.materials.splice(index, 1);

            // Shader are kept in cache for further use but we can get rid of this by using forceDisposeEffect
            if (forceDisposeEffect && this._effect) {
                this._scene.getEngine()._releaseEffect(this._effect);
                this._effect = null;
            }

            // Callback
            if (this.onDispose) {
                this.onDispose();
            }
        }
    }
} 