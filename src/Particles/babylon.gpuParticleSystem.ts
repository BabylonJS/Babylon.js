module BABYLON {
    export class GPUParticleSystem implements IDisposable, IParticleSystem {
        // Members
        public id: string;
        public emitter: AbstractMesh | Vector3 = null;       
        public renderingGroupId = 0;        
        public layerMask: number = 0x0FFFFFFF;

        private _scene: Scene;

        /**
        * An event triggered when the system is disposed.
        * @type {BABYLON.Observable}
        */
        public onDisposeObservable = new Observable<GPUParticleSystem>();


        public isStarted(): boolean {
            return false;
        }        

        constructor(public name: string, capacity: number, scene: Scene) {
            this.id = name;
            this._scene = scene || Engine.LastCreatedScene;

            scene.particleSystems.push(this);
        }

        public animate(): void {

        }

        public render(): number {
            return 0;
        }

        public rebuild(): void {
            
        }

        public dispose(): void {
            var index = this._scene.particleSystems.indexOf(this);
            if (index > -1) {
                this._scene.particleSystems.splice(index, 1);
            }

            // Callback
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();
        }

        //TODO: Clone / Parse / serialize
        public clone(name: string, newEmitter: any): GPUParticleSystem {
            return null;
        }

        public serialize(): any {
        }
    }
}