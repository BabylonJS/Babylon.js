import { isClickable, getAccessibleTexture, getDescriptionFromNode, hasAccessibleElement, hasChildren, isVisible, getDirectChildrenOf } from "./htmlTwinItem";
import type { AccessibilityEntity } from "./htmlTwinItem";
import { HTMLTwinAccessibilityNode } from "./htmlTwinAccessibilityNode";
import { HTMLTwinAccessibilityLeaf } from "./htmlTwinAccessibilityLeaf";
import { useContext, useEffect, useState } from "react";
import { SceneContext } from "./htmlTwinSceneContext";
import { HTMLTwinAccessibilityItem } from "./htmlTwinAccessibilityItem";

export function HTMLTwinAccessibilityAdaptor(props: { node: AccessibilityEntity }) {
    const [isVisibleState, setIsVisibleState] = useState(isVisible(props.node));
    const [description, setDescription] = useState(getDescriptionFromNode(props.node));
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
    useEffect(() => {
        const observable = props.node.onAccessibilityTagChangedObservable;
        const observer = observable.add(() => {
            setDescription(getDescriptionFromNode(props.node));
        });
        return () => {
            observable.remove(observer);
        };
    }, [])
    // console.log("node", props.node.name, "has update scene", sceneContext.updateScene);
    const childrenOf = getDirectChildrenOf(props.node);
    console.log('childrenof', childrenOf);
    if (isVisibleState) {
        const accessibleTexture = getAccessibleTexture(props.node);
        if (accessibleTexture) {
            return <HTMLTwinAccessibilityAdaptor node={accessibleTexture.rootContainer} />;
        } else {
            return <HTMLTwinAccessibilityItem 
                        description={description} 
                        isClickable={isClickable(props.node)}>
                            {childrenOf.map((child: AccessibilityEntity) => (
                                <HTMLTwinAccessibilityAdaptor node={child} />
                            ))}
                    </HTMLTwinAccessibilityItem>;
        }
    } else {
        return null;
    }
}
