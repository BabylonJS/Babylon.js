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

   /** Color for 0.0 Weight Influence */
   colorZero? : Color3;

   /** Color for 0.5 Weight Influence */
   colorHalf? : Color3;

   /** Color for 1.0 Weight Influence */
   colorFull? : Color3;

   /** Color for Zero Weight Influence */
   targetBoneIndex? : number;
}

/**
 * Simple structure of the gradient steps for the Color Map.
 */
export interface ISkeletonMapShaderColorMapKnot{
   color : Color3;
   location : number;
}

/**
 * Defines the constructor options for the SkeletonMap Shader.
 */
export interface ISkeletonMapShaderOptions{
   /** Skeleton to Map */
   skeleton: Skeleton;
   colorMap? : ISkeletonMapShaderColorMapKnot[];
}