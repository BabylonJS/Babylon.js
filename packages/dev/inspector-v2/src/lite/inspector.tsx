import { type EngineContext, resizeEngine } from "@babylonjs/lite";
import { type WeaklyTypedServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceContainer";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { SettingsServiceDefinition } from "shared-ui-components/modularTool/services/settingsService";
import { ShellSettingsServiceDefinition } from "shared-ui-components/modularTool/services/shellSettingsService";

import { type InspectorOptions, type InspectorToken } from "../inspector.common";
import { _ShowInspector } from "../inspectorHost";
import { PropertiesServiceDefinition } from "../services/panes/properties/propertiesService";
import { SelectionServiceDefinition } from "../services/selectionService";
import { MakeWatcherServiceDefinitions } from "../services/watcherService";
import { type IEngineContext, EngineContextIdentity } from "./engineContext";
import { EngineExplorerServiceDefinition } from "./engineExplorerService";
import { EngineSelectionServiceDefinition } from "./engineSelectionService";
import { EnginePropertiesServiceDefinition } from "./services/panes/properties/enginePropertiesService";
import { MaterialPropertiesServiceDefinition } from "./services/panes/properties/materialPropertiesService";
import { MeshPropertiesServiceDefinition } from "./services/panes/properties/meshPropertiesService";
import { RenderingContextPropertiesServiceDefinition } from "./services/panes/properties/renderingContextPropertiesService";
import { TexturePropertiesServiceDefinition } from "./services/panes/properties/texturePropertiesService";
import { MaterialExplorerServiceDefinition } from "./services/panes/scene/materialExplorerService";
import { MeshExplorerServiceDefinition } from "./services/panes/scene/meshExplorerService";
import { TextureExplorerServiceDefinition } from "./services/panes/scene/textureExplorerService";

/**
 * Shows Inspector for a Babylon Lite engine.
 * @param engine The Babylon Lite engine to inspect.
 * @param options Optional configuration for Inspector.
 * @returns An {@link InspectorToken} that can be disposed to hide Inspector.
 */
export function ShowInspector(engine: EngineContext, options: Partial<InspectorOptions> = {}): InspectorToken {
    const renderingCanvas = engine.canvas instanceof HTMLCanvasElement ? engine.canvas : null;

    return _ShowInspector(engine, options, {
        renderingCanvas,
        resize: () => resizeEngine(engine),
        startAutoResize: renderingCanvas
            ? () => {
                  const resizeObserver = new ResizeObserver(() => resizeEngine(engine));
                  resizeObserver.observe(renderingCanvas);
                  return () => resizeObserver.disconnect();
              }
            : undefined,
        initialize: (resolvedOptions) => {
            const { watcherServiceDefinition, watcherSettingsServiceDefinition, watcherRefreshToolbarServiceDefinition } = MakeWatcherServiceDefinitions({
                defaultSettings: {
                    mode: "polling",
                    interval: 250,
                },
                supportedModes: ["polling", "manual"],
            });
            const engineContextServiceDefinition: ServiceDefinition<[IEngineContext], []> = {
                friendlyName: "Babylon Lite Engine Context",
                produces: [EngineContextIdentity],
                factory: () => ({
                    engine,
                }),
            };

            const serviceDefinitions: WeaklyTypedServiceDefinition[] = [
                engineContextServiceDefinition,
                watcherServiceDefinition,
                EngineExplorerServiceDefinition,
                MeshExplorerServiceDefinition,
                MaterialExplorerServiceDefinition,
                TextureExplorerServiceDefinition,
                PropertiesServiceDefinition,
                EnginePropertiesServiceDefinition,
                RenderingContextPropertiesServiceDefinition,
                MeshPropertiesServiceDefinition,
                MaterialPropertiesServiceDefinition,
                TexturePropertiesServiceDefinition,
                SettingsServiceDefinition,
                watcherSettingsServiceDefinition,
                ShellSettingsServiceDefinition,
                watcherRefreshToolbarServiceDefinition,
                SelectionServiceDefinition,
                EngineSelectionServiceDefinition,
            ];

            return {
                serviceDefinitions,
                extensionFeeds: resolvedOptions.extensionFeeds,
            };
        },
    });
}
