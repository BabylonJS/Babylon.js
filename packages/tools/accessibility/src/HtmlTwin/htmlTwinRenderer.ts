import type { Scene } from "core/scene";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { HTMLTwinHostComponent } from "./htmlTwinHostComponent";

/**
 * Options for the HTMLTwinRenderer.
 */
export interface IHTMLTwinRendererOptions {
    /**
     * If this is true, all GUI controls will be added to the twin tree, regardless if they have
     * a defined accessibility tag or not. If it's false, only controls with an accessibility tag
     * will be added. True by default.
     */
    addAllControls: boolean;
}

/**
 * This class is the main entry point for the HTML twin renderer. To render a twin for a scene,
 * simply call HTMLTwinRenderer.Render(scene).
 */
export class HTMLTwinRenderer {
    /**
     * Render the HTML twin for the given scene.
     * @param scene the scene to render the twin for
     * @param options options for the renderer
     */
    public static Render(scene: Scene, options?: IHTMLTwinRendererOptions) {
        const htmlTwinHost = React.createElement(HTMLTwinHostComponent, {
            scene,
            options,
        });
        ReactDOM.render(htmlTwinHost, scene.getEngine().getRenderingCanvas());
    }
}
