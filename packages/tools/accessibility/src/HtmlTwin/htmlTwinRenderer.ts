import type { Scene } from "core/scene";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { HTMLTwinHostComponent } from "./htmlTwinHostComponent";

export class HTMLTwinRenderer {
    public static Render(scene: Scene) {
        const htmlTwinHost = React.createElement(HTMLTwinHostComponent, {
            scene,
        });
        ReactDOM.render(htmlTwinHost, scene.getEngine().getRenderingCanvas());
    }
}
