var BABYLON = BABYLON || {};

(function () {
    BABYLON.Scene = function (engine) {
        this._engine = engine;
        this.autoClear = true;
        this.clearColor = new BABYLON.Color3(0.2, 0.2, 0.3);
        this.ambientColor = new BABYLON.Color3(0, 0, 0);

        engine.scenes.push(this);

        this._totalVertices = 0;
        this._activeVertices = 0;
        this._activeParticles = 0;
        this._lastFrameDuration = 0;
        this._evaluateActiveMeshesDuration = 0;
        this._renderTargetsDuration = 0;
        this._renderDuration = 0;

        this._toBeDisposed = [];

        this._onReadyCallbacks = [];
        this._pendingData = [];

        this._onBeforeRenderCallbacks = [];
        
        // Fog
        this.fogMode = BABYLON.Scene.FOGMODE_NONE;
        this.fogColor = new BABYLON.Color3(0.2, 0.2, 0.3);
        this.fogDensity = 0.1;
        this.fogStart = 0;
        this.fogEnd = 1000.0;

        // Lights
        this.lights = [];

        // Cameras
        this.cameras = [];
        this.activeCamera = null;

        // Meshes
        this.meshes = [];
        this._activeMeshes = [];

        // Materials
        this.materials = [];
        this.multiMaterials = [];
        this.defaultMaterial = new BABYLON.StandardMaterial("default material", this);

        // Textures
        this.textures = [];

        // Particles
        this.particlesEnabled = true;
        this.particleSystems = [];

        // Sprites
        this.spriteManagers = [];

        // Layers
        this.layers = [];

        // Collisions
        this.collisionsEnabled = true;
        this.gravity = new BABYLON.Vector3(0, 0, -9);

        // Animations
        this._activeAnimatables = [];
    };

    // Properties   
    BABYLON.Scene.prototype.getEngine = function () {
        return this._engine;
    };

    BABYLON.Scene.prototype.getTotalVertices = function () {
        return this._totalVertices;
    };

    BABYLON.Scene.prototype.getActiveVertices = function () {
        return this._activeVertices;
    };

    BABYLON.Scene.prototype.getTotalVertices = function () {
        return this._totalVertices;
    };

    BABYLON.Scene.prototype.getActiveParticles = function () {
        return this._activeParticles;
    };

    // Stats
    BABYLON.Scene.prototype.getLastFrameDuration = function () {
        return this._lastFrameDuration;
    };

    BABYLON.Scene.prototype.getEvaluateActiveMeshesDuration = function () {
        return this._evaluateActiveMeshesDuration;
    };

    BABYLON.Scene.prototype.getRenderTargetsDuration = function () {
        return this._renderTargetsDuration;
    };

    BABYLON.Scene.prototype.getRenderDuration = function () {
        return this._renderDuration;
    };

    BABYLON.Scene.prototype.getParticlesDuration = function () {
        return this._particlesDuration;
    };

    BABYLON.Scene.prototype.getSpritesDuration = function () {
        return this._spritesDuration;
    };

    BABYLON.Scene.prototype.getAnimationRatio = function () {
        return this._animationRatio;
    };

    // Ready
    BABYLON.Scene.prototype.isReady = function () {
        for (var index = 0; index < this.materials.length; index++) {
            if (!this.materials[index].isReady()) {
                return false;
            }
        }

        return true;
    };

    BABYLON.Scene.prototype.executeWhenReady = function (func) {
        if (this.isReady()) {
            func();
            return;
        }

        if (this._pendingData.length === 0) {
            func();
            return;
        }
        this._onReadyCallbacks.push(func);
    };
    
    BABYLON.Scene.prototype.registerBeforeRender = function (func) {
        this._onBeforeRenderCallbacks.push(func);
    };
    
    BABYLON.Scene.prototype.unregisterBeforeRender = function (func) {
        var index = this._onBeforeRenderCallbacks.indexOf(func);

        if (index > -1) {
            this._onBeforeRenderCallbacks.splice(index, 1);
        }
    };

    BABYLON.Scene.prototype._addPendingData = function (data) {
        this._pendingData.push(data);
    };

    BABYLON.Scene.prototype._removePendingData = function (data) {
        var index = this._pendingData.indexOf(data);

        if (index !== -1) {
            this._pendingData.splice(index, 1);

            if (this._pendingData.length === 0) {
                this._onReadyCallbacks.forEach(function (func) {
                    func();
                });

                this._onReadyCallbacks = [];
            }
        }
    };

    // Animations
    BABYLON.Scene.prototype.beginAnimation = function (target, from, to, loop, speedRatio) {
        if (speedRatio === undefined) {
            speedRatio = 1.0;
        }

        // Local animations
        if (target.animations) {
            this.stopAnimation(target);

            var animatable = new BABYLON._Animatable(target, from, to, loop, speedRatio);

            this._activeAnimatables.push(animatable);
        }

        // Children animations
        if (target.getAnimatables) {
            var animatables = target.getAnimatables();
            for (var index = 0; index < animatables.length; index++) {
                this.beginAnimation(animatables[index], from, to, loop, speedRatio);
            }
        }
    };

    BABYLON.Scene.prototype.stopAnimation = function (target) {
        for (var index = 0; index < this._activeAnimatables.length; index++) {
            if (this._activeAnimatables[index].target === target) {
                this._activeAnimatables.splice(index, 1);
                return;
            }
        }
    };

    BABYLON.Scene.prototype._animate = function () {
        for (var index = 0; index < this._activeAnimatables.length; index++) {
            if (!this._activeAnimatables[index]._animate()) {
                this._activeAnimatables.splice(index, 1);
                index--;
            }
        }
    };

    // Matrix
    BABYLON.Scene.prototype.getViewMatrix = function () {
        return this._viewMatrix;
    };

    BABYLON.Scene.prototype.getProjectionMatrix = function () {
        return this._projectionMatrix;
    };

    BABYLON.Scene.prototype.getTransformMatrix = function () {
        return this._transformMatrix;
    };

    BABYLON.Scene.prototype.setTransformMatrix = function (view, projection) {
        this._viewMatrix = view;
        this._projectionMatrix = projection;

        this._transformMatrix = this._viewMatrix.multiply(this._projectionMatrix);
    };

    // Methods
    BABYLON.Scene.prototype.activeCameraByID = function (id) {
        for (var index = 0; index < this.cameras.length; index++) {
            if (this.cameras[index].id == id) {
                this.activeCamera = this.cameras[index];
                return;
            }
        }
    };

    BABYLON.Scene.prototype.getMaterialByID = function (id) {
        for (var index = 0; index < this.materials.length; index++) {
            if (this.materials[index].id == id) {
                return this.materials[index];
            }
        }

        return null;
    };
    
    BABYLON.Scene.prototype.getLightByID = function (id) {
        for (var index = 0; index < this.lights.length; index++) {
            if (this.lights[index].id == id) {
                return this.lights[index];
            }
        }

        return null;
    };

    BABYLON.Scene.prototype.getMeshByID = function (id) {
        for (var index = 0; index < this.meshes.length; index++) {
            if (this.meshes[index].id == id) {
                return this.meshes[index];
            }
        }

        return null;
    };

    BABYLON.Scene.prototype.getLastMeshByID = function (id) {
        var result = null;
        for (var index = 0; index < this.meshes.length; index++) {
            if (this.meshes[index].id == id) {
                result = this.meshes[index];
            }
        }

        return result;
    };

    BABYLON.Scene.prototype.getMeshByName = function (name) {
        for (var index = 0; index < this.meshes.length; index++) {
            if (this.meshes[index].name == name) {
                return this.meshes[index];
            }
        }

        return null;
    };

    BABYLON.Scene.prototype.isActiveMesh = function (mesh) {
        return (this._activeMeshes.indexOf(mesh) !== -1);
    };

    BABYLON.Scene.prototype._evaluateActiveMeshes = function () {
        this._activeMeshes = [];
        this._opaqueSubMeshes = [];
        this._transparentSubMeshes = [];
        this._alphaTestSubMeshes = [];
        this._processedMaterials = [];
        this._renderTargets = [];
        this._activeParticleSystems = [];

        var frustumPlanes = BABYLON.Frustum.GetPlanes(this._transformMatrix);

        this._totalVertices = 0;
        this._activeVertices = 0;

        // meshes
        for (var meshIndex = 0; meshIndex < this.meshes.length; meshIndex++) {
            var mesh = this.meshes[meshIndex];

            this._totalVertices += mesh.getTotalVertices();
            
            if (!mesh.isReady()) {
                continue;
            }

            mesh.computeWorldMatrix();

            if (mesh.isEnabled() && mesh.isVisible && mesh.visibility > 0 && mesh.isInFrustrum(frustumPlanes)) {
                for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                    var subMesh = mesh.subMeshes[subIndex];

                    if (mesh.subMeshes.length == 1 || subMesh.isInFrustrum(frustumPlanes)) {
                        var material = subMesh.getMaterial();

                        if (this._activeMeshes.indexOf(mesh) === -1) {
                            this._activeMeshes.push(mesh);
                        }

                        if (material) {
                            // Render targets
                            if (material.getRenderTargetTextures) {
                                if (this._processedMaterials.indexOf(material) === -1) {
                                    this._processedMaterials.push(material);

                                    this._renderTargets = this._renderTargets.concat(material.getRenderTargetTextures());
                                }
                            }

                            // Dispatch
                            if (material.needAlphaBlending() || mesh.visibility < 1.0) { // Transparent
                                if (material.alpha > 0 || mesh.visibility < 1.0) {
                                    this._transparentSubMeshes.push(subMesh); // Opaque
                                }
                            } else if (material.needAlphaTesting()) { // Alpha test
                                this._alphaTestSubMeshes.push(subMesh);
                            } else {
                                this._opaqueSubMeshes.push(subMesh);
                            }
                        }
                    }
                }
            }
        }

        // Particle systems
        var beforeParticlesDate = new Date();
        if (this.particlesEnabled) {
            for (var particleIndex = 0; particleIndex < this.particleSystems.length; particleIndex++) {
                var particleSystem = this.particleSystems[particleIndex];

                if (!particleSystem.emitter.position || (particleSystem.emitter && particleSystem.emitter.isEnabled())) {
                    this._activeParticleSystems.push(particleSystem);
                    particleSystem.animate();
                }
            }
        }
        this._particlesDuration += new Date() - beforeParticlesDate;
    };

    BABYLON.Scene.prototype._localRender = function (opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes, activeMeshes) {
        var engine = this._engine;
        // Opaque
        var subIndex;
        var submesh;
        for (subIndex = 0; subIndex < opaqueSubMeshes.length; subIndex++) {
            submesh = opaqueSubMeshes[subIndex];
            this._activeVertices += submesh.verticesCount;

            submesh.render();
        }

        // Alpha test
        engine.setAlphaTesting(true);
        for (subIndex = 0; subIndex < alphaTestSubMeshes.length; subIndex++) {
            submesh = alphaTestSubMeshes[subIndex];
            this._activeVertices += submesh.verticesCount;

            submesh.render();
        }
        engine.setAlphaTesting(false);

        if (!activeMeshes) {
            // Sprites
            var beforeSpritessDate = new Date();
            for (var index = 0; index < this.spriteManagers.length; index++) {
                var spriteManager = this.spriteManagers[index];

                spriteManager.render();
            }
            this._spritesDuration = new Date() - beforeSpritessDate;
        }

        // Transparent
        engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE);
        for (subIndex = 0; subIndex < transparentSubMeshes.length; subIndex++) {
            submesh = transparentSubMeshes[subIndex];
            this._activeVertices += submesh.verticesCount;

            submesh.render();
        }
        engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);

        // Particles
        var beforeParticlesDate = new Date();
        for (var particleIndex = 0; particleIndex < this._activeParticleSystems.length; particleIndex++) {
            var particleSystem = this._activeParticleSystems[particleIndex];

            if (!particleSystem.emitter.position || !activeMeshes || activeMeshes.indexOf(particleSystem.emitter) !== -1) {
                this._activeParticles += particleSystem.render();
            }
        }
        this._particlesDuration += new Date() - beforeParticlesDate;
    };

    BABYLON.Scene.prototype.render = function () {
        var startDate = new Date();
        this._particlesDuration = 0;
        this._activeParticles = 0;
        var engine = this._engine;

        // Before render
        if (this.beforeRender) {
            this.beforeRender();
        }
        
        for (var callbackIndex = 0; callbackIndex < this._onBeforeRenderCallbacks.length; callbackIndex++) {
            this._onBeforeRenderCallbacks[callbackIndex]();
        }

        // Camera
        if (!this.activeCamera)
            throw new Error("Active camera not set");

        this.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix());

        // Animations
        this._animationRatio = BABYLON.Tools.GetDeltaTime() * (60.0 / 1000.0);
        this._animate();

        // Meshes
        var beforeEvaluateActiveMeshesDate = new Date();
        this._evaluateActiveMeshes();
        this._evaluateActiveMeshesDuration = new Date() - beforeEvaluateActiveMeshesDate;

        // Shadows
        for (var lightIndex = 0; lightIndex < this.lights.length; lightIndex++) {
            var light = this.lights[lightIndex];
            var shadowGenerator = light.getShadowGenerator();

            if (light.isEnabled && shadowGenerator && shadowGenerator.isReady()) {
                this._renderTargets.push(shadowGenerator.getShadowMap());
            }
        }
        
        // Render targets
        var beforeRenderTargetDate = new Date();
        for (var renderIndex = 0; renderIndex < this._renderTargets.length; renderIndex++) {
            var renderTarget = this._renderTargets[renderIndex];

            renderTarget.render();
        }

        if (this._renderTargets.length > 0) { // Restore back buffer
            engine.restoreDefaultFramebuffer();
        }
        this._renderTargetsDuration = new Date() - beforeRenderTargetDate;

        // Clear
        var beforeRenderDate = new Date();
        engine.clear(this.clearColor, this.autoClear, true);

        // Backgrounds
        if (this.layers.length) {
            engine.setDepthBuffer(false);
            var layerIndex;
            var layer;
            for (layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
                layer = this.layers[layerIndex];
                if (layer.isBackground) {
                    layer.render();
                }
            }
            engine.setDepthBuffer(true);
        }

        // Render
        this._localRender(this._opaqueSubMeshes, this._alphaTestSubMeshes, this._transparentSubMeshes);

        // Foregrounds
        if (this.layers.length) {
            engine.setDepthBuffer(false);
            for (layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
                layer = this.layers[layerIndex];
                if (!layer.isBackground) {
                    layer.render();
                }
            }
            engine.setDepthBuffer(true);
        }

        this._renderDuration = new Date() - beforeRenderDate;

        // Update camera
        this.activeCamera._update();

        // After render
        if (this.afterRender) {
            this.afterRender();
        }

        // Cleaning
        for (var index = 0; index < this._toBeDisposed.length; index++) {
            this._toBeDisposed[index].dispose();
        }

        this._toBeDisposed = [];

        this._lastFrameDuration = new Date() - startDate;
    };

    BABYLON.Scene.prototype.dispose = function () {
        this.beforeRender = null;
        this.afterRender = null;

        // Detach cameras
        var canvas = this._engine.getRenderingCanvas();
        var index;
        for (index = 0; index < this.cameras.length; index++) {
            this.cameras[index].detachControl(canvas);
        }
        
        // Release lights
        while (this.lights.length) {
            this.lights[0].dispose(true);
        }

        // Release meshes
        while (this.meshes.length) {
            this.meshes[0].dispose(true);
        }

        // Release materials
        while (this.materials.length) {
            this.materials[0].dispose();
        }

        // Release particles
        while (this.particleSystems.length) {
            this.particleSystems[0].dispose();
        }

        // Release sprites
        while (this.spriteManagers.length) {
            this.spriteManagers[0].dispose();
        }

        // Release layers
        while (this.layers.length) {
            this.layers[0].dispose();
        }

        // Release textures
        while (this.textures.length) {
            this.textures[index].dispose();
        }

        // Remove from engine
        index = this._engine.scenes.indexOf(this);
        this._engine.scenes.splice(index, 1);

        this._engine.wipeCaches();
    };

    // Collisions
    BABYLON.Scene.prototype._getNewPosition = function (position, velocity, collider, maximumRetry) {
        var scaledPosition = position.divide(collider.radius);
        var scaledVelocity = velocity.divide(collider.radius);

        collider.retry = 0;
        collider.initialVelocity = scaledVelocity;
        collider.initialPosition = scaledPosition;
        var finalPosition = this._collideWithWorld(scaledPosition, scaledVelocity, collider, maximumRetry);

        finalPosition = finalPosition.multiply(collider.radius);

        return finalPosition;
    };

    BABYLON.Scene.prototype._collideWithWorld = function (position, velocity, collider, maximumRetry) {
        var closeDistance = BABYLON.Engine.collisionsEpsilon * 10.0;

        if (collider.retry >= maximumRetry) {
            return position;
        }

        collider._initialize(position, velocity, closeDistance);

        // Check all meshes
        for (var index = 0; index < this.meshes.length; index++) {
            var mesh = this.meshes[index];
            if (mesh.isEnabled() && mesh.checkCollisions) {
                mesh._checkCollision(collider);
            }
        }

        if (!collider.collisionFound) {
            return position.add(velocity);
        }

        if (velocity.x != 0 || velocity.y != 0 || velocity.z != 0) {
            var response = collider._getResponse(position, velocity);
            position = response.position;
            velocity = response.velocity;
        }

        if (velocity.length() <= closeDistance) {
            return position;
        }

        collider.retry++;
        return this._collideWithWorld(position, velocity, collider, maximumRetry);
    };

    // Picking
    BABYLON.Scene.prototype.createPickingRay = function (x, y, world) {
        var engine = this._engine;

        if (!this._viewMatrix) {
            if (!this.activeCamera)
                throw new Error("Active camera not set");

            this.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix());
        }

        return BABYLON.Ray.CreateNew(x, y, engine.getRenderWidth() * engine.getHardwareScalingLevel(), engine.getRenderHeight() * engine.getHardwareScalingLevel(), world ? world : BABYLON.Matrix.Identity(), this._viewMatrix, this._projectionMatrix);
    };

    BABYLON.Scene.prototype.pick = function (x, y) {
        var distance = Number.MAX_VALUE;
        var pickedPoint = null;
        var pickedMesh = null;

        for (var meshIndex = 0; meshIndex < this.meshes.length; meshIndex++) {
            var mesh = this.meshes[meshIndex];

            if (!mesh.isEnabled() || !mesh.isVisible || !mesh.isPickable) {
                continue;
            }

            var world = mesh.getWorldMatrix();
            var ray = this.createPickingRay(x, y, world);

            var result = mesh.intersects(ray);
            if (!result.hit)
                continue;

            if (result.distance >= distance)
                continue;

            distance = result.distance;
            pickedMesh = mesh;

            // Get picked point
            var worldOrigin = BABYLON.Vector3.TransformCoordinates(ray.origin, world);
            var direction = ray.direction.clone();
            direction.normalize();
            direction = direction.scale(result.distance);
            var worldDirection = BABYLON.Vector3.TransformNormal(direction, world);

            pickedPoint = worldOrigin.add(worldDirection);
        }

        return { hit: distance != Number.MAX_VALUE, distance: distance, pickedMesh: pickedMesh, pickedPoint: pickedPoint };
    };

    // Statics
    BABYLON.Scene.FOGMODE_NONE = 0;
    BABYLON.Scene.FOGMODE_EXP = 1;
    BABYLON.Scene.FOGMODE_EXP2 = 2;
    BABYLON.Scene.FOGMODE_LINEAR = 3;
})();