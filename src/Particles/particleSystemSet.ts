import { Nullable } from "../types";
import { Color3 } from '../Maths/math.color';
import { TransformNode } from "../Meshes/transformNode";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { SphereBuilder } from "../Meshes/Builders/sphereBuilder";
import { IParticleSystem } from "./IParticleSystem";
import { GPUParticleSystem } from "./gpuParticleSystem";
import { EngineStore } from "../Engines/engineStore";
import { ParticleSystem } from "../Particles/particleSystem";
import { Scene, IDisposable } from "../scene";
import { StandardMaterial } from "../Materials/standardMaterial";

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
    private _emitterNode: Nullable<TransformNode>;

    /**
     * Gets the particle system list
     */
    public systems = new Array<IParticleSystem>();

    /**
     * Gets the emitter node used with this set
     */
    public get emitterNode(): Nullable<TransformNode> {
        return this._emitterNode;
    }

    /**
     * Creates a new emitter mesh as a sphere
     * @param options defines the options used to create the sphere
     * @param renderingGroupId defines the renderingGroupId to use for the sphere
     * @param scene defines the hosting scene
     */
    public setEmitterAsSphere(options: { diameter: number, segments: number, color: Color3 }, renderingGroupId: number, scene: Scene) {
        if (this._emitterNode) {
            this._emitterNode.dispose();
        }

        this._emitterCreationOptions = {
            kind: "Sphere",
            options: options,
            renderingGroupId: renderingGroupId
        };

        let emitterMesh = SphereBuilder.CreateSphere("emitterSphere", { diameter: options.diameter, segments: options.segments }, scene);
        emitterMesh.renderingGroupId = renderingGroupId;

        var material = new StandardMaterial("emitterSphereMaterial", scene);
        material.emissiveColor = options.color;
        emitterMesh.material = material;

        for (var system of this.systems) {
            system.emitter = emitterMesh;
        }

        this._emitterNode = emitterMesh;
    }

    /**
     * Starts all particle systems of the set
     * @param emitter defines an optional mesh to use as emitter for the particle systems
     */
    public start(emitter?: AbstractMesh): void {
        for (var system of this.systems) {
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
        for (var system of this.systems) {
            system.dispose();
        }

        this.systems = [];

        if (this._emitterNode) {
            this._emitterNode.dispose();
            this._emitterNode = null;
        }
    }

    /**
     * Serialize the set into a JSON compatible object
     * @param serializeTexture defines if the texture must be serialized as well
     * @returns a JSON compatible representation of the set
     */
    public serialize(serializeTexture = false): any {
        var result: any = {};

        result.systems = [];
        for (var system of this.systems) {
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
     * @returns a new ParticleSystemSet
     */
    public static Parse(data: any, scene: Scene, gpu = false): ParticleSystemSet {
        var result = new ParticleSystemSet();
        var rootUrl = this.BaseAssetsUrl + "/textures/";

        scene = scene || EngineStore.LastCreatedScene;

        for (var system of data.systems) {
            result.systems.push(gpu ? GPUParticleSystem.Parse(system, scene, rootUrl, true) : ParticleSystem.Parse(system, scene, rootUrl, true));
        }

        if (data.emitter) {
            let options = data.emitter.options;
            switch (data.emitter.kind) {
                case "Sphere":
                    result.setEmitterAsSphere({
                        diameter: options.diameter,
                        segments: options.segments,
                        color: Color3.FromArray(options.color)
                    }, data.emitter.renderingGroupId, scene);
                    break;
            }
        }

        return result;
    }
}