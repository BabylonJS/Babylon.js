module BABYLON {
    /**
     * Groups all the scene component constants in one place to ease maintenance.
     * @hidden
     */
    export class SceneComponentConstants {
        public static readonly NAME_EFFECTLAYER = "EffectLayer";
        public static readonly NAME_LAYER = "Layer";
        public static readonly NAME_LENSFLARESYSTEM = "LensFlareSystem";

        public static readonly STEP_ISREADYFORMESH_EFFECTLAYER = 0;

        public static readonly STEP_CAMERADRAWRENDERTARGET_EFFECTLAYER = 1;
        
        public static readonly STEP_BEFORECAMERADRAW_EFFECTLAYER = 0;
        public static readonly STEP_BEFORECAMERADRAW_LAYER = 1;

        public static readonly STEP_AFTERCAMERADRAW_EFFECTLAYER = 0;
        public static readonly STEP_AFTERCAMERADRAW_LENSFLARESYSTEM = 1;
        public static readonly STEP_AFTERCAMERADRAW_EFFECTLAYER_DRAW = 2;
        public static readonly STEP_AFTERCAMERADRAW_LAYER = 3;

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
         * Adds all the element from the container to the scene
         * @param container the container holding the elements
         */
        addFromContainer(container: AbstractScene): void;

        /**
         * Removes all the elements in the container from the scene
         * @param container contains the elements to remove 
         */
        removeFromContainer(container: AbstractScene): void;

        /**
         * Rebuilds the elements related to this component in case of
         * context lost for instance.
         */
        rebuild(): void;

        /**
         * Serializes the component data to the specified json object
         * @param serializationObject The object to serialize to
         */
        serialize(serializationObject: any): void;

        /**
         * Disposes the component and the associated ressources.
         */
        dispose(): void;
    }

    /** 
     * Strong typing of a Mesh related stage step action 
     */
    export type MeshStageAction = (mesh: AbstractMesh, hardwareInstancedRendering: boolean) => boolean;

    /** 
     * Strong typing of a Camera related stage step action 
     */
    export type CameraStageAction = (camera: Camera) => void;

    /** 
     * Strong typing of a simple stage step action 
     */
    export type SimpleStageAction = () => void;

    /** 
     * Repressentation of a stage in the scene (Basically a list of ordered steps) 
     * @hidden
     */
    export class Stage<T extends Function> extends Array<{ index: number, component: ISceneComponent, action: T }> {
        /**
         * Hide ctor from the rest of the world.
         * @param items The items to add.
         */
        private constructor(items?: { index: number, component: ISceneComponent, action: T }[]) {
            super(...<any>items)
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
            for (; i < this.length && i < maxIndex; i++) {
                let step = this[i];
                maxIndex = step.index;
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
}
