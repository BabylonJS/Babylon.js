import { IDisposable } from "../scene";
import { IParticleSystem } from './IParticleSystem';

/**
 * Represents a set of particle systems working together to create a specific effect
 */
export class ParticleSystemDebugger implements IDisposable {

    /**
     * Creates a new particle system debugger
     * @param system defines the particle system to debug
     */
    public constructor(
        /**
         * Defines the particle system to debug
         */
        public system: IParticleSystem) {

    }

    /** Clear all the resources */
    public dispose() {

    }
}