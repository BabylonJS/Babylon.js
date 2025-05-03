export { ShellService } from "./shellService";
import { SceneExplorerServiceDefinition } from "./sceneExplorerService";
import { SceneExplorerPropertyBindingServiceDefinition } from "./sceneExplorerPropertyBindingService";
import { PropertiesServiceDefinitions } from "./properties";
import { DebugServiceDefinition } from "./debugService";
import { StatsServiceDefinition } from "./statsService";
import { ToolsServiceDefinition } from "./toolsService";
import { SettingsServiceDefinition } from "./settingsService";

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
