import { Skeleton } from "../Bones/skeleton";
import { Color3 } from '../Maths/math.color';

/**
 * Defines the options associated with the creation of a SkeletonViewer.
 */
export interface ISkeletonViewerOptions{
    /** Should the system pause animations before building the Viewer? */
   pauseAnimations: boolean;

   /** Should the system return the skeleton to rest before building? */
   returnToRest: boolean;

   /** public Display Mode of the Viewer */
   displayMode: number;

   /** Flag to toggle if the Viewer should use the CPU for animations or not? */
   displayOptions : ISkeletonViewerDisplayOptions;

   /** Flag to toggle if the Viewer should use the CPU for animations or not? */
   computeBonesUsingShaders : boolean;

   /** Flag ignore non weighted bones */
   useAllBones: boolean;

   /** Flag to say that the current pose of the bones is the rest pose */
   currentStateIsRestPose: boolean;
}

/**
 * Defines how to display the various bone meshes for the viewer.
 */
export interface ISkeletonViewerDisplayOptions{
   /** How far down to start tapering the bone spurs */
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

/**
 * Defines the constructor options for the BoneWeight Shader.
 */
export interface IBoneWeightShaderOptions{
   /** Skeleton to Map */
   skeleton: Skeleton;

   /** Colors for Uninfluenced bones */
   colorBase? : Color3;

   /** Colors for 0.0-0.25 Weight bones */
   colorZero? : Color3;

   /** Color for 0.25-0.5 Weight Influence */
   colorQuarter? : Color3;

   /** Color for 0.5-0.75 Weight Influence */
   colorHalf? : Color3;

   /** Color for 0.75-1 Weight Influence */
   colorFull? : Color3;

   /** Color for Zero Weight Influence */
   targetBoneIndex? : number;
}

/**
 * Simple structure of the gradient steps for the Color Map.
 */
export interface ISkeletonMapShaderColorMapKnot{
   /** Color of the Knot */
   color : Color3;
   /** Location of the Knot */
   location : number;
}

/**
 * Defines the constructor options for the SkeletonMap Shader.
 */
export interface ISkeletonMapShaderOptions{
   /** Skeleton to Map */
   skeleton: Skeleton;
   /** Array of ColorMapKnots that make the gradient must be ordered with knot[i].location < knot[i+1].location*/
   colorMap? : ISkeletonMapShaderColorMapKnot[];
}