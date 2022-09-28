import type { Scene } from "core/scene";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { HTMLTwinHostComponent } from "./htmlTwinHostComponent";

export class HTMLTwinRenderer {
    public static Render(scene: Scene) {
        const wrapper = document.createElement("div");
        wrapper.id = "accessibility-host-wrapper";
        wrapper.style.position = "absolute";
        wrapper.style.left = "-999px";
        wrapper.style.width = "900px";
        scene.getEngine().getRenderingCanvas()?.after(wrapper);
        scene.onDisposeObservable.add(() => {
            wrapper.remove();
        });

        const htmlTwinHost = React.createElement(HTMLTwinHostComponent, {
            scene,
        });
        ReactDOM.render(htmlTwinHost, wrapper);
    }
}
