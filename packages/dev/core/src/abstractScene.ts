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
import { RegisterClass } from "./Misc/typeStore";

/**
 * Base class of the scene acting as a container for the different elements composing a scene.
 * This class is dynamically extended by the different components of the scene increasing
 * flexibility and reducing coupling
 */
export abstract class AbstractScene {
    /**
     * Gets the list of root nodes (ie. nodes with no parent)
     */
    public rootNodes: Node[] = [];

    /** All of the cameras added to this scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras
     */
    public cameras: Camera[] = [];

    /**
     * All of the lights added to this scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
     */
    public lights: Light[] = [];

    /**
     * All of the (abstract) meshes added to this scene
     */
    public meshes: AbstractMesh[] = [];

    /**
     * The list of skeletons added to the scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/bonesSkeletons
     */
    public skeletons: Skeleton[] = [];

    /**
     * All of the particle systems added to this scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particle_system_intro
     */
    public particleSystems: IParticleSystem[] = [];

    /**
     * Gets a list of Animations associated with the scene
     */
    public animations: Animation[] = [];

    /**
     * All of the animation groups added to this scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/groupAnimations
     */
    public animationGroups: AnimationGroup[] = [];

    /**
     * All of the multi-materials added to this scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/multiMaterials
     */
    public multiMaterials: MultiMaterial[] = [];

    /**
     * All of the materials added to this scene
     * In the context of a Scene, it is not supposed to be modified manually.
     * Any addition or removal should be done using the addMaterial and removeMaterial Scene methods.
     * Note also that the order of the Material within the array is not significant and might change.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction
     */
    public materials: Material[] = [];

    /**
     * The list of morph target managers added to the scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/dynamicMeshMorph
     */
    public morphTargetManagers: MorphTargetManager[] = [];

    /**
     * The list of geometries used in the scene.
     */
    public geometries: Geometry[] = [];

    /**
     * All of the transform nodes added to this scene
     * In the context of a Scene, it is not supposed to be modified manually.
     * Any addition or removal should be done using the addTransformNode and removeTransformNode Scene methods.
     * Note also that the order of the TransformNode within the array is not significant and might change.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/parent_pivot/transform_node
     */
    public transformNodes: TransformNode[] = [];

    /**
     * ActionManagers available on the scene.
     * @deprecated
     */
    public actionManagers: AbstractActionManager[] = [];

    /**
     * Textures to keep.
     */
    public textures: BaseTexture[] = [];

    /** @internal */
    protected _environmentTexture: Nullable<BaseTexture> = null;
    /**
     * Texture used in all pbr material as the reflection texture.
     * As in the majority of the scene they are the same (exception for multi room and so on),
     * this is easier to reference from here than from all the materials.
     */
    public get environmentTexture(): Nullable<BaseTexture> {
        return this._environmentTexture;
    }

    public set environmentTexture(value: Nullable<BaseTexture>) {
        this._environmentTexture = value;
    }

    /**
     * The list of postprocesses added to the scene
     */
    public postProcesses: PostProcess[] = [];

    /**
     * @returns all meshes, lights, cameras, transformNodes and bones
     */
    public getNodes(): Array<Node> {
        let nodes: Node[] = [];
        nodes = nodes.concat(this.meshes);
        nodes = nodes.concat(this.lights);
        nodes = nodes.concat(this.cameras);
        nodes = nodes.concat(this.transformNodes); // dummies
        this.skeletons.forEach((skeleton) => (nodes = nodes.concat(skeleton.bones)));
        return nodes;
    }
}

// Register Class Name
RegisterClass("BABYLON.AbstractScene", AbstractScene);
