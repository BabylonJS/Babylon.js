import { Geometry } from "../Meshes/geometry";
import { Mesh } from "../Meshes/mesh";
import { Constants } from "../Engines/constants";
import { MultiMaterial } from "../Materials/multiMaterial";
import { Material } from "../Materials/material";
import { Scene } from "../scene";
import { Light } from "../Lights/light";
import { SerializationHelper } from "./decorators";

var serializedGeometries: Geometry[] = [];
var serializeGeometry = (geometry: Geometry, serializationGeometries: any): any => {
    if ((<any>serializedGeometries)[geometry.id]) {
        return;
    }

    if (geometry.doNotSerialize) {
        return;
    }

    serializationGeometries.vertexData.push(geometry.serializeVerticeData());

    (<any>serializedGeometries)[geometry.id] = true;
};

var serializeMesh = (mesh: Mesh, serializationScene: any): any => {
    var serializationObject: any = {};

    // Geometry
    var geometry = mesh._geometry;
    if (geometry) {
        if (!mesh.getScene().getGeometryByID(geometry.id)) {
            // Geometry was in the memory but not added to the scene, nevertheless it's better to serialize to be able to reload the mesh with its geometry
            serializeGeometry(geometry, serializationScene.geometries);
        }
    }

    // Custom
    if (mesh.serialize) {
        mesh.serialize(serializationObject);
    }

    return serializationObject;
};

