/// <reference path="../../dist/babylon.glTF2Interface.d.ts" />
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
import 'babylonjs-loaders';
import 'pep';
import { InitTags } from './initializer';
declare let disableInit: boolean;
/**
 * Dispose all viewers currently registered
 */
declare function disposeAll(): void;
declare const Version: string;
export { BABYLON, Version, InitTags, DefaultViewer, AbstractViewer, viewerGlobals, telemetryManager, disableInit, viewerManager, mapperManager, disposeAll, ModelLoader, ViewerModel, AnimationPlayMode, AnimationState, ModelState, ILoaderPlugin };
export * from './configuration';
