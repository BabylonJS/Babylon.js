import { IDisposable } from "../scene";
import { IParticleSystem } from './IParticleSystem';

/**
 * Represents a set of particle systems working together to create a specific effect
 */
export class ParticleSystemDebugger implements IDisposable {

    public constructor(public system: IParticleSystem) {

    }

    /** Clear all the resources */
    public dispose() {

    }
}