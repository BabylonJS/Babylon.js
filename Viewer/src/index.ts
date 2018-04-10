/// <reference path="../../dist/babylon.glTF2Interface.d.ts"/>
import { mapperManager } from './configuration/mappers';
import { viewerGlobals } from './configuration/globals';
import { viewerManager } from './viewer/viewerManager';
import { DefaultViewer } from './viewer/defaultViewer';
import { AbstractViewer } from './viewer/viewer';
import { ModelLoader } from './model/modelLoader';
import { ViewerModel, ModelState } from './model/viewerModel';
import { AnimationPlayMode, AnimationState } from './model/modelAnimation';

/**
 * BabylonJS Viewer
 * 
 * An HTML-Based viewer for 3D models, based on BabylonJS and its extensions.
 */

import * as BABYLON from 'babylonjs';

// load needed modules.
import 'babylonjs-loaders';
import 'pep';


import { InitTags } from './initializer';

// promise polyfill, if needed!
BABYLON.PromisePolyfill.Apply();

export let disableInit: boolean = false;
document.addEventListener("DOMContentLoaded", init);
function init(event) {
    document.removeEventListener("DOMContentLoaded", init);
    if (viewerGlobals.disableInit || disableInit) return;
    InitTags();
}

/**
 * Dispose all viewers currently registered
 */
function disposeAll() {
    viewerManager.dispose();
    mapperManager.dispose();
}

// public API for initialization
export { BABYLON, InitTags, DefaultViewer, AbstractViewer, viewerGlobals, viewerManager, mapperManager, disposeAll, ModelLoader, ViewerModel, AnimationPlayMode, AnimationState, ModelState };
