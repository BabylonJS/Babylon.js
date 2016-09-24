var BABYLON;
(function (BABYLON) {
    var randomNumber = function (min, max) {
        if (min === max) {
            return (min);
        }
        var random = Math.random();
        return ((random * (max - min)) + min);
    };
    var ParticleSystem = (function () {
        function ParticleSystem(name, capacity, scene, customEffect) {
            var _this = this;
            this.name = name;
            // Members
            this.animations = [];
            this.renderingGroupId = 0;
            this.emitter = null;
            this.emitRate = 10;
            this.manualEmitCount = -1;
            this.updateSpeed = 0.01;
            this.targetStopDuration = 0;
            this.disposeOnStop = false;
            this.minEmitPower = 1;
            this.maxEmitPower = 1;
            this.minLifeTime = 1;
            this.maxLifeTime = 1;
            this.minSize = 1;
            this.maxSize = 1;
            this.minAngularSpeed = 0;
            this.maxAngularSpeed = 0;
            this.layerMask = 0x0FFFFFFF;
            /**
            * An event triggered when the system is disposed.
            * @type {BABYLON.Observable}
            */
            this.onDisposeObservable = new BABYLON.Observable();
            this.blendMode = ParticleSystem.BLENDMODE_ONEONE;
            this.forceDepthWrite = false;
            this.gravity = BABYLON.Vector3.Zero();
            this.direction1 = new BABYLON.Vector3(0, 1.0, 0);
            this.direction2 = new BABYLON.Vector3(0, 1.0, 0);
            this.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
            this.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);
            this.color1 = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
            this.color2 = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
            this.colorDead = new BABYLON.Color4(0, 0, 0, 1.0);
            this.textureMask = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
            this.particles = new Array();
            this._stockParticles = new Array();
            this._newPartsExcess = 0;
            this._vertexBuffers = {};
            this._scaledColorStep = new BABYLON.Color4(0, 0, 0, 0);
            this._colorDiff = new BABYLON.Color4(0, 0, 0, 0);
            this._scaledDirection = BABYLON.Vector3.Zero();
            this._scaledGravity = BABYLON.Vector3.Zero();
            this._currentRenderId = -1;
            this._started = false;
            this._stopped = false;
            this._actualFrame = 0;
            this.id = name;
            this._capacity = capacity;
            this._scene = scene;
            this._customEffect = customEffect;
            scene.particleSystems.push(this);
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
            // 11 floats per particle (x, y, z, r, g, b, a, angle, size, offsetX, offsetY) + 1 filler
            this._vertexData = new Float32Array(capacity * 11 * 4);
            this._vertexBuffer = new BABYLON.Buffer(scene.getEngine(), this._vertexData, true, 11);
            var positions = this._vertexBuffer.createVertexBuffer(BABYLON.VertexBuffer.PositionKind, 0, 3);
            var colors = this._vertexBuffer.createVertexBuffer(BABYLON.VertexBuffer.ColorKind, 3, 4);
            var options = this._vertexBuffer.createVertexBuffer("options", 7, 4);
            this._vertexBuffers[BABYLON.VertexBuffer.PositionKind] = positions;
            this._vertexBuffers[BABYLON.VertexBuffer.ColorKind] = colors;
            this._vertexBuffers["options"] = options;
            // Default behaviors
            this.startDirectionFunction = function (emitPower, worldMatrix, directionToUpdate, particle) {
                var randX = randomNumber(_this.direction1.x, _this.direction2.x);
                var randY = randomNumber(_this.direction1.y, _this.direction2.y);
                var randZ = randomNumber(_this.direction1.z, _this.direction2.z);
                BABYLON.Vector3.TransformNormalFromFloatsToRef(randX * emitPower, randY * emitPower, randZ * emitPower, worldMatrix, directionToUpdate);
            };
            this.startPositionFunction = function (worldMatrix, positionToUpdate, particle) {
                var randX = randomNumber(_this.minEmitBox.x, _this.maxEmitBox.x);
                var randY = randomNumber(_this.minEmitBox.y, _this.maxEmitBox.y);
                var randZ = randomNumber(_this.minEmitBox.z, _this.maxEmitBox.z);
                BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
            };
            this.updateFunction = function (particles) {
                for (var index = 0; index < particles.length; index++) {
                    var particle = particles[index];
                    particle.age += _this._scaledUpdateSpeed;
                    if (particle.age >= particle.lifeTime) {
                        _this.recycleParticle(particle);
                        index--;
                        continue;
                    }
                    else {
                        particle.colorStep.scaleToRef(_this._scaledUpdateSpeed, _this._scaledColorStep);
                        particle.color.addInPlace(_this._scaledColorStep);
                        if (particle.color.a < 0)
                            particle.color.a = 0;
                        particle.angle += particle.angularSpeed * _this._scaledUpdateSpeed;
                        particle.direction.scaleToRef(_this._scaledUpdateSpeed, _this._scaledDirection);
                        particle.position.addInPlace(_this._scaledDirection);
                        _this.gravity.scaleToRef(_this._scaledUpdateSpeed, _this._scaledGravity);
                        particle.direction.addInPlace(_this._scaledGravity);
                    }
                }
            };
        }
        Object.defineProperty(ParticleSystem.prototype, "onDispose", {
            set: function (callback) {
                if (this._onDisposeObserver) {
                    this.onDisposeObservable.remove(this._onDisposeObserver);
                }
                this._onDisposeObserver = this.onDisposeObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        ParticleSystem.prototype.recycleParticle = function (particle) {
            var lastParticle = this.particles.pop();
            if (lastParticle !== particle) {
                lastParticle.copyTo(particle);
                this._stockParticles.push(lastParticle);
            }
        };
        ParticleSystem.prototype.getCapacity = function () {
            return this._capacity;
        };
        ParticleSystem.prototype.isAlive = function () {
            return this._alive;
        };
        ParticleSystem.prototype.isStarted = function () {
            return this._started;
        };
        ParticleSystem.prototype.start = function () {
            this._started = true;
            this._stopped = false;
            this._actualFrame = 0;
        };
        ParticleSystem.prototype.stop = function () {
            this._stopped = true;
        };
        ParticleSystem.prototype._appendParticleVertex = function (index, particle, offsetX, offsetY) {
            var offset = index * 11;
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
        };
        ParticleSystem.prototype._update = function (newParticles) {
            // Update current
            this._alive = this.particles.length > 0;
            this.updateFunction(this.particles);
            // Add new ones
            var worldMatrix;
            if (this.emitter.position) {
                worldMatrix = this.emitter.getWorldMatrix();
            }
            else {
                worldMatrix = BABYLON.Matrix.Translation(this.emitter.x, this.emitter.y, this.emitter.z);
            }
            var particle;
            for (var index = 0; index < newParticles; index++) {
                if (this.particles.length === this._capacity) {
                    break;
                }
                if (this._stockParticles.length !== 0) {
                    particle = this._stockParticles.pop();
                    particle.age = 0;
                }
                else {
                    particle = new BABYLON.Particle();
                }
                this.particles.push(particle);
                var emitPower = randomNumber(this.minEmitPower, this.maxEmitPower);
                this.startDirectionFunction(emitPower, worldMatrix, particle.direction, particle);
                particle.lifeTime = randomNumber(this.minLifeTime, this.maxLifeTime);
                particle.size = randomNumber(this.minSize, this.maxSize);
                particle.angularSpeed = randomNumber(this.minAngularSpeed, this.maxAngularSpeed);
                this.startPositionFunction(worldMatrix, particle.position, particle);
                var step = randomNumber(0, 1.0);
                BABYLON.Color4.LerpToRef(this.color1, this.color2, step, particle.color);
                this.colorDead.subtractToRef(particle.color, this._colorDiff);
                this._colorDiff.scaleToRef(1.0 / particle.lifeTime, particle.colorStep);
            }
        };
        ParticleSystem.prototype._getEffect = function () {
            if (this._customEffect) {
                return this._customEffect;
            }
            ;
            var defines = [];
            if (this._scene.clipPlane) {
                defines.push("#define CLIPPLANE");
            }
            // Effect
            var join = defines.join("\n");
            if (this._cachedDefines !== join) {
                this._cachedDefines = join;
                this._effect = this._scene.getEngine().createEffect("particles", [BABYLON.VertexBuffer.PositionKind, BABYLON.VertexBuffer.ColorKind, "options"], ["invView", "view", "projection", "vClipPlane", "textureMask"], ["diffuseSampler"], join);
            }
            return this._effect;
        };
        ParticleSystem.prototype.animate = function () {
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
            }
            else {
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
            }
            else {
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
            this._vertexBuffer.update(this._vertexData);
        };
        ParticleSystem.prototype.render = function () {
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
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);
            // Draw order
            if (this.blendMode === ParticleSystem.BLENDMODE_ONEONE) {
                engine.setAlphaMode(BABYLON.Engine.ALPHA_ONEONE);
            }
            else {
                engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE);
            }
            if (this.forceDepthWrite) {
                engine.setDepthWrite(true);
            }
            engine.draw(true, 0, this.particles.length * 6);
            engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);
            return this.particles.length;
        };
        ParticleSystem.prototype.dispose = function () {
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
            this._scene.particleSystems.splice(index, 1);
            // Callback
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();
        };
        // Clone
        ParticleSystem.prototype.clone = function (name, newEmitter) {
            var result = new ParticleSystem(name, this._capacity, this._scene);
            BABYLON.Tools.DeepCopy(this, result, ["particles"]);
            if (newEmitter === undefined) {
                newEmitter = this.emitter;
            }
            result.emitter = newEmitter;
            if (this.particleTexture) {
                result.particleTexture = new BABYLON.Texture(this.particleTexture.url, this._scene);
            }
            result.start();
            return result;
        };
        ParticleSystem.prototype.serialize = function () {
            var serializationObject = {};
            serializationObject.name = this.name;
            serializationObject.id = this.id;
            // Emitter
            if (this.emitter.position) {
                serializationObject.emitterId = this.emitter.id;
            }
            else {
                serializationObject.emitter = this.emitter.asArray();
            }
            serializationObject.capacity = this.getCapacity();
            if (this.particleTexture) {
                serializationObject.textureName = this.particleTexture.name;
            }
            // Animations
            BABYLON.Animation.AppendSerializedAnimations(this, serializationObject);
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
            return serializationObject;
        };
        ParticleSystem.Parse = function (parsedParticleSystem, scene, rootUrl) {
            var name = parsedParticleSystem.name;
            var particleSystem = new ParticleSystem(name, parsedParticleSystem.capacity, scene);
            if (parsedParticleSystem.id) {
                particleSystem.id = parsedParticleSystem.id;
            }
            // Texture
            if (parsedParticleSystem.textureName) {
                particleSystem.particleTexture = new BABYLON.Texture(rootUrl + parsedParticleSystem.textureName, scene);
                particleSystem.particleTexture.name = parsedParticleSystem.textureName;
            }
            // Emitter
            if (parsedParticleSystem.emitterId) {
                particleSystem.emitter = scene.getLastMeshByID(parsedParticleSystem.emitterId);
            }
            else {
                particleSystem.emitter = BABYLON.Vector3.FromArray(parsedParticleSystem.emitter);
            }
            // Animations
            if (parsedParticleSystem.animations) {
                for (var animationIndex = 0; animationIndex < parsedParticleSystem.animations.length; animationIndex++) {
                    var parsedAnimation = parsedParticleSystem.animations[animationIndex];
                    particleSystem.animations.push(BABYLON.Animation.Parse(parsedAnimation));
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
            particleSystem.minEmitBox = BABYLON.Vector3.FromArray(parsedParticleSystem.minEmitBox);
            particleSystem.maxEmitBox = BABYLON.Vector3.FromArray(parsedParticleSystem.maxEmitBox);
            particleSystem.gravity = BABYLON.Vector3.FromArray(parsedParticleSystem.gravity);
            particleSystem.direction1 = BABYLON.Vector3.FromArray(parsedParticleSystem.direction1);
            particleSystem.direction2 = BABYLON.Vector3.FromArray(parsedParticleSystem.direction2);
            particleSystem.color1 = BABYLON.Color4.FromArray(parsedParticleSystem.color1);
            particleSystem.color2 = BABYLON.Color4.FromArray(parsedParticleSystem.color2);
            particleSystem.colorDead = BABYLON.Color4.FromArray(parsedParticleSystem.colorDead);
            particleSystem.updateSpeed = parsedParticleSystem.updateSpeed;
            particleSystem.targetStopDuration = parsedParticleSystem.targetStopDuration;
            particleSystem.textureMask = BABYLON.Color4.FromArray(parsedParticleSystem.textureMask);
            particleSystem.blendMode = parsedParticleSystem.blendMode;
            if (!parsedParticleSystem.preventAutoStart) {
                particleSystem.start();
            }
            return particleSystem;
        };
        // Statics
        ParticleSystem.BLENDMODE_ONEONE = 0;
        ParticleSystem.BLENDMODE_STANDARD = 1;
        return ParticleSystem;
    }());
    BABYLON.ParticleSystem = ParticleSystem;
})(BABYLON || (BABYLON = {}));