var finalizeSingleMesh = (mesh: Mesh, serializationObject: any) => {
    //only works if the mesh is already loaded
    if (mesh.delayLoadState === Constants.DELAYLOADSTATE_LOADED || mesh.delayLoadState === Constants.DELAYLOADSTATE_NONE) {
        //serialize material
        if (mesh.material && !mesh.material.doNotSerialize) {
            if (mesh.material instanceof MultiMaterial) {
                serializationObject.multiMaterials = serializationObject.multiMaterials || [];
                serializationObject.materials = serializationObject.materials || [];
                if (!serializationObject.multiMaterials.some((mat: Material) => (mat.id === (<Material>mesh.material).id))) {
                    serializationObject.multiMaterials.push(mesh.material.serialize());
                    for (let submaterial of mesh.material.subMaterials) {
                        if (submaterial) {
                            if (!serializationObject.materials.some((mat: Material) => (mat.id === (<Material>submaterial).id))) {
                                serializationObject.materials.push(submaterial.serialize());
                            }
                        }
                    }
                }
            } else {
                serializationObject.materials = serializationObject.materials || [];
                if (!serializationObject.materials.some((mat: Material) => (mat.id === (<Material>mesh.material).id))) {
                    serializationObject.materials.push(mesh.material.serialize());
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
        if (mesh.skeleton && !mesh.skeleton.doNotSerialize) {
            serializationObject.skeletons = serializationObject.skeletons || [];
            serializationObject.skeletons.push(mesh.skeleton.serialize());
        }

        //serialize the actual mesh
        serializationObject.meshes = serializationObject.meshes || [];
        serializationObject.meshes.push(serializeMesh(mesh, serializationObject));
    }
};

/**
 * Class used to serialize a scene into a string
 */
export class SceneSerializer {
    /**
     * Clear cache used by a previous serialization
     */
    public static ClearCache(): void {
        serializedGeometries = [];
    }

    /**
     * Serialize a scene into a JSON compatible object
     * @param scene defines the scene to serialize
     * @returns a JSON compatible object
     */
    public static Serialize(scene: Scene): any {
        var serializationObject: any = {};

        SceneSerializer.ClearCache();

        // Scene
        serializationObject.useDelayedTextureLoading = scene.useDelayedTextureLoading;
        serializationObject.autoClear = scene.autoClear;
        serializationObject.clearColor = scene.clearColor.asArray();
        serializationObject.ambientColor = scene.ambientColor.asArray();
        serializationObject.gravity = scene.gravity.asArray();
        serializationObject.collisionsEnabled = scene.collisionsEnabled;

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
            let physicEngine = scene.getPhysicsEngine();

            if (physicEngine) {
                serializationObject.physicsEnabled = true;
                serializationObject.physicsGravity = physicEngine.gravity.asArray();
                serializationObject.physicsEngine = physicEngine.getPhysicsPluginName();
            }
        }

        // Metadata
        if (scene.metadata) {
            serializationObject.metadata = scene.metadata;
        }

        // Morph targets
        serializationObject.morphTargetManagers = [];
        for (var abstractMesh of scene.meshes) {
            var manager = (<Mesh>abstractMesh).morphTargetManager;

            if (manager) {
                serializationObject.morphTargetManagers.push(manager.serialize());
            }
        }

        // Lights
        serializationObject.lights = [];
        var index: number;
        var light: Light;
        for (index = 0; index < scene.lights.length; index++) {
            light = scene.lights[index];

            if (!light.doNotSerialize) {
                serializationObject.lights.push(light.serialize());
            }
        }

        // Cameras
        serializationObject.cameras = [];
        for (index = 0; index < scene.cameras.length; index++) {
            var camera = scene.cameras[index];

            if (!camera.doNotSerialize) {
                serializationObject.cameras.push(camera.serialize());
            }
        }

        if (scene.activeCamera) {
            serializationObject.activeCameraID = scene.activeCamera.id;
        }

        // Animations
        SerializationHelper.AppendSerializedAnimations(scene, serializationObject);

        // Animation Groups
        if (scene.animationGroups && scene.animationGroups.length > 0) {
            serializationObject.animationGroups = [];
            for (var animationGroupIndex = 0; animationGroupIndex < scene.animationGroups.length; animationGroupIndex++) {
                var animationGroup = scene.animationGroups[animationGroupIndex];

                serializationObject.animationGroups.push(animationGroup.serialize());
            }
        }

        // Reflection probes
        if (scene.reflectionProbes && scene.reflectionProbes.length > 0) {
            serializationObject.reflectionProbes = [];

            for (index = 0; index < scene.reflectionProbes.length; index++) {
                var reflectionProbe = scene.reflectionProbes[index];
                serializationObject.reflectionProbes.push(reflectionProbe.serialize());
            }
        }

        // Materials
        serializationObject.materials = [];
        serializationObject.multiMaterials = [];
        var material: Material;
        for (index = 0; index < scene.materials.length; index++) {
            material = scene.materials[index];
            if (!material.doNotSerialize) {
                serializationObject.materials.push(material.serialize());
            }
        }

        // MultiMaterials
        serializationObject.multiMaterials = [];
        for (index = 0; index < scene.multiMaterials.length; index++) {
            var multiMaterial = scene.multiMaterials[index];
            serializationObject.multiMaterials.push(multiMaterial.serialize());
        }

        // Environment texture
        if (scene.environmentTexture) {
            serializationObject.environmentTexture = scene.environmentTexture.name;
        }

        // Environment Intensity
        serializationObject.environmentIntensity = scene.environmentIntensity;

        // Skeletons
        serializationObject.skeletons = [];
        for (index = 0; index < scene.skeletons.length; index++) {
            let skeleton = scene.skeletons[index];
            if (!skeleton.doNotSerialize) {
                serializationObject.skeletons.push(skeleton.serialize());
            }
        }

        // Transform nodes
        serializationObject.transformNodes = [];
        for (index = 0; index < scene.transformNodes.length; index++) {
            if (!scene.transformNodes[index].doNotSerialize) {
                serializationObject.transformNodes.push(scene.transformNodes[index].serialize());
            }
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
                if (!mesh.doNotSerialize) {
                    if (mesh.delayLoadState === Constants.DELAYLOADSTATE_LOADED || mesh.delayLoadState === Constants.DELAYLOADSTATE_NONE) {
                        serializationObject.meshes.push(serializeMesh(mesh, serializationObject));
                    }
                }
            }
        }

        // Particles Systems
        serializationObject.particleSystems = [];
        for (index = 0; index < scene.particleSystems.length; index++) {
            serializationObject.particleSystems.push(scene.particleSystems[index].serialize(false));
        }

        // Action Manager
        if (scene.actionManager) {
            serializationObject.actions = scene.actionManager.serialize("scene");
        }

        // Components
        for (let component of scene._serializableComponents) {
            component.serialize(serializationObject);
        }

        return serializationObject;
    }

    /**
     * Serialize a mesh into a JSON compatible object
     * @param toSerialize defines the mesh to serialize
     * @param withParents defines if parents must be serialized as well
     * @param withChildren defines if children must be serialized as well
     * @returns a JSON compatible object
     */
    public static SerializeMesh(toSerialize: any /* Mesh || Mesh[] */, withParents: boolean = false, withChildren: boolean = false): any {
        var serializationObject: any = {};

        SceneSerializer.ClearCache();

        toSerialize = (toSerialize instanceof Array) ? toSerialize : [toSerialize];

        if (withParents || withChildren) {
            //deliberate for loop! not for each, appended should be processed as well.
            for (var i = 0; i < toSerialize.length; ++i) {
                if (withChildren) {
                    toSerialize[i].getDescendants().forEach((node: Node) => {
                        if (node instanceof Mesh && (toSerialize.indexOf(node) < 0) && !node.doNotSerialize) {
                            toSerialize.push(node);
                        }
                    });
                }
                //make sure the array doesn't contain the object already
                if (withParents && toSerialize[i].parent && (toSerialize.indexOf(toSerialize[i].parent) < 0) && !toSerialize[i].parent.doNotSerialize) {
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
