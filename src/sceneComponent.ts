import { Scene } from "./scene";
import { SmartArrayNoDuplicate } from "./Misc/smartArray";
import { Nullable } from "./types";
import { PickingInfo } from "./Collisions/pickingInfo";
import { AbstractScene } from "./abstractScene";
import { IPointerEvent } from "./Events/deviceInputEvents";

declare type Mesh = import("./Meshes/mesh").Mesh;
declare type Effect = import("./Materials/effect").Effect;
declare type Camera = import("./Cameras/camera").Camera;
declare type AbstractMesh = import("./Meshes/abstractMesh").AbstractMesh;
declare type SubMesh = import("./Meshes/subMesh").SubMesh;
declare type RenderTargetTexture = import("./Materials/Textures/renderTargetTexture").RenderTargetTexture;

/**
 * Groups all the scene component constants in one place to ease maintenance.
 * @hidden
 */
export class SceneComponentConstants {
    public static readonly NAME_EFFECTLAYER = "EffectLayer";
    public static readonly NAME_LAYER = "Layer";
    public static readonly NAME_LENSFLARESYSTEM = "LensFlareSystem";
    public static readonly NAME_BOUNDINGBOXRENDERER = "BoundingBoxRenderer";
    public static readonly NAME_PARTICLESYSTEM = "ParticleSystem";
    public static readonly NAME_GAMEPAD = "Gamepad";
    public static readonly NAME_SIMPLIFICATIONQUEUE = "SimplificationQueue";
    public static readonly NAME_GEOMETRYBUFFERRENDERER = "GeometryBufferRenderer";
    public static readonly NAME_PREPASSRENDERER = "PrePassRenderer";
    public static readonly NAME_DEPTHRENDERER = "DepthRenderer";
    public static readonly NAME_POSTPROCESSRENDERPIPELINEMANAGER = "PostProcessRenderPipelineManager";
    public static readonly NAME_SPRITE = "Sprite";
    public static readonly NAME_SUBSURFACE = "SubSurface";
    public static readonly NAME_OUTLINERENDERER = "Outline";
    public static readonly NAME_PROCEDURALTEXTURE = "ProceduralTexture";
    public static readonly NAME_SHADOWGENERATOR = "ShadowGenerator";
    public static readonly NAME_OCTREE = "Octree";
    public static readonly NAME_PHYSICSENGINE = "PhysicsEngine";
    public static readonly NAME_AUDIO = "Audio";

    public static readonly STEP_ISREADYFORMESH_EFFECTLAYER = 0;

    public static readonly STEP_BEFOREEVALUATEACTIVEMESH_BOUNDINGBOXRENDERER = 0;

    public static readonly STEP_EVALUATESUBMESH_BOUNDINGBOXRENDERER = 0;

    public static readonly STEP_PREACTIVEMESH_BOUNDINGBOXRENDERER = 0;

    public static readonly STEP_CAMERADRAWRENDERTARGET_EFFECTLAYER = 1;

    public static readonly STEP_BEFORECAMERADRAW_PREPASS = 0;
    public static readonly STEP_BEFORECAMERADRAW_EFFECTLAYER = 1;
    public static readonly STEP_BEFORECAMERADRAW_LAYER = 2;

    public static readonly STEP_BEFORERENDERTARGETDRAW_PREPASS = 0;
    public static readonly STEP_BEFORERENDERTARGETDRAW_LAYER = 1;

    public static readonly STEP_BEFORERENDERINGMESH_PREPASS = 0;
    public static readonly STEP_BEFORERENDERINGMESH_OUTLINE = 1;

    public static readonly STEP_AFTERRENDERINGMESH_PREPASS = 0;
    public static readonly STEP_AFTERRENDERINGMESH_OUTLINE = 1;

    public static readonly STEP_AFTERRENDERINGGROUPDRAW_EFFECTLAYER_DRAW = 0;
    public static readonly STEP_AFTERRENDERINGGROUPDRAW_BOUNDINGBOXRENDERER = 1;

    public static readonly STEP_BEFORECAMERAUPDATE_SIMPLIFICATIONQUEUE = 0;
    public static readonly STEP_BEFORECAMERAUPDATE_GAMEPAD = 1;

    public static readonly STEP_BEFORECLEAR_PROCEDURALTEXTURE = 0;

    public static readonly STEP_AFTERRENDERTARGETDRAW_PREPASS = 0;
    public static readonly STEP_AFTERRENDERTARGETDRAW_LAYER = 1;

    public static readonly STEP_AFTERCAMERADRAW_PREPASS = 0;
    public static readonly STEP_AFTERCAMERADRAW_EFFECTLAYER = 1;
    public static readonly STEP_AFTERCAMERADRAW_LENSFLARESYSTEM = 2;
    public static readonly STEP_AFTERCAMERADRAW_EFFECTLAYER_DRAW = 3;
    public static readonly STEP_AFTERCAMERADRAW_LAYER = 4;

    public static readonly STEP_AFTERRENDER_AUDIO = 0;

    public static readonly STEP_GATHERRENDERTARGETS_DEPTHRENDERER = 0;
    public static readonly STEP_GATHERRENDERTARGETS_GEOMETRYBUFFERRENDERER = 1;
    public static readonly STEP_GATHERRENDERTARGETS_SHADOWGENERATOR = 2;
    public static readonly STEP_GATHERRENDERTARGETS_POSTPROCESSRENDERPIPELINEMANAGER = 3;

