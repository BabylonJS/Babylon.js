"use strict";

var BABYLON = BABYLON || {};

(function () {
    var loadCubeTexture = function (rootUrl, parsedTexture, scene) {
        var texture = new BABYLON.CubeTexture(rootUrl + parsedTexture.name, scene);

        texture.name = parsedTexture.name;
        texture.hasAlpha = parsedTexture.hasAlpha;
        texture.level = parsedTexture.level;
        texture.coordinatesMode = parsedTexture.coordinatesMode;

        return texture;
    };

    var loadTexture = function (rootUrl, parsedTexture, scene) {
        if (!parsedTexture.name && !parsedTexture.isRenderTarget) {
            return null;
        }

        if (parsedTexture.isCube) {
            return loadCubeTexture(rootUrl, parsedTexture, scene);
        }

        var texture;

        if (parsedTexture.mirrorPlane) {
            texture = new BABYLON.MirrorTexture(parsedTexture.name, parsedTexture.renderTargetSize, scene);
            texture._waitingRenderList = parsedTexture.renderList;
            texture.mirrorPlane = BABYLON.Plane.FromArray(parsedTexture.mirrorPlane);
        } else if (parsedTexture.isRenderTarget) {
            texture = new BABYLON.RenderTargetTexture(parsedTexture.name, parsedTexture.renderTargetSize, scene);
            texture._waitingRenderList = parsedTexture.renderList;
        } else {
            texture = new BABYLON.Texture(rootUrl + parsedTexture.name, scene);
        }

        texture.name = parsedTexture.name;
        texture.hasAlpha = parsedTexture.hasAlpha;
        texture.level = parsedTexture.level;

        texture.coordinatesIndex = parsedTexture.coordinatesIndex;
        texture.coordinatesMode = parsedTexture.coordinatesMode;
        texture.uOffset = parsedTexture.uOffset;
        texture.vOffset = parsedTexture.vOffset;
        texture.uScale = parsedTexture.uScale;
        texture.vScale = parsedTexture.vScale;
        texture.uAng = parsedTexture.uAng;
        texture.vAng = parsedTexture.vAng;
        texture.wAng = parsedTexture.wAng;

        texture.wrapU = parsedTexture.wrapU;
        texture.wrapV = parsedTexture.wrapV;

        // Animations
        if (parsedTexture.animations) {
            for (var animationIndex = 0; animationIndex < parsedTexture.animations.length; animationIndex++) {
                var parsedAnimation = parsedTexture.animations[animationIndex];

                texture.animations.push(parseAnimation(parsedAnimation));
            }
        }

        return texture;
    };

    var parseSkeleton = function (parsedSkeleton, scene) {
        var skeleton = new BABYLON.Skeleton(parsedSkeleton.name, parsedSkeleton.id, scene);

        for (var index = 0; index < parsedSkeleton.bones.length; index++) {
            var parsedBone = parsedSkeleton.bones[index];

            var parentBone = null;
            if (parsedBone.parentBoneIndex > -1) {
                parentBone = skeleton.bones[parsedBone.parentBoneIndex];
            }

            var bone = new BABYLON.Bone(parsedBone.name, skeleton, parentBone, BABYLON.Matrix.FromArray(parsedBone.matrix));

            if (parsedBone.animation) {
                bone.animations.push(parseAnimation(parsedBone.animation));
            }
        }

        return skeleton;
    };

    var parseMaterial = function (parsedMaterial, scene, rootUrl) {
        var material;
        material = new BABYLON.StandardMaterial(parsedMaterial.name, scene);

        material.ambientColor = BABYLON.Color3.FromArray(parsedMaterial.ambient);
        material.diffuseColor = BABYLON.Color3.FromArray(parsedMaterial.diffuse);
        material.specularColor = BABYLON.Color3.FromArray(parsedMaterial.specular);
        material.specularPower = parsedMaterial.specularPower;
        material.emissiveColor = BABYLON.Color3.FromArray(parsedMaterial.emissive);

        material.alpha = parsedMaterial.alpha;

        material.id = parsedMaterial.id;
        material.backFaceCulling = parsedMaterial.backFaceCulling;

        if (parsedMaterial.diffuseTexture) {
            material.diffuseTexture = loadTexture(rootUrl, parsedMaterial.diffuseTexture, scene);
        }

        if (parsedMaterial.ambientTexture) {
            material.ambientTexture = loadTexture(rootUrl, parsedMaterial.ambientTexture, scene);
        }

        if (parsedMaterial.opacityTexture) {
            material.opacityTexture = loadTexture(rootUrl, parsedMaterial.opacityTexture, scene);
        }

        if (parsedMaterial.reflectionTexture) {
            material.reflectionTexture = loadTexture(rootUrl, parsedMaterial.reflectionTexture, scene);
        }

        if (parsedMaterial.emissiveTexture) {
            material.emissiveTexture = loadTexture(rootUrl, parsedMaterial.emissiveTexture, scene);
        }

        if (parsedMaterial.specularTexture) {
            material.specularTexture = loadTexture(rootUrl, parsedMaterial.specularTexture, scene);
        }

        if (parsedMaterial.bumpTexture) {
            material.bumpTexture = loadTexture(rootUrl, parsedMaterial.bumpTexture, scene);
        }

        return material;
    };

    var parseMaterialById = function (id, parsedData, scene, rootUrl) {
        for (var index = 0; index < parsedData.materials.length; index++) {
            var parsedMaterial = parsedData.materials[index];
            if (parsedMaterial.id === id) {
                return parseMaterial(parsedMaterial, scene, rootUrl);
            }
        }

        return null;
    };

    var parseMultiMaterial = function (parsedMultiMaterial, scene) {
        var multiMaterial = new BABYLON.MultiMaterial(parsedMultiMaterial.name, scene);

        multiMaterial.id = parsedMultiMaterial.id;

        for (var matIndex = 0; matIndex < parsedMultiMaterial.materials.length; matIndex++) {
            var subMatId = parsedMultiMaterial.materials[matIndex];

            if (subMatId) {
                multiMaterial.subMaterials.push(scene.getMaterialByID(subMatId));
            } else {
                multiMaterial.subMaterials.push(null);
            }
        }

        return multiMaterial;
    };

    var parseLensFlareSystem = function (parsedLensFlareSystem, scene, rootUrl) {
        var emitter = scene.getLastEntryByID(parsedLensFlareSystem.emitterId);

        var lensFlareSystem = new BABYLON.LensFlareSystem("lensFlareSystem#" + parsedLensFlareSystem.emitterId, emitter, scene);
        lensFlareSystem.borderLimit = parsedLensFlareSystem.borderLimit;

        for (var index = 0; index < parsedLensFlareSystem.flares.length; index++) {
            var parsedFlare = parsedLensFlareSystem.flares[index];
            var flare = new BABYLON.LensFlare(parsedFlare.size, parsedFlare.position, BABYLON.Color3.FromArray(parsedFlare.color), rootUrl + parsedFlare.textureName, lensFlareSystem);
        }

        return lensFlareSystem;
    };

    var parseParticleSystem = function (parsedParticleSystem, scene, rootUrl) {
        var emitter = scene.getLastMeshByID(parsedParticleSystem.emitterId);

        var particleSystem = new BABYLON.ParticleSystem("particles#" + emitter.name, parsedParticleSystem.capacity, scene);
        if (parsedParticleSystem.textureName) {
            particleSystem.particleTexture = new BABYLON.Texture(rootUrl + parsedParticleSystem.textureName, scene);
            particleSystem.particleTexture.name = parsedParticleSystem.textureName;
        }
        particleSystem.minAngularSpeed = parsedParticleSystem.minAngularSpeed;
        particleSystem.maxAngularSpeed = parsedParticleSystem.maxAngularSpeed;
        particleSystem.minSize = parsedParticleSystem.minSize;
        particleSystem.maxSize = parsedParticleSystem.maxSize;
        particleSystem.minLifeTime = parsedParticleSystem.minLifeTime;
        particleSystem.maxLifeTime = parsedParticleSystem.maxLifeTime;
        particleSystem.emitter = emitter;
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
        particleSystem.targetStopDuration = parsedParticleSystem.targetStopFrame;
        particleSystem.textureMask = BABYLON.Color4.FromArray(parsedParticleSystem.textureMask);
        particleSystem.blendMode = parsedParticleSystem.blendMode;
        particleSystem.start();

        return particleSystem;
    };

    var parseShadowGenerator = function (parsedShadowGenerator, scene) {
        var light = scene.getLightByID(parsedShadowGenerator.lightId);
        var shadowGenerator = new BABYLON.ShadowGenerator(parsedShadowGenerator.mapSize, light);

        for (var meshIndex = 0; meshIndex < parsedShadowGenerator.renderList.length; meshIndex++) {
            var mesh = scene.getMeshByID(parsedShadowGenerator.renderList[meshIndex]);

            shadowGenerator.getShadowMap().renderList.push(mesh);
        }

        shadowGenerator.useVarianceShadowMap = parsedShadowGenerator.useVarianceShadowMap;

        return shadowGenerator;
    };

    var parseAnimation = function (parsedAnimation) {
        var animation = new BABYLON.Animation(parsedAnimation.name, parsedAnimation.property, parsedAnimation.framePerSecond, parsedAnimation.dataType, parsedAnimation.loopBehavior);

        var dataType = parsedAnimation.dataType;
        var keys = [];
        for (var index = 0; index < parsedAnimation.keys.length; index++) {
            var key = parsedAnimation.keys[index];

            var data;

            switch (dataType) {
                case BABYLON.Animation.ANIMATIONTYPE_FLOAT:
                    data = key.values[0];
                    break;
                case BABYLON.Animation.ANIMATIONTYPE_QUATERNION:
                    data = BABYLON.Quaternion.FromArray(key.values);
                    break;
                case BABYLON.Animation.ANIMATIONTYPE_MATRIX:
                    data = BABYLON.Matrix.FromArray(key.values);
                    break;
                case BABYLON.Animation.ANIMATIONTYPE_VECTOR3:
                default:
                    data = BABYLON.Vector3.FromArray(key.values);
                    break;
            }

            keys.push({
                frame: key.frame,
                value: data
            });
        }

        animation.setKeys(keys);

        return animation;
    };

    var parseLight = function (parsedLight, scene) {
        var light;

        switch (parsedLight.type) {
            case 0:
                light = new BABYLON.PointLight(parsedLight.name, BABYLON.Vector3.FromArray(parsedLight.position), scene);
                break;
            case 1:
                light = new BABYLON.DirectionalLight(parsedLight.name, BABYLON.Vector3.FromArray(parsedLight.direction), scene);
                light.position = BABYLON.Vector3.FromArray(parsedLight.position);
                break;
            case 2:
                light = new BABYLON.SpotLight(parsedLight.name, BABYLON.Vector3.FromArray(parsedLight.position), BABYLON.Vector3.FromArray(parsedLight.direction), parsedLight.angle, parsedLight.exponent, scene);
                break;
            case 3:
                light = new BABYLON.HemisphericLight(parsedLight.name, BABYLON.Vector3.FromArray(parsedLight.direction), scene);
                light.groundColor = BABYLON.Color3.FromArray(parsedLight.groundColor);
                break;
        }

        light.id = parsedLight.id;

        if (parsedLight.intensity) {
            light.intensity = parsedLight.intensity;
        }
        light.diffuse = BABYLON.Color3.FromArray(parsedLight.diffuse);
        light.specular = BABYLON.Color3.FromArray(parsedLight.specular);
    };

    var parseCamera = function (parsedCamera, scene) {
        var camera = new BABYLON.FreeCamera(parsedCamera.name, BABYLON.Vector3.FromArray(parsedCamera.position), scene);
        camera.id = parsedCamera.id;

        // Parent
        if (parsedCamera.parentId) {
            camera._waitingParentId = parsedCamera.parentId;
        }

        // Target
        if (parsedCamera.target) {
            camera.setTarget(BABYLON.Vector3.FromArray(parsedCamera.target));
        } else {
            camera.rotation = BABYLON.Vector3.FromArray(parsedCamera.rotation);
        }

        // Locked target
        if (parsedCamera.lockedTargetId) {
            camera._waitingLockedTargetId = parsedCamera.lockedTargetId;
        }

        camera.fov = parsedCamera.fov;
        camera.minZ = parsedCamera.minZ;
        camera.maxZ = parsedCamera.maxZ;

        camera.speed = parsedCamera.speed;
        camera.inertia = parsedCamera.inertia;

        camera.checkCollisions = parsedCamera.checkCollisions;
        camera.applyGravity = parsedCamera.applyGravity;
        if (parsedCamera.ellipsoid) {
            camera.ellipsoid = BABYLON.Vector3.FromArray(parsedCamera.ellipsoid);
        }

        // Animations
        if (parsedCamera.animations) {
            for (var animationIndex = 0; animationIndex < parsedCamera.animations.length; animationIndex++) {
                var parsedAnimation = parsedCamera.animations[animationIndex];

                camera.animations.push(parseAnimation(parsedAnimation));
            }
        }

        if (parsedCamera.autoAnimate) {
            scene.beginAnimation(camera, parsedCamera.autoAnimateFrom, parsedCamera.autoAnimateTo, parsedCamera.autoAnimateLoop, 1.0);
        }

        return camera;
    };

    var parseMesh = function (parsedMesh, scene, rootUrl) {
        var mesh = new BABYLON.Mesh(parsedMesh.name, scene);
        mesh.id = parsedMesh.id;

        mesh.position = BABYLON.Vector3.FromArray(parsedMesh.position);
        if (parsedMesh.rotation) {
            mesh.rotation = BABYLON.Vector3.FromArray(parsedMesh.rotation);
        } else if (parsedMesh.rotationQuaternion) {
            mesh.rotationQuaternion = BABYLON.Quaternion.FromArray(parsedMesh.rotationQuaternion);
        }
        mesh.scaling = BABYLON.Vector3.FromArray(parsedMesh.scaling);

        if (parsedMesh.localMatrix) {
            mesh.setPivotMatrix(BABYLON.Matrix.FromArray(parsedMesh.localMatrix));
        }

        mesh.setEnabled(parsedMesh.isEnabled);
        mesh.isVisible = parsedMesh.isVisible;
        mesh.infiniteDistance = parsedMesh.infiniteDistance;

        mesh.receiveShadows = parsedMesh.receiveShadows;

        mesh.billboardMode = parsedMesh.billboardMode;

        if (parsedMesh.visibility !== undefined) {
            mesh.visibility = parsedMesh.visibility;
        }

        mesh.checkCollisions = parsedMesh.checkCollisions;
        mesh._shouldGenerateFlatShading = parsedMesh.useFlatShading;

        // Parent
        if (parsedMesh.parentId) {
            mesh.parent = scene.getLastEntryByID(parsedMesh.parentId);
        }

        // Geometry
        if (parsedMesh.delayLoadingFile) {
            mesh.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NOTLOADED;
            mesh.delayLoadingFile = rootUrl + parsedMesh.delayLoadingFile;
            mesh._boundingInfo = new BABYLON.BoundingInfo(BABYLON.Vector3.FromArray(parsedMesh.boundingBoxMinimum), BABYLON.Vector3.FromArray(parsedMesh.boundingBoxMaximum));

            mesh._delayInfo = [];
            if (parsedMesh.hasUVs) {
                mesh._delayInfo.push(BABYLON.VertexBuffer.UVKind);
            }

            if (parsedMesh.hasUVs2) {
                mesh._delayInfo.push(BABYLON.VertexBuffer.UV2Kind);
            }

            if (parsedMesh.hasColors) {
                mesh._delayInfo.push(BABYLON.VertexBuffer.ColorKind);
            }

            if (parsedMesh.hasMatricesIndices) {
                mesh._delayInfo.push(BABYLON.VertexBuffer.MatricesIndicesKind);
            }

            if (parsedMesh.hasMatricesWeights) {
                mesh._delayInfo.push(BABYLON.VertexBuffer.MatricesWeightsKind);
            }

            mesh._delayLoadingFunction = importGeometry;

        } else {
            importGeometry(parsedMesh, mesh);
        }

        // Material
        if (parsedMesh.materialId) {
            mesh.setMaterialByID(parsedMesh.materialId);
        } else {
            mesh.material = null;
        }

        // Skeleton
        if (parsedMesh.skeletonId > -1) {
            mesh.skeleton = scene.getLastSkeletonByID(parsedMesh.skeletonId);
        }

        // Physics
        if (parsedMesh.physicsImpostor) {
            if (!scene.isPhysicsEnabled()) {
                scene.enablePhysics();
            }

            switch (parsedMesh.physicsImpostor) {
                case 1: // BOX
                    mesh.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, mass: parsedMesh.physicsMass, friction: parsedMesh.physicsFriction, restitution: parsedMesh.physicsRestitution });
                    break;
                case 2: // SPHERE
                    mesh.setPhysicsState({ impostor: BABYLON.PhysicsEngine.SphereImpostor, mass: parsedMesh.physicsMass, friction: parsedMesh.physicsFriction, restitution: parsedMesh.physicsRestitution });
                    break;
            }
        }

        // Animations
        if (parsedMesh.animations) {
            for (var animationIndex = 0; animationIndex < parsedMesh.animations.length; animationIndex++) {
                var parsedAnimation = parsedMesh.animations[animationIndex];

                mesh.animations.push(parseAnimation(parsedAnimation));
            }
        }

        if (parsedMesh.autoAnimate) {
            scene.beginAnimation(mesh, parsedMesh.autoAnimateFrom, parsedMesh.autoAnimateTo, parsedMesh.autoAnimateLoop, 1.0);
        }

        return mesh;
    };


    var isDescendantOf = function (mesh, names, hierarchyIds) {
        names = (names instanceof Array) ? names : [names];
        for (var i in names) {
            if (mesh.name === names[i]) {
                hierarchyIds.push(mesh.id);
                return true;
            }
        }

        if (mesh.parentId && hierarchyIds.indexOf(mesh.parentId) !== -1) {
            hierarchyIds.push(mesh.id);
            return true;
        }

        return false;
    };

    var importGeometry = function (parsedGeometry, mesh) {
        // Geometry
        if (parsedGeometry.positions && parsedGeometry.normals && parsedGeometry.indices) {
            mesh.setVerticesData(parsedGeometry.positions, BABYLON.VertexBuffer.PositionKind, false);
            mesh.setVerticesData(parsedGeometry.normals, BABYLON.VertexBuffer.NormalKind, false);

            if (parsedGeometry.uvs) {
                mesh.setVerticesData(parsedGeometry.uvs, BABYLON.VertexBuffer.UVKind, false);
            }

            if (parsedGeometry.uvs2) {
                mesh.setVerticesData(parsedGeometry.uvs2, BABYLON.VertexBuffer.UV2Kind, false);
            }

            if (parsedGeometry.colors) {
                mesh.setVerticesData(parsedGeometry.colors, BABYLON.VertexBuffer.ColorKind, false);
            }

            if (parsedGeometry.matricesIndices) {
                if (!parsedGeometry.matricesIndices._isExpanded) {
                    var floatIndices = [];

                    for (var i = 0; i < parsedGeometry.matricesIndices.length; i++) {
                        var matricesIndex = parsedGeometry.matricesIndices[i];

                        floatIndices.push(matricesIndex & 0x000000FF);
                        floatIndices.push((matricesIndex & 0x0000FF00) >> 8);
                        floatIndices.push((matricesIndex & 0x00FF0000) >> 16);
                        floatIndices.push(matricesIndex >> 24);
                    }

                    mesh.setVerticesData(floatIndices, BABYLON.VertexBuffer.MatricesIndicesKind, false);
                } else {
                    delete parsedGeometry.matricesIndices._isExpanded;
                    mesh.setVerticesData(parsedGeometry.matricesIndices, BABYLON.VertexBuffer.MatricesIndicesKind, false);
                }
            }

            if (parsedGeometry.matricesWeights) {
                mesh.setVerticesData(parsedGeometry.matricesWeights, BABYLON.VertexBuffer.MatricesWeightsKind, false);
            }

            mesh.setIndices(parsedGeometry.indices);
        }

        // SubMeshes
        if (parsedGeometry.subMeshes) {
            mesh.subMeshes = [];
            for (var subIndex = 0; subIndex < parsedGeometry.subMeshes.length; subIndex++) {
                var parsedSubMesh = parsedGeometry.subMeshes[subIndex];

                var subMesh = new BABYLON.SubMesh(parsedSubMesh.materialIndex, parsedSubMesh.verticesStart, parsedSubMesh.verticesCount, parsedSubMesh.indexStart, parsedSubMesh.indexCount, mesh);
            }
        }

        // Update
        mesh.computeWorldMatrix(true);

        // Flat shading
        if (mesh._shouldGenerateFlatShading) {
            mesh.convertToFlatShadedMesh();
            delete mesh._shouldGenerateFlatShading;
        }

        var scene = mesh.getScene();
        if (scene._selectionOctree) {
            scene._selectionOctree.addMesh(mesh);
        }
    };

    BABYLON.SceneLoader.RegisterPlugin({
        extensions: ".babylon",
        importMesh: function (meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons) {
            var parsedData = JSON.parse(data);

            var loadedSkeletonsIds = [];
            var loadedMaterialsIds = [];
            var hierarchyIds = [];
            for (var index = 0; index < parsedData.meshes.length; index++) {
                var parsedMesh = parsedData.meshes[index];

                if (!meshesNames || isDescendantOf(parsedMesh, meshesNames, hierarchyIds)) {
                    if (meshesNames instanceof Array) {
                        // Remove found mesh name from list.
                        delete meshesNames[meshesNames.indexOf(parsedMesh.name)];
                    }

                    // Material ?
                    if (parsedMesh.materialId) {
                        var materialFound = (loadedMaterialsIds.indexOf(parsedMesh.materialId) !== -1);

                        if (!materialFound) {
                            for (var multimatIndex = 0; multimatIndex < parsedData.multiMaterials.length; multimatIndex++) {
                                var parsedMultiMaterial = parsedData.multiMaterials[multimatIndex];
                                if (parsedMultiMaterial.id == parsedMesh.materialId) {
                                    for (var matIndex = 0; matIndex < parsedMultiMaterial.materials.length; matIndex++) {
                                        var subMatId = parsedMultiMaterial.materials[matIndex];
                                        loadedMaterialsIds.push(subMatId);
                                        parseMaterialById(subMatId, parsedData, scene, rootUrl);
                                    }

                                    loadedMaterialsIds.push(parsedMultiMaterial.id);
                                    parseMultiMaterial(parsedMultiMaterial, scene);
                                    materialFound = true;
                                    break;
                                }
                            }
                        }

                        if (!materialFound) {
                            loadedMaterialsIds.push(parsedMesh.materialId);
                            parseMaterialById(parsedMesh.materialId, parsedData, scene, rootUrl);
                        }
                    }

                    // Skeleton ?
                    if (parsedMesh.skeletonId > -1 && scene.skeletons) {
                        var skeletonAlreadyLoaded = (loadedSkeletonsIds.indexOf(parsedMesh.skeletonId) > -1);

                        if (!skeletonAlreadyLoaded) {
                            for (var skeletonIndex = 0; skeletonIndex < parsedData.skeletons.length; skeletonIndex++) {
                                var parsedSkeleton = parsedData.skeletons[skeletonIndex];

                                if (parsedSkeleton.id === parsedMesh.skeletonId) {
                                    skeletons.push(parseSkeleton(parsedSkeleton, scene));
                                    loadedSkeletonsIds.push(parsedSkeleton.id);
                                }
                            }
                        }
                    }

                    var mesh = parseMesh(parsedMesh, scene, rootUrl);
                    meshes.push(mesh);
                }
            }

            // Particles
            if (parsedData.particleSystems) {
                for (var index = 0; index < parsedData.particleSystems.length; index++) {
                    var parsedParticleSystem = parsedData.particleSystems[index];

                    if (hierarchyIds.indexOf(parsedParticleSystem.emitterId) !== -1) {
                        particleSystems.push(parseParticleSystem(parsedParticleSystem, scene, rootUrl));
                    }
                }
            }

            return true;
        },
        load: function (scene, data, rootUrl) {
            var parsedData = JSON.parse(data);

            // Scene
            scene.useDelayedTextureLoading = parsedData.useDelayedTextureLoading;
            scene.autoClear = parsedData.autoClear;
            scene.clearColor = BABYLON.Color3.FromArray(parsedData.clearColor);
            scene.ambientColor = BABYLON.Color3.FromArray(parsedData.ambientColor);
            scene.gravity = BABYLON.Vector3.FromArray(parsedData.gravity);

            // Fog
            if (parsedData.fogMode && parsedData.fogMode !== 0) {
                scene.fogMode = parsedData.fogMode;
                scene.fogColor = BABYLON.Color3.FromArray(parsedData.fogColor);
                scene.fogStart = parsedData.fogStart;
                scene.fogEnd = parsedData.fogEnd;
                scene.fogDensity = parsedData.fogDensity;
            }

            // Lights
            for (var index = 0; index < parsedData.lights.length; index++) {
                var parsedLight = parsedData.lights[index];
                parseLight(parsedLight, scene);
            }

            // Cameras
            for (var index = 0; index < parsedData.cameras.length; index++) {
                var parsedCamera = parsedData.cameras[index];
                parseCamera(parsedCamera, scene);
            }

            if (parsedData.activeCameraID) {
                scene.setActiveCameraByID(parsedData.activeCameraID);
            }

            // Materials
            if (parsedData.materials) {
                for (var index = 0; index < parsedData.materials.length; index++) {
                    var parsedMaterial = parsedData.materials[index];
                    parseMaterial(parsedMaterial, scene, rootUrl);
                }
            }

            if (parsedData.multiMaterials) {
                for (var index = 0; index < parsedData.multiMaterials.length; index++) {
                    var parsedMultiMaterial = parsedData.multiMaterials[index];
                    parseMultiMaterial(parsedMultiMaterial, scene);
                }
            }

            // Skeletons
            if (parsedData.skeletons) {
                for (var index = 0; index < parsedData.skeletons.length; index++) {
                    var parsedSkeleton = parsedData.skeletons[index];
                    parseSkeleton(parsedSkeleton, scene);
                }
            }

            // Meshes
            for (var index = 0; index < parsedData.meshes.length; index++) {
                var parsedMesh = parsedData.meshes[index];
                parseMesh(parsedMesh, scene, rootUrl);
            }

            // Connecting cameras parents and locked target
            for (var index = 0; index < scene.cameras.length; index++) {
                var camera = scene.cameras[index];
                if (camera._waitingParentId) {
                    camera.parent = scene.getLastEntryByID(camera._waitingParentId);
                    delete camera._waitingParentId;
                }

                if (camera._waitingLockedTargetId) {
                    camera.lockedTarget = scene.getLastEntryByID(camera._waitingLockedTargetId);
                    delete camera._waitingLockedTargetId;
                }
            }

            // Particles Systems
            if (parsedData.particleSystems) {
                for (var index = 0; index < parsedData.particleSystems.length; index++) {
                    var parsedParticleSystem = parsedData.particleSystems[index];
                    parseParticleSystem(parsedParticleSystem, scene, rootUrl);
                }
            }

            // Lens flares
            if (parsedData.lensFlareSystems) {
                for (var index = 0; index < parsedData.lensFlareSystems.length; index++) {
                    var parsedLensFlareSystem = parsedData.lensFlareSystems[index];
                    parseLensFlareSystem(parsedLensFlareSystem, scene, rootUrl);
                }
            }

            // Shadows
            if (parsedData.shadowGenerators) {
                for (var index = 0; index < parsedData.shadowGenerators.length; index++) {
                    var parsedShadowGenerator = parsedData.shadowGenerators[index];

                    parseShadowGenerator(parsedShadowGenerator, scene);
                }
            }

            // Finish
            return true;
        }
    });

})();