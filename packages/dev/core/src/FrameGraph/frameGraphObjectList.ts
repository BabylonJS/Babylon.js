import { type Nullable, type AbstractMesh, type IParticleSystem, type ISpriteManager } from "core/index";

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
    /**
     * The sprite managers in the object list. If omitted or null, all sprite managers in the scene are used. An empty array renders none.
     * @see https://playground.babylonjs.com/#PVK3RV#2
     */
    public spriteManagers?: Nullable<ISpriteManager[]>;
}
