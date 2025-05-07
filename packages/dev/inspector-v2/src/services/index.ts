export { ShellServiceIdentity as ShellService } from "./shellService";
import { SceneExplorerServiceDefinition } from "./panes/sceneExplorerService";
import { SceneExplorerPropertyBindingServiceDefinition } from "./sceneExplorerPropertyBindingService";
import { PropertiesServiceDefinitions } from "./panes/properties";
import { DebugServiceDefinition } from "./panes/debugService";
import { StatsServiceDefinition } from "./panes/statsService";
import { ToolsServiceDefinition } from "./panes/toolsService";
import { SettingsServiceDefinition } from "./panes/settingsService";

const DiagosticServiceDefinitions = [
    SceneExplorerServiceDefinition,
    ...PropertiesServiceDefinitions,
    SceneExplorerPropertyBindingServiceDefinition,
    DebugServiceDefinition,
    StatsServiceDefinition,
    ToolsServiceDefinition,
    SettingsServiceDefinition,
];

export { DiagosticServiceDefinitions };
