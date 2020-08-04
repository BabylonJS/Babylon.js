# Feature point cloud
## Introduction
This document proposes an API for exposing Feature Point Clouds for WebXR.

## Overview
The API is synchronous, and on demand.  When served a new XRFrame the consuming app may query for the current feature point cloud for a given frame. As feature point clouds are comprised of a large set of raw data it is best not to expose this to the JS application unless needed for app processing, so feature points must be requested in an on-demand fashion in order to reduce the amount of data presented to the consuming app, which must set its own frequency for updating its world understanding.

The returned array will contain the feature point cloud tracked in the current frame, including points that may not be currently visible. Feature points will be presented in a flat array of numbers where each point is presented as a set of 5 entries representing the X, Y, Z position in world space, the confidence value, and an ID that is durable across frames.

## Feature Points - API Changes
The below details the changes to the existing API to allow querying for feature points.

XRFrame will expose a new attribute featurePointCloud which returns a set that includes all feature points present in the given frame:
```typescript
interface XRSession {
  ...
  setFeaturePointCloudEnabled(enabled: boolean): boolean;
}

interface XRFrame {
  ...
  featurePointCloud? : Array<number>
}
```

## BabylonJS Integration Proposal
As a native extension of for Babylon.js that is not yet available or proposed for browsers this will be exposed through a new webxr.nativeextensions.d.ts file that will extend the interface to include the new attribute to separate the non-normative WebXR features from experimental native features.

A new `WebXRFeaturePointSystem` class extending `WebXRAbstractFeature` will be added to the list of available features.


The `WebXRFeaturePoints` class exposes the feature:

```typescript
class WebXRFeaturePointSystem extends WebXRAbstractFeature {
  public static readonly Name = WebXRFeatureName.FEATURE_POINTS;
  public static readonly Version = 1;

  /*
   Notifies the consuming app that the feature point cloud has been updated with the list of added feature point ids.
  */
  public onFeaturePointsUpdatedObservable: Observable<number[]> = new Observable();
  /*
   Notifies the consuming app that the feature point cloud has been updated with the list of updated feature point ids.
  */
  public onFeaturePointsUpdatedObservable: Observable<number[]> = new Observable();
  /**
   * The currrent feature point cloud maintained across frames.
   */
  public featurePointCloud: Array<IWebXRFeaturePoint> = [];

  /* 
   When onXRFrame occurs if the feature is attached we will update the feature point cloud, and
   send the point cloud collection to consumers for processing.
   */
  protected _onXRFrame(frame: XRFrame)
}
```

The `IWebXRFeaturePoint` interface describes a given feature point.

```typescript
 interface IWebXRFeaturePoint {
  point : Vector3;
  confidenceValue : number;
  // IDs are static across frames, and are maintained in order without skipping starting at 0.
  id : number
}
```
