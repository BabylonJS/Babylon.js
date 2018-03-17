/// <reference path="../../dist/preview release/babylon.d.ts"/>
/// <reference path="../../dist/babylon.glTF2Interface.d.ts"/>
/// <reference path="../../dist/preview release/loaders/babylon.glTFFileLoader.d.ts"/>

import { mapperManager } from './configuration/mappers';
import { viewerManager } from './viewer/viewerManager';
import { DefaultViewer } from './viewer/defaultViewer';
import { AbstractViewer } from './viewer/viewer';
import { ModelLoader } from './model/modelLoader';
import { ViewerModel } from './model/viewerModel';

/**
 * BabylonJS Viewer
 * 
 * An HTML-Based viewer for 3D models, based on BabylonJS and its extensions.
 */

import { PromisePolyfill } from 'babylonjs';

// load needed modules.
import 'babylonjs-loaders';
import '../assets/pep.min';


import { InitTags } from './initializer';

// promise polyfill, if needed!
PromisePolyfill.Apply();

export let disableInit: boolean = false;
document.addEventListener("DOMContentLoaded", init);
function init(event) {
    document.removeEventListener("DOMContentLoaded", init);
    if (disableInit) return;
    InitTags();
}

function disposeAll() {
    viewerManager.dispose();
    mapperManager.dispose();
}

// public API for initialization
export { InitTags, DefaultViewer, AbstractViewer, viewerManager, mapperManager, disposeAll, ModelLoader, ViewerModel };
