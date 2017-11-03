module BABYLON {
    export class GPUParticleSystem implements IDisposable, IParticleSystem {
        // Members
        public id: string;
        public emitter: Nullable<AbstractMesh | Vector3> = null;       
        public renderingGroupId = 0;        
        public layerMask: number = 0x0FFFFFFF; // TODO
        private _capacity: number;
        private _renderEffect: Effect;
        private _updateEffect: Effect;

        private _updateBuffer: Buffer;
        private _updateVAO: WebGLVertexArrayObject;
        private _updateVertexBuffers: {[key: string]: VertexBuffer} = {};
        private _renderBuffer: Buffer;
        private _renderVAO: WebGLVertexArrayObject;
        private _renderVertexBuffers: {[key: string]: VertexBuffer} = {};

        private _sourceVAO: WebGLVertexArrayObject;
        private _targetVAO: WebGLVertexArrayObject;
        private _sourceBuffer: Buffer;
        private _targetBuffer: Buffer;

        private _scene: Scene;
        private _engine: Engine;

        private _currentRenderId = -1;    
        private _started = true;    

        /**
        * An event triggered when the system is disposed.
        * @type {BABYLON.Observable}
        */
        public onDisposeObservable = new Observable<GPUParticleSystem>();

        public isStarted(): boolean {
            return this._started;
        }     

        public start(): void {
            this._started = true;
        }

        public stop(): void {
            this._started = false;
        }        

        constructor(public name: string, capacity: number, scene: Scene) {
            this.id = name;
            this._scene = scene || Engine.LastCreatedScene;
            this._capacity = capacity;
            this._engine = this._scene.getEngine();

            this._scene.particleSystems.push(this);

            this._renderEffect = new Effect("gpuRenderParticles", ["position", "age", "life", "velocity"], [], [], this._scene.getEngine());

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
            // Do nothing
        }
        
        private _initialize(): void {
            if (this._renderVAO) {
                return;
            }

            var data = new Array<float>();
            for (var particleIndex = 0; particleIndex < this._capacity; particleIndex++) {
              // position
              data.push(0.0);
              data.push(0.0);
              data.push(0.0);
          
              var life = 1 + Math.random() * 10; // TODO: var
              data.push(life + 1); // create the particle as a dead one to create a new one at start
              data.push(life);
          
              // velocity
              data.push(0.0);
              data.push(0.0);
              data.push(0.0);
            }

            // Update VAO
            this._updateBuffer = new Buffer(this._scene.getEngine(), data, false, 0);
            this._updateVertexBuffers["position"] = this._updateBuffer.createVertexBuffer("position", 0, 3, 3);
            this._updateVertexBuffers["age"] = this._updateBuffer.createVertexBuffer("age", 3, 1, 1);
            this._updateVertexBuffers["life"] = this._updateBuffer.createVertexBuffer("life", 4, 1, 1);
            this._updateVertexBuffers["velocity"] = this._updateBuffer.createVertexBuffer("velocity", 5, 3, 3);
           
            this._updateVAO = this._engine.recordVertexArrayObject(this._updateVertexBuffers, null, this._updateEffect);
            this._engine.bindArrayBuffer(null);

            // Render VAO
            this._renderBuffer = new Buffer(this._scene.getEngine(), data, false, 0);
            this._renderVertexBuffers["position"] = this._renderBuffer.createVertexBuffer("position", 0, 3, 3);
            this._renderVertexBuffers["age"] = this._renderBuffer.createVertexBuffer("age", 3, 1, 1);
            this._renderVertexBuffers["life"] = this._renderBuffer.createVertexBuffer("life", 4, 1, 1);
            this._renderVertexBuffers["velocity"] = this._renderBuffer.createVertexBuffer("velocity", 5, 3, 3);
           
            this._renderVAO = this._engine.recordVertexArrayObject(this._renderVertexBuffers, null, this._renderEffect);  
            this._engine.bindArrayBuffer(null);          

            // Links
            this._sourceVAO = this._updateVAO;
            this._targetVAO = this._renderVAO;

            this._sourceBuffer = this._updateBuffer;
            this._targetBuffer = this._renderBuffer;
        }

        public render(): number {
            if (!this.emitter || !this._updateEffect.isReady() || !this._renderEffect.isReady() ) {
                return 0;
            }

            // Get everything ready to render
            this. _initialize();
            
            if (this._currentRenderId === this._scene.getRenderId()) {
                return 0;
            }

            this._currentRenderId = this._scene.getRenderId();            

            // Enable update effect
            this._engine.enableEffect(this._updateEffect);
            this._engine.setState(false);            

            // Bind source VAO
            this._engine.bindVertexArrayObject(this._sourceVAO, null);

            // Update
            this._engine.bindTransformFeedbackBuffer(this._targetBuffer.getBuffer());
            this._engine.setRasterizerState(false);
            this._engine.beginTransformFeedback();
            this._engine.drawPointClouds(0, this._capacity);
            this._engine.endTransformFeedback();
            this._engine.setRasterizerState(true);
            this._engine.bindTransformFeedbackBuffer(null);

            // Enable render effect
            this._engine.enableEffect(this._renderEffect);

            // Bind source VAO
            this._engine.bindVertexArrayObject(this._targetVAO, null);

            // Render
            this._engine.drawPointClouds(0, this._capacity);            

            // Switch VAOs
            let tmpVAO = this._sourceVAO;
            this._sourceVAO = this._targetVAO;
            this._targetVAO = tmpVAO;

            // Switch buffers
            let tmpBuffer = this._sourceBuffer;
            this._sourceBuffer = this._targetBuffer;
            this._targetBuffer = tmpBuffer;            

            return 0;
        }

        public rebuild(): void {
            
        }

        public dispose(): void {
            var index = this._scene.particleSystems.indexOf(this);
            if (index > -1) {
                this._scene.particleSystems.splice(index, 1);
            }

            //TODO: this._dataBuffer.dispose();

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