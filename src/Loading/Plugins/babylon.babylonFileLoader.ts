module BABYLON.Internals {

    var parseMaterialById = (id, parsedData, scene, rootUrl) => {
        for (var index = 0, cache = parsedData.materials.length; index < cache; index++) {
            var parsedMaterial = parsedData.materials[index];
            if (parsedMaterial.id === id) {
                return Material.Parse(parsedMaterial, scene, rootUrl);
            }
        }
        return null;
    };

    var isDescendantOf = (mesh, names, hierarchyIds) => {
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

    SceneLoader.RegisterPlugin({
        extensions: ".babylon",
        importMesh: (meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]): boolean => {
            var parsedData = JSON.parse(data);

            var loadedSkeletonsIds = [];
            var loadedMaterialsIds = [];
            var hierarchyIds = [];
            var index: number;
			var cache: number;
            for (index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                var parsedMesh = parsedData.meshes[index];

                if (!meshesNames || isDescendantOf(parsedMesh, meshesNames, hierarchyIds)) {
                    if (meshesNames instanceof Array) {
                        // Remove found mesh name from list.
                        delete meshesNames[meshesNames.indexOf(parsedMesh.name)];
                    }

                    //Geometry?
                    if (parsedMesh.geometryId) {
                        //does the file contain geometries?
                        if (parsedData.geometries) {
                            //find the correct geometry and add it to the scene
                            var found: boolean = false;
                            ["boxes", "spheres", "cylinders", "toruses", "grounds", "planes", "torusKnots", "vertexData"].forEach((geometryType: string) => {
                                if (found || !parsedData.geometries[geometryType] || !(parsedData.geometries[geometryType] instanceof Array)) {
                                    return;
                                } else {
                                    parsedData.geometries[geometryType].forEach((parsedGeometryData) => {
                                        if (parsedGeometryData.id === parsedMesh.geometryId) {
                                            switch (geometryType) {
                                                case "boxes":
                                                    Geometry.Primitives.Box.Parse(parsedGeometryData, scene);
                                                    break;
                                                case "spheres":
                                                    Geometry.Primitives.Sphere.Parse(parsedGeometryData, scene);
                                                    break;
                                                case "cylinders":
                                                    Geometry.Primitives.Cylinder.Parse(parsedGeometryData, scene);
                                                    break;
                                                case "toruses":
                                                    Geometry.Primitives.Torus.Parse(parsedGeometryData, scene);
                                                    break;
                                                case "grounds":
                                                    Geometry.Primitives.Ground.Parse(parsedGeometryData, scene);
                                                    break;
                                                case "planes":
                                                    Geometry.Primitives.Plane.Parse(parsedGeometryData, scene);
                                                    break;
                                                case "torusKnots":
                                                    Geometry.Primitives.TorusKnot.Parse(parsedGeometryData, scene);
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
                            if (!found) {
                                Tools.Warn("Geometry not found for mesh " + parsedMesh.id);
                            }
                        }
                    }

                    // Material ?
                    if (parsedMesh.materialId) {
                        var materialFound = (loadedMaterialsIds.indexOf(parsedMesh.materialId) !== -1);
                        if (!materialFound && parsedData.multiMaterials) {
                            for (var multimatIndex = 0, multimatCache = parsedData.multiMaterials.length; multimatIndex < multimatCache; multimatIndex++) {
                                var parsedMultiMaterial = parsedData.multiMaterials[multimatIndex];
                                if (parsedMultiMaterial.id === parsedMesh.materialId) {
                                    for (var matIndex = 0, matCache = parsedMultiMaterial.materials.length; matIndex < matCache; matIndex++) {
                                        var subMatId = parsedMultiMaterial.materials[matIndex];
                                        loadedMaterialsIds.push(subMatId);
                                        parseMaterialById(subMatId, parsedData, scene, rootUrl);
                                    }
                                    loadedMaterialsIds.push(parsedMultiMaterial.id);
                                    Material.ParseMultiMaterial(parsedMultiMaterial, scene);
                                    materialFound = true;
                                    break;
                                }
                            }
                        }

                        if (!materialFound) {
                            loadedMaterialsIds.push(parsedMesh.materialId);
                            if (!parseMaterialById(parsedMesh.materialId, parsedData, scene, rootUrl)) {
                                Tools.Warn("Material not found for mesh " + parsedMesh.id);
                            }
                        }
                    }

                    // Skeleton ?
                    if (parsedMesh.skeletonId > -1 && scene.skeletons) {
                        var skeletonAlreadyLoaded = (loadedSkeletonsIds.indexOf(parsedMesh.skeletonId) > -1);
                        if (!skeletonAlreadyLoaded) {
                            for (var skeletonIndex = 0, skeletonCache = parsedData.skeletons.length; skeletonIndex < skeletonCache; skeletonIndex++) {
                                var parsedSkeleton = parsedData.skeletons[skeletonIndex];
                                if (parsedSkeleton.id === parsedMesh.skeletonId) {
                                    skeletons.push(Skeleton.Parse(parsedSkeleton, scene));
                                    loadedSkeletonsIds.push(parsedSkeleton.id);
                                }
                            }
                        }
                    }

                    var mesh = Mesh.Parse(parsedMesh, scene, rootUrl);
                    meshes.push(mesh);
                }
            }

            // Connecting parents
            var currentMesh: AbstractMesh;
            for (index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                currentMesh = scene.meshes[index];
                if (currentMesh._waitingParentId) {
                    currentMesh.parent = scene.getLastEntryByID(currentMesh._waitingParentId);
                    currentMesh._waitingParentId = undefined;
                }
            }

            // freeze world matrix application
            for (index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                currentMesh = scene.meshes[index];
                if (currentMesh._waitingFreezeWorldMatrix) {
                    currentMesh.freezeWorldMatrix();
                    currentMesh._waitingFreezeWorldMatrix = undefined;
                }
            }

            // Particles
            if (parsedData.particleSystems) {
                for (index = 0, cache = parsedData.particleSystems.length; index < cache; index++) {
                    var parsedParticleSystem = parsedData.particleSystems[index];
                    if (hierarchyIds.indexOf(parsedParticleSystem.emitterId) !== -1) {
                        particleSystems.push(ParticleSystem.Parse(parsedParticleSystem, scene, rootUrl));
                    }
                }
            }

            return true;
        },
        load: (scene: Scene, data: string, rootUrl: string): boolean => {
            var parsedData = JSON.parse(data);

            // Scene
            scene.useDelayedTextureLoading = parsedData.useDelayedTextureLoading && !BABYLON.SceneLoader.ForceFullSceneLoadingForIncremental;
            scene.autoClear = parsedData.autoClear;
            scene.clearColor = BABYLON.Color3.FromArray(parsedData.clearColor);
            scene.ambientColor = BABYLON.Color3.FromArray(parsedData.ambientColor);
            if (parsedData.gravity) {
                scene.gravity = BABYLON.Vector3.FromArray(parsedData.gravity);
            }
            
            // Fog
            if (parsedData.fogMode && parsedData.fogMode !== 0) {
                scene.fogMode = parsedData.fogMode;
                scene.fogColor = BABYLON.Color3.FromArray(parsedData.fogColor);
                scene.fogStart = parsedData.fogStart;
                scene.fogEnd = parsedData.fogEnd;
                scene.fogDensity = parsedData.fogDensity;
            }
            
            //Physics
            if (parsedData.physicsEnabled) {
                var physicsPlugin;
                if (parsedData.physicsEngine === "cannon") {
                    physicsPlugin = new BABYLON.CannonJSPlugin();
                } else if (parsedData.physicsEngine === "oimo") {
                    physicsPlugin = new BABYLON.OimoJSPlugin();
                }
                //else - default engine, which is currently oimo
                var physicsGravity = parsedData.physicsGravity ? BABYLON.Vector3.FromArray(parsedData.physicsGravity) : null;
                scene.enablePhysics(physicsGravity, physicsPlugin);
            }
            
            //collisions, if defined. otherwise, default is true
            if (parsedData.collisionsEnabled != undefined) {
                scene.collisionsEnabled = parsedData.collisionsEnabled;
            }
            scene.workerCollisions = !!parsedData.workerCollisions;            

            var index: number;
			var cache: number;
			// Lights
            for (index = 0, cache = parsedData.lights.length; index < cache; index++) {
                var parsedLight = parsedData.lights[index];
                Light.Parse(parsedLight, scene);
            }

            // Materials
            if (parsedData.materials) {
                for (index = 0, cache = parsedData.materials.length; index < cache; index++) {
                    var parsedMaterial = parsedData.materials[index];
                    Material.Parse(parsedMaterial, scene, rootUrl);
                }
            }

            if (parsedData.multiMaterials) {
                for (index = 0, cache = parsedData.multiMaterials.length; index < cache; index++) {
                    var parsedMultiMaterial = parsedData.multiMaterials[index];
                    Material.ParseMultiMaterial(parsedMultiMaterial, scene);
                }
            }

            // Skeletons
            if (parsedData.skeletons) {
                for (index = 0, cache = parsedData.skeletons.length; index < cache; index++) {
                    var parsedSkeleton = parsedData.skeletons[index];
                    Skeleton.Parse(parsedSkeleton, scene);
                }
            }

            // Geometries
            var geometries = parsedData.geometries;
            if (geometries) {
                // Boxes
                var boxes = geometries.boxes;
                if (boxes) {
                    for (index = 0, cache = boxes.length; index < cache; index++) {
                        var parsedBox = boxes[index];
                        Geometry.Primitives.Box.Parse(parsedBox, scene);
                    }
                }

                // Spheres
                var spheres = geometries.spheres;
                if (spheres) {
                    for (index = 0, cache = spheres.length; index < cache; index++) {
                        var parsedSphere = spheres[index];
                        Geometry.Primitives.Sphere.Parse(parsedSphere, scene);
                    }
                }

                // Cylinders
                var cylinders = geometries.cylinders;
                if (cylinders) {
                    for (index = 0, cache = cylinders.length; index < cache; index++) {
                        var parsedCylinder = cylinders[index];
                        Geometry.Primitives.Cylinder.Parse(parsedCylinder, scene);
                    }
                }

                // Toruses
                var toruses = geometries.toruses;
                if (toruses) {
                    for (index = 0, cache = toruses.length; index < cache; index++) {
                        var parsedTorus = toruses[index];
                        Geometry.Primitives.Torus.Parse(parsedTorus, scene);
                    }
                }

                // Grounds
                var grounds = geometries.grounds;
                if (grounds) {
                    for (index = 0, cache = grounds.length; index < cache; index++) {
                        var parsedGround = grounds[index];
                        Geometry.Primitives.Ground.Parse(parsedGround, scene);
                    }
                }

                // Planes
                var planes = geometries.planes;
                if (planes) {
                    for (index = 0, cache = planes.length; index < cache; index++) {
                        var parsedPlane = planes[index];
                        Geometry.Primitives.Plane.Parse(parsedPlane, scene);
                    }
                }

                // TorusKnots
                var torusKnots = geometries.torusKnots;
                if (torusKnots) {
                    for (index = 0, cache = torusKnots.length; index < cache; index++) {
                        var parsedTorusKnot = torusKnots[index];
                        Geometry.Primitives.TorusKnot.Parse(parsedTorusKnot, scene);
                    }
                }

                // VertexData
                var vertexData = geometries.vertexData;
                if (vertexData) {
                    for (index = 0, cache = vertexData.length; index < cache; index++) {
                        var parsedVertexData = vertexData[index];
                        Geometry.Parse(parsedVertexData, scene, rootUrl);
                    }
                }
            }

            // Meshes
            for (index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                var parsedMesh = parsedData.meshes[index];
                Mesh.Parse(parsedMesh, scene, rootUrl);
            }

            // Cameras
            for (index = 0, cache = parsedData.cameras.length; index < cache; index++) {
                var parsedCamera = parsedData.cameras[index];
                Camera.Parse(parsedCamera, scene);
            }
            if (parsedData.activeCameraID) {
                scene.setActiveCameraByID(parsedData.activeCameraID);
            }

            // Browsing all the graph to connect the dots
            for (index = 0, cache = scene.cameras.length; index < cache; index++) {
                var camera = scene.cameras[index];
                if (camera._waitingParentId) {
                    camera.parent = scene.getLastEntryByID(camera._waitingParentId);
                    camera._waitingParentId = undefined;
                }
            }

            for (index = 0, cache = scene.lights.length; index < cache; index++) {
                var light = scene.lights[index];
                if (light._waitingParentId) {
                    light.parent = scene.getLastEntryByID(light._waitingParentId);
                    light._waitingParentId = undefined;
                }
            }

            // Sounds
            if (AudioEngine && parsedData.sounds) {
                for (index = 0, cache = parsedData.sounds.length; index < cache; index++) {
                    var parsedSound = parsedData.sounds[index];
                    if (Engine.audioEngine.canUseWebAudio) {
                        Sound.Parse(parsedSound, scene, rootUrl);
                    } else {
                        var emptySound = new Sound(parsedSound.name, null, scene);
                    }
                }
            }

            // Connect parents & children and parse actions
            for (index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                var mesh = scene.meshes[index];
                if (mesh._waitingParentId) {
                    mesh.parent = scene.getLastEntryByID(mesh._waitingParentId);
                    mesh._waitingParentId = undefined;
                }
                if (mesh._waitingActions) {
                    ActionManager.Parse(mesh._waitingActions, mesh, scene);
                    mesh._waitingActions = undefined;
                }
            }

            // freeze world matrix application
            for (index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                var currentMesh = scene.meshes[index];
                if (currentMesh._waitingFreezeWorldMatrix) {
                    currentMesh.freezeWorldMatrix();
                    currentMesh._waitingFreezeWorldMatrix = undefined;
                }
            }

            // Particles Systems
            if (parsedData.particleSystems) {
                for (index = 0, cache = parsedData.particleSystems.length; index < cache; index++) {
                    var parsedParticleSystem = parsedData.particleSystems[index];
                    ParticleSystem.Parse(parsedParticleSystem, scene, rootUrl);
                }
            }

            // Lens flares
            if (parsedData.lensFlareSystems) {
                for (index = 0, cache = parsedData.lensFlareSystems.length; index < cache; index++) {
                    var parsedLensFlareSystem = parsedData.lensFlareSystems[index];
                    LensFlareSystem.Parse(parsedLensFlareSystem, scene, rootUrl);
                }
            }

            // Shadows
            if (parsedData.shadowGenerators) {
                for (index = 0, cache = parsedData.shadowGenerators.length; index < cache; index++) {
                    var parsedShadowGenerator = parsedData.shadowGenerators[index];
                    ShadowGenerator.Parse(parsedShadowGenerator, scene);
                }
            }

            // Actions (scene)
            if (parsedData.actions) {
                ActionManager.Parse(parsedData.actions, null, scene);
            }

            // Finish
            return true;
        }
    });
}