    public static readonly STEP_GATHERACTIVECAMERARENDERTARGETS_DEPTHRENDERER = 0;

    public static readonly STEP_BEFORECLEARSTAGE_PREPASS = 0;
    public static readonly STEP_BEFORERENDERTARGETCLEARSTAGE_PREPASS = 0;

    public static readonly STEP_POINTERMOVE_SPRITE = 0;
    public static readonly STEP_POINTERDOWN_SPRITE = 0;
    public static readonly STEP_POINTERUP_SPRITE = 0;
}

/**
 * This represents a scene component.
 *
 * This is used to decouple the dependency the scene is having on the different workloads like
 * layers, post processes...
 */
export interface ISceneComponent {
    /**
     * The name of the component. Each component must have a unique name.
     */
    name: string;

    /**
     * The scene the component belongs to.
     */
    scene: Scene;

    /**
     * Register the component to one instance of a scene.
     */
    register(): void;

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    rebuild(): void;

    /**
     * Disposes the component and the associated ressources.
     */
    dispose(): void;
}

/**
 * This represents a SERIALIZABLE scene component.
 *
 * This extends Scene Component to add Serialization methods on top.
 */
export interface ISceneSerializableComponent extends ISceneComponent {
    /**
     * Adds all the elements from the container to the scene
     * @param container the container holding the elements
     */
    addFromContainer(container: AbstractScene): void;

    /**
     * Removes all the elements in the container from the scene
     * @param container contains the elements to remove
     * @param dispose if the removed element should be disposed (default: false)
     */
    removeFromContainer(container: AbstractScene, dispose?: boolean): void;

    /**
     * Serializes the component data to the specified json object
     * @param serializationObject The object to serialize to
     */
    serialize(serializationObject: any): void;
}

/**
 * Strong typing of a Mesh related stage step action
 */
export type MeshStageAction = (mesh: AbstractMesh, hardwareInstancedRendering: boolean) => boolean;

/**
 * Strong typing of a Evaluate Sub Mesh related stage step action
 */
export type EvaluateSubMeshStageAction = (mesh: AbstractMesh, subMesh: SubMesh) => void;

/**
 * Strong typing of a pre active Mesh related stage step action
 */
export type PreActiveMeshStageAction = (mesh: AbstractMesh) => void;

/**
 * Strong typing of a Camera related stage step action
 */
export type CameraStageAction = (camera: Camera) => void;

/**
 * Strong typing of a Camera Frame buffer related stage step action
 */
export type CameraStageFrameBufferAction = (camera: Camera) => boolean;

/**
 * Strong typing of a Render Target related stage step action
 */
export type RenderTargetStageAction = (renderTarget: RenderTargetTexture, faceIndex?: number, layer?: number) => void;

/**
 * Strong typing of a RenderingGroup related stage step action
 */
export type RenderingGroupStageAction = (renderingGroupId: number) => void;

/**
 * Strong typing of a Mesh Render related stage step action
 */
export type RenderingMeshStageAction = (mesh: Mesh, subMesh: SubMesh, batch: any, effect: Nullable<Effect>) => void;

/**
 * Strong typing of a simple stage step action
 */
export type SimpleStageAction = () => void;

/**
 * Strong typing of a render target action.
 */
export type RenderTargetsStageAction = (renderTargets: SmartArrayNoDuplicate<RenderTargetTexture>) => void;

/**
 * Strong typing of a pointer move action.
 */
export type PointerMoveStageAction = (unTranslatedPointerX: number, unTranslatedPointerY: number, pickResult: Nullable<PickingInfo>, isMeshPicked: boolean, element: Nullable<HTMLElement>) => Nullable<PickingInfo>;

/**
 * Strong typing of a pointer up/down action.
 */
export type PointerUpDownStageAction = (unTranslatedPointerX: number, unTranslatedPointerY: number, pickResult: Nullable<PickingInfo>, evt: IPointerEvent) => Nullable<PickingInfo>;

/**
 * Representation of a stage in the scene (Basically a list of ordered steps)
 * @hidden
 */
export class Stage<T extends Function> extends Array<{ index: number, component: ISceneComponent, action: T }> {
    /**
     * Hide ctor from the rest of the world.
     * @param items The items to add.
     */
    private constructor(items?: { index: number, component: ISceneComponent, action: T }[]) {
        super(...<any>items);
    }

    /**
     * Creates a new Stage.
     * @returns A new instance of a Stage
     */
    static Create<T extends Function>(): Stage<T> {
        return Object.create(Stage.prototype);
    }

    /**
     * Registers a step in an ordered way in the targeted stage.
     * @param index Defines the position to register the step in
     * @param component Defines the component attached to the step
     * @param action Defines the action to launch during the step
     */
    public registerStep(index: number, component: ISceneComponent, action: T): void {
        let i = 0;
        let maxIndex = Number.MAX_VALUE;
        for (; i < this.length; i++) {
            let step = this[i];
            maxIndex = step.index;
            if (index < maxIndex) {
                break;
            }
        }
        this.splice(i, 0, { index, component, action: action.bind(component) });
    }

    /**
     * Clears all the steps from the stage.
     */
    public clear(): void {
        this.length = 0;
    }
}
