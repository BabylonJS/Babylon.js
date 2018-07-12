module BABYLON {

    /**
     * This represents a particle system in Babylon.
     * Particles are often small sprites used to simulate hard-to-reproduce phenomena like fire, smoke, water, or abstract visual effects like magic glitter and faery dust.
     * Particles can take different shapes while emitted like box, sphere, cone or you can write your custom function.
     * @example https://doc.babylonjs.com/babylon101/particles
     */
    export class ParticleSystem implements IDisposable, IAnimatable, IParticleSystem {
        /**
         * Source color is added to the destination color without alpha affecting the result.
         */
        public static BLENDMODE_ONEONE = 0;
        /**
         * Blend current color and particle color using particle’s alpha.
         */
        public static BLENDMODE_STANDARD = 1;

        /**
         * Add current color and particle color multiplied by particle’s alpha.
         */
        public static BLENDMODE_ADD = 2;

        /**
         * List of animations used by the particle system.
         */
        public animations: Animation[] = [];

        /**
         * The id of the Particle system.
         */
        public id: string;

        /**
         * The friendly name of the Particle system.
         */
        public name: string;

        /**
         * The rendering group used by the Particle system to chose when to render.
         */
        public renderingGroupId = 0;

        /**
         * The emitter represents the Mesh or position we are attaching the particle system to.
         */
        public emitter: Nullable<AbstractMesh | Vector3> = null;

        /**
         * The maximum number of particles to emit per frame
         */
        public emitRate = 10;

        /**
         * If you want to launch only a few particles at once, that can be done, as well.
         */
        public manualEmitCount = -1;

        /**
         * The overall motion speed (0.01 is default update speed, faster updates = faster animation)
         */
        public updateSpeed = 0.01;

        /**
         * The amount of time the particle system is running (depends of the overall update speed).
         */
        public targetStopDuration = 0;

        /**
         * Specifies whether the particle system will be disposed once it reaches the end of the animation.
         */
        public disposeOnStop = false;

        /**
         * Minimum power of emitting particles.
         */
        public minEmitPower = 1;
        /**
         * Maximum power of emitting particles.
         */
        public maxEmitPower = 1;

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
         * Gets or sets the minimal initial rotation in radians.         
         */
        public minInitialRotation = 0;
        /**
         * Gets or sets the maximal initial rotation in radians.         
         */
        public maxInitialRotation = 0;             

        /**
         * Minimum angular speed of emitting particles (Z-axis rotation for each particle).
         */
        public minAngularSpeed = 0;
        /**
         * Maximum angular speed of emitting particles (Z-axis rotation for each particle).
         */
        public maxAngularSpeed = 0;

        /**
         * The texture used to render each particle. (this can be a spritesheet)
         */
        public particleTexture: Nullable<Texture>;

        /**
         * The layer mask we are rendering the particles through.
         */
        public layerMask: number = 0x0FFFFFFF;

        /**
         * This can help using your own shader to render the particle system.
         * The according effect will be created 
         */
        public customShader: any = null;

        /**
         * By default particle system starts as soon as they are created. This prevents the 
         * automatic start to happen and let you decide when to start emitting particles.
         */
        public preventAutoStart: boolean = false;

        /**
         * This function can be defined to provide custom update for active particles.
         * This function will be called instead of regular update (age, position, color, etc.).
         * Do not forget that this function will be called on every frame so try to keep it simple and fast :)
         */
        public updateFunction: (particles: Particle[]) => void;

        /**
         * Callback triggered when the particle animation is ending.
         */
        public onAnimationEnd: Nullable<() => void> = null;

        /**
         * Blend mode use to render the particle, it can be either ParticleSystem.BLENDMODE_ONEONE or ParticleSystem.BLENDMODE_STANDARD.
         */
        public blendMode = ParticleSystem.BLENDMODE_ONEONE;

        /**
         * Forces the particle to write their depth information to the depth buffer. This can help preventing other draw calls
         * to override the particles.
         */
        public forceDepthWrite = false;

        /**
         * You can use gravity if you want to give an orientation to your particles.
         */
        public gravity = Vector3.Zero();

        private _colorGradients: Nullable<Array<ColorGradient>> = null;
        private _sizeGradients: Nullable<Array<FactorGradient>> = null;
        private _lifeTimeGradients: Nullable<Array<FactorGradient>> = null;
        private _angularSpeedGradients: Nullable<Array<FactorGradient>> = null;
        private _velocityGradients: Nullable<Array<FactorGradient>> = null;

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
         * Gets the current list of life time gradients.
         * You must use addLifeTimeGradient and removeLifeTimeGradient to udpate this list
         * @returns the list of life time gradients
         */
        public getLifeTimeGradients(): Nullable<Array<FactorGradient>> {
            return this._lifeTimeGradients;
        }   
        
        /**
         * Gets the current list of angular speed gradients.
         * You must use addAngularSpeedGradient and removeAngularSpeedGradient to udpate this list
         * @returns the list of angular speed gradients
         */
        public getAngularSpeedGradients(): Nullable<Array<FactorGradient>> {
            return this._angularSpeedGradients;
        } 

        /**
         * Gets the current list of velocity gradients.
         * You must use addVelocityGradient and removeVelocityGradient to udpate this list
         * @returns the list of velocity gradients
         */
        public getVelocityGradients(): Nullable<Array<FactorGradient>> {
            return this._velocityGradients;
        }         

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
         * Random color of each particle after it has been emitted, between color1 and color2 vectors
         */
        public color1 = new Color4(1.0, 1.0, 1.0, 1.0);
        /**
         * Random color of each particle after it has been emitted, between color1 and color2 vectors
         */
        public color2 = new Color4(1.0, 1.0, 1.0, 1.0);
        /**
         * Color the particle will have at the end of its lifetime
         */
        public colorDead = new Color4(0, 0, 0, 1.0);

        /**
         * An optional mask to filter some colors out of the texture, or filter a part of the alpha channel
         */
        public textureMask = new Color4(1.0, 1.0, 1.0, 1.0);

        /**
         * The particle emitter type defines the emitter used by the particle system.
         * It can be for example box, sphere, or cone...
         */
        public particleEmitterType: IParticleEmitterType;

        /**
         * This function can be defined to specify initial direction for every new particle.
         * It by default use the emitterType defined function
         */
        public startDirectionFunction: (worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle) => void;
        /**
         * This function can be defined to specify initial position for every new particle.
         * It by default use the emitterType defined function
         */
        public startPositionFunction: (worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle) => void;

        /**
         * If using a spritesheet (isAnimationSheetEnabled) defines the speed of the sprite loop (default is 1 meaning the animation will play once during the entire particle lifetime)
         */
        public spriteCellChangeSpeed = 1;
        /**
         * If using a spritesheet (isAnimationSheetEnabled) defines the first sprite cell to display
         */
        public startSpriteCellID = 0;
        /**
         * If using a spritesheet (isAnimationSheetEnabled) defines the last sprite cell to display
         */
        public endSpriteCellID = 0;
        /**
         * If using a spritesheet (isAnimationSheetEnabled), defines the sprite cell width to use
         */
        public spriteCellWidth = 0;
        /**
         * If using a spritesheet (isAnimationSheetEnabled), defines the sprite cell height to use
         */
        public spriteCellHeight = 0;

        /** Gets or sets a value indicating how many cycles (or frames) must be executed before first rendering (this value has to be set before starting the system). Default is 0 */
        public preWarmCycles = 0;

        /** Gets or sets a value indicating the time step multiplier to use in pre-warm mode (default is 1) */
        public preWarmStepOffset = 1;

        /** Gets or sets a Vector2 used to move the pivot (by default (0,0)) */
        public translationPivot = new Vector2(0, 0);

        /**
        * An event triggered when the system is disposed
        */
        public onDisposeObservable = new Observable<ParticleSystem>();

        private _onDisposeObserver: Nullable<Observer<ParticleSystem>>;
        /**
         * Sets a callback that will be triggered when the system is disposed
         */
        public set onDispose(callback: () => void) {
            if (this._onDisposeObserver) {
                this.onDisposeObservable.remove(this._onDisposeObserver);
            }
            this._onDisposeObserver = this.onDisposeObservable.add(callback);
        }

        /**
         * Gets whether an animation sprite sheet is enabled or not on the particle system
         */
        public get isAnimationSheetEnabled(): boolean {
            return this._isAnimationSheetEnabled;
        }

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
            this._resetEffect();
        }     
        
        /**
         * Gets or sets the billboard mode to use when isBillboardBased = true.
         * Only BABYLON.AbstractMesh.BILLBOARDMODE_ALL and AbstractMesh.BILLBOARDMODE_Y are supported so far
         */
        public billboardMode = AbstractMesh.BILLBOARDMODE_ALL;

        private _particles = new Array<Particle>();
        private _epsilon: number;
        private _capacity: number;
        private _scene: Scene;
        private _stockParticles = new Array<Particle>();
        private _newPartsExcess = 0;
        private _vertexData: Float32Array;
        private _vertexBuffer: Nullable<Buffer>;
        private _vertexBuffers: { [key: string]: VertexBuffer } = {};
        private _spriteBuffer: Nullable<Buffer>;
        private _indexBuffer: Nullable<WebGLBuffer>;
        private _effect: Effect;
        private _customEffect: Nullable<Effect>;
        private _cachedDefines: string;
        private _scaledColorStep = new Color4(0, 0, 0, 0);
        private _colorDiff = new Color4(0, 0, 0, 0);
        private _scaledDirection = Vector3.Zero();
        private _scaledGravity = Vector3.Zero();
        private _currentRenderId = -1;
        private _alive: boolean;
        private _useInstancing = false;

        private _started = false;
        private _stopped = false;
        private _actualFrame = 0;
        private _scaledUpdateSpeed: number;
        private _vertexBufferSize: number;
        private _isAnimationSheetEnabled: boolean;
        private _isBillboardBased = true;

        // end of sheet animation

        // Sub-emitters
        /**
         * this is the Sub-emitters templates that will be used to generate particle system when the particle dies, this property is used by the root particle system only.
         */
        public subEmitters: ParticleSystem[];
        /**
        * The current active Sub-systems, this property is used by the root particle system only.
        */
        public activeSubSystems: Array<ParticleSystem>;
        
        private _rootParticleSystem: ParticleSystem;
        //end of Sub-emitter

        /**
         * Gets the current list of active particles
         */
        public get particles(): Particle[] {
            return this._particles;
        }

        /**
         * Returns the string "ParticleSystem"
         * @returns a string containing the class name
         */
        public getClassName(): string {
            return "ParticleSystem";
        }        

        /**
         * Instantiates a particle system.
         * Particles are often small sprites used to simulate hard-to-reproduce phenomena like fire, smoke, water, or abstract visual effects like magic glitter and faery dust.
         * @param name The name of the particle system
         * @param capacity The max number of particles alive at the same time
         * @param scene The scene the particle system belongs to
         * @param customEffect a custom effect used to change the way particles are rendered by default
         * @param isAnimationSheetEnabled Must be true if using a spritesheet to animate the particles texture
         * @param epsilon Offset used to render the particles
         */
        constructor(name: string, capacity: number, scene: Scene, customEffect: Nullable<Effect> = null, isAnimationSheetEnabled: boolean = false, epsilon: number = 0.01) {
            this.id = name;
            this.name = name;

            this._capacity = capacity;

            this._epsilon = epsilon;
            this._isAnimationSheetEnabled = isAnimationSheetEnabled;

            this._scene = scene || Engine.LastCreatedScene;

            this._customEffect = customEffect;

            scene.particleSystems.push(this);

            this._useInstancing = this._scene.getEngine().getCaps().instancedArrays;

            this._createIndexBuffer();
            this._createVertexBuffers();

            // Default emitter type
            this.particleEmitterType = new BoxParticleEmitter();

            this.updateFunction = (particles: Particle[]): void => {
                for (var index = 0; index < particles.length; index++) {
                    var particle = particles[index];
                    particle.age += this._scaledUpdateSpeed;

                    if (particle.age >= particle.lifeTime) { // Recycle by swapping with last particle
                        this._emitFromParticle(particle);
                        this.recycleParticle(particle);
                        index--;
                        continue;
                    }
                    else {
                        let ratio = particle.age / particle.lifeTime;

                        // Color
                        if (this._colorGradients && this._colorGradients.length > 0) {
                            Tools.GetCurrentGradient(ratio, this._colorGradients, (currentGradient, nextGradient, scale) => {
                                if (currentGradient !== particle._currentColorGradient) {
                                    particle._currentColor1.copyFrom(particle._currentColor2);
                                    (<ColorGradient>nextGradient).getColorToRef(particle._currentColor2);    
                                    particle._currentColorGradient = (<ColorGradient>currentGradient);
                                }
                                Color4.LerpToRef(particle._currentColor1, particle._currentColor2, scale, particle.color);
                            });
                        }
                        else {
                            particle.colorStep.scaleToRef(this._scaledUpdateSpeed, this._scaledColorStep);
                            particle.color.addInPlace(this._scaledColorStep);

                            if (particle.color.a < 0) {
                                particle.color.a = 0;
                            }
                        }

                        if (this._angularSpeedGradients && this._angularSpeedGradients.length > 0) {                  
                            Tools.GetCurrentGradient(ratio, this._angularSpeedGradients, (currentGradient, nextGradient, scale) => {
                                if (currentGradient !== particle._currentAngularSpeedGradient) {
                                    particle._currentAngularSpeed1 = particle._currentAngularSpeed2;
                                    particle._currentAngularSpeed2 = (<FactorGradient>nextGradient).getFactor();    
                                    particle._currentAngularSpeedGradient = (<FactorGradient>currentGradient);
                                }                                
                                particle.angularSpeed = Scalar.Lerp(particle._currentAngularSpeed1, particle._currentAngularSpeed2, scale);
                            });
                        }                        
                        particle.angle += particle.angularSpeed * this._scaledUpdateSpeed;

                        let directionScale = this._scaledUpdateSpeed;
                        if (this._velocityGradients && this._velocityGradients.length > 0) {                  
                            Tools.GetCurrentGradient(ratio, this._velocityGradients, (currentGradient, nextGradient, scale) => {
                                if (currentGradient !== particle._currentVelocityGradient) {
                                    particle._currentVelocity1 = particle._currentVelocity2;
                                    particle._currentVelocity2 = (<FactorGradient>nextGradient).getFactor();    
                                    particle._currentVelocityGradient = (<FactorGradient>currentGradient);
                                }                                
                                directionScale *= Scalar.Lerp(particle._currentVelocity1, particle._currentVelocity2, scale);
                            });
                        }                          
                        particle.direction.scaleToRef(directionScale, this._scaledDirection);
                        particle.position.addInPlace(this._scaledDirection);

                        this.gravity.scaleToRef(this._scaledUpdateSpeed, this._scaledGravity);
                        particle.direction.addInPlace(this._scaledGravity);

                        // Size
                        if (this._sizeGradients && this._sizeGradients.length > 0) {                  
                            Tools.GetCurrentGradient(ratio, this._sizeGradients, (currentGradient, nextGradient, scale) => {
                                if (currentGradient !== particle._currentSizeGradient) {
                                    particle._currentSize1 = particle._currentSize2;
                                    particle._currentSize2 = (<FactorGradient>nextGradient).getFactor();    
                                    particle._currentSizeGradient = (<FactorGradient>currentGradient);
                                }                                
                                particle.size = Scalar.Lerp(particle._currentSize1, particle._currentSize2, scale);
                            });
                        }

                        if (this._isAnimationSheetEnabled) {
                            particle.updateCellIndex();
                        }
                    }
                }
            }
        }

        private _addFactorGradient(factorGradients: FactorGradient[], gradient: number, factor: number, factor2?: number) {
            let newGradient = new FactorGradient();
            newGradient.gradient = gradient;
            newGradient.factor1 = factor;
            newGradient.factor2 = factor2;
            factorGradients.push(newGradient);

            factorGradients.sort((a, b) => {
                if (a.gradient < b.gradient) {
                    return -1;
                } else if (a.gradient > b.gradient) {
                    return 1;
                }

                return 0;
            });            
        }

        private _removeFactorGradient(factorGradients: Nullable<FactorGradient[]>, gradient: number) {
            if (!factorGradients) {
                return;
            }

            let index = 0;
            for (var factorGradient of factorGradients) {
                if (factorGradient.gradient === gradient) {
                    factorGradients.splice(index, 1);
                    break;
                }
                index++;
            }
        }

        /**
         * Adds a new life time gradient
         * @param gradient defines the gradient to use (between 0 and 1)
         * @param factor defines the life time factor to affect to the specified gradient         
         * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
         * @returns the current particle system
         */
        public addLifeTimeGradient(gradient: number, factor: number, factor2?: number): ParticleSystem {
            if (!this._lifeTimeGradients) {
                this._lifeTimeGradients = [];
            }

            this._addFactorGradient(this._lifeTimeGradients, gradient, factor, factor2);

            return this;
        }

        /**
         * Remove a specific life time gradient
         * @param gradient defines the gradient to remove
         * @returns the current particle system
         */
        public removeLifeTimeGradient(gradient: number): ParticleSystem {
            this._removeFactorGradient(this._lifeTimeGradients, gradient);

            return this;
        }       

        /**
         * Adds a new size gradient
         * @param gradient defines the gradient to use (between 0 and 1)
         * @param factor defines the size factor to affect to the specified gradient         
         * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
         * @returns the current particle system
         */
        public addSizeGradient(gradient: number, factor: number, factor2?: number): ParticleSystem {
            if (!this._sizeGradients) {
                this._sizeGradients = [];
            }

            this._addFactorGradient(this._sizeGradients, gradient, factor, factor2);

            return this;
        }

        /**
         * Remove a specific size gradient
         * @param gradient defines the gradient to remove
         * @returns the current particle system
         */
        public removeSizeGradient(gradient: number): ParticleSystem {
            this._removeFactorGradient(this._sizeGradients, gradient);

            return this;
        }        

        /**
         * Adds a new angular speed gradient
         * @param gradient defines the gradient to use (between 0 and 1)
         * @param factor defines the size factor to affect to the specified gradient         
         * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
         * @returns the current particle system
         */
        public addAngularSpeedGradient(gradient: number, factor: number, factor2?: number): ParticleSystem {
            if (!this._angularSpeedGradients) {
                this._angularSpeedGradients = [];
            }

            this._addFactorGradient(this._angularSpeedGradients, gradient, factor, factor2);

            return this;
        }

        /**
         * Remove a specific angular speed gradient
         * @param gradient defines the gradient to remove
         * @returns the current particle system
         */
        public removeAngularSpeedGradient(gradient: number): ParticleSystem {
            this._removeFactorGradient(this._angularSpeedGradients, gradient);

            return this;
        }          
        
        /**
         * Adds a new velocity gradient
         * @param gradient defines the gradient to use (between 0 and 1)
         * @param factor defines the size factor to affect to the specified gradient         
         * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
         * @returns the current particle system
         */
        public addVelocityGradient(gradient: number, factor: number, factor2?: number): ParticleSystem {
            if (!this._velocityGradients) {
                this._velocityGradients = [];
            }

            this._addFactorGradient(this._velocityGradients, gradient, factor, factor2);

            return this;
        }

        /**
         * Remove a specific velocity gradient
         * @param gradient defines the gradient to remove
         * @returns the current particle system
         */
        public removeVelocityGradient(gradient: number): ParticleSystem {
            this._removeFactorGradient(this._velocityGradients, gradient);

            return this;
        }         

        /**
         * Adds a new color gradient
         * @param gradient defines the gradient to use (between 0 and 1)
         * @param color defines the color to affect to the specified gradient
         * @param color2 defines an additional color used to define a range ([color, color2]) with main color to pick the final color from
         */
        public addColorGradient(gradient: number, color: Color4, color2?: Color4): ParticleSystem {
            if (!this._colorGradients) {
                this._colorGradients = [];
            }

            let colorGradient = new ColorGradient();
            colorGradient.gradient = gradient;
            colorGradient.color1 = color;
            colorGradient.color2 = color2;
            this._colorGradients.push(colorGradient);

            this._colorGradients.sort((a, b) => {
                if (a.gradient < b.gradient) {
                    return -1;
                } else if (a.gradient > b.gradient) {
                    return 1;
                }

                return 0;
            });

            return this;
        }

        /**
         * Remove a specific color gradient
         * @param gradient defines the gradient to remove
         */
        public removeColorGradient(gradient: number): ParticleSystem {
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

            return this;
        }

        private _resetEffect() {
            if (this._vertexBuffer) {
                this._vertexBuffer.dispose();
                this._vertexBuffer = null;
            }

            if (this._spriteBuffer) {
                this._spriteBuffer.dispose();
                this._spriteBuffer = null;
            }            

            this._createVertexBuffers();           
        }

        private _createVertexBuffers() {
            this._vertexBufferSize = this._useInstancing ? 10 : 12;
            if (this._isAnimationSheetEnabled) {
                this._vertexBufferSize += 1;
            }

            if (!this._isBillboardBased) {
                this._vertexBufferSize += 3;
            }

            let engine = this._scene.getEngine();
            this._vertexData = new Float32Array(this._capacity * this._vertexBufferSize * (this._useInstancing ? 1 : 4));
            this._vertexBuffer = new Buffer(engine, this._vertexData, true, this._vertexBufferSize);

            let dataOffset = 0;        
            var positions = this._vertexBuffer.createVertexBuffer(VertexBuffer.PositionKind, dataOffset, 3, this._vertexBufferSize, this._useInstancing);
            this._vertexBuffers[VertexBuffer.PositionKind] = positions;
            dataOffset += 3;

            var colors = this._vertexBuffer.createVertexBuffer(VertexBuffer.ColorKind, dataOffset, 4, this._vertexBufferSize, this._useInstancing);
            this._vertexBuffers[VertexBuffer.ColorKind] = colors;
            dataOffset += 4;

            var options = this._vertexBuffer.createVertexBuffer("angle", dataOffset, 1, this._vertexBufferSize, this._useInstancing);
            this._vertexBuffers["angle"] = options;
            dataOffset += 1;
            
            var size = this._vertexBuffer.createVertexBuffer("size", dataOffset, 2, this._vertexBufferSize, this._useInstancing);
            this._vertexBuffers["size"] = size;
            dataOffset += 2;

            if (this._isAnimationSheetEnabled) {
                var cellIndexBuffer = this._vertexBuffer.createVertexBuffer("cellIndex", dataOffset, 1, this._vertexBufferSize, this._useInstancing);
                this._vertexBuffers["cellIndex"] = cellIndexBuffer;
                dataOffset += 1;
            }

            if (!this._isBillboardBased) {
                var directionBuffer = this._vertexBuffer.createVertexBuffer("direction", dataOffset, 3, this._vertexBufferSize, this._useInstancing);
                this._vertexBuffers["direction"] = directionBuffer;
                dataOffset += 3;
            }

            var offsets: VertexBuffer;
            if (this._useInstancing) {
                var spriteData = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);  
                this._spriteBuffer = new Buffer(engine, spriteData, false, 2);  
                offsets = this._spriteBuffer.createVertexBuffer("offset", 0, 2);
            } else {
                offsets = this._vertexBuffer.createVertexBuffer("offset", dataOffset, 2, this._vertexBufferSize, this._useInstancing);
                dataOffset += 2;
            }
            this._vertexBuffers["offset"] = offsets;              
        }

        private _createIndexBuffer() {
            if (this._useInstancing) {
                return;
            }
            var indices = [];
            var index = 0;
            for (var count = 0; count < this._capacity; count++) {
                indices.push(index);
                indices.push(index + 1);
                indices.push(index + 2);
                indices.push(index);
                indices.push(index + 2);
                indices.push(index + 3);
                index += 4;
            }

            this._indexBuffer = this._scene.getEngine().createIndexBuffer(indices);
        }

        /**
         * Gets the maximum number of particles active at the same time.
         * @returns The max number of active particles.
         */
        public getCapacity(): number {
            return this._capacity;
        }

        /**
         * Gets Wether there are still active particles in the system.
         * @returns True if it is alive, otherwise false.
         */
        public isAlive(): boolean {
            return this._alive;
        }

        /**
         * Gets Wether the system has been started.
         * @returns True if it has been started, otherwise false.
         */
        public isStarted(): boolean {
            return this._started;
        }

        /**
         * Starts the particle system and begins to emit
         * @param delay defines the delay in milliseconds before starting the system (0 by default)
         */
        public start(delay = 0): void {
            if (delay) {
                setTimeout(()=> {
                    this.start(0);
                }, delay);
                return;
            }

            this._started = true;
            this._stopped = false;
            this._actualFrame = 0;
            if (this.subEmitters && this.subEmitters.length != 0) {
                this.activeSubSystems = new Array<ParticleSystem>();
            }

            if (this.preWarmCycles) {
                for (var index = 0; index < this.preWarmCycles; index++) {
                    this.animate(true);
                }
            }
        }

        /**
         * Stops the particle system.
         * @param stopSubEmitters if true it will stop the current system and all created sub-Systems if false it will stop the current root system only, this param is used by the root particle system only. the default value is true.
         */
        public stop(stopSubEmitters = true): void {
            this._stopped = true;

            if (stopSubEmitters) {
                this._stopSubEmitters();
            }
        }

        // animation sheet

        /**
         * Remove all active particles
         */
        public reset(): void {
            this._stockParticles = [];
            this._particles = [];
        }

        /**
         * @hidden (for internal use only)
         */
        public _appendParticleVertex(index: number, particle: Particle, offsetX: number, offsetY: number): void {
            var offset = index * this._vertexBufferSize;

            this._vertexData[offset++] = particle.position.x;
            this._vertexData[offset++] = particle.position.y;
            this._vertexData[offset++] = particle.position.z;
            this._vertexData[offset++] = particle.color.r;
            this._vertexData[offset++] = particle.color.g;
            this._vertexData[offset++] = particle.color.b;
            this._vertexData[offset++] = particle.color.a;
            this._vertexData[offset++] = particle.angle;

            this._vertexData[offset++] = particle.scale.x * particle.size;
            this._vertexData[offset++] = particle.scale.y * particle.size;
            
            if (this._isAnimationSheetEnabled) {
                this._vertexData[offset++] = particle.cellIndex;
            }

            if (!this._isBillboardBased) {
                if (particle._initialDirection) {
                    this._vertexData[offset++] = particle._initialDirection.x;
                    this._vertexData[offset++] = particle._initialDirection.y;
                    this._vertexData[offset++] = particle._initialDirection.z;
                } else {
                    this._vertexData[offset++] = particle.direction.x;
                    this._vertexData[offset++] = particle.direction.y;
                    this._vertexData[offset++] = particle.direction.z;
                }
            }

            if (!this._useInstancing) {
                if (this._isAnimationSheetEnabled) {
                    if (offsetX === 0)
                        offsetX = this._epsilon;
                    else if (offsetX === 1)
                        offsetX = 1 - this._epsilon;
    
                    if (offsetY === 0)
                        offsetY = this._epsilon;
                    else if (offsetY === 1)
                        offsetY = 1 - this._epsilon;
                }

                this._vertexData[offset++] = offsetX;
                this._vertexData[offset++] = offsetY;   
            }
        }

        // start of sub system methods

        /**
         * "Recycles" one of the particle by copying it back to the "stock" of particles and removing it from the active list.
         * Its lifetime will start back at 0.
         */
        public recycleParticle: (particle: Particle) => void = (particle) => {
            var lastParticle = <Particle>this._particles.pop();
            if (lastParticle !== particle) {
                lastParticle.copyTo(particle);
            }
            this._stockParticles.push(lastParticle);
        };

        private _stopSubEmitters(): void {
            if (!this.activeSubSystems) {
                return;
            }
            this.activeSubSystems.forEach(subSystem => {
                subSystem.stop(true);
            });
            this.activeSubSystems = new Array<ParticleSystem>();
        }

        private _createParticle: () => Particle = () => {
            var particle: Particle;
            if (this._stockParticles.length !== 0) {
                particle = <Particle>this._stockParticles.pop();
                particle.age = 0;
                particle._currentColorGradient = null;
                particle.cellIndex = this.startSpriteCellID;
            } else {
                particle = new Particle(this);
            }
            return particle;
        }

        private _removeFromRoot(): void {
            if (!this._rootParticleSystem){
                return;
            }
            
            let index = this._rootParticleSystem.activeSubSystems.indexOf(this);
            if (index !== -1) {
                this._rootParticleSystem.activeSubSystems.splice(index, 1);
            }
        }

        private _emitFromParticle: (particle: Particle) => void = (particle) => {
            if (!this.subEmitters || this.subEmitters.length === 0) {
                return;
            }

            var templateIndex = Math.floor(Math.random() * this.subEmitters.length);

            var subSystem = this.subEmitters[templateIndex].clone(this.name + "_sub", particle.position.clone());
            subSystem._rootParticleSystem = this;
            this.activeSubSystems.push(subSystem);
            subSystem.start();
        }

        // End of sub system methods

        private _update(newParticles: number): void {
            // Update current
            this._alive = this._particles.length > 0;

            this.updateFunction(this._particles);

            // Add new ones
            var worldMatrix;

            if ((<AbstractMesh>this.emitter).position) {
                var emitterMesh = (<AbstractMesh>this.emitter);
                worldMatrix = emitterMesh.getWorldMatrix();
            } else {
                var emitterPosition = (<Vector3>this.emitter);
                worldMatrix = Matrix.Translation(emitterPosition.x, emitterPosition.y, emitterPosition.z);
            }

            var particle: Particle;
            for (var index = 0; index < newParticles; index++) {
                if (this._particles.length === this._capacity) {
                    break;
                }

                particle = this._createParticle();

                this._particles.push(particle);

                // Emitter
                let emitPower = Scalar.RandomRange(this.minEmitPower, this.maxEmitPower);

                if (this.startPositionFunction) {
                    this.startPositionFunction(worldMatrix, particle.position, particle);
                }
                else {
                    this.particleEmitterType.startPositionFunction(worldMatrix, particle.position, particle);
                }

                if (this.startDirectionFunction) {
                    this.startDirectionFunction(worldMatrix, particle.direction, particle);
                }
                else {
                    this.particleEmitterType.startDirectionFunction(worldMatrix, particle.direction, particle);
                }

                if (emitPower === 0) {
                    if (!particle._initialDirection) {
                        particle._initialDirection = particle.direction.clone();
                    } else {
                        particle._initialDirection.copyFrom(particle.direction);
                    }
                } else {
                    particle._initialDirection = null;
                }

                particle.direction.scaleInPlace(emitPower);

                // Life time
                if (this.targetStopDuration && this._lifeTimeGradients && this._lifeTimeGradients.length > 0) {
                    let ratio = Scalar.Clamp(this._actualFrame / this.targetStopDuration);
                    Tools.GetCurrentGradient(ratio, this._lifeTimeGradients, (currentGradient, nextGradient, scale) => {
                        let factorGradient1 = (<FactorGradient>currentGradient);
                        let factorGradient2 = (<FactorGradient>nextGradient);
                        let lifeTime1 = factorGradient1.getFactor(); 
                        let lifeTime2 = factorGradient2.getFactor(); 
                        let gradient = (ratio - factorGradient1.gradient) / (factorGradient2.gradient - factorGradient1.gradient);
                        particle.lifeTime = Scalar.Lerp(lifeTime1, lifeTime2, gradient);
                    });
                } else {
                    particle.lifeTime = Scalar.RandomRange(this.minLifeTime, this.maxLifeTime);
                }

                // Size
                if (!this._sizeGradients || this._sizeGradients.length === 0) {
                    particle.size = Scalar.RandomRange(this.minSize, this.maxSize);
                } else {
                    particle._currentSizeGradient = this._sizeGradients[0];
                    particle._currentSize1 = particle._currentSizeGradient.getFactor();
                    particle.size = particle._currentSize1;

                    if (this._sizeGradients.length > 1) {
                        particle._currentSize2 = this._sizeGradients[1].getFactor();
                    } else {
                        particle._currentSize2 = particle._currentSize1;
                    }
                }
                // Size and scale
                particle.scale.copyFromFloats(Scalar.RandomRange(this.minScaleX, this.maxScaleX), Scalar.RandomRange(this.minScaleY, this.maxScaleY));

                // Angle
                if (!this._angularSpeedGradients || this._angularSpeedGradients.length === 0) {
                    particle.angularSpeed = Scalar.RandomRange(this.minAngularSpeed, this.maxAngularSpeed);
                } else {
                    particle._currentAngularSpeedGradient = this._angularSpeedGradients[0];
                    particle.angularSpeed =  particle._currentAngularSpeedGradient.getFactor();
                    particle._currentAngularSpeed1 = particle.angularSpeed;

                    if (this._angularSpeedGradients.length > 1) {
                        particle._currentAngularSpeed2 = this._angularSpeedGradients[1].getFactor();
                    } else {
                        particle._currentAngularSpeed2 = particle._currentAngularSpeed1;
                    }
                }
                particle.angle = Scalar.RandomRange(this.minInitialRotation, this.maxInitialRotation);

                // Velocity
                if (this._velocityGradients && this._velocityGradients.length > 0) {
                    particle._currentVelocityGradient = this._velocityGradients[0];
                    particle._currentVelocity1 = particle._currentVelocityGradient.getFactor();

                    if (this._velocityGradients.length > 1) {
                        particle._currentVelocity2 = this._velocityGradients[1].getFactor();
                    } else {
                        particle._currentVelocity2 = particle._currentVelocity1;
                    }
                }                

                // Color
                if (!this._colorGradients || this._colorGradients.length === 0) {
                    var step = Scalar.RandomRange(0, 1.0);

                    Color4.LerpToRef(this.color1, this.color2, step, particle.color);

                    this.colorDead.subtractToRef(particle.color, this._colorDiff);
                    this._colorDiff.scaleToRef(1.0 / particle.lifeTime, particle.colorStep);
                } else {
                    particle._currentColorGradient = this._colorGradients[0];
                    particle._currentColorGradient.getColorToRef(particle.color);
                    particle._currentColor1.copyFrom(particle.color);

                    if (this._colorGradients.length > 1) {
                        this._colorGradients[1].getColorToRef(particle._currentColor2);
                    } else {
                        particle._currentColor2.copyFrom(particle.color);
                    }
                }

                // Sheet
                if (this._isAnimationSheetEnabled) {
                    particle._initialStartSpriteCellID = this.startSpriteCellID;
                    particle._initialEndSpriteCellID = this.endSpriteCellID;
                }
            }
        }

        /** @hidden */
        public static _GetAttributeNamesOrOptions(isAnimationSheetEnabled = false, isBillboardBased = false): string[] {
            var attributeNamesOrOptions = [VertexBuffer.PositionKind, VertexBuffer.ColorKind, "angle", "offset", "size"];

            if (isAnimationSheetEnabled) {
                attributeNamesOrOptions.push("cellIndex");
            }

            if (!isBillboardBased) {
                attributeNamesOrOptions.push("direction");
            }            

            return attributeNamesOrOptions;
        }

        public static _GetEffectCreationOptions(isAnimationSheetEnabled = false): string[] {
            var effectCreationOption = ["invView", "view", "projection", "vClipPlane", "textureMask", "translationPivot", "eyePosition"];

            if (isAnimationSheetEnabled) {
                effectCreationOption.push("particlesInfos")
            }

            return effectCreationOption;
        }

        private _getEffect(): Effect {
            if (this._customEffect) {
                return this._customEffect;
            };

            var defines = [];

            if (this._scene.clipPlane) {
                defines.push("#define CLIPPLANE");
            }

            if (this._isAnimationSheetEnabled) {
                defines.push("#define ANIMATESHEET");
            }

            if (this._isBillboardBased) {
                defines.push("#define BILLBOARD");

                switch (this.billboardMode) {
                    case AbstractMesh.BILLBOARDMODE_Y:
                        defines.push("#define BILLBOARDY");
                        break;
                    case AbstractMesh.BILLBOARDMODE_ALL:
                    default:
                        break;
                }
            }

            // Effect
            var join = defines.join("\n");
            if (this._cachedDefines !== join) {
                this._cachedDefines = join;

                var attributesNamesOrOptions = ParticleSystem._GetAttributeNamesOrOptions(this._isAnimationSheetEnabled, this._isBillboardBased);
                var effectCreationOption = ParticleSystem._GetEffectCreationOptions(this._isAnimationSheetEnabled);

                this._effect = this._scene.getEngine().createEffect(
                    "particles",
                    attributesNamesOrOptions,
                    effectCreationOption,
                    ["diffuseSampler"], join);
            }

            return this._effect;
        }

        /**
         * Animates the particle system for the current frame by emitting new particles and or animating the living ones.
         * @param preWarmOnly will prevent the system from updating the vertex buffer (default is false)
         */
        public animate(preWarmOnly = false): void {
            if (!this._started)
                return;

            if (!preWarmOnly) {
                var effect = this._getEffect();

                // Check
                if (!this.emitter || !effect.isReady() || !this.particleTexture || !this.particleTexture.isReady())
                    return;

                if (this._currentRenderId === this._scene.getRenderId()) {
                    return;
                }
                this._currentRenderId = this._scene.getRenderId();
            }

            this._scaledUpdateSpeed = this.updateSpeed * (preWarmOnly ? this.preWarmStepOffset : this._scene.getAnimationRatio());

            // determine the number of particles we need to create
            var newParticles;

            if (this.manualEmitCount > -1) {
                newParticles = this.manualEmitCount;
                this._newPartsExcess = 0;
                this.manualEmitCount = 0;
            } else {
                newParticles = ((this.emitRate * this._scaledUpdateSpeed) >> 0);
                this._newPartsExcess += this.emitRate * this._scaledUpdateSpeed - newParticles;
            }

            if (this._newPartsExcess > 1.0) {
                newParticles += this._newPartsExcess >> 0;
                this._newPartsExcess -= this._newPartsExcess >> 0;
            }

            this._alive = false;

            if (!this._stopped) {
                this._actualFrame += this._scaledUpdateSpeed;

                if (this.targetStopDuration && this._actualFrame >= this.targetStopDuration)
                    this.stop();
            } else {
                newParticles = 0;
            }
            this._update(newParticles);

            // Stopped?
            if (this._stopped) {
                if (!this._alive) {
                    this._started = false;
                    if (this.onAnimationEnd) {
                        this.onAnimationEnd();
                    }
                    if (this.disposeOnStop) {
                        this._scene._toBeDisposed.push(this);
                    }
                }
            }

            if (!preWarmOnly) {
                // Update VBO
                var offset = 0;
                for (var index = 0; index < this._particles.length; index++) {
                    var particle = this._particles[index];
                    this._appendParticleVertices(offset, particle);                
                    offset += this._useInstancing ? 1 : 4;
                }

                if (this._vertexBuffer) {
                    this._vertexBuffer.update(this._vertexData);
                }
            }

            if (this.manualEmitCount === 0 && this.disposeOnStop) {
                this.stop();
            }
        }

        private _appendParticleVertices(offset: number, particle: Particle) {
            this._appendParticleVertex(offset++, particle, 0, 0);
            if (!this._useInstancing) {
                this._appendParticleVertex(offset++, particle, 1, 0);
                this._appendParticleVertex(offset++, particle, 1, 1);
                this._appendParticleVertex(offset++, particle, 0, 1);
            }
        }

        /**
         * Rebuilds the particle system.
         */
        public rebuild(): void {
            this._createIndexBuffer();

            if (this._vertexBuffer) {
                this._vertexBuffer._rebuild();
            }
        }

        /**
         * Is this system ready to be used/rendered
         * @return true if the system is ready
         */
        public isReady(): boolean {
            var effect = this._getEffect();
            if (!this.emitter || !effect.isReady() || !this.particleTexture || !this.particleTexture.isReady()) {
                return false;
            }

            return true;
        }

        /**
         * Renders the particle system in its current state.
         * @returns the current number of particles
         */
        public render(): number {
            var effect = this._getEffect();

            // Check
            if (!this.isReady() || !this._particles.length) {
                return 0;
            }

            var engine = this._scene.getEngine();

            // Render
            engine.enableEffect(effect);
            engine.setState(false);

            var viewMatrix = this._scene.getViewMatrix();
            effect.setTexture("diffuseSampler", this.particleTexture);
            effect.setMatrix("view", viewMatrix);
            effect.setMatrix("projection", this._scene.getProjectionMatrix());

            if (this._isAnimationSheetEnabled && this.particleTexture) {
                var baseSize = this.particleTexture.getBaseSize();
                effect.setFloat3("particlesInfos", this.spriteCellWidth / baseSize.width, this.spriteCellHeight / baseSize.height, baseSize.width / this.spriteCellWidth);
            }

            effect.setVector2("translationPivot", this.translationPivot);
            effect.setFloat4("textureMask", this.textureMask.r, this.textureMask.g, this.textureMask.b, this.textureMask.a);

            if (this._isBillboardBased) {
                var camera = this._scene.activeCamera!;
                effect.setVector3("eyePosition", camera.globalPosition);
            }

            if (this._scene.clipPlane) {
                var clipPlane = this._scene.clipPlane;
                var invView = viewMatrix.clone();
                invView.invert();
                effect.setMatrix("invView", invView);
                effect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
            }

            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);

            // Draw order
            switch(this.blendMode)
            {
                case ParticleSystem.BLENDMODE_ADD:
                    engine.setAlphaMode(Engine.ALPHA_ADD);
                    break;
                case ParticleSystem.BLENDMODE_ONEONE:
                    engine.setAlphaMode(Engine.ALPHA_ONEONE);
                    break;
                case ParticleSystem.BLENDMODE_STANDARD:
                    engine.setAlphaMode(Engine.ALPHA_COMBINE);
                    break;
            }

            if (this.forceDepthWrite) {
                engine.setDepthWrite(true);
            }

            if (this._useInstancing) {
                engine.drawArraysType(Material.TriangleFanDrawMode, 0, 4, this._particles.length);  
                engine.unbindInstanceAttributes();
            } else {
                engine.drawElementsType(Material.TriangleFillMode, 0, this._particles.length * 6);
            }
            engine.setAlphaMode(Engine.ALPHA_DISABLE);

            return this._particles.length;
        }

        /**
         * Disposes the particle system and free the associated resources
         * @param disposeTexture defines if the particule texture must be disposed as well (true by default)
         */
        public dispose(disposeTexture = true): void {
            if (this._vertexBuffer) {
                this._vertexBuffer.dispose();
                this._vertexBuffer = null;
            }

            if (this._spriteBuffer) {
                this._spriteBuffer.dispose();
                this._spriteBuffer = null;
            }

            if (this._indexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._indexBuffer);
                this._indexBuffer = null;
            }

            if (disposeTexture && this.particleTexture) {
                this.particleTexture.dispose();
                this.particleTexture = null;
            }

            this._removeFromRoot();

            // Remove from scene
            var index = this._scene.particleSystems.indexOf(this);
            if (index > -1) {
                this._scene.particleSystems.splice(index, 1);
            }

            // Callback
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();
        }

        /**
         * Creates a Sphere Emitter for the particle system. (emits along the sphere radius)
         * @param radius The radius of the sphere to emit from
         * @returns the emitter
         */
        public createSphereEmitter(radius = 1, radiusRange = 1): SphereParticleEmitter {
            var particleEmitter = new SphereParticleEmitter(radius, radiusRange);
            this.particleEmitterType = particleEmitter;
            return particleEmitter;
        }

        /**
         * Creates a Directed Sphere Emitter for the particle system. (emits between direction1 and direction2)
         * @param radius The radius of the sphere to emit from
         * @param direction1 Particles are emitted between the direction1 and direction2 from within the sphere
         * @param direction2 Particles are emitted between the direction1 and direction2 from within the sphere
         * @returns the emitter
         */
        public createDirectedSphereEmitter(radius = 1, direction1 = new Vector3(0, 1.0, 0), direction2 = new Vector3(0, 1.0, 0)): SphereDirectedParticleEmitter {
            var particleEmitter = new SphereDirectedParticleEmitter(radius, direction1, direction2)
            this.particleEmitterType = particleEmitter;
            return particleEmitter;
        }

        /**
         * Creates a Cone Emitter for the particle system. (emits from the cone to the particle position)
         * @param radius The radius of the cone to emit from
         * @param angle The base angle of the cone
         * @returns the emitter
         */
        public createConeEmitter(radius = 1, angle = Math.PI / 4): ConeParticleEmitter {
            var particleEmitter = new ConeParticleEmitter(radius, angle);
            this.particleEmitterType = particleEmitter;
            return particleEmitter;
        }

        // this method needs to be changed when breaking changes will be allowed to match the sphere and cone methods and properties direction1,2 and minEmitBox,maxEmitBox to be removed from the system.
        /**
         * Creates a Box Emitter for the particle system. (emits between direction1 and direction2 from withing the box defined by minEmitBox and maxEmitBox)
         * @param direction1 Particles are emitted between the direction1 and direction2 from within the box
         * @param direction2 Particles are emitted between the direction1 and direction2 from within the box
         * @param minEmitBox Particles are emitted from the box between minEmitBox and maxEmitBox
         * @param maxEmitBox  Particles are emitted from the box between minEmitBox and maxEmitBox
         * @returns the emitter
         */
        public createBoxEmitter(direction1: Vector3, direction2: Vector3, minEmitBox: Vector3, maxEmitBox: Vector3): BoxParticleEmitter {
            var particleEmitter = new BoxParticleEmitter();
            this.particleEmitterType = particleEmitter;
            this.direction1 = direction1;
            this.direction2 = direction2;
            this.minEmitBox = minEmitBox;
            this.maxEmitBox = maxEmitBox;
            return particleEmitter;
        }

        // Clone
        /**
         * Clones the particle system.
         * @param name The name of the cloned object
         * @param newEmitter The new emitter to use
         * @returns the cloned particle system
         */
        public clone(name: string, newEmitter: any): ParticleSystem {
            var custom: Nullable<Effect> = null;
            var program: any = null;
            if (this.customShader != null) {
                program = this.customShader;
                var defines: string = (program.shaderOptions.defines.length > 0) ? program.shaderOptions.defines.join("\n") : "";
                custom = this._scene.getEngine().createEffectForParticles(program.shaderPath.fragmentElement, program.shaderOptions.uniforms, program.shaderOptions.samplers, defines);
            } else if (this._customEffect) {
                custom = this._customEffect;
            }
            var result = new ParticleSystem(name, this._capacity, this._scene, custom);
            result.customShader = program;

            Tools.DeepCopy(this, result, ["particles", "customShader"]);

            if (newEmitter === undefined) {
                newEmitter = this.emitter;
            }

            result.emitter = newEmitter;
            if (this.particleTexture) {
                result.particleTexture = new Texture(this.particleTexture.url, this._scene);
            }

            if (!this.preventAutoStart) {
                result.start();
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

            serializationObject.textureMask = this.textureMask.asArray();
            serializationObject.customShader = this.customShader;
            serializationObject.preventAutoStart = this.preventAutoStart;

            serializationObject.isAnimationSheetEnabled = this._isAnimationSheetEnabled;

            return serializationObject;
        }

        /** @hidden */
        public static _Serialize(serializationObject: any, particleSystem: IParticleSystem) {
            serializationObject.name = particleSystem.name;
            serializationObject.id = particleSystem.id;

            serializationObject.capacity = particleSystem.getCapacity();

            // Emitter
            if ((<AbstractMesh>particleSystem.emitter).position) {
                var emitterMesh = (<AbstractMesh>particleSystem.emitter);
                serializationObject.emitterId = emitterMesh.id;
            } else {
                var emitterPosition = (<Vector3>particleSystem.emitter);
                serializationObject.emitter = emitterPosition.asArray();
            }

            // Emitter
            if (particleSystem.particleEmitterType) {
                serializationObject.particleEmitterType = particleSystem.particleEmitterType.serialize();
            }           
            
            if (particleSystem.particleTexture) {
                serializationObject.textureName = particleSystem.particleTexture.name;
            }
            
            // Animations
            Animation.AppendSerializedAnimations(particleSystem, serializationObject);

            // Particle system
            serializationObject.renderingGroupId = particleSystem.renderingGroupId;
            serializationObject.isBillboardBased = particleSystem.isBillboardBased;
            serializationObject.minAngularSpeed = particleSystem.minAngularSpeed;
            serializationObject.maxAngularSpeed = particleSystem.maxAngularSpeed;
            serializationObject.minSize = particleSystem.minSize;
            serializationObject.maxSize = particleSystem.maxSize;
            serializationObject.minScaleX = particleSystem.minScaleX;
            serializationObject.maxScaleX = particleSystem.maxScaleX;
            serializationObject.minScaleY = particleSystem.minScaleY;
            serializationObject.maxScaleY = particleSystem.maxScaleY;            
            serializationObject.minEmitPower = particleSystem.minEmitPower;
            serializationObject.maxEmitPower = particleSystem.maxEmitPower;
            serializationObject.minLifeTime = particleSystem.minLifeTime;
            serializationObject.maxLifeTime = particleSystem.maxLifeTime;
            serializationObject.emitRate = particleSystem.emitRate;
            serializationObject.gravity = particleSystem.gravity.asArray();
            serializationObject.color1 = particleSystem.color1.asArray();
            serializationObject.color2 = particleSystem.color2.asArray();
            serializationObject.colorDead = particleSystem.colorDead.asArray();
            serializationObject.updateSpeed = particleSystem.updateSpeed;
            serializationObject.targetStopDuration = particleSystem.targetStopDuration;
            serializationObject.blendMode = particleSystem.blendMode;
            serializationObject.preWarmCycles = particleSystem.preWarmCycles;
            serializationObject.preWarmStepOffset = particleSystem.preWarmStepOffset;
            serializationObject.minInitialRotation = particleSystem.minInitialRotation;
            serializationObject.maxInitialRotation = particleSystem.maxInitialRotation;
            serializationObject.startSpriteCellID = particleSystem.startSpriteCellID;
            serializationObject.endSpriteCellID = particleSystem.endSpriteCellID;
            serializationObject.spriteCellChangeSpeed = particleSystem.spriteCellChangeSpeed;
            serializationObject.spriteCellWidth = particleSystem.spriteCellWidth;
            serializationObject.spriteCellHeight = particleSystem.spriteCellHeight;            

            let colorGradients = particleSystem.getColorGradients();
            if (colorGradients) {
                serializationObject.colorGradients = [];
                for (var colorGradient of colorGradients) {
                    var serializedGradient: any = {
                        gradient: colorGradient.gradient,
                        color1: colorGradient.color1.asArray()
                    };

                    if (colorGradient.color2) {
                        serializedGradient.color2 = colorGradient.color2.asArray();
                    }

                    serializationObject.colorGradients.push(serializedGradient);
                }
            }

            let sizeGradients = particleSystem.getSizeGradients();
            if (sizeGradients) {
                serializationObject.sizeGradients = [];
                for (var sizeGradient of sizeGradients) {

                    var serializedGradient: any = {
                        gradient: sizeGradient.gradient,
                        factor1: sizeGradient.factor1
                    };

                    if (sizeGradient.factor2 !== undefined) {
                        serializedGradient.factor2 = sizeGradient.factor2;
                    }

                    serializationObject.sizeGradients.push(serializedGradient);
                }
            }       
                        
            let angularSpeedGradients = particleSystem.getAngularSpeedGradients();
            if (angularSpeedGradients) {
                serializationObject.angularSpeedGradients = [];
                for (var angularSpeedGradient of angularSpeedGradients) {

                    var serializedGradient: any = {
                        gradient: angularSpeedGradient.gradient,
                        factor1: angularSpeedGradient.factor1
                    };

                    if (angularSpeedGradient.factor2 !== undefined) {
                        serializedGradient.factor2 = angularSpeedGradient.factor2;
                    }

                    serializationObject.angularSpeedGradients.push(serializedGradient);
                }
            }  

            let velocityGradients = particleSystem.getVelocityGradients();
            if (velocityGradients) {
                serializationObject.velocityGradients = [];
                for (var velocityGradient of velocityGradients) {

                    var serializedGradient: any = {
                        gradient: velocityGradient.gradient,
                        factor1: velocityGradient.factor1
                    };

                    if (velocityGradient.factor2 !== undefined) {
                        serializedGradient.factor2 = velocityGradient.factor2;
                    }

                    serializationObject.velocityGradients.push(serializedGradient);
                }
            }              
        }

        /** @hidden */
        public static _Parse(parsedParticleSystem: any, particleSystem: IParticleSystem, scene: Scene, rootUrl: string) {
            // Texture
            if (parsedParticleSystem.textureName) {
                particleSystem.particleTexture = new Texture(rootUrl + parsedParticleSystem.textureName, scene);
                particleSystem.particleTexture.name = parsedParticleSystem.textureName;
            }

            // Emitter
            if (parsedParticleSystem.emitterId === undefined) {
                particleSystem.emitter = Vector3.Zero();
            }
             else if (parsedParticleSystem.emitterId) {
                particleSystem.emitter = scene.getLastMeshByID(parsedParticleSystem.emitterId);
            } else {
                particleSystem.emitter = Vector3.FromArray(parsedParticleSystem.emitter);
            }

            // Misc.
            if (parsedParticleSystem.renderingGroupId !== undefined) {
                particleSystem.renderingGroupId = parsedParticleSystem.renderingGroupId;
            }

            if (parsedParticleSystem.isBillboardBased !== undefined) {
                particleSystem.isBillboardBased = parsedParticleSystem.isBillboardBased;
            }

            // Animations
            if (parsedParticleSystem.animations) {
                for (var animationIndex = 0; animationIndex < parsedParticleSystem.animations.length; animationIndex++) {
                    var parsedAnimation = parsedParticleSystem.animations[animationIndex];
                    particleSystem.animations.push(Animation.Parse(parsedAnimation));
                }
            }

            if (parsedParticleSystem.autoAnimate) {
                scene.beginAnimation(particleSystem, parsedParticleSystem.autoAnimateFrom, parsedParticleSystem.autoAnimateTo, parsedParticleSystem.autoAnimateLoop, parsedParticleSystem.autoAnimateSpeed || 1.0);
            }

            // Particle system
            particleSystem.minAngularSpeed = parsedParticleSystem.minAngularSpeed;
            particleSystem.maxAngularSpeed = parsedParticleSystem.maxAngularSpeed;
            particleSystem.minSize = parsedParticleSystem.minSize;
            particleSystem.maxSize = parsedParticleSystem.maxSize;

            if (parsedParticleSystem.minScaleX) {
                particleSystem.minScaleX = parsedParticleSystem.minScaleX;
                particleSystem.maxScaleX = parsedParticleSystem.maxScaleX;                
                particleSystem.minScaleY = parsedParticleSystem.minScaleY;
                particleSystem.maxScaleY = parsedParticleSystem.maxScaleY;                
            }

            if (parsedParticleSystem.preWarmCycles !== undefined) {
                particleSystem.preWarmCycles = parsedParticleSystem.preWarmCycles;
                particleSystem.preWarmStepOffset = parsedParticleSystem.preWarmStepOffset;
            }   

            if (parsedParticleSystem.minInitialRotation !== undefined) {
                particleSystem.minInitialRotation = parsedParticleSystem.minInitialRotation;
                particleSystem.maxInitialRotation = parsedParticleSystem.maxInitialRotation;
            }

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


            if (parsedParticleSystem.colorGradients) {
                for (var colorGradient of parsedParticleSystem.colorGradients) {
                    particleSystem.addColorGradient(colorGradient.gradient, Color4.FromArray(colorGradient.color1), colorGradient.color2 ? Color4.FromArray(colorGradient.color2) : undefined);
                }
            }

            if (parsedParticleSystem.sizeGradients) {
                for (var sizeGradient of parsedParticleSystem.sizeGradients) {
                    particleSystem.addSizeGradient(sizeGradient.gradient, sizeGradient.factor1 !== undefined ?  sizeGradient.factor1 : sizeGradient.factor, sizeGradient.factor2);
                }
            }       

            if (parsedParticleSystem.angularSpeedGradients) {
                for (var angularSpeedGradient of parsedParticleSystem.angularSpeedGradients) {
                    particleSystem.addAngularSpeedGradient(angularSpeedGradient.gradient, angularSpeedGradient.factor1 !== undefined ?  angularSpeedGradient.factor1 : angularSpeedGradient.factor, angularSpeedGradient.factor2);
                }
            }       
            
            if (parsedParticleSystem.velocityGradients) {
                for (var velocityGradient of parsedParticleSystem.velocityGradients) {
                    particleSystem.addVelocityGradient(velocityGradient.gradient, velocityGradient.factor1 !== undefined ?  velocityGradient.factor1 : velocityGradient.factor, velocityGradient.factor2);
                }
            }              
            
            // Emitter
            let emitterType: IParticleEmitterType;
            if (parsedParticleSystem.particleEmitterType) {
                switch (parsedParticleSystem.particleEmitterType.type) {
                    case "SphereParticleEmitter":
                        emitterType = new SphereParticleEmitter();
                        break;
                    case "SphereDirectedParticleEmitter":
                        emitterType = new SphereDirectedParticleEmitter();
                        break;
                    case "ConeEmitter":
                    case "ConeParticleEmitter":
                        emitterType = new ConeParticleEmitter();
                        break;
                    case "BoxEmitter":
                    case "BoxParticleEmitter":
                    default:
                        emitterType = new BoxParticleEmitter();
                        break;                                                
                }

                emitterType.parse(parsedParticleSystem.particleEmitterType);
            } else {
                emitterType = new BoxParticleEmitter();
                emitterType.parse(parsedParticleSystem);
            }
            particleSystem.particleEmitterType = emitterType;

            // Animation sheet
            particleSystem.startSpriteCellID = parsedParticleSystem.startSpriteCellID;
            particleSystem.endSpriteCellID = parsedParticleSystem.endSpriteCellID;
            particleSystem.spriteCellWidth = parsedParticleSystem.spriteCellWidth;
            particleSystem.spriteCellHeight = parsedParticleSystem.spriteCellHeight;
            particleSystem.spriteCellChangeSpeed = parsedParticleSystem.spriteCellChangeSpeed;
        }

        /**
         * Parses a JSON object to create a particle system.
         * @param parsedParticleSystem The JSON object to parse
         * @param scene The scene to create the particle system in
         * @param rootUrl The root url to use to load external dependencies like texture
         * @returns the Parsed particle system
         */
        public static Parse(parsedParticleSystem: any, scene: Scene, rootUrl: string): ParticleSystem {
            var name = parsedParticleSystem.name;
            var custom: Nullable<Effect> = null;
            var program: any = null;
            if (parsedParticleSystem.customShader) {
                program = parsedParticleSystem.customShader;
                var defines: string = (program.shaderOptions.defines.length > 0) ? program.shaderOptions.defines.join("\n") : "";
                custom = scene.getEngine().createEffectForParticles(program.shaderPath.fragmentElement, program.shaderOptions.uniforms, program.shaderOptions.samplers, defines);
            }
            var particleSystem = new ParticleSystem(name, parsedParticleSystem.capacity, scene, custom, parsedParticleSystem.isAnimationSheetEnabled);
            particleSystem.customShader = program;

            if (parsedParticleSystem.id) {
                particleSystem.id = parsedParticleSystem.id;
            }

            // Auto start
            if (parsedParticleSystem.preventAutoStart) {
                particleSystem.preventAutoStart = parsedParticleSystem.preventAutoStart;
            }

            ParticleSystem._Parse(parsedParticleSystem, particleSystem, scene, rootUrl);

            particleSystem.textureMask = Color4.FromArray(parsedParticleSystem.textureMask);

            if (!particleSystem.preventAutoStart) {
                particleSystem.start();
            }

            return particleSystem;
        }
    }
}
