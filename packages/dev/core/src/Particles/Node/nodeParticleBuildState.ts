import type { Scene } from "core/scene";
import type { NodeParticleConnectionPoint } from "./nodeParticleBlockConnectionPoint";

/**
 * Class used to store node based geometry build state
 */
export class NodeParticleBuildState {
    /**
     * Gets the capactity of the particle system to build
     */
    public capacity: number;

    /**
     * Gets the scene where the particle system is built
     */
    public scene: Scene;

    /** Gets or sets the build identifier */
    public buildId: number;

    /** Gets or sets the list of non connected mandatory inputs */
    public notConnectedNonOptionalInputs: NodeParticleConnectionPoint[] = [];

    /** Gets or sets a boolean indicating that verbose mode is on */
    public verbose: boolean;
}
