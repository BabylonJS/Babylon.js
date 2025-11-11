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
    // {
    //     name: "Asset Creation",
    //     description: "Adds new features to enable creating Babylon assets such as node materials, flow graphs, and more.",
    //     keywords: ["creation"],
    //     getExtensionModuleAsync: async () => await import("../services/creationToolsService"),
    // },
    {
        name: "Export Tools",
        description: "Adds new features to enable exporting Babylon assets such as .gltf, .glb, .babylon, and more.",
        keywords: ["export", "gltf", "glb", "babylon", "exporter", "tools"],
        ...BabylonWebResources,
        author: { name: "Alex Chuber", forumUserName: "alexchuber" },
        getExtensionModuleAsync: async () => await import("../services/panes/tools/exportService"),
    },
    {
        name: "Capture Tools",
        description: "Adds new features to enable capturing screenshots, GIFs, videos, and more.",
        keywords: ["capture", "screenshot", "gif", "video", "tools"],
        ...BabylonWebResources,
        author: { name: "Alex Chuber", forumUserName: "alexchuber" },
        getExtensionModuleAsync: async () => await import("../services/panes/tools/captureService"),
    },
    {
        name: "Import Tools",
        description: "Adds new features related to importing Babylon assets.",
        keywords: ["import", "tools"],
        ...BabylonWebResources,
        author: { name: "Alex Chuber", forumUserName: "alexchuber" },
        getExtensionModuleAsync: async () => await import("../services/panes/tools/importService"),
    },
]);
