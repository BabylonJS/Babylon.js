import type { Scene } from "core/scene";
import { HTMLTwinAccessibilityAdaptor } from "./htmlTwinNodeAdapter";
import { useContext, useEffect, useRef, useState } from "react";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { SceneContext } from "./htmlTwinSceneContext";

function getSceneIds(scene: Scene) {
    const newSet = new Set<number>();
    scene.rootNodes.forEach((node) => newSet.add(node.uniqueId));
    return newSet;
}

export function HTMLTwinSceneTree(props: { scene: Scene }) {
    // const [count, setCount] = useState(0);
    const [ids, setIds] = useState(new Set<number>());
    const nextFrameObserver = useRef<Nullable<Observer<Scene>>>(null);
    const sceneContext = useContext(SceneContext);

    useEffect(() => {
        const observer = props.scene.onNewMeshAddedObservable.add((mesh) => {
            // console.log("mesh", mesh.name, "added");
            if (!nextFrameObserver.current) {
                nextFrameObserver.current = props.scene.onBeforeRenderObservable.addOnce(() => {
                    nextFrameObserver.current = null;
                    setIds(getSceneIds(props.scene));
                });
            }
        });
        return () => {
            props.scene.onNewMeshAddedObservable.remove(observer);
        };
    }, [props.scene]);

    useEffect(() => {
        if (sceneContext) {
            sceneContext.updateScene = () => {
                setIds(getSceneIds(props.scene));
            };
        }
    }, [sceneContext]);

    // console.log("ids", ids, "scene rootnodes", props.scene.rootNodes.map((n: any) => n.name).join(","));
    return (
        <>
            {props.scene.rootNodes.map((node) => (
                <HTMLTwinAccessibilityAdaptor key={node.uniqueId} node={node} />
            ))}
        </>
    );
}
