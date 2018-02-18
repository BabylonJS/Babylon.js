module BABYLON {
    /**
     * Interface representing a particle system in Babylon.
     * This groups the common functionalities that needs to be implemented in order to create a particle system.
     * A particle system represents a way to manage particles (@see Particle) from their emission to their animation and rendering.
     */
    export interface IParticleSystem {
        /**
         * The id of the Particle system.
         */
        id: string;
        /**
         * The name of the Particle system.
         */
        name: string;
        /**
         * The emitter represents the Mesh or position we are attaching the particle system to.
         */
        emitter: Nullable<AbstractMesh | Vector3>;
        /**
         * The rendering group used by the Particle system to chose when to render.
         */
        renderingGroupId: number;
        /**
         * The layer mask we are rendering the particles through.
         */
        layerMask: number;
        /**
         * Gets if the particle system has been started.
         * @return true if the system has been started, otherwise false.
         */
        isStarted(): boolean;
        /**
         * Animates the particle system for this frame.
         */
        animate(): void;
        /**
         * Renders the particle system in its current state.
         * @returns the current number of particles.
         */
        render(): number;
        /**
         * Dispose the particle system and frees its associated resources.
         */
        dispose(): void;
        /**
         * Clones the particle system.
         * @param name The name of the cloned object
         * @param newEmitter The new emitter to use
         * @returns the cloned particle system
         */
        clone(name: string, newEmitter: any): Nullable<IParticleSystem>;
        /**
         * Serializes the particle system to a JSON object.
         * @returns the JSON object
         */
        serialize(): any;
        /**
         * Rebuild the particle system
         */
        rebuild(): void
    }

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
         * The density of particles, the rate of particle flow
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
         * The amount of time the particle system is running (depends of the overall speed above).
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

        /**
         * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
         */
        public direction1 = new Vector3(0, 1.0, 0);
        /**
         * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
         */
        public direction2 = new Vector3(0, 1.0, 0);

        /**
         * Minimum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
         */
        public minEmitBox = new Vector3(-0.5, -0.5, -0.5);
        /**
         * Maximum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
         */
        public maxEmitBox = new Vector3(0.5, 0.5, 0.5);

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
        public colorDead = new Color4(0, 0, 0, 1.0);

        /**
         * An optional mask to filter some colors out of the texture, or filter a part of the alpha channel.
         */
        public textureMask = new Color4(1.0, 1.0, 1.0, 1.0);

        /**
         * The particle emitter type defines the emitter used by the particle system.
         * It can be for example box, sphere, or cone...
         */
        public particleEmitterType: IParticleEmitterType;

        /**
         * This function can be defined to specify initial direction for every new particle.
         * It by default use the emitterType defined function.
         */
        public startDirectionFunction: (emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle) => void;
        /**
         * This function can be defined to specify initial position for every new particle.
         * It by default use the emitterType defined function.
         */
        public startPositionFunction: (worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle) => void;

        /**
         * If using a spritesheet (isAnimationSheetEnabled), defines if the sprite animation should loop between startSpriteCellID and endSpriteCellID or not.
         */
        public spriteCellLoop = true;
        /**
         * If using a spritesheet (isAnimationSheetEnabled) and spriteCellLoop defines the speed of the sprite loop.
         */
        public spriteCellChangeSpeed = 0;
        /**
         * If using a spritesheet (isAnimationSheetEnabled) and spriteCellLoop defines the first sprite cell to display.
         */
        public startSpriteCellID = 0;
        /**
         * If using a spritesheet (isAnimationSheetEnabled) and spriteCellLoop defines the last sprite cell to display.
         */
        public endSpriteCellID = 0;
        /**
         * If using a spritesheet (isAnimationSheetEnabled), defines the sprite cell width to use.
         */
        public spriteCellWidth = 0;
        /**
         * If using a spritesheet (isAnimationSheetEnabled), defines the sprite cell height to use.
         */
        public spriteCellHeight = 0;

        /**
        * An event triggered when the system is disposed.
        */
        public onDisposeObservable = new Observable<ParticleSystem>();

        private _onDisposeObserver: Nullable<Observer<ParticleSystem>>;
        /**
         * Sets a callback that will be triggered when the system is disposed.
         */
        public set onDispose(callback: () => void) {
            if (this._onDisposeObserver) {
                this.onDisposeObservable.remove(this._onDisposeObserver);
            }
            this._onDisposeObserver = this.onDisposeObservable.add(callback);
        }

        /**
         * Gets wether an animation sprite sheet is enabled or not on the particle system.
         */
        public get isAnimationSheetEnabled(): Boolean {
            return this._isAnimationSheetEnabled;
        }

        private _particles = new Array<Particle>();
        private _epsilon: number;
        private _capacity: number;
        private _scene: Scene;
        private _stockParticles = new Array<Particle>();
        private _newPartsExcess = 0;
        private _vertexData: Float32Array;
        private _vertexBuffer: Nullable<Buffer>;
        private _vertexBuffers: { [key: string]: VertexBuffer } = {};
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

        private _started = false;
        private _stopped = false;
        private _actualFrame = 0;
        private _scaledUpdateSpeed: number;
        private _vertexBufferSize = 11;
        private _isAnimationSheetEnabled: boolean;

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

        private stockSubSystems: StringDictionary<Array<ParticleSystem>>;
        
        private _isEmitting = false;
        private _rootParticleSystem: ParticleSystem;
        private _subEmitterIndex = "";
        //end of Sub-emitter

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
            if (isAnimationSheetEnabled) {
                this._vertexBufferSize = 12;
            }

            this._scene = scene || Engine.LastCreatedScene;

            this._customEffect = customEffect;

            scene.particleSystems.push(this);

            this._createIndexBuffer();

            // 11 floats per particle (x, y, z, r, g, b, a, angle, size, offsetX, offsetY) + 1 filler
            this._vertexData = new Float32Array(capacity * this._vertexBufferSize * 4);
            this._vertexBuffer = new Buffer(scene.getEngine(), this._vertexData, true, this._vertexBufferSize);

            var positions = this._vertexBuffer.createVertexBuffer(VertexBuffer.PositionKind, 0, 3);
            var colors = this._vertexBuffer.createVertexBuffer(VertexBuffer.ColorKind, 3, 4);
            var options = this._vertexBuffer.createVertexBuffer("options", 7, 4);

            if (this._isAnimationSheetEnabled) {
                var cellIndexBuffer = this._vertexBuffer.createVertexBuffer("cellIndex", 11, 1);
                this._vertexBuffers["cellIndex"] = cellIndexBuffer;
            }

            this._vertexBuffers[VertexBuffer.PositionKind] = positions;
            this._vertexBuffers[VertexBuffer.ColorKind] = colors;
            this._vertexBuffers["options"] = options;

            // Default behaviors
            this.particleEmitterType = new BoxParticleEmitter(this);

            this.updateFunction = (particles: Particle[]): void => {
                for (var index = 0; index < particles.length; index++) {
                    var particle = particles[index];
                    particle.age += this._scaledUpdateSpeed;

                    if (particle.age >= particle.lifeTime) { // Recycle by swapping with last particle
                        this.recycleParticle(particle);
                        index--;
                        this._emitFromParticle(particle);
                        continue;
                    }
                    else {
                        particle.colorStep.scaleToRef(this._scaledUpdateSpeed, this._scaledColorStep);
                        particle.color.addInPlace(this._scaledColorStep);

                        if (particle.color.a < 0)
                            particle.color.a = 0;

                        particle.angle += particle.angularSpeed * this._scaledUpdateSpeed;

                        particle.direction.scaleToRef(this._scaledUpdateSpeed, this._scaledDirection);
                        particle.position.addInPlace(this._scaledDirection);

                        this.gravity.scaleToRef(this._scaledUpdateSpeed, this._scaledGravity);
                        particle.direction.addInPlace(this._scaledGravity);

                        if (this._isAnimationSheetEnabled) {
                            particle.updateCellIndex(this._scaledUpdateSpeed);
                        }
                    }
                }
            }
        }

        private _createIndexBuffer() {
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
         * Starts the particle system and begins to emit.
         */
        public start(): void {
            this._started = true;
            this._stopped = false;
            this._actualFrame = 0;
            if (this.subEmitters && this.subEmitters.length != 0) {
                this.activeSubSystems = new Array<ParticleSystem>();
                this.stockSubSystems = new StringDictionary<Array<ParticleSystem>>();
            }
        }

        /**
         * Stops the particle system.
         * @param stopSubEmitters if true it will stop the current system and all created sub-Systems if false it will stop the current root system only, this param is used by the root particle system only. the default value is true.
         */
        public stop(stopSubEmitters = true): void {
            this._stopped = true;

            this._stopSubEmitters();
        }

        // animation sheet

        /**
         * @ignore (for internal use only)
         */
        public _appendParticleVertex(index: number, particle: Particle, offsetX: number, offsetY: number): void {
            var offset = index * this._vertexBufferSize;
            this._vertexData[offset] = particle.position.x;
            this._vertexData[offset + 1] = particle.position.y;
            this._vertexData[offset + 2] = particle.position.z;
            this._vertexData[offset + 3] = particle.color.r;
            this._vertexData[offset + 4] = particle.color.g;
            this._vertexData[offset + 5] = particle.color.b;
            this._vertexData[offset + 6] = particle.color.a;
            this._vertexData[offset + 7] = particle.angle;
            this._vertexData[offset + 8] = particle.size;
            this._vertexData[offset + 9] = offsetX;
            this._vertexData[offset + 10] = offsetY;
        }

        /**
         * @ignore (for internal use only)
         */
        public _appendParticleVertexWithAnimation(index: number, particle: Particle, offsetX: number, offsetY: number): void {
            if (offsetX === 0)
                offsetX = this._epsilon;
            else if (offsetX === 1)
                offsetX = 1 - this._epsilon;

            if (offsetY === 0)
                offsetY = this._epsilon;
            else if (offsetY === 1)
                offsetY = 1 - this._epsilon;

            var offset = index * this._vertexBufferSize;
            this._vertexData[offset] = particle.position.x;
            this._vertexData[offset + 1] = particle.position.y;
            this._vertexData[offset + 2] = particle.position.z;
            this._vertexData[offset + 3] = particle.color.r;
            this._vertexData[offset + 4] = particle.color.g;
            this._vertexData[offset + 5] = particle.color.b;
            this._vertexData[offset + 6] = particle.color.a;
            this._vertexData[offset + 7] = particle.angle;
            this._vertexData[offset + 8] = particle.size;
            this._vertexData[offset + 9] = offsetX;
            this._vertexData[offset + 10] = offsetY;
            this._vertexData[offset + 11] = particle.cellIndex;
        }

        // start of sub system methods

        /**
         * "Recycles" one of the particle by copying it back to the "stock" of particles and removing it from the active list.
         * Its lifetime will start back at 0.
         */
        public recycleParticle: (particle: Particle) => void = (particle) => {
            this._recycleParticleUsingSystem(this, this, particle);
        };

        private _stopSubEmitters(): void {
            this.stockSubSystems.forEach(index => {
                this.stockSubSystems.get(index)!.forEach(subSystem => {
                    subSystem.stop();
                });
            });

            this.activeSubSystems.forEach(subSystem => {
                subSystem.stop();
                subSystem._stoppedEmitting(true);
            });
            this.activeSubSystems = new Array<ParticleSystem>();
        }

        private _createParticle: () => Particle = () => {
            return this._createParticleUsingSystem(this, this);
        }

        // to be overriden by subSystems
        private _stoppedEmitting: (overrideRemove: boolean) => void = () => {

        }

        private _emitFromParticle: (particle: Particle) => void = (particle) => {
            if (!this.subEmitters || this.subEmitters.length === 0) {
                return;
            }

            var templateIndex = Math.floor(Math.random() * this.subEmitters.length);
            var templateIndexString =templateIndex.toString();

            if (!this.stockSubSystems.contains(templateIndexString) || (this.stockSubSystems.contains(templateIndexString) && this.stockSubSystems.get(templateIndexString)!.length === 0)) {
                // get the current generation template and clone it to subSystem
                var subSystem = this.subEmitters[templateIndex]._cloneToSubSystem(this, particle.position);
                subSystem._subEmitterIndex = templateIndexString;
                this.activeSubSystems.push(subSystem);
                subSystem.start();
            }
            else {
                var stockSubSystem = this.stockSubSystems.get(templateIndexString)!.pop()!;
                stockSubSystem.emitter = particle.position;
                this.activeSubSystems.push(stockSubSystem);

                // reset the manual emit count
                if (this.subEmitters[templateIndex].manualEmitCount != -1)
                    stockSubSystem.manualEmitCount = this.subEmitters[templateIndex].manualEmitCount;

                stockSubSystem.start();
            }
        }

        private _initSubSystem(rootParticleSystem: ParticleSystem): void {
            this._rootParticleSystem = rootParticleSystem;

            this._stoppedEmitting = (overrideRemove = false) => {

                if (overrideRemove){
                    let index = this._rootParticleSystem.activeSubSystems.indexOf(this, 0);
                    if (index > -1) {
                        this._rootParticleSystem.activeSubSystems.splice(index, 1);
                    }
                }
                
                var particleSystemArray = new Array<ParticleSystem>();
                particleSystemArray.push(this);
                this._rootParticleSystem.stockSubSystems.add(this._subEmitterIndex, particleSystemArray);
            }

            this.recycleParticle = (particle: Particle) => {
                this._recycleParticleUsingSystem(this._rootParticleSystem, this, particle);
            }

            this._createParticle = () => {
                return this._createParticleUsingSystem(this._rootParticleSystem, this);
            }
        }

        private _createParticleUsingSystem(rootSystem: ParticleSystem, currentSystem: ParticleSystem): Particle {
            let particle: Particle;
            if (rootSystem._stockParticles.length !== 0) {
                particle = <Particle>rootSystem._stockParticles.pop();
                particle.age = 0;
                particle.cellIndex = currentSystem.startSpriteCellID;
                if (currentSystem !== particle.particleSystem) {
                    particle.particleSystem = currentSystem;
                    particle.updateCellInfoFromSystem();
                }
            } else {
                particle = new Particle(currentSystem);
            }
            return particle;
        }

        private _recycleParticleUsingSystem(rootSystem: ParticleSystem, currentSystem: ParticleSystem, particle: Particle) {
            var lastParticle = <Particle>currentSystem._particles.pop();

            if (lastParticle !== particle) {
                lastParticle.copyTo(particle);
                rootSystem._stockParticles.push(lastParticle);
            }
        }
        // end of sub system methods

        private _update(newParticles: number): void {
            // Update current
            this._alive = this._particles.length > 0;

            if (this._alive) {
                this._isEmitting = true;
            }

            if (!this._alive && this._isEmitting) {
                this._isEmitting = false;
                this._stoppedEmitting(false);
            }

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

                var emitPower = Scalar.RandomRange(this.minEmitPower, this.maxEmitPower);

                if (this.startPositionFunction) {
                    this.startPositionFunction(worldMatrix, particle.position, particle);
                }
                else {
                    this.particleEmitterType.startPositionFunction(worldMatrix, particle.position, particle);
                }

                if (this.startDirectionFunction) {
                    this.startDirectionFunction(emitPower, worldMatrix, particle.direction, particle);
                }
                else {
                    this.particleEmitterType.startDirectionFunction(emitPower, worldMatrix, particle.direction, particle);
                }

                particle.lifeTime = Scalar.RandomRange(this.minLifeTime, this.maxLifeTime);

                particle.size = Scalar.RandomRange(this.minSize, this.maxSize);
                particle.angularSpeed = Scalar.RandomRange(this.minAngularSpeed, this.maxAngularSpeed);

                var step = Scalar.RandomRange(0, 1.0);

                Color4.LerpToRef(this.color1, this.color2, step, particle.color);

                this.colorDead.subtractToRef(particle.color, this._colorDiff);
                this._colorDiff.scaleToRef(1.0 / particle.lifeTime, particle.colorStep);
            }
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

            // Effect
            var join = defines.join("\n");
            if (this._cachedDefines !== join) {
                this._cachedDefines = join;

                var attributesNamesOrOptions: any;
                var effectCreationOption: any;

                if (this._isAnimationSheetEnabled) {
                    attributesNamesOrOptions = [VertexBuffer.PositionKind, VertexBuffer.ColorKind, "options", "cellIndex"];
                    effectCreationOption = ["invView", "view", "projection", "particlesInfos", "vClipPlane", "textureMask"];
                }
                else {
                    attributesNamesOrOptions = [VertexBuffer.PositionKind, VertexBuffer.ColorKind, "options"];
                    effectCreationOption = ["invView", "view", "projection", "vClipPlane", "textureMask"]
                }

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
         */
        public animate(): void {
            if (!this._started)
                return;

            var effect = this._getEffect();

            // Check
            if (!this.emitter || !effect.isReady() || !this.particleTexture || !this.particleTexture.isReady())
                return;

            if (this._currentRenderId === this._scene.getRenderId()) {
                return;
            }

            this._currentRenderId = this._scene.getRenderId();

            this._scaledUpdateSpeed = this.updateSpeed * this._scene.getAnimationRatio();

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

            // Animation sheet
            if (this._isAnimationSheetEnabled) {
                this._appendParticleVertexes = this._appenedParticleVertexesWithSheet;
            }
            else {
                this._appendParticleVertexes = this._appenedParticleVertexesNoSheet;
            }

            // Update VBO
            var offset = 0;
            for (var index = 0; index < this._particles.length; index++) {
                var particle = this._particles[index];
                this._appendParticleVertexes(offset, particle);
                offset += 4;
            }

            if (this._vertexBuffer) {
                this._vertexBuffer.update(this._vertexData);
            }
        }

        private _appendParticleVertexes: Nullable<(offset: number, particle: Particle) => void> = null;

        private _appenedParticleVertexesWithSheet(offset: number, particle: Particle) {
            this._appendParticleVertexWithAnimation(offset++, particle, 0, 0);
            this._appendParticleVertexWithAnimation(offset++, particle, 1, 0);
            this._appendParticleVertexWithAnimation(offset++, particle, 1, 1);
            this._appendParticleVertexWithAnimation(offset++, particle, 0, 1);
        }

        private _appenedParticleVertexesNoSheet(offset: number, particle: Particle) {
            this._appendParticleVertex(offset++, particle, 0, 0);
            this._appendParticleVertex(offset++, particle, 1, 0);
            this._appendParticleVertex(offset++, particle, 1, 1);
            this._appendParticleVertex(offset++, particle, 0, 1);
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
         * Renders the particle system in its current state.
         * @returns the current number of particles.
         */
        public render(): number {
            var effect = this._getEffect();

            // Check
            if (!this.emitter || !effect.isReady() || !this.particleTexture || !this.particleTexture.isReady() || !this._particles.length)
                return 0;

            var engine = this._scene.getEngine();

            // Render
            engine.enableEffect(effect);
            engine.setState(false);

            var viewMatrix = this._scene.getViewMatrix();
            effect.setTexture("diffuseSampler", this.particleTexture);
            effect.setMatrix("view", viewMatrix);
            effect.setMatrix("projection", this._scene.getProjectionMatrix());

            if (this._isAnimationSheetEnabled) {
                var baseSize = this.particleTexture.getBaseSize();
                effect.setFloat3("particlesInfos", this.spriteCellWidth / baseSize.width, this.spriteCellHeight / baseSize.height, baseSize.width / this.spriteCellWidth);
            }

            effect.setFloat4("textureMask", this.textureMask.r, this.textureMask.g, this.textureMask.b, this.textureMask.a);

            if (this._scene.clipPlane) {
                var clipPlane = this._scene.clipPlane;
                var invView = viewMatrix.clone();
                invView.invert();
                effect.setMatrix("invView", invView);
                effect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
            }

            // VBOs
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);

            // Draw order
            if (this.blendMode === ParticleSystem.BLENDMODE_ONEONE) {
                engine.setAlphaMode(Engine.ALPHA_ONEONE);
            } else {
                engine.setAlphaMode(Engine.ALPHA_COMBINE);
            }

            if (this.forceDepthWrite) {
                engine.setDepthWrite(true);
            }

            engine.drawElementsType(Material.TriangleFillMode, 0, this._particles.length * 6);
            engine.setAlphaMode(Engine.ALPHA_DISABLE);

            return this._particles.length;
        }

        /**
         * Disposes the particle system and free the associated resources.
         */
        public dispose(): void {
            if (this._vertexBuffer) {
                this._vertexBuffer.dispose();
                this._vertexBuffer = null;
            }

            if (this._indexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._indexBuffer);
                this._indexBuffer = null;
            }

            if (this.particleTexture) {
                this.particleTexture.dispose();
                this.particleTexture = null;
            }

            // Remove from scene
            var index = this._scene.particleSystems.indexOf(this);
            if (index > -1) {
                this._scene.particleSystems.splice(index, 1);
            }

            // Callback
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();

            if (this.subEmitters) {
                this.subEmitters.forEach(emitter => {
                    emitter.dispose();
                });
            }

            if (this.stockSubSystems) {
                this.stockSubSystems.forEach(index => {
                    this.stockSubSystems.get(index)!.forEach(subSystem => {
                        subSystem.dispose();
                    });
                });
            }

            if (this.activeSubSystems) {
                this.activeSubSystems.forEach(subSystem => {
                    subSystem.dispose();
                });
            }
        }

        /**
         * Creates a Sphere Emitter for the particle system. (emits along the sphere radius)
         * @param radius The radius of the sphere to emit from
         * @returns the emitter
         */
        public createSphereEmitter(radius = 1): SphereParticleEmitter {
            var particleEmitter = new SphereParticleEmitter(radius);
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
            var particleEmitter = new BoxParticleEmitter(this);
            this.direction1 = direction1;
            this.direction2 = direction2;
            this.minEmitBox = minEmitBox;
            this.maxEmitBox = maxEmitBox;
            this.particleEmitterType = particleEmitter;
            return particleEmitter;
        }

        private _cloneToSubSystem(root: ParticleSystem, newEmitter: Vector3): ParticleSystem {
            var custom: Nullable<Effect> = null;
            var program: any = null;
            if (this.customShader != null) {
                program = this.customShader;
                var defines: string = (program.shaderOptions.defines.length > 0) ? program.shaderOptions.defines.join("\n") : "";
                custom = this._scene.getEngine().createEffectForParticles(program.shaderPath.fragmentElement, program.shaderOptions.uniforms, program.shaderOptions.samplers, defines);
            }
            var result = new ParticleSystem(name, this._capacity, this._scene, custom);
            result.customShader = program;
            Tools.DeepCopy(this, result, ["customShader"]);
            result.name = name + "_Child_" + root.count++;
            result.id = result.name;
            result.emitter = newEmitter;
            result.particleEmitterType = this.particleEmitterType;
            result._initSubSystem(root);
            if (this.particleTexture) {
                result.particleTexture = new Texture(this.particleTexture.url, this._scene);
            }

            return result;
        }

        private count = 0;

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
            serializationObject.minAngularSpeed = this.minAngularSpeed;
            serializationObject.maxAngularSpeed = this.maxAngularSpeed;
            serializationObject.minSize = this.minSize;
            serializationObject.maxSize = this.maxSize;
            serializationObject.minEmitPower = this.minEmitPower;
            serializationObject.maxEmitPower = this.maxEmitPower;
            serializationObject.minLifeTime = this.minLifeTime;
            serializationObject.maxLifeTime = this.maxLifeTime;
            serializationObject.emitRate = this.emitRate;
            serializationObject.minEmitBox = this.minEmitBox.asArray();
            serializationObject.maxEmitBox = this.maxEmitBox.asArray();
            serializationObject.gravity = this.gravity.asArray();
            serializationObject.direction1 = this.direction1.asArray();
            serializationObject.direction2 = this.direction2.asArray();
            serializationObject.color1 = this.color1.asArray();
            serializationObject.color2 = this.color2.asArray();
            serializationObject.colorDead = this.colorDead.asArray();
            serializationObject.updateSpeed = this.updateSpeed;
            serializationObject.targetStopDuration = this.targetStopDuration;
            serializationObject.textureMask = this.textureMask.asArray();
            serializationObject.blendMode = this.blendMode;
            serializationObject.customShader = this.customShader;
            serializationObject.preventAutoStart = this.preventAutoStart;

            serializationObject.startSpriteCellID = this.startSpriteCellID;
            serializationObject.endSpriteCellID = this.endSpriteCellID;
            serializationObject.spriteCellLoop = this.spriteCellLoop;
            serializationObject.spriteCellChangeSpeed = this.spriteCellChangeSpeed;
            serializationObject.spriteCellWidth = this.spriteCellWidth;
            serializationObject.spriteCellHeight = this.spriteCellHeight;

            serializationObject.isAnimationSheetEnabled = this._isAnimationSheetEnabled;

            return serializationObject;
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

            if (parsedParticleSystem.autoAnimate) {
                scene.beginAnimation(particleSystem, parsedParticleSystem.autoAnimateFrom, parsedParticleSystem.autoAnimateTo, parsedParticleSystem.autoAnimateLoop, parsedParticleSystem.autoAnimateSpeed || 1.0);
            }

            // Particle system
            particleSystem.minAngularSpeed = parsedParticleSystem.minAngularSpeed;
            particleSystem.maxAngularSpeed = parsedParticleSystem.maxAngularSpeed;
            particleSystem.minSize = parsedParticleSystem.minSize;
            particleSystem.maxSize = parsedParticleSystem.maxSize;
            particleSystem.minLifeTime = parsedParticleSystem.minLifeTime;
            particleSystem.maxLifeTime = parsedParticleSystem.maxLifeTime;
            particleSystem.minEmitPower = parsedParticleSystem.minEmitPower;
            particleSystem.maxEmitPower = parsedParticleSystem.maxEmitPower;
            particleSystem.emitRate = parsedParticleSystem.emitRate;
            particleSystem.minEmitBox = Vector3.FromArray(parsedParticleSystem.minEmitBox);
            particleSystem.maxEmitBox = Vector3.FromArray(parsedParticleSystem.maxEmitBox);
            particleSystem.gravity = Vector3.FromArray(parsedParticleSystem.gravity);
            particleSystem.direction1 = Vector3.FromArray(parsedParticleSystem.direction1);
            particleSystem.direction2 = Vector3.FromArray(parsedParticleSystem.direction2);
            particleSystem.color1 = Color4.FromArray(parsedParticleSystem.color1);
            particleSystem.color2 = Color4.FromArray(parsedParticleSystem.color2);
            particleSystem.colorDead = Color4.FromArray(parsedParticleSystem.colorDead);
            particleSystem.updateSpeed = parsedParticleSystem.updateSpeed;
            particleSystem.targetStopDuration = parsedParticleSystem.targetStopDuration;
            particleSystem.textureMask = Color4.FromArray(parsedParticleSystem.textureMask);
            particleSystem.blendMode = parsedParticleSystem.blendMode;

            particleSystem.startSpriteCellID = parsedParticleSystem.startSpriteCellID;
            particleSystem.endSpriteCellID = parsedParticleSystem.endSpriteCellID;
            particleSystem.spriteCellLoop = parsedParticleSystem.spriteCellLoop;
            particleSystem.spriteCellChangeSpeed = parsedParticleSystem.spriteCellChangeSpeed;
            particleSystem.spriteCellWidth = parsedParticleSystem.spriteCellWidth;
            particleSystem.spriteCellHeight = parsedParticleSystem.spriteCellHeight;

            if (!particleSystem.preventAutoStart) {
                particleSystem.start();
            }

            return particleSystem;
        }
    }
}