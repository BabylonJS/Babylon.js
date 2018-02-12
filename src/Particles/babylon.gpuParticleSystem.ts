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
        private _activeCount: number;
        private _currentActiveCount: number;
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

        private readonly _attributesStrideSize = 14;
        private _updateEffectOptions: EffectCreationOptions;

        public static get IsSupported(): boolean {
            if (!Engine.LastCreatedEngine) {
                return false;
            }
            return Engine.LastCreatedEngine.webGLVersion > 1;
        }

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
         * Minimum life time of emitting particles.
         */
        public minLifeTime = 1;
        /**
         * Maximum life time of emitting particles.
         */
        public maxLifeTime = 1;    

        /**
         * Minimum Size of emitting particles.
         */
        public minSize = 1;
        /**
         * Maximum Size of emitting particles.
         */
        public maxSize = 1;        
        
        /**
         * Random color of each particle after it has been emitted, between color1 and color2 vectors.
         */
        public color1 = new Color4(1.0, 1.0, 1.0, 1.0);
        /**
         * Random color of each particle after it has been emitted, between color1 and color2 vectors.
         */
        public color2 = new Color4(1.0, 1.0, 1.0, 1.0);  
        
        /**
         * Color the particle will have at the end of its lifetime.
         */
        public colorDead = new Color4(0, 0, 0, 0);        
        
        /**
         * The maximum number of particles to emit per frame until we reach the activeParticleCount value
         */
        public emitRate = 100; 
        
        /**
         * You can use gravity if you want to give an orientation to your particles.
         */
        public gravity = Vector3.Zero();    

        /**
         * The particle emitter type defines the emitter used by the particle system.
         * It can be for example box, sphere, or cone...
         */
        public particleEmitterType: IParticleEmitterType;        

        /**
         * Gets the maximum number of particles supported by this system
         */
        public get capacity(): number {
            return this._capacity;
        }

        /**
         * Gets or set the number of active particles
         */
        public get activeParticleCount(): number {
            return this._activeCount;
        }

        public set activeParticleCount(value: number) {
            this._activeCount = Math.min(value, this._capacity);
        }

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
        constructor(name: string, options: Partial<{
                        capacity: number,
                        randomTextureSize: number
                    }>, scene: Scene) {
            this.id = name;
            this.name = name;
            this._scene = scene || Engine.LastCreatedScene;
            this._engine = this._scene.getEngine();

            let fullOptions = {
                capacity: 50000,
                randomTextureSize: this._engine.getCaps().maxTextureSize,
                ...options
            };

            this._capacity = fullOptions.capacity;
            this._activeCount = fullOptions.capacity;
            this._currentActiveCount = 0;

            this._scene.particleSystems.push(this);

            this._updateEffectOptions = {
                attributes: ["position", "age", "life", "seed", "size", "color", "direction"],
                uniformsNames: ["currentCount", "timeDelta", "generalRandoms", "emitterWM", "lifeTime", "color1", "color2", "sizeRange", "gravity", "direction1", "direction2"],
                uniformBuffersNames: [],
                samplers:["randomSampler"],
                defines: "",
                fallbacks: null,  
                onCompiled: null,
                onError: null,
                indexParameters: null,
                maxSimultaneousLights: 0,                                                      
                transformFeedbackVaryings: ["outPosition", "outAge", "outLife", "outSeed", "outSize", "outColor", "outDirection"]
            };

            this._updateEffect = new Effect("gpuUpdateParticles", this._updateEffectOptions, this._scene.getEngine());   

            this._renderEffect = new Effect("gpuRenderParticles", ["position", "age", "life", "size", "color", "offset", "uv"], ["view", "projection", "colorDead"], ["textureSampler"], this._scene.getEngine());

            // Random data
            var maxTextureSize = Math.min(this._engine.getCaps().maxTextureSize, fullOptions.randomTextureSize);
            var d = [];
            for (var i = 0; i < maxTextureSize; ++i) {
                d.push(Math.random());
                d.push(Math.random());
                d.push(Math.random());
            }
            this._randomTexture = new RawTexture(new Float32Array(d), maxTextureSize, 1, Engine.TEXTUREFORMAT_RGB32F, this._scene, false, false, Texture.NEAREST_SAMPLINGMODE, Engine.TEXTURETYPE_FLOAT)
            this._randomTexture.wrapU = Texture.WRAP_ADDRESSMODE;
            this._randomTexture.wrapV = Texture.WRAP_ADDRESSMODE;

            // Default emitter type
            this.particleEmitterType = new BoxParticleEmitter();            
        }

        /**
         * Animates the particle system for the current frame by emitting new particles and or animating the living ones.
         */
        public animate(): void {
            this._timeDelta = this.updateSpeed * this._scene.getAnimationRatio();               
        }

        private _createUpdateVAO(source: Buffer): WebGLVertexArrayObject {            
            let updateVertexBuffers: {[key: string]: VertexBuffer} = {};
            updateVertexBuffers["position"] = source.createVertexBuffer("position", 0, 3);
            updateVertexBuffers["age"] = source.createVertexBuffer("age", 3, 1);
            updateVertexBuffers["life"] = source.createVertexBuffer("life", 4, 1);
            updateVertexBuffers["seed"] = source.createVertexBuffer("seed", 5, 1);
            updateVertexBuffers["size"] = source.createVertexBuffer("size", 6, 1);
            updateVertexBuffers["color"] = source.createVertexBuffer("color", 7, 4);
            updateVertexBuffers["direction"] = source.createVertexBuffer("direction", 11, 3);
           
            let vao = this._engine.recordVertexArrayObject(updateVertexBuffers, null, this._updateEffect);
            this._engine.bindArrayBuffer(null);

            return vao;
        }

        private _createRenderVAO(source: Buffer, spriteSource: Buffer): WebGLVertexArrayObject {            
            let renderVertexBuffers: {[key: string]: VertexBuffer} = {};
            renderVertexBuffers["position"] = source.createVertexBuffer("position", 0, 3, this._attributesStrideSize, true);
            renderVertexBuffers["age"] = source.createVertexBuffer("age", 3, 1, this._attributesStrideSize, true);
            renderVertexBuffers["life"] = source.createVertexBuffer("life", 4, 1, this._attributesStrideSize, true);
            renderVertexBuffers["size"] = source.createVertexBuffer("size", 6, 1, this._attributesStrideSize, true);           
            renderVertexBuffers["color"] = source.createVertexBuffer("color", 7, 4, this._attributesStrideSize, true);

            renderVertexBuffers["offset"] = spriteSource.createVertexBuffer("offset", 0, 2);
            renderVertexBuffers["uv"] = spriteSource.createVertexBuffer("uv", 2, 2);
           
            let vao = this._engine.recordVertexArrayObject(renderVertexBuffers, null, this._renderEffect);
            this._engine.bindArrayBuffer(null);

            return vao;
        }        
        
        private _initialize(force = false): void {
            if (this._buffer0 && !force) {
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
              data.push(0.0); // create the particle as a dead one to create a new one at start
              data.push(0.0);

              // Seed
              data.push(Math.random());

              // Size
              data.push(0.0);

              // color
              data.push(0.0);
              data.push(0.0);
              data.push(0.0);                     
              data.push(0.0); 

              // direction
              data.push(0.0);
              data.push(0.0);
              data.push(0.0);              
            }

            // Sprite data
            var spriteData = new Float32Array([1, 1,  1, 1,  
                                              -1, 1,  0, 1,
                                             -1, -1,  0, 0,   
                                              1, -1,  1, 0]);

            // Buffers
            this._buffer0 = new Buffer(engine, data, false, this._attributesStrideSize);
            this._buffer1 = new Buffer(engine, data, false, this._attributesStrideSize);
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

        /** @ignore */
        public _recreateUpdateEffect(defines: string) {
            if (this._updateEffectOptions.defines === defines) {
                return;
            }
            this._updateEffectOptions.defines = defines;
            this._updateEffect = new Effect("gpuUpdateParticles", this._updateEffectOptions, this._scene.getEngine());   
        }

        /**
         * Renders the particle system in its current state.
         * @returns the current number of particles
         */
        public render(): number {
            this._recreateUpdateEffect(this.particleEmitterType.getEffectDefines());

            if (!this.emitter || !this._updateEffect.isReady() || !this._renderEffect.isReady() ) {
                return 0;
            }

            if (this._currentRenderId === this._scene.getRenderId()) {
                return 0;
            }

            this._currentRenderId = this._scene.getRenderId();
            

            // Get everything ready to render
            this. _initialize();

            this._currentActiveCount = Math.min(this._activeCount, this._currentActiveCount + this.emitRate);
            
            // Enable update effect

            this._engine.enableEffect(this._updateEffect);
            this._engine.setState(false);    
            
            this._updateEffect.setFloat("currentCount", this._currentActiveCount);
            this._updateEffect.setFloat("timeDelta", this._timeDelta);
            this._updateEffect.setFloat2("generalRandoms", Math.random(), Math.random());
            this._updateEffect.setTexture("randomSampler", this._randomTexture);
            this._updateEffect.setFloat2("lifeTime", this.minLifeTime, this.maxLifeTime);
            this._updateEffect.setDirectColor4("color1", this.color1);
            this._updateEffect.setDirectColor4("color2", this.color2);
            this._updateEffect.setFloat2("sizeRange", this.minSize, this.maxSize);
            this._updateEffect.setVector3("gravity", this.gravity);

            this.particleEmitterType.applyToShader(this._updateEffect);

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
            this._engine.drawArraysType(Material.PointListDrawMode, 0, this._currentActiveCount);
            this._engine.endTransformFeedback();
            this._engine.setRasterizerState(true);
            this._engine.bindTransformFeedbackBuffer(null);

            // Enable render effect
            this._engine.enableEffect(this._renderEffect);
            this._renderEffect.setMatrix("view", this._scene.getViewMatrix());
            this._renderEffect.setMatrix("projection", this._scene.getProjectionMatrix());
            this._renderEffect.setTexture("textureSampler", this.particleTexture);
            this._renderEffect.setDirectColor4("colorDead", this.colorDead);

            // Draw order
            if (this.blendMode === ParticleSystem.BLENDMODE_ONEONE) {
                this._engine.setAlphaMode(Engine.ALPHA_ONEONE);
            } else {
                this._engine.setAlphaMode(Engine.ALPHA_COMBINE);
            }            

            // Bind source VAO
            this._engine.bindVertexArrayObject(this._renderVAO[this._targetIndex], null);

            // Render
            this._engine.drawArraysType(Material.TriangleFanDrawMode, 0, 4, this._currentActiveCount);   
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
            
            return this._currentActiveCount;
        }

        /**
         * Rebuilds the particle system
         */
        public rebuild(): void {
            this._initialize(true);
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