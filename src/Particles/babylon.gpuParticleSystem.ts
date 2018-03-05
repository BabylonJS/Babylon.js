module BABYLON {
    /**
     * This represents a GPU particle system in Babylon
     * This is the fastest particle system in Babylon as it uses the GPU to update the individual particle data
     * @see https://www.babylonjs-playground.com/#PU4WYI#4
     */
    export class GPUParticleSystem implements IDisposable, IParticleSystem, IAnimatable {
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
        public layerMask: number = 0x0FFFFFFF;

        private _capacity: number;
        private _activeCount: number;
        private _currentActiveCount: number;
        private _renderEffect: Effect;
        private _updateEffect: Effect;

        private _buffer0: Buffer;
        private _buffer1: Buffer;
        private _spriteBuffer: Buffer;
        private _updateVAO: Array<WebGLVertexArrayObject>;
        private _renderVAO: Array<WebGLVertexArrayObject>;

        private _targetIndex = 0;
        private _sourceBuffer: Buffer;
        private _targetBuffer: Buffer;

        private _scene: Scene;
        private _engine: Engine;

        private _currentRenderId = -1;    
        private _started = false;    
        private _stopped = false;    

        private _timeDelta = 0;

        private _randomTexture: RawTexture;

        private readonly _attributesStrideSize = 14;
        private _updateEffectOptions: EffectCreationOptions;

        private _randomTextureSize: number;
        private _actualFrame = 0;        

        /**
         * List of animations used by the particle system.
         */
        public animations: Animation[] = [];        

        /**
         * Gets a boolean indicating if the GPU particles can be rendered on current browser
         */
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
         * The amount of time the particle system is running (depends of the overall update speed).
         */
        public targetStopDuration = 0;        

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
         * Minimum power of emitting particles.
         */
        public minEmitPower = 1;
        /**
         * Maximum power of emitting particles.
         */
        public maxEmitPower = 1;        

        /**
         * The particle emitter type defines the emitter used by the particle system.
         * It can be for example box, sphere, or cone...
         */
        public particleEmitterType: Nullable<IParticleEmitterType>;    

        /**
         * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
         * This only works when particleEmitterTyps is a BoxParticleEmitter
         */
        public get direction1(): Vector3 {
            if ((<BoxParticleEmitter>this.particleEmitterType).direction1) {
                return (<BoxParticleEmitter>this.particleEmitterType).direction1;
            }

            return Vector3.Zero();
        }

        public set direction1(value: Vector3) {
            if ((<BoxParticleEmitter>this.particleEmitterType).direction1) {
                (<BoxParticleEmitter>this.particleEmitterType).direction1 = value;
            }
        }        
        
        /**
         * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
         * This only works when particleEmitterTyps is a BoxParticleEmitter
         */
        public get direction2(): Vector3 {
            if ((<BoxParticleEmitter>this.particleEmitterType).direction2) {
                return (<BoxParticleEmitter>this.particleEmitterType).direction2;
            }

            return Vector3.Zero();
        }

        public set direction2(value: Vector3) {
            if ((<BoxParticleEmitter>this.particleEmitterType).direction2) {
                (<BoxParticleEmitter>this.particleEmitterType).direction2 = value;
            }
        }

        /**
         * Minimum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
         * This only works when particleEmitterTyps is a BoxParticleEmitter
         */
        public get minEmitBox(): Vector3 {
            if ((<BoxParticleEmitter>this.particleEmitterType).minEmitBox) {
                return (<BoxParticleEmitter>this.particleEmitterType).minEmitBox;
            }

            return Vector3.Zero();
        }

        public set minEmitBox(value: Vector3) {
            if ((<BoxParticleEmitter>this.particleEmitterType).minEmitBox) {
                (<BoxParticleEmitter>this.particleEmitterType).minEmitBox = value;
            }
        }      
        
        /**
         * Maximum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
         * This only works when particleEmitterTyps is a BoxParticleEmitter
         */
        public get maxEmitBox(): Vector3 {
            if ((<BoxParticleEmitter>this.particleEmitterType).maxEmitBox) {
                return (<BoxParticleEmitter>this.particleEmitterType).maxEmitBox;
            }

            return Vector3.Zero();
        }

        public set maxEmitBox(value: Vector3) {
            if ((<BoxParticleEmitter>this.particleEmitterType).maxEmitBox) {
                (<BoxParticleEmitter>this.particleEmitterType).maxEmitBox = value;
            }
        }        

        /**
         * Gets the maximum number of particles active at the same time.
         * @returns The max number of active particles.
         */
        public getCapacity(): number {
            return this._capacity;
        }

        /**
         * Forces the particle to write their depth information to the depth buffer. This can help preventing other draw calls
         * to override the particles.
         */
        public forceDepthWrite = false;        

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
            this._stopped = false;
        }

        /**
         * Stops the particle system.
         */
        public stop(): void {
            this._stopped = true;
        }

        /**
         * Remove all active particles
         */
        public reset(): void {
            this._releaseBuffers();
            this._releaseVAOs();   
            this._currentActiveCount = 0;         
            this._targetIndex = 0;
        }      
        
        /**
         * Returns the string "GPUParticleSystem"
         * @returns a string containing the class name 
         */
        public getClassName(): string {
            return "GPUParticleSystem";
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
                uniformsNames: ["currentCount", "timeDelta", "generalRandoms", "emitterWM", "lifeTime", "color1", "color2", "sizeRange", "gravity", "emitPower",
                                "direction1", "direction2", "minEmitBox", "maxEmitBox", "radius", "directionRandomizer", "height", "angle"],
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

            // Random data
            var maxTextureSize = Math.min(this._engine.getCaps().maxTextureSize, fullOptions.randomTextureSize);
            var d = [];
            for (var i = 0; i < maxTextureSize; ++i) {
                d.push(Math.random());
                d.push(Math.random());
                d.push(Math.random());
                d.push(Math.random());
            }
            this._randomTexture = new RawTexture(new Float32Array(d), maxTextureSize, 1, Engine.TEXTUREFORMAT_RGBA32F, this._scene, false, false, Texture.NEAREST_SAMPLINGMODE, Engine.TEXTURETYPE_FLOAT)
            this._randomTexture.wrapU = Texture.WRAP_ADDRESSMODE;
            this._randomTexture.wrapV = Texture.WRAP_ADDRESSMODE;

            this._randomTextureSize = maxTextureSize;
            this.particleEmitterType = new BoxParticleEmitter();
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
            var spriteData = new Float32Array([0.5, 0.5,  1, 1,  
                                              -0.5, 0.5,  0, 1,
                                             -0.5, -0.5,  0, 0,   
                                             0.5, -0.5,  1, 0]);

            // Buffers
            this._buffer0 = new Buffer(engine, data, false, this._attributesStrideSize);
            this._buffer1 = new Buffer(engine, data, false, this._attributesStrideSize);
            this._spriteBuffer = new Buffer(engine, spriteData, false, 4);                                      

            // Update VAO
            this._updateVAO = [];
            this._updateVAO.push(this._createUpdateVAO(this._buffer0));
            this._updateVAO.push(this._createUpdateVAO(this._buffer1));

            // Render VAO
            this._renderVAO = [];
            this._renderVAO.push(this._createRenderVAO(this._buffer1, this._spriteBuffer));
            this._renderVAO.push(this._createRenderVAO(this._buffer0, this._spriteBuffer));

            // Links
            this._sourceBuffer = this._buffer0;
            this._targetBuffer = this._buffer1;

        }

        /** @ignore */
        public _recreateUpdateEffect() {
            let defines = this.particleEmitterType ? this.particleEmitterType.getEffectDefines() : "";
            if (this._updateEffect && this._updateEffectOptions.defines === defines) {
                return;
            }
            this._updateEffectOptions.defines = defines;
            this._updateEffect = new Effect("gpuUpdateParticles", this._updateEffectOptions, this._scene.getEngine());   
        }

        /** @ignore */
        public _recreateRenderEffect() {
            let defines = "";
            if (this._scene.clipPlane) {
                defines = "\n#define CLIPPLANE";
            }

            if (this._renderEffect && this._renderEffect.defines === defines) {
                return;
            }

            this._renderEffect = new Effect("gpuRenderParticles", 
                                            ["position", "age", "life", "size", "color", "offset", "uv"], 
                                            ["view", "projection", "colorDead", "invView", "vClipPlane"], 
                                            ["textureSampler"], this._scene.getEngine(), defines);
        }        

        /**
         * Animates the particle system for the current frame by emitting new particles and or animating the living ones.
         */
        public animate(): void {           
            if (!this._stopped) {
                this._timeDelta = this.updateSpeed * this._scene.getAnimationRatio();   
                this._actualFrame += this._timeDelta;

                if (this.targetStopDuration && this._actualFrame >= this.targetStopDuration)
                    this.stop();
            } else {
                this._timeDelta = 0;
            }             
        }        

        /**
         * Renders the particle system in its current state.
         * @returns the current number of particles
         */
        public render(): number {
            if (!this._started) {
                return 0;
            }

            this._recreateUpdateEffect();
            this._recreateRenderEffect();

            if (!this.emitter || !this._updateEffect.isReady() || !this._renderEffect.isReady() ) {
                return 0;
            }

            if (this._currentRenderId === this._scene.getRenderId()) {
                return 0;
            }

            this._currentRenderId = this._scene.getRenderId();      
            
            // Get everything ready to render
            this. _initialize();

            this._currentActiveCount = Math.min(this._activeCount, this._currentActiveCount + (this.emitRate * this._timeDelta) | 0);
            
            // Enable update effect

            this._engine.enableEffect(this._updateEffect);
            this._engine.setState(false);    
            
            this._updateEffect.setFloat("currentCount", this._currentActiveCount);
            this._updateEffect.setFloat("timeDelta", this._timeDelta);
            this._updateEffect.setFloat3("generalRandoms", Math.random(), Math.random(), Math.random());
            this._updateEffect.setTexture("randomSampler", this._randomTexture);
            this._updateEffect.setFloat2("lifeTime", this.minLifeTime, this.maxLifeTime);
            this._updateEffect.setFloat2("emitPower", this.minEmitPower, this.maxEmitPower);
            this._updateEffect.setDirectColor4("color1", this.color1);
            this._updateEffect.setDirectColor4("color2", this.color2);
            this._updateEffect.setFloat2("sizeRange", this.minSize, this.maxSize);
            this._updateEffect.setVector3("gravity", this.gravity);

            if (this.particleEmitterType) {
                this.particleEmitterType.applyToShader(this._updateEffect);
            }

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
            let viewMatrix = this._scene.getViewMatrix();
            this._renderEffect.setMatrix("view", viewMatrix);
            this._renderEffect.setMatrix("projection", this._scene.getProjectionMatrix());
            this._renderEffect.setTexture("textureSampler", this.particleTexture);
            this._renderEffect.setDirectColor4("colorDead", this.colorDead);


            if (this._scene.clipPlane) {
                var clipPlane = this._scene.clipPlane;
                var invView = viewMatrix.clone();
                invView.invert();
                this._renderEffect.setMatrix("invView", invView);
                this._renderEffect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
            }            

            // Draw order
            if (this.blendMode === ParticleSystem.BLENDMODE_ONEONE) {
                this._engine.setAlphaMode(Engine.ALPHA_ONEONE);
            } else {
                this._engine.setAlphaMode(Engine.ALPHA_COMBINE);
            }            

            if (this.forceDepthWrite) {
                this._engine.setDepthWrite(true);
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

        private _releaseBuffers() {
            if (this._buffer0) {
                this._buffer0.dispose();
                (<any>this._buffer0) = null;
            }
            if (this._buffer1) {
                this._buffer1.dispose();
                (<any>this._buffer1) = null;
            }
            if (this._spriteBuffer) {
                this._spriteBuffer.dispose();
                (<any>this._spriteBuffer) = null;
            }            
        }

        private _releaseVAOs() {
            for (var index = 0; index < this._updateVAO.length; index++) {
                this._engine.releaseVertexArrayObject(this._updateVAO[index]);
            }
            this._updateVAO = [];

            for (var index = 0; index < this._renderVAO.length; index++) {
                this._engine.releaseVertexArrayObject(this._renderVAO[index]);
            }
            this._renderVAO = [];   
        }

        /**
         * Disposes the particle system and free the associated resources
         * @param disposeTexture defines if the particule texture must be disposed as well (true by default)
         */
        public dispose(disposeTexture = true): void {
            var index = this._scene.particleSystems.indexOf(this);
            if (index > -1) {
                this._scene.particleSystems.splice(index, 1);
            }

            this._releaseBuffers();
            this._releaseVAOs();
         

            if (this._randomTexture) {
                this._randomTexture.dispose();
                (<any>this._randomTexture) = null;
            }

            if (disposeTexture && this.particleTexture) {
                this.particleTexture.dispose();
                this.particleTexture = null;
            }            

            // Callback
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();
        }
        /**
         * Clones the particle system.
         * @param name The name of the cloned object
         * @param newEmitter The new emitter to use
         * @returns the cloned particle system
         */
        public clone(name: string, newEmitter: any): Nullable<GPUParticleSystem> {
            var result = new GPUParticleSystem(name, {capacity: this._capacity, randomTextureSize: this._randomTextureSize}, this._scene);

            Tools.DeepCopy(this, result);

            if (newEmitter === undefined) {
                newEmitter = this.emitter;
            }

            result.emitter = newEmitter;
            if (this.particleTexture) {
                result.particleTexture = new Texture(this.particleTexture.url, this._scene);
            }

            return result;
        }

        /**
         * Serializes the particle system to a JSON object.
         * @returns the JSON object
         */
        public serialize(): any {
            var serializationObject: any = {};

            serializationObject.name = this.name;
            serializationObject.id = this.id;

            // Emitter
            if ((<AbstractMesh>this.emitter).position) {
                var emitterMesh = (<AbstractMesh>this.emitter);
                serializationObject.emitterId = emitterMesh.id;
            } else {
                var emitterPosition = (<Vector3>this.emitter);
                serializationObject.emitter = emitterPosition.asArray();
            }

            serializationObject.capacity = this.getCapacity();

            if (this.particleTexture) {
                serializationObject.textureName = this.particleTexture.name;
            }

            // Animations
            Animation.AppendSerializedAnimations(this, serializationObject);

            // Particle system
            serializationObject.activeParticleCount = this.activeParticleCount;
            serializationObject.randomTextureSize = this._randomTextureSize;
            serializationObject.minSize = this.minSize;
            serializationObject.maxSize = this.maxSize;
            serializationObject.minEmitPower = this.minEmitPower;
            serializationObject.maxEmitPower = this.maxEmitPower;
            serializationObject.minLifeTime = this.minLifeTime;
            serializationObject.maxLifeTime = this.maxLifeTime;
            serializationObject.emitRate = this.emitRate;
            serializationObject.gravity = this.gravity.asArray();
            serializationObject.color1 = this.color1.asArray();
            serializationObject.color2 = this.color2.asArray();
            serializationObject.colorDead = this.colorDead.asArray();
            serializationObject.updateSpeed = this.updateSpeed;
            serializationObject.targetStopDuration = this.targetStopDuration;
            serializationObject.blendMode = this.blendMode;

            // Emitter
            if (this.particleEmitterType) {
                serializationObject.particleEmitterType = this.particleEmitterType.serialize();
            }

            return serializationObject;            
        }

        /**
         * Parses a JSON object to create a GPU particle system.
         * @param parsedParticleSystem The JSON object to parse
         * @param scene The scene to create the particle system in
         * @param rootUrl The root url to use to load external dependencies like texture
         * @returns the parsed GPU particle system
         */
        public static Parse(parsedParticleSystem: any, scene: Scene, rootUrl: string): GPUParticleSystem {
            var name = parsedParticleSystem.name;
            var particleSystem = new GPUParticleSystem(name, {capacity: parsedParticleSystem.capacity, randomTextureSize: parsedParticleSystem.randomTextureSize}, scene);

            if (parsedParticleSystem.id) {
                particleSystem.id = parsedParticleSystem.id;
            }

            // Texture
            if (parsedParticleSystem.textureName) {
                particleSystem.particleTexture = new Texture(rootUrl + parsedParticleSystem.textureName, scene);
                particleSystem.particleTexture.name = parsedParticleSystem.textureName;
            }

            // Emitter
            if (parsedParticleSystem.emitterId) {
                particleSystem.emitter = scene.getLastMeshByID(parsedParticleSystem.emitterId);
            } else {
                particleSystem.emitter = Vector3.FromArray(parsedParticleSystem.emitter);
            }

            // Animations
            if (parsedParticleSystem.animations) {
                for (var animationIndex = 0; animationIndex < parsedParticleSystem.animations.length; animationIndex++) {
                    var parsedAnimation = parsedParticleSystem.animations[animationIndex];
                    particleSystem.animations.push(Animation.Parse(parsedAnimation));
                }
            }

            // Particle system
            particleSystem.activeParticleCount = parsedParticleSystem.activeParticleCount;
            particleSystem.minSize = parsedParticleSystem.minSize;
            particleSystem.maxSize = parsedParticleSystem.maxSize;
            particleSystem.minLifeTime = parsedParticleSystem.minLifeTime;
            particleSystem.maxLifeTime = parsedParticleSystem.maxLifeTime;
            particleSystem.minEmitPower = parsedParticleSystem.minEmitPower;
            particleSystem.maxEmitPower = parsedParticleSystem.maxEmitPower;
            particleSystem.emitRate = parsedParticleSystem.emitRate;
            particleSystem.gravity = Vector3.FromArray(parsedParticleSystem.gravity);
            particleSystem.color1 = Color4.FromArray(parsedParticleSystem.color1);
            particleSystem.color2 = Color4.FromArray(parsedParticleSystem.color2);
            particleSystem.colorDead = Color4.FromArray(parsedParticleSystem.colorDead);
            particleSystem.updateSpeed = parsedParticleSystem.updateSpeed;
            particleSystem.targetStopDuration = parsedParticleSystem.targetStopDuration;
            particleSystem.blendMode = parsedParticleSystem.blendMode;

            // Emitter
            if (parsedParticleSystem.particleEmitterType) {
                let emitterType: IParticleEmitterType;
                switch (parsedParticleSystem.particleEmitterType.type) {
                    case "SphereEmitter":
                        emitterType = new SphereParticleEmitter();
                        break;
                    case "SphereDirectedParticleEmitter":
                        emitterType = new SphereDirectedParticleEmitter();
                        break;
                    case "ConeEmitter":
                        emitterType = new ConeParticleEmitter();
                        break;
                    case "BoxEmitter":
                    default:
                        emitterType = new BoxParticleEmitter();
                        break;                                                
                }

                emitterType.parse(parsedParticleSystem.particleEmitterType);
                particleSystem.particleEmitterType = emitterType;
            }

            return particleSystem;
        }        
    }
}