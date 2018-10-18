module BABYLON {
    var parseMaterialById = (id: string, parsedData: any, scene: Scene, rootUrl: string) => {
        for (var index = 0, cache = parsedData.materials.length; index < cache; index++) {
            var parsedMaterial = parsedData.materials[index];
            if (parsedMaterial.id === id) {
                return Material.Parse(parsedMaterial, scene, rootUrl);
            }
        }
        return null;
    };

    var isDescendantOf = (mesh: any, names: Array<any>, hierarchyIds: Array<number>) => {
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

    var logOperation = (operation: string, producer: { file: string, name: string, version: string, exporter_version: string }) => {
        return operation + " of " + (producer ? producer.file + " from " + producer.name + " version: " + producer.version + ", exporter version: " + producer.exporter_version : "unknown");
    };

    var loadAssetContainer = (scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void, addToScene = false): AssetContainer => {
        var container = new AssetContainer(scene);

        // Entire method running in try block, so ALWAYS logs as far as it got, only actually writes details
        // when SceneLoader.debugLogging = true (default), or exception encountered.
        // Everything stored in var log instead of writing separate lines to support only writing in exception,
        // and avoid problems with multiple concurrent .babylon loads.
        var log = "importScene has failed JSON parse";
        try {
            var parsedData = JSON.parse(data);
            log = "";
            var fullDetails = SceneLoader.loggingLevel === SceneLoader.DETAILED_LOGGING;

            var index: number;
            var cache: number;
            // Lights
            if (parsedData.lights !== undefined && parsedData.lights !== null) {
                for (index = 0, cache = parsedData.lights.length; index < cache; index++) {
                    var parsedLight = parsedData.lights[index];
                    var light = Light.Parse(parsedLight, scene);
                    if (light) {
                        container.lights.push(light);
                        log += (index === 0 ? "\n\tLights:" : "");
                        log += "\n\t\t" + light.toString(fullDetails);
                    }
                }
            }

            // Animations
            if (parsedData.animations !== undefined && parsedData.animations !== null) {
                for (index = 0, cache = parsedData.animations.length; index < cache; index++) {
                    var parsedAnimation = parsedData.animations[index];
                    var animation = Animation.Parse(parsedAnimation);
                    scene.animations.push(animation);
                    container.animations.push(animation);
                    log += (index === 0 ? "\n\tAnimations:" : "");
                    log += "\n\t\t" + animation.toString(fullDetails);
                }
            }

            // Materials
            if (parsedData.materials !== undefined && parsedData.materials !== null) {
                for (index = 0, cache = parsedData.materials.length; index < cache; index++) {
                    var parsedMaterial = parsedData.materials[index];
                    var mat = Material.Parse(parsedMaterial, scene, rootUrl);
                    container.materials.push(mat);
                    log += (index === 0 ? "\n\tMaterials:" : "");
                    log += "\n\t\t" + mat.toString(fullDetails);
                }
            }

            if (parsedData.multiMaterials !== undefined && parsedData.multiMaterials !== null) {
                for (index = 0, cache = parsedData.multiMaterials.length; index < cache; index++) {
                    var parsedMultiMaterial = parsedData.multiMaterials[index];
                    var mmat = Material.ParseMultiMaterial(parsedMultiMaterial, scene);
                    container.multiMaterials.push(mmat);
                    log += (index === 0 ? "\n\tMultiMaterials:" : "");
                    log += "\n\t\t" + mmat.toString(fullDetails);
                }
            }

            // Morph targets
            if (parsedData.morphTargetManagers !== undefined && parsedData.morphTargetManagers !== null) {
                for (var managerData of parsedData.morphTargetManagers) {
                    container.morphTargetManagers.push(MorphTargetManager.Parse(managerData, scene));
                }
            }

            // Skeletons
            if (parsedData.skeletons !== undefined && parsedData.skeletons !== null) {
                for (index = 0, cache = parsedData.skeletons.length; index < cache; index++) {
                    var parsedSkeleton = parsedData.skeletons[index];
                    var skeleton = Skeleton.Parse(parsedSkeleton, scene);
                    container.skeletons.push(skeleton);
                    log += (index === 0 ? "\n\tSkeletons:" : "");
                    log += "\n\t\t" + skeleton.toString(fullDetails);
                }
            }

            // Geometries
            var geometries = parsedData.geometries;
            if (geometries !== undefined && geometries !== null) {
                var addedGeometry = new Array<Nullable<Geometry>>();
                // Boxes
                var boxes = geometries.boxes;
                if (boxes !== undefined && boxes !== null) {
                    for (index = 0, cache = boxes.length; index < cache; index++) {
                        var parsedBox = boxes[index];
                        addedGeometry.push(BoxGeometry.Parse(parsedBox, scene));
                    }
                }

                // Spheres
                var spheres = geometries.spheres;
                if (spheres !== undefined && spheres !== null) {
                    for (index = 0, cache = spheres.length; index < cache; index++) {
                        var parsedSphere = spheres[index];
                        addedGeometry.push(SphereGeometry.Parse(parsedSphere, scene));
                    }
                }

                // Cylinders
                var cylinders = geometries.cylinders;
                if (cylinders !== undefined && cylinders !== null) {
                    for (index = 0, cache = cylinders.length; index < cache; index++) {
                        var parsedCylinder = cylinders[index];
                        addedGeometry.push(CylinderGeometry.Parse(parsedCylinder, scene));
                    }
                }

                // Toruses
                var toruses = geometries.toruses;
                if (toruses !== undefined && toruses !== null) {
                    for (index = 0, cache = toruses.length; index < cache; index++) {
                        var parsedTorus = toruses[index];
                        addedGeometry.push(TorusGeometry.Parse(parsedTorus, scene));
                    }
                }

                // Grounds
                var grounds = geometries.grounds;
                if (grounds !== undefined && grounds !== null) {
                    for (index = 0, cache = grounds.length; index < cache; index++) {
                        var parsedGround = grounds[index];
                        addedGeometry.push(GroundGeometry.Parse(parsedGround, scene));
                    }
                }

                // Planes
                var planes = geometries.planes;
                if (planes !== undefined && planes !== null) {
                    for (index = 0, cache = planes.length; index < cache; index++) {
                        var parsedPlane = planes[index];
                        addedGeometry.push(PlaneGeometry.Parse(parsedPlane, scene));
                    }
                }

                // TorusKnots
                var torusKnots = geometries.torusKnots;
                if (torusKnots !== undefined && torusKnots !== null) {
                    for (index = 0, cache = torusKnots.length; index < cache; index++) {
                        var parsedTorusKnot = torusKnots[index];
                        addedGeometry.push(TorusKnotGeometry.Parse(parsedTorusKnot, scene));
                    }
                }

                // VertexData
                var vertexData = geometries.vertexData;
                if (vertexData !== undefined && vertexData !== null) {
                    for (index = 0, cache = vertexData.length; index < cache; index++) {
                        var parsedVertexData = vertexData[index];
                        addedGeometry.push(Geometry.Parse(parsedVertexData, scene, rootUrl));
                    }
                }

                addedGeometry.forEach((g) => {
                    if (g) {
                        container.geometries.push(g);
                    }
                });
            }

            // Transform nodes
            if (parsedData.transformNodes !== undefined && parsedData.transformNodes !== null) {
                for (index = 0, cache = parsedData.transformNodes.length; index < cache; index++) {
                    var parsedTransformNode = parsedData.transformNodes[index];
                    var node = TransformNode.Parse(parsedTransformNode, scene, rootUrl);
                    container.transformNodes.push(node);
                }
            }

            // Meshes
            if (parsedData.meshes !== undefined && parsedData.meshes !== null) {
                for (index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                    var parsedMesh = parsedData.meshes[index];
                    var mesh = <AbstractMesh>Mesh.Parse(parsedMesh, scene, rootUrl);
                    container.meshes.push(mesh);
                    log += (index === 0 ? "\n\tMeshes:" : "");
                    log += "\n\t\t" + mesh.toString(fullDetails);
                }
            }

            // Cameras
            if (parsedData.cameras !== undefined && parsedData.cameras !== null) {
                for (index = 0, cache = parsedData.cameras.length; index < cache; index++) {
                    var parsedCamera = parsedData.cameras[index];
                    var camera = Camera.Parse(parsedCamera, scene);
                    container.cameras.push(camera);
                    log += (index === 0 ? "\n\tCameras:" : "");
                    log += "\n\t\t" + camera.toString(fullDetails);
                }
            }

            // Animation Groups
            if (parsedData.animationGroups !== undefined && parsedData.animationGroups !== null) {
                for (index = 0, cache = parsedData.animationGroups.length; index < cache; index++) {
                    var parsedAnimationGroup = parsedData.animationGroups[index];
                    var animationGroup = AnimationGroup.Parse(parsedAnimationGroup, scene);
                    container.animationGroups.push(animationGroup);
                    log += (index === 0 ? "\n\tAnimationGroups:" : "");
                    log += "\n\t\t" + animationGroup.toString(fullDetails);
                }
            }

            // Browsing all the graph to connect the dots
            for (index = 0, cache = scene.cameras.length; index < cache; index++) {
                var camera = scene.cameras[index];
                if (camera._waitingParentId) {
                    camera.parent = scene.getLastEntryByID(camera._waitingParentId);
                    camera._waitingParentId = null;
                }
            }

            for (index = 0, cache = scene.lights.length; index < cache; index++) {
                let light = scene.lights[index];
                if (light && light._waitingParentId) {
                    light.parent = scene.getLastEntryByID(light._waitingParentId);
                    light._waitingParentId = null;
                }
            }

            // Connect parents & children and parse actions
            for (index = 0, cache = scene.transformNodes.length; index < cache; index++) {
                var transformNode = scene.transformNodes[index];
                if (transformNode._waitingParentId) {
                    transformNode.parent = scene.getLastEntryByID(transformNode._waitingParentId);
                    transformNode._waitingParentId = null;
                }
            }
            for (index = 0, cache = scene.meshes.length; index < cache; index++) {
                var mesh = scene.meshes[index];
                if (mesh._waitingParentId) {
                    mesh.parent = scene.getLastEntryByID(mesh._waitingParentId);
                    mesh._waitingParentId = null;
                }
            }

            // freeze world matrix application
            for (index = 0, cache = scene.meshes.length; index < cache; index++) {
                var currentMesh = scene.meshes[index];
                if (currentMesh._waitingFreezeWorldMatrix) {
                    currentMesh.freezeWorldMatrix();
                    currentMesh._waitingFreezeWorldMatrix = null;
                } else {
                    currentMesh.computeWorldMatrix(true);
                }
            }

            // Lights exclusions / inclusions
            for (index = 0, cache = scene.lights.length; index < cache; index++) {
                let light = scene.lights[index];
                // Excluded check
                if (light._excludedMeshesIds.length > 0) {
                    for (var excludedIndex = 0; excludedIndex < light._excludedMeshesIds.length; excludedIndex++) {
                        var excludedMesh = scene.getMeshByID(light._excludedMeshesIds[excludedIndex]);

                        if (excludedMesh) {
                            light.excludedMeshes.push(excludedMesh);
                        }
                    }

                    light._excludedMeshesIds = [];
                }

                // Included check
                if (light._includedOnlyMeshesIds.length > 0) {
                    for (var includedOnlyIndex = 0; includedOnlyIndex < light._includedOnlyMeshesIds.length; includedOnlyIndex++) {
                        var includedOnlyMesh = scene.getMeshByID(light._includedOnlyMeshesIds[includedOnlyIndex]);

                        if (includedOnlyMesh) {
                            light.includedOnlyMeshes.push(includedOnlyMesh);
                        }
                    }

                    light._includedOnlyMeshesIds = [];
                }
            }

            AbstractScene.Parse(parsedData, scene, container, rootUrl);

            // Actions (scene) Done last as it can access other objects.
            for (index = 0, cache = scene.meshes.length; index < cache; index++) {
                var mesh = scene.meshes[index];
                if (mesh._waitingActions) {
                    ActionManager.Parse(mesh._waitingActions, mesh, scene);
                    mesh._waitingActions = null;
                }
            }
            if (parsedData.actions !== undefined && parsedData.actions !== null) {
                ActionManager.Parse(parsedData.actions, null, scene);
            }

            if (!addToScene) {
                container.removeAllFromScene();
            }
        } catch (err) {
            let msg = logOperation("loadAssets", parsedData ? parsedData.producer : "Unknown") + log;
            if (onError) {
                onError(msg, err);
            } else {
                Tools.Log(msg);
                throw err;
            }
        } finally {
            if (log !== null && SceneLoader.loggingLevel !== SceneLoader.NO_LOGGING) {
                Tools.Log(logOperation("loadAssets", parsedData ? parsedData.producer : "Unknown") + (SceneLoader.loggingLevel !== SceneLoader.MINIMAL_LOGGING ? log : ""));
            }
        }

        return container;
    };

    SceneLoader.RegisterPlugin({
        name: "babylon.js",
        extensions: ".babylon",
        canDirectLoad: (data: string) => {
            if (data.indexOf("babylon") !== -1) { // We consider that the producer string is filled
                return true;
            }

            return false;
        },
        importMesh: (meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: IParticleSystem[], skeletons: Skeleton[], onError?: (message: string, exception?: any) => void): boolean => {
            // Entire method running in try block, so ALWAYS logs as far as it got, only actually writes details
            // when SceneLoader.debugLogging = true (default), or exception encountered.
            // Everything stored in var log instead of writing separate lines to support only writing in exception,
            // and avoid problems with multiple concurrent .babylon loads.
            var log = "importMesh has failed JSON parse";
            try {
                var parsedData = JSON.parse(data);
                log = "";
                var fullDetails = SceneLoader.loggingLevel === SceneLoader.DETAILED_LOGGING;
                if (!meshesNames) {
                    meshesNames = null;
                } else if (!Array.isArray(meshesNames)) {
                    meshesNames = [meshesNames];
                }

                var hierarchyIds = new Array<number>();
                if (parsedData.meshes !== undefined && parsedData.meshes !== null) {
                    var loadedSkeletonsIds = [];
                    var loadedMaterialsIds = [];
                    var index: number;
                    var cache: number;
                    for (index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                        var parsedMesh = parsedData.meshes[index];

                        if (meshesNames === null || isDescendantOf(parsedMesh, meshesNames, hierarchyIds)) {
                            if (meshesNames !== null) {
                                // Remove found mesh name from list.
                                delete meshesNames[meshesNames.indexOf(parsedMesh.name)];
                            }

                            //Geometry?
                            if (parsedMesh.geometryId !== undefined && parsedMesh.geometryId !== null) {
                                //does the file contain geometries?
                                if (parsedData.geometries !== undefined && parsedData.geometries !== null) {
                                    //find the correct geometry and add it to the scene
                                    var found: boolean = false;
                                    ["boxes", "spheres", "cylinders", "toruses", "grounds", "planes", "torusKnots", "vertexData"].forEach((geometryType: string) => {
                                        if (found === true || !parsedData.geometries[geometryType] || !(Array.isArray(parsedData.geometries[geometryType]))) {
                                            return;
                                        } else {
                                            parsedData.geometries[geometryType].forEach((parsedGeometryData: any) => {
                                                if (parsedGeometryData.id === parsedMesh.geometryId) {
                                                    switch (geometryType) {
                                                        case "boxes":
                                                            BoxGeometry.Parse(parsedGeometryData, scene);
                                                            break;
                                                        case "spheres":
                                                            SphereGeometry.Parse(parsedGeometryData, scene);
                                                            break;
                                                        case "cylinders":
                                                            CylinderGeometry.Parse(parsedGeometryData, scene);
                                                            break;
                                                        case "toruses":
                                                            TorusGeometry.Parse(parsedGeometryData, scene);
                                                            break;
                                                        case "grounds":
                                                            GroundGeometry.Parse(parsedGeometryData, scene);
                                                            break;
                                                        case "planes":
                                                            PlaneGeometry.Parse(parsedGeometryData, scene);
                                                            break;
                                                        case "torusKnots":
                                                            TorusKnotGeometry.Parse(parsedGeometryData, scene);
                                                            break;
                                                        case "vertexData":
                                                            Geometry.Parse(parsedGeometryData, scene, rootUrl);
                                                            break;
                                                    }
                                                    found = true;
                                                }
                                            });

                                        }
                                    });
                                    if (found === false) {
                                        Tools.Warn("Geometry not found for mesh " + parsedMesh.id);
                                    }
                                }
                            }

                            // Material ?
                            if (parsedMesh.materialId) {
                                var materialFound = (loadedMaterialsIds.indexOf(parsedMesh.materialId) !== -1);
                                if (materialFound === false && parsedData.multiMaterials !== undefined && parsedData.multiMaterials !== null) {
                                    for (var multimatIndex = 0, multimatCache = parsedData.multiMaterials.length; multimatIndex < multimatCache; multimatIndex++) {
                                        var parsedMultiMaterial = parsedData.multiMaterials[multimatIndex];
                                        if (parsedMultiMaterial.id === parsedMesh.materialId) {
                                            for (var matIndex = 0, matCache = parsedMultiMaterial.materials.length; matIndex < matCache; matIndex++) {
                                                var subMatId = parsedMultiMaterial.materials[matIndex];
                                                loadedMaterialsIds.push(subMatId);
                                                var mat = parseMaterialById(subMatId, parsedData, scene, rootUrl);
                                                if (mat) {
                                                    log += "\n\tMaterial " + mat.toString(fullDetails);
                                                }
                                            }
                                            loadedMaterialsIds.push(parsedMultiMaterial.id);
                                            var mmat = Material.ParseMultiMaterial(parsedMultiMaterial, scene);
                                            if (mmat) {
                                                materialFound = true;
                                                log += "\n\tMulti-Material " + mmat.toString(fullDetails);
                                            }
                                            break;
                                        }
                                    }
                                }

                                if (materialFound === false) {
                                    loadedMaterialsIds.push(parsedMesh.materialId);
                                    var mat = parseMaterialById(parsedMesh.materialId, parsedData, scene, rootUrl);
                                    if (!mat) {
                                        Tools.Warn("Material not found for mesh " + parsedMesh.id);
                                    } else {
                                        log += "\n\tMaterial " + mat.toString(fullDetails);
                                    }
                                }
                            }

                            // Skeleton ?
                            if (parsedMesh.skeletonId > -1 && parsedData.skeletons !== undefined && parsedData.skeletons !== null) {
                                var skeletonAlreadyLoaded = (loadedSkeletonsIds.indexOf(parsedMesh.skeletonId) > -1);
                                if (skeletonAlreadyLoaded === false) {
                                    for (var skeletonIndex = 0, skeletonCache = parsedData.skeletons.length; skeletonIndex < skeletonCache; skeletonIndex++) {
                                        var parsedSkeleton = parsedData.skeletons[skeletonIndex];
                                        if (parsedSkeleton.id === parsedMesh.skeletonId) {
                                            var skeleton = Skeleton.Parse(parsedSkeleton, scene);
                                            skeletons.push(skeleton);
                                            loadedSkeletonsIds.push(parsedSkeleton.id);
                                            log += "\n\tSkeleton " + skeleton.toString(fullDetails);
                                        }
                                    }
                                }
                            }

                            // Morph targets ?
                            if (parsedData.morphTargetManagers !== undefined && parsedData.morphTargetManagers !== null) {
                                for (var managerData of parsedData.morphTargetManagers) {
                                    MorphTargetManager.Parse(managerData, scene);
                                }
                            }

                            var mesh = Mesh.Parse(parsedMesh, scene, rootUrl);
                            meshes.push(mesh);
                            log += "\n\tMesh " + mesh.toString(fullDetails);
                        }
                    }

                    // Connecting parents
                    var currentMesh: AbstractMesh;
                    for (index = 0, cache = scene.meshes.length; index < cache; index++) {
                        currentMesh = scene.meshes[index];
                        if (currentMesh._waitingParentId) {
                            currentMesh.parent = scene.getLastEntryByID(currentMesh._waitingParentId);
                            currentMesh._waitingParentId = null;
                        }
                    }

                    // freeze and compute world matrix application
                    for (index = 0, cache = scene.meshes.length; index < cache; index++) {
                        currentMesh = scene.meshes[index];
                        if (currentMesh._waitingFreezeWorldMatrix) {
                            currentMesh.freezeWorldMatrix();
                            currentMesh._waitingFreezeWorldMatrix = null;
                        } else {
                            currentMesh.computeWorldMatrix(true);
                        }
                    }
                }

                // Particles
                if (parsedData.particleSystems !== undefined && parsedData.particleSystems !== null) {
                    let parser = AbstractScene.GetIndividualParser(SceneComponentConstants.NAME_PARTICLESYSTEM);
                    if (parser) {
                        for (index = 0, cache = parsedData.particleSystems.length; index < cache; index++) {
                            var parsedParticleSystem = parsedData.particleSystems[index];
                            if (hierarchyIds.indexOf(parsedParticleSystem.emitterId) !== -1) {
                                particleSystems.push(parser(parsedParticleSystem, scene, rootUrl));
                            }
                        }
                    }
                }

                return true;

            } catch (err) {
                let msg = logOperation("importMesh", parsedData ? parsedData.producer : "Unknown") + log;
                if (onError) {
                    onError(msg, err);
                } else {
                    Tools.Log(msg);
                    throw err;
                }
            } finally {
                if (log !== null && SceneLoader.loggingLevel !== SceneLoader.NO_LOGGING) {
                    Tools.Log(logOperation("importMesh", parsedData ? parsedData.producer : "Unknown") + (SceneLoader.loggingLevel !== SceneLoader.MINIMAL_LOGGING ? log : ""));
                }
            }

            return false;
        },
        load: (scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void): boolean => {
            // Entire method running in try block, so ALWAYS logs as far as it got, only actually writes details
            // when SceneLoader.debugLogging = true (default), or exception encountered.
            // Everything stored in var log instead of writing separate lines to support only writing in exception,
            // and avoid problems with multiple concurrent .babylon loads.
            var log = "importScene has failed JSON parse";
            try {
                var parsedData = JSON.parse(data);
                log = "";

                // Scene
                if (parsedData.useDelayedTextureLoading !== undefined && parsedData.useDelayedTextureLoading !== null) {
                    scene.useDelayedTextureLoading = parsedData.useDelayedTextureLoading && !SceneLoader.ForceFullSceneLoadingForIncremental;
                }
                if (parsedData.autoClear !== undefined && parsedData.autoClear !== null) {
                    scene.autoClear = parsedData.autoClear;
                }
                if (parsedData.clearColor !== undefined && parsedData.clearColor !== null) {
                    scene.clearColor = Color4.FromArray(parsedData.clearColor);
                }
                if (parsedData.ambientColor !== undefined && parsedData.ambientColor !== null) {
                    scene.ambientColor = Color3.FromArray(parsedData.ambientColor);
                }
                if (parsedData.gravity !== undefined && parsedData.gravity !== null) {
                    scene.gravity = Vector3.FromArray(parsedData.gravity);
                }

                // Fog
                if (parsedData.fogMode && parsedData.fogMode !== 0) {
                    scene.fogMode = parsedData.fogMode;
                    scene.fogColor = Color3.FromArray(parsedData.fogColor);
                    scene.fogStart = parsedData.fogStart;
                    scene.fogEnd = parsedData.fogEnd;
                    scene.fogDensity = parsedData.fogDensity;
                    log += "\tFog mode for scene:  ";
                    switch (scene.fogMode) {
                        // getters not compiling, so using hardcoded
                        case 1: log += "exp\n"; break;
                        case 2: log += "exp2\n"; break;
                        case 3: log += "linear\n"; break;
                    }
                }

                //Physics
                if (parsedData.physicsEnabled) {
                    var physicsPlugin;
                    if (parsedData.physicsEngine === "cannon") {
                        physicsPlugin = new CannonJSPlugin();
                    } else if (parsedData.physicsEngine === "oimo") {
                        physicsPlugin = new OimoJSPlugin();
                    }
                    log = "\tPhysics engine " + (parsedData.physicsEngine ? parsedData.physicsEngine : "oimo") + " enabled\n";
                    //else - default engine, which is currently oimo
                    var physicsGravity = parsedData.physicsGravity ? Vector3.FromArray(parsedData.physicsGravity) : null;
                    scene.enablePhysics(physicsGravity, physicsPlugin);
                }

                // Metadata
                if (parsedData.metadata !== undefined && parsedData.metadata !== null) {
                    scene.metadata = parsedData.metadata;
                }

                //collisions, if defined. otherwise, default is true
                if (parsedData.collisionsEnabled !== undefined && parsedData.collisionsEnabled !== null) {
                    scene.collisionsEnabled = parsedData.collisionsEnabled;
                }
                scene.workerCollisions = !!parsedData.workerCollisions;

                var container = loadAssetContainer(scene, data, rootUrl, onError, true);
                if (!container) {
                    return false;
                }

                if (parsedData.autoAnimate) {
                    scene.beginAnimation(scene, parsedData.autoAnimateFrom, parsedData.autoAnimateTo, parsedData.autoAnimateLoop, parsedData.autoAnimateSpeed || 1.0);
                }

                if (parsedData.activeCameraID !== undefined && parsedData.activeCameraID !== null) {
                    scene.setActiveCameraByID(parsedData.activeCameraID);
                }

                // Environment texture
                if (parsedData.environmentTexture !== undefined && parsedData.environmentTexture !== null) {
                    if (parsedData.environmentTextureType && parsedData.environmentTextureType === "BABYLON.HDRCubeTexture") {
                        var hdrSize: number = (parsedData.environmentTextureSize) ? parsedData.environmentTextureSize : 128;
                        var hdrTexture = new HDRCubeTexture(rootUrl + parsedData.environmentTexture, scene, hdrSize);
                        if (parsedData.environmentTextureRotationY) {
                            hdrTexture.rotationY = parsedData.environmentTextureRotationY;
                        }
                        scene.environmentTexture = hdrTexture;
                    } else {
                        var cubeTexture = CubeTexture.CreateFromPrefilteredData(rootUrl + parsedData.environmentTexture, scene);
                        if (parsedData.environmentTextureRotationY) {
                            cubeTexture.rotationY = parsedData.environmentTextureRotationY;
                        }
                        scene.environmentTexture = cubeTexture;
                    }
                    if (parsedData.createDefaultSkybox === true) {
                        var skyboxScale = (scene.activeCamera !== undefined && scene.activeCamera !== null) ? (scene.activeCamera.maxZ - scene.activeCamera.minZ) / 2 : 1000;
                        var skyboxBlurLevel = parsedData.skyboxBlurLevel || 0;
                        scene.createDefaultSkybox(undefined, true, skyboxScale, skyboxBlurLevel);
                    }
                }
                // Finish
                return true;
            } catch (err) {
                let msg = logOperation("importScene", parsedData ? parsedData.producer : "Unknown") + log;
                if (onError) {
                    onError(msg, err);
                } else {
                    Tools.Log(msg);
                    throw err;
                }
            } finally {
                if (log !== null && SceneLoader.loggingLevel !== SceneLoader.NO_LOGGING) {
                    Tools.Log(logOperation("importScene", parsedData ? parsedData.producer : "Unknown") + (SceneLoader.loggingLevel !== SceneLoader.MINIMAL_LOGGING ? log : ""));
                }
            }
            return false;
        },
        loadAssetContainer: (scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void): AssetContainer => {
            var container = loadAssetContainer(scene, data, rootUrl, onError);
            return container;
        }
    });
}
