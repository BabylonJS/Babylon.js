import { Scene } from '../scene';
import { Nullable } from '../types';
import { SceneSerializer } from './sceneSerializer';
import { SceneLoader } from '../Loading/sceneLoader';

export class SceneRecorder {
    private _trackedScene: Nullable<Scene> = null;
    private _savedJSON: any;

    public track(scene: Scene) {
        this._trackedScene = scene;

        this._savedJSON = SceneSerializer.Serialize(scene);
    }

    public getDiff() {
        if (!this._trackedScene) {
            return null;
        }

        let newJSON = SceneSerializer.Serialize(this._trackedScene);
        let diffJSON: any = {};

        for (var node in newJSON) {
            console.log("Processing " + node);
            this._compareCollections(node, this._savedJSON[node], newJSON[node], diffJSON);
        }

        console.log(diffJSON);

        return diffJSON;
    }

    private _compareArray(key: string, original: any[], current: any[], diffJSON: any) {
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
                console.log("Checking array of numbers");
            for (var index = 0; index < original.length; index++) {
                if (original[index] !== current[index]) {
                    diffJSON[key] = current;
                    return false;
                }
            }
            return true;
        }

        console.log("checking array of objects");

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

                let newObject = {};
                if (!this._compareObjects(originalObject, currentObject, newObject)) {
                    if (!diffJSON[key]) {
                        diffJSON[key] = [];
                    }
                    currentObject.__state = {
                        id: currentObject.id
                    };
                    diffJSON[key].push(newObject);
                }
            }
        }

        // Checking for new objects
        for (var index = 0; index < current.length; index++) {
            let currentObject = current[index];
            let currentUniqueId = currentObject.uniqueId;

            // Object was added
            if (originalUniqueIds.indexOf(currentUniqueId) === -1) {
                if (!diffJSON[key]) {
                    diffJSON[key] = [];
                }

                
                diffJSON[key].push(currentObject);
            }
        }

        return true;
    }

    private _compareObjects(originalObjet: any, currentObject: any, diffJSON: any) {
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
            }

            if (diffFound) {
                aDifferenceWasFound = true;
                diffJSON[prop] = currentValue;
            }
        }

        return !aDifferenceWasFound;
    }

    private _compareCollections(key: string, original: any[], current: any[], diffJSON: any) {
        console.log(original, typeof original);
        console.log(current, typeof current);

        // Same ?
        if (original === current) {
            console.log("same");
            return;
        }

        if (original && current) {
            // Array?
            if (Array.isArray(original) && Array.isArray(current)) {
                if (this._compareArray(key, original, current, diffJSON)) {
                    console.log("same array");
                    return;
                }
            } else if (typeof original === "object" && typeof current === "object") { // Object
                let newObject = {};
                if (!this._compareObjects(original, current, newObject)) {
                    diffJSON[key] = newObject;
                }
                return;
            }
        }

        // New
        if (current) {

        }

        // Delete
        if (original) {

        }
    }

    public applyDiff(diffJSON: any, scene: Scene) {
        let babylonExtension: any = SceneLoader.GetDefaultPlugin();

        // Scene
        let anyScene = scene as any;
        for (var prop in diffJSON) {
            var property = anyScene[prop];

            if (Array.isArray(property)) { // Restore array

            } else if (!isNaN(property)) {
                anyScene[prop] = diffJSON[prop];
            } else if (property.fromArray) {
                property.fromArray(diffJSON[prop]);
            }
        }
    }
}