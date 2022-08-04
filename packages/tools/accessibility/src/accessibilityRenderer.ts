import type { Scene } from "core/scene";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { AccessibilityTreeComponent } from "./accessibilityTreeComponent";

export class HTMLTwinRenderer {
    public static RenderAccessibilityTree(scene: Scene) {
        const accessibilityHost = document.createElement("div");
        accessibilityHost.id = "accessibility-host";
        accessibilityHost.style.position = "absolute";
        accessibilityHost.style.left = "-999px";
        accessibilityHost.style.width = "900px";
        scene.getEngine().getRenderingCanvas()?.after(accessibilityHost);

        const accessibilityTree = React.createElement(AccessibilityTreeComponent, {
            scene: scene,
        });
        ReactDOM.render(accessibilityTree, accessibilityHost);
    }
}
