import * as Accessibility from "@babylonjs/accessibility";
import * as Addons from "@babylonjs/addons";
import * as Core from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import * as Ktx2Decoder from "@babylonjs/ktx2decoder";
import * as Loaders from "@babylonjs/loaders";
import "@babylonjs/loaders/glTF";
import "@babylonjs/loaders/OBJ";
import "@babylonjs/loaders/STL";
import * as LottiePlayer from "@babylonjs/lottie-player";
import * as Materials from "@babylonjs/materials";
import * as PostProcesses from "@babylonjs/post-processes";
import * as ProceduralTextures from "@babylonjs/procedural-textures";
import * as Serializers from "@babylonjs/serializers";
import * as SharedUiComponents from "@babylonjs/shared-ui-components/fluent/primitives/button";
import * as SmartFilterBlocks from "@babylonjs/smart-filters-blocks";
import * as SmartFilters from "@babylonjs/smart-filters";
import * as Viewer from "@babylonjs/viewer";

const packageNamespaces = {
    Accessibility,
    Addons,
    Core,
    GUI,
    Ktx2Decoder,
    Loaders,
    LottiePlayer,
    Materials,
    PostProcesses,
    ProceduralTextures,
    Serializers,
    SharedUiComponents,
    SmartFilterBlocks,
    SmartFilters,
    Viewer,
};

const globalObject = globalThis as typeof globalThis & { __babylonEs6PackageImportSmoke?: typeof packageNamespaces };
globalObject.__babylonEs6PackageImportSmoke = packageNamespaces;

if (Object.keys(packageNamespaces).length !== 15) {
    throw new Error("The ES6 package import smoke test is missing a package namespace.");
}
