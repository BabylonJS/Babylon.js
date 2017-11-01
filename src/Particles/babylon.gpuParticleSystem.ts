module BABYLON {
    export class GPUParticleSystem implements IDisposable, IParticleSystem {
        // Members
        public id: string;
        public emitter: Nullable<AbstractMesh | Vector3> = null;       
        public renderingGroupId = 0;        
        public layerMask: number = 0x0FFFFFFF;
        private _renderingEffect: Effect;
        private _updateEffect: Effect;

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

            this._scene.particleSystems.push(this);

            this._renderingEffect = new Effect("gpuRenderParticles", ["position", "age", "life", "velocity"], [], [], this._scene.getEngine());

            let updateEffectOptions: EffectCreationOptions = {
                attributes: ["position", "age", "life", "velocity"],
                uniformsNames: [],
                uniformBuffersNames: [],
                samplers:[],
                defines: "",
                fallbacks: null,  
                onCompiled: null,
                onError: null,
                indexParameters: null,
                maxSimultaneousLights: 0,                                                      
                transformFeedbackVaryings: ["outPosition", "outAge", "outLife", "outVelocity"]
            };

            this._updateEffect = new Effect("gpuUpdateParticles", updateEffectOptions, this._scene.getEngine());
                                            
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
        public clone(name: string, newEmitter: any): Nullable<GPUParticleSystem> {
            return null;
        }

        public serialize(): any {
        }
    }
}