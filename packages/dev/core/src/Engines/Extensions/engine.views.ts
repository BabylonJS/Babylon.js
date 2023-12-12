import { Engine } from "../engine";
import type { Camera } from "../../Cameras/camera";
import type { Nullable } from "../../types";
import type { Observable } from "../../Misc/observable";

import * as extension from "core/esm/Engines/WebGL/Extensions/views/views.webgl";
import { EngineExtensions, loadExtension } from "core/esm/Engines/Extensions/engine.extensions";
import type { EngineView } from "core/esm/Engines/Extensions/views/views.base";
import { _getExtensionState } from "core/esm/Engines/Extensions/views/views.base";

declare module "../../Engines/engine" {
    export interface Engine {
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
        unRegisterView(canvas: HTMLCanvasElement): Engine;

        /**
         * @internal
         */
        _renderViewStep(view: EngineView): boolean;
    }
}

Object.defineProperty(Engine.prototype, "onBeforeViewRenderObservable", {
    get: function (this: Engine) {
        const state = _getExtensionState(this._engineState);
        return state.onBeforeViewRenderObservable;
    },
});

Object.defineProperty(Engine.prototype, "onAfterViewRenderObservable", {
    get: function (this: Engine) {
        const state = _getExtensionState(this._engineState);
        return state.onAfterViewRenderObservable;
    },
});

Object.defineProperty(Engine.prototype, "inputElement", {
    get: function (this: Engine) {
        const state = _getExtensionState(this._engineState);
        return state.inputElement;
    },
    set: function (this: Engine, value: HTMLElement) {
        const state = _getExtensionState(this._engineState);
        state.inputElement = value;
    },
});

Engine.prototype.getInputElement = function (): Nullable<HTMLElement> {
    return extension.getInputElement(this._engineState);
};

Engine.prototype.registerView = function (canvas: HTMLCanvasElement, camera?: Camera | Camera[], clearBeforeCopy?: boolean): EngineView {
    return extension.registerView(this._engineState, canvas, camera, clearBeforeCopy);
};

Engine.prototype.unRegisterView = function (canvas: HTMLCanvasElement): Engine {
    extension.unRegisterView(this._engineState, canvas);
    return this;
};

Engine.prototype._renderViewStep = function (view: EngineView): boolean {
    return extension._renderViewStep(this._engineState, view);
};

Engine.prototype._renderViews = function () {
    return extension._renderViews(this._engineState);
};

loadExtension(EngineExtensions.VIEWS, extension);
