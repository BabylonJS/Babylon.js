import type { Nullable } from "../types";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { IParticleSystem } from "../Particles/IParticleSystem";

export class FrameGraphObjectList {
    meshes: Nullable<AbstractMesh[]>;
    particleSystems: Nullable<IParticleSystem[]>;
}
