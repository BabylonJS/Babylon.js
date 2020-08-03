import { Vector3 } from "../Maths/math.vector";
import { _DevTools } from '../Misc/devTools';
import { ThinEngine } from '../Engines/thinEngine';
import { _TypeStore } from '../Misc/typeStore';

declare type Scene = import("../scene").Scene;
declare type AbstractMesh = import("../Meshes/abstractMesh").AbstractMesh;
declare type ParticleSystem = import("../Particles/particleSystem").ParticleSystem;

/**
     * Type of sub emitter
     */
export enum SubEmitterType {
    /**
     * Attached to the particle over it's lifetime
     */
    ATTACHED,
    /**
     * Created when the particle dies
     */
    END
}

/**
 * Sub emitter class used to emit particles from an existing particle
 */
export class SubEmitter {
    /**
     * Type of the submitter (Default: END)
     */
    public type = SubEmitterType.END;
    /**
     * If the particle should inherit the direction from the particle it's attached to. (+Y will face the direction the particle is moving) (Default: false)
     * Note: This only is supported when using an emitter of type Mesh
     */
    public inheritDirection = false;
    /**
     * How much of the attached particles speed should be added to the sub emitted particle (default: 0)
     */
    public inheritedVelocityAmount = 0;
    /**
     * Creates a sub emitter
     * @param particleSystem the particle system to be used by the sub emitter
     */
    constructor(
        /**
         * the particle system to be used by the sub emitter
         */
        public particleSystem: ParticleSystem
    ) {
        // Create mesh as emitter to support rotation
        if (!particleSystem.emitter || !(<AbstractMesh>particleSystem.emitter).dispose) {            
            const internalClass = _TypeStore.GetClass("BABYLON.AbstractMesh");
            particleSystem.emitter = new internalClass("SubemitterSystemEmitter", particleSystem.getScene());
        }

        // Automatically dispose of subemitter when system is disposed
        particleSystem.onDisposeObservable.add(() => {
            if (particleSystem.emitter && (<AbstractMesh>particleSystem.emitter).dispose) {
                (<AbstractMesh>particleSystem.emitter).dispose();
            }
        });
    }
    /**
     * Clones the sub emitter
     * @returns the cloned sub emitter
     */
    public clone(): SubEmitter {
        // Clone particle system
        var emitter = this.particleSystem.emitter;
        if (!emitter) {
            emitter = new Vector3();
        } else if (emitter instanceof Vector3) {
            emitter = emitter.clone();
        } else if (emitter.getClassName().indexOf("Mesh") !== -1) {
            const internalClass = _TypeStore.GetClass("BABYLON.Mesh");
            emitter = new internalClass("", emitter.getScene());
            (emitter! as any).isVisible = false;
        }
        var clone = new SubEmitter(this.particleSystem.clone("", emitter));

        // Clone properties
        clone.particleSystem.name += "Clone";
        clone.type = this.type;
        clone.inheritDirection = this.inheritDirection;
        clone.inheritedVelocityAmount = this.inheritedVelocityAmount;

        clone.particleSystem._disposeEmitterOnDispose = true;
        clone.particleSystem.disposeOnStop = true;
        return clone;
    }

    /**
     * Serialize current object to a JSON object
     * @returns the serialized object
     */
    public serialize(): any {
        let serializationObject: any = {};

        serializationObject.type = this.type;
        serializationObject.inheritDirection = this.inheritDirection;
        serializationObject.inheritedVelocityAmount = this.inheritedVelocityAmount;
        serializationObject.particleSystem = this.particleSystem.serialize();

        return serializationObject;
    }

    /** @hidden */
    public static _ParseParticleSystem(system: any, sceneOrEngine: Scene | ThinEngine, rootUrl: string): ParticleSystem {
        throw _DevTools.WarnImport("ParseParticle");
    }

    /**
     * Creates a new SubEmitter from a serialized JSON version
     * @param serializationObject defines the JSON object to read from
     * @param sceneOrEngine defines the hosting scene or the hosting engine
     * @param rootUrl defines the rootUrl for data loading
     * @returns a new SubEmitter
     */
    public static Parse(serializationObject: any, sceneOrEngine: Scene | ThinEngine, rootUrl: string): SubEmitter {
        let system = serializationObject.particleSystem;
        let subEmitter = new SubEmitter(SubEmitter._ParseParticleSystem(system, sceneOrEngine, rootUrl));
        subEmitter.type = serializationObject.type;
        subEmitter.inheritDirection = serializationObject.inheritDirection;
        subEmitter.inheritedVelocityAmount = serializationObject.inheritedVelocityAmount;
        subEmitter.particleSystem._isSubEmitter = true;

        return subEmitter;
    }

    /** Release associated resources */
    public dispose() {
        this.particleSystem.dispose();
    }
}
