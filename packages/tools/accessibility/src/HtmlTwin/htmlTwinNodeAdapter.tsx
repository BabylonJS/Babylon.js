import { getAccessibleTexture, hasAccessibleElement, isVisible } from "./htmlTwinItem";
import type { AccessibilityEntity } from "./htmlTwinItem";
import { HTMLTwinAccessibilityNode } from "./htmlTwinAccessibilityNode";
import { HTMLTwinAccessibilityLeaf } from "./htmlTwinAccessibilityLeaf";
import { useEffect, useState } from "react";

export function HTMLTwinAccessibilityAdaptor(props: { node: AccessibilityEntity }) {
    const [isVisibleState, setIsVisibleState] = useState(isVisible(props.node));
    // console.log("run adapter for node", props.node.name, "is visible", isVisibleState);
    useEffect(() => {
        const observable = (props.node as any).onEnabledStateChangedObservable;
        // console.log("observer", props.node.name, (props.node as any).onEnabledStateChangedObservable);
        const observer = observable.add((value: boolean) => {
            // console.log("node", props.node.name, "is visible", value);
            setIsVisibleState(value);
        });
        return () => {
            observable.remove(observer);
        };
    }, []);
    if (isVisibleState) {
        const accessibleTexture = getAccessibleTexture(props.node);
        if (accessibleTexture) {
            return <HTMLTwinAccessibilityAdaptor node={accessibleTexture.rootContainer} />;
        } else if (hasAccessibleElement(props.node)) {
            return <HTMLTwinAccessibilityNode {...props} />;
        } else {
            return <HTMLTwinAccessibilityLeaf {...props} />;
        }
    } else {
        return null;
    }
}
