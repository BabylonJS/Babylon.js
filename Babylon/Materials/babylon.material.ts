module BABYLON {
    export class Material {
        public id: string;
        public checkReadyOnEveryCall = true;
        public checkReadyOnlyOnce = false;
        public state = "";
        public alpha = 1.0;
        public wireframe = false;
        public backFaceCulling = true;
        public onCompiled: (effect: Effect) => void;
        public onError: (effect: Effect, errors: string) => void;
        public onDispose: () => void;
        public getRenderTargetTextures: () => SmartArray<RenderTargetTexture>;

        public _effect: Effect;
        public _wasPreviouslyReady = false;
        private _scene: Scene;

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
            engine.setState(this.backFaceCulling);
        }

        public bind(world: Matrix, mesh: Mesh): void {
        }

        public bindOnlyWorldMatrix(world: Matrix): void {
        }

        public unbind(): void {
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