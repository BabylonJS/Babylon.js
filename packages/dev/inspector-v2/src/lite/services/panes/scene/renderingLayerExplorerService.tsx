import { getRenderingContextKind, type RenderingContext } from "@babylonjs/lite";
import { DeleteRegular, EyeOffRegular, EyeRegular } from "@fluentui/react-icons";
import { type ComponentType } from "react";

import { Observable } from "core/Misc/observable";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type ExplorerNodeDescription, GetEntityId } from "../../../../components/explorer/explorerModel";
import { type IExplorerService, ExplorerServiceIdentity } from "../../../../services/panes/explorer/explorerService";
import { type ISelectionService, SelectionServiceIdentity } from "../../../../services/selectionService";
import { type IWatcherService, WatcherServiceIdentity } from "../../../../services/watcherService";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { type IEngineExplorerService, EngineExplorerServiceIdentity } from "../../../engineExplorerService";
import { GetOrderedRenderingLayers, GetRenderingLayerOwners, GetRenderingLayerSnapshot } from "../../../renderingLayerUtils";

type RenderingLayer = object & {
    order: number;
    visible: boolean;
};

type LayerRenderingContext<LayerT extends RenderingLayer> = RenderingContext & {
    readonly layers: readonly LayerT[];
};

type RenderingLayerExplorerOptions<ContextT extends LayerRenderingContext<LayerT>, LayerT extends RenderingLayer> = Readonly<{
    friendlyName: string;
    contextKind: string;
    layerTypeName: string;
    icon: ComponentType<{ entity: object }>;
    removeLayer: (context: ContextT, layer: LayerT) => boolean;
}>;

export function CreateRenderingLayerExplorerServiceDefinition<ContextT extends LayerRenderingContext<LayerT>, LayerT extends RenderingLayer>(
    options: RenderingLayerExplorerOptions<ContextT, LayerT>
): ServiceDefinition<[], [IEngineExplorerService, IExplorerService, IWatcherService, ISelectionService, IEngineContext]> {
    const { friendlyName, contextKind, layerTypeName, icon, removeLayer } = options;

    return {
        friendlyName,
        consumes: [EngineExplorerServiceIdentity, ExplorerServiceIdentity, WatcherServiceIdentity, SelectionServiceIdentity, EngineContextIdentity],
        factory: (engineExplorerService, explorerService, watcherService, selectionService, engineContext) => {
            const getOwners = (layer: LayerT) => GetRenderingLayerOwners<LayerT, ContextT>(engineContext.engine, contextKind, layer);
            const providerRegistration = engineExplorerService.addRenderingContextNodeProvider({
                predicate: (context): context is ContextT => getRenderingContextKind(context) === contextKind,
                getNodes: (context): readonly ExplorerNodeDescription[] =>
                    GetOrderedRenderingLayers(context.layers).map((layer, index) => ({
                        id: `${contextKind}-layer-${GetEntityId(layer)}`,
                        kind: "item",
                        entity: layer,
                        icon,
                        getDisplayInfo: () => ({ name: `${layerTypeName} ${index + 1}` }),
                    })),
                getSnapshot: (context) => GetRenderingLayerSnapshot(context.layers),
            });
            const visibilityRegistration = explorerService.addItemCommand({
                predicate: (entity): entity is LayerT => typeof entity === "object" && entity !== null && getOwners(entity as LayerT).length > 0,
                order: 1100,
                getCommand: (layer) => {
                    const onChange = new Observable<void>();
                    const visibilityWatcher = watcherService.watchProperty(layer, "visible", () => onChange.notifyObservers());

                    return {
                        type: "toggle",
                        mode: "contextMenu",
                        get displayName() {
                            return layer.visible ? `Hide ${layerTypeName}` : `Show ${layerTypeName}`;
                        },
                        icon: () => (layer.visible ? <EyeRegular /> : <EyeOffRegular />),
                        get isEnabled() {
                            return layer.visible;
                        },
                        set isEnabled(visible: boolean) {
                            layer.visible = visible;
                        },
                        onChange,
                        dispose: () => {
                            visibilityWatcher.dispose();
                            onChange.clear();
                        },
                    };
                },
            });
            const removeRegistration = explorerService.addItemCommand({
                predicate: (entity): entity is LayerT => typeof entity === "object" && entity !== null && getOwners(entity as LayerT).length === 1,
                order: 10000,
                getCommand: (layer) => ({
                    type: "action",
                    mode: "contextMenu",
                    displayName: `Remove from ${contextKind === "text-renderer" ? "Text" : "Sprite"} Renderer`,
                    icon: DeleteRegular,
                    hotKey: { keyCode: "Delete" },
                    execute: () => {
                        const owners = getOwners(layer);
                        if (owners.length === 1 && removeLayer(owners[0], layer) && selectionService.selectedEntity === layer) {
                            selectionService.selectedEntity = null;
                        }
                    },
                }),
            });

            return {
                dispose: () => {
                    removeRegistration.dispose();
                    visibilityRegistration.dispose();
                    providerRegistration.dispose();
                },
            };
        },
    };
}
