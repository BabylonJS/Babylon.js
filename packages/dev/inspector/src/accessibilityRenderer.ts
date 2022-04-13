import * as React from "react";
import * as ReactDOM from "react-dom";
import { Scene } from "babylonjs/scene";
import { AccessibilityTreeComponent } from "./components/sceneExplorer/accessibilityTreeComponent";

export class AccessibilityRenderer {
    public static RenderAccessibilityTree(scene: Scene) {
        const accessibilityHost = document.createElement("div");
        accessibilityHost.id = 'accessibility-host';
        accessibilityHost.style.position = "absolute";
        accessibilityHost.style.left = "-999px";
        scene.getEngine().getRenderingCanvas()?.before(accessibilityHost);

        const accessibilityTree = React.createElement(AccessibilityTreeComponent, {
            scene: scene
        });
        ReactDOM.render(accessibilityTree, accessibilityHost);
    }
}