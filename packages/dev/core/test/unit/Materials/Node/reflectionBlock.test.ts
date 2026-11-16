import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { NodeMaterialSystemValues } from "core/Materials/Node/Enums/nodeMaterialSystemValues";
import { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { TransformBlock } from "core/Materials/Node/Blocks/transformBlock";
import { VertexOutputBlock } from "core/Materials/Node/Blocks/Vertex/vertexOutputBlock";
import { FragmentOutputBlock } from "core/Materials/Node/Blocks/Fragment/fragmentOutputBlock";
import { PBRMetallicRoughnessBlock } from "core/Materials/Node/Blocks/PBR/pbrMetallicRoughnessBlock";
import { ReflectionBlock } from "core/Materials/Node/Blocks/PBR/reflectionBlock";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { Scene } from "core/scene";

describe("ReflectionBlock fragment irradiance", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it.each([
        ["WGSL", ShaderLanguage.WGSL, "uniforms."],
        ["GLSL", ShaderLanguage.GLSL, ""],
    ] as const)("uses the correct matrix uniform in %s", async (_name, shaderLanguage, prefix) => {
        vi.spyOn(engine, "isWebGPU", "get").mockReturnValue(shaderLanguage === ShaderLanguage.WGSL);
        scene.environmentTexture = new CubeTexture("", scene);
        const material = new NodeMaterial("reflection", scene, { shaderLanguage });
        const position = new InputBlock("position").setAsAttribute("position");
        const normal = new InputBlock("normal").setAsAttribute("normal");
        const world = new InputBlock("world").setAsSystemValue(NodeMaterialSystemValues.World);
        const viewProjection = new InputBlock("viewProjection").setAsSystemValue(NodeMaterialSystemValues.ViewProjection);
        const view = new InputBlock("view").setAsSystemValue(NodeMaterialSystemValues.View);
        const cameraPosition = new InputBlock("cameraPosition").setAsSystemValue(NodeMaterialSystemValues.CameraPosition);

        const worldPosition = new TransformBlock("worldPosition");
        position.output.connectTo(worldPosition.vector);
        world.output.connectTo(worldPosition.transform);
        const worldNormal = new TransformBlock("worldNormal");
        worldNormal.complementW = 0;
        normal.output.connectTo(worldNormal.vector);
        world.output.connectTo(worldNormal.transform);
        const clipPosition = new TransformBlock("clipPosition");
        worldPosition.output.connectTo(clipPosition.vector);
        viewProjection.output.connectTo(clipPosition.transform);
        const vertexOutput = new VertexOutputBlock("vertexOutput");
        clipPosition.output.connectTo(vertexOutput.vector);

        const reflection = new ReflectionBlock("reflection");
        reflection.forceIrradianceInFragment = true;
        position.output.connectTo(reflection.position);
        world.output.connectTo(reflection.world);

        const pbr = new PBRMetallicRoughnessBlock("pbr");
        worldPosition.output.connectTo(pbr.worldPosition);
        worldNormal.output.connectTo(pbr.worldNormal);
        view.output.connectTo(pbr.view);
        cameraPosition.output.connectTo(pbr.cameraPosition);
        const metallic = new InputBlock("metallic");
        metallic.value = 0;
        metallic.output.connectTo(pbr.metallic);
        const roughness = new InputBlock("roughness");
        roughness.value = 0.5;
        roughness.output.connectTo(pbr.roughness);
        reflection.reflection.connectTo(pbr.reflection);
        const fragmentOutput = new FragmentOutputBlock("fragmentOutput");
        pbr.lighting.connectTo(fragmentOutput.rgb);
        material.addOutputNode(vertexOutput);
        material.addOutputNode(fragmentOutput);

        const built = new Promise<void>((resolve, reject) => {
            material.onBuildObservable.addOnce(() => resolve());
            material.onBuildErrorObservable.addOnce((error) => reject(new Error(error)));
        });
        material.build();
        await built;

        const reflectionCall = material.compiledShaders.match(/reflectionOut = reflectionBlock\([\s\S]*?\);/)?.[0];
        expect(reflectionCall).toBeDefined();
        expect(reflectionCall).toContain(`, ${prefix}${reflection._reflectionMatrixName}\n`);
        if (shaderLanguage === ShaderLanguage.WGSL) {
            expect(reflectionCall).not.toContain(`, ${reflection._reflectionMatrixName}\n`);
        }
    });
});
