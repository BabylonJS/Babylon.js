import type { Scene } from "core/scene";
import { HTMLTwinAccessibilityAdaptor } from "./htmlTwinNodeAdapter";
export function HTMLTwinSceneTree(props: { scene: Scene }) {
    return (
        <>
            {props.scene.rootNodes.map((node) => (
                <HTMLTwinAccessibilityAdaptor key={node.name} node={node} />
            ))}
        </>
    );
}
