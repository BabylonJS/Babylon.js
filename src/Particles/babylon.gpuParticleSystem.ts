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
        private _accumulatedCount = 0;
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
        private _randomTexture2: RawTexture;

        private _attributesStrideSize = 21;
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
         * Minimum scale of emitting particles on X axis.
         */
        public minScaleX = 1;
        /**
         * Maximum scale of emitting particles on X axis.
         */
        public maxScaleX = 1;        

        /**
         * Minimum scale of emitting particles on Y axis.
         */
        public minScaleY = 1;
        /**
         * Maximum scale of emitting particles on Y axis.
         */
        public maxScaleY = 1;           
        
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
         * Minimum angular speed of emitting particles (Z-axis rotation for each particle).
         */
        public minAngularSpeed = 0;
        /**
         * Maximum angular speed of emitting particles (Z-axis rotation for each particle).
         */
        public maxAngularSpeed = 0;

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

        private _preWarmDone = false;

        /** Gets or sets a value indicating how many cycles (or frames) must be executed before first rendering (this value has to be set before starting the system). Default is 0 */
        public preWarmCycles = 0;

        /** Gets or sets a value indicating the time step multiplier to use in pre-warm mode (default is 1) */
        public preWarmStepOffset = 1;        

        /**
         * Gets or sets the minimal initial rotation in radians.         
         */
        public minInitialRotation = 0;
        /**
         * Gets or sets the maximal initial rotation in radians.         
         */
        public maxInitialRotation = 0;            

        /**
         * Is this system ready to be used/rendered
         * @return true if the system is ready
         */
        public isReady(): boolean {
            if (!this._updateEffect) {
                this._recreateUpdateEffect();
                this._recreateRenderEffect();
                return false;
            }


            if (!this.emitter || !this._updateEffect.isReady() || !this._renderEffect.isReady() || !this.particleTexture || !this.particleTexture.isReady()) {
                return false;
            }

            return true;
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
            this._preWarmDone = false;
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
        
        private _isBillboardBased = true;

        /**
         * Gets or sets a boolean indicating if the particles must be rendered as billboard or aligned with the direction
         */
        public get isBillboardBased(): boolean {
            return this._isBillboardBased;
        }      
        
        public set isBillboardBased(value: boolean) {
            if (this._isBillboardBased === value) {
                return;
            }

            this._isBillboardBased = value;

            this._releaseBuffers();
        }        
        
        private _colorGradients: Nullable<Array<ColorGradient>> = null;
        private _colorGradientsTexture: RawTexture;

        /**
         * Gets the current list of color gradients.
         * You must use addColorGradient and removeColorGradient to udpate this list
         * @returns the list of color gradients
         */
        public getColorGradients(): Nullable<Array<ColorGradient>> {
            return this._colorGradients;
        }

        /**
         * Gets the current list of size gradients.
         * You must use addSizeGradient and removeSizeGradient to udpate this list
         * @returns the list of size gradients
         */
        public getSizeGradients(): Nullable<Array<FactorGradient>> {
            return this._sizeGradients;
        }               
        
        /**
         * Adds a new color gradient
         * @param gradient defines the gradient to use (between 0 and 1)
         * @param color defines the color to affect to the specified gradient
         * @param color2 defines an additional color used to define a range ([color, color2]) with main color to pick the final color from
         */
        public addColorGradient(gradient: number, color1: Color4, color2?: Color4): GPUParticleSystem {
            if (!this._colorGradients) {
                this._colorGradients = [];
            }

            let colorGradient = new ColorGradient();
            colorGradient.gradient = gradient;
            colorGradient.color1 = color1;
            this._colorGradients.push(colorGradient);

            this._colorGradients.sort((a, b) => {
                if (a.gradient < b.gradient) {
                    return -1;
                } else if (a.gradient > b.gradient) {
                    return 1;
                }

                return 0;
            });

            if (this._colorGradientsTexture) {
                this._colorGradientsTexture.dispose();
                (<any>this._colorGradientsTexture) = null;
            }

            this._releaseBuffers();            

            return this;
        }

        /**
         * Remove a specific color gradient
         * @param gradient defines the gradient to remove
         */
        public removeColorGradient(gradient: number): GPUParticleSystem {
            if (!this._colorGradients) {
                return this;
            }

            let index = 0;
            for (var colorGradient of this._colorGradients) {
                if (colorGradient.gradient === gradient) {
                    this._colorGradients.splice(index, 1);
                    break;
                }
                index++;
            }

            if (this._colorGradientsTexture) {
                this._colorGradientsTexture.dispose();
                (<any>this._colorGradientsTexture) = null;
            }            

            this._releaseBuffers();

            return this;
        }    
        
        private _sizeGradients: Nullable<Array<FactorGradient>> = null;
        private _sizeGradientsTexture: RawTexture;        
        
        /**
         * Adds a new size gradient
         * @param gradient defines the gradient to use (between 0 and 1)
         * @param factor defines the size factor to affect to the specified gradient
         */
        public addSizeGradient(gradient: number, factor: number): GPUParticleSystem {
            if (!this._sizeGradients) {
                this._sizeGradients = [];
            }

            let sizeGradient = new FactorGradient();
            sizeGradient.gradient = gradient;
            sizeGradient.factor = factor;
            this._sizeGradients.push(sizeGradient);

            this._sizeGradients.sort((a, b) => {
                if (a.gradient < b.gradient) {
                    return -1;
                } else if (a.gradient > b.gradient) {
                    return 1;
                }

                return 0;
            });

            if (this._sizeGradientsTexture) {
                this._sizeGradientsTexture.dispose();
                (<any>this._sizeGradientsTexture) = null;
            }

            this._releaseBuffers();                 

            return this;
        }

        /**
         * Remove a specific size gradient
         * @param gradient defines the gradient to remove
         */
        public removeSizeGradient(gradient: number): GPUParticleSystem {
            if (!this._sizeGradients) {
                return this;
            }

            let index = 0;
            for (var sizeGradient of this._sizeGradients) {
                if (sizeGradient.gradient === gradient) {
                    this._sizeGradients.splice(index, 1);
                    break;
                }
                index++;
            }

            if (this._sizeGradientsTexture) {
                this._sizeGradientsTexture.dispose();
                (<any>this._sizeGradientsTexture) = null;
            }

            this._releaseBuffers();               

            return this;
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

            var optionsAsNumber = <number>options;
            if (isFinite(optionsAsNumber)) {
                fullOptions.capacity = optionsAsNumber;
            }

            this._capacity = fullOptions.capacity;
            this._activeCount = fullOptions.capacity;
            this._currentActiveCount = 0;

            this._scene.particleSystems.push(this);

            this._updateEffectOptions = {
                attributes: ["position", "age", "life", "seed", "size", "color", "direction", "initialDirection", "angle", "initialSize"],
                uniformsNames: ["currentCount", "timeDelta", "emitterWM", "lifeTime", "color1", "color2", "sizeRange", "scaleRange","gravity", "emitPower",
                                "direction1", "direction2", "minEmitBox", "maxEmitBox", "radius", "directionRandomizer", "height", "coneAngle", "stopFactor", 
                                "angleRange", "radiusRange"],
                uniformBuffersNames: [],
                samplers:["randomSampler", "randomSampler2", "sizeGradientSampler"],
                defines: "",
                fallbacks: null,  
                onCompiled: null,
                onError: null,
                indexParameters: null,
                maxSimultaneousLights: 0,                                                      
                transformFeedbackVaryings: []
            };

            this.particleEmitterType = new BoxParticleEmitter();

            // Random data
            var maxTextureSize = Math.min(this._engine.getCaps().maxTextureSize, fullOptions.randomTextureSize);
            var d = [];
            for (var i = 0; i < maxTextureSize; ++i) {
                d.push(Math.random());
                d.push(Math.random());
                d.push(Math.random());
                d.push(Math.random());
            }
            this._randomTexture = new RawTexture(new Float32Array(d), maxTextureSize, 1, Engine.TEXTUREFORMAT_RGBA, this._scene, false, false, Texture.NEAREST_SAMPLINGMODE, Engine.TEXTURETYPE_FLOAT);
            this._randomTexture.wrapU = Texture.WRAP_ADDRESSMODE;
            this._randomTexture.wrapV = Texture.WRAP_ADDRESSMODE;

            d = [];
            for (var i = 0; i < maxTextureSize; ++i) {
                d.push(Math.random());
                d.push(Math.random());
                d.push(Math.random());
                d.push(Math.random());
            }
            this._randomTexture2 = new RawTexture(new Float32Array(d), maxTextureSize, 1, Engine.TEXTUREFORMAT_RGBA, this._scene, false, false, Texture.NEAREST_SAMPLINGMODE, Engine.TEXTURETYPE_FLOAT);
            this._randomTexture2.wrapU = Texture.WRAP_ADDRESSMODE;
            this._randomTexture2.wrapV = Texture.WRAP_ADDRESSMODE;

            this._randomTextureSize = maxTextureSize;
        }

        private _createUpdateVAO(source: Buffer): WebGLVertexArrayObject {            
            let updateVertexBuffers: {[key: string]: VertexBuffer} = {};
            updateVertexBuffers["position"] = source.createVertexBuffer("position", 0, 3);
            updateVertexBuffers["age"] = source.createVertexBuffer("age", 3, 1);
            updateVertexBuffers["life"] = source.createVertexBuffer("life", 4, 1);
            updateVertexBuffers["seed"] = source.createVertexBuffer("seed", 5, 4);
            updateVertexBuffers["size"] = source.createVertexBuffer("size", 9, 3);
            let offset = 12;
            if (this._sizeGradientsTexture) {
                updateVertexBuffers["initialSize"] = source.createVertexBuffer("initialSize", offset, 3);
                offset += 3;
            }

            if (!this._colorGradientsTexture) {
                updateVertexBuffers["color"] = source.createVertexBuffer("color", offset, 4);
                offset += 4;
            }

            updateVertexBuffers["direction"] = source.createVertexBuffer("direction", offset, 3);
            offset += 3

            if (!this._isBillboardBased) {
                updateVertexBuffers["initialDirection"] = source.createVertexBuffer("initialDirection", offset, 3);
                offset += 3;
            }

            updateVertexBuffers["angle"] = source.createVertexBuffer("angle", offset, 2);
           
            let vao = this._engine.recordVertexArrayObject(updateVertexBuffers, null, this._updateEffect);
            this._engine.bindArrayBuffer(null);

            return vao;
        }

        private _createRenderVAO(source: Buffer, spriteSource: Buffer): WebGLVertexArrayObject {            
            let renderVertexBuffers: {[key: string]: VertexBuffer} = {};
            renderVertexBuffers["position"] = source.createVertexBuffer("position", 0, 3, this._attributesStrideSize, true);
            renderVertexBuffers["age"] = source.createVertexBuffer("age", 3, 1, this._attributesStrideSize, true);
            renderVertexBuffers["life"] = source.createVertexBuffer("life", 4, 1, this._attributesStrideSize, true);
            renderVertexBuffers["size"] = source.createVertexBuffer("size", 9, 3, this._attributesStrideSize, true);      
            
            let offset = 12;
            if (this._sizeGradientsTexture) {
                offset += 3;
            }

            if (!this._colorGradientsTexture) {
                renderVertexBuffers["color"] = source.createVertexBuffer("color", offset, 4, this._attributesStrideSize, true);
                offset += 4;
            }
            
            offset += 3; // Direction

            if (!this._isBillboardBased) {
                renderVertexBuffers["initialDirection"] = source.createVertexBuffer("initialDirection", offset, 3, this._attributesStrideSize, true);
                offset += 3;
            }
            renderVertexBuffers["angle"] = source.createVertexBuffer("angle", offset, 2, this._attributesStrideSize, true);

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

            if (!this.isBillboardBased) {
                this._attributesStrideSize += 3;
            }

            if (this._colorGradientsTexture) {
                this._attributesStrideSize -= 4;
            }

            if (this._sizeGradientsTexture) {
                this._attributesStrideSize += 3;
            }

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
                data.push(Math.random());
                data.push(Math.random());
                data.push(Math.random());

                // Size
                data.push(0.0);
                data.push(0.0);
                data.push(0.0);

                if (this._sizeGradientsTexture) {
                    data.push(0.0);
                    data.push(0.0);
                    data.push(0.0);  
                }                

                if (!this._colorGradientsTexture) {
                    // color
                    data.push(0.0);
                    data.push(0.0);
                    data.push(0.0);                     
                    data.push(0.0); 
                }

                // direction
                data.push(0.0);
                data.push(0.0);
                data.push(0.0);  

                if (!this.isBillboardBased) {
                    // initialDirection
                    data.push(0.0);
                    data.push(0.0);
                    data.push(0.0);  
                }

                // angle
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

        /** @hidden */
        public _recreateUpdateEffect() {
            let defines = this.particleEmitterType ? this.particleEmitterType.getEffectDefines() : "";

            if (this._isBillboardBased) {
                defines += "\n#define BILLBOARD";
            }   

            if (this._colorGradientsTexture) {
                defines += "\n#define COLORGRADIENTS";
            }        
            
            if (this._sizeGradientsTexture) {
                defines += "\n#define SIZEGRADIENTS";
            }                 

            if (this._updateEffect && this._updateEffectOptions.defines === defines) {
                return;
            }

            this._updateEffectOptions.transformFeedbackVaryings = ["outPosition", "outAge", "outLife", "outSeed", "outSize"];           

            if (this._sizeGradientsTexture) {
                this._updateEffectOptions.transformFeedbackVaryings.push("outInitialSize");
            }

            if (!this._colorGradientsTexture) {
                this._updateEffectOptions.transformFeedbackVaryings.push("outColor");
            }

            this._updateEffectOptions.transformFeedbackVaryings.push("outDirection");

            if (!this._isBillboardBased) {
                this._updateEffectOptions.transformFeedbackVaryings.push("outInitialDirection");
            }

            this._updateEffectOptions.transformFeedbackVaryings.push("outAngle");

            this._updateEffectOptions.defines = defines;
            this._updateEffect = new Effect("gpuUpdateParticles", this._updateEffectOptions, this._scene.getEngine());   
        }

        /** @hidden */
        public _recreateRenderEffect() {
            let defines = "";
            if (this._scene.clipPlane) {
                defines = "\n#define CLIPPLANE";
            }

            if (this._isBillboardBased) {
                defines += "\n#define BILLBOARD";
            }         
            
            if (this._colorGradientsTexture) {
                defines += "\n#define COLORGRADIENTS";
            }   

            if (this._renderEffect && this._renderEffect.defines === defines) {
                return;
            }

            this._renderEffect = new Effect("gpuRenderParticles", 
                                            ["position", "age", "life", "size", "color", "offset", "uv", "initialDirection", "angle"], 
                                            ["view", "projection", "colorDead", "invView", "vClipPlane"], 
                                            ["textureSampler", "colorGradientSampler"], this._scene.getEngine(), defines);
        }        

        /**
         * Animates the particle system for the current frame by emitting new particles and or animating the living ones.
         * @param preWarm defines if we are in the pre-warmimg phase
         */
        public animate(preWarm = false): void {           
            this._timeDelta = this.updateSpeed * (preWarm ? this.preWarmStepOffset : this._scene.getAnimationRatio());
            this._actualFrame += this._timeDelta;

            if (!this._stopped) {
                if (this.targetStopDuration && this._actualFrame >= this.targetStopDuration) {
                    this.stop();
                }
            }             
        }    

        private _createSizeGradientTexture() {
            if (!this._sizeGradients || !this._sizeGradients.length || this._sizeGradientsTexture) {
                return;
            }

            let textureWidth = 256;
            let data = new Float32Array(textureWidth);

            for (var x = 0; x < textureWidth; x++) {
                var ratio = x / textureWidth;

                Tools.GetCurrentGradient(ratio, this._sizeGradients, (currentGradient, nextGradient, scale) => {
                    data[x] = Scalar.Lerp((<FactorGradient>currentGradient).factor, (<FactorGradient>nextGradient).factor, scale);
                });
            }

            this._sizeGradientsTexture = RawTexture.CreateRTexture(data, textureWidth, 1, this._scene, false, false, Texture.NEAREST_SAMPLINGMODE);
        }        
            
        private _createColorGradientTexture() {
            if (!this._colorGradients || !this._colorGradients.length || this._colorGradientsTexture) {
                return;
            }

            let textureWidth = 256;
            let data = new Uint8Array(textureWidth * 4);
            let tmpColor = Tmp.Color4[0];

            for (var x = 0; x < textureWidth; x++) {
                var ratio = x / textureWidth;

                Tools.GetCurrentGradient(ratio, this._colorGradients, (currentGradient, nextGradient, scale) => {

                    Color4.LerpToRef((<ColorGradient>currentGradient).color1, (<ColorGradient>nextGradient).color1, scale, tmpColor);
                    data[x * 4] = tmpColor.r * 255;
                    data[x * 4 + 1] = tmpColor.g * 255;
                    data[x * 4 + 2] = tmpColor.b * 255;
                    data[x * 4 + 3] = tmpColor.a * 255;
                });

            }

            this._colorGradientsTexture = RawTexture.CreateRGBATexture(data, textureWidth, 1, this._scene, false, false, Texture.NEAREST_SAMPLINGMODE);
        }

        /**
         * Renders the particle system in its current state
         * @param preWarm defines if the system should only update the particles but not render them
         * @returns the current number of particles
         */
        public render(preWarm = false): number {
            if (!this._started) {
                return 0;
            }

            this._createColorGradientTexture();
            this._createSizeGradientTexture();

            this._recreateUpdateEffect();
            this._recreateRenderEffect();

            if (!this.isReady()) {
                return 0;
            }

            if (!preWarm) {
                if (!this._preWarmDone && this.preWarmCycles) {                
                    for (var index = 0; index < this.preWarmCycles; index++) {
                        this.animate(true);
                        this.render(true);
                    }

                    this._preWarmDone = true;
                }

                if (this._currentRenderId === this._scene.getRenderId()) {
                    return 0;
                }

                this._currentRenderId = this._scene.getRenderId();      
            }
            
            // Get everything ready to render
            this._initialize();

            this._accumulatedCount += this.emitRate * this._timeDelta;
            if (this._accumulatedCount > 1) {
                var intPart = this._accumulatedCount | 0;
                this._accumulatedCount -= intPart;
                this._currentActiveCount = Math.min(this._activeCount, this._currentActiveCount + intPart);
            }

            if (!this._currentActiveCount) {
                return 0;
            }
            
            // Enable update effect
            this._engine.enableEffect(this._updateEffect);
            this._engine.setState(false);    
            
            this._updateEffect.setFloat("currentCount", this._currentActiveCount);
            this._updateEffect.setFloat("timeDelta", this._timeDelta);
            this._updateEffect.setFloat("stopFactor", this._stopped ? 0 : 1);
            this._updateEffect.setTexture("randomSampler", this._randomTexture);
            this._updateEffect.setTexture("randomSampler2", this._randomTexture2);
            this._updateEffect.setFloat2("lifeTime", this.minLifeTime, this.maxLifeTime);
            this._updateEffect.setFloat2("emitPower", this.minEmitPower, this.maxEmitPower);
            if (!this._colorGradientsTexture) {            
                this._updateEffect.setDirectColor4("color1", this.color1);
                this._updateEffect.setDirectColor4("color2", this.color2);
            }
            this._updateEffect.setFloat2("sizeRange", this.minSize, this.maxSize);
            this._updateEffect.setFloat4("scaleRange", this.minScaleX, this.maxScaleX, this.minScaleY, this.maxScaleY);
            this._updateEffect.setFloat4("angleRange", this.minAngularSpeed, this.maxAngularSpeed, this.minInitialRotation, this.maxInitialRotation);
            this._updateEffect.setVector3("gravity", this.gravity);

            if (this._sizeGradientsTexture) {      
                this._updateEffect.setTexture("sizeGradientSampler", this._sizeGradientsTexture);      
            }

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

            if (!preWarm) {
                // Enable render effect
                this._engine.enableEffect(this._renderEffect);
                let viewMatrix = this._scene.getViewMatrix();
                this._renderEffect.setMatrix("view", viewMatrix);
                this._renderEffect.setMatrix("projection", this._scene.getProjectionMatrix());
                this._renderEffect.setTexture("textureSampler", this.particleTexture);
                if (this._colorGradientsTexture) {
                    this._renderEffect.setTexture("colorGradientSampler", this._colorGradientsTexture);
                } else {
                    this._renderEffect.setDirectColor4("colorDead", this.colorDead);
                }


                if (this._scene.clipPlane) {
                    var clipPlane = this._scene.clipPlane;
                    var invView = viewMatrix.clone();
                    invView.invert();
                    this._renderEffect.setMatrix("invView", invView);
                    this._renderEffect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
                }            

                // Draw order
                switch(this.blendMode)
                {
                    case ParticleSystem.BLENDMODE_ADD:
                        this._engine.setAlphaMode(Engine.ALPHA_ADD);
                        break;
                    case ParticleSystem.BLENDMODE_ONEONE:
                        this._engine.setAlphaMode(Engine.ALPHA_ONEONE);
                        break;
                    case ParticleSystem.BLENDMODE_STANDARD:
                        this._engine.setAlphaMode(Engine.ALPHA_COMBINE);
                        break;
                }      

                if (this.forceDepthWrite) {
                    this._engine.setDepthWrite(true);
                }

                // Bind source VAO
                this._engine.bindVertexArrayObject(this._renderVAO[this._targetIndex], null);

                // Render
                this._engine.drawArraysType(Material.TriangleFanDrawMode, 0, 4, this._currentActiveCount);   
                this._engine.setAlphaMode(Engine.ALPHA_DISABLE);         
            }
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
            if (!this._updateVAO) {
                return;
            }
            
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

            if (this._colorGradientsTexture) {
                this._colorGradientsTexture.dispose();
                (<any>this._colorGradientsTexture) = null;
            }

            if (this._sizeGradientsTexture) {
                this._sizeGradientsTexture.dispose();
                (<any>this._sizeGradientsTexture) = null;
            }            
         
            if (this._randomTexture) {
                this._randomTexture.dispose();
                (<any>this._randomTexture) = null;
            }

            if (this._randomTexture2) {
                this._randomTexture2.dispose();
                (<any>this._randomTexture2) = null;
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

            ParticleSystem._Serialize(serializationObject, this);

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

            particleSystem.activeParticleCount = parsedParticleSystem.activeParticleCount;
            ParticleSystem._Parse(parsedParticleSystem, particleSystem, scene, rootUrl);

            return particleSystem;
        }        
    }
}