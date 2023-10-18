import { getAccessibleTexture, isVisible, getDirectChildrenOf } from "./htmlTwinItem";
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
import type { IHTMLTwinRendererOptions } from "./htmlTwinRenderer";

function getTwinItemFromNode(node: AccessibilityEntity, scene: Scene) {
    if (node instanceof Node) {
        return new HTMLTwinNodeItem(node, scene);
    } else {
        return new HTMLTwinGUIItem(node, scene);
    }
}

export function HTMLTwinItemAdapter(props: { node: AccessibilityEntity; scene: Scene; options: IHTMLTwinRendererOptions }) {
    const { node, scene, options } = props;
    if (!node) {
        return null;
    }
    const [twinItem, setTwinItem] = useState<HTMLTwinItem>(getTwinItemFromNode(node, scene));
    useEffect(() => {
        setTwinItem(getTwinItemFromNode(node, scene));
    }, [node]);

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

    const [description, setDescription] = useState(twinItem?.getDescription(options));
    useEffect(() => {
        const observable = node.onAccessibilityTagChangedObservable;
        const observer = observable.add(() => {
            setDescription(twinItem?.getDescription(options));
        });
        return () => {
            observable.remove(observer);
        };
    }, [node]);

    useEffect(() => {
        setDescription(twinItem?.getDescription(options));
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
            return <HTMLTwinItemAdapter node={accessibleTexture.rootContainer} scene={scene} options={options} />;
        } else {
            return (
                <HTMLTwinAccessibilityItem description={description} a11yItem={twinItem}>
                    {children.map((child: AccessibilityEntity) => (
                        <HTMLTwinItemAdapter node={child} key={child.uniqueId} scene={scene} options={options} />
                    ))}
                </HTMLTwinAccessibilityItem>
            );
        }
    } else {
        return null;
    }
}
