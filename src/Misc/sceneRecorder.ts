import { Scene } from '../scene';
import { Nullable } from '../types';
import { SceneSerializer } from './sceneSerializer';
import { Mesh } from '../Meshes/mesh';
import { Light } from '../Lights/light';
import { Camera } from '../Cameras/camera';
import { Skeleton } from '../Bones/skeleton';
import { Material } from '../Materials/material';
import { MultiMaterial } from '../Materials/multiMaterial';
import { TransformNode } from '../Meshes/transformNode';
import { ParticleSystem } from '../Particles/particleSystem';
import { MorphTargetManager } from '../Morph/morphTargetManager';
import { ShadowGenerator } from '../Lights/Shadows/shadowGenerator';
import { PostProcess } from '../PostProcesses/postProcess';
import { Texture } from "../Materials/Textures/texture";
import { SerializationHelper } from './decorators';

/**
 * Class used to record delta files between 2 scene states
 */
export class SceneRecorder {
    private _trackedScene: Nullable<Scene> = null;
    private _savedJSON: any;

    /**
     * Track a given scene. This means the current scene state will be considered the original state
     * @param scene defines the scene to track
     */
    public track(scene: Scene) {
        this._trackedScene = scene;

        SerializationHelper.AllowLoadingUniqueId = true;
        this._savedJSON = SceneSerializer.Serialize(scene);
        SerializationHelper.AllowLoadingUniqueId = false;
    }

    /**
     * Get the delta between current state and original state
     * @returns a any containing the delta
     */
    public getDelta(): any {
        if (!this._trackedScene) {
            return null;
        }

        const currentForceSerializeBuffers = Texture.ForceSerializeBuffers;
        Texture.ForceSerializeBuffers = false;

        SerializationHelper.AllowLoadingUniqueId = true;
        let newJSON = SceneSerializer.Serialize(this._trackedScene);
        SerializationHelper.AllowLoadingUniqueId = false;
        let deltaJSON: any = {};

        for (var node in newJSON) {
            this._compareCollections(node, this._savedJSON[node], newJSON[node], deltaJSON);
        }

        Texture.ForceSerializeBuffers = currentForceSerializeBuffers;

        return deltaJSON;
    }

    private _compareArray(key: string, original: any[], current: any[], deltaJSON: any) {
        if (original.length === 0 && current.length === 0) {
            return true;
        }

        // Numbers?
        if (original.length && !isNaN(original[0]) || current.length && !isNaN(current[0])) {
            if (original.length !== current.length) {
                return false;
            }

            if (original.length === 0) {
                return true;
            }
            for (var index = 0; index < original.length; index++) {
                if (original[index] !== current[index]) {
                    deltaJSON[key] = current;
                    return false;
                }
            }
            return true;
        }

        // let's use uniqueId to find similar objects
        let originalUniqueIds: number[] = [];
        for (var index = 0; index < original.length; index++) {
            let originalObject = original[index];
            let originalUniqueId = originalObject.uniqueId;

            originalUniqueIds.push(originalUniqueId);
            // Look for that object in current state
            let currentObjects = current.filter((c) => c.uniqueId === originalUniqueId);
            if (currentObjects.length) { // We have a candidate
                let currentObject = currentObjects[0];

                let newObject: any = {};
                if (!this._compareObjects(originalObject, currentObject, newObject)) {
                    if (!deltaJSON[key]) {
                        deltaJSON[key] = [];
                    }
                    newObject.__state = {
                        id: currentObject.id || currentObject.name
                    };
                    deltaJSON[key].push(newObject);
                }
            } else {
                // We need to delete
                let newObject: any = {
                    __state: {
                        deleteId: originalObject.id || originalObject.name
                    }
                };
                deltaJSON[key].push(newObject);
            }
        }

        // Checking for new objects
        for (var index = 0; index < current.length; index++) {
            let currentObject = current[index];
            let currentUniqueId = currentObject.uniqueId;

            // Object was added
            if (originalUniqueIds.indexOf(currentUniqueId) === -1) {
                if (!deltaJSON[key]) {
                    deltaJSON[key] = [];
                }

                deltaJSON[key].push(currentObject);
            }
        }

        return true;
    }

    private _compareObjects(originalObjet: any, currentObject: any, deltaJSON: any) {
        let aDifferenceWasFound = false;

        for (var prop in originalObjet) {
            if (!originalObjet.hasOwnProperty(prop)) {
                continue;
            }
            var originalValue = originalObjet[prop];
            var currentValue = currentObject[prop];
            var diffFound = false;

            if (Array.isArray(originalValue)) {
                diffFound = (JSON.stringify(originalValue) !== JSON.stringify(currentValue));
            } else if (!isNaN(originalValue) || Object.prototype.toString.call(originalValue) == '[object String]') {
                diffFound = (originalValue !== currentValue);
            } else if (typeof originalValue === "object" && typeof currentValue === "object") {
                let newObject = {};
                if (!this._compareObjects(originalValue, currentValue, newObject)) {
                    deltaJSON[prop] = newObject;
                    aDifferenceWasFound = true;
                }
            }

            if (diffFound) {
                aDifferenceWasFound = true;
                deltaJSON[prop] = currentValue;
            }
        }

        return !aDifferenceWasFound;
    }

