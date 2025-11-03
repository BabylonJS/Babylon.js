import { BuiltInsExtensionFeed } from "./builtInsExtensionFeed";

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
        homepage: "https://www.bing.com",
        repository: "https://www.bing.com",
        bugs: "https://www.bing.com",
        author: { name: "Alex Chuber", forumUserName: "alexchuber" },
        contributors: ["Contributor One", "Contributor Two"],
        license: "Apache-2.0",
        version: "1.0.0",
        getExtensionModuleAsync: async () => await import("../services/panes/tools/exportService"),
    },
    {
        name: "Capture Tools",
        description: "Adds new features to enable capturing screenshots, GIFs, videos, and more.",
        keywords: ["capture", "screenshot", "gif", "video", "tools"],
        getExtensionModuleAsync: async () => await import("../services/panes/tools/captureService"),
    },
    {
        name: "Import Tools",
        description: "Adds new features related to importing Babylon assets.",
        keywords: ["import", "tools"],
        getExtensionModuleAsync: async () => await import("../services/panes/tools/importService"),
    },
]);
