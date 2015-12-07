module BABYLON {
    var serializedGeometries: Geometry[] = [];
    var serializeGeometry = (geometry: Geometry, serializationGeometries: any): any => {
        if (serializedGeometries[geometry.id]) {
            return;
        }
        if (geometry instanceof Geometry.Primitives.Box) {
            serializationGeometries.boxes.push(geometry.serialize());
        }
        else if (geometry instanceof Geometry.Primitives.Sphere) {
            serializationGeometries.spheres.push(geometry.serialize());
        }
        else if (geometry instanceof Geometry.Primitives.Cylinder) {
            serializationGeometries.cylinders.push(geometry.serialize());
        }
        else if (geometry instanceof Geometry.Primitives.Torus) {
            serializationGeometries.toruses.push(geometry.serialize());
        }
        else if (geometry instanceof Geometry.Primitives.Ground) {
            serializationGeometries.grounds.push(geometry.serialize());
        }
        else if (geometry instanceof Geometry.Primitives.Plane) {
            serializationGeometries.planes.push(geometry.serialize());
        }
        else if (geometry instanceof Geometry.Primitives.TorusKnot) {
            serializationGeometries.torusKnots.push(geometry.serialize());
        }
        else if (geometry instanceof Geometry.Primitives._Primitive) {
            throw new Error("Unknown primitive type");
        }
        else {
            serializationGeometries.vertexData.push(geometry.serializeVerticeData());
        }

        serializedGeometries[geometry.id] = true;
    };

    var serializeMesh = (mesh: Mesh, serializationScene: any): any => {
        var serializationObject: any = {};

        serializationObject.name = mesh.name;
        serializationObject.id = mesh.id;

        if (Tags.HasTags(mesh)) {
            serializationObject.tags = Tags.GetTags(mesh);
        }

        serializationObject.position = mesh.position.asArray();

        if (mesh.rotationQuaternion) {
            serializationObject.rotationQuaternion = mesh.rotationQuaternion.asArray();
        } else if (mesh.rotation) {
            serializationObject.rotation = mesh.rotation.asArray();
        }

        serializationObject.scaling = mesh.scaling.asArray();
        serializationObject.localMatrix = mesh.getPivotMatrix().asArray();

        serializationObject.isEnabled = mesh.isEnabled();
        serializationObject.isVisible = mesh.isVisible;
        serializationObject.infiniteDistance = mesh.infiniteDistance;
        serializationObject.pickable = mesh.isPickable;

        serializationObject.receiveShadows = mesh.receiveShadows;

        serializationObject.billboardMode = mesh.billboardMode;
        serializationObject.visibility = mesh.visibility;

        serializationObject.checkCollisions = mesh.checkCollisions;

        // Parent
        if (mesh.parent) {
            serializationObject.parentId = mesh.parent.id;
        }

        // Geometry
        var geometry = mesh._geometry;
        if (geometry) {
            var geometryId = geometry.id;
            serializationObject.geometryId = geometryId;

            if (!mesh.getScene().getGeometryByID(geometryId)) {
                // geometry was in the memory but not added to the scene, nevertheless it's better to serialize to be able to reload the mesh with its geometry
                serializeGeometry(geometry, serializationScene.geometries);
            }

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
        if (mesh.getPhysicsImpostor() !== PhysicsEngine.NoImpostor) {
            serializationObject.physicsMass = mesh.getPhysicsMass();
            serializationObject.physicsFriction = mesh.getPhysicsFriction();
            serializationObject.physicsRestitution = mesh.getPhysicsRestitution();

            switch (mesh.getPhysicsImpostor()) {
                case PhysicsEngine.BoxImpostor:
                    serializationObject.physicsImpostor = 1;
                    break;
                case PhysicsEngine.SphereImpostor:
                    serializationObject.physicsImpostor = 2;
                    break;
            }
        }

        // Instances
        serializationObject.instances = [];
        for (var index = 0; index < mesh.instances.length; index++) {
            var instance = mesh.instances[index];
            var serializationInstance: any = {
                name: instance.name,
                position: instance.position.asArray(),
                scaling: instance.scaling.asArray()
            };
            if (instance.rotationQuaternion) {
                serializationInstance.rotationQuaternion = instance.rotationQuaternion.asArray();
            } else if (instance.rotation) {
                serializationInstance.rotation = instance.rotation.asArray();
            }
            serializationObject.instances.push(serializationInstance);

            // Animations
            Animation.AppendSerializedAnimations(instance, serializationInstance);
        }

        // Animations
        Animation.AppendSerializedAnimations(mesh, serializationObject);

        // Layer mask
        serializationObject.layerMask = mesh.layerMask;

        return serializationObject;
    };

    var finalizeSingleMesh = (mesh: Mesh, serializationObject: any) => {
        //only works if the mesh is already loaded
        if (mesh.delayLoadState === Engine.DELAYLOADSTATE_LOADED || mesh.delayLoadState === Engine.DELAYLOADSTATE_NONE) {
            //serialize material
            if (mesh.material) {
                if (mesh.material instanceof StandardMaterial) {
                    serializationObject.materials = serializationObject.materials || [];
                    if (!serializationObject.materials.some(mat => (mat.id === mesh.material.id))) {
                        serializationObject.materials.push(mesh.material.serialize());
                    }
                } else if (mesh.material instanceof MultiMaterial) {
                    serializationObject.multiMaterials = serializationObject.multiMaterials || [];
                    if (!serializationObject.multiMaterials.some(mat => (mat.id === mesh.material.id))) {
                        serializationObject.multiMaterials.push(mesh.material.serialize());
                    }

                }
            }
            //serialize geometry
            var geometry = mesh._geometry;
            if (geometry) {
                if (!serializationObject.geometries) {
                    serializationObject.geometries = {};

                    serializationObject.geometries.boxes = [];
                    serializationObject.geometries.spheres = [];
                    serializationObject.geometries.cylinders = [];
                    serializationObject.geometries.toruses = [];
                    serializationObject.geometries.grounds = [];
                    serializationObject.geometries.planes = [];
                    serializationObject.geometries.torusKnots = [];
                    serializationObject.geometries.vertexData = [];
                }

                serializeGeometry(geometry, serializationObject.geometries);
            }
            // Skeletons
            if (mesh.skeleton) {
                serializationObject.skeletons = serializationObject.skeletons || [];
                serializationObject.skeletons.push(mesh.skeleton.serialize());
            }

            //serialize the actual mesh
            serializationObject.meshes = serializationObject.meshes || [];
            serializationObject.meshes.push(serializeMesh(mesh, serializationObject));
        }
    }

    export class SceneSerializer {
        public static Serialize(scene: Scene): any {
            var serializationObject: any = {};

            // Scene
            serializationObject.useDelayedTextureLoading = scene.useDelayedTextureLoading;
            serializationObject.autoClear = scene.autoClear;
            serializationObject.clearColor = scene.clearColor.asArray();
            serializationObject.ambientColor = scene.ambientColor.asArray();
            serializationObject.gravity = scene.gravity.asArray();
            serializationObject.collisionsEnabled = scene.collisionsEnabled;
            serializationObject.workerCollisions = scene.workerCollisions;
            
            // Fog
            if (scene.fogMode && scene.fogMode !== 0) {
                serializationObject.fogMode = scene.fogMode;
                serializationObject.fogColor = scene.fogColor.asArray();
                serializationObject.fogStart = scene.fogStart;
                serializationObject.fogEnd = scene.fogEnd;
                serializationObject.fogDensity = scene.fogDensity;
            }
            
            //Physics
            if (scene.isPhysicsEnabled()) {
                serializationObject.physicsEnabled = true;
                serializationObject.physicsGravity = scene.getPhysicsEngine()._getGravity().asArray();
                serializationObject.physicsEngine = scene.getPhysicsEngine().getPhysicsPluginName();
            }

            // Lights
            serializationObject.lights = [];
            var index: number;
            var light: Light;
            for (index = 0; index < scene.lights.length; index++) {
                light = scene.lights[index];
                serializationObject.lights.push(light.serialize());
            }

            // Cameras
            serializationObject.cameras = [];
            for (index = 0; index < scene.cameras.length; index++) {
                var camera = scene.cameras[index];
                serializationObject.cameras.push(camera.serialize());
            }

            if (scene.activeCamera) {
                serializationObject.activeCameraID = scene.activeCamera.id;
            }

            // Materials
            serializationObject.materials = [];
            serializationObject.multiMaterials = [];
            var material: Material;
            for (index = 0; index < scene.materials.length; index++) {
                material = scene.materials[index];
				//ShaderMaterial is not yet being serialized.
				if(material instanceof ShaderMaterial) continue;
                serializationObject.materials.push(material.serialize());
            }

            // MultiMaterials
            serializationObject.multiMaterials = [];
            for (index = 0; index < scene.multiMaterials.length; index++) {
                var multiMaterial = scene.multiMaterials[index];
                serializationObject.multiMaterials.push(multiMaterial.serialize());
            }

            // Skeletons
            serializationObject.skeletons = [];
            for (index = 0; index < scene.skeletons.length; index++) {
                serializationObject.skeletons.push(scene.skeletons[index].serialize());
            }

            // Geometries
            serializationObject.geometries = {};

            serializationObject.geometries.boxes = [];
            serializationObject.geometries.spheres = [];
            serializationObject.geometries.cylinders = [];
            serializationObject.geometries.toruses = [];
            serializationObject.geometries.grounds = [];
            serializationObject.geometries.planes = [];
            serializationObject.geometries.torusKnots = [];
            serializationObject.geometries.vertexData = [];

            serializedGeometries = [];
            var geometries = scene.getGeometries();
            for (index = 0; index < geometries.length; index++) {
                var geometry = geometries[index];

                if (geometry.isReady()) {
                    serializeGeometry(geometry, serializationObject.geometries);
                }
            }

            // Meshes
            serializationObject.meshes = [];
            for (index = 0; index < scene.meshes.length; index++) {
                var abstractMesh = scene.meshes[index];

                if (abstractMesh instanceof Mesh) {
                    var mesh = abstractMesh;
                    if (mesh.delayLoadState === Engine.DELAYLOADSTATE_LOADED || mesh.delayLoadState === Engine.DELAYLOADSTATE_NONE) {
                        serializationObject.meshes.push(serializeMesh(mesh, serializationObject));
                    }
                }
            }

            // Particles Systems
            serializationObject.particleSystems = [];
            for (index = 0; index < scene.particleSystems.length; index++) {
                serializationObject.particleSystems.push(scene.particleSystems[index].serialize());
            }

            // Lens flares
            serializationObject.lensFlareSystems = [];
            for (index = 0; index < scene.lensFlareSystems.length; index++) {
                serializationObject.lensFlareSystems.push(scene.lensFlareSystems[index].serialize());
            }

            // Shadows
            serializationObject.shadowGenerators = [];
            for (index = 0; index < scene.lights.length; index++) {
                light = scene.lights[index];

                if (light.getShadowGenerator()) {
                    serializationObject.shadowGenerators.push(light.getShadowGenerator().serialize());
                }
            }

            return serializationObject;
        }

        public static SerializeMesh(toSerialize: any /* Mesh || Mesh[] */, withParents: boolean = false, withChildren: boolean = false): any {
            var serializationObject: any = {};

            toSerialize = (toSerialize instanceof Array) ? toSerialize : [toSerialize];

            if (withParents || withChildren) {
                //deliberate for loop! not for each, appended should be processed as well.
                for (var i = 0; i < toSerialize.length; ++i) {
                    if (withChildren) {
                        toSerialize[i].getDescendants().forEach((node) => {
                            if (node instanceof Mesh && (toSerialize.indexOf(node) < 0)) {
                                toSerialize.push(node);
                            }
                        });
                    }
                    //make sure the array doesn't contain the object already
                    if (withParents && toSerialize[i].parent && (toSerialize.indexOf(toSerialize[i].parent) < 0)) {
                        toSerialize.push(toSerialize[i].parent);
                    }
                }
            }

            toSerialize.forEach((mesh: Mesh) => {
                finalizeSingleMesh(mesh, serializationObject);
            });

            return serializationObject;
        }
    }
}