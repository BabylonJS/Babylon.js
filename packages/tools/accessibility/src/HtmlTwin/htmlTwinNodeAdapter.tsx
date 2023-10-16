import { isClickable, getAccessibleTexture, getDescriptionFromNode, hasAccessibleElement, hasChildren, isVisible, getDirectChildrenOf } from "./htmlTwinItem";
import type { AccessibilityEntity } from "./htmlTwinItem";
import { HTMLTwinAccessibilityNode } from "./htmlTwinAccessibilityNode";
import { HTMLTwinAccessibilityLeaf } from "./htmlTwinAccessibilityLeaf";
import { useContext, useEffect, useState } from "react";
import { SceneContext } from "./htmlTwinSceneContext";
import { HTMLTwinAccessibilityItem } from "./htmlTwinAccessibilityItem";
import { Container } from "gui/2D/controls/container";
import { Control } from "gui/2D/controls/control";

export function HTMLTwinAccessibilityAdaptor(props: { node: AccessibilityEntity }) {
    const [isVisibleState, setIsVisibleState] = useState(isVisible(props.node));
    const [description, setDescription] = useState(getDescriptionFromNode(props.node));
    const [children, setChildren] = useState(getDirectChildrenOf(props.node));
    const sceneContext = useContext(SceneContext);
    const {node} = props;
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
    }, []);
    if (node instanceof Container) {
        useEffect(() => {
            const observable = node.onControlAddedObservable;
            const observer = observable.add(() => {
                // console.log("control added to container", node.name);
                setChildren([...getDirectChildrenOf(props.node)]);
            });
            return () => {
                observable.remove(observer);
            };
        }, []);
        useEffect(() => {
            const observable = node.onControlRemovedObservable;
            const observer = observable.add(() => {
                // console.log("control removed from container", node.name);
                setChildren([...getDirectChildrenOf(props.node)]);
            });
            return () => {
                observable.remove(observer);
            };
        }, []);
    }
    if (node instanceof Control) {
        useEffect(() => {
            const observable = node.onIsVisibleChangedObservable;
            // console.log("adding visible observer for container", node.name);
            const observer = observable.add(() => {
                // console.log("visibility changed for container", node.name);
                setIsVisibleState(isVisible(props.node));
            });
            return () => {
                observable.remove(observer);
            };
        }, []);
    }
    // console.log('adaptor for node', node.name);
    // console.log("node", props.node.name, "has update scene", sceneContext.updateScene);
    // console.log('childrenof', children);
    if (isVisibleState) {
        const accessibleTexture = getAccessibleTexture(props.node);
        if (accessibleTexture) {
            return <HTMLTwinAccessibilityAdaptor node={accessibleTexture.rootContainer} />;
        } else {
            return <HTMLTwinAccessibilityItem 
                        description={description} 
                        isClickable={isClickable(props.node)}>
                            {children.map((child: AccessibilityEntity) => (
                                <HTMLTwinAccessibilityAdaptor node={child} key={child.uniqueId} />
                            ))}
                    </HTMLTwinAccessibilityItem>;
        }
    } else {
        return null;
    }
}
