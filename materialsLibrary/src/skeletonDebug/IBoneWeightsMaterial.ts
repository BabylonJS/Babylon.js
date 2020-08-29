import { Color3, Skeleton } from 'babylonjs';
/**
 * Defines the constructor options for the BoneWeight Shader.
 */
export interface IBoneWeightsMaterialOptions{
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