import { DiscardBlock } from "core/Materials/Node/Blocks/Fragment/discardBlock";
import { BonesBlock } from "core/Materials/Node/Blocks/Vertex/bonesBlock";
import { InstancesBlock } from "core/Materials/Node/Blocks/Vertex/instancesBlock";
import { MorphTargetsBlock } from "core/Materials/Node/Blocks/Vertex/morphTargetsBlock";
import { ImageProcessingBlock } from "core/Materials/Node/Blocks/Fragment/imageProcessingBlock";
import { ColorMergerBlock } from "core/Materials/Node/Blocks/colorMergerBlock";
import { VectorMergerBlock } from "core/Materials/Node/Blocks/vectorMergerBlock";
import { ColorSplitterBlock } from "core/Materials/Node/Blocks/colorSplitterBlock";
import { VectorSplitterBlock } from "core/Materials/Node/Blocks/vectorSplitterBlock";
import { RemapBlock } from "core/Materials/Node/Blocks/remapBlock";
import { TextureBlock } from "core/Materials/Node/Blocks/Dual/textureBlock";
import { ReflectionTextureBlock } from "core/Materials/Node/Blocks/Dual/reflectionTextureBlock";
import { LightBlock } from "core/Materials/Node/Blocks/Dual/lightBlock";
import { FogBlock } from "core/Materials/Node/Blocks/Dual/fogBlock";
import { VertexOutputBlock } from "core/Materials/Node/Blocks/Vertex/vertexOutputBlock";
import { FragmentOutputBlock } from "core/Materials/Node/Blocks/Fragment/fragmentOutputBlock";
import { PrePassOutputBlock } from "core/Materials/Node/Blocks/Fragment/prePassOutputBlock";
import { NormalizeBlock } from "core/Materials/Node/Blocks/normalizeBlock";
import { AddBlock } from "core/Materials/Node/Blocks/addBlock";
import { ModBlock } from "core/Materials/Node/Blocks/modBlock";
import { ScaleBlock } from "core/Materials/Node/Blocks/scaleBlock";
import { TrigonometryBlock, TrigonometryBlockOperations } from "core/Materials/Node/Blocks/trigonometryBlock";
import { ConditionalBlockConditions, ConditionalBlock } from "core/Materials/Node/Blocks/conditionalBlock";
import { ClampBlock } from "core/Materials/Node/Blocks/clampBlock";
import { CrossBlock } from "core/Materials/Node/Blocks/crossBlock";
import { DotBlock } from "core/Materials/Node/Blocks/dotBlock";
import { MultiplyBlock } from "core/Materials/Node/Blocks/multiplyBlock";
import { TransformBlock } from "core/Materials/Node/Blocks/transformBlock";
import { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { FresnelBlock } from "core/Materials/Node/Blocks/fresnelBlock";
import { LerpBlock } from "core/Materials/Node/Blocks/lerpBlock";
import { NLerpBlock } from "core/Materials/Node/Blocks/nLerpBlock";
import { DivideBlock } from "core/Materials/Node/Blocks/divideBlock";
import { SubtractBlock } from "core/Materials/Node/Blocks/subtractBlock";
import { StepBlock } from "core/Materials/Node/Blocks/stepBlock";
import { SmoothStepBlock } from "core/Materials/Node/Blocks/smoothStepBlock";
import { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { NodeMaterialSystemValues } from "core/Materials/Node/Enums/nodeMaterialSystemValues";
import { AnimatedInputBlockTypes } from "core/Materials/Node/Blocks/Input/animatedInputBlockTypes";
import { OneMinusBlock } from "core/Materials/Node/Blocks/oneMinusBlock";
import { ViewDirectionBlock } from "core/Materials/Node/Blocks/viewDirectionBlock";
import { LightInformationBlock } from "core/Materials/Node/Blocks/Vertex/lightInformationBlock";
import { MaxBlock } from "core/Materials/Node/Blocks/maxBlock";
import { MinBlock } from "core/Materials/Node/Blocks/minBlock";
import { PerturbNormalBlock } from "core/Materials/Node/Blocks/Fragment/perturbNormalBlock";
import { TBNBlock } from "core/Materials/Node/Blocks/Fragment/TBNBlock";
import { LengthBlock } from "core/Materials/Node/Blocks/lengthBlock";
import { DistanceBlock } from "core/Materials/Node/Blocks/distanceBlock";
import { FrontFacingBlock } from "core/Materials/Node/Blocks/Fragment/frontFacingBlock";
import { MeshAttributeExistsBlock } from "core/Materials/Node/Blocks/meshAttributeExistsBlock";
import { NegateBlock } from "core/Materials/Node/Blocks/negateBlock";
import { PowBlock } from "core/Materials/Node/Blocks/powBlock";
import type { Scene } from "core/scene";
import { RandomNumberBlock } from "core/Materials/Node/Blocks/randomNumberBlock";
import { ReplaceColorBlock } from "core/Materials/Node/Blocks/replaceColorBlock";
import { PosterizeBlock } from "core/Materials/Node/Blocks/posterizeBlock";
import { ArcTan2Block } from "core/Materials/Node/Blocks/arcTan2Block";
import { ReciprocalBlock } from "core/Materials/Node/Blocks/reciprocalBlock";
import { GradientBlock } from "core/Materials/Node/Blocks/gradientBlock";
import { WaveBlock, WaveBlockKind } from "core/Materials/Node/Blocks/waveBlock";
import type { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { WorleyNoise3DBlock } from "core/Materials/Node/Blocks/worleyNoise3DBlock";
import { SimplexPerlin3DBlock } from "core/Materials/Node/Blocks/simplexPerlin3DBlock";
import { NormalBlendBlock } from "core/Materials/Node/Blocks/normalBlendBlock";
import { Rotate2dBlock } from "core/Materials/Node/Blocks/rotate2dBlock";
import { DerivativeBlock } from "core/Materials/Node/Blocks/Fragment/derivativeBlock";
import { RefractBlock } from "core/Materials/Node/Blocks/refractBlock";
import { ReflectBlock } from "core/Materials/Node/Blocks/reflectBlock";
import { DesaturateBlock } from "core/Materials/Node/Blocks/desaturateBlock";
import { PBRMetallicRoughnessBlock } from "core/Materials/Node/Blocks/PBR/pbrMetallicRoughnessBlock";
import { SheenBlock } from "core/Materials/Node/Blocks/PBR/sheenBlock";
import { AnisotropyBlock } from "core/Materials/Node/Blocks/PBR/anisotropyBlock";
import { ReflectionBlock } from "core/Materials/Node/Blocks/PBR/reflectionBlock";
import { ClearCoatBlock } from "core/Materials/Node/Blocks/PBR/clearCoatBlock";
import { RefractionBlock } from "core/Materials/Node/Blocks/PBR/refractionBlock";
import { SubSurfaceBlock } from "core/Materials/Node/Blocks/PBR/subSurfaceBlock";
import { CurrentScreenBlock } from "core/Materials/Node/Blocks/Dual/currentScreenBlock";
import { ParticleTextureBlock } from "core/Materials/Node/Blocks/Particle/particleTextureBlock";
import { ParticleRampGradientBlock } from "core/Materials/Node/Blocks/Particle/particleRampGradientBlock";
import { ParticleBlendMultiplyBlock } from "core/Materials/Node/Blocks/Particle/particleBlendMultiplyBlock";
import { GaussianSplattingBlock } from "core/Materials/Node/Blocks/GaussianSplatting/gaussianSplattingBlock";
import { GaussianBlock } from "core/Materials/Node/Blocks/GaussianSplatting/gaussianBlock";
import { SplatReaderBlock } from "core/Materials/Node/Blocks/GaussianSplatting/splatReaderBlock";
import { NodeMaterialModes } from "core/Materials/Node/Enums/nodeMaterialModes";
import { FragCoordBlock } from "core/Materials/Node/Blocks/Fragment/fragCoordBlock";
import { ScreenSizeBlock } from "core/Materials/Node/Blocks/Fragment/screenSizeBlock";
import { MatrixBuilderBlock } from "core/Materials/Node/Blocks/matrixBuilderBlock";
import { SceneDepthBlock } from "core/Materials/Node/Blocks/Dual/sceneDepthBlock";
import { ImageSourceBlock } from "core/Materials/Node/Blocks/Dual/imageSourceBlock";
import { CloudBlock } from "core/Materials/Node/Blocks/cloudBlock";
import { VoronoiNoiseBlock } from "core/Materials/Node/Blocks/voronoiNoiseBlock";
import { ScreenSpaceBlock } from "core/Materials/Node/Blocks/Fragment/screenSpaceBlock";
import { HeightToNormalBlock } from "core/Materials/Node/Blocks/Fragment/heightToNormalBlock";
import { TwirlBlock } from "core/Materials/Node/Blocks/Fragment/twirlBlock";
import { ElbowBlock } from "core/Materials/Node/Blocks/elbowBlock";
import { ClipPlanesBlock } from "core/Materials/Node/Blocks/Dual/clipPlanesBlock";
import { FragDepthBlock } from "core/Materials/Node/Blocks/Fragment/fragDepthBlock";
import { ShadowMapBlock } from "core/Materials/Node/Blocks/Fragment/shadowMapBlock";
import { TriPlanarBlock } from "core/Materials/Node/Blocks/triPlanarBlock";
import { BiPlanarBlock } from "core/Materials/Node/Blocks/biPlanarBlock";
import { MatrixDeterminantBlock } from "core/Materials/Node/Blocks/matrixDeterminantBlock";
import { MatrixTransposeBlock } from "core/Materials/Node/Blocks/matrixTransposeBlock";
import { CurveBlock } from "core/Materials/Node/Blocks/curveBlock";
import { PrePassTextureBlock } from "core/Materials/Node/Blocks/Input/prePassTextureBlock";
import { NodeMaterialTeleportInBlock } from "core/Materials/Node/Blocks/Teleport/teleportInBlock";
import { NodeMaterialTeleportOutBlock } from "core/Materials/Node/Blocks/Teleport/teleportOutBlock";
import { ColorConverterBlock } from "core/Materials/Node/Blocks/colorConverterBlock";
import { LoopBlock } from "core/Materials/Node/Blocks/loopBlock";
import { StorageReadBlock } from "core/Materials/Node/Blocks/storageReadBlock";
import { StorageWriteBlock } from "core/Materials/Node/Blocks/storageWriteBlock";
import { MatrixSplitterBlock } from "core/Materials/Node/Blocks/matrixSplitterBlock";
import { NodeMaterialDebugBlock } from "core/Materials/Node/Blocks/debugBlock";
import { IridescenceBlock } from "core/Materials/Node/Blocks/PBR/iridescenceBlock";

export class BlockTools {
    public static GetBlockFromString(data: string, scene: Scene, nodeMaterial: NodeMaterial) {
        switch (data) {
            case "DebugBlock":
                return new NodeMaterialDebugBlock("Debug");
            case "MatrixSplitterBlock":
                return new MatrixSplitterBlock("Matrix Splitter");
            case "StorageWriteBlock":
                return new StorageWriteBlock("StorageWrite");
            case "StorageReadBlock":
                return new StorageReadBlock("StorageRead");
            case "LoopBlock":
                return new LoopBlock("Loop");
            case "ColorConverterBlock":
                return new ColorConverterBlock("ColorConverter");
            case "TeleportInBlock":
                return new NodeMaterialTeleportInBlock("Teleport In");
            case "TeleportOutBlock":
                return new NodeMaterialTeleportOutBlock("Teleport Out");
            case "HeightToNormalBlock":
                return new HeightToNormalBlock("HeightToNormal");
            case "ElbowBlock":
                return new ElbowBlock("");
            case "TwirlBlock":
                return new TwirlBlock("Twirl");
            case "VoronoiNoiseBlock":
                return new VoronoiNoiseBlock("VoronoiNoise");
            case "ScreenSpaceBlock":
                return new ScreenSpaceBlock("ScreenSpace");
            case "CloudBlock":
                return new CloudBlock("Cloud");
            case "MatrixBuilderBlock":
                return new MatrixBuilderBlock("MatrixBuilder");
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
            case "PrePassTextureBlock":
                return new PrePassTextureBlock("PrePassTexture");
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
            case "PrePassOutputBlock":
                return new PrePassOutputBlock("PrePassOutput");
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
            case "LightInformationBlock": {
                const lightInformationBlock = new LightInformationBlock("Light information");
                lightInformationBlock.light = scene.lights.length ? scene.lights[0] : null;
                return lightInformationBlock;
            }
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
            case "TBNBlock":
                return new TBNBlock("TBN");
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
            case "MeshAttributeExistsBlock":
                return new MeshAttributeExistsBlock("Attribute exists");
            case "CosBlock": {
                const cosBlock = new TrigonometryBlock("Cos");
                cosBlock.operation = TrigonometryBlockOperations.Cos;
                return cosBlock;
            }
            case "SinBlock": {
                const sinBlock = new TrigonometryBlock("Sin");
                sinBlock.operation = TrigonometryBlockOperations.Sin;
                return sinBlock;
            }
            case "AbsBlock": {
                const absBlock = new TrigonometryBlock("Abs");
                absBlock.operation = TrigonometryBlockOperations.Abs;
                return absBlock;
            }
            case "SqrtBlock": {
                const sqrtBlock = new TrigonometryBlock("Sqrt");
                sqrtBlock.operation = TrigonometryBlockOperations.Sqrt;
                return sqrtBlock;
            }
            case "ArcCosBlock": {
                const acosBlock = new TrigonometryBlock("ArcCos");
                acosBlock.operation = TrigonometryBlockOperations.ArcCos;
                return acosBlock;
            }
            case "ArcSinBlock": {
                const asinBlock = new TrigonometryBlock("ArcSin");
                asinBlock.operation = TrigonometryBlockOperations.ArcSin;
                return asinBlock;
            }
            case "TanBlock": {
                const tanBlock = new TrigonometryBlock("Tan");
                tanBlock.operation = TrigonometryBlockOperations.Tan;
                return tanBlock;
            }
            case "ArcTanBlock": {
                const atanBlock = new TrigonometryBlock("ArcTan");
                atanBlock.operation = TrigonometryBlockOperations.ArcTan;
                return atanBlock;
            }
            case "FractBlock": {
                const fractBlock = new TrigonometryBlock("Fract");
                fractBlock.operation = TrigonometryBlockOperations.Fract;
                return fractBlock;
            }
            case "SignBlock": {
                const signBlock = new TrigonometryBlock("Sign");
                signBlock.operation = TrigonometryBlockOperations.Sign;
                return signBlock;
            }
            case "LogBlock": {
                const logBlock = new TrigonometryBlock("Log");
                logBlock.operation = TrigonometryBlockOperations.Log;
                return logBlock;
            }
            case "ExpBlock": {
                const expBlock = new TrigonometryBlock("Exp");
                expBlock.operation = TrigonometryBlockOperations.Exp;
                return expBlock;
            }
            case "Exp2Block": {
                const exp2Block = new TrigonometryBlock("Exp2");
                exp2Block.operation = TrigonometryBlockOperations.Exp2;
                return exp2Block;
            }
            case "DegreesToRadiansBlock": {
                const degreesToRadiansBlock = new TrigonometryBlock("Degrees to radians");
                degreesToRadiansBlock.operation = TrigonometryBlockOperations.Radians;
                return degreesToRadiansBlock;
            }
            case "RadiansToDegreesBlock": {
                const radiansToDegreesBlock = new TrigonometryBlock("Radians to degrees");
                radiansToDegreesBlock.operation = TrigonometryBlockOperations.Degrees;
                return radiansToDegreesBlock;
            }
            case "RoundBlock": {
                const roundBlock = new TrigonometryBlock("Round");
                roundBlock.operation = TrigonometryBlockOperations.Round;
                return roundBlock;
            }
            case "CeilingBlock": {
                const ceilingBlock = new TrigonometryBlock("Ceiling");
                ceilingBlock.operation = TrigonometryBlockOperations.Ceiling;
                return ceilingBlock;
            }
            case "FloorBlock": {
                const floorBlock = new TrigonometryBlock("Floor");
                floorBlock.operation = TrigonometryBlockOperations.Floor;
                return floorBlock;
            }
            case "SawToothWaveBlock": {
                const sawToothWaveBlock = new WaveBlock("SawTooth wave");
                sawToothWaveBlock.kind = WaveBlockKind.SawTooth;
                return sawToothWaveBlock;
            }
            case "SquareWaveBlock": {
                const squareWaveBlock = new WaveBlock("Square wave");
                squareWaveBlock.kind = WaveBlockKind.Square;
                return squareWaveBlock;
            }
            case "TriangleWaveBlock": {
                const triangleWaveBlock = new WaveBlock("Triangle wave");
                triangleWaveBlock.kind = WaveBlockKind.Triangle;
                return triangleWaveBlock;
            }
            case "SetBlock": {
                const cosBlock = new TrigonometryBlock("Set");
                cosBlock.operation = TrigonometryBlockOperations.Set;
                return cosBlock;
            }
            case "WorldMatrixBlock": {
                const worldMatrixBlock = new InputBlock("World");
                worldMatrixBlock.setAsSystemValue(NodeMaterialSystemValues.World);
                return worldMatrixBlock;
            }
            case "WorldViewMatrixBlock": {
                const worldViewMatrixBlock = new InputBlock("World x View");
                worldViewMatrixBlock.setAsSystemValue(NodeMaterialSystemValues.WorldView);
                return worldViewMatrixBlock;
            }
            case "WorldViewProjectionMatrixBlock": {
                const worldViewProjectionMatrixBlock = new InputBlock("World x View x Projection");
                worldViewProjectionMatrixBlock.setAsSystemValue(NodeMaterialSystemValues.WorldViewProjection);
                return worldViewProjectionMatrixBlock;
            }
            case "ViewMatrixBlock": {
                const viewMatrixBlock = new InputBlock("View");
                viewMatrixBlock.setAsSystemValue(NodeMaterialSystemValues.View);
                return viewMatrixBlock;
            }
            case "ViewProjectionMatrixBlock": {
                const viewProjectionMatrixBlock = new InputBlock("View x Projection");
                viewProjectionMatrixBlock.setAsSystemValue(NodeMaterialSystemValues.ViewProjection);
                return viewProjectionMatrixBlock;
            }
            case "ProjectionMatrixBlock": {
                const projectionMatrixBlock = new InputBlock("Projection");
                projectionMatrixBlock.setAsSystemValue(NodeMaterialSystemValues.Projection);
                return projectionMatrixBlock;
            }
            case "CameraPositionBlock": {
                const cameraPosition = new InputBlock("Camera position");
                cameraPosition.setAsSystemValue(NodeMaterialSystemValues.CameraPosition);
                return cameraPosition;
            }
            case "CameraParametersBlock": {
                const cameraParameters = new InputBlock("Camera parameters");
                cameraParameters.setAsSystemValue(NodeMaterialSystemValues.CameraParameters);

                const splitter = new VectorSplitterBlock("Vector splitter");
                cameraParameters.connectTo(splitter);
                return splitter;
            }
            case "FogColorBlock": {
                const fogColor = new InputBlock("Fog color");
                fogColor.setAsSystemValue(NodeMaterialSystemValues.FogColor);
                return fogColor;
            }
            case "PositionBlock": {
                const meshPosition = new InputBlock("position");
                meshPosition.setAsAttribute("position");
                return meshPosition;
            }
            case "ScreenPositionBlock": {
                const meshPosition = new InputBlock("position");
                meshPosition.setAsAttribute("position2d");
                return meshPosition;
            }
            case "UVBlock": {
                const meshUV = new InputBlock("uv");
                meshUV.setAsAttribute("uv");
                return meshUV;
            }
            case "ColorBlock": {
                const meshColor = new InputBlock("color");
                meshColor.setAsAttribute("color");
                return meshColor;
            }
            case "InstanceColorBlock": {
                const meshColor = new InputBlock("Instance Color");
                meshColor.setAsAttribute("instanceColor");
                return meshColor;
            }
            case "SplatIndexBlock": {
                const splatIndex = new InputBlock("SplatIndex");
                splatIndex.setAsAttribute("splatIndex");
                return splatIndex;
            }
            case "NormalBlock": {
                const meshNormal = new InputBlock("normal");
                meshNormal.setAsAttribute("normal");
                return meshNormal;
            }
            case "TangentBlock": {
                const meshTangent = new InputBlock("tangent");
                meshTangent.setAsAttribute("tangent");
                return meshTangent;
            }
            case "MatrixIndicesBlock": {
                const meshMatrixIndices = new InputBlock("matricesIndices");
                meshMatrixIndices.setAsAttribute("matricesIndices");
                return meshMatrixIndices;
            }
            case "MatrixWeightsBlock": {
                const meshMatrixWeights = new InputBlock("matricesWeights");
                meshMatrixWeights.setAsAttribute("matricesWeights");
                return meshMatrixWeights;
            }
            case "MatrixIndicesExtraBlock": {
                const meshMatrixIndices = new InputBlock("matricesIndicesExtra");
                meshMatrixIndices.setAsAttribute("matricesIndicesExtra");
                return meshMatrixIndices;
            }
            case "MatrixWeightsExtraBlock": {
                const meshMatrixWeights = new InputBlock("matricesWeightsExtra");
                meshMatrixWeights.setAsAttribute("matricesWeightsExtra");
                return meshMatrixWeights;
            }

            case "MouseInfoBlock": {
                const mouseInfoBlock = new InputBlock("MouseInfo", undefined, NodeMaterialBlockConnectionPointTypes.Vector4);
                mouseInfoBlock.animationType = AnimatedInputBlockTypes.MouseInfo;
                return mouseInfoBlock;
            }
            case "TimeBlock": {
                const timeBlock = new InputBlock("Time", undefined, NodeMaterialBlockConnectionPointTypes.Float);
                timeBlock.animationType = AnimatedInputBlockTypes.Time;
                return timeBlock;
            }
            case "RealTimeBlock": {
                const realTimeBlock = new InputBlock("RealTime", undefined, NodeMaterialBlockConnectionPointTypes.Float);
                realTimeBlock.animationType = AnimatedInputBlockTypes.RealTime;
                return realTimeBlock;
            }
            case "DeltaTimeBlock": {
                const deltaTimeBlock = new InputBlock("Delta time");
                deltaTimeBlock.setAsSystemValue(NodeMaterialSystemValues.DeltaTime);
                return deltaTimeBlock;
            }
            case "MaterialAlphaBlock": {
                const deltaTimeBlock = new InputBlock("Material alpha");
                deltaTimeBlock.setAsSystemValue(NodeMaterialSystemValues.MaterialAlpha);
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

                const transformBlock = new TransformBlock("World position");
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

                const transformBlock = new TransformBlock("World normal");
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

                const transformBlock = new TransformBlock("World tangent");
                worldTangentBlock.connectTo(transformBlock);
                worldMatrixBlock.connectTo(transformBlock);

                return transformBlock;
            }
            case "PBRMetallicRoughnessBlock":
                return new PBRMetallicRoughnessBlock("PBRMetallicRoughness");
            case "SheenBlock":
                return new SheenBlock("Sheen");
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
            case "IridescenceBlock":
                return new IridescenceBlock("Iridescence");
            case "CurrentScreenBlock":
                return new CurrentScreenBlock("CurrentScreen");
            case "ParticleUVBlock": {
                const uv = new InputBlock("uv");
                uv.setAsAttribute("particle_uv");
                return uv;
            }
            case "ParticleTextureBlock":
                return new ParticleTextureBlock("ParticleTexture");
            case "ParticleColorBlock": {
                const color = new InputBlock("Color");
                color.setAsAttribute("particle_color");
                return color;
            }
            case "ParticleTextureMaskBlock": {
                const u = new InputBlock("TextureMask");
                u.setAsAttribute("particle_texturemask");
                return u;
            }
            case "ParticlePositionWorldBlock": {
                const pos = new InputBlock("PositionWorld");
                pos.setAsAttribute("particle_positionw");
                return pos;
            }
            case "ScreenUVBlock": {
                const uv = new InputBlock("uv");
                uv.setAsAttribute("postprocess_uv");
                return uv;
            }
            case "ParticleRampGradientBlock":
                return new ParticleRampGradientBlock("ParticleRampGradient");
            case "ParticleBlendMultiplyBlock":
                return new ParticleBlendMultiplyBlock("ParticleBlendMultiply");
            case "FragCoordBlock":
                return new FragCoordBlock("FragCoord");
            case "ScreenSizeBlock":
                return new ScreenSizeBlock("ScreenSize");
            case "SceneDepthBlock":
                return new SceneDepthBlock("SceneDepth");
            case "EqualBlock": {
                const equalBlock = new ConditionalBlock("Equal");
                equalBlock.condition = ConditionalBlockConditions.Equal;
                return equalBlock;
            }
            case "NotEqualBlock": {
                const notEqualBlock = new ConditionalBlock("NotEqual");
                notEqualBlock.condition = ConditionalBlockConditions.NotEqual;
                return notEqualBlock;
            }
            case "LessThanBlock": {
                const lessThanBlock = new ConditionalBlock("LessThan");
                lessThanBlock.condition = ConditionalBlockConditions.LessThan;
                return lessThanBlock;
            }
            case "LessOrEqualBlock": {
                const lessOrEqualBlock = new ConditionalBlock("LessOrEqual");
                lessOrEqualBlock.condition = ConditionalBlockConditions.LessOrEqual;
                return lessOrEqualBlock;
            }
            case "GreaterThanBlock": {
                const greaterThanBlock = new ConditionalBlock("GreaterThan");
                greaterThanBlock.condition = ConditionalBlockConditions.GreaterThan;
                return greaterThanBlock;
            }
            case "GreaterOrEqualBlock": {
                const greaterOrEqualBlock = new ConditionalBlock("GreaterOrEqual");
                greaterOrEqualBlock.condition = ConditionalBlockConditions.GreaterOrEqual;
                return greaterOrEqualBlock;
            }
            case "XorBlock": {
                const xorBlock = new ConditionalBlock("Xor");
                xorBlock.condition = ConditionalBlockConditions.Xor;
                return xorBlock;
            }
            case "OrBlock": {
                const orBlock = new ConditionalBlock("Or");
                orBlock.condition = ConditionalBlockConditions.Or;
                return orBlock;
            }
            case "AndBlock": {
                const andBlock = new ConditionalBlock("And");
                andBlock.condition = ConditionalBlockConditions.And;
                return andBlock;
            }
            case "ImageSourceBlock":
                return new ImageSourceBlock("ImageSource");
            case "ClipPlanesBlock":
                return new ClipPlanesBlock("ClipPlanes");
            case "FragDepthBlock":
                return new FragDepthBlock("FragDepth");
            case "ShadowMapBlock":
                return new ShadowMapBlock("ShadowMap");
            case "TriPlanarBlock":
                return new TriPlanarBlock("TriPlanarTexture");
            case "BiPlanarBlock":
                return new BiPlanarBlock("BiPlanarTexture");
            case "MatrixTransposeBlock":
                return new MatrixTransposeBlock("Transpose");
            case "MatrixDeterminantBlock":
                return new MatrixDeterminantBlock("Determinant");
            case "CurveBlock":
                return new CurveBlock("Curve");
            case "GaussianSplattingBlock":
                return new GaussianSplattingBlock("GaussianSplatting");
            case "GaussianBlock":
                return new GaussianBlock("Gaussian");
            case "SplatReaderBlock":
                return new SplatReaderBlock("SplatReader");
        }

        return null;
    }

    public static GetColorFromConnectionNodeType(type: NodeMaterialBlockConnectionPointTypes) {
        let color = "#964848";
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
            case NodeMaterialBlockConnectionPointTypes.Object:
                color = "#6174FA";
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
        switch (type) {
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
