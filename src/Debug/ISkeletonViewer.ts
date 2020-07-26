/**
 * Defines the options associated with the creation of a SkeletonViewer.
 */
export interface ISkeletonViewerOptions{
    /** Should the system pause animations before building the Viewer? */
   pauseAnimations: boolean;

   /** Should the system return the skeleton to rest before building? */
   returnToRest: boolean;

   /** public Display constants.
     *  0 : BABYLON.SkeletonViewer.DISPLAY_LINES
     *  1 : BABYLON.SkeletonViewer.DISPLAY_SPHERE_AND_SPURS
     *  2 : BABYLON.SkeletonViewer.DISPLAY_SPHERES
     *  3 : BABYLON.SkeletonViewer.DISPLAY_BLOCKS
     */
   displayMode: number;

   /** Flag to toggle if the Viewer should use the CPU for animations or not? */
   displayOptions : ISkeletonViewerDisplayOptions;

   /** Flag to toggle if the Viewer should use the CPU for animations or not? */
   computeBonesUsingShaders : boolean;
}

export interface ISkeletonViewerDisplayOptions{
   /** How fardown to start tapering the bone spurs */
   midStep? : number;

   /** How big is the midStep? */
   midStepFactor? : number;

   /** Base for the Sphere Size */
   sphereBaseSize? : number;

   /** The ratio of the sphere to the longest bone in units */
   sphereScaleUnit? : number;

   /** Ratio for the Sphere Size */
   sphereFactor? : number;
}