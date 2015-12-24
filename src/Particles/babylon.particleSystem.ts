module BABYLON {
    var randomNumber = (min: number, max: number): number => {
        if (min === max) {
            return (min);
        }

        var random = Math.random();

        return ((random * (max - min)) + min);
    }

    export class ParticleSystem implements IDisposable {
        // Statics
        public static BLENDMODE_ONEONE = 0;
        public static BLENDMODE_STANDARD = 1;

        // Members
        public id: string;
        public renderingGroupId = 0;
        public emitter = null;
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

        public particleTexture: Texture;

        public layerMask: number = 0x0FFFFFFF;

        public onDispose: () => void;
        public updateFunction: (particles: Particle[]) => void;

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
        private _vertexDeclaration = [3, 4, 4];
        private _vertexStrideSize = 11 * 4; // 11 floats per particle (x, y, z, r, g, b, a, angle, size, offsetX, offsetY)
        private _stockParticles = new Array<Particle>();
        private _newPartsExcess = 0;
        private _vertexBuffer: WebGLBuffer;
        private _indexBuffer: WebGLBuffer;
        private _vertices: Float32Array;
        private _effect: Effect;
        private _customEffect: Effect;
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

        constructor(public name: string, capacity: number, scene: Scene, customEffect?: Effect) {
            this.id = name;
            this._capacity = capacity;

            this._scene = scene;

            this._customEffect = customEffect;

            scene.particleSystems.push(this);

            // VBO
            this._vertexBuffer = scene.getEngine().createDynamicVertexBuffer(capacity * this._vertexStrideSize * 4);

            var indices = [];
            var index = 0;
            for (var count = 0; count < capacity; count++) {
                indices.push(index);
                indices.push(index + 1);
                indices.push(index + 2);
                indices.push(index);
                indices.push(index + 2);
                indices.push(index + 3);
                index += 4;
            }

            this._indexBuffer = scene.getEngine().createIndexBuffer(indices);

            this._vertices = new Float32Array(capacity * this._vertexStrideSize);

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
                    }
                }
            }
        }

        public recycleParticle(particle: Particle): void {
            var lastParticle = this.particles.pop();

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

        public _appendParticleVertex(index: number, particle: Particle, offsetX: number, offsetY: number): void {
            var offset = index * 11;
            this._vertices[offset] = particle.position.x;
            this._vertices[offset + 1] = particle.position.y;
            this._vertices[offset + 2] = particle.position.z;
            this._vertices[offset + 3] = particle.color.r;
            this._vertices[offset + 4] = particle.color.g;
            this._vertices[offset + 5] = particle.color.b;
            this._vertices[offset + 6] = particle.color.a;
            this._vertices[offset + 7] = particle.angle;
            this._vertices[offset + 8] = particle.size;
            this._vertices[offset + 9] = offsetX;
            this._vertices[offset + 10] = offsetY;
        }

        private _update(newParticles: number): void {
            // Update current
            this._alive = this.particles.length > 0;

            this.updateFunction(this.particles);

            // Add new ones
            var worldMatrix;

            if (this.emitter.position) {
                worldMatrix = this.emitter.getWorldMatrix();
            } else {
                worldMatrix = Matrix.Translation(this.emitter.x, this.emitter.y, this.emitter.z);
            }
            var particle: Particle;
            for (var index = 0; index < newParticles; index++) {
                if (this.particles.length === this._capacity) {
                    break;
                }

                if (this._stockParticles.length !== 0) {
                    particle = this._stockParticles.pop();
                    particle.age = 0;
                } else {
                    particle = new Particle();
                }
                this.particles.push(particle);

                var emitPower = randomNumber(this.minEmitPower, this.maxEmitPower);

                this.startDirectionFunction(emitPower, worldMatrix, particle.direction, particle);

                particle.lifeTime = randomNumber(this.minLifeTime, this.maxLifeTime);

                particle.size = randomNumber(this.minSize, this.maxSize);
                particle.angularSpeed = randomNumber(this.minAngularSpeed, this.maxAngularSpeed);

                this.startPositionFunction(worldMatrix, particle.position, particle);

                Color4.RandomLerpToRef(this.color1, this.color2, particle.color);

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

            // Effect
            var join = defines.join("\n");
            if (this._cachedDefines !== join) {
                this._cachedDefines = join;

                this._effect = this._scene.getEngine().createEffect(
                    "particles",
                    ["position", "color", "options"],
                    ["invView", "view", "projection", "vClipPlane", "textureMask"],
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
            var emitCout;

            if (this.manualEmitCount > -1) {
                emitCout = this.manualEmitCount;
                this.manualEmitCount = 0;
            } else {
                emitCout = this.emitRate;
            }

            var newParticles = ((emitCout * this._scaledUpdateSpeed) >> 0);
            this._newPartsExcess += emitCout * this._scaledUpdateSpeed - newParticles;

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
                    if (this.disposeOnStop) {
                        this._scene._toBeDisposed.push(this);
                    }
                }
            }

            // Update VBO
            var offset = 0;
            for (var index = 0; index < this.particles.length; index++) {
                var particle = this.particles[index];

                this._appendParticleVertex(offset++, particle, 0, 0);
                this._appendParticleVertex(offset++, particle, 1, 0);
                this._appendParticleVertex(offset++, particle, 1, 1);
                this._appendParticleVertex(offset++, particle, 0, 1);
            }
            var engine = this._scene.getEngine();
            engine.updateDynamicVertexBuffer(this._vertexBuffer, this._vertices);
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
            effect.setFloat4("textureMask", this.textureMask.r, this.textureMask.g, this.textureMask.b, this.textureMask.a);

            if (this._scene.clipPlane) {
                var clipPlane = this._scene.clipPlane;
                var invView = viewMatrix.clone();
                invView.invert();
                effect.setMatrix("invView", invView);
                effect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
            }

            // VBOs
            engine.bindBuffers(this._vertexBuffer, this._indexBuffer, this._vertexDeclaration, this._vertexStrideSize, effect);

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
                this._scene.getEngine()._releaseBuffer(this._vertexBuffer);
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
            this._scene.particleSystems.splice(index, 1);

            // Callback
            if (this.onDispose) {
                this.onDispose();
            }
        }

        // Clone
        public clone(name: string, newEmitter: any): ParticleSystem {
            var result = new ParticleSystem(name, this._capacity, this._scene);

            Tools.DeepCopy(this, result, ["particles"], ["_vertexDeclaration", "_vertexStrideSize"]);

            if (newEmitter === undefined) {
                newEmitter = this.emitter;
            }

            result.emitter = newEmitter;
            if (this.particleTexture) {
                result.particleTexture = new Texture(this.particleTexture.url, this._scene);
            }

            result.start();

            return result;
        }

        public serialize(): any {
            var serializationObject: any = {};

            serializationObject.name = this.name;
            if (this.emitter.position) {
                serializationObject.emitterId = this.emitter.id;
            } else {
                serializationObject.emitter = this.emitter.asArray();;
            }
            serializationObject.capacity = this.getCapacity();

            if (this.particleTexture) {
                serializationObject.textureName = this.particleTexture.name;
            }

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

            return serializationObject;
        }

        public static Parse(parsedParticleSystem: any, scene: Scene, rootUrl: string): ParticleSystem {
            var name = parsedParticleSystem.name;
            var particleSystem = new ParticleSystem(name, parsedParticleSystem.capacity, scene);
            if (parsedParticleSystem.textureName) {
                particleSystem.particleTexture = new Texture(rootUrl + parsedParticleSystem.textureName, scene);
                particleSystem.particleTexture.name = parsedParticleSystem.textureName;
            }
            if (parsedParticleSystem.emitterId) {
                particleSystem.emitter = scene.getLastMeshByID(parsedParticleSystem.emitterId);
            } else {
                particleSystem.emitter = Vector3.FromArray(parsedParticleSystem.emitter);
            }
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
            particleSystem.start();

            return particleSystem;
        }
    }
}  

