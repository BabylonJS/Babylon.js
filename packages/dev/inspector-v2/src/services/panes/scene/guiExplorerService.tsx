import type { AdvancedDynamicTexture, Container, Control } from "gui/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { IWatcherService } from "../../watcherService";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { tokens } from "@fluentui/react-components";
import { AppGenericRegular, BorderNoneRegular, BorderOutsideRegular, EditRegular, EyeOffRegular, EyeRegular, RectangleLandscapeRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc/observable";
import { SceneContextIdentity } from "../../sceneContext";
import { WatcherServiceIdentity } from "../../watcherService";
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

export const GuiExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext, IWatcherService]> = {
    friendlyName: "GUI Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity, WatcherServiceIdentity],
    factory: (sceneExplorerService, sceneContext, watcherService) => {
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

                const nameHookToken = watcherService.watchProperty(entity, "name", () => {
                    onChangeObservable.notifyObservers();
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
            entityIcon: ({ entity }) =>
                IsAdvancedDynamicTexture(entity) ? (
                    <AppGenericRegular color={tokens.colorPaletteLilacForeground2} />
                ) : (
                    <RectangleLandscapeRegular color={tokens.colorPaletteSeafoamForeground2} />
                ),
            getEntityAddedObservables: () => [guiEntityAddedObservable],
            getEntityRemovedObservables: () => [guiEntityRemovedObservable],
        });

        const editGuiCommandRegistration = sceneExplorerService.addEntityCommand({
            predicate: (entity: unknown): entity is AdvancedDynamicTexture => IsAdvancedDynamicTexture(entity),
            order: DefaultCommandsOrder.EditNodeMaterial,
            getCommand: (texture) => {
                return {
                    type: "action",
                    displayName: "Edit in GUI Editor",
                    icon: () => <EditRegular />,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    execute: async () => {
                        const { GUIEditor } = await import("gui-editor/guiEditor");
                        await GUIEditor.Show({ liveGuiTexture: texture });
                    },
                };
            },
        });

        const highlightControlCommandRegistration = sceneExplorerService.addEntityCommand({
            predicate: (entity: unknown): entity is Control => IsControl(entity),
            order: DefaultCommandsOrder.GuiHighlight,
            getCommand: (control) => {
                const onChangeObservable = new Observable<void>();
                const showBoundingBoxHook = watcherService.watchProperty(control, "isHighlighted", () => onChangeObservable.notifyObservers());

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
                editGuiCommandRegistration.dispose();
                highlightControlCommandRegistration.dispose();
                controlVisibilityCommandRegistration.dispose();
            },
        };
    },
};
