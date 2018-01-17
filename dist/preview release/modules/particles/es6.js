var __extends = (this && this.__extends) || (function () {
var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
return function (d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
})();


import * as BABYLON from 'babylonjs/core/es6';
var BABYLON;
(function (BABYLON) {
    var Particle = /** @class */ (function () {
        function Particle(particleSystem) {
            this.particleSystem = particleSystem;
            this.position = BABYLON.Vector3.Zero();
            this.direction = BABYLON.Vector3.Zero();
            this.color = new BABYLON.Color4(0, 0, 0, 0);
            this.colorStep = new BABYLON.Color4(0, 0, 0, 0);
            this.lifeTime = 1.0;
            this.age = 0;
            this.size = 0;
            this.angle = 0;
            this.angularSpeed = 0;
            this._currentFrameCounter = 0;
            this.cellIndex = 0;
            if (!this.particleSystem.isAnimationSheetEnabled) {
                return;
            }
            this.cellIndex = this.particleSystem.startSpriteCellID;
            if (this.particleSystem.spriteCellChangeSpeed == 0) {
                this.updateCellIndex = this.updateCellIndexWithSpeedCalculated;
            }
            else {
                this.updateCellIndex = this.updateCellIndexWithCustomSpeed;
            }
        }
        Particle.prototype.updateCellIndexWithSpeedCalculated = function (scaledUpdateSpeed) {
            //   (ageOffset / scaledUpdateSpeed) / available cells
            var numberOfScaledUpdatesPerCell = ((this.lifeTime - this.age) / scaledUpdateSpeed) / (this.particleSystem.endSpriteCellID + 1 - this.cellIndex);
            this._currentFrameCounter += scaledUpdateSpeed;
            if (this._currentFrameCounter >= numberOfScaledUpdatesPerCell * scaledUpdateSpeed) {
                this._currentFrameCounter = 0;
                this.cellIndex++;
                if (this.cellIndex > this.particleSystem.endSpriteCellID) {
                    this.cellIndex = this.particleSystem.endSpriteCellID;
                }
            }
        };
        Particle.prototype.updateCellIndexWithCustomSpeed = function () {
            if (this._currentFrameCounter >= this.particleSystem.spriteCellChangeSpeed) {
                this.cellIndex++;
                this._currentFrameCounter = 0;
                if (this.cellIndex > this.particleSystem.endSpriteCellID) {
                    if (this.particleSystem.spriteCellLoop) {
                        this.cellIndex = this.particleSystem.startSpriteCellID;
                    }
                    else {
                        this.cellIndex = this.particleSystem.endSpriteCellID;
                    }
                }
            }
            else {
                this._currentFrameCounter++;
            }
        };
        Particle.prototype.copyTo = function (other) {
            other.position.copyFrom(this.position);
            other.direction.copyFrom(this.direction);
            other.color.copyFrom(this.color);
            other.colorStep.copyFrom(this.colorStep);
            other.lifeTime = this.lifeTime;
            other.age = this.age;
            other.size = this.size;
            other.angle = this.angle;
            other.angularSpeed = this.angularSpeed;
            other.particleSystem = this.particleSystem;
            other.cellIndex = this.cellIndex;
        };
        return Particle;
    }());
    BABYLON.Particle = Particle;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.particle.js.map

var BABYLON;
(function (BABYLON) {
    var ParticleSystem = /** @class */ (function () {
        // end of sheet animation
        function ParticleSystem(name, capacity, scene, customEffect, _isAnimationSheetEnabled, epsilon) {
            if (customEffect === void 0) { customEffect = null; }
            if (_isAnimationSheetEnabled === void 0) { _isAnimationSheetEnabled = false; }
            if (epsilon === void 0) { epsilon = 0.01; }
            var _this = this;
            this.name = name;
            this._isAnimationSheetEnabled = _isAnimationSheetEnabled;
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
            this.customShader = null;
            this.preventAutoStart = false;
            /**
            * An event triggered when the system is disposed.
            * @type {BABYLON.Observable}
            */
            this.onDisposeObservable = new BABYLON.Observable();
            this.onAnimationEnd = null;
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
            // sheet animation
            this.startSpriteCellID = 0;
            this.endSpriteCellID = 0;
            this.spriteCellLoop = true;
            this.spriteCellChangeSpeed = 0;
            this.spriteCellWidth = 0;
            this.spriteCellHeight = 0;
            this._vertexBufferSize = 11;
            this.appendParticleVertexes = null;
            this.id = name;
            this._capacity = capacity;
            this._epsilon = epsilon;
            if (_isAnimationSheetEnabled) {
                this._vertexBufferSize = 12;
            }
            this._scene = scene || BABYLON.Engine.LastCreatedScene;
            this._customEffect = customEffect;
            scene.particleSystems.push(this);
            this._createIndexBuffer();
            // 11 floats per particle (x, y, z, r, g, b, a, angle, size, offsetX, offsetY) + 1 filler
            this._vertexData = new Float32Array(capacity * this._vertexBufferSize * 4);
            this._vertexBuffer = new BABYLON.Buffer(scene.getEngine(), this._vertexData, true, this._vertexBufferSize);
            var positions = this._vertexBuffer.createVertexBuffer(BABYLON.VertexBuffer.PositionKind, 0, 3);
            var colors = this._vertexBuffer.createVertexBuffer(BABYLON.VertexBuffer.ColorKind, 3, 4);
            var options = this._vertexBuffer.createVertexBuffer("options", 7, 4);
            if (this._isAnimationSheetEnabled) {
                var cellIndexBuffer = this._vertexBuffer.createVertexBuffer("cellIndex", 11, 1);
                this._vertexBuffers["cellIndex"] = cellIndexBuffer;
            }
            this._vertexBuffers[BABYLON.VertexBuffer.PositionKind] = positions;
            this._vertexBuffers[BABYLON.VertexBuffer.ColorKind] = colors;
            this._vertexBuffers["options"] = options;
            // Default behaviors
            this.particleEmitterType = new BABYLON.BoxParticleEmitter(this);
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
                        if (_this._isAnimationSheetEnabled) {
                            particle.updateCellIndex(_this._scaledUpdateSpeed);
                        }
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
        Object.defineProperty(ParticleSystem.prototype, "isAnimationSheetEnabled", {
            get: function () {
                return this._isAnimationSheetEnabled;
            },
            enumerable: true,
            configurable: true
        });
        ParticleSystem.prototype._createIndexBuffer = function () {
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
        };
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
        // animation sheet
        ParticleSystem.prototype._appendParticleVertex = function (index, particle, offsetX, offsetY) {
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
        };
        ParticleSystem.prototype._appendParticleVertexWithAnimation = function (index, particle, offsetX, offsetY) {
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
        };
        ParticleSystem.prototype._update = function (newParticles) {
            // Update current
            this._alive = this.particles.length > 0;
            this.updateFunction(this.particles);
            // Add new ones
            var worldMatrix;
            if (this.emitter.position) {
                var emitterMesh = this.emitter;
                worldMatrix = emitterMesh.getWorldMatrix();
            }
            else {
                var emitterPosition = this.emitter;
                worldMatrix = BABYLON.Matrix.Translation(emitterPosition.x, emitterPosition.y, emitterPosition.z);
            }
            var particle;
            for (var index = 0; index < newParticles; index++) {
                if (this.particles.length === this._capacity) {
                    break;
                }
                if (this._stockParticles.length !== 0) {
                    particle = this._stockParticles.pop();
                    particle.age = 0;
                    particle.cellIndex = this.startSpriteCellID;
                }
                else {
                    particle = new BABYLON.Particle(this);
                }
                this.particles.push(particle);
                var emitPower = ParticleSystem.randomNumber(this.minEmitPower, this.maxEmitPower);
                if (this.startDirectionFunction) {
                    this.startDirectionFunction(emitPower, worldMatrix, particle.direction, particle);
                }
                else {
                    this.particleEmitterType.startDirectionFunction(emitPower, worldMatrix, particle.direction, particle);
                }
                if (this.startPositionFunction) {
                    this.startPositionFunction(worldMatrix, particle.position, particle);
                }
                else {
                    this.particleEmitterType.startPositionFunction(worldMatrix, particle.position, particle);
                }
                particle.lifeTime = ParticleSystem.randomNumber(this.minLifeTime, this.maxLifeTime);
                particle.size = ParticleSystem.randomNumber(this.minSize, this.maxSize);
                particle.angularSpeed = ParticleSystem.randomNumber(this.minAngularSpeed, this.maxAngularSpeed);
                var step = ParticleSystem.randomNumber(0, 1.0);
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
            if (this._isAnimationSheetEnabled) {
                defines.push("#define ANIMATESHEET");
            }
            // Effect
            var join = defines.join("\n");
            if (this._cachedDefines !== join) {
                this._cachedDefines = join;
                var attributesNamesOrOptions;
                var effectCreationOption;
                if (this._isAnimationSheetEnabled) {
                    attributesNamesOrOptions = [BABYLON.VertexBuffer.PositionKind, BABYLON.VertexBuffer.ColorKind, "options", "cellIndex"];
                    effectCreationOption = ["invView", "view", "projection", "particlesInfos", "vClipPlane", "textureMask"];
                }
                else {
                    attributesNamesOrOptions = [BABYLON.VertexBuffer.PositionKind, BABYLON.VertexBuffer.ColorKind, "options"];
                    effectCreationOption = ["invView", "view", "projection", "vClipPlane", "textureMask"];
                }
                this._effect = this._scene.getEngine().createEffect("particles", attributesNamesOrOptions, effectCreationOption, ["diffuseSampler"], join);
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
        };
        ParticleSystem.prototype.appenedParticleVertexesWithSheet = function (offset, particle) {
            this._appendParticleVertexWithAnimation(offset++, particle, 0, 0);
            this._appendParticleVertexWithAnimation(offset++, particle, 1, 0);
            this._appendParticleVertexWithAnimation(offset++, particle, 1, 1);
            this._appendParticleVertexWithAnimation(offset++, particle, 0, 1);
        };
        ParticleSystem.prototype.appenedParticleVertexesNoSheet = function (offset, particle) {
            this._appendParticleVertex(offset++, particle, 0, 0);
            this._appendParticleVertex(offset++, particle, 1, 0);
            this._appendParticleVertex(offset++, particle, 1, 1);
            this._appendParticleVertex(offset++, particle, 0, 1);
        };
        ParticleSystem.prototype.rebuild = function () {
            this._createIndexBuffer();
            if (this._vertexBuffer) {
                this._vertexBuffer._rebuild();
            }
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
                engine.setAlphaMode(BABYLON.Engine.ALPHA_ONEONE);
            }
            else {
                engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE);
            }
            if (this.forceDepthWrite) {
                engine.setDepthWrite(true);
            }
            engine.drawElementsType(BABYLON.Material.TriangleFillMode, 0, this.particles.length * 6);
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
            if (index > -1) {
                this._scene.particleSystems.splice(index, 1);
            }
            // Callback
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();
        };
        ParticleSystem.prototype.createSphereEmitter = function (radius) {
            if (radius === void 0) { radius = 1; }
            var particleEmitter = new BABYLON.SphereParticleEmitter(radius);
            this.particleEmitterType = particleEmitter;
            return particleEmitter;
        };
        ParticleSystem.prototype.createDirectedSphereEmitter = function (radius, direction1, direction2) {
            if (radius === void 0) { radius = 1; }
            if (direction1 === void 0) { direction1 = new BABYLON.Vector3(0, 1.0, 0); }
            if (direction2 === void 0) { direction2 = new BABYLON.Vector3(0, 1.0, 0); }
            var particleEmitter = new BABYLON.SphereDirectedParticleEmitter(radius, direction1, direction2);
            this.particleEmitterType = particleEmitter;
            return particleEmitter;
        };
        ParticleSystem.prototype.createConeEmitter = function (radius, angle) {
            if (radius === void 0) { radius = 1; }
            if (angle === void 0) { angle = Math.PI / 4; }
            var particleEmitter = new BABYLON.ConeParticleEmitter(radius, angle);
            this.particleEmitterType = particleEmitter;
            return particleEmitter;
        };
        // this method needs to be changed when breaking changes will be allowed to match the sphere and cone methods and properties direction1,2 and minEmitBox,maxEmitBox to be removed from the system.
        ParticleSystem.prototype.createBoxEmitter = function (direction1, direction2, minEmitBox, maxEmitBox) {
            var particleEmitter = new BABYLON.BoxParticleEmitter(this);
            this.direction1 = direction1;
            this.direction2 = direction2;
            this.minEmitBox = minEmitBox;
            this.maxEmitBox = maxEmitBox;
            this.particleEmitterType = particleEmitter;
            return particleEmitter;
        };
        ParticleSystem.randomNumber = function (min, max) {
            if (min === max) {
                return (min);
            }
            var random = Math.random();
            return ((random * (max - min)) + min);
        };
        // Clone
        ParticleSystem.prototype.clone = function (name, newEmitter) {
            var custom = null;
            var program = null;
            if (this.customShader != null) {
                program = this.customShader;
                var defines = (program.shaderOptions.defines.length > 0) ? program.shaderOptions.defines.join("\n") : "";
                custom = this._scene.getEngine().createEffectForParticles(program.shaderPath.fragmentElement, program.shaderOptions.uniforms, program.shaderOptions.samplers, defines);
            }
            var result = new ParticleSystem(name, this._capacity, this._scene, custom);
            result.customShader = program;
            BABYLON.Tools.DeepCopy(this, result, ["particles", "customShader"]);
            if (newEmitter === undefined) {
                newEmitter = this.emitter;
            }
            result.emitter = newEmitter;
            if (this.particleTexture) {
                result.particleTexture = new BABYLON.Texture(this.particleTexture.url, this._scene);
            }
            if (!this.preventAutoStart) {
                result.start();
            }
            return result;
        };
        ParticleSystem.prototype.serialize = function () {
            var serializationObject = {};
            serializationObject.name = this.name;
            serializationObject.id = this.id;
            // Emitter
            if (this.emitter.position) {
                var emitterMesh = this.emitter;
                serializationObject.emitterId = emitterMesh.id;
            }
            else {
                var emitterPosition = this.emitter;
                serializationObject.emitter = emitterPosition.asArray();
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
        };
        ParticleSystem.Parse = function (parsedParticleSystem, scene, rootUrl) {
            var name = parsedParticleSystem.name;
            var custom = null;
            var program = null;
            if (parsedParticleSystem.customShader) {
                program = parsedParticleSystem.customShader;
                var defines = (program.shaderOptions.defines.length > 0) ? program.shaderOptions.defines.join("\n") : "";
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
        };
        // Statics
        ParticleSystem.BLENDMODE_ONEONE = 0;
        ParticleSystem.BLENDMODE_STANDARD = 1;
        return ParticleSystem;
    }());
    BABYLON.ParticleSystem = ParticleSystem;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.particleSystem.js.map

var BABYLON;
(function (BABYLON) {
    var BoxParticleEmitter = /** @class */ (function () {
        // to be updated like the rest of emitters when breaking changes.
        // all property should be come public variables and passed through constructor.
        function BoxParticleEmitter(_particleSystem) {
            this._particleSystem = _particleSystem;
        }
        Object.defineProperty(BoxParticleEmitter.prototype, "direction1", {
            get: function () {
                return this._particleSystem.direction1;
            },
            set: function (value) {
                this._particleSystem.direction1 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BoxParticleEmitter.prototype, "direction2", {
            get: function () {
                return this._particleSystem.direction2;
            },
            set: function (value) {
                this._particleSystem.direction2 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BoxParticleEmitter.prototype, "minEmitBox", {
            get: function () {
                return this._particleSystem.minEmitBox;
            },
            set: function (value) {
                this._particleSystem.minEmitBox = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BoxParticleEmitter.prototype, "maxEmitBox", {
            get: function () {
                return this._particleSystem.maxEmitBox;
            },
            set: function (value) {
                this._particleSystem.maxEmitBox = value;
            },
            enumerable: true,
            configurable: true
        });
        BoxParticleEmitter.prototype.startDirectionFunction = function (emitPower, worldMatrix, directionToUpdate, particle) {
            var randX = BABYLON.ParticleSystem.randomNumber(this.direction1.x, this.direction2.x);
            var randY = BABYLON.ParticleSystem.randomNumber(this.direction1.y, this.direction2.y);
            var randZ = BABYLON.ParticleSystem.randomNumber(this.direction1.z, this.direction2.z);
            BABYLON.Vector3.TransformNormalFromFloatsToRef(randX * emitPower, randY * emitPower, randZ * emitPower, worldMatrix, directionToUpdate);
        };
        BoxParticleEmitter.prototype.startPositionFunction = function (worldMatrix, positionToUpdate, particle) {
            var randX = BABYLON.ParticleSystem.randomNumber(this.minEmitBox.x, this.maxEmitBox.x);
            var randY = BABYLON.ParticleSystem.randomNumber(this.minEmitBox.y, this.maxEmitBox.y);
            var randZ = BABYLON.ParticleSystem.randomNumber(this.minEmitBox.z, this.maxEmitBox.z);
            BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
        };
        return BoxParticleEmitter;
    }());
    BABYLON.BoxParticleEmitter = BoxParticleEmitter;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.boxParticleEmitter.js.map

var BABYLON;
(function (BABYLON) {
    var ConeParticleEmitter = /** @class */ (function () {
        function ConeParticleEmitter(radius, angle) {
            this.radius = radius;
            this.angle = angle;
        }
        ConeParticleEmitter.prototype.startDirectionFunction = function (emitPower, worldMatrix, directionToUpdate, particle) {
            if (this.angle === 0) {
                BABYLON.Vector3.TransformNormalFromFloatsToRef(0, emitPower, 0, worldMatrix, directionToUpdate);
            }
            else {
                var phi = BABYLON.ParticleSystem.randomNumber(0, 2 * Math.PI);
                var theta = BABYLON.ParticleSystem.randomNumber(0, this.angle);
                var randX = Math.cos(phi) * Math.sin(theta);
                var randY = Math.cos(theta);
                var randZ = Math.sin(phi) * Math.sin(theta);
                BABYLON.Vector3.TransformNormalFromFloatsToRef(randX * emitPower, randY * emitPower, randZ * emitPower, worldMatrix, directionToUpdate);
            }
        };
        ConeParticleEmitter.prototype.startPositionFunction = function (worldMatrix, positionToUpdate, particle) {
            var s = BABYLON.ParticleSystem.randomNumber(0, Math.PI * 2);
            var radius = BABYLON.ParticleSystem.randomNumber(0, this.radius);
            var randX = radius * Math.sin(s);
            var randZ = radius * Math.cos(s);
            BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(randX, 0, randZ, worldMatrix, positionToUpdate);
        };
        return ConeParticleEmitter;
    }());
    BABYLON.ConeParticleEmitter = ConeParticleEmitter;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.coneParticleEmitter.js.map

BABYLON.Effect.ShadersStore['defaultVertexShader'] = "#include<__decl__defaultVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nvarying vec2 vSpecularUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nif (vSpecularInfos.x == 0.)\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\n\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['defaultPixelShader'] = "#include<__decl__defaultFragment>\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\n#define RECIPROCAL_PI2 0.15915494\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\n#if SPECULARDIRECTUV == 1\n#define vSpecularUV vMainUV1\n#elif SPECULARDIRECTUV == 2\n#define vSpecularUV vMainUV2\n#else\nvarying vec2 vSpecularUV;\n#endif\nuniform sampler2D specularSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#include<imageProcessingDeclaration>\n#include<imageProcessingFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 baseAmbientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nbaseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#endif\n\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#ifdef SPECULAR\nvec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\nspecularColor=specularMapColor.rgb;\n#ifdef GLOSSINESS\nglossiness=glossiness*specularMapColor.a;\n#endif\n#endif\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n\nvec3 refractionColor=vec3(0.,0.,0.);\n#ifdef REFRACTION\nvec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\nrefractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n}\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\nrefractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n#endif\n#endif\n\nvec3 reflectionColor=vec3(0.,0.,0.);\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_3D\n#ifdef ROUGHNESS\nfloat bias=vReflectionInfos.y;\n#ifdef SPECULARTERM\n#ifdef SPECULAR\n#ifdef GLOSSINESS\nbias*=(1.0-specularMapColor.a);\n#endif\n#endif\n#endif\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n#else\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\nreflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n#endif\n#ifdef REFLECTIONFRESNEL\nfloat reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n#ifdef REFLECTIONFRESNELFROMSPECULAR\n#ifdef SPECULARTERM\nreflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#endif\n#endif\n#ifdef REFRACTIONFRESNEL\nfloat refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\nrefractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 emissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nemissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nemissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef DIFFUSEFRESNEL\nfloat diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\ndiffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\n#ifdef LINKEMISSIVEWITHDIFFUSE\nvec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#endif\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef REFLECTIONOVERALPHA\nalpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n#else\nvec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n#endif\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\ncolor.rgb*=lightmapColor;\n#else\ncolor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n#include<logDepthFragment>\n#include<fogFragment>\n\n\n#ifdef IMAGEPROCESSINGPOSTPROCESS\ncolor.rgb=toLinearSpace(color.rgb);\n#else\n#ifdef IMAGEPROCESSING\ncolor.rgb=toLinearSpace(color.rgb);\ncolor=applyImageProcessing(color);\n#endif\n#endif\n#ifdef PREMULTIPLYALPHA\n\ncolor.rgb*=color.a;\n#endif\ngl_FragColor=color;\n}";
BABYLON.Effect.ShadersStore['particlesVertexShader'] = "\nattribute vec3 position;\nattribute vec4 color;\nattribute vec4 options;\nattribute float cellIndex;\n\nuniform mat4 view;\nuniform mat4 projection;\nuniform vec3 particlesInfos; \n\nvarying vec2 vUV;\nvarying vec4 vColor;\n#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nuniform mat4 invView;\nvarying float fClipDistance;\n#endif\nvoid main(void) { \nvec3 viewPos=(view*vec4(position,1.0)).xyz; \nvec3 cornerPos;\nfloat size=options.y;\nfloat angle=options.x;\nvec2 offset=options.zw;\ncornerPos=vec3(offset.x-0.5,offset.y-0.5,0.)*size;\n\nvec3 rotatedCorner;\nrotatedCorner.x=cornerPos.x*cos(angle)-cornerPos.y*sin(angle);\nrotatedCorner.y=cornerPos.x*sin(angle)+cornerPos.y*cos(angle);\nrotatedCorner.z=0.;\n\nviewPos+=rotatedCorner;\ngl_Position=projection*vec4(viewPos,1.0); \nvColor=color;\n#ifdef ANIMATESHEET\nfloat rowOffset=floor(cellIndex/particlesInfos.z);\nfloat columnOffset=cellIndex-rowOffset*particlesInfos.z;\nvec2 uvScale=particlesInfos.xy;\nvec2 uvOffset=vec2(offset.x ,1.0-offset.y);\nvUV=(uvOffset+vec2(columnOffset,rowOffset))*uvScale;\n#else\nvUV=offset;\n#endif\n\n#ifdef CLIPPLANE\nvec4 worldPos=invView*vec4(viewPos,1.0);\nfClipDistance=dot(worldPos,vClipPlane);\n#endif\n}";
BABYLON.Effect.ShadersStore['particlesPixelShader'] = "\nvarying vec2 vUV;\nvarying vec4 vColor;\nuniform vec4 textureMask;\nuniform sampler2D diffuseSampler;\n#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif\nvoid main(void) {\n#ifdef CLIPPLANE\nif (fClipDistance>0.0)\ndiscard;\n#endif\nvec4 baseColor=texture2D(diffuseSampler,vUV);\ngl_FragColor=(baseColor*textureMask+(vec4(1.,1.,1.,1.)-textureMask))*vColor;\n}";


var BABYLON;
(function (BABYLON) {
    var SphereParticleEmitter = /** @class */ (function () {
        function SphereParticleEmitter(radius) {
            this.radius = radius;
        }
        SphereParticleEmitter.prototype.startDirectionFunction = function (emitPower, worldMatrix, directionToUpdate, particle) {
            // measure the direction Vector from the emitter to the particle.
            var direction = particle.position.subtract(worldMatrix.getTranslation());
            BABYLON.Vector3.TransformNormalFromFloatsToRef(direction.x * emitPower, direction.y * emitPower, direction.z * emitPower, worldMatrix, directionToUpdate);
        };
        SphereParticleEmitter.prototype.startPositionFunction = function (worldMatrix, positionToUpdate, particle) {
            var phi = BABYLON.ParticleSystem.randomNumber(0, 2 * Math.PI);
            var theta = BABYLON.ParticleSystem.randomNumber(0, Math.PI);
            var randX = this.radius * Math.cos(phi) * Math.sin(theta);
            var randY = this.radius * Math.cos(theta);
            var randZ = this.radius * Math.sin(phi) * Math.sin(theta);
            BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
        };
        return SphereParticleEmitter;
    }());
    BABYLON.SphereParticleEmitter = SphereParticleEmitter;
    var SphereDirectedParticleEmitter = /** @class */ (function (_super) {
        __extends(SphereDirectedParticleEmitter, _super);
        function SphereDirectedParticleEmitter(radius, direction1, direction2) {
            var _this = _super.call(this, radius) || this;
            _this.direction1 = direction1;
            _this.direction2 = direction2;
            return _this;
        }
        SphereDirectedParticleEmitter.prototype.startDirectionFunction = function (emitPower, worldMatrix, directionToUpdate, particle) {
            var randX = BABYLON.ParticleSystem.randomNumber(this.direction1.x, this.direction2.x);
            var randY = BABYLON.ParticleSystem.randomNumber(this.direction1.y, this.direction2.y);
            var randZ = BABYLON.ParticleSystem.randomNumber(this.direction1.z, this.direction2.z);
            BABYLON.Vector3.TransformNormalFromFloatsToRef(randX * emitPower, randY * emitPower, randZ * emitPower, worldMatrix, directionToUpdate);
        };
        return SphereDirectedParticleEmitter;
    }(SphereParticleEmitter));
    BABYLON.SphereDirectedParticleEmitter = SphereDirectedParticleEmitter;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.sphereParticleEmitter.js.map



//# sourceMappingURL=babylon.iParticleEmitterType.js.map

BABYLON.Effect.IncludesShadersStore['depthPrePass'] = "#ifdef DEPTHPREPASS\ngl_FragColor=vec4(0.,0.,0.,1.0);\nreturn;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesDeclaration'] = "#if NUM_BONE_INFLUENCERS>0\nuniform mat4 mBones[BonesPerMesh];\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#if NUM_BONE_INFLUENCERS>4\nattribute vec4 matricesIndicesExtra;\nattribute vec4 matricesWeightsExtra;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesDeclaration'] = "#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertexDeclaration'] = "#ifdef POINTSIZE\nuniform float pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertexDeclaration'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n#endif\n";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertexDeclaration'] = "#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertexDeclaration'] = "#ifdef FOG\nvarying vec3 vFogDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexGlobalDeclaration'] = "#ifdef MORPHTARGETS\nuniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexDeclaration'] = "#ifdef MORPHTARGETS\nattribute vec3 position{X};\n#ifdef MORPHTARGETS_NORMAL\nattribute vec3 normal{X};\n#endif\n#ifdef MORPHTARGETS_TANGENT\nattribute vec3 tangent{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthDeclaration'] = "#ifdef LOGARITHMICDEPTH\nuniform float logarithmicDepthConstant;\nvarying float vFragmentDepth;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertex'] = "#ifdef MORPHTARGETS\npositionUpdated+=(position{X}-position)*morphTargetInfluences[{X}];\n#ifdef MORPHTARGETS_NORMAL\nnormalUpdated+=(normal{X}-normal)*morphTargetInfluences[{X}];\n#endif\n#ifdef MORPHTARGETS_TANGENT\ntangentUpdated.xyz+=(tangent{X}-tangent.xyz)*morphTargetInfluences[{X}];\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesVertex'] = "#ifdef INSTANCES\nmat4 finalWorld=mat4(world0,world1,world2,world3);\n#else\nmat4 finalWorld=world;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesVertex'] = "#if NUM_BONE_INFLUENCERS>0\nmat4 influence;\ninfluence=mBones[int(matricesIndices[0])]*matricesWeights[0];\n#if NUM_BONE_INFLUENCERS>1\ninfluence+=mBones[int(matricesIndices[1])]*matricesWeights[1];\n#endif \n#if NUM_BONE_INFLUENCERS>2\ninfluence+=mBones[int(matricesIndices[2])]*matricesWeights[2];\n#endif \n#if NUM_BONE_INFLUENCERS>3\ninfluence+=mBones[int(matricesIndices[3])]*matricesWeights[3];\n#endif \n#if NUM_BONE_INFLUENCERS>4\ninfluence+=mBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];\n#endif \n#if NUM_BONE_INFLUENCERS>5\ninfluence+=mBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];\n#endif \n#if NUM_BONE_INFLUENCERS>6\ninfluence+=mBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];\n#endif \n#if NUM_BONE_INFLUENCERS>7\ninfluence+=mBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];\n#endif \nfinalWorld=finalWorld*influence;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertex'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL)\nvec3 tbnNormal=normalize(normalUpdated);\nvec3 tbnTangent=normalize(tangentUpdated.xyz);\nvec3 tbnBitangent=cross(tbnNormal,tbnTangent)*tangentUpdated.w;\nvTBN=mat3(finalWorld)*mat3(tbnTangent,tbnBitangent,tbnNormal);\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertex'] = "#ifdef CLIPPLANE\nfClipDistance=dot(worldPos,vClipPlane);\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertex'] = "#ifdef FOG\nvFogDistance=(view*worldPos).xyz;\n#endif";
BABYLON.Effect.IncludesShadersStore['shadowsVertex'] = "#ifdef SHADOWS\n#if defined(SHADOW{X}) && !defined(SHADOWCUBE{X})\nvPositionFromLight{X}=lightMatrix{X}*worldPos;\nvDepthMetric{X}=((vPositionFromLight{X}.z+light{X}.depthValues.x)/(light{X}.depthValues.y));\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertex'] = "#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthVertex'] = "#ifdef LOGARITHMICDEPTH\nvFragmentDepth=1.0+gl_Position.w;\ngl_Position.z=log2(max(0.000001,vFragmentDepth))*logarithmicDepthConstant;\n#endif";
BABYLON.Effect.IncludesShadersStore['helperFunctions'] = "const float PI=3.1415926535897932384626433832795;\nconst float LinearEncodePowerApprox=2.2;\nconst float GammaEncodePowerApprox=1.0/LinearEncodePowerApprox;\nconst vec3 LuminanceEncodeApprox=vec3(0.2126,0.7152,0.0722);\nmat3 transposeMat3(mat3 inMatrix) {\nvec3 i0=inMatrix[0];\nvec3 i1=inMatrix[1];\nvec3 i2=inMatrix[2];\nmat3 outMatrix=mat3(\nvec3(i0.x,i1.x,i2.x),\nvec3(i0.y,i1.y,i2.y),\nvec3(i0.z,i1.z,i2.z)\n);\nreturn outMatrix;\n}\n\nmat3 inverseMat3(mat3 inMatrix) {\nfloat a00=inMatrix[0][0],a01=inMatrix[0][1],a02=inMatrix[0][2];\nfloat a10=inMatrix[1][0],a11=inMatrix[1][1],a12=inMatrix[1][2];\nfloat a20=inMatrix[2][0],a21=inMatrix[2][1],a22=inMatrix[2][2];\nfloat b01=a22*a11-a12*a21;\nfloat b11=-a22*a10+a12*a20;\nfloat b21=a21*a10-a11*a20;\nfloat det=a00*b01+a01*b11+a02*b21;\nreturn mat3(b01,(-a22*a01+a02*a21),(a12*a01-a02*a11),\nb11,(a22*a00-a02*a20),(-a12*a00+a02*a10),\nb21,(-a21*a00+a01*a20),(a11*a00-a01*a10))/det;\n}\nfloat computeFallOff(float value,vec2 clipSpace,float frustumEdgeFalloff)\n{\nfloat mask=smoothstep(1.0-frustumEdgeFalloff,1.0,clamp(dot(clipSpace,clipSpace),0.,1.));\nreturn mix(value,1.0,mask);\n}\nvec3 applyEaseInOut(vec3 x){\nreturn x*x*(3.0-2.0*x);\n}\nvec3 toLinearSpace(vec3 color)\n{\nreturn pow(color,vec3(LinearEncodePowerApprox));\n}\nvec3 toGammaSpace(vec3 color)\n{\nreturn pow(color,vec3(GammaEncodePowerApprox));\n}\nfloat square(float value)\n{\nreturn value*value;\n}\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,LuminanceEncodeApprox),0.,1.);\n}\n\nfloat getRand(vec2 seed) {\nreturn fract(sin(dot(seed.xy ,vec2(12.9898,78.233)))*43758.5453);\n}\nvec3 dither(vec2 seed,vec3 color) {\nfloat rand=getRand(seed);\ncolor+=mix(-0.5/255.0,0.5/255.0,rand);\ncolor=max(color,0.0);\nreturn color;\n}";
BABYLON.Effect.IncludesShadersStore['lightFragmentDeclaration'] = "#ifdef LIGHT{X}\nuniform vec4 vLightData{X};\nuniform vec4 vLightDiffuse{X};\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular{X};\n#else\nvec3 vLightSpecular{X}=vec3(0.);\n#endif\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\nuniform vec4 shadowsInfo{X};\nuniform vec2 depthValues{X};\n#endif\n#ifdef SPOTLIGHT{X}\nuniform vec4 vLightDirection{X};\n#endif\n#ifdef HEMILIGHT{X}\nuniform vec3 vLightGround{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['lightsFragmentFunctions'] = "\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n#ifdef NDOTL\nfloat ndl;\n#endif\n};\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 lightVectorW;\nfloat attenuation=1.0;\nif (lightData.w == 0.)\n{\nvec3 direction=lightData.xyz-vPositionW;\nattenuation=max(0.,1.0-length(direction)/range);\nlightVectorW=normalize(direction);\n}\nelse\n{\nlightVectorW=normalize(-lightData.xyz);\n}\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 direction=lightData.xyz-vPositionW;\nvec3 lightVectorW=normalize(direction);\nfloat attenuation=max(0.,1.0-length(direction)/range);\n\nfloat cosAngle=max(0.,dot(lightDirection.xyz,-lightVectorW));\nif (cosAngle>=lightDirection.w)\n{\ncosAngle=max(0.,pow(cosAngle,lightData.w));\nattenuation*=cosAngle;\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nresult.diffuse=vec3(0.);\n#ifdef SPECULARTERM\nresult.specular=vec3(0.);\n#endif\n#ifdef NDOTL\nresult.ndl=0.;\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness) {\nlightingInfo result;\n\nfloat ndl=dot(vNormal,lightData.xyz)*0.5+0.5;\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=mix(groundColor,diffuseColor,ndl);\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightData.xyz);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor;\n#endif\nreturn result;\n}\n";
BABYLON.Effect.IncludesShadersStore['lightUboDeclaration'] = "#ifdef LIGHT{X}\nuniform Light{X}\n{\nvec4 vLightData;\nvec4 vLightDiffuse;\nvec3 vLightSpecular;\n#ifdef SPOTLIGHT{X}\nvec4 vLightDirection;\n#endif\n#ifdef HEMILIGHT{X}\nvec3 vLightGround;\n#endif\nvec4 shadowsInfo;\nvec2 depthValues;\n} light{X};\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultVertexDeclaration'] = "\nuniform mat4 viewProjection;\nuniform mat4 view;\n#ifdef DIFFUSE\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\nuniform mat4 specularMatrix;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n";
BABYLON.Effect.IncludesShadersStore['defaultFragmentDeclaration'] = "uniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\nuniform vec3 vEmissiveColor;\n\n#ifdef DIFFUSE\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY \nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform vec2 vTangentSpaceParams;\n#endif\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\nuniform mat4 view;\n#endif\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\n#ifndef REFRACTIONMAP_3D\nuniform mat4 refractionMatrix;\n#endif\n#ifdef REFRACTIONFRESNEL\nuniform vec4 refractionLeftColor;\nuniform vec4 refractionRightColor;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\n#endif\n#ifdef DIFFUSEFRESNEL\nuniform vec4 diffuseLeftColor;\nuniform vec4 diffuseRightColor;\n#endif\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n#ifdef REFLECTIONMAP_SKYBOX\n#else\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 reflectionMatrix;\n#endif\n#endif\n#ifdef REFLECTIONFRESNEL\nuniform vec4 reflectionLeftColor;\nuniform vec4 reflectionRightColor;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultUboDeclaration'] = "layout(std140,column_major) uniform;\nuniform Material\n{\nvec4 diffuseLeftColor;\nvec4 diffuseRightColor;\nvec4 opacityParts;\nvec4 reflectionLeftColor;\nvec4 reflectionRightColor;\nvec4 refractionLeftColor;\nvec4 refractionRightColor;\nvec4 emissiveLeftColor; \nvec4 emissiveRightColor;\nvec2 vDiffuseInfos;\nvec2 vAmbientInfos;\nvec2 vOpacityInfos;\nvec2 vReflectionInfos;\nvec2 vEmissiveInfos;\nvec2 vLightmapInfos;\nvec2 vSpecularInfos;\nvec3 vBumpInfos;\nmat4 diffuseMatrix;\nmat4 ambientMatrix;\nmat4 opacityMatrix;\nmat4 reflectionMatrix;\nmat4 emissiveMatrix;\nmat4 lightmapMatrix;\nmat4 specularMatrix;\nmat4 bumpMatrix; \nvec4 vTangentSpaceParams;\nmat4 refractionMatrix;\nvec4 vRefractionInfos;\nvec4 vSpecularColor;\nvec3 vEmissiveColor;\nvec4 vDiffuseColor;\nfloat pointSize; \n};\nuniform Scene {\nmat4 viewProjection;\nmat4 view;\n};";
BABYLON.Effect.IncludesShadersStore['shadowsFragmentFunctions'] = "#ifdef SHADOWS\n#ifndef SHADOWFLOAT\nfloat unpack(vec4 color)\n{\nconst vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);\nreturn dot(color,bit_shift);\n}\n#endif\nfloat computeShadowCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadow=textureCube(shadowSampler,directionToLight).x;\n#endif\nif (depth>shadow)\n{\nreturn darkness;\n}\nreturn 1.0;\n}\nfloat computeShadowWithPCFCube(vec3 lightPosition,samplerCube shadowSampler,float mapSize,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\nfloat visibility=1.;\nvec3 poissonDisk[4];\npoissonDisk[0]=vec3(-1.0,1.0,-1.0);\npoissonDisk[1]=vec3(1.0,-1.0,-1.0);\npoissonDisk[2]=vec3(-1.0,-1.0,-1.0);\npoissonDisk[3]=vec3(1.0,-1.0,1.0);\n\n#ifndef SHADOWFLOAT\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize))<depth) visibility-=0.25;\n#else\nif (textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize).x<depth) visibility-=0.25;\n#endif\nreturn min(1.0,visibility+darkness);\n}\nfloat computeShadowWithESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness); \nreturn esm;\n}\nfloat computeShadowWithCloseESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn esm;\n}\nfloat computeShadow(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadow=texture2D(shadowSampler,uv).x;\n#endif\nif (shadowPixelDepth>shadow)\n{\nreturn computeFallOff(darkness,clipSpace.xy,frustumEdgeFalloff);\n}\nreturn 1.;\n}\nfloat computeShadowWithPCF(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float mapSize,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\nfloat visibility=1.;\nvec2 poissonDisk[4];\npoissonDisk[0]=vec2(-0.94201624,-0.39906216);\npoissonDisk[1]=vec2(0.94558609,-0.76890725);\npoissonDisk[2]=vec2(-0.094184101,-0.92938870);\npoissonDisk[3]=vec2(0.34495938,0.29387760);\n\n#ifndef SHADOWFLOAT\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[0]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[1]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[2]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[3]*mapSize))<shadowPixelDepth) visibility-=0.25;\n#else\nif (texture2D(shadowSampler,uv+poissonDisk[0]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[1]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[2]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[3]*mapSize).x<shadowPixelDepth) visibility-=0.25;\n#endif\nreturn computeFallOff(min(1.0,visibility+darkness),clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithCloseESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0); \n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\n#endif\n";
BABYLON.Effect.IncludesShadersStore['fresnelFunction'] = "#ifdef FRESNEL\nfloat computeFresnelTerm(vec3 viewDirection,vec3 worldNormal,float bias,float power)\n{\nfloat fresnelTerm=pow(bias+abs(dot(viewDirection,worldNormal)),power);\nreturn clamp(fresnelTerm,0.,1.);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['reflectionFunction'] = "vec3 computeReflectionCoords(vec4 worldPos,vec3 worldNormal)\n{\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvec3 direction=normalize(vDirectionW);\nfloat t=clamp(direction.y*-0.5+0.5,0.,1.0);\nfloat s=atan(direction.z,direction.x)*RECIPROCAL_PI2+0.5;\n#ifdef REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED\nreturn vec3(1.0-s,t,0);\n#else\nreturn vec3(s,t,0);\n#endif\n#endif\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\nvec3 cameraToVertex=normalize(worldPos.xyz-vEyePosition.xyz);\nvec3 r=reflect(cameraToVertex,worldNormal);\nfloat t=clamp(r.y*-0.5+0.5,0.,1.0);\nfloat s=atan(r.z,r.x)*RECIPROCAL_PI2+0.5;\nreturn vec3(s,t,0);\n#endif\n#ifdef REFLECTIONMAP_SPHERICAL\nvec3 viewDir=normalize(vec3(view*worldPos));\nvec3 viewNormal=normalize(vec3(view*vec4(worldNormal,0.0)));\nvec3 r=reflect(viewDir,viewNormal);\nr.z=r.z-1.0;\nfloat m=2.0*length(r);\nreturn vec3(r.x/m+0.5,1.0-r.y/m-0.5,0);\n#endif\n#ifdef REFLECTIONMAP_PLANAR\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=normalize(reflect(viewDir,worldNormal));\nreturn vec3(reflectionMatrix*vec4(coords,1));\n#endif\n#ifdef REFLECTIONMAP_CUBIC\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=reflect(viewDir,worldNormal);\n#ifdef INVERTCUBICMAP\ncoords.y=1.0-coords.y;\n#endif\nreturn vec3(reflectionMatrix*vec4(coords,0));\n#endif\n#ifdef REFLECTIONMAP_PROJECTION\nreturn vec3(reflectionMatrix*(view*worldPos));\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nreturn vPositionUVW;\n#endif\n#ifdef REFLECTIONMAP_EXPLICIT\nreturn vec3(0,0,0);\n#endif\n}";
BABYLON.Effect.IncludesShadersStore['imageProcessingDeclaration'] = "#ifdef EXPOSURE\nuniform float exposureLinear;\n#endif\n#ifdef CONTRAST\nuniform float contrast;\n#endif\n#ifdef VIGNETTE\nuniform vec2 vInverseScreenSize;\nuniform vec4 vignetteSettings1;\nuniform vec4 vignetteSettings2;\n#endif\n#ifdef COLORCURVES\nuniform vec4 vCameraColorCurveNegative;\nuniform vec4 vCameraColorCurveNeutral;\nuniform vec4 vCameraColorCurvePositive;\n#endif\n#ifdef COLORGRADING\n#ifdef COLORGRADING3D\nuniform highp sampler3D txColorTransform;\n#else\nuniform sampler2D txColorTransform;\n#endif\nuniform vec4 colorTransformSettings;\n#endif";
BABYLON.Effect.IncludesShadersStore['imageProcessingFunctions'] = "#if defined(COLORGRADING) && !defined(COLORGRADING3D)\n\nvec3 sampleTexture3D(sampler2D colorTransform,vec3 color,vec2 sampler3dSetting)\n{\nfloat sliceSize=2.0*sampler3dSetting.x; \n#ifdef SAMPLER3DGREENDEPTH\nfloat sliceContinuous=(color.g-sampler3dSetting.x)*sampler3dSetting.y;\n#else\nfloat sliceContinuous=(color.b-sampler3dSetting.x)*sampler3dSetting.y;\n#endif\nfloat sliceInteger=floor(sliceContinuous);\n\n\nfloat sliceFraction=sliceContinuous-sliceInteger;\n#ifdef SAMPLER3DGREENDEPTH\nvec2 sliceUV=color.rb;\n#else\nvec2 sliceUV=color.rg;\n#endif\nsliceUV.x*=sliceSize;\nsliceUV.x+=sliceInteger*sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice0Color=texture2D(colorTransform,sliceUV);\nsliceUV.x+=sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice1Color=texture2D(colorTransform,sliceUV);\nvec3 result=mix(slice0Color.rgb,slice1Color.rgb,sliceFraction);\n#ifdef SAMPLER3DBGRMAP\ncolor.rgb=result.rgb;\n#else\ncolor.rgb=result.bgr;\n#endif\nreturn color;\n}\n#endif\nvec4 applyImageProcessing(vec4 result) {\n#ifdef EXPOSURE\nresult.rgb*=exposureLinear;\n#endif\n#ifdef VIGNETTE\n\nvec2 viewportXY=gl_FragCoord.xy*vInverseScreenSize;\nviewportXY=viewportXY*2.0-1.0;\nvec3 vignetteXY1=vec3(viewportXY*vignetteSettings1.xy+vignetteSettings1.zw,1.0);\nfloat vignetteTerm=dot(vignetteXY1,vignetteXY1);\nfloat vignette=pow(vignetteTerm,vignetteSettings2.w);\n\nvec3 vignetteColor=vignetteSettings2.rgb;\n#ifdef VIGNETTEBLENDMODEMULTIPLY\nvec3 vignetteColorMultiplier=mix(vignetteColor,vec3(1,1,1),vignette);\nresult.rgb*=vignetteColorMultiplier;\n#endif\n#ifdef VIGNETTEBLENDMODEOPAQUE\nresult.rgb=mix(vignetteColor,result.rgb,vignette);\n#endif\n#endif\n#ifdef TONEMAPPING\nconst float tonemappingCalibration=1.590579;\nresult.rgb=1.0-exp2(-tonemappingCalibration*result.rgb);\n#endif\n\nresult.rgb=toGammaSpace(result.rgb);\nresult.rgb=clamp(result.rgb,0.0,1.0);\n#ifdef CONTRAST\n\nvec3 resultHighContrast=applyEaseInOut(result.rgb);\nif (contrast<1.0) {\n\nresult.rgb=mix(vec3(0.5,0.5,0.5),result.rgb,contrast);\n} else {\n\nresult.rgb=mix(result.rgb,resultHighContrast,contrast-1.0);\n}\n#endif\n\n#ifdef COLORGRADING\nvec3 colorTransformInput=result.rgb*colorTransformSettings.xxx+colorTransformSettings.yyy;\n#ifdef COLORGRADING3D\nvec3 colorTransformOutput=texture(txColorTransform,colorTransformInput).rgb;\n#else\nvec3 colorTransformOutput=sampleTexture3D(txColorTransform,colorTransformInput,colorTransformSettings.yz).rgb;\n#endif\nresult.rgb=mix(result.rgb,colorTransformOutput,colorTransformSettings.www);\n#endif\n#ifdef COLORCURVES\n\nfloat luma=getLuminance(result.rgb);\nvec2 curveMix=clamp(vec2(luma*3.0-1.5,luma*-3.0+1.5),vec2(0.0),vec2(1.0));\nvec4 colorCurve=vCameraColorCurveNeutral+curveMix.x*vCameraColorCurvePositive-curveMix.y*vCameraColorCurveNegative;\nresult.rgb*=colorCurve.rgb;\nresult.rgb=mix(vec3(luma),result.rgb,colorCurve.a);\n#endif\nreturn result;\n}";
BABYLON.Effect.IncludesShadersStore['bumpFragmentFunctions'] = "#ifdef BUMP\n#if BUMPDIRECTUV == 1\n#define vBumpUV vMainUV1\n#elif BUMPDIRECTUV == 2\n#define vBumpUV vMainUV2\n#else\nvarying vec2 vBumpUV;\n#endif\nuniform sampler2D bumpSampler;\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n\nmat3 cotangent_frame(vec3 normal,vec3 p,vec2 uv)\n{\n\nuv=gl_FrontFacing ? uv : -uv;\n\nvec3 dp1=dFdx(p);\nvec3 dp2=dFdy(p);\nvec2 duv1=dFdx(uv);\nvec2 duv2=dFdy(uv);\n\nvec3 dp2perp=cross(dp2,normal);\nvec3 dp1perp=cross(normal,dp1);\nvec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;\nvec3 bitangent=dp2perp*duv1.y+dp1perp*duv2.y;\n\ntangent*=vTangentSpaceParams.x;\nbitangent*=vTangentSpaceParams.y;\n\nfloat invmax=inversesqrt(max(dot(tangent,tangent),dot(bitangent,bitangent)));\nreturn mat3(tangent*invmax,bitangent*invmax,normal);\n}\nvec3 perturbNormal(mat3 cotangentFrame,vec2 uv)\n{\nvec3 map=texture2D(bumpSampler,uv).xyz;\nmap=map*2.0-1.0;\n#ifdef NORMALXYSCALE\nmap=normalize(map*vec3(vBumpInfos.y,vBumpInfos.y,1.0));\n#endif\nreturn normalize(cotangentFrame*map);\n}\n#ifdef PARALLAX\nconst float minSamples=4.;\nconst float maxSamples=15.;\nconst int iMaxSamples=15;\n\nvec2 parallaxOcclusion(vec3 vViewDirCoT,vec3 vNormalCoT,vec2 texCoord,float parallaxScale) {\nfloat parallaxLimit=length(vViewDirCoT.xy)/vViewDirCoT.z;\nparallaxLimit*=parallaxScale;\nvec2 vOffsetDir=normalize(vViewDirCoT.xy);\nvec2 vMaxOffset=vOffsetDir*parallaxLimit;\nfloat numSamples=maxSamples+(dot(vViewDirCoT,vNormalCoT)*(minSamples-maxSamples));\nfloat stepSize=1.0/numSamples;\n\nfloat currRayHeight=1.0;\nvec2 vCurrOffset=vec2(0,0);\nvec2 vLastOffset=vec2(0,0);\nfloat lastSampledHeight=1.0;\nfloat currSampledHeight=1.0;\nfor (int i=0; i<iMaxSamples; i++)\n{\ncurrSampledHeight=texture2D(bumpSampler,vBumpUV+vCurrOffset).w;\n\nif (currSampledHeight>currRayHeight)\n{\nfloat delta1=currSampledHeight-currRayHeight;\nfloat delta2=(currRayHeight+stepSize)-lastSampledHeight;\nfloat ratio=delta1/(delta1+delta2);\nvCurrOffset=(ratio)* vLastOffset+(1.0-ratio)*vCurrOffset;\n\nbreak;\n}\nelse\n{\ncurrRayHeight-=stepSize;\nvLastOffset=vCurrOffset;\nvCurrOffset+=stepSize*vMaxOffset;\nlastSampledHeight=currSampledHeight;\n}\n}\nreturn vCurrOffset;\n}\nvec2 parallaxOffset(vec3 viewDir,float heightScale)\n{\n\nfloat height=texture2D(bumpSampler,vBumpUV).w;\nvec2 texCoordOffset=heightScale*viewDir.xy*height;\nreturn -texCoordOffset;\n}\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragmentDeclaration'] = "#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragmentDeclaration'] = "#ifdef FOG\n#define FOGMODE_NONE 0.\n#define FOGMODE_EXP 1.\n#define FOGMODE_EXP2 2.\n#define FOGMODE_LINEAR 3.\n#define E 2.71828\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying vec3 vFogDistance;\nfloat CalcFogFactor()\n{\nfloat fogCoeff=1.0;\nfloat fogStart=vFogInfos.y;\nfloat fogEnd=vFogInfos.z;\nfloat fogDensity=vFogInfos.w;\nfloat fogDistance=length(vFogDistance);\nif (FOGMODE_LINEAR == vFogInfos.x)\n{\nfogCoeff=(fogEnd-fogDistance)/(fogEnd-fogStart);\n}\nelse if (FOGMODE_EXP == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDensity);\n}\nelse if (FOGMODE_EXP2 == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDistance*fogDensity*fogDensity);\n}\nreturn clamp(fogCoeff,0.0,1.0);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragment'] = "#ifdef CLIPPLANE\nif (fClipDistance>0.0)\n{\ndiscard;\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpFragment'] = "vec2 uvOffset=vec2(0.0,0.0);\n#if defined(BUMP) || defined(PARALLAX)\n#ifdef NORMALXYSCALE\nfloat normalScale=1.0;\n#else \nfloat normalScale=vBumpInfos.y;\n#endif\n#if defined(TANGENT) && defined(NORMAL)\nmat3 TBN=vTBN;\n#else\nmat3 TBN=cotangent_frame(normalW*normalScale,vPositionW,vBumpUV);\n#endif\n#endif\n#ifdef PARALLAX\nmat3 invTBN=transposeMat3(TBN);\n#ifdef PARALLAXOCCLUSION\nuvOffset=parallaxOcclusion(invTBN*-viewDirectionW,invTBN*normalW,vBumpUV,vBumpInfos.z);\n#else\nuvOffset=parallaxOffset(invTBN*viewDirectionW,vBumpInfos.z);\n#endif\n#endif\n#ifdef BUMP\nnormalW=perturbNormal(TBN,vBumpUV+uvOffset);\n#endif";
BABYLON.Effect.IncludesShadersStore['lightFragment'] = "#ifdef LIGHT{X}\n#if defined(SHADOWONLY) || (defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X}))\n\n#else\n#ifdef PBR\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#else\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,glossiness);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#endif\n#endif\n#ifdef SHADOW{X}\n#ifdef SHADOWCLOSEESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithCloseESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithCloseESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else\n#ifdef SHADOWESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else \n#ifdef SHADOWPCF{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithPCFCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadowWithPCF(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#else\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadow(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#endif\n#endif\n#endif\n#ifdef SHADOWONLY\n#ifndef SHADOWINUSE\n#define SHADOWINUSE\n#endif\nglobalShadow+=shadow;\nshadowLightCount+=1.0;\n#endif\n#else\nshadow=1.;\n#endif\n#ifndef SHADOWONLY\n#ifdef CUSTOMUSERLIGHTING\ndiffuseBase+=computeCustomDiffuseLighting(info,diffuseBase,shadow);\n#ifdef SPECULARTERM\nspecularBase+=computeCustomSpecularLighting(info,specularBase,shadow);\n#endif\n#elif defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})\ndiffuseBase+=lightmapColor*shadow;\n#ifdef SPECULARTERM\n#ifndef LIGHTMAPNOSPECULAR{X}\nspecularBase+=info.specular*shadow*lightmapColor;\n#endif\n#endif\n#else\ndiffuseBase+=info.diffuse*shadow;\n#ifdef SPECULARTERM\nspecularBase+=info.specular*shadow;\n#endif\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthFragment'] = "#ifdef LOGARITHMICDEPTH\ngl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragment'] = "#ifdef FOG\nfloat fog=CalcFogFactor();\ncolor.rgb=fog*color.rgb+(1.0-fog)*vFogColor;\n#endif";
var Particle = BABYLON.Particle;
var ParticleSystem = BABYLON.ParticleSystem;
var BoxParticleEmitter = BABYLON.BoxParticleEmitter;
var ConeParticleEmitter = BABYLON.ConeParticleEmitter;
var SphereParticleEmitter = BABYLON.SphereParticleEmitter;
var SphereDirectedParticleEmitter = BABYLON.SphereDirectedParticleEmitter;

export { Particle,ParticleSystem,BoxParticleEmitter,ConeParticleEmitter,SphereParticleEmitter,SphereDirectedParticleEmitter };