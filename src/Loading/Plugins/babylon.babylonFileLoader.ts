module BABYLON.Internals {

    var parseMaterialById = (id, parsedData, scene, rootUrl) => {
        for (var index = 0; index < parsedData.materials.length; index++) {
            var parsedMaterial = parsedData.materials[index];
            if (parsedMaterial.id === id) {
                return BABYLON.Material.ParseMaterial(parsedMaterial, scene, rootUrl);
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

    BABYLON.SceneLoader.RegisterPlugin({
        extensions: ".babylon",
        importMesh: (meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]): boolean => {
            var parsedData = JSON.parse(data);

            var loadedSkeletonsIds = [];
            var loadedMaterialsIds = [];
            var hierarchyIds = [];
            var index: number;
            for (index = 0; index < parsedData.meshes.length; index++) {
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
                                        if (parsedGeometryData.id == parsedMesh.geometryId) {
                                            switch (geometryType) {
                                                case "boxes":
                                                    Geometry.Primitives.Box.ParseBox(parsedGeometryData, scene);
                                                    break;
                                                case "spheres":
                                                    Geometry.Primitives.Sphere.ParseSphere(parsedGeometryData, scene);
                                                    break;
                                                case "cylinders":
                                                    Geometry.Primitives.Cylinder.ParseCylinder(parsedGeometryData, scene);
                                                    break;
                                                case "toruses":
                                                    Geometry.Primitives.Torus.ParseTorus(parsedGeometryData, scene);
                                                    break;
                                                case "grounds":
                                                    Geometry.Primitives.Ground.ParseGround(parsedGeometryData, scene);
                                                    break;
                                                case "planes":
                                                    Geometry.Primitives.Plane.ParsePlane(parsedGeometryData, scene);
                                                    break;
                                                case "torusKnots":
                                                    Geometry.Primitives.TorusKnot.ParseTorusKnot(parsedGeometryData, scene);
                                                    break;
                                                case "vertexData":
                                                    Geometry.ParseGeometry(parsedGeometryData, scene, rootUrl);
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
                            for (var multimatIndex = 0; multimatIndex < parsedData.multiMaterials.length; multimatIndex++) {
                                var parsedMultiMaterial = parsedData.multiMaterials[multimatIndex];
                                if (parsedMultiMaterial.id == parsedMesh.materialId) {
                                    for (var matIndex = 0; matIndex < parsedMultiMaterial.materials.length; matIndex++) {
                                        var subMatId = parsedMultiMaterial.materials[matIndex];
                                        loadedMaterialsIds.push(subMatId);
                                        parseMaterialById(subMatId, parsedData, scene, rootUrl);
                                    }

                                    loadedMaterialsIds.push(parsedMultiMaterial.id);
                                    parsedMultiMaterial.ParseMultiMaterial(parsedMultiMaterial, scene);
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
                            for (var skeletonIndex = 0; skeletonIndex < parsedData.skeletons.length; skeletonIndex++) {
                                var parsedSkeleton = parsedData.skeletons[skeletonIndex];

                                if (parsedSkeleton.id === parsedMesh.skeletonId) {
                                    skeletons.push(Skeleton.ParseSkeleton(parsedSkeleton, scene));
                                    loadedSkeletonsIds.push(parsedSkeleton.id);
                                }
                            }
                        }
                    }

                    var mesh = mesh.ParseMesh(parsedMesh, scene, rootUrl);
                    meshes.push(mesh);
                }
            }

            // Connecting parents
            var currentMesh: AbstractMesh;
            for (index = 0; index < scene.meshes.length; index++) {
                currentMesh = scene.meshes[index];
                if (currentMesh._waitingParentId) {
                    currentMesh.parent = scene.getLastEntryByID(currentMesh._waitingParentId);
                    currentMesh._waitingParentId = undefined;
                }
            }

            // freeze world matrix application
            for (index = 0; index < scene.meshes.length; index++) {
                currentMesh = scene.meshes[index];
                if (currentMesh._waitingFreezeWorldMatrix) {
                    currentMesh.freezeWorldMatrix();
                    currentMesh._waitingFreezeWorldMatrix = undefined;
                }
            }

            // Particles
            if (parsedData.particleSystems) {
                for (index = 0; index < parsedData.particleSystems.length; index++) {
                    var parsedParticleSystem = parsedData.particleSystems[index];

                    if (hierarchyIds.indexOf(parsedParticleSystem.emitterId) !== -1) {
                        particleSystems.push(ParticleSystem.ParseParticleSystem(parsedParticleSystem, scene, rootUrl));
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

            // Lights
            var index: number;
            for (index = 0; index < parsedData.lights.length; index++) {
                var parsedLight = parsedData.lights[index];
                Light.ParseLight(parsedLight, scene);
            }

            // Materials
            if (parsedData.materials) {
                for (index = 0; index < parsedData.materials.length; index++) {
                    var parsedMaterial = parsedData.materials[index];
                    Material.ParseMaterial(parsedMaterial, scene, rootUrl);
                }
            }

            if (parsedData.multiMaterials) {
                for (index = 0; index < parsedData.multiMaterials.length; index++) {
                    var parsedMultiMaterial = parsedData.multiMaterials[index];
                    MultiMaterial.ParseMultiMaterial(parsedMultiMaterial, scene);
                }
            }

            // Skeletons
            if (parsedData.skeletons) {
                for (index = 0; index < parsedData.skeletons.length; index++) {
                    var parsedSkeleton = parsedData.skeletons[index];
                    Skeleton.ParseSkeleton(parsedSkeleton, scene);
                }
            }

            // Geometries
            var geometries = parsedData.geometries;
            if (geometries) {
                // Boxes
                var boxes = geometries.boxes;
                if (boxes) {
                    for (index = 0; index < boxes.length; index++) {
                        var parsedBox = boxes[index];
                        Geometry.Primitives.Box.ParseBox(parsedBox, scene);
                    }
                }

                // Spheres
                var spheres = geometries.spheres;
                if (spheres) {
                    for (index = 0; index < spheres.length; index++) {
                        var parsedSphere = spheres[index];
                        Geometry.Primitives.Sphere.ParseSphere(parsedSphere, scene);
                    }
                }

                // Cylinders
                var cylinders = geometries.cylinders;
                if (cylinders) {
                    for (index = 0; index < cylinders.length; index++) {
                        var parsedCylinder = cylinders[index];
                        Geometry.Primitives.Cylinder.ParseCylinder(parsedCylinder, scene);
                    }
                }

                // Toruses
                var toruses = geometries.toruses;
                if (toruses) {
                    for (index = 0; index < toruses.length; index++) {
                        var parsedTorus = toruses[index];
                        Geometry.Primitives.Torus.ParseTorus(parsedTorus, scene);
                    }
                }

                // Grounds
                var grounds = geometries.grounds;
                if (grounds) {
                    for (index = 0; index < grounds.length; index++) {
                        var parsedGround = grounds[index];
                        Geometry.Primitives.Ground.ParseGround(parsedGround, scene);
                    }
                }

                // Planes
                var planes = geometries.planes;
                if (planes) {
                    for (index = 0; index < planes.length; index++) {
                        var parsedPlane = planes[index];
                        Geometry.Primitives.Plane.ParsePlane(parsedPlane, scene);
                    }
                }

                // TorusKnots
                var torusKnots = geometries.torusKnots;
                if (torusKnots) {
                    for (index = 0; index < torusKnots.length; index++) {
                        var parsedTorusKnot = torusKnots[index];
                        Geometry.Primitives.TorusKnot.ParseTorusKnot(parsedTorusKnot, scene);
                    }
                }

                // VertexData
                var vertexData = geometries.vertexData;
                if (vertexData) {
                    for (index = 0; index < vertexData.length; index++) {
                        var parsedVertexData = vertexData[index];
                        Geometry.ParseGeometry(parsedVertexData, scene, rootUrl);
                    }
                }
            }

            // Meshes
            for (index = 0; index < parsedData.meshes.length; index++) {
                var parsedMesh = parsedData.meshes[index];
                Mesh.ParseMesh(parsedMesh, scene, rootUrl);
            }

            // Cameras
            for (index = 0; index < parsedData.cameras.length; index++) {
                var parsedCamera = parsedData.cameras[index];
                Camera.ParseCamera(parsedCamera, scene);
            }

            if (parsedData.activeCameraID) {
                scene.setActiveCameraByID(parsedData.activeCameraID);
            }

            // Browsing all the graph to connect the dots
            for (index = 0; index < scene.cameras.length; index++) {
                var camera = scene.cameras[index];
                if (camera._waitingParentId) {
                    camera.parent = scene.getLastEntryByID(camera._waitingParentId);
                    camera._waitingParentId = undefined;
                }
            }

            for (index = 0; index < scene.lights.length; index++) {
                var light = scene.lights[index];
                if (light._waitingParentId) {
                    light.parent = scene.getLastEntryByID(light._waitingParentId);
                    light._waitingParentId = undefined;
                }
            }

            // Sounds
            if (AudioEngine && parsedData.sounds) {
                for (index = 0; index < parsedData.sounds.length; index++) {
                    var parsedSound = parsedData.sounds[index];
                    if (Engine.audioEngine.canUseWebAudio) {
                        Sound.ParseSound(parsedSound, scene, rootUrl);
                    }
                    else {
                        var emptySound = new BABYLON.Sound(parsedSound.name, null, scene);
                    }
                }
            }

            // Connect parents & children and parse actions
            for (index = 0; index < scene.meshes.length; index++) {
                var mesh = scene.meshes[index];
                if (mesh._waitingParentId) {
                    mesh.parent = scene.getLastEntryByID(mesh._waitingParentId);
                    mesh._waitingParentId = undefined;
                }
                if (mesh._waitingActions) {
                    ActionManager.ParseActions(mesh._waitingActions, mesh, scene);
                    mesh._waitingActions = undefined;
                }
            }

            // freeze world matrix application
            for (index = 0; index < scene.meshes.length; index++) {
                var currentMesh = scene.meshes[index];
                if (currentMesh._waitingFreezeWorldMatrix) {
                    currentMesh.freezeWorldMatrix();
                    currentMesh._waitingFreezeWorldMatrix = undefined;
                }
            }

            // Particles Systems
            if (parsedData.particleSystems) {
                for (index = 0; index < parsedData.particleSystems.length; index++) {
                    var parsedParticleSystem = parsedData.particleSystems[index];
                    ParticleSystem.ParseParticleSystem(parsedParticleSystem, scene, rootUrl);
                }
            }

            // Lens flares
            if (parsedData.lensFlareSystems) {
                for (index = 0; index < parsedData.lensFlareSystems.length; index++) {
                    var parsedLensFlareSystem = parsedData.lensFlareSystems[index];
                    LensFlareSystem.ParseLensFlareSystem(parsedLensFlareSystem, scene, rootUrl);
                }
            }

            // Shadows
            if (parsedData.shadowGenerators) {
                for (index = 0; index < parsedData.shadowGenerators.length; index++) {
                    var parsedShadowGenerator = parsedData.shadowGenerators[index];

                    ShadowGenerator.ParseShadowGenerator(parsedShadowGenerator, scene);
                }
            }

            // Actions (scene)
            if (parsedData.actions) {
                ActionManager.ParseActions(parsedData.actions, null, scene);
            }

            // Finish
            return true;
        }
    });
}



