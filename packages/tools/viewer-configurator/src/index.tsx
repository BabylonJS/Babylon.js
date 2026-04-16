import { MakeModularTool } from "shared-ui-components/modularTool/modularTool";

import { ViewerServiceDefinition } from "./viewerService";
import { ConfiguratorServiceDefinition } from "./configuratorService";

MakeModularTool({
    namespace: "ViewerConfigurator",
    containerElement: document.getElementById("root")!,
    serviceDefinitions: [ViewerServiceDefinition, ConfiguratorServiceDefinition],
    toolbarMode: "compact",
    showThemeSelector: true,
    rightPaneDefaultWidth: 400,
    rightPaneMinWidth: 300,
});
