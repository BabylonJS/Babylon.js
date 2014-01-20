<<<<<<< HEAD
﻿"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.Mesh = function (name, scene) {
        BABYLON.Node.call(this, scene);

        this.name = name;
        this.id = name;

        this._totalVertices = 0;
        this._worldMatrix = BABYLON.Matrix.Identity();

        scene.meshes.push(this);

        this.position = new BABYLON.Vector3(0, 0, 0);
        this.rotation = new BABYLON.Vector3(0, 0, 0);
        this.rotationQuaternion = null;
        this.scaling = new BABYLON.Vector3(1, 1, 1);

        this._pivotMatrix = BABYLON.Matrix.Identity();

        this._indices = [];
        this.subMeshes = [];

        this._renderId = 0;

        this._onBeforeRenderCallbacks = [];

        // Animations
        this.animations = [];

        // Cache
        this._positions = null;
        BABYLON.Mesh.prototype._initCache.call(this);

        this._localScaling = BABYLON.Matrix.Zero();
        this._localRotation = BABYLON.Matrix.Zero();
        this._localTranslation = BABYLON.Matrix.Zero();
        this._localBillboard = BABYLON.Matrix.Zero();
        this._localPivotScaling = BABYLON.Matrix.Zero();
        this._localPivotScalingRotation = BABYLON.Matrix.Zero();
        this._localWorld = BABYLON.Matrix.Zero();
        this._worldMatrix = BABYLON.Matrix.Zero();
        this._rotateYByPI = BABYLON.Matrix.RotationY(Math.PI);

        this._collisionsTransformMatrix = BABYLON.Matrix.Zero();
        this._collisionsScalingMatrix = BABYLON.Matrix.Zero();

        this._absolutePosition = BABYLON.Vector3.Zero();
    };

    BABYLON.Mesh.prototype = Object.create(BABYLON.Node.prototype);

    // Constants
    BABYLON.Mesh.BILLBOARDMODE_NONE = 0;
    BABYLON.Mesh.BILLBOARDMODE_X = 1;
    BABYLON.Mesh.BILLBOARDMODE_Y = 2;
    BABYLON.Mesh.BILLBOARDMODE_Z = 4;
    BABYLON.Mesh.BILLBOARDMODE_ALL = 7;

    // Members    
    BABYLON.Mesh.prototype.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NONE;
    BABYLON.Mesh.prototype.material = null;
    BABYLON.Mesh.prototype.isVisible = true;
    BABYLON.Mesh.prototype.isPickable = true;
    BABYLON.Mesh.prototype.visibility = 1.0;
    BABYLON.Mesh.prototype.billboardMode = BABYLON.Mesh.BILLBOARDMODE_NONE;
    BABYLON.Mesh.prototype.checkCollisions = false;
    BABYLON.Mesh.prototype.receiveShadows = false;

    BABYLON.Mesh.prototype._isDisposed = false;
    BABYLON.Mesh.prototype.onDispose = null;

    BABYLON.Mesh.prototype.skeleton = null;

    BABYLON.Mesh.prototype.renderingGroupId = 0;

    BABYLON.Mesh.prototype.infiniteDistance = false;

    // Properties

    BABYLON.Mesh.prototype.getBoundingInfo = function () {
        return this._boundingInfo;
    };

    BABYLON.Mesh.prototype.getScene = function () {
        return this._scene;
    };

    BABYLON.Mesh.prototype.getWorldMatrix = function () {
        if (this._currentRenderId !== this._scene.getRenderId()) {
            this.computeWorldMatrix();
        }
        return this._worldMatrix;
    };

    BABYLON.Mesh.prototype.getAbsolutePosition = function () {
        return this._absolutePosition;
    };

    BABYLON.Mesh.prototype.getTotalVertices = function () {
        return this._totalVertices;
    };

    BABYLON.Mesh.prototype.getVerticesData = function (kind) {
        return this._vertexBuffers[kind].getData();
    };

    BABYLON.Mesh.prototype.isVerticesDataPresent = function (kind) {
        if (!this._vertexBuffers && this._delayInfo) {
            return this._delayInfo.indexOf(kind) !== -1;
        }

        return this._vertexBuffers[kind] !== undefined;
    };

    BABYLON.Mesh.prototype.getTotalIndices = function () {
        return this._indices.length;
    };

    BABYLON.Mesh.prototype.getIndices = function () {
        return this._indices;
    };

    BABYLON.Mesh.prototype.getVertexStrideSize = function () {
        return this._vertexStrideSize;
    };

    BABYLON.Mesh.prototype.setPivotMatrix = function (matrix) {
        this._pivotMatrix = matrix;
        this._cache.pivotMatrixUpdated = true;
    };

    BABYLON.Mesh.prototype.getPivotMatrix = function () {
        return this._pivotMatrix;
    };

    BABYLON.Mesh.prototype._isSynchronized = function () {
        if (this.billboardMode !== BABYLON.Mesh.BILLBOARDMODE_NONE)
            return false;

        if (this._cache.pivotMatrixUpdated) {
            return false;
        }

        if (this.infiniteDistance) {
            return false;
        }

        if (!this._cache.position.equals(this.position))
            return false;

        if (this.rotationQuaternion) {
            if (!this._cache.rotationQuaternion.equals(this.rotationQuaternion))
                return false;
        } else {
            if (!this._cache.rotation.equals(this.rotation))
                return false;
        }

        if (!this._cache.scaling.equals(this.scaling))
            return false;

        return true;
    };

    BABYLON.Mesh.prototype.isReady = function () {
        return this._isReady;
    };

    BABYLON.Mesh.prototype.isAnimated = function () {
        return this._animationStarted;
    };

    BABYLON.Mesh.prototype.isDisposed = function () {
        return this._isDisposed;
    };

    // Methods
    BABYLON.Mesh.prototype._initCache = function () {
        this._cache.localMatrixUpdated = false;
        this._cache.position = BABYLON.Vector3.Zero();
        this._cache.scaling = BABYLON.Vector3.Zero();
        this._cache.rotation = BABYLON.Vector3.Zero();
        this._cache.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 0);
    };

    BABYLON.Mesh.prototype.markAsDirty = function (property) {
        if (property === "rotation") {
            this.rotationQuaternion = null;
        }
        this._syncChildFlag();
    };

    BABYLON.Mesh.prototype.refreshBoundingInfo = function () {
        var data = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);

        if (!data) {
            return;
        }

        var extend = BABYLON.Tools.ExtractMinAndMax(data, 0, this._totalVertices);
        this._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);

        for (var index = 0; index < this.subMeshes.length; index++) {
            this.subMeshes[index].refreshBoundingInfo();
        }

        this._updateBoundingInfo();
    };

    BABYLON.Mesh.prototype._updateBoundingInfo = function () {
        if (this._boundingInfo) {
            this._scaleFactor = Math.max(this.scaling.x, this.scaling.y);
            this._scaleFactor = Math.max(this._scaleFactor, this.scaling.z);

            if (this.parent && this.parent._scaleFactor)
                this._scaleFactor = this._scaleFactor * this.parent._scaleFactor;

            this._boundingInfo._update(this._worldMatrix, this._scaleFactor);

            for (var subIndex = 0; subIndex < this.subMeshes.length; subIndex++) {
                var subMesh = this.subMeshes[subIndex];

                subMesh.updateBoundingInfo(this._worldMatrix, this._scaleFactor);
            }
        }
    };

    BABYLON.Mesh.prototype.computeWorldMatrix = function (force) {
        if (!force && (this._currentRenderId == this._scene.getRenderId() || this.isSynchronized(true))) {
            return this._worldMatrix;
        }

        this._syncChildFlag();
        this._cache.position.copyFrom(this.position);
        this._cache.scaling.copyFrom(this.scaling);
        this._cache.pivotMatrixUpdated = false;
        this._currentRenderId = this._scene.getRenderId();

        // Scaling
        BABYLON.Matrix.ScalingToRef(this.scaling.x, this.scaling.y, this.scaling.z, this._localScaling);

        // Rotation
        if (this.rotationQuaternion) {
            this.rotationQuaternion.toRotationMatrix(this._localRotation);
            this._cache.rotationQuaternion.copyFrom(this.rotationQuaternion);
        } else {
            BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._localRotation);
            this._cache.rotation.copyFrom(this.rotation);
        }

        // Translation
        if (this.infiniteDistance) {
            var camera = this._scene.activeCamera;
            BABYLON.Matrix.TranslationToRef(this.position.x + camera.position.x, this.position.y + camera.position.y, this.position.z + camera.position.z, this._localTranslation);
        } else {
            BABYLON.Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._localTranslation);
        }

        // Composing transformations
        this._pivotMatrix.multiplyToRef(this._localScaling, this._localPivotScaling);
        this._localPivotScaling.multiplyToRef(this._localRotation, this._localPivotScalingRotation);

        // Billboarding
        if (this.billboardMode !== BABYLON.Mesh.BILLBOARDMODE_NONE) {
            var localPosition = this.position.clone();
            var zero = this._scene.activeCamera.position.clone();

            if (this.parent && this.parent.position) {
                localPosition.addInPlace(this.parent.position);
                BABYLON.Matrix.TranslationToRef(localPosition.x, localPosition.y, localPosition.z, this._localTranslation);
            }

            if (this.billboardMode & BABYLON.Mesh.BILLBOARDMODE_ALL === BABYLON.Mesh.BILLBOARDMODE_ALL) {
                zero = this._scene.activeCamera.position;
            } else {
                if (this.billboardMode & BABYLON.Mesh.BILLBOARDMODE_X)
                    zero.x = localPosition.x + BABYLON.Engine.epsilon;
                if (this.billboardMode & BABYLON.Mesh.BILLBOARDMODE_Y)
                    zero.y = localPosition.y + BABYLON.Engine.epsilon;
                if (this.billboardMode & BABYLON.Mesh.BILLBOARDMODE_Z)
                    zero.z = localPosition.z + BABYLON.Engine.epsilon;
            }

            BABYLON.Matrix.LookAtLHToRef(localPosition, zero, BABYLON.Vector3.Up(), this._localBillboard);
            this._localBillboard.m[12] = this._localBillboard.m[13] = this._localBillboard.m[14] = 0;

            this._localBillboard.invert();

            this._localPivotScalingRotation.multiplyToRef(this._localBillboard, this._localWorld);
            this._rotateYByPI.multiplyToRef(this._localWorld, this._localPivotScalingRotation);
        }

        // Local world
        this._localPivotScalingRotation.multiplyToRef(this._localTranslation, this._localWorld);

        // Parent
        if (this.parent && this.parent.getWorldMatrix && this.billboardMode === BABYLON.Mesh.BILLBOARDMODE_NONE) {
            this._localWorld.multiplyToRef(this.parent.getWorldMatrix(), this._worldMatrix);
        } else {
            this._localPivotScalingRotation.multiplyToRef(this._localTranslation, this._worldMatrix);
        }

        // Bounding info
        this._updateBoundingInfo();

        // Absolute position
        this._absolutePosition.copyFromFloats(this._worldMatrix.m[12], this._worldMatrix.m[13], this._worldMatrix.m[14]);

        return this._worldMatrix;
    };


    BABYLON.Mesh.prototype._createGlobalSubMesh = function () {
        if (!this._totalVertices || !this._indices) {
            return null;
        }

        this.subMeshes = [];
        return new BABYLON.SubMesh(0, 0, this._totalVertices, 0, this._indices.length, this);
    };


    BABYLON.Mesh.prototype.subdivide = function (count) {
        if (count < 1) {
            return;
        }

        var subdivisionSize = this._indices.length / count;
        var offset = 0;

        this.subMeshes = [];
        for (var index = 0; index < count; index++) {
            BABYLON.SubMesh.CreateFromIndices(0, offset, Math.min(subdivisionSize, this._indices.length - offset), this);

            offset += subdivisionSize;
        }
    };

    BABYLON.Mesh.prototype.setVerticesData = function (data, kind, updatable) {
        if (!this._vertexBuffers) {
            this._vertexBuffers = {};
        }

        if (this._vertexBuffers[kind]) {
            this._vertexBuffers[kind].dispose();
        }

        this._vertexBuffers[kind] = new BABYLON.VertexBuffer(this, data, kind, updatable);

        if (kind === BABYLON.VertexBuffer.PositionKind) {
            var stride = this._vertexBuffers[kind].getStrideSize();
            this._totalVertices = data.length / stride;

            var extend = BABYLON.Tools.ExtractMinAndMax(data, 0, this._totalVertices);
            this._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);

            this._createGlobalSubMesh();
        }
    };

    BABYLON.Mesh.prototype.updateVerticesData = function (kind, data) {
        if (this._vertexBuffers[kind]) {
            this._vertexBuffers[kind].update(data);
        }
    };

    BABYLON.Mesh.prototype.setIndices = function (indices) {
        if (this._indexBuffer) {
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
        }

        this._indexBuffer = this._scene.getEngine().createIndexBuffer(indices);
        this._indices = indices;

        this._createGlobalSubMesh();
    };

    BABYLON.Mesh.prototype.bindAndDraw = function (subMesh, effect, wireframe) {
        var engine = this._scene.getEngine();

        // Wireframe
        var indexToBind = this._indexBuffer;
        var useTriangles = true;

        if (wireframe) {
            indexToBind = subMesh.getLinesIndexBuffer(this._indices, engine);
            useTriangles = false;
        }

        // VBOs
        engine.bindMultiBuffers(this._vertexBuffers, indexToBind, effect);

        // Draw order
        engine.draw(useTriangles, useTriangles ? subMesh.indexStart : 0, useTriangles ? subMesh.indexCount : subMesh.linesIndexCount);
    };

    BABYLON.Mesh.prototype.registerBeforeRender = function (func) {
        this._onBeforeRenderCallbacks.push(func);
    };

    BABYLON.Mesh.prototype.unregisterBeforeRender = function (func) {
        var index = this._onBeforeRenderCallbacks.indexOf(func);

        if (index > -1) {
            this._onBeforeRenderCallbacks.splice(index, 1);
        }
    };

    BABYLON.Mesh.prototype.render = function (subMesh) {
        if (!this._vertexBuffers || !this._indexBuffer) {
            return;
        }

        for (var callbackIndex = 0; callbackIndex < this._onBeforeRenderCallbacks.length; callbackIndex++) {
            this._onBeforeRenderCallbacks[callbackIndex]();
        }

        // World
        var world = this.getWorldMatrix();

        // Material
        var effectiveMaterial = subMesh.getMaterial();

        if (!effectiveMaterial || !effectiveMaterial.isReady(this)) {
            return;
        }

        effectiveMaterial._preBind();
        effectiveMaterial.bind(world, this);

        // Bind and draw
        var engine = this._scene.getEngine();
        this.bindAndDraw(subMesh, effectiveMaterial.getEffect(), engine.forceWireframe || effectiveMaterial.wireframe);

        // Unbind
        effectiveMaterial.unbind();
    };

    BABYLON.Mesh.prototype.getEmittedParticleSystems = function () {
        var results = [];
        for (var index = 0; index < this._scene.particleSystems.length; index++) {
            var particleSystem = this._scene.particleSystems[index];
            if (particleSystem.emitter === this) {
                results.push(particleSystem);
            }
        }

        return results;
    };

    BABYLON.Mesh.prototype.getHierarchyEmittedParticleSystems = function () {
        var results = [];
        var descendants = this.getDescendants();
        descendants.push(this);

        for (var index = 0; index < this._scene.particleSystems.length; index++) {
            var particleSystem = this._scene.particleSystems[index];
            if (descendants.indexOf(particleSystem.emitter) !== -1) {
                results.push(particleSystem);
            }
        }

        return results;
    };

    BABYLON.Mesh.prototype.getChildren = function () {
        var results = [];
        for (var index = 0; index < this._scene.meshes.length; index++) {
            var mesh = this._scene.meshes[index];
            if (mesh.parent == this) {
                results.push(mesh);
            }
        }

        return results;
    };

    BABYLON.Mesh.prototype.isInFrustum = function (frustumPlanes) {
        if (this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADING) {
            return false;
        }

        var result = this._boundingInfo.isInFrustum(frustumPlanes);

        if (result && this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADING;
            var that = this;

            this._scene._addPendingData(this);

            BABYLON.Tools.LoadFile(this.delayLoadingFile, function (data) {
                BABYLON.SceneLoader._ImportGeometry(JSON.parse(data), that);
                that.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
                that._scene._removePendingData(that);
            }, function () { }, this._scene.database);
        }

        return result;
    };

    BABYLON.Mesh.prototype.setMaterialByID = function (id) {
        var materials = this._scene.materials;
        for (var index = 0; index < materials.length; index++) {
            if (materials[index].id == id) {
                this.material = materials[index];
                return;
            }
        }

        // Multi
        var multiMaterials = this._scene.multiMaterials;
        for (var index = 0; index < multiMaterials.length; index++) {
            if (multiMaterials[index].id == id) {
                this.material = multiMaterials[index];
                return;
            }
        }
    };

    BABYLON.Mesh.prototype.getAnimatables = function () {
        var results = [];

        if (this.material) {
            results.push(this.material);
        }

        return results;
    };

    // Geometry
    BABYLON.Mesh.prototype.setLocalTranslation = function (vector3) {
        console.warn("deprecated: use setPositionWithLocalVector instead");
        this.computeWorldMatrix();
        var worldMatrix = this._worldMatrix.clone();
        worldMatrix.setTranslation(BABYLON.Vector3.Zero());

        this.position = BABYLON.Vector3.TransformCoordinates(vector3, worldMatrix);
    };

    BABYLON.Mesh.prototype.getLocalTranslation = function () {
        console.warn("deprecated: use getPositionExpressedInLocalSpace instead");
        this.computeWorldMatrix();
        var invWorldMatrix = this._worldMatrix.clone();
        invWorldMatrix.setTranslation(BABYLON.Vector3.Zero());
        invWorldMatrix.invert();

        return BABYLON.Vector3.TransformCoordinates(this.position, invWorldMatrix);
    };

    BABYLON.Mesh.prototype.setPositionWithLocalVector = function (vector3) {
        this.computeWorldMatrix();

        this.position = BABYLON.Vector3.TransformNormal(vector3, this._localWorld);
    };

    BABYLON.Mesh.prototype.getPositionExpressedInLocalSpace = function () {
        this.computeWorldMatrix();
        var invLocalWorldMatrix = this._localWorld.clone();
        invLocalWorldMatrix.invert();

        return BABYLON.Vector3.TransformNormal(this.position, invLocalWorldMatrix);
    };

    BABYLON.Mesh.prototype.locallyTranslate = function (vector3) {
        this.computeWorldMatrix();

        this.position = BABYLON.Vector3.TransformCoordinates(vector3, this._localWorld);
    };

    BABYLON.Mesh.prototype.bakeTransformIntoVertices = function (transform) {
        // Position
        if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
            return;
        }

        this._resetPointsArrayCache();

        var data = this._vertexBuffers[BABYLON.VertexBuffer.PositionKind].getData();
        var temp = new BABYLON.MatrixType(data.length);
        for (var index = 0; index < data.length; index += 3) {
            BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.FromArray(data, index), transform).toArray(temp, index);
        }

        this.setVerticesData(temp, BABYLON.VertexBuffer.PositionKind, this._vertexBuffers[BABYLON.VertexBuffer.PositionKind].isUpdatable());

        // Normals
        if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
            return;
        }

        data = this._vertexBuffers[BABYLON.VertexBuffer.NormalKind].getData();
        for (var index = 0; index < data.length; index += 3) {
            BABYLON.Vector3.TransformNormal(BABYLON.Vector3.FromArray(data, index), transform).toArray(temp, index);
        }

        this.setVerticesData(temp, BABYLON.VertexBuffer.NormalKind, this._vertexBuffers[BABYLON.VertexBuffer.NormalKind].isUpdatable());
    };

    // Cache
    BABYLON.Mesh.prototype._resetPointsArrayCache = function () {
        this._positions = null;
    };

    BABYLON.Mesh.prototype._generatePointsArray = function () {
        if (this._positions)
            return;

        this._positions = [];

        var data = this._vertexBuffers[BABYLON.VertexBuffer.PositionKind].getData();
        for (var index = 0; index < data.length; index += 3) {
            this._positions.push(BABYLON.Vector3.FromArray(data, index));
        }
    };

    // Collisions
    BABYLON.Mesh.prototype._collideForSubMesh = function (subMesh, transformMatrix, collider) {
        this._generatePointsArray();
        // Transformation
        if (!subMesh._lastColliderWorldVertices || !subMesh._lastColliderTransformMatrix.equals(transformMatrix)) {
            subMesh._lastColliderTransformMatrix = transformMatrix;
            subMesh._lastColliderWorldVertices = [];
            var start = subMesh.verticesStart;
            var end = (subMesh.verticesStart + subMesh.verticesCount);
            for (var i = start; i < end; i++) {
                subMesh._lastColliderWorldVertices.push(BABYLON.Vector3.TransformCoordinates(this._positions[i], transformMatrix));
            }
        }
        // Collide
        collider._collide(subMesh, subMesh._lastColliderWorldVertices, this._indices, subMesh.indexStart, subMesh.indexStart + subMesh.indexCount, subMesh.verticesStart);
    };

    BABYLON.Mesh.prototype._processCollisionsForSubModels = function (collider, transformMatrix) {
        for (var index = 0; index < this.subMeshes.length; index++) {
            var subMesh = this.subMeshes[index];

            // Bounding test
            if (this.subMeshes.length > 1 && !subMesh._checkCollision(collider))
                continue;

            this._collideForSubMesh(subMesh, transformMatrix, collider);
        }
    };

    BABYLON.Mesh.prototype._checkCollision = function (collider) {
        // Bounding box test
        if (!this._boundingInfo._checkCollision(collider))
            return;

        // Transformation matrix
        BABYLON.Matrix.ScalingToRef(1.0 / collider.radius.x, 1.0 / collider.radius.y, 1.0 / collider.radius.z, this._collisionsScalingMatrix);
        this._worldMatrix.multiplyToRef(this._collisionsScalingMatrix, this._collisionsTransformMatrix);

        this._processCollisionsForSubModels(collider, this._collisionsTransformMatrix);
    };

    BABYLON.Mesh.prototype.intersectsMesh = function (mesh, precise) {
        if (!this._boundingInfo || !mesh._boundingInfo) {
            return false;
        }

        return this._boundingInfo.intersects(mesh._boundingInfo, precise);
    };

    BABYLON.Mesh.prototype.intersectsPoint = function (point) {
        if (!this._boundingInfo) {
            return false;
        }

        return this._boundingInfo.intersectsPoint(point);
    };

    // Picking
    BABYLON.Mesh.prototype.intersects = function (ray, fastCheck) {
        var pickingInfo = new BABYLON.PickingInfo();

        if (!this._boundingInfo || !ray.intersectsSphere(this._boundingInfo.boundingSphere) || !ray.intersectsBox(this._boundingInfo.boundingBox)) {
            return pickingInfo;
        }

        this._generatePointsArray();

        var distance = Number.MAX_VALUE;

        for (var index = 0; index < this.subMeshes.length; index++) {
            var subMesh = this.subMeshes[index];

            // Bounding test
            if (this.subMeshes.length > 1 && !subMesh.canIntersects(ray))
                continue;

            var currentDistance = subMesh.intersects(ray, this._positions, this._indices, fastCheck);

            if (currentDistance > 0) {
                if (fastCheck || currentDistance < distance) {
                    distance = currentDistance;

                    if (fastCheck) {
                        break;
                    }
                }
            }
        }

        if (distance >= 0 && distance < Number.MAX_VALUE) {
            // Get picked point
            var world = this.getWorldMatrix();
            var worldOrigin = BABYLON.Vector3.TransformCoordinates(ray.origin, world);
            var direction = ray.direction.clone();
            direction.normalize();
            direction = direction.scale(distance);
            var worldDirection = BABYLON.Vector3.TransformNormal(direction, world);

            var pickedPoint = worldOrigin.add(worldDirection);

            // Return result
            pickingInfo.hit = true;
            pickingInfo.distance = BABYLON.Vector3.Distance(worldOrigin, pickedPoint);
            pickingInfo.pickedPoint = pickedPoint;
            pickingInfo.pickedMesh = this;
            return pickingInfo;
        }

        return pickingInfo;
    };

    // Clone
    BABYLON.Mesh.prototype.clone = function (name, newParent, doNotCloneChildren) {
        var result = new BABYLON.Mesh(name, this._scene);

        // Buffers
        result._vertexBuffers = this._vertexBuffers;
        for (var kind in result._vertexBuffers) {
            result._vertexBuffers[kind].references++;
        }

        result._indexBuffer = this._indexBuffer;
        this._indexBuffer.references++;

        // Deep copy
        BABYLON.Tools.DeepCopy(this, result, ["name", "material", "skeleton"], ["_indices", "_totalVertices"]);

        // Bounding info
        var extend = BABYLON.Tools.ExtractMinAndMax(this.getVerticesData(BABYLON.VertexBuffer.PositionKind), 0, this._totalVertices);
        result._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);

        // Material
        result.material = this.material;

        // Parent
        if (newParent) {
            result.parent = newParent;
        }

        if (!doNotCloneChildren) {
            // Children
            for (var index = 0; index < this._scene.meshes.length; index++) {
                var mesh = this._scene.meshes[index];

                if (mesh.parent == this) {
                    mesh.clone(mesh.name, result);
                }
            }
        }

        // Particles
        for (var index = 0; index < this._scene.particleSystems.length; index++) {
            var system = this._scene.particleSystems[index];

            if (system.emitter == this) {
                system.clone(system.name, result);
            }
        }

        result.computeWorldMatrix(true);

        return result;
    };

    // Dispose
    BABYLON.Mesh.prototype.dispose = function (doNotRecurse) {
        if (this._vertexBuffers) {
            for (var index = 0; index < this._vertexBuffers.length; index++) {
                this._vertexBuffers[index].dispose();
            }
            this._vertexBuffers = null;
        }

        if (this._indexBuffer) {
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        // Remove from scene
        var index = this._scene.meshes.indexOf(this);
        this._scene.meshes.splice(index, 1);

        if (!doNotRecurse) {
            // Particles
            for (var index = 0; index < this._scene.particleSystems.length; index++) {
                if (this._scene.particleSystems[index].emitter == this) {
                    this._scene.particleSystems[index].dispose();
                    index--;
                }
            }

            // Children
            var objects = this._scene.meshes.slice(0);
            for (var index = 0; index < objects.length; index++) {
                if (objects[index].parent == this) {
                    objects[index].dispose();
                }
            }
        } else {
            for (var index = 0; index < this._scene.meshes.length; index++) {
                var obj = this._scene.meshes[index];
                if (obj.parent === this) {
                    obj.parent = null;
                    obj.computeWorldMatrix(true);
                }
            }
        }

        this._isDisposed = true;

        // Callback
        if (this.onDispose) {
            this.onDispose();
        }
    };

    // Physics
    BABYLON.Mesh.prototype.setPhysicsState = function (options) {
        if (!this._scene._physicsEngine) {
            return;
        }

        options.impostor = options.impostor || BABYLON.PhysicsEngine.NoImpostor;
        options.mass = options.mass || 0;
        options.friction = options.friction || 0.2;
        options.restitution = options.restitution || 0.9;

        this._physicImpostor = options.impostor;
        this._physicsMass = options.mass;
        this._physicsFriction = options.friction;
        this._physicRestitution = options.restitution;

        if (options.impostor === BABYLON.PhysicsEngine.NoImpostor) {
            this._scene._physicsEngine._unregisterMesh(this);
            return;
        }

        this._scene._physicsEngine._registerMesh(this, options);
    };

    BABYLON.Mesh.prototype.getPhysicsImpostor = function () {
        if (!this._physicImpostor) {
            return BABYLON.PhysicsEngine.NoImpostor;
        }

        return this._physicImpostor;
    };

    BABYLON.Mesh.prototype.getPhysicsMass = function () {
        if (!this._physicsMass) {
            return 0;
        }

        return this._physicsMass;
    };

    BABYLON.Mesh.prototype.getPhysicsFriction = function () {
        if (!this._physicsFriction) {
            return 0;
        }

        return this._physicsFriction;
    };

    BABYLON.Mesh.prototype.getPhysicsRestitution = function () {
        if (!this._physicRestitution) {
            return 0;
        }

        return this._physicRestitution;
    };

    BABYLON.Mesh.prototype.applyImpulse = function (force, contactPoint) {
        if (!this._physicImpostor) {
            return;
        }

        this._scene._physicsEngine._applyImpulse(this, force, contactPoint);
    };

    BABYLON.Mesh.prototype.setPhysicsLinkWith = function (otherMesh, pivot1, pivot2) {
        if (!this._physicImpostor) {
            return;
        }

        this._scene._physicsEngine._createLink(this, otherMesh, pivot1, pivot2);
    };

    // Statics
    BABYLON.Mesh.CreateBox = function (name, size, scene, updatable) {
        var box = new BABYLON.Mesh(name, scene);

        var normalsSource = [
            new BABYLON.Vector3(0, 0, 1),
            new BABYLON.Vector3(0, 0, -1),
            new BABYLON.Vector3(1, 0, 0),
            new BABYLON.Vector3(-1, 0, 0),
            new BABYLON.Vector3(0, 1, 0),
            new BABYLON.Vector3(0, -1, 0)
        ];

        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];

        // Create each face in turn.
        for (var index = 0; index < normalsSource.length; index++) {
            var normal = normalsSource[index];

            // Get two vectors perpendicular to the face normal and to each other.
            var side1 = new BABYLON.Vector3(normal.y, normal.z, normal.x);
            var side2 = BABYLON.Vector3.Cross(normal, side1);

            // Six indices (two triangles) per face.
            var verticesLength = positions.length / 3;
            indices.push(verticesLength);
            indices.push(verticesLength + 1);
            indices.push(verticesLength + 2);

            indices.push(verticesLength);
            indices.push(verticesLength + 2);
            indices.push(verticesLength + 3);

            // Four vertices per face.
            var vertex = normal.subtract(side1).subtract(side2).scale(size / 2);
            positions.push(vertex.x, vertex.y, vertex.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(1.0, 1.0);

            vertex = normal.subtract(side1).add(side2).scale(size / 2);
            positions.push(vertex.x, vertex.y, vertex.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(0.0, 1.0);

            vertex = normal.add(side1).add(side2).scale(size / 2);
            positions.push(vertex.x, vertex.y, vertex.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(0.0, 0.0);

            vertex = normal.add(side1).subtract(side2).scale(size / 2);
            positions.push(vertex.x, vertex.y, vertex.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(1.0, 0.0);
        }

        box.setVerticesData(positions, BABYLON.VertexBuffer.PositionKind, updatable);
        box.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatable);
        box.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind, updatable);
        box.setIndices(indices);

        return box;
    };

    BABYLON.Mesh.CreateSphere = function (name, segments, diameter, scene, updatable) {
        var sphere = new BABYLON.Mesh(name, scene);

        var radius = diameter / 2;

        var totalZRotationSteps = 2 + segments;
        var totalYRotationSteps = 2 * totalZRotationSteps;

        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];

        for (var zRotationStep = 0; zRotationStep <= totalZRotationSteps; zRotationStep++) {
            var normalizedZ = zRotationStep / totalZRotationSteps;
            var angleZ = (normalizedZ * Math.PI);

            for (var yRotationStep = 0; yRotationStep <= totalYRotationSteps; yRotationStep++) {
                var normalizedY = yRotationStep / totalYRotationSteps;

                var angleY = normalizedY * Math.PI * 2;

                var rotationZ = BABYLON.Matrix.RotationZ(-angleZ);
                var rotationY = BABYLON.Matrix.RotationY(angleY);
                var afterRotZ = BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.Up(), rotationZ);
                var complete = BABYLON.Vector3.TransformCoordinates(afterRotZ, rotationY);

                var vertex = complete.scale(radius);
                var normal = BABYLON.Vector3.Normalize(vertex);

                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(normalizedZ, normalizedY);
            }

            if (zRotationStep > 0) {
                var verticesCount = positions.length / 3;
                for (var firstIndex = verticesCount - 2 * (totalYRotationSteps + 1) ; (firstIndex + totalYRotationSteps + 2) < verticesCount; firstIndex++) {
                    indices.push((firstIndex));
                    indices.push((firstIndex + 1));
                    indices.push(firstIndex + totalYRotationSteps + 1);

                    indices.push((firstIndex + totalYRotationSteps + 1));
                    indices.push((firstIndex + 1));
                    indices.push((firstIndex + totalYRotationSteps + 2));
                }
            }
        }

        sphere.setVerticesData(positions, BABYLON.VertexBuffer.PositionKind, updatable);
        sphere.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatable);
        sphere.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind, updatable);
        sphere.setIndices(indices);

        return sphere;
    };

    // Cylinder and cone (Code inspired by SharpDX.org)
    BABYLON.Mesh.CreateCylinder = function (name, height, diameterTop, diameterBottom, tessellation, scene, updatable) {
        var radiusTop = diameterTop / 2;
        var radiusBottom = diameterBottom / 2;
        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];
        var cylinder = new BABYLON.Mesh(name, scene);

        var getCircleVector = function (i) {
            var angle = (i * 2.0 * Math.PI / tessellation);
            var dx = Math.sin(angle);
            var dz = Math.cos(angle);

            return new BABYLON.Vector3(dx, 0, dz);
        };

        var createCylinderCap = function (isTop) {
            var radius = isTop ? radiusTop : radiusBottom;

            if (radius == 0) {
                return
            }

            // Create cap indices.
            for (var i = 0; i < tessellation - 2; i++) {
                var i1 = (i + 1) % tessellation;
                var i2 = (i + 2) % tessellation;

                if (!isTop) {
                    var tmp = i1;
                    var i1 = i2;
                    i2 = tmp;
                }

                var vbase = positions.length / 3;
                indices.push(vbase);
                indices.push(vbase + i1);
                indices.push(vbase + i2);
            }


            // Which end of the cylinder is this?
            var normal = new BABYLON.Vector3(0, -1, 0);
            var textureScale = new BABYLON.Vector2(-0.5, -0.5);

            if (!isTop) {
                normal = normal.scale(-1);
                textureScale.x = -textureScale.x;
            }

            // Create cap vertices.
            for (var i = 0; i < tessellation; i++) {
                var circleVector = getCircleVector(i);
                var position = circleVector.scale(radius).add(normal.scale(height));
                var textureCoordinate = new BABYLON.Vector2(circleVector.x * textureScale.x + 0.5, circleVector.z * textureScale.y + 0.5);

                positions.push(position.x, position.y, position.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(textureCoordinate.x, textureCoordinate.y);
            }
        };

        height /= 2;

        var topOffset = new BABYLON.Vector3(0, 1, 0).scale(height);

        var stride = tessellation + 1;

        // Create a ring of triangles around the outside of the cylinder.
        for (var i = 0; i <= tessellation; i++) {
            var normal = getCircleVector(i);
            var sideOffsetBottom = normal.scale(radiusBottom);
            var sideOffsetTop = normal.scale(radiusTop);
            var textureCoordinate = new BABYLON.Vector2(i / tessellation, 0);

            var position = sideOffsetBottom.add(topOffset);
            positions.push(position.x, position.y, position.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(textureCoordinate.x, textureCoordinate.y);

            position = sideOffsetTop.subtract(topOffset);
            textureCoordinate.y += 1;
            positions.push(position.x, position.y, position.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(textureCoordinate.x, textureCoordinate.y);

            indices.push(i * 2);
            indices.push((i * 2 + 2) % (stride * 2));
            indices.push(i * 2 + 1);

            indices.push(i * 2 + 1);
            indices.push((i * 2 + 2) % (stride * 2));
            indices.push((i * 2 + 3) % (stride * 2));
        }

        // Create flat triangle fan caps to seal the top and bottom.
        createCylinderCap(true);
        createCylinderCap(false);

        cylinder.setVerticesData(positions, BABYLON.VertexBuffer.PositionKind, updatable);
        cylinder.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatable);
        cylinder.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind, updatable);
        cylinder.setIndices(indices);

        return cylinder;
    };

    // Torus  (Code from SharpDX.org)
    BABYLON.Mesh.CreateTorus = function (name, diameter, thickness, tessellation, scene, updatable) {
        var torus = new BABYLON.Mesh(name, scene);

        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];

        var stride = tessellation + 1;

        for (var i = 0; i <= tessellation; i++) {
            var u = i / tessellation;

            var outerAngle = i * Math.PI * 2.0 / tessellation - Math.PI / 2.0;

            var transform = BABYLON.Matrix.Translation(diameter / 2.0, 0, 0).multiply(BABYLON.Matrix.RotationY(outerAngle));

            for (var j = 0; j <= tessellation; j++) {
                var v = 1 - j / tessellation;

                var innerAngle = j * Math.PI * 2.0 / tessellation + Math.PI;
                var dx = Math.cos(innerAngle);
                var dy = Math.sin(innerAngle);

                // Create a vertex.
                var normal = new BABYLON.Vector3(dx, dy, 0);
                var position = normal.scale(thickness / 2);
                var textureCoordinate = new BABYLON.Vector2(u, v);

                position = BABYLON.Vector3.TransformCoordinates(position, transform);
                normal = BABYLON.Vector3.TransformNormal(normal, transform);

                positions.push(position.x, position.y, position.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(textureCoordinate.x, textureCoordinate.y);

                // And create indices for two triangles.
                var nextI = (i + 1) % stride;
                var nextJ = (j + 1) % stride;

                indices.push(i * stride + j);
                indices.push(i * stride + nextJ);
                indices.push(nextI * stride + j);

                indices.push(i * stride + nextJ);
                indices.push(nextI * stride + nextJ);
                indices.push(nextI * stride + j);
            }
        }

        torus.setVerticesData(positions, BABYLON.VertexBuffer.PositionKind, updatable);
        torus.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatable);
        torus.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind, updatable);
        torus.setIndices(indices);

        return torus;
    };

    // Plane
    BABYLON.Mesh.CreatePlane = function (name, size, scene, updatable) {
        var plane = new BABYLON.Mesh(name, scene);

        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];

        // Vertices
        var halfSize = size / 2.0;
        positions.push(-halfSize, -halfSize, 0);
        normals.push(0, 0, -1.0);
        uvs.push(0.0, 0.0);

        positions.push(halfSize, -halfSize, 0);
        normals.push(0, 0, -1.0);
        uvs.push(1.0, 0.0);

        positions.push(halfSize, halfSize, 0);
        normals.push(0, 0, -1.0);
        uvs.push(1.0, 1.0);

        positions.push(-halfSize, halfSize, 0);
        normals.push(0, 0, -1.0);
        uvs.push(0.0, 1.0);

        // Indices
        indices.push(0);
        indices.push(1);
        indices.push(2);

        indices.push(0);
        indices.push(2);
        indices.push(3);

        plane.setVerticesData(positions, BABYLON.VertexBuffer.PositionKind, updatable);
        plane.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatable);
        plane.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind, updatable);
        plane.setIndices(indices);

        return plane;
    };

    BABYLON.Mesh.CreateGround = function (name, width, height, subdivisions, scene, updatable) {
        var ground = new BABYLON.Mesh(name, scene);

        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];
        var row, col;

        for (row = 0; row <= subdivisions; row++) {
            for (col = 0; col <= subdivisions; col++) {
                var position = new BABYLON.Vector3((col * width) / subdivisions - (width / 2.0), 0, ((subdivisions - row) * height) / subdivisions - (height / 2.0));
                var normal = new BABYLON.Vector3(0, 1.0, 0);

                positions.push(position.x, position.y, position.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(col / subdivisions, 1.0 - row / subdivisions);
            }
        }

        for (row = 0; row < subdivisions; row++) {
            for (col = 0; col < subdivisions; col++) {
                indices.push(col + 1 + (row + 1) * (subdivisions + 1));
                indices.push(col + 1 + row * (subdivisions + 1));
                indices.push(col + row * (subdivisions + 1));

                indices.push(col + (row + 1) * (subdivisions + 1));
                indices.push(col + 1 + (row + 1) * (subdivisions + 1));
                indices.push(col + row * (subdivisions + 1));
            }
        }

        ground.setVerticesData(positions, BABYLON.VertexBuffer.PositionKind, updatable);
        ground.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatable);
        ground.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind, updatable);
        ground.setIndices(indices);

        return ground;
    };

    BABYLON.Mesh.CreateGroundFromHeightMap = function (name, url, width, height, subdivisions, minHeight, maxHeight, scene, updatable) {
        var ground = new BABYLON.Mesh(name, scene);

        var onload = function (img) {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var row, col;

            // Getting height map data
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            var heightMapWidth = img.width;
            var heightMapHeight = img.height;
            canvas.width = heightMapWidth;
            canvas.height = heightMapHeight;

            context.drawImage(img, 0, 0);

            var buffer = context.getImageData(0, 0, heightMapWidth, heightMapHeight).data;

            // Vertices
            for (row = 0; row <= subdivisions; row++) {
                for (col = 0; col <= subdivisions; col++) {
                    var position = new BABYLON.Vector3((col * width) / subdivisions - (width / 2.0), 0, ((subdivisions - row) * height) / subdivisions - (height / 2.0));

                    // Compute height
                    var heightMapX = (((position.x + width / 2) / width) * (heightMapWidth - 1)) | 0;
                    var heightMapY = ((1.0 - (position.z + height / 2) / height) * (heightMapHeight - 1)) | 0;

                    var pos = (heightMapX + heightMapY * heightMapWidth) * 4;
                    var r = buffer[pos] / 255.0;
                    var g = buffer[pos + 1] / 255.0;
                    var b = buffer[pos + 2] / 255.0;

                    var gradient = r * 0.3 + g * 0.59 + b * 0.11;

                    position.y = minHeight + (maxHeight - minHeight) * gradient;

                    // Add  vertex
                    positions.push(position.x, position.y, position.z);
                    normals.push(0, 0, 0);
                    uvs.push(col / subdivisions, 1.0 - row / subdivisions);
                }
            }

            // Indices
            for (row = 0; row < subdivisions; row++) {
                for (col = 0; col < subdivisions; col++) {
                    indices.push(col + 1 + (row + 1) * (subdivisions + 1));
                    indices.push(col + 1 + row * (subdivisions + 1));
                    indices.push(col + row * (subdivisions + 1));

                    indices.push(col + (row + 1) * (subdivisions + 1));
                    indices.push(col + 1 + (row + 1) * (subdivisions + 1));
                    indices.push(col + row * (subdivisions + 1));
                }
            }

            // Normals
            BABYLON.Mesh.ComputeNormal(positions, normals, indices);

            // Transfer
            ground.setVerticesData(positions, BABYLON.VertexBuffer.PositionKind, updatable);
            ground.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatable);
            ground.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind, updatable);
            ground.setIndices(indices);

            ground._isReady = true;
        };

        BABYLON.Tools.LoadImage(url, onload, scene.database);

        ground._isReady = false;

        return ground;
    };

    // Tools
    BABYLON.Mesh.ComputeNormal = function (positions, normals, indices) {
        var positionVectors = [];
        var facesOfVertices = [];
        var index;

        for (index = 0; index < positions.length; index += 3) {
            var vector3 = new BABYLON.Vector3(positions[index], positions[index + 1], positions[index + 2]);
            positionVectors.push(vector3);
            facesOfVertices.push([]);
        }
        // Compute normals
        var facesNormals = [];
        for (index = 0; index < indices.length / 3; index++) {
            var i1 = indices[index * 3];
            var i2 = indices[index * 3 + 1];
            var i3 = indices[index * 3 + 2];

            var p1 = positionVectors[i1];
            var p2 = positionVectors[i2];
            var p3 = positionVectors[i3];

            var p1p2 = p1.subtract(p2);
            var p3p2 = p3.subtract(p2);

            facesNormals[index] = BABYLON.Vector3.Normalize(BABYLON.Vector3.Cross(p1p2, p3p2));
            facesOfVertices[i1].push(index);
            facesOfVertices[i2].push(index);
            facesOfVertices[i3].push(index);
        }

        for (index = 0; index < positionVectors.length; index++) {
            var faces = facesOfVertices[index];

            var normal = BABYLON.Vector3.Zero();
            for (var faceIndex = 0; faceIndex < faces.length; faceIndex++) {
                normal.addInPlace(facesNormals[faces[faceIndex]]);
            }

            normal = BABYLON.Vector3.Normalize(normal.scale(1.0 / faces.length));

            normals[index * 3] = normal.x;
            normals[index * 3 + 1] = normal.y;
            normals[index * 3 + 2] = normal.z;
        }
    };
