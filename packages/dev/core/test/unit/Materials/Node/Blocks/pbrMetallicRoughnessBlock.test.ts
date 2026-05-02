import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type Engine } from "core/Engines/engine";
import {
    FragmentOutputBlock,
    InputBlock,
    NodeMaterial,
    NodeMaterialBlockConnectionPointTypes,
    NodeMaterialBlockTargets,
    NodeMaterialSystemValues,
    PBRMetallicRoughnessBlock,
    SubSurfaceBlock,
    TransformBlock,
    VertexOutputBlock,
} from "core/Materials";
import { Color3 } from "core/Maths/math.color";
import { Scene } from "core/scene";

describe("PBRMetallicRoughnessBlock", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        engine.dispose();
    });

    it("emits subsurface declarations before clustered lighting functions", async () => {
        const nodeMaterial = new NodeMaterial("node material", scene);

        const position = new InputBlock("position");
        position.setAsAttribute("position");

        const normal = new InputBlock("normal");
        normal.setAsAttribute("normal");

        const world = new InputBlock("world");
        world.setAsSystemValue(NodeMaterialSystemValues.World);

        const viewProjection = new InputBlock("viewProjection");
        viewProjection.setAsSystemValue(NodeMaterialSystemValues.ViewProjection);

        const worldPosition = new TransformBlock("worldPosition");
        position.output.connectTo(worldPosition.vector);
        world.output.connectTo(worldPosition.transform);

        const clipPosition = new TransformBlock("clipPosition");
        worldPosition.output.connectTo(clipPosition.vector);
        viewProjection.output.connectTo(clipPosition.transform);

        const worldNormal = new TransformBlock("worldNormal");
        normal.output.connectTo(worldNormal.vector);
        world.output.connectTo(worldNormal.transform);

        const vertexOutput = new VertexOutputBlock("vertexOutput");
        clipPosition.output.connectTo(vertexOutput.vector);

        const pbr = new PBRMetallicRoughnessBlock("pbr");
        worldPosition.output.connectTo(pbr.worldPosition);
        worldNormal.output.connectTo(pbr.worldNormal);

        const baseColor = new InputBlock("baseColor", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Color3);
        baseColor.value = new Color3(1, 0.7, 0.4);
        baseColor.output.connectTo(pbr.baseColor);

        const metallic = new InputBlock("metallic", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
        metallic.value = 0;
        metallic.output.connectTo(pbr.metallic);

        const roughness = new InputBlock("roughness", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
        roughness.value = 0.5;
        roughness.output.connectTo(pbr.roughness);

        const translucencyIntensity = new InputBlock("translucencyIntensity", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
        translucencyIntensity.value = 1;

        const subSurface = new SubSurfaceBlock("subSurface");
        translucencyIntensity.output.connectTo(subSurface.translucencyIntensity);
        subSurface.subsurface.connectTo(pbr.subsurface);

        const fragmentOutput = new FragmentOutputBlock("fragmentOutput");
        pbr.lighting.connectTo(fragmentOutput.rgb);
        pbr.alpha.connectTo(fragmentOutput.a);

        nodeMaterial.addOutputNode(vertexOutput);
        nodeMaterial.addOutputNode(fragmentOutput);

        const buildPromise = new Promise<void>((resolve, reject) => {
            nodeMaterial.onBuildObservable.addOnce(() => resolve());
            nodeMaterial.onBuildErrorObservable.addOnce((error) => reject(new Error(error)));
        });
        nodeMaterial.build();
        await buildPromise;

        const shaders = nodeMaterial.compiledShaders;
        const subSurfaceDeclarationIndex = shaders.indexOf("struct subSurfaceOutParams");
        const clusteredLightingFunctionsIndex = shaders.indexOf("#include<pbrClusteredLightingFunctions>");

        expect(subSurfaceDeclarationIndex).toBeGreaterThanOrEqual(0);
        expect(clusteredLightingFunctionsIndex).toBeGreaterThanOrEqual(0);
        expect(subSurfaceDeclarationIndex).toBeLessThan(clusteredLightingFunctionsIndex);
    });
});
