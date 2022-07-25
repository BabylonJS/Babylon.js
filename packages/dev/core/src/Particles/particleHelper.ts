import type { Nullable } from "../types";
import type { Scene } from "../scene";
import { Tools } from "../Misc/tools";
import type { Vector3 } from "../Maths/math.vector";
import { Color4 } from "../Maths/math.color";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { Texture } from "../Materials/Textures/texture";
import { EngineStore } from "../Engines/engineStore";
import type { IParticleSystem } from "./IParticleSystem";
import { GPUParticleSystem } from "./gpuParticleSystem";
import { ParticleSystemSet } from "./particleSystemSet";
import { ParticleSystem } from "./particleSystem";
import { WebRequest } from "../Misc/webRequest";
import { Constants } from "../Engines/constants";
/**
 * This class is made for on one-liner static method to help creating particle system set.
 */
export class ParticleHelper {
    /**
     * Gets or sets base Assets URL
     */
    public static BaseAssetsUrl = ParticleSystemSet.BaseAssetsUrl;

    /** Define the Url to load snippets */
    public static SnippetUrl = Constants.SnippetUrl;

    /**
     * Create a default particle system that you can tweak
     * @param emitter defines the emitter to use
     * @param capacity defines the system capacity (default is 500 particles)
     * @param scene defines the hosting scene
     * @param useGPU defines if a GPUParticleSystem must be created (default is false)
     * @returns the new Particle system
     */
    public static CreateDefault(emitter: Nullable<AbstractMesh | Vector3>, capacity = 500, scene?: Scene, useGPU = false): IParticleSystem {
        let system: IParticleSystem;

        if (useGPU) {
            system = new GPUParticleSystem("default system", { capacity: capacity }, scene!);
        } else {
            system = new ParticleSystem("default system", capacity, scene!);
        }

        system.emitter = emitter;
        system.particleTexture = new Texture("https://assets.babylonjs.com/textures/flare.png", system.getScene());
        system.createConeEmitter(0.1, Math.PI / 4);

        // Particle color
        system.color1 = new Color4(1.0, 1.0, 1.0, 1.0);
        system.color2 = new Color4(1.0, 1.0, 1.0, 1.0);
        system.colorDead = new Color4(1.0, 1.0, 1.0, 0.0);

        // Particle Size
        system.minSize = 0.1;
        system.maxSize = 0.1;

        // Emission speed
        system.minEmitPower = 2;
        system.maxEmitPower = 2;

        // Update speed
        system.updateSpeed = 1 / 60;

        system.emitRate = 30;

        return system;
    }

    /**
     * This is the main static method (one-liner) of this helper to create different particle systems
     * @param type This string represents the type to the particle system to create
     * @param scene The scene where the particle system should live
     * @param gpu If the system will use gpu
     * @param capacity defines the system capacity (if null or undefined the sotred capacity will be used)
     * @returns the ParticleSystemSet created
     */
    public static CreateAsync(type: string, scene: Nullable<Scene>, gpu: boolean = false, capacity?: number): Promise<ParticleSystemSet> {
        if (!scene) {
            scene = EngineStore.LastCreatedScene;
        }

        const token = {};

        scene!.addPendingData(token);

        return new Promise((resolve, reject) => {
            if (gpu && !GPUParticleSystem.IsSupported) {
                scene!.removePendingData(token);
                return reject("Particle system with GPU is not supported.");
            }

            Tools.LoadFile(
                `${ParticleHelper.BaseAssetsUrl}/systems/${type}.json`,
                (data) => {
                    scene!.removePendingData(token);
                    const newData = JSON.parse(data.toString());
                    return resolve(ParticleSystemSet.Parse(newData, scene!, gpu, capacity));
                },
                undefined,
                undefined,
                undefined,
                () => {
                    scene!.removePendingData(token);
                    return reject(`An error occurred with the creation of your particle system. Check if your type '${type}' exists.`);
                }
            );
        });
    }

    /**
     * Static function used to export a particle system to a ParticleSystemSet variable.
     * Please note that the emitter shape is not exported
     * @param systems defines the particle systems to export
     * @returns the created particle system set
     */
    public static ExportSet(systems: IParticleSystem[]): ParticleSystemSet {
        const set = new ParticleSystemSet();

        for (const system of systems) {
            set.systems.push(system);
        }

        return set;
    }

    /**
     * Creates a particle system from a snippet saved in a remote file
     * @param name defines the name of the particle system to create (can be null or empty to use the one from the json data)
     * @param url defines the url to load from
     * @param scene defines the hosting scene
     * @param gpu If the system will use gpu
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @param capacity defines the system capacity (if null or undefined the sotred capacity will be used)
     * @returns a promise that will resolve to the new particle system
     */
    public static ParseFromFileAsync(name: Nullable<string>, url: string, scene: Scene, gpu: boolean = false, rootUrl: string = "", capacity?: number): Promise<IParticleSystem> {
        return new Promise((resolve, reject) => {
            const request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        const serializationObject = JSON.parse(request.responseText);
                        let output: IParticleSystem;

                        if (gpu) {
                            output = GPUParticleSystem.Parse(serializationObject, scene, rootUrl, false, capacity);
                        } else {
                            output = ParticleSystem.Parse(serializationObject, scene, rootUrl, false, capacity);
                        }

                        if (name) {
                            output.name = name;
                        }

                        resolve(output);
                    } else {
                        reject("Unable to load the particle system");
                    }
                }
            });

            request.open("GET", url);
            request.send();
        });
    }

    /**
     * Creates a particle system from a snippet saved by the particle system editor
     * @param snippetId defines the snippet to load (can be set to _BLANK to create a default one)
     * @param scene defines the hosting scene
     * @param gpu If the system will use gpu
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @param capacity defines the system capacity (if null or undefined the sotred capacity will be used)
     * @returns a promise that will resolve to the new particle system
     */
    public static ParseFromSnippetAsync(snippetId: string, scene: Scene, gpu: boolean = false, rootUrl: string = "", capacity?: number): Promise<IParticleSystem> {
        if (snippetId === "_BLANK") {
            const system = this.CreateDefault(null);
            system.start();
            return Promise.resolve(system);
        }

        return new Promise((resolve, reject) => {
            const request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        const snippet = JSON.parse(JSON.parse(request.responseText).jsonPayload);
                        const serializationObject = JSON.parse(snippet.particleSystem);
                        let output: IParticleSystem;

                        if (gpu) {
                            output = GPUParticleSystem.Parse(serializationObject, scene, rootUrl, false, capacity);
                        } else {
                            output = ParticleSystem.Parse(serializationObject, scene, rootUrl, false, capacity);
                        }
                        output.snippetId = snippetId;

                        resolve(output);
                    } else {
                        reject("Unable to load the snippet " + snippetId);
                    }
                }
            });

            request.open("GET", this.SnippetUrl + "/" + snippetId.replace(/#/g, "/"));
            request.send();
        });
    }

    /**
     * Creates a particle system from a snippet saved by the particle system editor
     * @deprecated Please use ParseFromSnippetAsync instead
     * @param snippetId defines the snippet to load (can be set to _BLANK to create a default one)
     * @param scene defines the hosting scene
     * @param gpu If the system will use gpu
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @param capacity defines the system capacity (if null or undefined the sotred capacity will be used)
     * @returns a promise that will resolve to the new particle system
     */
    public static CreateFromSnippetAsync = ParticleHelper.ParseFromSnippetAsync;
}
