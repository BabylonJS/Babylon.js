import { DiscardBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/discardBlock';
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
import { ModBlock } from 'babylonjs/Materials/Node/Blocks/modBlock';
import { ScaleBlock } from 'babylonjs/Materials/Node/Blocks/scaleBlock';
import { TrigonometryBlock, TrigonometryBlockOperations } from 'babylonjs/Materials/Node/Blocks/trigonometryBlock';
import { ClampBlock } from 'babylonjs/Materials/Node/Blocks/clampBlock';
import { CrossBlock } from 'babylonjs/Materials/Node/Blocks/crossBlock';
import { DotBlock } from 'babylonjs/Materials/Node/Blocks/dotBlock';
import { MultiplyBlock } from 'babylonjs/Materials/Node/Blocks/multiplyBlock';
import { TransformBlock } from 'babylonjs/Materials/Node/Blocks/transformBlock';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';
import { FresnelBlock } from 'babylonjs/Materials/Node/Blocks/fresnelBlock';
import { LerpBlock } from 'babylonjs/Materials/Node/Blocks/lerpBlock';
import { NLerpBlock } from 'babylonjs/Materials/Node/Blocks/nLerpBlock';
import { DivideBlock } from 'babylonjs/Materials/Node/Blocks/divideBlock';
import { SubtractBlock } from 'babylonjs/Materials/Node/Blocks/subtractBlock';
import { StepBlock } from 'babylonjs/Materials/Node/Blocks/stepBlock';
import { SmoothStepBlock } from 'babylonjs/Materials/Node/Blocks/smoothStepBlock';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
import { NodeMaterialSystemValues } from 'babylonjs/Materials/Node/Enums/nodeMaterialSystemValues';
import { AnimatedInputBlockTypes } from 'babylonjs/Materials/Node/Blocks/Input/animatedInputBlockTypes';
import { OneMinusBlock } from 'babylonjs/Materials/Node/Blocks/oneMinusBlock';
import { ViewDirectionBlock } from 'babylonjs/Materials/Node/Blocks/viewDirectionBlock';
import { LightInformationBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/lightInformationBlock';
import { MaxBlock } from 'babylonjs/Materials/Node/Blocks/maxBlock';
import { MinBlock } from 'babylonjs/Materials/Node/Blocks/minBlock';
import { PerturbNormalBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/perturbNormalBlock';
import { LengthBlock } from 'babylonjs/Materials/Node/Blocks/lengthBlock';
import { DistanceBlock } from 'babylonjs/Materials/Node/Blocks/distanceBlock';
import { FrontFacingBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/frontFacingBlock';
import { NegateBlock } from 'babylonjs/Materials/Node/Blocks/negateBlock';
import { PowBlock } from 'babylonjs/Materials/Node/Blocks/powBlock';
import { Scene } from 'babylonjs/scene';
import { RandomNumberBlock } from 'babylonjs/Materials/Node/Blocks/randomNumberBlock';
import { ReplaceColorBlock } from 'babylonjs/Materials/Node/Blocks/replaceColorBlock';
import { PosterizeBlock } from 'babylonjs/Materials/Node/Blocks/posterizeBlock';
import { ArcTan2Block } from 'babylonjs/Materials/Node/Blocks/arcTan2Block';
import { ReciprocalBlock } from 'babylonjs/Materials/Node/Blocks/reciprocalBlock';
import { GradientBlock } from 'babylonjs/Materials/Node/Blocks/gradientBlock';
import { WaveBlock, WaveBlockKind } from 'babylonjs/Materials/Node/Blocks/waveBlock';
import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
import { WorleyNoise3DBlock } from 'babylonjs/Materials/Node/Blocks/worleyNoise3DBlock';
import { SimplexPerlin3DBlock } from 'babylonjs/Materials/Node/Blocks/simplexPerlin3DBlock';
import { NormalBlendBlock } from 'babylonjs/Materials/Node/Blocks/normalBlendBlock';
import { Rotate2dBlock } from 'babylonjs/Materials/Node/Blocks/rotate2dBlock';
import { DerivativeBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/derivativeBlock';
import { RefractBlock } from 'babylonjs/Materials/Node/Blocks/refractBlock';
import { ReflectBlock } from 'babylonjs/Materials/Node/Blocks/reflectBlock';
import { DesaturateBlock } from 'babylonjs/Materials/Node/Blocks/desaturateBlock';
import { PBRMetallicRoughnessBlock } from 'babylonjs/Materials/Node/Blocks/PBR/pbrMetallicRoughnessBlock';
import { SheenBlock } from 'babylonjs/Materials/Node/Blocks/PBR/sheenBlock';
import { AmbientOcclusionBlock } from 'babylonjs/Materials/Node/Blocks/PBR/ambientOcclusionBlock';
import { ReflectivityBlock } from 'babylonjs/Materials/Node/Blocks/PBR/reflectivityBlock';
import { AnisotropyBlock } from 'babylonjs/Materials/Node/Blocks/PBR/anisotropyBlock';
import { ReflectionBlock } from 'babylonjs/Materials/Node/Blocks/PBR/reflectionBlock';
import { ClearCoatBlock } from 'babylonjs/Materials/Node/Blocks/PBR/clearCoatBlock';
import { RefractionBlock } from 'babylonjs/Materials/Node/Blocks/PBR/refractionBlock';
import { SubSurfaceBlock } from 'babylonjs/Materials/Node/Blocks/PBR/subSurfaceBlock';
import { CurrentScreenBlock } from 'babylonjs/Materials/Node/Blocks/Dual/currentScreenBlock';
import { ParticleTextureBlock } from 'babylonjs/Materials/Node/Blocks/Particle/particleTextureBlock';
import { ParticleRampGradientBlock } from 'babylonjs/Materials/Node/Blocks/Particle/particleRampGradientBlock';
import { ParticleBlendMultiplyBlock } from 'babylonjs/Materials/Node/Blocks/Particle/particleBlendMultiplyBlock';
import { NodeMaterialModes } from 'babylonjs/Materials/Node/Enums/nodeMaterialModes';
import { FragCoordBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/fragCoordBlock';
import { ScreenSizeBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/screenSizeBlock';

export class BlockTools {
    public static GetBlockFromString(data: string, scene: Scene, nodeMaterial: NodeMaterial) {
        switch (data) {
            case "DesaturateBlock":
                return new DesaturateBlock("Desaturate");
            case "RefractBlock":
                return new RefractBlock("Refract");
            case "ReflectBlock":
                return new ReflectBlock("Reflect");
            case "DerivativeBlock":
                return new DerivativeBlock("Derivative");
            case "Rotate2dBlock":
                return new Rotate2dBlock("Rotate2d");
            case "NormalBlendBlock":
                return new NormalBlendBlock("NormalBlend");
            case "WorleyNoise3DBlock":
                return new WorleyNoise3DBlock("WorleyNoise3D");
            case "SimplexPerlin3DBlock":
                return new SimplexPerlin3DBlock("SimplexPerlin3D");
            case "BonesBlock":
                return new BonesBlock("Bones");
            case "InstancesBlock":
                return new InstancesBlock("Instances");
            case "MorphTargetsBlock":
                return new MorphTargetsBlock("MorphTargets");
            case "DiscardBlock":
                return new DiscardBlock("Discard");
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
                return new TextureBlock("Texture", nodeMaterial.mode === NodeMaterialModes.Particle);
            case "ReflectionTextureBlock":
                return new ReflectionTextureBlock("Reflection texture");
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
            case "PowBlock":
                return new PowBlock("Pow");
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
            case "NLerpBlock":
                return new NLerpBlock("NLerp");
            case "DivideBlock":
                return new DivideBlock("Divide");
            case "SubtractBlock":
                return new SubtractBlock("Subtract");
            case "ModBlock":
                return new ModBlock("Mod");
            case "StepBlock":
                return new StepBlock("Step");
            case "SmoothStepBlock":
                return new SmoothStepBlock("Smooth step");
            case "OneMinusBlock":
                return new OneMinusBlock("One minus");
            case "ReciprocalBlock":
                return new ReciprocalBlock("Reciprocal");
            case "ViewDirectionBlock":
                return new ViewDirectionBlock("View direction");
            case "LightInformationBlock":
                let lightInformationBlock = new LightInformationBlock("Light information");
                lightInformationBlock.light = scene.lights.length ? scene.lights[0] : null;
                return lightInformationBlock;
            case "MaxBlock":
                return new MaxBlock("Max");
            case "MinBlock":
                return new MinBlock("Min");
            case "LengthBlock":
                return new LengthBlock("Length");
            case "DistanceBlock":
                return new DistanceBlock("Distance");
            case "NegateBlock":
                return new NegateBlock("Negate");
            case "PerturbNormalBlock":
                return new PerturbNormalBlock("Perturb normal");
            case "RandomNumberBlock":
                return new RandomNumberBlock("Random number");
            case "ReplaceColorBlock":
                return new ReplaceColorBlock("Replace color");
            case "PosterizeBlock":
                return new PosterizeBlock("Posterize");
            case "ArcTan2Block":
                return new ArcTan2Block("ArcTan2");
            case "GradientBlock":
                return new GradientBlock("Gradient");
            case "FrontFacingBlock":
                return new FrontFacingBlock("Front facing");
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
            case "SqrtBlock": {
                let sqrtBlock = new TrigonometryBlock("Sqrt");
                sqrtBlock.operation = TrigonometryBlockOperations.Sqrt;
                return sqrtBlock;
            }
            case "ArcCosBlock": {
                let acosBlock = new TrigonometryBlock("ArcCos");
                acosBlock.operation = TrigonometryBlockOperations.ArcCos;
                return acosBlock;
            }
            case "ArcSinBlock": {
                let asinBlock = new TrigonometryBlock("ArcSin");
                asinBlock.operation = TrigonometryBlockOperations.ArcSin;
                return asinBlock;
            }
            case "TanBlock": {
                let tanBlock = new TrigonometryBlock("Tan");
                tanBlock.operation = TrigonometryBlockOperations.Tan;
                return tanBlock;
            }
            case "ArcTanBlock": {
                let atanBlock = new TrigonometryBlock("ArcTan");
                atanBlock.operation = TrigonometryBlockOperations.ArcTan;
                return atanBlock;
            }
            case "FractBlock": {
                let fractBlock = new TrigonometryBlock("Fract");
                fractBlock.operation = TrigonometryBlockOperations.Fract;
                return fractBlock;
            }
            case "SignBlock": {
                let signBlock = new TrigonometryBlock("Sign");
                signBlock.operation = TrigonometryBlockOperations.Sign;
                return signBlock;
            }
            case "LogBlock": {
                let logBlock = new TrigonometryBlock("Log");
                logBlock.operation = TrigonometryBlockOperations.Log;
                return logBlock;
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
            case "DegreesToRadiansBlock": {
                let degreesToRadiansBlock = new TrigonometryBlock("Degrees to radians");
                degreesToRadiansBlock.operation = TrigonometryBlockOperations.Radians;
                return degreesToRadiansBlock;
            }
            case "RadiansToDegreesBlock": {
                let radiansToDegreesBlock = new TrigonometryBlock("Radians to degrees");
                radiansToDegreesBlock.operation = TrigonometryBlockOperations.Degrees;
                return radiansToDegreesBlock;
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
            case "SawToothWaveBlock": {
                let sawToothWaveBlock = new WaveBlock("SawTooth wave");
                sawToothWaveBlock.kind = WaveBlockKind.SawTooth;
                return sawToothWaveBlock;
            }
            case "SquareWaveBlock": {
                let squareWaveBlock = new WaveBlock("Square wave");
                squareWaveBlock.kind = WaveBlockKind.Square;
                return squareWaveBlock;
            }
            case "TriangleWaveBlock": {
                let triangleWaveBlock = new WaveBlock("Triangle wave");
                triangleWaveBlock.kind = WaveBlockKind.Triangle;
                return triangleWaveBlock;
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
            case "Position2DBlock": {
                let meshPosition = new InputBlock("position");
                meshPosition.setAsAttribute("position2d");
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
            case "DeltaTimeBlock": {
                let deltaTimeBlock = new InputBlock("Delta time");
                deltaTimeBlock.setAsSystemValue(NodeMaterialSystemValues.DeltaTime);
                return deltaTimeBlock;
            }
            case "WorldPositionBlock": {
                let worldPositionBlock = nodeMaterial.getInputBlockByPredicate((b) => b.isAttribute && b.name === "position");
                if (!worldPositionBlock) {
                    worldPositionBlock = new InputBlock("position");
                    worldPositionBlock.setAsAttribute("position");
                }

                let worldMatrixBlock = nodeMaterial.getInputBlockByPredicate((b) => b.isSystemValue && b.systemValue === NodeMaterialSystemValues.World);

                if (!worldMatrixBlock) {
                    worldMatrixBlock = new InputBlock("World");
                    worldMatrixBlock.setAsSystemValue(NodeMaterialSystemValues.World);
                }

                let transformBlock = new TransformBlock("World position");
                worldPositionBlock.connectTo(transformBlock);
                worldMatrixBlock.connectTo(transformBlock);

                return transformBlock;
            }
            case "WorldNormalBlock": {
                let worldNormalBlock = nodeMaterial.getInputBlockByPredicate((b) => b.isAttribute && b.name === "normal");
                if (!worldNormalBlock) {
                    worldNormalBlock = new InputBlock("normal");
                    worldNormalBlock.setAsAttribute("normal");
                }

                let worldMatrixBlock = nodeMaterial.getInputBlockByPredicate((b) => b.isSystemValue && b.systemValue === NodeMaterialSystemValues.World);

                if (!worldMatrixBlock) {
                    worldMatrixBlock = new InputBlock("World");
                    worldMatrixBlock.setAsSystemValue(NodeMaterialSystemValues.World);
                }

                let transformBlock = new TransformBlock("World normal");
                worldNormalBlock.connectTo(transformBlock);
                worldMatrixBlock.connectTo(transformBlock);

                return transformBlock;
            }
            case "WorldTangentBlock": {
                let worldTangentBlock = nodeMaterial.getInputBlockByPredicate((b) => b.isAttribute && b.name === "tangent");
                if (!worldTangentBlock) {
                    worldTangentBlock = new InputBlock("tangent");
                    worldTangentBlock.setAsAttribute("tangent");
                }

                let worldMatrixBlock = nodeMaterial.getInputBlockByPredicate((b) => b.isSystemValue && b.systemValue === NodeMaterialSystemValues.World);

                if (!worldMatrixBlock) {
                    worldMatrixBlock = new InputBlock("World");
                    worldMatrixBlock.setAsSystemValue(NodeMaterialSystemValues.World);
                }

                let transformBlock = new TransformBlock("World tangent");
                worldTangentBlock.connectTo(transformBlock);
                worldMatrixBlock.connectTo(transformBlock);

                return transformBlock;
            }
            case "PBRMetallicRoughnessBlock":
                return new PBRMetallicRoughnessBlock("PBRMetallicRoughness");
            case "SheenBlock":
                return new SheenBlock("Sheen");
            case "AmbientOcclusionBlock":
                return new AmbientOcclusionBlock("AmbientOcclusion");
            case "ReflectivityBlock":
                return new ReflectivityBlock("Reflectivity");
            case "AnisotropyBlock":
                return new AnisotropyBlock("Anisotropy");
            case "ReflectionBlock":
                return new ReflectionBlock("Reflection");
            case "ClearCoatBlock":
                return new ClearCoatBlock("ClearCoat");
            case "RefractionBlock":
                return new RefractionBlock("Refraction");
            case "SubSurfaceBlock":
                return new SubSurfaceBlock("SubSurface");
            case "CurrentScreenBlock":
                return new CurrentScreenBlock("CurrentScreen");
            case "ParticleUVBlock": {
                let uv = new InputBlock("uv");
                uv.setAsAttribute("particle_uv");
                return uv;
            }
            case "ParticleTextureBlock":
                return new ParticleTextureBlock("ParticleTexture");
            case "ParticleColorBlock": {
                let color = new InputBlock("Color");
                color.setAsAttribute("particle_color");
                return color;
            }
            case "ParticleTextureMaskBlock": {
                let u = new InputBlock("TextureMask");
                u.setAsAttribute("particle_texturemask");
                return u;
            }
            case "ParticlePositionWorldBlock": {
                let pos = new InputBlock("PositionWorld");
                pos.setAsAttribute("particle_positionw");
                return pos;
            }
            case "ParticleRampGradientBlock":
                return new ParticleRampGradientBlock("ParticleRampGradient");
            case "ParticleBlendMultiplyBlock":
                return new ParticleBlendMultiplyBlock("ParticleBlendMultiply");
            case "FragCoordBlock":
                return new FragCoordBlock("FragCoord");
            case "ScreenSizeBlock":
                return new ScreenSizeBlock("ScreenSize");
        }

        return null;
    }

    public static GetColorFromConnectionNodeType(type: NodeMaterialBlockConnectionPointTypes) {
        let color = "#880000";
        switch (type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                color = "#cb9e27";
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