import type { ExtensionMetadata } from "./extensionFeed";

import { BuiltInsExtensionFeed } from "./builtInsExtensionFeed";

// Created by running the following command from the packages/dev/inspector-v2 directory:
// npm run makeAvatar https://raw.githubusercontent.com/BabylonJS/Brand-Toolkit/master/babylon_logo/fullColor/babylon_logo_color.png 0.8
const BabylonLogoBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAFXElEQVR4nO2WbWwTdRzHu+EbYmLgpeILwcQXvvCFLwwGxthG1/Z6d33Ag22FDXAE98wixsCbSiS+4IUhxoQYoyiSGKcogsjaa9c9dw9sbdfrbevW611nYTDYliCRsbv7mrt2sPiGUTZf8Uua9P7/u9/383v4//MzGJ5bjgaDIQ8Ms66FYdYZ/m+D250PgyF/GUy+trb2wshEnfmPvKnG3fukJoZ+vI912vqapRsGg+481cy8I9RSbTONNkw32pXJatMvCcvmN7Q9t5ad1QSBJuzOpHvmo7JXkrX01zfq6Yd3mhxIHrHIQuUOee5EJR4MtN0D8Bnm5jbo37nd+c/UH1jmINXcvF6scxxL1VJ3Zo86kKol5UTVTlmsIXH3p68g35uXASgAoCqyCKBKy4Lup0UL4Bn6Q2piaKmWjM0etSNdTyvCoV2LwsES9daXbixMCZomoKpQFFkFsKg9aUtzv//QM7ln6zYdIlu6lUVuyLw8e7zsLbGGunqrXq8zhMMmOVFZqKQ/+QD3w8GMsB6xAmi/rN0PB+X0qQZ5psGGG/W0LNXT5/9x731tRSDubKquWJlN3H7H7N1GO1K1hDy5v1BJNe/BvPcilIUHj4TVxUWosqJnYMlmfz0H4X0jhANF8l915OJ8oxORCnv0vHHfi0+EcGcBBpwVW9hSaqGdIBSu0qrOXvgCyvzsUsgZ4WVR6zDKYxD59g3cPvspwuVmpZ2g4DPR0khNzcYVA3QwzGY/QT/wFpnBMuVqShKwsCSQDVZVVaQ9LG519z7qgyXAhwCmxnh4TJTSZiThM1NioKpqw4oBWKdzi89CLbDFZrSVudRIfzti0UFMpyXIioJ5fhSDH36Ma9uL0LrTiPDJU/hbSkFWZMxMpyGK4xjv64KPsCmBUit8ZlrqqqjYmBvAXpcaG+pFbGQA0egAOF8rfCZSF/dZaC06/Ll1B9qZciT5CIQED0mawMRg7+oBcEM9OgA/FsbQby1gjQS8JgreUiu8pSQ8Riv8tt2YHO6HKMbXEiCE0KWf4Skh0ElT4A+Q4CpJBAgrWGo3JkMDawzADyPcehlhFwnx0C5IdRRSdSSE/TsRqi5HIhqCmBxfA4DBbh0gFulHjLuO8bZLSJyqh3jIiGS1CeKZE0gNd0FMxiFOaj0Qx8RAT+4AHQyzmTUvAVSo2gngR0PgQkEdguND4LghxC9+A9F7EWI6iaQ0qYsnJ2JITUtIhAe1JtUB2Kc9hl3Oii1+M7XgNRIKW2pVe44fx0iXD6MTI/pxjA0HwUX6wcejSE4JEBM8knFOr3/qpoR4dzt6m4/BW2JW/CYSfgstjVQ8xUV0hWE2BQjb3SBh0zpe9hQUKz7Kif4zn4MbDoKfiIAL92E00p8RFsYwdVOCwIVw/fRp/WheKyjR4OVB0ok2whb17FvBVbz8hU6GeZMl6MudFhu6CJsWjezZXqwEXJUYuvA9eH4IY+MRSGlBb7zId+cQeK8MrduKFO8ui9xttaPDQi+yhO3bPlf1q8t9P5X5bU7Cb6EjQasdAQuteIpMi55Co9pZ14ARz1XwrX+g8/ARtBYUq57iUrmDsKk9hF2re0e7nXk3Z2FoA4khM5D0NjPrfVZ7k99E3Q6SDu0mVDwFJTJrpuE1EmgtKJHbzJTSp+2ZSYGlHS4Aejm1oWaptDlZiz6SZU+Hy/UyS9jOBsz0Qo/VDi3VPiMh95IO+M3UPdbqONnnanhpKYBVm5RhMOS5CwtfcGdH8Q7Hnre9FortJvQ6K6yF+tG/t/J1bU+LVofOJe1PMs3p8kHTRzvKtB7JPuatmfB/TU8vHgutarpz7Y/nZsjR/gUhEcwHmuaM9wAAAABJRU5ErkJggg==";

const BabylonWebResources = {
    homepage: "https://www.babylonjs.com",
    repository: "https://github.com/BabylonJS/Babylon.js",
    bugs: "https://github.com/BabylonJS/Babylon.js/issues",
    author: {
        name: "Babylon.js",
        avatar: BabylonLogoBase64,
    },
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
        getExtensionModuleAsync: async () => await import("../extensions/quickCreate/quickCreateToolsService"),
    },
    {
        name: "Reflector",
        description: "Connects to the Reflector Bridge for real-time scene synchronization with the Babylon.js Sandbox.",
        keywords: ["reflector", "bridge", "sync", "sandbox", "tools"],
        ...BabylonWebResources,
        getExtensionModuleAsync: async () => await import("../services/panes/tools/reflectorService"),
    },
]);