=======
﻿"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.Mesh = function (name, scene) {
        BABYLON.Node.call(this);
        
        this.name = name;
        this.id = name;
        this._scene = scene;

        this._totalVertices = 0;
        this._worldMatrix = BABYLON.Matrix.Identity();

        scene.meshes.push(this);

        this.position = new BABYLON.Vector3(0, 0, 0);
        this.rotation = new BABYLON.Vector3(0, 0, 0);
        this.rotationQuaternion = null;
        this.scaling = new BABYLON.Vector3(1, 1, 1);

        this._pivotMatrix = BABYLON.Matrix.Identity();

        this._indices = [];
        this.subMeshes = [];

        this._renderId = 0;

        this._onBeforeRenderCallbacks = [];
        
        // Animations
        this.animations = [];

        this._positions = null;
        
        // Cache
        BABYLON.Mesh.prototype._initCache.call(this);

        this._childrenFlag = false;
        this._localScaling = BABYLON.Matrix.Zero();
        this._localRotation = BABYLON.Matrix.Zero();
        this._localTranslation = BABYLON.Matrix.Zero();
        this._localBillboard = BABYLON.Matrix.Zero();
        this._localPivotScaling = BABYLON.Matrix.Zero();
        this._localPivotScalingRotation = BABYLON.Matrix.Zero();
        this._localWorld = BABYLON.Matrix.Zero();
        this._worldMatrix = BABYLON.Matrix.Zero();
        this._rotateYByPI = BABYLON.Matrix.RotationY(Math.PI);

        this._collisionsTransformMatrix = BABYLON.Matrix.Zero();
        this._collisionsScalingMatrix = BABYLON.Matrix.Zero();

        this._absolutePosition = BABYLON.Vector3.Zero();
    };
    
    BABYLON.Mesh.prototype = Object.create(BABYLON.Node.prototype);

    // Constants
    BABYLON.Mesh.BILLBOARDMODE_NONE = 0;
    BABYLON.Mesh.BILLBOARDMODE_X = 1;
    BABYLON.Mesh.BILLBOARDMODE_Y = 2;
    BABYLON.Mesh.BILLBOARDMODE_Z = 4;
    BABYLON.Mesh.BILLBOARDMODE_ALL = 7;

    // Members    
    BABYLON.Mesh.prototype.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NONE;
    BABYLON.Mesh.prototype.material = null;
    BABYLON.Mesh.prototype.isVisible = true;
    BABYLON.Mesh.prototype.isPickable = true;
    BABYLON.Mesh.prototype.visibility = 1.0;
    BABYLON.Mesh.prototype.billboardMode = BABYLON.Mesh.BILLBOARDMODE_NONE;
    BABYLON.Mesh.prototype.checkCollisions = false;
    BABYLON.Mesh.prototype.receiveShadows = false;

    BABYLON.Mesh.prototype._isDisposed = false;
    BABYLON.Mesh.prototype.onDispose = null;

    BABYLON.Mesh.prototype.skeleton = null;
    
    BABYLON.Mesh.prototype.renderingGroupId = 0;
    
    BABYLON.Mesh.prototype.infiniteDistance = false;

    // Properties

    BABYLON.Mesh.prototype.getBoundingInfo = function () {
        return this._boundingInfo;
    };

    BABYLON.Mesh.prototype.getScene = function () {
        return this._scene;
    };

    BABYLON.Mesh.prototype.getWorldMatrix = function () {
        if (this._currentRenderId !== this._scene.getRenderId()) {
            this.computeWorldMatrix();
        }
        return this._worldMatrix;
    };
    
    BABYLON.Mesh.prototype.getAbsolutePosition = function () {
        return this._absolutePosition;
    };
        
    BABYLON.Mesh.prototype.getTotalVertices = function () {
        return this._totalVertices;
    };

    BABYLON.Mesh.prototype.getVerticesData = function (kind) {
        return this._vertexBuffers[kind].getData();
    };

    BABYLON.Mesh.prototype.isVerticesDataPresent = function (kind) {
        if (!this._vertexBuffers && this._delayInfo) {            
            return this._delayInfo.indexOf(kind) !== -1;
        }

        return this._vertexBuffers[kind] !== undefined;
    };

    BABYLON.Mesh.prototype.getTotalIndices = function () {
        return this._indices.length;
    };

    BABYLON.Mesh.prototype.getIndices = function () {
        return this._indices;
    };

    BABYLON.Mesh.prototype.getVertexStrideSize = function () {
        return this._vertexStrideSize;
    };

    BABYLON.Mesh.prototype.setPivotMatrix = function (matrix) {
        this._pivotMatrix = matrix;
        this._cache.pivotMatrixUpdated = true;
    };

    BABYLON.Mesh.prototype.getPivotMatrix = function () {
        return this._pivotMatrix;
    };

    BABYLON.Mesh.prototype._isSynchronized = function () {
        if (this.billboardMode !== BABYLON.Mesh.BILLBOARDMODE_NONE)
            return false;

        if (this._cache.pivotMatrixUpdated) {
            return false;
        }
        
        if (this.infiniteDistance) {
            return false;
        }

        if (!this._cache.position.equals(this.position))
            return false;

        if (this.rotationQuaternion) {
            if (!this._cache.rotationQuaternion.equals(this.rotationQuaternion))
                return false;
        } else {
            if (!this._cache.rotation.equals(this.rotation))
                return false;
        }

        if (!this._cache.scaling.equals(this.scaling))
            return false;

        return true;
    };

    BABYLON.Mesh.prototype.isReady = function () {
        return this._isReady;
    };

    BABYLON.Mesh.prototype.isAnimated = function () {
        return this._animationStarted;
    };

    BABYLON.Mesh.prototype.isDisposed = function () {
        return this._isDisposed;
    };
    
    // Methods
    BABYLON.Mesh.prototype.markAsDirty = function (property) {
        if (property === "rotation") {
            this.rotationQuaternion = null;
        }
        this._childrenFlag = true;
    };
    
    BABYLON.Mesh.prototype.refreshBoundingInfo = function () {
        var data = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);

        if (!data) {
            return;
        }

        var extend = BABYLON.Tools.ExtractMinAndMax(data, 0, this._totalVertices);
        this._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);

        for (var index = 0; index < this.subMeshes.length; index++) {
            this.subMeshes[index].refreshBoundingInfo();
        }
        
        this._updateBoundingInfo();
    };

    BABYLON.Mesh.prototype._updateBoundingInfo = function() {
        if (this._boundingInfo) {
            this._scaleFactor = Math.max(this.scaling.x, this.scaling.y);
            this._scaleFactor = Math.max(this._scaleFactor, this.scaling.z);

            if (this.parent && this.parent._scaleFactor)
                this._scaleFactor = this._scaleFactor * this.parent._scaleFactor;

            this._boundingInfo._update(this._worldMatrix, this._scaleFactor);

            for (var subIndex = 0; subIndex < this.subMeshes.length; subIndex++) {
                var subMesh = this.subMeshes[subIndex];

                subMesh.updateBoundingInfo(this._worldMatrix, this._scaleFactor);
            }
        }
    };

    BABYLON.Mesh.prototype.computeWorldMatrix = function (force) {
        if (!force && (this._currentRenderId == this._scene.getRenderId() || this.isSynchronized(true))) {
            this._childrenFlag = false;
            return this._worldMatrix;
        }

        this._childrenFlag = true;
        this._cache.position.copyFrom(this.position);
        this._cache.scaling.copyFrom(this.scaling);
        this._cache.pivotMatrixUpdated = false;
        this._currentRenderId = this._scene.getRenderId();

        // Scaling
        BABYLON.Matrix.ScalingToRef(this.scaling.x, this.scaling.y, this.scaling.z, this._localScaling);

        // Rotation
        if (this.rotationQuaternion) {
            this.rotationQuaternion.toRotationMatrix(this._localRotation);
            this._cache.rotationQuaternion.copyFrom(this.rotationQuaternion);
        } else {
            BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._localRotation);
            this._cache.rotation.copyFrom(this.rotation);
        }

        // Translation
        if (this.infiniteDistance) {
            var camera = this._scene.activeCamera;
            BABYLON.Matrix.TranslationToRef(this.position.x + camera.position.x, this.position.y + camera.position.y, this.position.z + camera.position.z, this._localTranslation);
        } else {
            BABYLON.Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._localTranslation);
        }

        // Composing transformations
        this._pivotMatrix.multiplyToRef(this._localScaling, this._localPivotScaling);
        this._localPivotScaling.multiplyToRef(this._localRotation, this._localPivotScalingRotation);

        // Billboarding
        if (this.billboardMode !== BABYLON.Mesh.BILLBOARDMODE_NONE) {
            var localPosition = this.position.clone();
            var zero = this._scene.activeCamera.position.clone();

            if (this.parent && this.parent.position) {
                localPosition.addInPlace(this.parent.position);
                BABYLON.Matrix.TranslationToRef(localPosition.x, localPosition.y, localPosition.z, this._localTranslation);
            }

            if (this.billboardMode & BABYLON.Mesh.BILLBOARDMODE_ALL === BABYLON.Mesh.BILLBOARDMODE_ALL) {
                zero = this._scene.activeCamera.position;
            } else {
                if (this.billboardMode & BABYLON.Mesh.BILLBOARDMODE_X)
                    zero.x = localPosition.x + BABYLON.Engine.epsilon;
                if (this.billboardMode & BABYLON.Mesh.BILLBOARDMODE_Y)
                    zero.y = localPosition.y + BABYLON.Engine.epsilon;
                if (this.billboardMode & BABYLON.Mesh.BILLBOARDMODE_Z)
                    zero.z = localPosition.z + BABYLON.Engine.epsilon;
            }

            BABYLON.Matrix.LookAtLHToRef(localPosition, zero, BABYLON.Vector3.Up(), this._localBillboard);
            this._localBillboard.m[12] = this._localBillboard.m[13] = this._localBillboard.m[14] = 0;

            this._localBillboard.invert();

            this._localPivotScalingRotation.multiplyToRef(this._localBillboard, this._localWorld);
            this._rotateYByPI.multiplyToRef(this._localWorld, this._localPivotScalingRotation);
        }
        
        // Local world
        this._localPivotScalingRotation.multiplyToRef(this._localTranslation, this._localWorld);

        // Parent
        if (this.parent && this.parent.getWorldMatrix && this.billboardMode === BABYLON.Mesh.BILLBOARDMODE_NONE) {
            this._localWorld.multiplyToRef(this.parent.getWorldMatrix(), this._worldMatrix);
        } else {
            // multiplyToRef instead of this._worldMatrix = this._localWorld;
            // to be sure not to have a bug with a call to this._localWorld.multiplyToRef(this.parent.getWorldMatrix(), this._worldMatrix);
            // Moreover multiplyToRef is more efficient than clone
            this._localPivotScalingRotation.multiplyToRef(this._localTranslation, this._worldMatrix);
        }

        // Bounding info
        this._updateBoundingInfo();

        // Absolute position
        this._absolutePosition.copyFromFloats(this._worldMatrix.m[12], this._worldMatrix.m[13], this._worldMatrix.m[14]);

        return this._worldMatrix;
    };

    BABYLON.Mesh.prototype._createGlobalSubMesh = function () {
        if (!this._totalVertices || !this._indices) {
            return null;
        }

        this.subMeshes = [];
        return new BABYLON.SubMesh(0, 0, this._totalVertices, 0, this._indices.length, this);
    };


    BABYLON.Mesh.prototype.subdivide = function (count) {
        if (count < 1) {
            return;
        }

        var subdivisionSize = this._indices.length / count;
        var offset = 0;

        this.subMeshes = [];
        for (var index = 0; index < count; index++) {
            BABYLON.SubMesh.CreateFromIndices(0, offset, Math.min(subdivisionSize, this._indices.length - offset), this);

            offset += subdivisionSize;
        }
    };

    BABYLON.Mesh.prototype.setVerticesData = function (data, kind, updatable) {
        if (!this._vertexBuffers) {
            this._vertexBuffers = {};
        }

        if (this._vertexBuffers[kind]) {
            this._vertexBuffers[kind].dispose();
        }

        this._vertexBuffers[kind] = new BABYLON.VertexBuffer(this, data, kind, updatable);

        if (kind === BABYLON.VertexBuffer.PositionKind) {
            var stride = this._vertexBuffers[kind].getStrideSize();
            this._totalVertices = data.length / stride;

            var extend = BABYLON.Tools.ExtractMinAndMax(data, 0, this._totalVertices);
            this._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);

            this._createGlobalSubMesh();
        }
    };

    BABYLON.Mesh.prototype.updateVerticesData = function (kind, data) {
        if (this._vertexBuffers[kind]) {
            this._vertexBuffers[kind].update(data);
        }
    };

    BABYLON.Mesh.prototype.setIndices = function (indices) {
        if (this._indexBuffer) {
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
        }

        this._indexBuffer = this._scene.getEngine().createIndexBuffer(indices);
        this._indices = indices;

        this._createGlobalSubMesh();
    };

    BABYLON.Mesh.prototype.bindAndDraw = function (subMesh, effect, wireframe) {
        var engine = this._scene.getEngine();

        // Wireframe
        var indexToBind = this._indexBuffer;
        var useTriangles = true;

        if (wireframe) {
            indexToBind = subMesh.getLinesIndexBuffer(this._indices, engine);
            useTriangles = false;
        }

        // VBOs
        engine.bindMultiBuffers(this._vertexBuffers, indexToBind, effect);

        // Draw order
        engine.draw(useTriangles, useTriangles ? subMesh.indexStart : 0, useTriangles ? subMesh.indexCount : subMesh.linesIndexCount);
    };
    
    BABYLON.Mesh.prototype.registerBeforeRender = function (func) {
        this._onBeforeRenderCallbacks.push(func);
    };

    BABYLON.Mesh.prototype.unregisterBeforeRender = function (func) {
        var index = this._onBeforeRenderCallbacks.indexOf(func);

        if (index > -1) {
            this._onBeforeRenderCallbacks.splice(index, 1);
        }
    };

    BABYLON.Mesh.prototype.render = function (subMesh) {
        if (!this._vertexBuffers || !this._indexBuffer) {
            return;
        }
        
        for (var callbackIndex = 0; callbackIndex < this._onBeforeRenderCallbacks.length; callbackIndex++) {
            this._onBeforeRenderCallbacks[callbackIndex]();
        }
        
        // World
        var world = this.getWorldMatrix();

        // Material
        var effectiveMaterial = subMesh.getMaterial();

        if (!effectiveMaterial || !effectiveMaterial.isReady(this)) {
            return;
        }

        effectiveMaterial._preBind();
        effectiveMaterial.bind(world, this);

        // Bind and draw
        var engine = this._scene.getEngine();
        this.bindAndDraw(subMesh, effectiveMaterial.getEffect(), engine.forceWireframe || effectiveMaterial.wireframe);

        // Unbind
        effectiveMaterial.unbind();
    };

    BABYLON.Mesh.prototype.getEmittedParticleSystems = function () {
        var results = [];
        for (var index = 0; index < this._scene.particleSystems.length; index++) {
            var particleSystem = this._scene.particleSystems[index];
            if (particleSystem.emitter === this) {
                results.push(particleSystem);
            }
        }

        return results;
    };

    BABYLON.Mesh.prototype.getHierarchyEmittedParticleSystems = function () {
        var results = [];
        var descendants = this.getDescendants();
        descendants.push(this);

        for (var index = 0; index < this._scene.particleSystems.length; index++) {
            var particleSystem = this._scene.particleSystems[index];
            if (descendants.indexOf(particleSystem.emitter) !== -1) {
                results.push(particleSystem);
            }
        }

        return results;
    };

    BABYLON.Mesh.prototype.getChildren = function () {
        var results = [];
        for (var index = 0; index < this._scene.meshes.length; index++) {
            var mesh = this._scene.meshes[index];
            if (mesh.parent == this) {
                results.push(mesh);
            }
        }

        return results;
    };

    BABYLON.Mesh.prototype.isInFrustrum = function (frustumPlanes) {
        if (this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADING) {
            return false;
        }

        var result = this._boundingInfo.isInFrustrum(frustumPlanes);
        
        if (result && this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADING;
            var that = this;

            this._scene._addPendingData(this);

            BABYLON.Tools.LoadFile(this.delayLoadingFile, function (data) {
                BABYLON.SceneLoader._ImportGeometry(JSON.parse(data), that);
                that.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
                that._scene._removePendingData(that);
            }, function () { }, this._scene.database);
        }

        return result;
    };

    BABYLON.Mesh.prototype.setMaterialByID = function (id) {
        var materials = this._scene.materials;
        for (var index = 0; index < materials.length; index++) {
            if (materials[index].id == id) {
                this.material = materials[index];
                return;
            }
        }

        // Multi
        var multiMaterials = this._scene.multiMaterials;
        for (var index = 0; index < multiMaterials.length; index++) {
            if (multiMaterials[index].id == id) {
                this.material = multiMaterials[index];
                return;
            }
        }
    };

    BABYLON.Mesh.prototype.getAnimatables = function () {
        var results = [];

        if (this.material) {
            results.push(this.material);
        }

        return results;
    };

    // Geometry
    // deprecated: use setPositionWithLocalVector instead. It fixes setLocalTranslation.
    BABYLON.Mesh.prototype.setLocalTranslation = function(vector3) {
        console.warn("deprecated: use setPositionWithLocalVector instead");
        this.computeWorldMatrix();
        var worldMatrix = this._worldMatrix.clone();
        worldMatrix.setTranslation(BABYLON.Vector3.Zero());

        this.position = BABYLON.Vector3.TransformCoordinates(vector3, worldMatrix);
    };
    
    // deprecated: use getPositionExpressedInLocalSpace instead. It fixes getLocalTranslation.
    BABYLON.Mesh.prototype.getLocalTranslation = function () {
        console.warn("deprecated: use getPositionExpressedInLocalSpace instead");
        this.computeWorldMatrix();
        var invWorldMatrix = this._worldMatrix.clone();
        invWorldMatrix.setTranslation(BABYLON.Vector3.Zero());
        invWorldMatrix.invert();

        return BABYLON.Vector3.TransformCoordinates(this.position, invWorldMatrix);
    };
    
    BABYLON.Mesh.prototype.setPositionWithLocalVector = function(vector3) {
        this.computeWorldMatrix();
        
        this.position = BABYLON.Vector3.TransformNormal(vector3, this._localWorld);
    };

    BABYLON.Mesh.prototype.getPositionExpressedInLocalSpace = function () {
        this.computeWorldMatrix();
        var invLocalWorldMatrix = this._localWorld.clone();
        invLocalWorldMatrix.invert();

        return BABYLON.Vector3.TransformNormal(this.position, invLocalWorldMatrix);
    };
    
    BABYLON.Mesh.prototype.locallyTranslate = function(vector3) {
        this.computeWorldMatrix();
        
        this.position = BABYLON.Vector3.TransformCoordinates(vector3, this._localWorld);
    };

    BABYLON.Mesh.prototype.bakeTransformIntoVertices = function (transform) {
        // Position
        if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
            return;
        }

        this._resetPointsArrayCache();

        var data = this._vertexBuffers[BABYLON.VertexBuffer.PositionKind].getData();
        var temp = new BABYLON.MatrixType(data.length);
        for (var index = 0; index < data.length; index += 3) {
            BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.FromArray(data, index), transform).toArray(temp, index);
        }

        this.setVerticesData(temp, BABYLON.VertexBuffer.PositionKind, this._vertexBuffers[BABYLON.VertexBuffer.PositionKind].isUpdatable());

        // Normals
        if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
            return;
        }

        data = this._vertexBuffers[BABYLON.VertexBuffer.NormalKind].getData();
        for (var index = 0; index < data.length; index += 3) {
            BABYLON.Vector3.TransformNormal(BABYLON.Vector3.FromArray(data, index), transform).toArray(temp, index);
        }

        this.setVerticesData(temp, BABYLON.VertexBuffer.NormalKind, this._vertexBuffers[BABYLON.VertexBuffer.NormalKind].isUpdatable());
    };

    // Cache
    BABYLON.Mesh.prototype._resetPointsArrayCache = function () {
        this._positions = null;
    };

    BABYLON.Mesh.prototype._generatePointsArray = function () {
        if (this._positions)
            return;

        this._positions = [];

        var data = this._vertexBuffers[BABYLON.VertexBuffer.PositionKind].getData();
        for (var index = 0; index < data.length; index += 3) {
            this._positions.push(BABYLON.Vector3.FromArray(data, index));
        }
    };

    // Collisions
    BABYLON.Mesh.prototype._collideForSubMesh = function (subMesh, transformMatrix, collider) {
        this._generatePointsArray();
        // Transformation
        if (!subMesh._lastColliderWorldVertices || !subMesh._lastColliderTransformMatrix.equals(transformMatrix)) {
            subMesh._lastColliderTransformMatrix = transformMatrix;
            subMesh._lastColliderWorldVertices = [];
            var start = subMesh.verticesStart;
            var end = (subMesh.verticesStart + subMesh.verticesCount);
            for (var i = start; i < end; i++) {
                subMesh._lastColliderWorldVertices.push(BABYLON.Vector3.TransformCoordinates(this._positions[i], transformMatrix));
            }
        }
        // Collide
        collider._collide(subMesh, subMesh._lastColliderWorldVertices, this._indices, subMesh.indexStart, subMesh.indexStart + subMesh.indexCount, subMesh.verticesStart);
    };

    BABYLON.Mesh.prototype._processCollisionsForSubModels = function (collider, transformMatrix) {
        for (var index = 0; index < this.subMeshes.length; index++) {
            var subMesh = this.subMeshes[index];

            // Bounding test
            if (this.subMeshes.length > 1 && !subMesh._checkCollision(collider))
                continue;

            this._collideForSubMesh(subMesh, transformMatrix, collider);
        }
    };

    BABYLON.Mesh.prototype._checkCollision = function (collider) {
        // Bounding box test
        if (!this._boundingInfo._checkCollision(collider))
            return;

        // Transformation matrix
        BABYLON.Matrix.ScalingToRef(1.0 / collider.radius.x, 1.0 / collider.radius.y, 1.0 / collider.radius.z, this._collisionsScalingMatrix);
        this._worldMatrix.multiplyToRef(this._collisionsScalingMatrix, this._collisionsTransformMatrix);

        this._processCollisionsForSubModels(collider, this._collisionsTransformMatrix);
    };

    BABYLON.Mesh.prototype.intersectsMesh = function (mesh, precise) {
        if (!this._boundingInfo || !mesh._boundingInfo) {
            return false;
        }

        return this._boundingInfo.intersects(mesh._boundingInfo, precise);
    };

    BABYLON.Mesh.prototype.intersectsPoint = function (point) {
        if (!this._boundingInfo) {
            return false;
        }

        return this._boundingInfo.intersectsPoint(point);
    };

    // Picking
    BABYLON.Mesh.prototype.intersects = function (ray, fastCheck) {
        var pickingInfo = new BABYLON.PickingInfo();

        if (!this._boundingInfo || !ray.intersectsSphere(this._boundingInfo.boundingSphere) || !ray.intersectsBox(this._boundingInfo.boundingBox)) {
            return pickingInfo;
        }

        this._generatePointsArray();

        var distance = Number.MAX_VALUE;

        for (var index = 0; index < this.subMeshes.length; index++) {
            var subMesh = this.subMeshes[index];

            // Bounding test
            if (this.subMeshes.length > 1 && !subMesh.canIntersects(ray))
                continue;

            var currentDistance = subMesh.intersects(ray, this._positions, this._indices, fastCheck);

            if (currentDistance > 0) {
                if (fastCheck || currentDistance < distance) {
                    distance = currentDistance;

                    if (fastCheck) {
                        break;
                    }
                }
            }
        }

        if (distance >= 0 && distance < Number.MAX_VALUE) {
            // Get picked point
            var world = this.getWorldMatrix();
            var worldOrigin = BABYLON.Vector3.TransformCoordinates(ray.origin, world);
            var direction = ray.direction.clone();
            direction.normalize();
            direction = direction.scale(distance);
            var worldDirection = BABYLON.Vector3.TransformNormal(direction, world);

            var pickedPoint = worldOrigin.add(worldDirection);

            // Return result
            pickingInfo.hit = true;
            pickingInfo.distance = BABYLON.Vector3.Distance(worldOrigin, pickedPoint);
            pickingInfo.pickedPoint = pickedPoint;
            pickingInfo.pickedMesh = this;
            return pickingInfo;
        }

        return pickingInfo;
    };

    // Clone
    BABYLON.Mesh.prototype.clone = function (name, newParent, doNotCloneChildren) {
        var result = new BABYLON.Mesh(name, this._scene);

        // Buffers
        result._vertexBuffers = this._vertexBuffers;
        for (var kind in result._vertexBuffers) {
            result._vertexBuffers[kind].references++;
        }

        result._indexBuffer = this._indexBuffer;
        this._indexBuffer.references++;

        // Deep copy
        BABYLON.Tools.DeepCopy(this, result, ["name", "material", "skeleton"], ["_indices", "_totalVertices"]);

        // Bounding info
        var extend = BABYLON.Tools.ExtractMinAndMax(this.getVerticesData(BABYLON.VertexBuffer.PositionKind), 0, this._totalVertices);
        result._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);

        // Material
        result.material = this.material;

        // Parent
        if (newParent) {
            result.parent = newParent;
        }

        if (!doNotCloneChildren) {
            // Children
            for (var index = 0; index < this._scene.meshes.length; index++) {
                var mesh = this._scene.meshes[index];

                if (mesh.parent == this) {
                    mesh.clone(mesh.name, result);
                }
            }
        }

        // Particles
        for (var index = 0; index < this._scene.particleSystems.length; index++) {
            var system = this._scene.particleSystems[index];

            if (system.emitter == this) {
                system.clone(system.name, result);
            }
        }

        return result;
    };

    // Dispose
    BABYLON.Mesh.prototype.dispose = function (doNotRecurse) {
        if (this._vertexBuffers) {
            for (var index = 0; index < this._vertexBuffers.length; index++) {
                this._vertexBuffers[index].dispose();
            }
            this._vertexBuffers = null;
        }

        if (this._indexBuffer) {
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        // Remove from scene
        var index = this._scene.meshes.indexOf(this);
        this._scene.meshes.splice(index, 1);

        if (!doNotRecurse) {
            // Particles
            for (var index = 0; index < this._scene.particleSystems.length; index++) {
                if (this._scene.particleSystems[index].emitter == this) {
                    this._scene.particleSystems[index].dispose();
                    index--;
                }
            }

            // Children
            var objects = this._scene.meshes.slice(0);
            for (var index = 0; index < objects.length; index++) {
                if (objects[index].parent == this) {
                    objects[index].dispose();
                }
            }
        }

        this._isDisposed = true;

        // Callback
        if (this.onDispose) {
            this.onDispose();
        }
    };
    
    // Physics
    BABYLON.Mesh.prototype.setPhysicsState = function(options) {
        if (!this._scene._physicsEngine) {
            return;
        }

        options.impostor = options.impostor || BABYLON.PhysicsEngine.NoImpostor;
        options.mass = options.mass || 0;
        options.friction = options.friction || 0.0;
        options.restitution = options.restitution || 0.9;

        this._physicImpostor = options.impostor;
        this._physicsMass = options.mass;
        this._physicsFriction = options.friction;
        this._physicRestitution = options.restitution;

        if (options.impostor === BABYLON.PhysicsEngine.NoImpostor) {
            this._scene._physicsEngine._unregisterMesh(this);
            return;
        }
        
        this._scene._physicsEngine._registerMesh(this, options);
    };

    BABYLON.Mesh.prototype.getPhysicsImpostor = function() {
        if (!this._physicImpostor) {
            return BABYLON.PhysicsEngine.NoImpostor;
        }

        return this._physicImpostor;
    };

    BABYLON.Mesh.prototype.getPhysicsMass = function() {
        if (!this._physicsMass) {
            return 0;
        }

        return this._physicsMass;
    };
    
    BABYLON.Mesh.prototype.getPhysicsFriction = function () {
        if (!this._physicsFriction) {
            return 0;
        }

        return this._physicsFriction;
    };
    
    BABYLON.Mesh.prototype.getPhysicsRestitution = function () {
        if (!this._physicRestitution) {
            return 0;
        }

        return this._physicRestitution;
    };

    BABYLON.Mesh.prototype.applyImpulse = function(force, contactPoint) {
        if (!this._physicImpostor) {
            return;
        }

        this._scene._physicsEngine._applyImpulse(this, force, contactPoint);
    };

    BABYLON.Mesh.prototype.setPhysicsLinkWith = function(otherMesh, pivot1, pivot2) {
        if (!this._physicImpostor) {
            return;
        }
        
        this._scene._physicsEngine._createLink(this, otherMesh, pivot1, pivot2);
    };

    BABYLON.Mesh.prototype.lookAt = function (targetPoint, yawCor, pitchCor, rollCor) {
        /// <summary>Orients a mesh towards a target point. Mesh must be drawn facing user.</summary>
        /// <param name="targetPoint" type="BABYLON.Vector3">The mesh to look at</param>
        /// <param name="yawCor" type="Number">optional yaw (y-axis) correction in radians</param>
        /// <param name="pitchCor" type="Number">optional pitch (x-axis) correction in radians</param>
        /// <param name="rollCor" type="Number">optional roll (z-axis) correction in radians</param>
        /// <returns>Mesh oriented towards targetMesh</returns>

        yawCor = yawCor || 0; // default to zero if undefined 
        pitchCor = pitchCor || 0;
        rollCor = rollCor || 0;

        var dv = targetPoint.subtract(this.position);
        var yaw = -Math.atan2(dv.z, dv.x) - Math.PI / 2;
        var len = Math.sqrt(dv.x * dv.x + dv.z * dv.z);
        var pitch = Math.atan2(dv.y, len);
        this.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(yaw + yawCor, pitch + pitchCor, rollCor);
    };

    // Statics
    BABYLON.Mesh.CreateBox = function (name, size, scene, updatable) {
        var box = new BABYLON.Mesh(name, scene);

        var normalsSource = [
            new BABYLON.Vector3(0, 0, 1),
            new BABYLON.Vector3(0, 0, -1),
            new BABYLON.Vector3(1, 0, 0),
            new BABYLON.Vector3(-1, 0, 0),
            new BABYLON.Vector3(0, 1, 0),
            new BABYLON.Vector3(0, -1, 0)
        ];

        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];

        // Create each face in turn.
        for (var index = 0; index < normalsSource.length; index++) {
            var normal = normalsSource[index];

            // Get two vectors perpendicular to the face normal and to each other.
            var side1 = new BABYLON.Vector3(normal.y, normal.z, normal.x);
            var side2 = BABYLON.Vector3.Cross(normal, side1);

            // Six indices (two triangles) per face.
            var verticesLength = positions.length / 3;
            indices.push(verticesLength);
            indices.push(verticesLength + 1);
            indices.push(verticesLength + 2);

            indices.push(verticesLength);
            indices.push(verticesLength + 2);
            indices.push(verticesLength + 3);

            // Four vertices per face.
            var vertex = normal.subtract(side1).subtract(side2).scale(size / 2);
            positions.push(vertex.x, vertex.y, vertex.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(1.0, 1.0);

            vertex = normal.subtract(side1).add(side2).scale(size / 2);
            positions.push(vertex.x, vertex.y, vertex.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(0.0, 1.0);

            vertex = normal.add(side1).add(side2).scale(size / 2);
            positions.push(vertex.x, vertex.y, vertex.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(0.0, 0.0);

            vertex = normal.add(side1).subtract(side2).scale(size / 2);
            positions.push(vertex.x, vertex.y, vertex.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(1.0, 0.0);
        }

        box.setVerticesData(positions, BABYLON.VertexBuffer.PositionKind, updatable);
        box.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatable);
        box.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind, updatable);
        box.setIndices(indices);

        return box;
    };

    BABYLON.Mesh.CreateSphere = function (name, segments, diameter, scene, updatable) {
        var sphere = new BABYLON.Mesh(name, scene);

        var radius = diameter / 2;

        var totalZRotationSteps = 2 + segments;
        var totalYRotationSteps = 2 * totalZRotationSteps;

        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];

        for (var zRotationStep = 0; zRotationStep <= totalZRotationSteps; zRotationStep++) {
            var normalizedZ = zRotationStep / totalZRotationSteps;
            var angleZ = (normalizedZ * Math.PI);

            for (var yRotationStep = 0; yRotationStep <= totalYRotationSteps; yRotationStep++) {
                var normalizedY = yRotationStep / totalYRotationSteps;

                var angleY = normalizedY * Math.PI * 2;

                var rotationZ = BABYLON.Matrix.RotationZ(-angleZ);
                var rotationY = BABYLON.Matrix.RotationY(angleY);
                var afterRotZ = BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.Up(), rotationZ);
                var complete = BABYLON.Vector3.TransformCoordinates(afterRotZ, rotationY);

                var vertex = complete.scale(radius);
                var normal = BABYLON.Vector3.Normalize(vertex);

                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(normalizedZ, normalizedY);
            }

            if (zRotationStep > 0) {
                var verticesCount = positions.length / 3;
                for (var firstIndex = verticesCount - 2 * (totalYRotationSteps + 1) ; (firstIndex + totalYRotationSteps + 2) < verticesCount; firstIndex++) {
                    indices.push((firstIndex));
                    indices.push((firstIndex + 1));
                    indices.push(firstIndex + totalYRotationSteps + 1);

                    indices.push((firstIndex + totalYRotationSteps + 1));
                    indices.push((firstIndex + 1));
                    indices.push((firstIndex + totalYRotationSteps + 2));
                }
            }
        }

        sphere.setVerticesData(positions, BABYLON.VertexBuffer.PositionKind, updatable);
        sphere.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatable);
        sphere.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind, updatable);
        sphere.setIndices(indices);

        return sphere;
    };

    // Cylinder and cone (Code inspired by SharpDX.org)
    BABYLON.Mesh.CreateCylinder = function (name, height, diameterTop, diameterBottom, tessellation, scene, updatable) {
        var radiusTop = diameterTop / 2;
        var radiusBottom = diameterBottom / 2;
        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];
        var cylinder = new BABYLON.Mesh(name, scene);

        var getCircleVector = function (i) {
            var angle = (i * 2.0 * Math.PI / tessellation);
            var dx = Math.sin(angle);
            var dz = Math.cos(angle);

            return new BABYLON.Vector3(dx, 0, dz);
        };

        var createCylinderCap = function (isTop) {
            var radius = isTop ? radiusTop : radiusBottom;
            
            if (radius == 0) {
                return
            }

            // Create cap indices.
            for (var i = 0; i < tessellation - 2; i++) {
                var i1 = (i + 1) % tessellation;
                var i2 = (i + 2) % tessellation;

                if (!isTop) {
                    var tmp = i1;
                    var i1 = i2;
                    i2 = tmp;
                }

                var vbase = positions.length / 3;
                indices.push(vbase);
                indices.push(vbase + i1);
                indices.push(vbase + i2);
            }


            // Which end of the cylinder is this?
            var normal = new BABYLON.Vector3(0, -1, 0);
            var textureScale = new BABYLON.Vector2(-0.5, -0.5);

            if (!isTop) {
                normal = normal.scale(-1);
                textureScale.x = -textureScale.x;
            }

            // Create cap vertices.
            for (var i = 0; i < tessellation; i++) {
                var circleVector = getCircleVector(i);
                var position = circleVector.scale(radius).add(normal.scale(height));
                var textureCoordinate = new BABYLON.Vector2(circleVector.x * textureScale.x + 0.5, circleVector.z * textureScale.y + 0.5);

                positions.push(position.x, position.y, position.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(textureCoordinate.x, textureCoordinate.y);
            }
        };

        height /= 2;

        var topOffset = new BABYLON.Vector3(0, 1, 0).scale(height);

        var stride = tessellation + 1;

        // Create a ring of triangles around the outside of the cylinder.
        for (var i = 0; i <= tessellation; i++) {
            var normal = getCircleVector(i);
            var sideOffsetBottom = normal.scale(radiusBottom);
            var sideOffsetTop = normal.scale(radiusTop);
            var textureCoordinate = new BABYLON.Vector2(i / tessellation, 0);

            var position = sideOffsetBottom.add(topOffset);
            positions.push(position.x, position.y, position.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(textureCoordinate.x, textureCoordinate.y);

            position = sideOffsetTop.subtract(topOffset);
            textureCoordinate.y += 1;
            positions.push(position.x, position.y, position.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(textureCoordinate.x, textureCoordinate.y);

            indices.push(i * 2);
            indices.push((i * 2 + 2) % (stride * 2));
            indices.push(i * 2 + 1);

            indices.push(i * 2 + 1);
            indices.push((i * 2 + 2) % (stride * 2));
            indices.push((i * 2 + 3) % (stride * 2));
        }

        // Create flat triangle fan caps to seal the top and bottom.
        createCylinderCap(true);
        createCylinderCap(false);

        cylinder.setVerticesData(positions, BABYLON.VertexBuffer.PositionKind, updatable);
        cylinder.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatable);
        cylinder.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind, updatable);
        cylinder.setIndices(indices);

        return cylinder;
    };    

    // Torus  (Code from SharpDX.org)
    BABYLON.Mesh.CreateTorus = function (name, diameter, thickness, tessellation, scene, updatable) {
        var torus = new BABYLON.Mesh(name, scene);

        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];

        var stride = tessellation + 1;

        for (var i = 0; i <= tessellation; i++) {
            var u = i / tessellation;

            var outerAngle = i * Math.PI * 2.0 / tessellation - Math.PI / 2.0;

            var transform = BABYLON.Matrix.Translation(diameter / 2.0, 0, 0).multiply(BABYLON.Matrix.RotationY(outerAngle));

            for (var j = 0; j <= tessellation; j++) {
                var v = 1 - j / tessellation;

                var innerAngle = j * Math.PI * 2.0 / tessellation + Math.PI;
                var dx = Math.cos(innerAngle);
                var dy = Math.sin(innerAngle);

                // Create a vertex.
                var normal = new BABYLON.Vector3(dx, dy, 0);
                var position = normal.scale(thickness / 2);
                var textureCoordinate = new BABYLON.Vector2(u, v);

                position = BABYLON.Vector3.TransformCoordinates(position, transform);
                normal = BABYLON.Vector3.TransformNormal(normal, transform);

                positions.push(position.x, position.y, position.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(textureCoordinate.x, textureCoordinate.y);

                // And create indices for two triangles.
                var nextI = (i + 1) % stride;
                var nextJ = (j + 1) % stride;

                indices.push(i * stride + j);
                indices.push(i * stride + nextJ);
                indices.push(nextI * stride + j);

                indices.push(i * stride + nextJ);
                indices.push(nextI * stride + nextJ);
                indices.push(nextI * stride + j);
            }
        }

        torus.setVerticesData(positions, BABYLON.VertexBuffer.PositionKind, updatable);
        torus.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatable);
        torus.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind, updatable);
        torus.setIndices(indices);

        return torus;
    };

    // Plane
    BABYLON.Mesh.CreatePlane = function (name, size, scene, updatable) {
        var plane = new BABYLON.Mesh(name, scene);

        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];

        // Vertices
        var halfSize = size / 2.0;
        positions.push(-halfSize, -halfSize, 0);
        normals.push(0, 0, -1.0);
        uvs.push(0.0, 0.0);

        positions.push(halfSize, -halfSize, 0);
        normals.push(0, 0, -1.0);
        uvs.push(1.0, 0.0);

        positions.push(halfSize, halfSize, 0);
        normals.push(0, 0, -1.0);
        uvs.push(1.0, 1.0);

        positions.push(-halfSize, halfSize, 0);
        normals.push(0, 0, -1.0);
        uvs.push(0.0, 1.0);

        // Indices
        indices.push(0);
        indices.push(1);
        indices.push(2);

        indices.push(0);
        indices.push(2);
        indices.push(3);

        plane.setVerticesData(positions, BABYLON.VertexBuffer.PositionKind, updatable);
        plane.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatable);
        plane.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind, updatable);
        plane.setIndices(indices);

        return plane;
    };

    BABYLON.Mesh.CreateGround = function (name, width, height, subdivisions, scene, updatable) {
        var ground = new BABYLON.Mesh(name, scene);

        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];
        var row, col;

        for (row = 0; row <= subdivisions; row++) {
            for (col = 0; col <= subdivisions; col++) {
                var position = new BABYLON.Vector3((col * width) / subdivisions - (width / 2.0), 0, ((subdivisions - row) * height) / subdivisions - (height / 2.0));
                var normal = new BABYLON.Vector3(0, 1.0, 0);

                positions.push(position.x, position.y, position.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(col / subdivisions, 1.0 - row / subdivisions);
            }
        }

        for (row = 0; row < subdivisions; row++) {
            for (col = 0; col < subdivisions; col++) {
                indices.push(col + 1 + (row + 1) * (subdivisions + 1));
                indices.push(col + 1 + row * (subdivisions + 1));
                indices.push(col + row * (subdivisions + 1));

                indices.push(col + (row + 1) * (subdivisions + 1));
                indices.push(col + 1 + (row + 1) * (subdivisions + 1));
                indices.push(col + row * (subdivisions + 1));
            }
        }

        ground.setVerticesData(positions, BABYLON.VertexBuffer.PositionKind, updatable);
        ground.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatable);
        ground.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind, updatable);
        ground.setIndices(indices);

        return ground;
    };

    BABYLON.Mesh.CreateGroundFromHeightMap = function (name, url, width, height, subdivisions, minHeight, maxHeight, scene, updatable) {
        var ground = new BABYLON.Mesh(name, scene);

        var onload = function (img) {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var row, col;

            // Getting height map data
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            var heightMapWidth = img.width;
            var heightMapHeight = img.height;
            canvas.width = heightMapWidth;
            canvas.height = heightMapHeight;

            context.drawImage(img, 0, 0);

            var buffer = context.getImageData(0, 0, heightMapWidth, heightMapHeight).data;

            // Vertices
            for (row = 0; row <= subdivisions; row++) {
                for (col = 0; col <= subdivisions; col++) {
                    var position = new BABYLON.Vector3((col * width) / subdivisions - (width / 2.0), 0, ((subdivisions - row) * height) / subdivisions - (height / 2.0));

                    // Compute height
                    var heightMapX = (((position.x + width / 2) / width) * (heightMapWidth - 1)) | 0;
                    var heightMapY = ((1.0 - (position.z + height / 2) / height) * (heightMapHeight - 1)) | 0;

                    var pos = (heightMapX + heightMapY * heightMapWidth) * 4;
                    var r = buffer[pos] / 255.0;
                    var g = buffer[pos + 1] / 255.0;
                    var b = buffer[pos + 2] / 255.0;

                    var gradient = r * 0.3 + g * 0.59 + b * 0.11;

                    position.y = minHeight + (maxHeight - minHeight) * gradient;

                    // Add  vertex
                    positions.push(position.x, position.y, position.z);
                    normals.push(0, 0, 0);
                    uvs.push(col / subdivisions, 1.0 - row / subdivisions);
                }
            }

            // Indices
            for (row = 0; row < subdivisions; row++) {
                for (col = 0; col < subdivisions; col++) {
                    indices.push(col + 1 + (row + 1) * (subdivisions + 1));
                    indices.push(col + 1 + row * (subdivisions + 1));
                    indices.push(col + row * (subdivisions + 1));

                    indices.push(col + (row + 1) * (subdivisions + 1));
                    indices.push(col + 1 + (row + 1) * (subdivisions + 1));
                    indices.push(col + row * (subdivisions + 1));
                }
            }

            // Normals
            BABYLON.Mesh.ComputeNormal(positions, normals, indices);

            // Transfer
            ground.setVerticesData(positions, BABYLON.VertexBuffer.PositionKind, updatable);
            ground.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatable);
            ground.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind, updatable);
            ground.setIndices(indices);

            ground._isReady = true;
        };

        BABYLON.Tools.LoadImage(url, onload, scene.database);

        ground._isReady = false;

        return ground;
    };
    
    BABYLON.Mesh.prototype._initCache = function () {
        this._cache.localMatrixUpdated = false;
        this._cache.position = BABYLON.Vector3.Zero();
        this._cache.scaling = BABYLON.Vector3.Zero();
        this._cache.rotation = BABYLON.Vector3.Zero();
        this._cache.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 0);
    };

    // Tools
    BABYLON.Mesh.ComputeNormal = function (positions, normals, indices) {
        var positionVectors = [];
        var facesOfVertices = [];
        var index;

        for (index = 0; index < positions.length; index += 3) {
            var vector3 = new BABYLON.Vector3(positions[index], positions[index + 1], positions[index + 2]);
            positionVectors.push(vector3);
            facesOfVertices.push([]);
        }
        // Compute normals
        var facesNormals = [];
        for (index = 0; index < indices.length / 3; index++) {
            var i1 = indices[index * 3];
            var i2 = indices[index * 3 + 1];
            var i3 = indices[index * 3 + 2];

            var p1 = positionVectors[i1];
            var p2 = positionVectors[i2];
            var p3 = positionVectors[i3];

            var p1p2 = p1.subtract(p2);
            var p3p2 = p3.subtract(p2);

            facesNormals[index] = BABYLON.Vector3.Normalize(BABYLON.Vector3.Cross(p1p2, p3p2));
            facesOfVertices[i1].push(index);
            facesOfVertices[i2].push(index);
            facesOfVertices[i3].push(index);
        }

        for (index = 0; index < positionVectors.length; index++) {
            var faces = facesOfVertices[index];

            var normal = BABYLON.Vector3.Zero();
            for (var faceIndex = 0; faceIndex < faces.length; faceIndex++) {
                normal.addInPlace(facesNormals[faces[faceIndex]]);
            }

            normal = BABYLON.Vector3.Normalize(normal.scale(1.0 / faces.length));

            normals[index * 3] = normal.x;
            normals[index * 3 + 1] = normal.y;
            normals[index * 3 + 2] = normal.z;
        }
    };
>>>>>>> origin/master
})();