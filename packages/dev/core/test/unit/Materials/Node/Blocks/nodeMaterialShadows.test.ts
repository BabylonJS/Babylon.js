import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { PreProcess } from "core/Engines/Processors/shaderProcessor";
import { type _IProcessingOptions } from "core/Engines/Processors/shaderProcessingOptions";
import { ShaderStore } from "core/Engines/shaderStore";
import { DirectionalLight } from "core/Lights/directionalLight";
import { LightBlock } from "core/Materials/Node/Blocks/Dual/lightBlock";
import { FragmentOutputBlock } from "core/Materials/Node/Blocks/Fragment/fragmentOutputBlock";
import { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { PBRMetallicRoughnessBlock } from "core/Materials/Node/Blocks/PBR/pbrMetallicRoughnessBlock";
import { TransformBlock } from "core/Materials/Node/Blocks/transformBlock";
import { VertexOutputBlock } from "core/Materials/Node/Blocks/Vertex/vertexOutputBlock";
import { NodeMaterialSystemValues } from "core/Materials/Node/Enums/nodeMaterialSystemValues";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";

describe.each([
    ["PBRMetallicRoughnessBlock", PBRMetallicRoughnessBlock],
    ["LightBlock", LightBlock],
] as const)("%s cascaded shadows", (_name, Block) => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    describe.each([ShaderLanguage.GLSL, ShaderLanguage.WGSL])("shader language %s", (shaderLanguage) => {
        it.each([false, true])("uses the connected view matrix (explicit light: %s)", async (explicitLight) => {
            vi.spyOn(engine, "isWebGPU", "get").mockReturnValue(shaderLanguage === ShaderLanguage.WGSL);
            vi.spyOn(engine, "supportsUniformBuffers", "get").mockReturnValue(shaderLanguage === ShaderLanguage.WGSL);
            const material = new NodeMaterial("shadow receiver", scene, { shaderLanguage });
            const light = new DirectionalLight("sun", new Vector3(-1, -2, -1), scene);
            const lighting = new Block("lighting");
            if (explicitLight) {
                lighting.light = light;
            }

            const position = new InputBlock("position");
            position.setAsAttribute("position");
            const normal = new InputBlock("normal");
            normal.setAsAttribute("normal");
            const world = new InputBlock("world");
            world.setAsSystemValue(NodeMaterialSystemValues.World);
            const viewProjection = new InputBlock("viewProjection");
            viewProjection.setAsSystemValue(NodeMaterialSystemValues.ViewProjection);
            const view = new InputBlock("customCameraView");
            view.setAsSystemValue(NodeMaterialSystemValues.View);
            view.output.connectTo(lighting.view);

            const worldPosition = new TransformBlock("world position");
            position.output.connectTo(worldPosition.vector);
            world.output.connectTo(worldPosition.transform);
            worldPosition.output.connectTo(lighting.worldPosition);
            const worldNormal = new TransformBlock("world normal");
            normal.output.connectTo(worldNormal.vector);
            world.output.connectTo(worldNormal.transform);
            worldNormal.output.connectTo(lighting.worldNormal);
            const clipPosition = new TransformBlock("clip position");
            worldPosition.output.connectTo(clipPosition.vector);
            viewProjection.output.connectTo(clipPosition.transform);
            const vertexOutput = new VertexOutputBlock("vertex output");
            clipPosition.output.connectTo(vertexOutput.vector);

            const fragmentOutput = new FragmentOutputBlock("fragment output");
            if (lighting instanceof PBRMetallicRoughnessBlock) {
                const metallic = new InputBlock("metallic");
                metallic.value = 0;
                metallic.output.connectTo(lighting.metallic);
                const roughness = new InputBlock("roughness");
                roughness.value = 1;
                roughness.output.connectTo(lighting.roughness);
                lighting.lighting.connectTo(fragmentOutput.rgb);
            } else {
                lighting.diffuseOutput.connectTo(fragmentOutput.rgb);
            }

            material.addOutputNode(vertexOutput);
            material.addOutputNode(fragmentOutput);
            const built = new Promise<void>((resolve, reject) => {
                material.onBuildObservable.addOnce(() => resolve());
                material.onBuildErrorObservable.addOnce((error) => reject(new Error(error)));
            });
            material.build();
            await built;

            const options: _IProcessingOptions = {
                defines: [
                    "#define LIGHT0",
                    "#define LIGHT1",
                    "#define SHADOWS",
                    "#define SHADOWCSM0",
                    "#define SHADOWCSM1",
                    "#define SHADOWCSMNUM_CASCADES0 4",
                    "#define SHADOWCSMNUM_CASCADES1 2",
                ],
                indexParameters: { maxSimultaneousLights: material.maxSimultaneousLights },
                isFragment: false,
                shouldUseHighPrecisionShader: true,
                supportsUniformBuffers: engine.supportsUniformBuffers,
                shadersRepository: "",
                includesShadersStore: ShaderStore.GetIncludesShadersStore(shaderLanguage),
                processor: null,
                version: "300",
                platformName: shaderLanguage === ShaderLanguage.WGSL ? "WEBGPU" : "WEBGL2",
                processingContext: null,
                isNDCHalfZRange: shaderLanguage === ShaderLanguage.WGSL,
                useReverseDepthBuffer: false,
            };
            const vertexShader = material.compiledShaders.split("// Fragment shader")[0];
            let processed = "";
            PreProcess(vertexShader, options, (code) => (processed = code.replace(/\s+/g, "")), engine);

            const viewMatrix = explicitLight ? view.output.associatedVariableName : "view";
            const worldPos = explicitLight ? worldPosition.output.associatedVariableName : "worldPos";
            const cameraPositions = Array.from(processed.matchAll(/vPositionFromCamera(\d+)=[^;]+;/g), (match) => match[0]);
            expect(cameraPositions).toEqual((explicitLight ? [0] : [0, 1]).map((index) => `vPositionFromCamera${index}=${viewMatrix}*${worldPos};`));
            expect(processed).not.toContain("uniforms.view");
            const localView = `view${shaderLanguage === ShaderLanguage.WGSL ? ":mat4x4f" : ""}=${view.output.associatedVariableName};`;
            expect(processed.includes(localView)).toBe(!explicitLight);
        });
    });
});