    private _compareCollections(key: string, original: any[], current: any[], deltaJSON: any) {
        // Same ?
        if (original === current) {
            return;
        }

        if (original && current) {
            // Array?
            if (Array.isArray(original) && Array.isArray(current)) {
                if (this._compareArray(key, original, current, deltaJSON)) {
                    return;
                }
            } else if (typeof original === "object" && typeof current === "object") { // Object
                let newObject = {};
                if (!this._compareObjects(original, current, newObject)) {
                    deltaJSON[key] = newObject;
                }
                return;
            }
        }
    }

    private static GetShadowGeneratorById(scene: Scene, id: string) {
        var generators = scene.lights.map((l) => l.getShadowGenerator());

        for (var generator of generators) {
            if (generator && generator.id === id) {
                return generator;
            }
        }

        return null;
    }

    /**
     * Apply a given delta to a given scene
     * @param deltaJSON defines the JSON containing the delta
     * @param scene defines the scene to apply the delta to
     */
    public static ApplyDelta(deltaJSON: any | string, scene: Scene) {

        if (typeof deltaJSON === 'string') {
            deltaJSON = JSON.parse(deltaJSON);
        }

        // Scene
        let anyScene = scene as any;
        for (var prop in deltaJSON) {
            var source = deltaJSON[prop];
            var property = anyScene[prop];

            if (Array.isArray(property) || prop === "shadowGenerators") { // Restore array
                switch (prop) {
                    case "cameras":
                        this._ApplyDeltaForEntity(source, scene, scene.getCameraById.bind(scene), (data) => Camera.Parse(data, scene));
                        break;
                    case "lights":
                        this._ApplyDeltaForEntity(source, scene, scene.getLightById.bind(scene), (data) => Light.Parse(data, scene));
                        break;
                    case "shadowGenerators":
                        this._ApplyDeltaForEntity(source, scene, (id) => this.GetShadowGeneratorById(scene, id), (data) => ShadowGenerator.Parse(data, scene));
                        break;
                    case "meshes":
                        this._ApplyDeltaForEntity(source, scene, scene.getMeshById.bind(scene), (data) => Mesh.Parse(data, scene, ""));
                        break;
                    case "skeletons":
                        this._ApplyDeltaForEntity(source, scene, scene.getSkeletonById.bind(scene), (data) => Skeleton.Parse(data, scene));
                        break;
                    case "materials":
                        this._ApplyDeltaForEntity(source, scene, scene.getMaterialById.bind(scene), (data) => Material.Parse(data, scene, ""));
                        break;
                    case "multiMaterials":
                        this._ApplyDeltaForEntity(source, scene, scene.getMaterialById.bind(scene), (data) => MultiMaterial.Parse(data, scene, ""));
                        break;
                    case "transformNodes":
                        this._ApplyDeltaForEntity(source, scene, scene.getTransformNodeById.bind(scene), (data) => TransformNode.Parse(data, scene, ""));
                        break;
                    case "particleSystems":
                        this._ApplyDeltaForEntity(source, scene, scene.getParticleSystemById.bind(scene), (data) => ParticleSystem.Parse(data, scene, ""));
                        break;
                    case "morphTargetManagers":
                        this._ApplyDeltaForEntity(source, scene, scene.getMorphTargetById.bind(scene), (data) => MorphTargetManager.Parse(data, scene));
                        break;
                    case "postProcesses":
                        this._ApplyDeltaForEntity(source, scene, scene.getPostProcessByName.bind(scene), (data) => PostProcess.Parse(data, scene, ""));
                        break;
                }
            } else if (!isNaN(property)) {
                anyScene[prop] = source;
            } else if (property.fromArray) {
                property.fromArray(source);
            }
        }
    }

    private static _ApplyPropertiesToEntity(deltaJSON: any, entity: any) {
        for (var prop in deltaJSON) {
            var source = deltaJSON[prop];
            var property = entity[prop];

            if (property === undefined) {
                continue;
            }

            if (!isNaN(property) || Array.isArray(property)) {
                entity[prop] = source;
            } else if (property.fromArray) {
                property.fromArray(source);
            } else if (typeof property === "object" && property !== null) {
                this._ApplyPropertiesToEntity(source, property);
            }
        }
    }

    private static _ApplyDeltaForEntity(sources: any[], scene: Scene, finder: (id: string) => any, addNew: (data: any) => void) {
        for (var source of sources) {

            // Update
            if (source.__state && source.__state.id !== undefined) {
                let targetEntity = finder(source.__state.id);

                if (targetEntity) {
                    this._ApplyPropertiesToEntity(source, targetEntity);
                }
            } else if (source.__state && source.__state.deleteId !== undefined) {
                let target = finder(source.__state.deleteId);
                target?.dispose();
            } else {
                // New
                addNew(source);
            }

        }
    }
}