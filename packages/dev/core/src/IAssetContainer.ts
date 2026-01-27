import type { Nullable } from "./types";
import type { AbstractMesh } from "./Meshes/abstractMesh";
import type { TransformNode } from "./Meshes/transformNode";
import type { Geometry } from "./Meshes/geometry";
import type { Skeleton } from "./Bones/skeleton";
import type { MorphTargetManager } from "./Morph/morphTargetManager";
import type { IParticleSystem } from "./Particles/IParticleSystem";
import type { AnimationGroup } from "./Animations/animationGroup";
import type { BaseTexture } from "./Materials/Textures/baseTexture";
import type { Material } from "./Materials/material";
import type { MultiMaterial } from "./Materials/multiMaterial";
import type { AbstractActionManager } from "./Actions/abstractActionManager";
import type { Camera } from "./Cameras/camera";
import type { Light } from "./Lights/light";
import type { Node } from "./node";
import type { PostProcess } from "./PostProcesses/postProcess";
import type { Animation } from "./Animations/animation";
import type { Sound } from "./Audio/sound";
import type { Layer } from "./Layers/layer";
import type { EffectLayer } from "./Layers/effectLayer";
import type { ReflectionProbe } from "./Probes/reflectionProbe";
import type { LensFlareSystem } from "./LensFlares/lensFlareSystem";
import type { ProceduralTexture } from "./Materials/Textures/Procedurals/proceduralTexture";
import type { ISpriteManager } from "./Sprites/spriteManager";
/**
 * Interface defining container for the different elements composing a scene.
 * This class is dynamically extended by the different components of the scene increasing
 * flexibility and reducing coupling
 */
export interface IAssetContainer {
    /**
     * Gets the list of root nodes (ie. nodes with no parent)
     */
    rootNodes: Node[];

    /** All of the cameras added to this scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras
     */
    cameras: Camera[];

    /**
     * All of the lights added to this scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
     */
    lights: Light[];

    /**
     * All of the (abstract) meshes added to this scene
     */
    meshes: AbstractMesh[];

    /**
     * The list of skeletons added to the scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/bonesSkeletons
     */
    skeletons: Skeleton[];

    /**
     * All of the particle systems added to this scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particle_system_intro
     */
    particleSystems: IParticleSystem[];

    /**
     * Gets a list of Animations associated with the scene
     */
    animations: Animation[];

    /**
     * All of the animation groups added to this scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/groupAnimations
     */
    animationGroups: AnimationGroup[];

    /**
     * All of the multi-materials added to this scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/multiMaterials
     */
    multiMaterials: MultiMaterial[];

    /**
     * All of the materials added to this scene
     * In the context of a Scene, it is not supposed to be modified manually.
     * Any addition or removal should be done using the addMaterial and removeMaterial Scene methods.
     * Note also that the order of the Material within the array is not significant and might change.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction
     */
    materials: Material[];

    /**
     * The list of morph target managers added to the scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/dynamicMeshMorph
     */
    morphTargetManagers: MorphTargetManager[];

    /**
     * The list of geometries used in the scene.
     */
    geometries: Geometry[];

    /**
     * All of the transform nodes added to this scene
     * In the context of a Scene, it is not supposed to be modified manually.
     * Any addition or removal should be done using the addTransformNode and removeTransformNode Scene methods.
     * Note also that the order of the TransformNode within the array is not significant and might change.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/parent_pivot/transform_node
     */
    transformNodes: TransformNode[];

    /**
     * ActionManagers available on the scene.
     * @deprecated
     */
    actionManagers: AbstractActionManager[];

    /**
     * Textures to keep.
     */
    textures: BaseTexture[];

    /**
     * Texture used in all pbr material as the reflection texture.
     * As in the majority of the scene they are the same (exception for multi room and so on),
     * this is easier to reference from here than from all the materials.
     */
    environmentTexture: Nullable<BaseTexture>;

    /**
     * The list of postprocesses added to the scene
     */
    postProcesses: PostProcess[];

    /**
     * The list of sound added to the scene
     */
    sounds: Nullable<Sound[]>;

    /**
     * The list of effect layers added to the scene
     */
    effectLayers: EffectLayer[];

    /**
     * The list of layers added to the scene
     */
    layers: Layer[];

    /**
     * The list of reflection probes added to the scene
     */
    reflectionProbes: ReflectionProbe[];

    /**
     * The list of lens flare system added to the scene
     */
    lensFlareSystems: LensFlareSystem[];

    /**
     * The list of procedural textures added to the scene
     */
    proceduralTextures: ProceduralTexture[];

    /**
     * The list of sprite managers added to the scene
     */
    spriteManagers?: ISpriteManager[];

    /**
     * @returns all meshes, lights, cameras, transformNodes and bones
     */
    getNodes(): Array<Node>;
}
