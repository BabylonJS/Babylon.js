import type { Nullable, AbstractMesh, IParticleSystem } from "core/index";

/**
 * Structure used by the frame graph to reference objects.
 */
export class FrameGraphObjectList {
    /**
     * The meshes in the object list.
     */
    public meshes: Nullable<AbstractMesh[]>;
    /**
     * The particle systems in the object list.
     */
    public particleSystems: Nullable<IParticleSystem[]>;
    // todo: sprites?
}
