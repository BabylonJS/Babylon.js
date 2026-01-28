import type { ExtensionMetadata } from "./extensionFeed";

import { BuiltInsExtensionFeed } from "./builtInsExtensionFeed";

const BabylonWebResources = {
    homepage: "https://www.babylonjs.com",
    repository: "https://github.com/BabylonJS/Babylon.js",
    bugs: "https://github.com/BabylonJS/Babylon.js/issues",
} as const satisfies Partial<ExtensionMetadata>;

/**
 * Well-known default built in extensions for the Inspector.
 */
export const DefaultInspectorExtensionFeed = new BuiltInsExtensionFeed("Inspector", [
    {
        name: "Quick Creation Tools (Preview)",
        description: "Adds a new panel for easy creation of various Babylon assets. This is a WIP extension...expect changes!",
        keywords: ["creation", "tools"],
        ...BabylonWebResources,
        author: { name: "Babylon.js", forumUserName: "" },
        getExtensionModuleAsync: async () => await import("../extensions/quickCreate/quickCreateToolsService"),
    },
    {
        name: "Reflector",
        description: "Connects to the Reflector Bridge for real-time scene synchronization with the Babylon.js Sandbox.",
        keywords: ["reflector", "bridge", "sync", "sandbox", "tools"],
        ...BabylonWebResources,
        author: { name: "Babylon.js", forumUserName: "" },
        getExtensionModuleAsync: async () => await import("../services/panes/tools/reflectorService"),
    },
]);
