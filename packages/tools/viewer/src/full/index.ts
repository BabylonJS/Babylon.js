// Ensure Symbol.metadata exists before any decorated core class in this bundle is evaluated.
// The viewer deep-imports core modules (e.g. "core/Materials/Textures/...") rather than the core
// package index, so it bypasses the polyfill that index applies. Without this, TC39 decorator
// metadata inheritance breaks and inherited @serialize properties (such as a texture's gammaSpace)
// are lost during serialization/clone. This must be the first statement so it runs before the
// re-exported viewer modules pull in any decorated core class.
import "core/Misc/symbolMetadataPolyfill";

export type { CameraAutoOrbit, EnvironmentOptions, HotSpot, PostProcessing, ShadowQuality, ToneMapping, ViewerHotSpotQuery } from "../viewerBase";
export type { LoadModelOptions, Model, ViewerDetails, ViewerOptions } from "./viewer";
export type { CanvasViewerOptions } from "./viewerFactory";
export type { ViewerElementEventMap } from "../viewerElementBase";

export { ViewerHotSpotResult } from "../viewerBase";
export { CreateHotSpotFromCamera, DefaultViewerOptions, Viewer } from "./viewer";
export { ConfigureCustomViewerElement, HTML3DElement, ViewerElement } from "./viewerElement";
export { CreateViewerForCanvas } from "./viewerFactory";
export { HTML3DAnnotationElement } from "../viewerAnnotationElement";
