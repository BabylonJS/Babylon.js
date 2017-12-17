import { mapperManager } from './configuration/mappers';
import { viewerManager } from './viewer/viewerManager';
import { DefaultViewer } from './viewer/defaultViewer';
import { AbstractViewer } from './viewer/viewer';

/**
 * BabylonJS Viewer
 * 
 * An HTML-Based viewer for 3D models, based on BabylonJS and its extensions.
 */


// load babylon and needed modules.
import 'babylonjs';
import 'babylonjs-loaders';
import '../assets/pep.min';

import { InitTags } from './initializer';

// promise polyfill, if needed!
global.Promise = typeof Promise === 'undefined' ? require('es6-promise').Promise : Promise;

export let disableInit: boolean = false;
document.addEventListener("DOMContentLoaded", function (event) {
    if (disableInit) return;
    InitTags();
});

// public API for initialization
export { InitTags, DefaultViewer, AbstractViewer, viewerManager, mapperManager };
