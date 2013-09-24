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

    var parseParticleSystem = function (parsedParticleSystem, scene, rootUrl) {
        var emitter = scene.getLastMeshByID(parsedParticleSystem.emitterId);

        var particleSystem = new BABYLON.ParticleSystem("particles#" + emitter.name, parsedParticleSystem.capacity, scene);
        if (parsedParticleSystem.textureName) {
            particleSystem.particleTexture = new BABYLON.Texture(rootUrl + parsedParticleSystem.textureName, scene);
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

    var parseMesh = function (parsedMesh, scene, rootUrl) {
        var mesh = new BABYLON.Mesh(parsedMesh.name, scene);
        mesh.id = parsedMesh.id;

        mesh.position = BABYLON.Vector3.FromArray(parsedMesh.position);
        if (parsedMesh.rotation.length == 3) {
            mesh.rotation = BABYLON.Vector3.FromArray(parsedMesh.rotation);
        } else {
            mesh.rotationQuaternion = BABYLON.Quaternion.FromArray(parsedMesh.rotation);
        }
        mesh.scaling = BABYLON.Vector3.FromArray(parsedMesh.scaling);
        
        if (parsedMesh.localMatrix) {
            mesh.setPivotMatrix(BABYLON.Matrix.FromArray(parsedMesh.localMatrix));
        }

        mesh.setEnabled(parsedMesh.isEnabled);
        mesh.isVisible = parsedMesh.isVisible;

        mesh.receiveShadows = parsedMesh.receiveShadows;

        mesh.billboardMode = parsedMesh.billboardMode;

        if (parsedMesh.visibility !== undefined) {
            mesh.visibility = parsedMesh.visibility;
        }

        mesh.checkCollisions = parsedMesh.checkCollisions;

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

        } else {
            BABYLON.SceneLoader._ImportGeometry(parsedMesh, mesh);
        }

        // Parent
        if (parsedMesh.parentId) {
            mesh.parent = scene.getLastMeshByID(parsedMesh.parentId);
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

    var isDescendantOf = function (mesh, name, hierarchyIds) {
        if (mesh.name === name) {
            hierarchyIds.push(mesh.id);
            return true;
        }

        if (mesh.parentId && hierarchyIds.indexOf(mesh.parentId) !== -1) {
            hierarchyIds.push(mesh.id);
            return true;
        }

        return false;
    };

    BABYLON.SceneLoader = {
        _ImportGeometry: function (parsedGeometry, mesh) {
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
                    var floatIndices = [];

                    for (var i = 0; i < parsedGeometry.matricesIndices.length; i++) {
                        var matricesIndex = parsedGeometry.matricesIndices[i];

                        floatIndices.push(matricesIndex & 0x000000FF);
                        floatIndices.push((matricesIndex & 0x0000FF00) >> 8);
                        floatIndices.push((matricesIndex & 0x00FF0000) >> 16);
                        floatIndices.push(matricesIndex >> 24);
                    }

                    mesh.setVerticesData(floatIndices, BABYLON.VertexBuffer.MatricesIndicesKind, false);
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

            var scene = mesh.getScene();
            if (scene._selectionOctree) {
                scene._selectionOctree.addMesh(mesh);
            }
        },
        ImportMesh: function (meshName, rootUrl, sceneFilename, scene, then, progressCallBack) {
            // Checking if a manifest file has been set for this scene and if offline mode has been requested
            var database = new BABYLON.Database(rootUrl + sceneFilename);
            scene.database = database;

            BABYLON.Tools.LoadFile(rootUrl + sceneFilename, function (data) {
                var parsedData = JSON.parse(data);

                // Meshes
                var meshes = [];
                var particleSystems = [];
                var skeletons = [];
                var loadedSkeletonsIds = [];
                var loadedMaterialsIds = [];
                var hierarchyIds = [];
                for (var index = 0; index < parsedData.meshes.length; index++) {
                    var parsedMesh = parsedData.meshes[index];

                    if (!meshName || isDescendantOf(parsedMesh, meshName, hierarchyIds)) {
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

                        var mesh = parseMesh(parsedMesh, scene);
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

                if (then) {
                    then(meshes, particleSystems, skeletons);
                }
            }, progressCallBack, database);
        },
        Load: function (rootUrl, sceneFilename, engine, then, progressCallBack) {
            // Checking if a manifest file has been set for this scene and if offline mode has been requested
            var database = new BABYLON.Database(rootUrl + sceneFilename);
            
            BABYLON.Tools.LoadFile(rootUrl + sceneFilename, function (data) {
                var parsedData = JSON.parse(data);
                var scene = new BABYLON.Scene(engine);
                scene.database = database;

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
                    var camera = new BABYLON.FreeCamera(parsedCamera.name, BABYLON.Vector3.FromArray(parsedCamera.position), scene);
                    camera.id = parsedCamera.id;

                    if (parsedCamera.target) {
                        camera.setTarget(BABYLON.Vector3.FromArray(parsedCamera.target));
                    } else {
                        camera.rotation = BABYLON.Vector3.FromArray(parsedCamera.rotation);
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
                }

                if (parsedData.activeCameraID) {
                    scene.activeCameraByID(parsedData.activeCameraID);
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

                // Particles Systems
                if (parsedData.particleSystems) {
                    for (var index = 0; index < parsedData.particleSystems.length; index++) {
                        var parsedParticleSystem = parsedData.particleSystems[index];
                        parseParticleSystem(parsedParticleSystem, scene, rootUrl);
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
                if (then) {
                    then(scene);
                }
            }, progressCallBack, database);
        }
    };
})();