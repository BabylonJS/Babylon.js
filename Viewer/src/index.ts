/// <reference path="../../dist/babylon.glTF2Interface.d.ts"/>
import { mapperManager } from './configuration/mappers';
import { viewerGlobals } from './configuration/globals';
import { viewerManager } from './viewer/viewerManager';
import { DefaultViewer } from './viewer/defaultViewer';
import { AbstractViewer } from './viewer/viewer';
import { telemetryManager } from './telemetryManager';
import { ModelLoader } from './loader/modelLoader';
import { ViewerModel, ModelState } from './model/viewerModel';
import { AnimationPlayMode, AnimationState } from './model/modelAnimation';
import { ILoaderPlugin } from './loader/plugins/loaderPlugin';

/**
 * BabylonJS Viewer
 * 
 * An HTML-Based viewer for 3D models, based on BabylonJS and its extensions.
 */

import * as BABYLON from 'babylonjs';

// load needed modules.
import 'babylonjs-loaders';
import 'pep';

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

const Version = BABYLON.Engine.Version;

// public API for initialization
export { BABYLON, Version, InitTags, DefaultViewer, AbstractViewer, viewerGlobals, telemetryManager, disableInit, viewerManager, mapperManager, disposeAll, ModelLoader, ViewerModel, AnimationPlayMode, AnimationState, ModelState, ILoaderPlugin };
