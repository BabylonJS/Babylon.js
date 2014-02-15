"use strict";

var BABYLON = BABYLON || {};

(function () {

    var serializeLight = function (light) {
        var serializationObject = {};
        serializationObject.name = light.name;
        serializationObject.id = light.id;

        if (light instanceof BABYLON.PointLight) {
            serializationObject.type = 0;
            serializationObject.position = light.position.asArray();
        } else if (light instanceof BABYLON.DirectionalLight) {
            serializationObject.type = 1;
            serializationObject.position = light.position.asArray();
            serializationObject.direction = light.position.asArray();
        } else if (light instanceof BABYLON.SpotLight) {
            serializationObject.type = 2;
            serializationObject.position = light.position.asArray();
            serializationObject.direction = light.position.asArray();
            serializationObject.angle = light.angle;
            serializationObject.exponent = light.exponent;
        } else if (light instanceof BABYLON.HemisphericLight) {
            serializationObject.type = 2;
            serializationObject.groundColor = light.groundColor.asArray();
        }

        if (light.intensity) {
            serializationObject.intensity = light.intensity;
        }
        serializationObject.diffuse = light.diffuse.asArray();
        serializationObject.specular = light.specular.asArray();

        return serializationObject;
    };

    var serializeCamera = function (camera) {
        var serializationObject = {};
        serializationObject.name = camera.name;
        serializationObject.id = camera.id;
        serializationObject.position = camera.position.asArray();

        // Parent
        if (camera.parent) {
            serializationObject.parentId = camera.parent.id;
        }

        // Target
        serializationObject.rotation = camera.rotation.asArray();

        // Locked target
        if (camera.lockedTarget && camera.lockedTarget.id) {
            serializationObject.lockedTargetId = camera.lockedTarget.id;
        }

        serializationObject.fov = camera.fov;
        serializationObject.minZ = camera.minZ;
        serializationObject.maxZ = camera.maxZ;

        serializationObject.speed = camera.speed;
        serializationObject.inertia = camera.inertia;

        serializationObject.checkCollisions = camera.checkCollisions;
        serializationObject.applyGravity = camera.applyGravity;

        if (camera.ellipsoid) {
            serializationObject.ellipsoid = camera.ellipsoid.asArray();
        }

        // Animations
        appendAnimations(camera, serializationObject);

        return serializationObject;
    };

    var appendAnimations = function (source, destination) {
        if (source.animations) {
            destination.animations = [];
            for (var animationIndex = 0; animationIndex < source.animations.length; animationIndex++) {
                var animation = source.animations[animationIndex];

                destination.animations.push(serializeAnimation(animation));
            }
        }
    };

    var serializeAnimation = function (animation) {
        var serializationObject = {};

        serializationObject.name = animation.name;
        serializationObject.property = animation.targetProperty;
        serializationObject.framePerSecond = animation.framePerSecond;
        serializationObject.dataType = animation.dataType;
        serializationObject.loopBehavior = animation.loopBehavior;

        var dataType = animation.dataType;
        serializationObject.keys = [];
        for (var index = 0; index < animation._keys.length; index++) {
            var animationKey = animation._keys[index];

            var key = {};
            key.frame = animationKey.frame;

            switch (dataType) {
                case BABYLON.Animation.ANIMATIONTYPE_FLOAT:
                    key.values = [animationKey.value];
                    break;
                case BABYLON.Animation.ANIMATIONTYPE_QUATERNION:
                case BABYLON.Animation.ANIMATIONTYPE_MATRIX:
                case BABYLON.Animation.ANIMATIONTYPE_VECTOR3:
                    key.values = animationKey.value.asArray();
                    break;
            }

            serializationObject.keys.push(key);
        }

        return serializationObject;
    };

    var serializeMultiMaterial = function (material) {
        var serializationObject = {};

        serializationObject.name = material.name;
        serializationObject.id = material.id;

        serializationObject.materials = [];

        for (var matIndex = 0; matIndex < material.subMaterials.length; matIndex++) {
            var subMat = material.subMaterials[matIndex];

            if (subMat) {
                serializationObject.materials.push(subMat.id);
            } else {
                serializationObject.materials.push(null);
            }
        }

        return serializationObject;
    };

    var serializeMaterial = function (material) {
        var serializationObject = {};

        serializationObject.name = material.name;

        serializationObject.ambient = material.ambientColor.asArray();
        serializationObject.diffuse = material.diffuseColor.asArray();
        serializationObject.specular = material.specularColor.asArray();
        serializationObject.specularPower = material.specularPower;
        serializationObject.emissive = material.emissiveColor.asArray();

        serializationObject.alpha = material.alpha;

        serializationObject.id = material.id;
        serializationObject.backFaceCulling = material.backFaceCulling;

        if (material.diffuseTexture) {
            serializationObject.diffuseTexture = serializeTexture(material.diffuseTexture);
        }

        if (material.ambientTexture) {
            serializationObject.ambientTexture = serializeTexture(material.ambientTexture);
        }

        if (material.opacityTexture) {
            serializationObject.opacityTexture = serializeTexture(material.opacityTexture);
        }

        if (material.reflectionTexture) {
            serializationObject.reflectionTexture = serializeTexture(material.reflectionTexture);
        }

        if (material.emissiveTexture) {
            serializationObject.emissiveTexture = serializeTexture(material.emissiveTexture);
        }

        if (material.specularTexture) {
            serializationObject.specularTexture = serializeTexture(material.specularTexture);
        }

        if (material.bumpTexture) {
            serializationObject.bumpTexture = serializeTexture(material.bumpTexture);
        }

        return serializationObject;
    };

    var serializeTexture = function (texture) {
        var serializationObject = {};

        if (!texture.name) {
            return null;
        }

        if (texture instanceof BABYLON.CubeTexture) {
            serializationObject.name = texture.name;
            serializationObject.hasAlpha = texture.hasAlpha;
            serializationObject.level = texture.level;
            serializationObject.coordinatesMode = texture.coordinatesMode;

            return serializationObject;
        }

        if (texture instanceof BABYLON.MirrorTexture) {
            serializationObject.renderTargetSize = texture.renderTargetSize;
            serializationObject.renderList = [];

            for (var index = 0; index < texture.renderList.length; index++) {
                serializationObject.renderList.push(texture.renderList[index].id);
            }

            serializationObject.mirrorPlane = texture.mirrorPlane.asArray();
        } else if (texture instanceof BABYLON.RenderTargetTexture) {
            serializationObject.renderTargetSize = texture.renderTargetSize;
            serializationObject.renderList = [];

            for (var index = 0; index < texture.renderList.length; index++) {
                serializationObject.renderList.push(texture.renderList[index].id);
            }
        }

        serializationObject.name = texture.name;
        serializationObject.hasAlpha = texture.hasAlpha;
        serializationObject.level = texture.level;

        serializationObject.coordinatesIndex = texture.coordinatesIndex;
        serializationObject.coordinatesMode = texture.coordinatesMode;
        serializationObject.uOffset = texture.uOffset;
        serializationObject.vOffset = texture.vOffset;
        serializationObject.uScale = texture.uScale;
        serializationObject.vScale = texture.vScale;
        serializationObject.uAng = texture.uAng;
        serializationObject.vAng = texture.vAng;
        serializationObject.wAng = texture.wAng;

        serializationObject.wrapU = texture.wrapU;
        serializationObject.wrapV = texture.wrapV;

        // Animations
        appendAnimations(texture, serializationObject);

        return serializationObject;
    };

    var serializeSkeleton = function (skeleton) {
        var serializationObject = {};

        serializationObject.name = skeleton.name;
        serializationObject.id = skeleton.id;

        serializationObject.bones = [];

        for (var index = 0; index < skeleton.bones.length; index++) {
            var bone = skeleton.bones[index];

            var serializedBone = {
                parentBoneIndex: bone._parent ? bone._parent.id : -1,
                name: bone.name,
                matrix: bone._matrix.toArray()
            };

            serializationObject.bones.push(serializedBone);

            if (bone.animations && bone.animations.length > 0) {
                serializedBone.animation = serializeAnimation(bone.animations[0]);
            }
        }
        return serializationObject;
    };

    var serializeParticleSystem = function (particleSystem) {
        var serializationObject = {};

        serializationObject.emitterId = particleSystem.emitter.id;
        serializationObject.capacity = particleSystem._capacity;

        if (particleSystem.particleTexture) {
            serializationObject.textureName = particleSystem.particleTexture.name;
        }

        serializationObject.minAngularSpeed = particleSystem.minAngularSpeed;
        serializationObject.maxAngularSpeed = particleSystem.maxAngularSpeed;
        serializationObject.minSize = particleSystem.minSize;
        serializationObject.maxSize = particleSystem.maxSize;
        serializationObject.minLifeTime = particleSystem.minLifeTime;
        serializationObject.maxLifeTime = particleSystem.maxLifeTime;
        serializationObject.emitRate = particleSystem.emitRate;
        serializationObject.minEmitBox = particleSystem.minEmitBox.asArray();
        serializationObject.maxEmitBox = particleSystem.maxEmitBox.asArray();
        serializationObject.gravity = particleSystem.gravity.asArray();
        serializationObject.direction1 = particleSystem.direction1.asArray();
        serializationObject.direction2 = particleSystem.direction2.asArray();
        serializationObject.color1 = particleSystem.color1.asArray();
        serializationObject.color2 = particleSystem.color2.asArray();
        serializationObject.colorDead = particleSystem.colorDead.asArray();
        serializationObject.updateSpeed = particleSystem.updateSpeed;
        serializationObject.targetStopDuration = particleSystem.targetStopFrame;
        serializationObject.textureMask = particleSystem.textureMask.asArray();
        serializationObject.blendMode = particleSystem.blendMode;

        return serializationObject;
    };

    var serializeLensFlareSystem = function (lensFlareSystem) {
        var serializationObject = {};

        serializationObject.emitterId = lensFlareSystem._emitter.id;
        serializationObject.borderLimit = lensFlareSystem.borderLimit;

        serializationObject.flares = [];
        for (var index = 0; index < lensFlareSystem.lensFlares.length; index++) {
            var flare = lensFlareSystem.lensFlares[index];

            serializationObject.flares.push({
                size: flare.size,
                position: flare.position,
                color: flare.color.asArray(),
                textureName: BABYLON.Tools.GetFilename(flare.texture.name)
            });
        }


        return serializationObject;
    };

    var serializeShadowGenerator = function (light) {
        var serializationObject = {};
        var shadowGenerator = light._shadowGenerator;

        serializationObject.lightId = light.id;
        serializationObject.mapSize = shadowGenerator.getShadowMap()._size;
        serializationObject.useVarianceShadowMap = shadowGenerator.useVarianceShadowMap;

        serializationObject.renderList = [];
        for (var meshIndex = 0; meshIndex < shadowGenerator.getShadowMap().renderList.length; meshIndex++) {
            var mesh = shadowGenerator.getShadowMap().renderList[meshIndex];

            serializationObject.renderList.push(mesh.id);
        }

        return serializationObject;
    };

    var serializeMesh = function (mesh) {
        var serializationObject = {};

        serializationObject.name = mesh.name;
        serializationObject.id = mesh.id;

        serializationObject.position = mesh.position.asArray();

        if (mesh.rotation) {
            serializationObject.rotation = mesh.rotation.asArray();
        } else if (mesh.rotationQuaternion) {
            serializationObject.rotationQuaternion = mesh.rotationQuaternion.asArray();
        }

        serializationObject.scaling = mesh.scaling.asArray();
        serializationObject.localMatrix = mesh.getPivotMatrix().asArray();

        serializationObject.isEnabled = mesh.isEnabled();
        serializationObject.isVisible = mesh.isVisible;
        serializationObject.infiniteDistance = mesh.infiniteDistance;

        serializationObject.receiveShadows = mesh.receiveShadows;

        serializationObject.billboardMode = mesh.billboardMode;
        serializationObject.visibility = mesh.visibility;

        serializationObject.checkCollisions = mesh.checkCollisions;

        // Parent
        if (mesh.parent) {
            serializationObject.parentId = mesh.parent.id;
        }

        // Geometry
        if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
            serializationObject.positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            serializationObject.normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);

            if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                serializationObject.uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
            }

            if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                serializationObject.uvs2 = mesh.getVerticesData(BABYLON.VertexBuffer.UV2Kind);
            }

            if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                serializationObject.colors = mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind);
            }

            if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind)) {
                serializationObject.matricesWeights = mesh.getVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind);
            }

            if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind)) {
                serializationObject.matricesWeights = mesh.getVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind);
                serializationObject.matricesWeights._isExpanded = true;
            }

            serializationObject.indices = mesh.getIndices();

            // SubMeshes
            serializationObject.subMeshes = [];
            for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                var subMesh = mesh.subMeshes[subIndex];

                serializationObject.subMeshes.push({
                    materialIndex: subMesh.materialIndex,
                    verticesStart: subMesh.verticesStart,
                    verticesCount: subMesh.verticesCount,
                    indexStart: subMesh.indexStart,
                    indexCount: subMesh.indexCount
                });
            }
        }

        // Material
        if (mesh.material) {
            serializationObject.materialId = mesh.material.id;
        } else {
            mesh.material = null;
        }

        // Skeleton
        if (mesh.skeleton) {
            serializationObject.skeletonId = mesh.skeleton.id;
        }

        // Physics
        if (mesh.getPhysicsImpostor() !== BABYLON.PhysicsEngine.NoImpostor) {
            serializationObject.physicsMass = mesh.getPhysicsMass();
            serializationObject.physicsFriction = mesh.getPhysicsFriction();
            serializationObject.physicsRestitution = mesh.getPhysicsRestitution();

            switch (mesh.getPhysicsImpostor()) {
                case BABYLON.PhysicsEngine.BoxImpostor:
                    serializationObject.physicsImpostor = 1;
                    break;
                case BABYLON.PhysicsEngine.SphereImpostor:
                    serializationObject.physicsImpostor = 2;
                    break;
            }
        }

        // Animations
        appendAnimations(mesh, serializationObject);

        return serializationObject;
    };

    BABYLON.SceneSerializer = {
        Serialize: function (scene) {
            var serializationObject = {};

            // Scene
            serializationObject.useDelayedTextureLoading = scene.useDelayedTextureLoading;
            serializationObject.autoClear = scene.autoClear;
            serializationObject.clearColor = scene.clearColor.asArray();
            serializationObject.ambientColor = scene.ambientColor.asArray();
            serializationObject.gravity = scene.gravity.asArray();

            // Fog
            if (scene.fogMode && scene.fogMode !== 0) {
                serializationObject.fogMode = scene.fogMode;
                serializationObject.fogColor = scene.fogColor.asArray();
                serializationObject.fogStart = scene.fogStart;
                serializationObject.fogEnd = scene.fogEnd;
                serializationObject.fogDensity = scene.fogDensity;
            }

            // Lights
            serializationObject.lights = [];
            for (var index = 0; index < scene.lights.length; index++) {
                var light = scene.lights[index];

                serializationObject.lights.push(serializeLight(light));
            }

            // Cameras
            serializationObject.cameras = [];
            for (var index = 0; index < scene.cameras.length; index++) {
                var camera = scene.cameras[index];

                if (camera instanceof BABYLON.FreeCamera) {
                    serializationObject.cameras.push(serializeCamera(camera));
                }
            }
            if (scene.activecamera) {
                serializationObject.activeCameraID = scene.activeCamera.id;
            }

            // Materials
            serializationObject.materials = [];
            serializationObject.multiMaterials = [];
            for (var index = 0; index < scene.materials.length; index++) {
                var material = scene.materials[index];

                if (material instanceof BABYLON.StandardMaterial) {
                    serializationObject.materials.push(serializeMaterial(material));
                } else if (material instanceof BABYLON.MultiMaterial) {
                    serializationObject.multiMaterials.push(serializeMultiMaterial(material));
                }
            }

            // Skeletons
            serializationObject.skeletons = [];
            for (var index = 0; index < scene.skeletons.length; index++) {
                serializationObject.skeletons.push(serializeSkeleton(scene.skeletons[index]));
            }

            // Meshes
            serializationObject.meshes = [];
            for (var index = 0; index < scene.meshes.length; index++) {
                var mesh = scene.meshes[index];

                if (mesh.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADED || mesh.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_NONE) {
                    serializationObject.meshes.push(serializeMesh(mesh));
                }
            }

            // Particles Systems
            serializationObject.particleSystems = [];
            for (var index = 0; index < scene.particleSystems.length; index++) {
                serializationObject.particleSystems.push(serializeParticleSystem(scene.particleSystems[index]));
            }

            // Lens flares
            serializationObject.lensFlareSystems = [];
            for (var index = 0; index < scene.lensFlareSystems.length; index++) {
                serializationObject.lensFlareSystems.push(serializeLensFlareSystem(scene.lensFlareSystems[index]));
            }

            // Shadows
            serializationObject.shadowGenerators = [];
            for (var index = 0; index < scene.lights.length; index++) {
                var light = scene.lights[index];

                if (light._shadowGenerator) {
                    serializationObject.shadowGenerators.push(serializeShadowGenerator(light));
                }
            }

            return serializationObject;
        }
    };
})();