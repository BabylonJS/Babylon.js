import { type Camera } from "../../Cameras/camera";
import { type Nullable } from "../../types";
import { type Observable } from "../../Misc/observable";
import { type EngineView } from "./abstractEngine.views.pure";
declare module "../../Engines/abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /** @internal */
        _inputElement: Nullable<HTMLElement>;

        /**
         * Gets or sets the  HTML element to use for attaching events
         */
        inputElement: Nullable<HTMLElement>;

        /**
         * Observable to handle when a change to inputElement occurs
         * @internal
         */
        _onEngineViewChanged?: () => void;

        /**
         * Will be triggered before the view renders
         */
        readonly onBeforeViewRenderObservable: Observable<EngineView>;
        /**
         * Will be triggered after the view rendered
         */
        readonly onAfterViewRenderObservable: Observable<EngineView>;

        /**
         * Gets the current engine view
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/multiCanvas
         */
        activeView: Nullable<EngineView>;

        /** Gets or sets the list of views */
        views: EngineView[];

        /**
         * Register a new child canvas
         * @param canvas defines the canvas to register
         * @param camera defines an optional camera or array of cameras to use with this canvas (it will overwrite the scene.activeCamera / scene.activeCameras for this view). Support for array of cameras @since
         * @param clearBeforeCopy Indicates if the destination view canvas should be cleared before copying the parent canvas. Can help if the scene clear color has alpha \< 1
         * @returns the associated view
         */
        registerView(canvas: HTMLCanvasElement, camera?: Camera | Camera[], clearBeforeCopy?: boolean): EngineView;

        /**
         * Remove a registered child canvas
         * @param canvas defines the canvas to remove
         * @returns the current engine
         */
        unRegisterView(canvas: HTMLCanvasElement): AbstractEngine;

        /**
         * @internal
         */
        _renderViewStep(view: EngineView): boolean;
    }
}
