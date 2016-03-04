var BABYLON;
(function (BABYLON) {
    var Internals;
    (function (Internals) {
        var parseMaterialById = function (id, parsedData, scene, rootUrl) {
            for (var index = 0, cache = parsedData.materials.length; index < cache; index++) {
                var parsedMaterial = parsedData.materials[index];
                if (parsedMaterial.id === id) {
                    return BABYLON.Material.Parse(parsedMaterial, scene, rootUrl);
                }
            }
            return null;
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
        BABYLON.SceneLoader.RegisterPlugin({
            extensions: ".babylon",
            importMesh: function (meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons) {
                var parsedData = JSON.parse(data);
                var loadedSkeletonsIds = [];
                var loadedMaterialsIds = [];
                var hierarchyIds = [];
                var index;
                var cache;
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
                                var found = false;
                                ["boxes", "spheres", "cylinders", "toruses", "grounds", "planes", "torusKnots", "vertexData"].forEach(function (geometryType) {
                                    if (found || !parsedData.geometries[geometryType] || !(parsedData.geometries[geometryType] instanceof Array)) {
                                        return;
                                    }
                                    else {
                                        parsedData.geometries[geometryType].forEach(function (parsedGeometryData) {
                                            if (parsedGeometryData.id === parsedMesh.geometryId) {
                                                switch (geometryType) {
                                                    case "boxes":
                                                        BABYLON.Geometry.Primitives.Box.Parse(parsedGeometryData, scene);
                                                        break;
                                                    case "spheres":
                                                        BABYLON.Geometry.Primitives.Sphere.Parse(parsedGeometryData, scene);
                                                        break;
                                                    case "cylinders":
                                                        BABYLON.Geometry.Primitives.Cylinder.Parse(parsedGeometryData, scene);
                                                        break;
                                                    case "toruses":
                                                        BABYLON.Geometry.Primitives.Torus.Parse(parsedGeometryData, scene);
                                                        break;
                                                    case "grounds":
                                                        BABYLON.Geometry.Primitives.Ground.Parse(parsedGeometryData, scene);
                                                        break;
                                                    case "planes":
                                                        BABYLON.Geometry.Primitives.Plane.Parse(parsedGeometryData, scene);
                                                        break;
                                                    case "torusKnots":
                                                        BABYLON.Geometry.Primitives.TorusKnot.Parse(parsedGeometryData, scene);
                                                        break;
                                                    case "vertexData":
                                                        BABYLON.Geometry.Parse(parsedGeometryData, scene, rootUrl);
                                                        break;
                                                }
                                                found = true;
                                            }
                                        });
                                    }
                                });
                                if (!found) {
                                    BABYLON.Tools.Warn("Geometry not found for mesh " + parsedMesh.id);
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
                                        BABYLON.Material.ParseMultiMaterial(parsedMultiMaterial, scene);
                                        materialFound = true;
                                        break;
                                    }
                                }
                            }
                            if (!materialFound) {
                                loadedMaterialsIds.push(parsedMesh.materialId);
                                if (!parseMaterialById(parsedMesh.materialId, parsedData, scene, rootUrl)) {
                                    BABYLON.Tools.Warn("Material not found for mesh " + parsedMesh.id);
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
                                        skeletons.push(BABYLON.Skeleton.Parse(parsedSkeleton, scene));
                                        loadedSkeletonsIds.push(parsedSkeleton.id);
                                    }
                                }
                            }
                        }
                        var mesh = BABYLON.Mesh.Parse(parsedMesh, scene, rootUrl);
                        meshes.push(mesh);
                    }
                }
                // Connecting parents
                var currentMesh;
                for (index = 0, cache = scene.meshes.length; index < cache; index++) {
                    currentMesh = scene.meshes[index];
                    if (currentMesh._waitingParentId) {
                        currentMesh.parent = scene.getLastEntryByID(currentMesh._waitingParentId);
                        currentMesh._waitingParentId = undefined;
                    }
                }
                // freeze and compute world matrix application
                for (index = 0, cache = scene.meshes.length; index < cache; index++) {
                    currentMesh = scene.meshes[index];
                    if (currentMesh._waitingFreezeWorldMatrix) {
                        currentMesh.freezeWorldMatrix();
                        currentMesh._waitingFreezeWorldMatrix = undefined;
                    }
                    else {
                        currentMesh.computeWorldMatrix(true);
                    }
                }
                // Particles
                if (parsedData.particleSystems) {
                    for (index = 0, cache = parsedData.particleSystems.length; index < cache; index++) {
                        var parsedParticleSystem = parsedData.particleSystems[index];
                        if (hierarchyIds.indexOf(parsedParticleSystem.emitterId) !== -1) {
                            particleSystems.push(BABYLON.ParticleSystem.Parse(parsedParticleSystem, scene, rootUrl));
                        }
                    }
                }
                return true;
            },
            load: function (scene, data, rootUrl) {
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
                    }
                    else if (parsedData.physicsEngine === "oimo") {
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
                var index;
                var cache;
                // Lights
                for (index = 0, cache = parsedData.lights.length; index < cache; index++) {
                    var parsedLight = parsedData.lights[index];
                    BABYLON.Light.Parse(parsedLight, scene);
                }
                // Animations
                if (parsedData.animations) {
                    for (index = 0, cache = parsedData.animations.length; index < cache; index++) {
                        var parsedAnimation = parsedData.animations[index];
                        scene.animations.push(BABYLON.Animation.Parse(parsedAnimation));
                    }
                }
                if (parsedData.autoAnimate) {
                    scene.beginAnimation(scene, parsedData.autoAnimateFrom, parsedData.autoAnimateTo, parsedData.autoAnimateLoop, parsedData.autoAnimateSpeed || 1.0);
                }
                // Materials
                if (parsedData.materials) {
                    for (index = 0, cache = parsedData.materials.length; index < cache; index++) {
                        var parsedMaterial = parsedData.materials[index];
                        BABYLON.Material.Parse(parsedMaterial, scene, rootUrl);
                    }
                }
                if (parsedData.multiMaterials) {
                    for (index = 0, cache = parsedData.multiMaterials.length; index < cache; index++) {
                        var parsedMultiMaterial = parsedData.multiMaterials[index];
                        BABYLON.Material.ParseMultiMaterial(parsedMultiMaterial, scene);
                    }
                }
                // Skeletons
                if (parsedData.skeletons) {
                    for (index = 0, cache = parsedData.skeletons.length; index < cache; index++) {
                        var parsedSkeleton = parsedData.skeletons[index];
                        BABYLON.Skeleton.Parse(parsedSkeleton, scene);
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
                            BABYLON.Geometry.Primitives.Box.Parse(parsedBox, scene);
                        }
                    }
                    // Spheres
                    var spheres = geometries.spheres;
                    if (spheres) {
                        for (index = 0, cache = spheres.length; index < cache; index++) {
                            var parsedSphere = spheres[index];
                            BABYLON.Geometry.Primitives.Sphere.Parse(parsedSphere, scene);
                        }
                    }
                    // Cylinders
                    var cylinders = geometries.cylinders;
                    if (cylinders) {
                        for (index = 0, cache = cylinders.length; index < cache; index++) {
                            var parsedCylinder = cylinders[index];
                            BABYLON.Geometry.Primitives.Cylinder.Parse(parsedCylinder, scene);
                        }
                    }
                    // Toruses
                    var toruses = geometries.toruses;
                    if (toruses) {
                        for (index = 0, cache = toruses.length; index < cache; index++) {
                            var parsedTorus = toruses[index];
                            BABYLON.Geometry.Primitives.Torus.Parse(parsedTorus, scene);
                        }
                    }
                    // Grounds
                    var grounds = geometries.grounds;
                    if (grounds) {
                        for (index = 0, cache = grounds.length; index < cache; index++) {
                            var parsedGround = grounds[index];
                            BABYLON.Geometry.Primitives.Ground.Parse(parsedGround, scene);
                        }
                    }
                    // Planes
                    var planes = geometries.planes;
                    if (planes) {
                        for (index = 0, cache = planes.length; index < cache; index++) {
                            var parsedPlane = planes[index];
                            BABYLON.Geometry.Primitives.Plane.Parse(parsedPlane, scene);
                        }
                    }
                    // TorusKnots
                    var torusKnots = geometries.torusKnots;
                    if (torusKnots) {
                        for (index = 0, cache = torusKnots.length; index < cache; index++) {
                            var parsedTorusKnot = torusKnots[index];
                            BABYLON.Geometry.Primitives.TorusKnot.Parse(parsedTorusKnot, scene);
                        }
                    }
                    // VertexData
                    var vertexData = geometries.vertexData;
                    if (vertexData) {
                        for (index = 0, cache = vertexData.length; index < cache; index++) {
                            var parsedVertexData = vertexData[index];
                            BABYLON.Geometry.Parse(parsedVertexData, scene, rootUrl);
                        }
                    }
                }
                // Meshes
                for (index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                    var parsedMesh = parsedData.meshes[index];
                    BABYLON.Mesh.Parse(parsedMesh, scene, rootUrl);
                }
                // Cameras
                for (index = 0, cache = parsedData.cameras.length; index < cache; index++) {
                    var parsedCamera = parsedData.cameras[index];
                    BABYLON.Camera.Parse(parsedCamera, scene);
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
                var loadedSounds = [];
                var loadedSound;
                if (BABYLON.AudioEngine && parsedData.sounds) {
                    for (index = 0, cache = parsedData.sounds.length; index < cache; index++) {
                        var parsedSound = parsedData.sounds[index];
                        if (BABYLON.Engine.audioEngine.canUseWebAudio) {
                            if (!parsedSound.url)
                                parsedSound.url = parsedSound.name;
                            if (!loadedSounds[parsedSound.url]) {
                                loadedSound = BABYLON.Sound.Parse(parsedSound, scene, rootUrl);
                                loadedSounds[parsedSound.url] = loadedSound;
                            }
                            else {
                                BABYLON.Sound.Parse(parsedSound, scene, rootUrl, loadedSounds[parsedSound.url]);
                            }
                        }
                        else {
                            var emptySound = new BABYLON.Sound(parsedSound.name, null, scene);
                        }
                    }
                }
                loadedSounds = [];
                // Connect parents & children and parse actions
                for (index = 0, cache = scene.meshes.length; index < cache; index++) {
                    var mesh = scene.meshes[index];
                    if (mesh._waitingParentId) {
                        mesh.parent = scene.getLastEntryByID(mesh._waitingParentId);
                        mesh._waitingParentId = undefined;
                    }
                    if (mesh._waitingActions) {
                        BABYLON.ActionManager.Parse(mesh._waitingActions, mesh, scene);
                        mesh._waitingActions = undefined;
                    }
                }
                // freeze world matrix application
                for (index = 0, cache = scene.meshes.length; index < cache; index++) {
                    var currentMesh = scene.meshes[index];
                    if (currentMesh._waitingFreezeWorldMatrix) {
                        currentMesh.freezeWorldMatrix();
                        currentMesh._waitingFreezeWorldMatrix = undefined;
                    }
                    else {
                        currentMesh.computeWorldMatrix(true);
                    }
                }
                // Particles Systems
                if (parsedData.particleSystems) {
                    for (index = 0, cache = parsedData.particleSystems.length; index < cache; index++) {
                        var parsedParticleSystem = parsedData.particleSystems[index];
                        BABYLON.ParticleSystem.Parse(parsedParticleSystem, scene, rootUrl);
                    }
                }
                // Lens flares
                if (parsedData.lensFlareSystems) {
                    for (index = 0, cache = parsedData.lensFlareSystems.length; index < cache; index++) {
                        var parsedLensFlareSystem = parsedData.lensFlareSystems[index];
                        BABYLON.LensFlareSystem.Parse(parsedLensFlareSystem, scene, rootUrl);
                    }
                }
                // Shadows
                if (parsedData.shadowGenerators) {
                    for (index = 0, cache = parsedData.shadowGenerators.length; index < cache; index++) {
                        var parsedShadowGenerator = parsedData.shadowGenerators[index];
                        BABYLON.ShadowGenerator.Parse(parsedShadowGenerator, scene);
                    }
                }
                // Actions (scene)
                if (parsedData.actions) {
                    BABYLON.ActionManager.Parse(parsedData.actions, null, scene);
                }
                // Finish
                return true;
            }
        });
    })(Internals = BABYLON.Internals || (BABYLON.Internals = {}));
})(BABYLON || (BABYLON = {}));
