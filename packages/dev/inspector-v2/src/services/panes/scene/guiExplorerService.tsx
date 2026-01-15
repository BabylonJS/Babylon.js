import type { AdvancedDynamicTexture, Container, Control } from "gui/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { AppGenericRegular, BorderNoneRegular, BorderOutsideRegular, EyeOffRegular, EyeRegular, RectangleLandscapeRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc/observable";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { DefaultCommandsOrder, DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

// Don't use instanceof in this case as we don't want to bring in the gui package just to check if the entity is an AdvancedDynamicTexture.
function IsAdvancedDynamicTexture(entity: unknown): entity is AdvancedDynamicTexture {
    return (entity as AdvancedDynamicTexture)?.getClassName?.() === "AdvancedDynamicTexture";
}

function IsContainer(entity: Control): entity is Container {
    // Check for Container-specific properties without using instanceof to avoid importing the concrete type
    return (entity as Container)?.children !== undefined && (entity as Container)?.onControlAddedObservable !== undefined;
}

function IsControl(entity: unknown): entity is Control {
    // Check for Control-specific properties without using instanceof to avoid importing the concrete type
    return (entity as Control)?._currentMeasure !== undefined && (entity as Control)?.onPointerDownObservable !== undefined;
}

export const GuiExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "GUI Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const guiEntityAddedObservable = new Observable<AdvancedDynamicTexture | Container | Control>();
        const guiEntityRemovedObservable = new Observable<AdvancedDynamicTexture | Container | Control>();

        const textureAddedObserver = scene.onNewTextureAddedObservable.add((texture) => {
            if (IsAdvancedDynamicTexture(texture)) {
                guiEntityAddedObservable.notifyObservers(texture);
            }
        });

        const textureRemovedObserver = scene.onTextureRemovedObservable.add((texture) => {
            if (IsAdvancedDynamicTexture(texture)) {
                guiEntityRemovedObservable.notifyObservers(texture);
            }
        });

        const sectionRegistration = sceneExplorerService.addSection<AdvancedDynamicTexture | Container | Control>({
            displayName: "GUI",
            order: DefaultSectionsOrder.GUIs,
            getRootEntities: () => scene.textures.filter(IsAdvancedDynamicTexture),
            getEntityChildren: (entity) => (IsAdvancedDynamicTexture(entity) ? entity.getChildren() : IsContainer(entity) ? entity.children : []),
            getEntityDisplayInfo: (entity) => {
                const disposeActions: (() => void)[] = [];

                const onChangeObservable = new Observable<void>();
                disposeActions.push(() => onChangeObservable.clear());

                const nameHookToken = InterceptProperty(entity, "name", {
                    afterSet: () => {
                        onChangeObservable.notifyObservers();
                    },
                });
                disposeActions.push(() => nameHookToken.dispose());

                if (!IsAdvancedDynamicTexture(entity) && IsContainer(entity)) {
                    const controlAddedObserver = entity.onControlAddedObservable.add((control) => {
                        if (control) {
                            guiEntityAddedObservable.notifyObservers(control);
                        }
                    });
                    disposeActions.push(() => entity.onControlAddedObservable.remove(controlAddedObserver));

                    const controlRemovedObserver = entity.onControlRemovedObservable.add((control) => {
                        if (control) {
                            guiEntityRemovedObservable.notifyObservers(control);
                        }
                    });
                    disposeActions.push(() => entity.onControlRemovedObservable.remove(controlRemovedObserver));
                }

                return {
                    get name() {
                        if (IsAdvancedDynamicTexture(entity)) {
                            return entity.name;
                        } else {
                            return `${entity.name ?? "No name"} [${entity.getClassName()}]`;
                        }
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        disposeActions.reverse().forEach((disposeAction) => disposeAction());
                    },
                };
            },
            entityIcon: ({ entity }) => (IsAdvancedDynamicTexture(entity) ? <AppGenericRegular /> : <RectangleLandscapeRegular />),
            getEntityAddedObservables: () => [guiEntityAddedObservable],
            getEntityRemovedObservables: () => [guiEntityRemovedObservable],
        });

        const highlightControlCommandRegistration = sceneExplorerService.addEntityCommand({
            predicate: (entity: unknown): entity is Control => IsControl(entity),
            order: DefaultCommandsOrder.GuiHighlight,
            getCommand: (control) => {
                const onChangeObservable = new Observable<void>();
                const showBoundingBoxHook = InterceptProperty(control, "isHighlighted", {
                    afterSet: () => onChangeObservable.notifyObservers(),
                });

                return {
                    type: "toggle",
                    get displayName() {
                        return `${control.isHighlighted ? "Hide" : "Show"} Bounding Box`;
                    },
                    icon: () => (control.isHighlighted ? <BorderOutsideRegular /> : <BorderNoneRegular />),
                    get isEnabled() {
                        return control.isHighlighted;
                    },
                    set isEnabled(enabled: boolean) {
                        control.isHighlighted = enabled;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        showBoundingBoxHook.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
        });

        const controlVisibilityCommandRegistration = sceneExplorerService.addEntityCommand({
            predicate: (entity: unknown): entity is Control => IsControl(entity),
            order: DefaultCommandsOrder.GuiVisibility,
            getCommand: (control) => {
                return {
                    type: "toggle",
                    get displayName() {
                        return `${control.isVisible ? "Hide" : "Show"} Mesh`;
                    },
                    icon: () => (control.isVisible ? <EyeRegular /> : <EyeOffRegular />),
                    get isEnabled() {
                        return !control.isVisible;
                    },
                    set isEnabled(enabled: boolean) {
                        control.isVisible = !enabled;
                    },
                    onChange: control.onIsVisibleChangedObservable,
                };
            },
        });

        return {
            dispose: () => {
                textureAddedObserver.remove();
                textureRemovedObserver.remove();
                sectionRegistration.dispose();
                highlightControlCommandRegistration.dispose();
                controlVisibilityCommandRegistration.dispose();
            },
        };
    },
};
