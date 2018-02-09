module BABYLON {
    /**
     * This represents a GPU particle system in Babylon.
     * This os the fastest particle system in Babylon as it uses the GPU to update the individual particle data.
     */
    export class GPUParticleSystem implements IDisposable, IParticleSystem {
        /**
         * The id of the Particle system.
         */
        public id: string;

        /**
         * The friendly name of the Particle system.
         */
        public name: string;

        /**
         * The emitter represents the Mesh or position we are attaching the particle system to.
         */
        public emitter: Nullable<AbstractMesh | Vector3> = null;

        /**
         * The rendering group used by the Particle system to chose when to render.
         */
        public renderingGroupId = 0;

        /**
         * The layer mask we are rendering the particles through.
         */
        public layerMask: number = 0x0FFFFFFF; // TODO

        private _capacity: number;
        private _renderEffect: Effect;
        private _updateEffect: Effect;

        private _buffer0: Buffer;
        private _buffer1: Buffer;
        private _spriteBuffer: Buffer;
        private _updateVAO = new Array<WebGLVertexArrayObject>();
        private _renderVAO = new Array<WebGLVertexArrayObject>()

        private _targetIndex = 0;
        private _sourceBuffer: Buffer;
        private _targetBuffer: Buffer;

        private _scene: Scene;
        private _engine: Engine;

        private _currentRenderId = -1;    
        private _started = false;    

        private _timeDelta = 0;

        private _randomTexture: RawTexture;

        /**
        * An event triggered when the system is disposed.
        */
        public onDisposeObservable = new Observable<GPUParticleSystem>();

        /**
         * The overall motion speed (0.01 is default update speed, faster updates = faster animation)
         */
        public updateSpeed = 0.01;        

        /**
         * The texture used to render each particle. (this can be a spritesheet)
         */
        public particleTexture: Nullable<Texture>;   
        
        /**
         * Blend mode use to render the particle, it can be either ParticleSystem.BLENDMODE_ONEONE or ParticleSystem.BLENDMODE_STANDARD.
         */
        public blendMode = ParticleSystem.BLENDMODE_ONEONE;        

        /**
         * Gets Wether the system has been started.
         * @returns True if it has been started, otherwise false.
         */
        public isStarted(): boolean {
            return this._started;
        }

        /**
         * Starts the particle system and begins to emit.
         */
        public start(): void {
            this._started = true;
        }

        /**
         * Stops the particle system.
         */
        public stop(): void {
            this._started = false;
        }

        /**
         * Instantiates a GPU particle system.
         * Particles are often small sprites used to simulate hard-to-reproduce phenomena like fire, smoke, water, or abstract visual effects like magic glitter and faery dust.
         * @param name The name of the particle system
         * @param capacity The max number of particles alive at the same time
         * @param scene The scene the particle system belongs to
         */
        constructor(name: string, capacity: number, scene: Scene) {
            this.id = name;
            this.name = name;
            this._scene = scene || Engine.LastCreatedScene;
            this._capacity = capacity;
            this._engine = this._scene.getEngine();

            this._scene.particleSystems.push(this);

            let updateEffectOptions: EffectCreationOptions = {
                attributes: ["position", "age", "life", "seed", "direction"],
                uniformsNames: ["timeDelta", "generalRandom", "emitterWM"],
                uniformBuffersNames: [],
                samplers:["randomSampler"],
                defines: "",
                fallbacks: null,  
                onCompiled: null,
                onError: null,
                indexParameters: null,
                maxSimultaneousLights: 0,                                                      
                transformFeedbackVaryings: ["outPosition", "outAge", "outLife", "outSeed", "outDirection"]
            };

            this._updateEffect = new Effect("gpuUpdateParticles", updateEffectOptions, this._scene.getEngine());   

            this._renderEffect = new Effect("gpuRenderParticles", ["position", "offset", "uv"], ["view", "projection"], ["textureSampler"], this._scene.getEngine());

            // Random data
            var d = [];
            for (var i = 0; i < 4096; ++i) {
                d.push(Math.random());
                d.push(Math.random());
                d.push(Math.random());
            }
            this._randomTexture = new RawTexture(new Float32Array(d), 4096, 1, Engine.TEXTUREFORMAT_RGB32F, this._scene, false, false, Texture.NEAREST_SAMPLINGMODE, Engine.TEXTURETYPE_FLOAT)
            this._randomTexture.wrapU = Texture.WRAP_ADDRESSMODE;
            this._randomTexture.wrapV = Texture.WRAP_ADDRESSMODE;
        }

        /**
         * Animates the particle system for the current frame by emitting new particles and or animating the living ones.
         */
        public animate(): void {
            if (this._currentRenderId === this._scene.getRenderId()) {
                return;
            }

            this._currentRenderId = this._scene.getRenderId();
            this._timeDelta = this.updateSpeed * this._scene.getAnimationRatio();               
        }

        private _createUpdateVAO(source: Buffer): WebGLVertexArrayObject {            
            let updateVertexBuffers: {[key: string]: VertexBuffer} = {};
            updateVertexBuffers["position"] = source.createVertexBuffer("position", 0, 3);
            updateVertexBuffers["age"] = source.createVertexBuffer("age", 3, 1);
            updateVertexBuffers["life"] = source.createVertexBuffer("life", 4, 1);
            updateVertexBuffers["seed"] = source.createVertexBuffer("seed", 5, 1);
            updateVertexBuffers["direction"] = source.createVertexBuffer("direction", 6, 3);
           
            let vao = this._engine.recordVertexArrayObject(updateVertexBuffers, null, this._updateEffect);
            this._engine.bindArrayBuffer(null);

            return vao;
        }

        private _createRenderVAO(source: Buffer, spriteSource: Buffer): WebGLVertexArrayObject {            
            let renderVertexBuffers: {[key: string]: VertexBuffer} = {};
            renderVertexBuffers["position"] = source.createVertexBuffer("position", 0, 3, 9, true);
            renderVertexBuffers["offset"] = spriteSource.createVertexBuffer("offset", 0, 2);
            renderVertexBuffers["uv"] = spriteSource.createVertexBuffer("uv", 2, 2);
           
            let vao = this._engine.recordVertexArrayObject(renderVertexBuffers, null, this._renderEffect);
            this._engine.bindArrayBuffer(null);

            return vao;
        }        
        
        private _initialize(): void {
            if (this._buffer0) {
                return;
            }

            let engine = this._scene.getEngine();
            var data = new Array<float>();
            for (var particleIndex = 0; particleIndex < this._capacity; particleIndex++) {
              // position
              data.push(0.0);
              data.push(0.0);
              data.push(0.0);

              // Age and life
              var life = 1 + Math.random();// * 10; 
              data.push(life + 1); // create the particle as a dead one to create a new one at start
              data.push(life);

              // Seed
              data.push(Math.random());

              // direction
              data.push(0.0);
              data.push(0.0);
              data.push(0.0);              
            }

            // Sprite data
            var spriteData = new Float32Array([1, 1,  1, 1,  -1, 1,  0, 1,
                -1, -1,  0, 0,   1, 1,  1, 1,
                -1, -1,  0, 0,   1, -1, 1, 0]);

            // Buffers
            this._buffer0 = new Buffer(engine, data, false, 9);
            this._buffer1 = new Buffer(engine, data, false, 9);
            this._spriteBuffer = new Buffer(engine, spriteData, false, 4);                                      

            // Update VAO
            this._updateVAO.push(this._createUpdateVAO(this._buffer0));
            this._updateVAO.push(this._createUpdateVAO(this._buffer1));

            // Render VAO
            this._renderVAO.push(this._createRenderVAO(this._buffer1, this._spriteBuffer));
            this._renderVAO.push(this._createRenderVAO(this._buffer0, this._spriteBuffer));

            // Links
            this._sourceBuffer = this._buffer0;
            this._targetBuffer = this._buffer1;

        }
        /**
         * Renders the particle system in its current state.
         * @returns the current number of particles.
         */
        public render(): number {
            if (!this.emitter || !this._updateEffect.isReady() || !this._renderEffect.isReady() ) {
                return 0;
            }

            // Get everything ready to render
            this. _initialize();
            
            // Enable update effect
            this._engine.enableEffect(this._updateEffect);
            this._engine.setState(false);    
            
            this._updateEffect.setFloat("timeDelta", this._timeDelta);
            this._updateEffect.setFloat("generalRandom", Math.random());
            this._updateEffect.setTexture("randomSampler", this._randomTexture);

            let emitterWM: Matrix;
            if ((<AbstractMesh>this.emitter).position) {
                var emitterMesh = (<AbstractMesh>this.emitter);
                emitterWM = emitterMesh.getWorldMatrix();
            } else {
                var emitterPosition = (<Vector3>this.emitter);
                emitterWM = Matrix.Translation(emitterPosition.x, emitterPosition.y, emitterPosition.z);
            }            
            this._updateEffect.setMatrix("emitterWM", emitterWM);

            // Bind source VAO
            this._engine.bindVertexArrayObject(this._updateVAO[this._targetIndex], null);

            // Update
            this._engine.bindTransformFeedbackBuffer(this._targetBuffer.getBuffer());
            this._engine.setRasterizerState(false);
            this._engine.beginTransformFeedback();
            this._engine.drawArraysType(Material.PointListDrawMode, 0, this._capacity);
            this._engine.endTransformFeedback();
            this._engine.setRasterizerState(true);
            this._engine.bindTransformFeedbackBuffer(null);

            // Enable render effect
            this._engine.enableEffect(this._renderEffect);
            this._renderEffect.setMatrix("view", this._scene.getViewMatrix());
            this._renderEffect.setMatrix("projection", this._scene.getProjectionMatrix());
            this._renderEffect.setTexture("textureSampler", this.particleTexture);

            // Draw order
            if (this.blendMode === ParticleSystem.BLENDMODE_ONEONE) {
                this._engine.setAlphaMode(Engine.ALPHA_ONEONE);
            } else {
                this._engine.setAlphaMode(Engine.ALPHA_COMBINE);
            }            

            // Bind source VAO
            this._engine.bindVertexArrayObject(this._renderVAO[this._targetIndex], null);

            // Render
            this._engine.drawArraysType(Material.TriangleFillMode, 0, 6, this._capacity);   
            this._engine.setAlphaMode(Engine.ALPHA_DISABLE);         

            // Switch VAOs
            this._targetIndex++;
            if (this._targetIndex === 2) {
                this._targetIndex = 0;
            }

            // Switch buffers
            let tmpBuffer = this._sourceBuffer;
            this._sourceBuffer = this._targetBuffer;
            this._targetBuffer = tmpBuffer;            

            return 0;
        }

        /**
         * Rebuilds the particle system
         */
        public rebuild(): void {
            
        }

        /**
         * Disposes the particle system and free the associated resources.
         */
        public dispose(): void {
            var index = this._scene.particleSystems.indexOf(this);
            if (index > -1) {
                this._scene.particleSystems.splice(index, 1);
            }

            if (this._buffer0) {
                this._buffer0.dispose();
                (<any>this._buffer0) = null;
            }
            if (this._buffer1) {
                this._buffer1.dispose();
                (<any>this._buffer1) = null;
            }
            
            for (var index = 0; index < this._updateVAO.length; index++) {
                this._engine.releaseVertexArrayObject(this._updateVAO[index]);
            }
            this._updateVAO = [];

            for (var index = 0; index < this._renderVAO.length; index++) {
                this._engine.releaseVertexArrayObject(this._renderVAO[index]);
            }
            this._renderVAO = [];            

            if (this._randomTexture) {
                this._randomTexture.dispose();
                (<any>this._randomTexture) = null;
            }

            // Callback
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();
        }

        //TODO: Clone / Parse / serialize

        /**
         * Clones the particle system.
         * @param name The name of the cloned object
         * @param newEmitter The new emitter to use
         * @returns the cloned particle system
         */
        public clone(name: string, newEmitter: any): Nullable<GPUParticleSystem> {
            return null;
        }

        /**
         * Serializes the particle system to a JSON object.
         * @returns the JSON object
         */
        public serialize(): any {
        }
    }
}