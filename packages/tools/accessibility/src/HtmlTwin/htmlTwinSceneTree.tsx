import type { Scene } from "core/scene";
import { HTMLTwinAccessibilityAdaptor } from "./htmlTwinNodeAdapter";
import { useEffect, useState } from "react";
export function HTMLTwinSceneTree(props: { scene: Scene }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const observer = props.scene.onNewMeshAddedObservable.add(() => {
            // Increase count on next frame to force a rerender.
            props.scene.onBeforeRenderObservable.addOnce(() => {
                setCount(count + 1);
            });
        });
        return () => {
            props.scene.onNewMeshAddedObservable.remove(observer);
        };
    }, [props.scene]);
    return (
        <>
            {props.scene.rootNodes.map((node) => (
                <HTMLTwinAccessibilityAdaptor key={node.name} node={node} />
            ))}
        </>
    );
}
