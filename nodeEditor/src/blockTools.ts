import { AlphaTestBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/alphaTestBlock';
import { BonesBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/bonesBlock';
import { InstancesBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/instancesBlock';
import { MorphTargetsBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/morphTargetsBlock';
import { ImageProcessingBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/imageProcessingBlock';
import { ColorMergerBlock } from 'babylonjs/Materials/Node/Blocks/colorMergerBlock';
import { VectorMergerBlock } from 'babylonjs/Materials/Node/Blocks/vectorMergerBlock';
import { ColorSplitterBlock } from 'babylonjs/Materials/Node/Blocks/colorSplitterBlock';
import { VectorSplitterBlock } from 'babylonjs/Materials/Node/Blocks/vectorSplitterBlock';
import { RemapBlock } from 'babylonjs/Materials/Node/Blocks/remapBlock';
import { TextureBlock } from 'babylonjs/Materials/Node/Blocks/Dual/textureBlock';
import { ReflectionTextureBlock } from 'babylonjs/Materials/Node/Blocks/Dual/reflectionTextureBlock';
import { LightBlock } from 'babylonjs/Materials/Node/Blocks/Dual/lightBlock';
import { FogBlock } from 'babylonjs/Materials/Node/Blocks/Dual/fogBlock';
import { VertexOutputBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/vertexOutputBlock';
import { FragmentOutputBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/fragmentOutputBlock';
import { NormalizeBlock } from 'babylonjs/Materials/Node/Blocks/normalizeBlock';
import { AddBlock } from 'babylonjs/Materials/Node/Blocks/addBlock';
import { ScaleBlock } from 'babylonjs/Materials/Node/Blocks/scaleBlock';
import { TrigonometryBlock, TrigonometryBlockOperations } from 'babylonjs/Materials/Node/Blocks/trigonometryBlock';
import { ClampBlock } from 'babylonjs/Materials/Node/Blocks/clampBlock';
import { CrossBlock } from 'babylonjs/Materials/Node/Blocks/crossBlock';
import { DotBlock } from 'babylonjs/Materials/Node/Blocks/dotBlock';
import { MultiplyBlock } from 'babylonjs/Materials/Node/Blocks/multiplyBlock';
import { TransformBlock } from 'babylonjs/Materials/Node/Blocks/transformBlock';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPointTypes';
import { FresnelBlock } from 'babylonjs/Materials/Node/Blocks/fresnelBlock';
import { LerpBlock } from 'babylonjs/Materials/Node/Blocks/lerpBlock';
import { DivideBlock } from 'babylonjs/Materials/Node/Blocks/divideBlock';
import { SubtractBlock } from 'babylonjs/Materials/Node/Blocks/subtractBlock';
import { StepBlock } from 'babylonjs/Materials/Node/Blocks/stepBlock';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
import { NodeMaterialSystemValues } from 'babylonjs/Materials/Node/nodeMaterialSystemValues';
import { AnimatedInputBlockTypes } from 'babylonjs/Materials/Node/Blocks/Input/animatedInputBlockTypes';
import { OneMinusBlock } from 'babylonjs/Materials/Node/Blocks/oneMinusBlock';
import { ViewDirectionBlock } from 'babylonjs/Materials/Node/Blocks/viewDirectionBlock';
import { LightInformationBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/lightInformationBlock';
import { MaxBlock } from 'babylonjs/Materials/Node/Blocks/maxBlock';
import { MinBlock } from 'babylonjs/Materials/Node/Blocks/minBlock';
import { PerturbNormalBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/perturbNormalBlock';

export class BlockTools {
    public static GetBlockFromString(data: string) {
        switch (data) {
            case "BonesBlock":
                return new BonesBlock("Bones");
            case "InstancesBlock":
                return new InstancesBlock("Instances");
            case "MorphTargetsBlock":
                return new MorphTargetsBlock("MorphTargets");
            case "AlphaTestBlock":
                return new AlphaTestBlock("AlphaTest");
            case "ImageProcessingBlock":
                return new ImageProcessingBlock("ImageProcessing");
            case "ColorMergerBlock":
                return new ColorMergerBlock("ColorMerger");
            case "VectorMergerBlock":
                return new VectorMergerBlock("VectorMerger");                
            case "ColorSplitterBlock":
                return new ColorSplitterBlock("ColorSplitter");
            case "VectorSplitterBlock":
                return new VectorSplitterBlock("VectorSplitter");
            case "TextureBlock":
                return new TextureBlock("Texture");
            case "ReflectionTextureBlock":
                return new ReflectionTextureBlock("Texture");                
            case "LightBlock":
                return new LightBlock("Lights");
            case "FogBlock":
                return new FogBlock("Fog");
            case "VertexOutputBlock":
                return new VertexOutputBlock("VertexOutput");
            case "FragmentOutputBlock":
                return new FragmentOutputBlock("FragmentOutput");
            case "AddBlock":
                return new AddBlock("Add");
            case "ClampBlock":
                return new ClampBlock("Clamp");
            case "ScaleBlock":
                return new ScaleBlock("Scale");
            case "CrossBlock":
                return new CrossBlock("Cross");
            case "DotBlock":
                return new DotBlock("Dot");
            case "MultiplyBlock":
                return new MultiplyBlock("Multiply");
            case "TransformBlock":
                return new TransformBlock("Transform");
            case "TrigonometryBlock":
                return new TrigonometryBlock("Trigonometry");
            case "RemapBlock":
                return new RemapBlock("Remap");
            case "NormalizeBlock":
                return new NormalizeBlock("Normalize");
            case "FresnelBlock":
                return new FresnelBlock("Fresnel");
            case "LerpBlock":
                return new LerpBlock("Lerp");
            case "DivideBlock":
                return new DivideBlock("Divide");
            case "SubtractBlock":
                return new SubtractBlock("Subtract"); 
            case "StepBlock":
                return new StepBlock("Step");        
            case "OneMinusBlock":
                return new OneMinusBlock("One minus");      
            case "ViewDirectionBlock":
                return new ViewDirectionBlock("View direction");    
            case "LightInformationBlock":
                return new LightInformationBlock("Light information");         
            case "MaxBlock":
                return new MaxBlock("Max");       
            case "MinBlock":
                return new MinBlock("Min");        
            case "PerturbNormalBlock":                                          
                return new PerturbNormalBlock("Perturb normal");        
            case "CosBlock": {
                let cosBlock = new TrigonometryBlock("Cos");
                cosBlock.operation = TrigonometryBlockOperations.Cos;
                return cosBlock;
            }
            case "SinBlock": {
                let sinBlock = new TrigonometryBlock("Sin");
                sinBlock.operation = TrigonometryBlockOperations.Sin;
                return sinBlock;
            }
            case "AbsBlock": {
                let absBlock = new TrigonometryBlock("Abs");
                absBlock.operation = TrigonometryBlockOperations.Abs;
                return absBlock;
            }
            case "ExpBlock": {
                let expBlock = new TrigonometryBlock("Exp");
                expBlock.operation = TrigonometryBlockOperations.Exp;
                return expBlock;
            }
            case "Exp2Block": {
                let exp2Block = new TrigonometryBlock("Exp2");
                exp2Block.operation = TrigonometryBlockOperations.Exp2;
                return exp2Block;
            }
            case "RoundBlock": {
                let roundBlock = new TrigonometryBlock("Round");
                roundBlock.operation = TrigonometryBlockOperations.Round;
                return roundBlock;
            }
            case "CeilingBlock": {
                let ceilingBlock = new TrigonometryBlock("Ceiling");
                ceilingBlock.operation = TrigonometryBlockOperations.Ceiling;
                return ceilingBlock;
            }     
            case "FloorBlock": {
                let floorBlock = new TrigonometryBlock("Floor");
                floorBlock.operation = TrigonometryBlockOperations.Floor;
                return floorBlock;
            }       
            case "WorldMatrixBlock": {
                let worldMatrixBlock = new InputBlock("World");
                worldMatrixBlock.setAsSystemValue(NodeMaterialSystemValues.World);
                return worldMatrixBlock;
            }             
            case "WorldViewMatrixBlock": {
                let worldViewMatrixBlock = new InputBlock("World x View");
                worldViewMatrixBlock.setAsSystemValue(NodeMaterialSystemValues.WorldView);
                return worldViewMatrixBlock;
            }             
            case "WorldViewProjectionMatrixBlock": {
                let worldViewProjectionMatrixBlock = new InputBlock("World x View x Projection");
                worldViewProjectionMatrixBlock.setAsSystemValue(NodeMaterialSystemValues.WorldViewProjection);
                return worldViewProjectionMatrixBlock;
            }                    
            case "ViewMatrixBlock": {
                let viewMatrixBlock = new InputBlock("View");
                viewMatrixBlock.setAsSystemValue(NodeMaterialSystemValues.View);
                return viewMatrixBlock;
            }                          
            case "ViewProjectionMatrixBlock": {
                let viewProjectionMatrixBlock = new InputBlock("View x Projection");
                viewProjectionMatrixBlock.setAsSystemValue(NodeMaterialSystemValues.ViewProjection);
                return viewProjectionMatrixBlock;
            }                              
            case "ProjectionMatrixBlock": {
                let projectionMatrixBlock = new InputBlock("Projection");
                projectionMatrixBlock.setAsSystemValue(NodeMaterialSystemValues.Projection);
                return projectionMatrixBlock;
            }                                 
            case "CameraPositionBlock": {
                let cameraPosition = new InputBlock("Camera position");
                cameraPosition.setAsSystemValue(NodeMaterialSystemValues.CameraPosition);
                return cameraPosition;
            }                              
            case "FogColorBlock": {
                let FogColor = new InputBlock("Fog color");
                FogColor.setAsSystemValue(NodeMaterialSystemValues.FogColor);
                return FogColor;
            }                                   
            case "PositionBlock": {
                let meshPosition = new InputBlock("position");
                meshPosition.setAsAttribute("position");
                return meshPosition;
            }                                        
            case "UVBlock": {
                let meshUV = new InputBlock("uv");
                meshUV.setAsAttribute("uv");
                return meshUV;
            }                                         
            case "ColorBlock": {
                let meshColor = new InputBlock("color");
                meshColor.setAsAttribute("color");
                return meshColor;
            }                                              
            case "NormalBlock": {
                let meshNormal = new InputBlock("normal");
                meshNormal.setAsAttribute("normal");
                return meshNormal;
            }                                                 
            case "TangentBlock": {
                let meshTangent = new InputBlock("tangent");
                meshTangent.setAsAttribute("tangent");
                return meshTangent;
            }                                                  
            case "MatrixIndicesBlock": {
                let meshMatrixIndices = new InputBlock("matricesIndices");
                meshMatrixIndices.setAsAttribute("matricesIndices");
                return meshMatrixIndices;
            }                                                    
            case "MatrixWeightsBlock": {
                let meshMatrixWeights = new InputBlock("matricesWeights");
                meshMatrixWeights.setAsAttribute("matricesWeights");
                return meshMatrixWeights;
            }                                                     
            case "TimeBlock": {
                let timeBlock = new InputBlock("Time", undefined, NodeMaterialBlockConnectionPointTypes.Float);
                timeBlock.animationType = AnimatedInputBlockTypes.Time;
                return timeBlock;
            }   
        }

        return null;
    }

    public static GetColorFromConnectionNodeType(type: NodeMaterialBlockConnectionPointTypes) {
        let color = "Red";
        switch (type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
				color = "#ca9e27";
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector2:                
				color = "#16bcb1";
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector3:                
            case NodeMaterialBlockConnectionPointTypes.Color3:                
                color = "#b786cb";
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector4:                
            case NodeMaterialBlockConnectionPointTypes.Color4:                
				color = "#be5126";
                break;
            case NodeMaterialBlockConnectionPointTypes.Matrix:                
				color = "#591990";
                break;
        }

        return color;
    }

    public static GetConnectionNodeTypeFromString(type: string) {
        switch (type) {
            case "Float":
                return NodeMaterialBlockConnectionPointTypes.Float;
            case "Vector2":
                return NodeMaterialBlockConnectionPointTypes.Vector2;
            case "Vector3":
                return NodeMaterialBlockConnectionPointTypes.Vector3;
            case "Vector4":
                return NodeMaterialBlockConnectionPointTypes.Vector4;
            case "Matrix":
                return NodeMaterialBlockConnectionPointTypes.Matrix;
            case "Color3":
                return NodeMaterialBlockConnectionPointTypes.Color3;
            case "Color4":
                return NodeMaterialBlockConnectionPointTypes.Color4;
        }

        return NodeMaterialBlockConnectionPointTypes.AutoDetect;
    }

    public static GetStringFromConnectionNodeType(type: NodeMaterialBlockConnectionPointTypes) {
        switch (type){
            case NodeMaterialBlockConnectionPointTypes.Float:
                return "Float";
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return "Vector2";
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                return "Vector3";
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                return "Vector4";
            case NodeMaterialBlockConnectionPointTypes.Color3:
                return "Color3";
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return "Color4";
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                return "Matrix";
        }

        return "";
    }
}