import { getAccessibleTexture, hasAccessibleElement, hasChildren, isVisible } from "./htmlTwinItem";
import type { AccessibilityEntity } from "./htmlTwinItem";
import { HTMLTwinAccessibilityNode } from "./htmlTwinAccessibilityNode";
import { HTMLTwinAccessibilityLeaf } from "./htmlTwinAccessibilityLeaf";
import { useContext, useEffect, useState } from "react";
import { SceneContext } from "./htmlTwinSceneContext";

export function HTMLTwinAccessibilityAdaptor(props: { node: AccessibilityEntity }) {
    const [isVisibleState, setIsVisibleState] = useState(isVisible(props.node));
    const sceneContext = useContext(SceneContext);
    useEffect(() => {
        const observable = (props.node as any).onEnabledStateChangedObservable;
        const observer = observable.add((value: boolean) => {
            setIsVisibleState(value);
        });
        return () => {
            observable.remove(observer);
        };
    }, []);
    useEffect(() => {
        const observable = (props.node as any).onDisposeObservable;
        const observer = observable.add(() => {
            sceneContext.updateScene();
        });
        return () => {
            observable.remove(observer);
        };
    }, []);
    // console.log("node", props.node.name, "has update scene", sceneContext.updateScene);
    if (isVisibleState) {
        const accessibleTexture = getAccessibleTexture(props.node);
        if (accessibleTexture) {
            return <HTMLTwinAccessibilityNode node={accessibleTexture.rootContainer} />;
            // } else if (hasAccessibleElement(props.node)) {
        } else if (hasChildren(props.node)) {
            return <HTMLTwinAccessibilityNode {...props} />;
        } else {
            return <HTMLTwinAccessibilityLeaf {...props} />;
        }
    } else {
        return null;
    }
}
