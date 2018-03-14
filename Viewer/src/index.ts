import { mapperManager } from './configuration/mappers';
import { viewerManager } from './viewer/viewerManager';
import { DefaultViewer } from './viewer/defaultViewer';
import { AbstractViewer } from './viewer/viewer';

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

// public API for initialization
export { InitTags, DefaultViewer, AbstractViewer, viewerManager, mapperManager };
