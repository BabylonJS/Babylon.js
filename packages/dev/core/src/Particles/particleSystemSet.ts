import type { Nullable } from "../types";
import { Color3 } from "../Maths/math.color";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { CreateSphere } from "../Meshes/Builders/sphereBuilder";
import type { IParticleSystem } from "./IParticleSystem";
import { GPUParticleSystem } from "./gpuParticleSystem";
import { EngineStore } from "../Engines/engineStore";
import { ParticleSystem } from "../Particles/particleSystem";
import type { Scene, IDisposable } from "../scene";
import { StandardMaterial } from "../Materials/standardMaterial";
import type { Vector3 } from "../Maths/math.vector";

/** Internal class used to store shapes for emitters */
class ParticleSystemSetEmitterCreationOptions {
    public kind: string;
    public options: any;
    public renderingGroupId: number;
}

/**
 * Represents a set of particle systems working together to create a specific effect
 */
export class ParticleSystemSet implements IDisposable {
    /**
     * Gets or sets base Assets URL
     */
    public static BaseAssetsUrl = "https://assets.babylonjs.com/particles";

    private _emitterCreationOptions: ParticleSystemSetEmitterCreationOptions;
    private _emitterNode: Nullable<AbstractMesh | Vector3>;
    private _emitterNodeIsOwned = true;

    /**
     * Gets the particle system list
     */
    public systems = new Array<IParticleSystem>();

    /**
     * Gets or sets the emitter node used with this set
     */
    public get emitterNode(): Nullable<AbstractMesh | Vector3> {
        return this._emitterNode;
    }

    public set emitterNode(value: Nullable<AbstractMesh | Vector3>) {
        if (this._emitterNodeIsOwned && this._emitterNode) {
            if ((this._emitterNode as AbstractMesh).dispose) {
                (this._emitterNode as AbstractMesh).dispose();
            }
            this._emitterNodeIsOwned = false;
        }

        for (const system of this.systems) {
            system.emitter = value;
        }

        this._emitterNode = value;
    }

    /**
     * Creates a new emitter mesh as a sphere
     * @param options defines the options used to create the sphere
     * @param options.diameter
     * @param options.segments
     * @param options.color
     * @param renderingGroupId defines the renderingGroupId to use for the sphere
     * @param scene defines the hosting scene
     */
    public setEmitterAsSphere(options: { diameter: number; segments: number; color: Color3 }, renderingGroupId: number, scene: Scene) {
        if (this._emitterNodeIsOwned && this._emitterNode) {
            if ((this._emitterNode as AbstractMesh).dispose) {
                (this._emitterNode as AbstractMesh).dispose();
            }
        }

        this._emitterNodeIsOwned = true;

        this._emitterCreationOptions = {
            kind: "Sphere",
            options: options,
            renderingGroupId: renderingGroupId,
        };

        const emitterMesh = CreateSphere("emitterSphere", { diameter: options.diameter, segments: options.segments }, scene);
        emitterMesh.renderingGroupId = renderingGroupId;

        const material = new StandardMaterial("emitterSphereMaterial", scene);
        material.emissiveColor = options.color;
        emitterMesh.material = material;

        for (const system of this.systems) {
            system.emitter = emitterMesh;
        }

        this._emitterNode = emitterMesh;
    }

    /**
     * Starts all particle systems of the set
     * @param emitter defines an optional mesh to use as emitter for the particle systems
     */
    public start(emitter?: AbstractMesh): void {
        for (const system of this.systems) {
            if (emitter) {
                system.emitter = emitter;
            }
            system.start();
        }
    }

    /**
     * Release all associated resources
     */
    public dispose(): void {
        for (const system of this.systems) {
            system.dispose();
        }

        this.systems.length = 0;

        if (this._emitterNode) {
            if ((this._emitterNode as AbstractMesh).dispose) {
                (this._emitterNode as AbstractMesh).dispose();
            }
            this._emitterNode = null;
        }
    }

    /**
     * Serialize the set into a JSON compatible object
     * @param serializeTexture defines if the texture must be serialized as well
     * @returns a JSON compatible representation of the set
     */
    public serialize(serializeTexture = false): any {
        const result: any = {};

        result.systems = [];
        for (const system of this.systems) {
            result.systems.push(system.serialize(serializeTexture));
        }

        if (this._emitterNode) {
            result.emitter = this._emitterCreationOptions;
        }

        return result;
    }

    /**
     * Parse a new ParticleSystemSet from a serialized source
     * @param data defines a JSON compatible representation of the set
     * @param scene defines the hosting scene
     * @param gpu defines if we want GPU particles or CPU particles
     * @param capacity defines the system capacity (if null or undefined the sotred capacity will be used)
     * @returns a new ParticleSystemSet
     */
    public static Parse(data: any, scene: Scene, gpu = false, capacity?: number): ParticleSystemSet {
        const result = new ParticleSystemSet();
        const rootUrl = this.BaseAssetsUrl + "/textures/";

        scene = scene || EngineStore.LastCreatedScene;

        for (const system of data.systems) {
            result.systems.push(gpu ? GPUParticleSystem.Parse(system, scene, rootUrl, true, capacity) : ParticleSystem.Parse(system, scene, rootUrl, true, capacity));
        }

        if (data.emitter) {
            const options = data.emitter.options;
            switch (data.emitter.kind) {
                case "Sphere":
                    result.setEmitterAsSphere(
                        {
                            diameter: options.diameter,
                            segments: options.segments,
                            color: Color3.FromArray(options.color),
                        },
                        data.emitter.renderingGroupId,
                        scene
                    );
                    break;
            }
        }

        return result;
    }
}
