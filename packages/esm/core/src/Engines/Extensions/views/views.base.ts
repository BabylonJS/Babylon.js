import type { Camera } from "@babylonjs/core/Cameras/camera.js";
import type { IBaseEnginePublic } from "../../engine.base.js";
import { Observable } from "@babylonjs/core/Misc/observable.js";
import type { Nullable } from "@babylonjs/core/types.js";

/**
 * Class used to define an additional view for the engine
 * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/multiCanvas
 */
export interface EngineView {
    /**
     * A randomly generated unique id
     */
    readonly id: string;
    /** Defines the canvas where to render the view */
    target: HTMLCanvasElement;
    /** Defines an optional camera used to render the view (will use active camera else) */
    camera?: Camera;
    /** Indicates if the destination view canvas should be cleared before copying the parent canvas. Can help if the scene clear color has alpha < 1 */
    clearBeforeCopy?: boolean;
    /** Indicates if the view is enabled (true by default) */
    enabled: boolean;
    /** Defines a custom function to handle canvas size changes. (the canvas to render into is provided to the callback) */
    customResize?: (canvas: HTMLCanvasElement) => void;
}

export interface IViewsExtensionState<T extends IBaseEnginePublic = IBaseEnginePublic> {
    /** @internal */
    _inputElement: Nullable<HTMLElement>;

    /**
     * Gets or sets the  HTML element to use for attaching events
     */
    inputElement: Nullable<HTMLElement>;
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
     * Observable to handle when a change to inputElement occurs
     * @internal
     */
    _onEngineViewChanged?: (engineState: T) => void;
}

export interface IViewsEngineExtension<T extends IBaseEnginePublic = IBaseEnginePublic> {
    /**
     * Register a new child canvas
     * @param canvas defines the canvas to register
     * @param camera defines an optional camera to use with this canvas (it will overwrite the scene.camera for this view)
     * @param clearBeforeCopy Indicates if the destination view canvas should be cleared before copying the parent canvas. Can help if the scene clear color has alpha < 1
     * @returns the associated view
     */
    registerView(engineState: IBaseEnginePublic, canvas: HTMLCanvasElement, camera?: Camera, clearBeforeCopy?: boolean): EngineView;

    /**
     * Remove a registered child canvas
     * @param canvas defines the canvas to remove
     * @returns the current engine
     */
    unRegisterView(engineState: IBaseEnginePublic, canvas: HTMLCanvasElement): T;

    /**
     * @internal
     */
    _renderViewStep(engineState: IBaseEnginePublic, view: EngineView): boolean;

    /**
     * @internal
     */
    _setOnEngineViewChanged(engineState: IBaseEnginePublic, callback: (engineState: T) => void): void;

    /**
     * @internal
     */
    _renderViews(engineState: IBaseEnginePublic): boolean;
}

const stateObjects: IViewsExtensionState[] = [];

/** @internal */
export function _getExtensionState<T extends IBaseEnginePublic = IBaseEnginePublic>(engineState: T): IViewsExtensionState<T> {
    if (!stateObjects[engineState.uniqueId]) {
        stateObjects[engineState.uniqueId] = {
            _inputElement: null,
            get inputElement() {
                return stateObjects[engineState.uniqueId]._inputElement;
            },
            set inputElement(value) {
                if (stateObjects[engineState.uniqueId]._inputElement !== value) {
                    stateObjects[engineState.uniqueId]._inputElement = value;
                    stateObjects[engineState.uniqueId]._onEngineViewChanged?.(engineState);
                    return;
                }
            },
            onBeforeViewRenderObservable: new Observable<EngineView>(),
            onAfterViewRenderObservable: new Observable<EngineView>(),
            activeView: null,
            views: [],
        };
    }
    return stateObjects[engineState.uniqueId];
};
