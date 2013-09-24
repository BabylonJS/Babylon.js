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

        this._renderId = 0;
        this._executeWhenReadyTimeoutId = -1;

        this._toBeDisposed = new BABYLON.Tools.SmartArray(256);

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

        // Internal smart arrays
        this._activeMeshes = new BABYLON.Tools.SmartArray(256);
        this._opaqueSubMeshes = new BABYLON.Tools.SmartArray(256);
        this._transparentSubMeshes = new BABYLON.Tools.SmartArray(256);
        this._alphaTestSubMeshes = new BABYLON.Tools.SmartArray(256);
        this._processedMaterials = new BABYLON.Tools.SmartArray(256);
        this._renderTargets = new BABYLON.Tools.SmartArray(256);
        this._activeParticleSystems = new BABYLON.Tools.SmartArray(256);
        this._activeSkeletons = new BABYLON.Tools.SmartArray(32);

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

        // Skeletons
        this.skeletons = [];

        // Collisions
        this.collisionsEnabled = true;
        this.gravity = new BABYLON.Vector3(0, -9.0, 0);

        // Animations
        this._activeAnimatables = [];

        // Matrices
        this._transformMatrix = BABYLON.Matrix.Zero();

        // Internals
        this._scaledPosition = BABYLON.Vector3.Zero();
        this._scaledVelocity = BABYLON.Vector3.Zero();

        // Postprocesses
        this.postProcessManager = new BABYLON.PostProcessManager();
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

    BABYLON.Scene.prototype.getRenderId = function () {
        return this._renderId;
    };

    // Ready
    BABYLON.Scene.prototype.isReady = function () {
        if (this._pendingData.length > 0) {
            return false;
        }

        for (var index = 0; index < this.meshes.length; index++) {
            var mesh = this.meshes[index];
            var mat = mesh.material;

            if (mesh.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADING) {
                return false;
            }

            if (mat) {
                if (!mat.isReady(mesh, mesh.delayLoadState !== BABYLON.Engine.DELAYLOADSTATE_NOTLOADED)) {
                    return false;
                }
            }
        }

        return true;
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
        }
    };
    
    BABYLON.Scene.prototype.getWaitingItemsCount = function () {
        return this._pendingData.length;
    };

    BABYLON.Scene.prototype.executeWhenReady = function (func) {
        this._onReadyCallbacks.push(func);

        if (this._executeWhenReadyTimeoutId !== -1) {
            return;
        }
        
        var that = this;
        this._executeWhenReadyTimeoutId = setTimeout(function () {
            that._checkIsReady();
        }, 150);
    };

    BABYLON.Scene.prototype._checkIsReady = function () {
        if (this.isReady()) {
            this._onReadyCallbacks.forEach(function (func) {
                func();
            });

            this._onReadyCallbacks = [];
            this._executeWhenReadyTimeoutId = -1;
            return;
        }
        
        var that = this;
        this._executeWhenReadyTimeoutId = setTimeout(function () {
            that._checkIsReady();
        }, 150);
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
        if (!this._animationStartDate) {
            this._animationStartDate = new Date();
        }
        // Getting time
        var now = new Date();
        var delay = now - this._animationStartDate;

        for (var index = 0; index < this._activeAnimatables.length; index++) {
            if (!this._activeAnimatables[index]._animate(delay)) {
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

        this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
    };

    // Methods
    BABYLON.Scene.prototype.activeCameraByID = function (id) {
        for (var index = 0; index < this.cameras.length; index++) {
            if (this.cameras[index].id === id) {
                this.activeCamera = this.cameras[index];
                return;
            }
        }
    };

    BABYLON.Scene.prototype.getMaterialByID = function (id) {
        for (var index = 0; index < this.materials.length; index++) {
            if (this.materials[index].id === id) {
                return this.materials[index];
            }
        }

        return null;
    };

    BABYLON.Scene.prototype.getLightByID = function (id) {
        for (var index = 0; index < this.lights.length; index++) {
            if (this.lights[index].id === id) {
                return this.lights[index];
            }
        }

        return null;
    };

    BABYLON.Scene.prototype.getMeshByID = function (id) {
        for (var index = 0; index < this.meshes.length; index++) {
            if (this.meshes[index].id === id) {
                return this.meshes[index];
            }
        }

        return null;
    };

    BABYLON.Scene.prototype.getLastMeshByID = function (id) {
        for (var index = this.meshes.length - 1; index >= 0 ; index--) {
            if (this.meshes[index].id === id) {
                return this.meshes[index];
            }
        }

        return null;
    };

    BABYLON.Scene.prototype.getMeshByName = function (name) {
        for (var index = 0; index < this.meshes.length; index++) {
            if (this.meshes[index].name === name) {
                return this.meshes[index];
            }
        }

        return null;
    };

    BABYLON.Scene.prototype.getLastSkeletonByID = function (id) {
        for (var index = this.skeletons.length - 1; index >= 0 ; index--) {
            if (this.skeletons[index].id === id) {
                return this.skeletons[index];
            }
        }

        return null;
    };

    BABYLON.Scene.prototype.getSkeletonById = function (id) {
        for (var index = 0; index < this.skeletons.length; index++) {
            if (this.skeletons[index].id === id) {
                return this.skeletons[index];
            }
        }

        return null;
    };

    BABYLON.Scene.prototype.getSkeletonByName = function (name) {
        for (var index = 0; index < this.skeleton.length; index++) {
            if (this.skeletons[index].name === name) {
                return this.skeletons[index];
            }
        }

        return null;
    };

    BABYLON.Scene.prototype.isActiveMesh = function (mesh) {
        return (this._activeMeshes.indexOf(mesh) !== -1);
    };

    BABYLON.Scene.prototype._evaluateSubMesh = function (subMesh, mesh) {
        if (mesh.subMeshes.length == 1 || subMesh.isInFrustrum(this._frustumPlanes)) {
            var material = subMesh.getMaterial();

            if (material) {
                // Render targets
                if (material.getRenderTargetTextures) {
                    if (this._processedMaterials.indexOf(material) === -1) {
                        this._processedMaterials.push(material);

                        this._renderTargets.concat(material.getRenderTargetTextures());
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
    };

    BABYLON.Scene.prototype._evaluateActiveMeshes = function () {
        this._activeMeshes.reset();
        this._opaqueSubMeshes.reset();
        this._transparentSubMeshes.reset();
        this._alphaTestSubMeshes.reset();
        this._processedMaterials.reset();
        this._renderTargets.reset();
        this._activeParticleSystems.reset();
        this._activeSkeletons.reset();

        if (!this._frustumPlanes) {
            this._frustumPlanes = BABYLON.Frustum.GetPlanes(this._transformMatrix);
        } else {
            BABYLON.Frustum.GetPlanesToRef(this._transformMatrix, this._frustumPlanes);
        }

        this._totalVertices = 0;
        this._activeVertices = 0;

        // Meshes
        if (this._selectionOctree) { // Octree
            var selection = this._selectionOctree.select(this._frustumPlanes);

            for (var blockIndex = 0; blockIndex < selection.length; blockIndex++) {
                var block = selection.data[blockIndex];

                for (var meshIndex = 0; meshIndex < block.meshes.length; meshIndex++) {
                    var mesh = block.meshes[meshIndex];

                    if (Math.abs(mesh._renderId) !== this._renderId) {
                        this._totalVertices += mesh.getTotalVertices();

                        if (!mesh.isReady()) {
                            continue;
                        }

                        mesh.computeWorldMatrix();
                        mesh._renderId = 0;
                    }

                    if (mesh._renderId === this._renderId || (mesh._renderId === 0 && mesh.isEnabled() && mesh.isVisible && mesh.visibility > 0 && mesh.isInFrustrum(this._frustumPlanes))) {
                        if (mesh._renderId === 0) {
                            this._activeMeshes.push(mesh);
                        }
                        mesh._renderId = this._renderId;

                        if (mesh.skeleton) {
                            this._activeSkeletons.pushNoDuplicate(mesh.skeleton);
                        }

                        var subMeshes = block.subMeshes[meshIndex];
                        for (var subIndex = 0; subIndex < subMeshes.length; subIndex++) {
                            var subMesh = subMeshes[subIndex];

                            if (subMesh._renderId === this._renderId) {
                                continue;
                            }
                            subMesh._renderId = this._renderId;

                            this._evaluateSubMesh(subMesh, mesh);
                        }
                    } else {
                        mesh._renderId = -this._renderId;
                    }
                }
            }
        } else { // Full scene traversal
            for (var meshIndex = 0; meshIndex < this.meshes.length; meshIndex++) {
                var mesh = this.meshes[meshIndex];

                this._totalVertices += mesh.getTotalVertices();

                if (!mesh.isReady()) {
                    continue;
                }

                mesh.computeWorldMatrix();

                if (mesh.isEnabled() && mesh.isVisible && mesh.visibility > 0 && mesh.isInFrustrum(this._frustumPlanes)) {
                    this._activeMeshes.push(mesh);

                    if (mesh.skeleton) {
                        this._activeSkeletons.pushNoDuplicate(mesh.skeleton);
                    }

                    for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                        var subMesh = mesh.subMeshes[subIndex];

                        this._evaluateSubMesh(subMesh, mesh);
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
            submesh = opaqueSubMeshes.data[subIndex];
            this._activeVertices += submesh.verticesCount;

            submesh.render();
        }

        // Alpha test
        engine.setAlphaTesting(true);
        for (subIndex = 0; subIndex < alphaTestSubMeshes.length; subIndex++) {
            submesh = alphaTestSubMeshes.data[subIndex];
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
            submesh = transparentSubMeshes.data[subIndex];
            this._activeVertices += submesh.verticesCount;

            submesh.render();
        }
        engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);

        // Particles
        var beforeParticlesDate = new Date();
        for (var particleIndex = 0; particleIndex < this._activeParticleSystems.length; particleIndex++) {
            var particleSystem = this._activeParticleSystems.data[particleIndex];

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
        this._renderId++;
        var beforeEvaluateActiveMeshesDate = new Date();
        this._evaluateActiveMeshes();
        this._evaluateActiveMeshesDuration = new Date() - beforeEvaluateActiveMeshesDate;

        // Skeletons
        for (var skeletonIndex = 0; skeletonIndex < this._activeSkeletons.length; skeletonIndex++) {
            var skeleton = this._activeSkeletons.data[skeletonIndex];

            skeleton.prepare();
        }

        // Shadows
        for (var lightIndex = 0; lightIndex < this.lights.length; lightIndex++) {
            var light = this.lights[lightIndex];
            var shadowGenerator = light.getShadowGenerator();

            if (light.isEnabled && shadowGenerator) {
                this._renderTargets.push(shadowGenerator.getShadowMap());
            }
        }

        // Render targets
        var beforeRenderTargetDate = new Date();
        for (var renderIndex = 0; renderIndex < this._renderTargets.length; renderIndex++) {
            var renderTarget = this._renderTargets.data[renderIndex];
            this._renderId++;
            renderTarget.render();
        }

        if (this._renderTargets.length > 0) { // Restore back buffer
            engine.restoreDefaultFramebuffer();
        }
        this._renderTargetsDuration = new Date() - beforeRenderTargetDate;

        // Prepare Frame
        this.postProcessManager._prepareFrame();

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

        // Finalize frame
        this.postProcessManager._finalizeFrame();

        // Update camera
        this.activeCamera._update();

        // After render
        if (this.afterRender) {
            this.afterRender();
        }

        // Cleaning
        for (var index = 0; index < this._toBeDisposed.length; index++) {
            this._toBeDisposed.data[index].dispose();
            this._toBeDisposed[index] = null;
        }

        this._toBeDisposed.reset();

        this._lastFrameDuration = new Date() - startDate;
    };

    BABYLON.Scene.prototype.dispose = function () {
        this.beforeRender = null;
        this.afterRender = null;

        this.skeletons = [];

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
            this.textures[0].dispose();
        }

        // Remove from engine
        index = this._engine.scenes.indexOf(this);
        this._engine.scenes.splice(index, 1);

        this._engine.wipeCaches();
    };

    // Collisions
    BABYLON.Scene.prototype._getNewPosition = function (position, velocity, collider, maximumRetry, finalPosition) {
        position.divideToRef(collider.radius, this._scaledPosition);
        velocity.divideToRef(collider.radius, this._scaledVelocity);

        collider.retry = 0;
        collider.initialVelocity = this._scaledVelocity;
        collider.initialPosition = this._scaledPosition;
        this._collideWithWorld(this._scaledPosition, this._scaledVelocity, collider, maximumRetry, finalPosition);

        finalPosition.multiplyInPlace(collider.radius);
    };

    BABYLON.Scene.prototype._collideWithWorld = function (position, velocity, collider, maximumRetry, finalPosition) {
        var closeDistance = BABYLON.Engine.collisionsEpsilon * 10.0;

        if (collider.retry >= maximumRetry) {
            finalPosition.copyFrom(position);
            return;
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
            position.addToRef(velocity, finalPosition);
            return;
        }

        if (velocity.x != 0 || velocity.y != 0 || velocity.z != 0) {
            collider._getResponse(position, velocity);
        }

        if (velocity.length() <= closeDistance) {
            finalPosition.copyFrom(position);
            return;
        }

        collider.retry++;
        this._collideWithWorld(position, velocity, collider, maximumRetry, finalPosition);
    };

    // Octrees
    BABYLON.Scene.prototype.createOrUpdateSelectionOctree = function () {
        if (!this._selectionOctree) {
            this._selectionOctree = new BABYLON.Octree();
        }

        // World limits
        var checkExtends = function (v, min, max) {
            if (v.x < min.x)
                min.x = v.x;
            if (v.y < min.y)
                min.y = v.y;
            if (v.z < min.z)
                min.z = v.z;

            if (v.x > max.x)
                max.x = v.x;
            if (v.y > max.y)
                max.y = v.y;
            if (v.z > max.z)
                max.z = v.z;
        };

        var min = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        var max = new BABYLON.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
        for (var index = 0; index < this.meshes.length; index++) {
            var mesh = this.meshes[index];

            mesh.computeWorldMatrix();
            var minBox = mesh.getBoundingInfo().boundingBox.minimumWorld;
            var maxBox = mesh.getBoundingInfo().boundingBox.maximumWorld;

            checkExtends(minBox, min, max);
            checkExtends(maxBox, min, max);
        }

        // Update octree
        this._selectionOctree.update(min, max, this.meshes);
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
            pickedPoint = result.pickedPoint;
        }

        return { hit: distance != Number.MAX_VALUE, distance: distance, pickedMesh: pickedMesh, pickedPoint: pickedPoint };
    };

    // Statics
    BABYLON.Scene.FOGMODE_NONE = 0;
    BABYLON.Scene.FOGMODE_EXP = 1;
    BABYLON.Scene.FOGMODE_EXP2 = 2;
    BABYLON.Scene.FOGMODE_LINEAR = 3;
})();