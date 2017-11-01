import { AbstractViewer } from './viewer/viewer';

/**
 * BabylonJS Viewer
 * 
 * An HTML-Based viewer for 3D models, based on BabylonJS and its extensions.
 */


// load babylon and needed modules.
import 'babylonjs';
import 'babylonjs-loaders';
import 'babylonjs-materials';

import { InitTags } from './initializer';

// promise polyfill, if needed!
global.Promise = Promise || require('es6-promise').Promise;

export let disableInit: boolean = false;

setTimeout(() => {
    if (disableInit) return;
    InitTags();
});

// public API for initialization
export { InitTags };
