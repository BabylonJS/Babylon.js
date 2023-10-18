import { isClickable, getAccessibleTexture, isVisible, getDirectChildrenOf } from "./htmlTwinItem";
import type { AccessibilityEntity, HTMLTwinItem } from "./htmlTwinItem";
import { useContext, useEffect, useState } from "react";
import { SceneContext } from "./htmlTwinSceneContext";
import { HTMLTwinAccessibilityItem } from "./htmlTwinAccessibilityItem";
import { Container } from "gui/2D/controls/container";
import { Control } from "gui/2D/controls/control";
import { Node } from "core/node";
import { HTMLTwinNodeItem } from "./htmlTwinNodeItem";
import type { Scene } from "core/scene";
import { HTMLTwinGUIItem } from "./htmlTwinGUIItem";

function getTwinItemFromNode(node: AccessibilityEntity, scene: Scene) {
    if (node instanceof Node) {
        return new HTMLTwinNodeItem(node, scene);
    } else {
        return new HTMLTwinGUIItem(node, scene);
    }
}

export function HTMLTwinItemAdapter(props: { node: AccessibilityEntity; scene: Scene }) {
    const { node, scene } = props;

    const [twinItem, setTwinItem] = useState<HTMLTwinItem>(getTwinItemFromNode(node, scene));
    useEffect(() => {
        setTwinItem(getTwinItemFromNode(node, scene));
    }, [node]);
    // console.log("twin item", twinItem);

    const [isVisibleState, setIsVisibleState] = useState(isVisible(props.node));
    useEffect(() => {
        const observable = (node as any).onEnabledStateChangedObservable;
        const observer = observable.add((value: boolean) => {
            setIsVisibleState(value);
        });
        return () => {
            observable.remove(observer);
        };
    }, [node]);

    const sceneContext = useContext(SceneContext);
    useEffect(() => {
        const observable = (node as any).onDisposeObservable;
        const observer = observable.add(() => {
            sceneContext.updateScene();
        });
        return () => {
            observable.remove(observer);
        };
    }, [node]);

    const [description, setDescription] = useState(twinItem?.description);
    useEffect(() => {
        const observable = node.onAccessibilityTagChangedObservable;
        const observer = observable.add(() => {
            setDescription(twinItem?.description);
        });
        return () => {
            observable.remove(observer);
        };
    }, [node]);

    useEffect(() => {
        setDescription(twinItem?.description);
    }, [twinItem]);

    const [children, setChildren] = useState(getDirectChildrenOf(props.node));
    if (node instanceof Container) {
        useEffect(() => {
            const observable = node.onControlAddedObservable;
            const observer = observable.add(() => {
                setChildren([...getDirectChildrenOf(props.node)]);
            });
            return () => {
                observable.remove(observer);
            };
        }, [node]);
        useEffect(() => {
            const observable = node.onControlRemovedObservable;
            const observer = observable.add(() => {
                setChildren([...getDirectChildrenOf(props.node)]);
            });
            return () => {
                observable.remove(observer);
            };
        }, [node]);
    }
    if (node instanceof Control) {
        useEffect(() => {
            const observable = node.onIsVisibleChangedObservable;
            const observer = observable.add(() => {
                setIsVisibleState(isVisible(props.node));
            });
            return () => {
                observable.remove(observer);
            };
        }, [node]);
    }

    if (isVisibleState) {
        const accessibleTexture = getAccessibleTexture(props.node);
        if (accessibleTexture) {
            return <HTMLTwinItemAdapter node={accessibleTexture.rootContainer} scene={scene} />;
        } else {
            return (
                <HTMLTwinAccessibilityItem description={description} a11yItem={twinItem}>
                    {children.map((child: AccessibilityEntity) => (
                        <HTMLTwinItemAdapter node={child} key={child.uniqueId} scene={scene} />
                    ))}
                </HTMLTwinAccessibilityItem>
            );
        }
    } else {
        return null;
    }
}
