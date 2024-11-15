import type { Scene } from "core/scene";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { SceneContext } from "./htmlTwinSceneContext";
import { HTMLTwinItemAdapter } from "./htmlTwinItemAdapter";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";
import type { IHTMLTwinRendererOptions } from "./htmlTwinRenderer";

function getSceneIds(scene: Scene) {
    const newSet = new Set<number>();
    scene.rootNodes.forEach((node) => newSet.add(node.uniqueId));
    return newSet;
}

function getFullscreenGuiTextures(scene: Scene) {
    const textures = [];
    for (const texture of scene.textures) {
        if (texture instanceof AdvancedDynamicTexture && texture._isFullscreen) {
            textures.push(texture);
        }
    }
    return textures;
}

/**
 * The scene tree of the HTML twin. It contain all the top level nodes
 * @param props
 * @returns
 */
export function HTMLTwinSceneTree(props: { scene: Scene; options: IHTMLTwinRendererOptions }): JSX.Element {
    const { scene, options } = props;

    const [, setMeshIds] = useState(new Set<number>());
    const [sceneGuiTextures, setSceneGuiTextures] = useState<AdvancedDynamicTexture[]>(getFullscreenGuiTextures(scene));
    const nextFrameObserver = useRef<Nullable<Observer<Scene>>>(null);
    const sceneContext = useContext(SceneContext);

    const getChildren = useCallback(() => {
        return (
            <>
                {scene.rootNodes.map((node) => (
                    <HTMLTwinItemAdapter key={node.uniqueId} node={node} scene={scene} options={options} />
                ))}
                {sceneGuiTextures.map((texture) => (
                    <HTMLTwinItemAdapter key={texture.uniqueId} node={texture.rootContainer} scene={scene} options={options} />
                ))}
            </>
        );
    }, [scene, sceneGuiTextures, options]);

    useEffect(() => {
        const newMeshAddedObserver = scene.onNewMeshAddedObservable.add(() => {
            if (!nextFrameObserver.current) {
                nextFrameObserver.current = props.scene.onBeforeRenderObservable.addOnce(() => {
                    nextFrameObserver.current = null;
                    setMeshIds(getSceneIds(props.scene));
                });
            }
        });
        const newTextureAddedObserver = scene.onNewTextureAddedObservable.add((texture: BaseTexture) => {
            if (texture instanceof AdvancedDynamicTexture) {
                setSceneGuiTextures((current) => [...current, texture]);
            }
        });
        return () => {
            scene.onNewMeshAddedObservable.remove(newMeshAddedObserver);
            scene.onNewTextureAddedObservable.remove(newTextureAddedObserver);
        };
    }, [scene]);

    useEffect(() => {
        if (sceneContext) {
            sceneContext.updateScene = () => {
                setMeshIds(getSceneIds(props.scene));
            };
        }
    }, [sceneContext]);

    return getChildren();
}
