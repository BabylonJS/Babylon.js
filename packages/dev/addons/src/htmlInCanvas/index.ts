import { HtmlInteractionManager, ComputeOverlayCssTransform, type IHtmlInteractionManagerOptions } from "./htmlInteractionManager";
import { HtmlRaycastInteractionManager, GetElementPixelFromUv, type IHtmlRaycastInteractionManagerOptions } from "./htmlRaycastInteractionManager";
import {
    InstallHtmlInCanvasPolyfill,
    UninstallHtmlInCanvasPolyfill,
    IsHtmlInCanvasSupportedNatively,
    type IInstallHtmlInCanvasPolyfillOptions,
    type IHtmlInCanvasPolyfillModule,
} from "./polyfill";

// Export public classes and functions
export { HtmlInteractionManager, ComputeOverlayCssTransform, HtmlRaycastInteractionManager, GetElementPixelFromUv };
export { InstallHtmlInCanvasPolyfill, UninstallHtmlInCanvasPolyfill, IsHtmlInCanvasSupportedNatively };
export type { IHtmlInteractionManagerOptions, IHtmlRaycastInteractionManagerOptions, IInstallHtmlInCanvasPolyfillOptions, IHtmlInCanvasPolyfillModule };
