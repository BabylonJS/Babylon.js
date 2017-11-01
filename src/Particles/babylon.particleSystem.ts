module BABYLON {
    var randomNumber = (min: number, max: number): number => {
        if (min === max) {
            return (min);
        }

        var random = Math.random();

        return ((random * (max - min)) + min);
    }

    export interface IParticleSystem {
        id: string;
        name: string;
        emitter: Nullable<AbstractMesh | Vector3>; 
        renderingGroupId: number;
        layerMask: number;
        isStarted(): boolean;
        animate(): void;
        render(): number;
        dispose(): void;
        clone(name: string, newEmitter: any): Nullable<IParticleSystem>;
        serialize(): any;

        rebuild(): void
    }

    export class ParticleSystem implements IDisposable, IAnimatable, IParticleSystem {
        // Statics
        public static BLENDMODE_ONEONE = 0;
        public static BLENDMODE_STANDARD = 1;

        // Members
        public animations: Animation[] = [];

        public id: string;
        public renderingGroupId = 0;
        public emitter: Nullable<AbstractMesh | Vector3> = null;
        public emitRate = 10;
        public manualEmitCount = -1;
        public updateSpeed = 0.01;
        public targetStopDuration = 0;
        public disposeOnStop = false;

        public minEmitPower = 1;
        public maxEmitPower = 1;

        public minLifeTime = 1;
        public maxLifeTime = 1;

        public minSize = 1;
        public maxSize = 1;
        public minAngularSpeed = 0;
        public maxAngularSpeed = 0;

        public particleTexture: Nullable<Texture>;

        public layerMask: number = 0x0FFFFFFF;

        public customShader: any = null;
        public preventAutoStart: boolean = false;

        private _epsilon: number;


        /**
        * An event triggered when the system is disposed.
        * @type {BABYLON.Observable}
        */
        public onDisposeObservable = new Observable<ParticleSystem>();

        private _onDisposeObserver: Nullable<Observer<ParticleSystem>>;
        public set onDispose(callback: () => void) {
            if (this._onDisposeObserver) {
                this.onDisposeObservable.remove(this._onDisposeObserver);
            }
            this._onDisposeObserver = this.onDisposeObservable.add(callback);
        }

        public updateFunction: (particles: Particle[]) => void;
        public onAnimationEnd: Nullable<() => void> = null;

        public blendMode = ParticleSystem.BLENDMODE_ONEONE;

        public forceDepthWrite = false;

        public gravity = Vector3.Zero();
        public direction1 = new Vector3(0, 1.0, 0);
        public direction2 = new Vector3(0, 1.0, 0);
        public minEmitBox = new Vector3(-0.5, -0.5, -0.5);
        public maxEmitBox = new Vector3(0.5, 0.5, 0.5);
        public color1 = new Color4(1.0, 1.0, 1.0, 1.0);
        public color2 = new Color4(1.0, 1.0, 1.0, 1.0);
        public colorDead = new Color4(0, 0, 0, 1.0);
        public textureMask = new Color4(1.0, 1.0, 1.0, 1.0);
        public startDirectionFunction: (emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle) => void;
        public startPositionFunction: (worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle) => void;

        private particles = new Array<Particle>();

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

        // sheet animation
        public startSpriteCellID = 0;
        public endSpriteCellID = 0;
        public spriteCellLoop = true;
        public spriteCellChangeSpeed = 0;

        public spriteCellWidth = 0;
        public spriteCellHeight = 0;
        private _vertexBufferSize = 11;

        public get isAnimationSheetEnabled(): Boolean {
            return this._isAnimationSheetEnabled;
        }
        // end of sheet animation

        constructor(public name: string, capacity: number, scene: Scene, customEffect: Nullable<Effect> = null, private _isAnimationSheetEnabled: boolean = false, epsilon: number = 0.01) {
            this.id = name;
            this._capacity = capacity;

            this._epsilon = epsilon;
            if (_isAnimationSheetEnabled) {
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
            this.startDirectionFunction = (emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void => {
                var randX = randomNumber(this.direction1.x, this.direction2.x);
                var randY = randomNumber(this.direction1.y, this.direction2.y);
                var randZ = randomNumber(this.direction1.z, this.direction2.z);

                Vector3.TransformNormalFromFloatsToRef(randX * emitPower, randY * emitPower, randZ * emitPower, worldMatrix, directionToUpdate);
            }

            this.startPositionFunction = (worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle): void => {
                var randX = randomNumber(this.minEmitBox.x, this.maxEmitBox.x);
                var randY = randomNumber(this.minEmitBox.y, this.maxEmitBox.y);
                var randZ = randomNumber(this.minEmitBox.z, this.maxEmitBox.z);

                Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
            }

            this.updateFunction = (particles: Particle[]): void => {
                for (var index = 0; index < particles.length; index++) {
                    var particle = particles[index];
                    particle.age += this._scaledUpdateSpeed;

                    if (particle.age >= particle.lifeTime) { // Recycle by swapping with last particle
                        this.recycleParticle(particle);
                        index--;
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

        public recycleParticle(particle: Particle): void {
            var lastParticle = <Particle>this.particles.pop();

            if (lastParticle !== particle) {
                lastParticle.copyTo(particle);
                this._stockParticles.push(lastParticle);
            }
        }

        public getCapacity(): number {
            return this._capacity;
        }

        public isAlive(): boolean {
            return this._alive;
        }

        public isStarted(): boolean {
            return this._started;
        }

        public start(): void {
            this._started = true;
            this._stopped = false;
            this._actualFrame = 0;
        }

        public stop(): void {
            this._stopped = true;
        }

        // animation sheet

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

        private _update(newParticles: number): void {
            // Update current
            this._alive = this.particles.length > 0;

            this.updateFunction(this.particles);

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
                if (this.particles.length === this._capacity) {
                    break;
                }

                if (this._stockParticles.length !== 0) {
                    particle = <Particle>this._stockParticles.pop();
                    particle.age = 0;
                    particle.cellIndex = this.startSpriteCellID;
                } else {
                    particle = new Particle(this);
                }

                this.particles.push(particle);

                var emitPower = randomNumber(this.minEmitPower, this.maxEmitPower);

                this.startDirectionFunction(emitPower, worldMatrix, particle.direction, particle);

                particle.lifeTime = randomNumber(this.minLifeTime, this.maxLifeTime);

                particle.size = randomNumber(this.minSize, this.maxSize);
                particle.angularSpeed = randomNumber(this.minAngularSpeed, this.maxAngularSpeed);

                this.startPositionFunction(worldMatrix, particle.position, particle);

                var step = randomNumber(0, 1.0);

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
                this.appendParticleVertexes = this.appenedParticleVertexesWithSheet;
            }
            else {
                this.appendParticleVertexes = this.appenedParticleVertexesNoSheet;
            }

            // Update VBO
            var offset = 0;
            for (var index = 0; index < this.particles.length; index++) {
                var particle = this.particles[index];
                this.appendParticleVertexes(offset, particle);
                offset += 4;
            }

            if (this._vertexBuffer) {
                this._vertexBuffer.update(this._vertexData);
            }
        }

        public appendParticleVertexes: Nullable<(offset: number, particle: Particle) => void> = null;

        private appenedParticleVertexesWithSheet(offset: number, particle: Particle) {
            this._appendParticleVertexWithAnimation(offset++, particle, 0, 0);
            this._appendParticleVertexWithAnimation(offset++, particle, 1, 0);
            this._appendParticleVertexWithAnimation(offset++, particle, 1, 1);
            this._appendParticleVertexWithAnimation(offset++, particle, 0, 1);
        }

        private appenedParticleVertexesNoSheet(offset: number, particle: Particle) {
            this._appendParticleVertex(offset++, particle, 0, 0);
            this._appendParticleVertex(offset++, particle, 1, 0);
            this._appendParticleVertex(offset++, particle, 1, 1);
            this._appendParticleVertex(offset++, particle, 0, 1);
        }

        public rebuild(): void {
            this._createIndexBuffer();

            if (this._vertexBuffer) {
                this._vertexBuffer._rebuild();
            }
        }

        public render(): number {
            var effect = this._getEffect();

            // Check
            if (!this.emitter || !effect.isReady() || !this.particleTexture || !this.particleTexture.isReady() || !this.particles.length)
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

            engine.draw(true, 0, this.particles.length * 6);
            engine.setAlphaMode(Engine.ALPHA_DISABLE);

            return this.particles.length;
        }

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
        }

        // Clone
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

            return serializationObject;
        }

        public static Parse(parsedParticleSystem: any, scene: Scene, rootUrl: string): ParticleSystem {
            var name = parsedParticleSystem.name;
            var custom: Nullable<Effect> = null;
            var program: any = null;
            if (parsedParticleSystem.customShader) {
                program = parsedParticleSystem.customShader;
                var defines: string = (program.shaderOptions.defines.length > 0) ? program.shaderOptions.defines.join("\n") : "";
                custom = scene.getEngine().createEffectForParticles(program.shaderPath.fragmentElement, program.shaderOptions.uniforms, program.shaderOptions.samplers, defines);
            }
            var particleSystem = new ParticleSystem(name, parsedParticleSystem.capacity, scene, custom);
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

            if (!particleSystem.preventAutoStart) {
                particleSystem.start();
            }

            return particleSystem;
        }
    }
}