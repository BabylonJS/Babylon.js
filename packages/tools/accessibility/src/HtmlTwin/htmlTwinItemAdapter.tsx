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
import type { Observable, Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";

function getTwinItemFromNode(node: AccessibilityEntity, scene: Scene) {
    if (node instanceof Node) {
        return new HTMLTwinNodeItem(node, scene);
    } else {
        return new HTMLTwinGUIItem(node, scene);
    }
}

/**
 * An adapter that transforms a Accessible entity in a React element. Contains observables for the events that can
 * change the state of the entity or the accesible tree.
 * @param props the props of the adapter
 * @returns
 */
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
    const sceneContext = useContext(SceneContext);
    const [description, setDescription] = useState(twinItem?.getDescription(options));
    const [children, setChildren] = useState(getDirectChildrenOf(props.node));

    useEffect(() => {
        setDescription(twinItem?.getDescription(options));
    }, [twinItem]);

    useEffect(() => {
        // General observers for all the entities
        const enabledObservable = node.onEnabledStateChangedObservable;
        const enabledObserver = enabledObservable.add((value: boolean) => {
            setIsVisibleState(value);
        });

        const disposeObservable = (node as any).onDisposeObservable;
        const disposeObserver = disposeObservable.add(() => {
            sceneContext.updateScene();
        });

        const accessibilityTagObservable = node.onAccessibilityTagChangedObservable;
        const accessibilityTagObserver = accessibilityTagObservable.add(() => {
            setDescription(twinItem?.getDescription(options));
        });

        // Specific observer for control only
        let isVisibleChangedObservable: Observable<boolean>;
        let isVisibleChangedObserver: Nullable<Observer<boolean>>;
        if (node instanceof Control) {
            isVisibleChangedObservable = node.onIsVisibleChangedObservable;
            isVisibleChangedObserver = isVisibleChangedObservable.add(() => {
                setIsVisibleState(isVisible(props.node));
            });
        }

        // specific observers for container only
        let controlAddedObservable: Observable<Nullable<Control>>;
        let controlAddedObserver: Nullable<Observer<Nullable<Control>>>;
        let controlRemovedObservable: Observable<Nullable<Control>>;
        let controlRemovedObserver: Nullable<Observer<Nullable<Control>>>;
        if (node instanceof Container) {
            controlAddedObservable = node.onControlAddedObservable;
            controlAddedObserver = controlAddedObservable.add(() => {
                setChildren(getDirectChildrenOf(props.node).slice(0));
            });

            controlRemovedObservable = node.onControlRemovedObservable;
            controlRemovedObserver = controlRemovedObservable.add(() => {
                setChildren(getDirectChildrenOf(props.node).slice(0));
            });
        }
        return () => {
            enabledObservable.remove(enabledObserver);
            disposeObservable.remove(disposeObserver);
            accessibilityTagObservable.remove(accessibilityTagObserver);
            if (node instanceof Control) {
                isVisibleChangedObservable.remove(isVisibleChangedObserver!);
            }
            if (node instanceof Container) {
                controlAddedObservable.remove(controlAddedObserver);
                controlRemovedObservable.remove(controlRemovedObserver);
            }
        };
    }, [node]);

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
