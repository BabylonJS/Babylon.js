// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractMesh, IParticleSystem } from "core/index";

/**
 * Structure used by the frame graph to reference objects.
 * @experimental
 */
export class FrameGraphObjectList {
    /**
     * The meshes in the object list.
     */
    meshes: Nullable<AbstractMesh[]>;
    /**
     * The particle systems in the object list.
     */
    particleSystems: Nullable<IParticleSystem[]>;
    // todo: sprites?
}
