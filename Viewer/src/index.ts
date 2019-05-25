import { mapperManager } from './configuration/mappers';
import { viewerGlobals } from './configuration/globals';
import { viewerManager } from './viewer/viewerManager';
import { DefaultViewer } from './viewer/defaultViewer';
import { AbstractViewer } from './viewer/viewer';
import { telemetryManager } from './managers/telemetryManager';
import { ModelLoader } from './loader/modelLoader';
import { ViewerModel, ModelState } from './model/viewerModel';
import { AnimationPlayMode, AnimationState } from './model/modelAnimation';
import { ILoaderPlugin } from './loader/plugins/loaderPlugin';
import { AbstractViewerNavbarButton } from './templating/viewerTemplatePlugin';
import { registerCustomOptimizer } from './optimizer/custom';

/**
 * BabylonJS Viewer
 *
 * An HTML-Based viewer for 3D models, based on BabylonJS and its extensions.
 */

import * as BABYLON from 'babylonjs';

// load needed modules.
import 'babylonjs-loaders';
import 'pepjs';

import { initListeners, InitTags } from './initializer';

// promise polyfill, if needed!
BABYLON.PromisePolyfill.Apply();
initListeners();

//deprectaed, here for backwards compatibility
let disableInit: boolean = viewerGlobals.disableInit;

/**
 * Dispose all viewers currently registered
 */
function disposeAll() {
    viewerManager.dispose();
    mapperManager.dispose();
    telemetryManager.dispose();
}

const Version = viewerGlobals.version;

console.log("Babylon.js viewer (v" + Version + ")");

// public API for initialization
export { BABYLON, Version, InitTags, DefaultViewer, AbstractViewer, viewerGlobals, telemetryManager, disableInit, viewerManager, mapperManager, disposeAll, ModelLoader, ViewerModel, AnimationPlayMode, AnimationState, ModelState, ILoaderPlugin, AbstractViewerNavbarButton, registerCustomOptimizer };
export { GLTF2 } from 'babylonjs-loaders';
// export publicliy all configuration interfaces
export * from './configuration';
