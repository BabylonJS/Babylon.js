import type { IDisposable } from "core/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { DeleteRegular } from "@fluentui/react-icons";

import { SceneContextIdentity } from "../../sceneContext";
import { DefaultCommandsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const DisposableCommandServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Disposable Command Service",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const disposeCommandRegistration = sceneExplorerService.addEntityCommand({
            predicate: (entity: unknown): entity is IDisposable => typeof (entity as Partial<IDisposable>).dispose === "function",
            order: DefaultCommandsOrder.Dispose,
            getCommand: (disposable) => {
                return {
                    type: "action",
                    mode: "contextMenu",
                    displayName: "Dispose",
                    icon: () => <DeleteRegular />,
                    hotKey: {
                        keyCode: "Delete",
                    },
                    execute: () => disposable.dispose(),
                };
            },
        });

        return {
            dispose() {
                disposeCommandRegistration.dispose();
            },
        };
    },
};
