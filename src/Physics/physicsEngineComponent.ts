import { Observable /*, Observer*/ } from "../Misc/observable";
import { ISceneComponent, SceneComponentConstants } from "../sceneComponent";
import { Scene } from "../scene";

/**
 * Defines the physics engine scene component responsible to manage a physics engine
 */
export class PhysicsEngineSceneComponent implements ISceneComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_PHYSICSENGINE;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene: Scene) {
        this.scene = scene;
        this.scene.onBeforePhysicsObservable = new Observable<Scene>();
        this.scene.onAfterPhysicsObservable = new Observable<Scene>();

        // Replace the function used to get the deterministic frame time
        this.scene.getDeterministicFrameTime = () => {
            if (this.scene._physicsEngine) {
                return this.scene._physicsEngine.getTimeStep() * 1000;
            }

            return 1000.0 / 60.0;
        };
    }

    /**
     * Registers the component in a given scene
     */
    public register(): void {
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        // Nothing to do for this component
    }

    /**
     * Disposes the component and the associated ressources
     */
    public dispose(): void {
        this.scene.onBeforePhysicsObservable.clear();
        this.scene.onAfterPhysicsObservable.clear();

        if (this.scene._physicsEngine) {
            this.scene.disablePhysicsEngine();
        }
    }
}
