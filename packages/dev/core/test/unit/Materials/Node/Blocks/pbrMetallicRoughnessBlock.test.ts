import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type Engine } from "core/Engines/engine";
import { FragmentOutputBlock } from "core/Materials/Node/Blocks/Fragment/fragmentOutputBlock";
import { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { ClearCoatBlock } from "core/Materials/Node/Blocks/PBR/clearCoatBlock";
import { PBRMetallicRoughnessBlock } from "core/Materials/Node/Blocks/PBR/pbrMetallicRoughnessBlock";
import { SubSurfaceBlock } from "core/Materials/Node/Blocks/PBR/subSurfaceBlock";
import { TransformBlock } from "core/Materials/Node/Blocks/transformBlock";
import { VertexOutputBlock } from "core/Materials/Node/Blocks/Vertex/vertexOutputBlock";
import { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterialBlockTargets } from "core/Materials/Node/Enums/nodeMaterialBlockTargets";
import { NodeMaterialSystemValues } from "core/Materials/Node/Enums/nodeMaterialSystemValues";
import { NodeMaterial, NodeMaterialDefines } from "core/Materials/Node/nodeMaterial";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { CreatePlane } from "core/Meshes/Builders/planeBuilder";
import { Color3 } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
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

    it("exposes a world-space bent normal for indirect specular occlusion", () => {
        const block = new PBRMetallicRoughnessBlock("pbr");
        const bentNormal = new InputBlock("bent normal", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Vector3);
        bentNormal.output.connectTo(block.bentNormal);

        expect(block.bentNormal.isConnected).toBe(true);
        expect(block.bentNormal.name).toBe("bentNormal");
        expect(block.serialize().inputs.some((input: { name: string }) => input.name === "bentNormal")).toBe(true);
    });

    it.each([ShaderLanguage.GLSL, ShaderLanguage.WGSL])(
        "emits subsurface declarations and oriented bent normals (%s)",
        async (shaderLanguage) => {
            const nodeMaterial = new NodeMaterial("node material", scene);
            nodeMaterial.shaderLanguage = shaderLanguage;

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
            pbr.forceNormalForward = true;
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

            const bentNormal = new InputBlock("bentNormal", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Vector3);
            bentNormal.value = new Vector3(0, 1, 0);
            bentNormal.output.connectTo(pbr.bentNormal);

            const ambient = new InputBlock("ambient", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
            ambient.value = 0.5;
            ambient.output.connectTo(pbr.ambientOcc);

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
            const clusteredLightingFunctionsIndex = shaders.indexOf(
                shaderLanguage === ShaderLanguage.WGSL ? "#include<pbrDirectLightingFunctions>" : "#include<pbrClusteredLightingFunctions>"
            );

            expect(subSurfaceDeclarationIndex).toBeGreaterThanOrEqual(0);
            expect(clusteredLightingFunctionsIndex).toBeGreaterThanOrEqual(0);
            expect(subSurfaceDeclarationIndex).toBeLessThan(clusteredLightingFunctionsIndex);
            expect(shaders).toContain("bentNormalW");
            expect(shaders).toMatch(/bentNormalStrength[^;\n]*=\s*1\.0/);
            expect(shaders).toMatch(/environmentBentNormalOcclusion\(bentNormalW,\s*reflectedDirection,\s*normalW,\s*NdotVUnclamped,\s*bentAO,\s*alphaG\)/);
            // The SG lobe uses the effective alphaG, including the specular antialiasing broadening used by reflection sampling.
            const occlusionIndex = shaders.search(/environmentBentNormalOcclusion\(bentNormalW/);
            const broadeningIndex = shaders.search(/#ifdef SPECULARAA\s+(?:\/\/[^\n]*\s+)?alphaG\s*\+=\s*AARoughnessFactors\.y;/);
            expect(broadeningIndex).toBeGreaterThanOrEqual(0);
            expect(broadeningIndex).toBeLessThan(occlusionIndex);
            const alphaGAssignments = shaders.substring(broadeningIndex, occlusionIndex).match(/\balphaG\s*[-+*/]?=/g) ?? [];
            expect(alphaGAssignments.map((assignment) => assignment.replace(/\s/g, ""))).toEqual(["alphaG+="]);
            expect(shaders).toContain("#include<pbrIBLFunctions>");
            const facingIndex = shaders.search(/bentNormalW\s*\*=\s*sign\(dot\(normalW,\s*faceNormal\)\)/);
            const bentDeclarationIndex = shaders.indexOf("= normalize(" + bentNormal.output.associatedVariableName);
            expect(facingIndex).toBeGreaterThanOrEqual(0);
            expect(bentDeclarationIndex).toBeGreaterThanOrEqual(0);
            expect(bentDeclarationIndex).toBeLessThan(facingIndex);
            expect(shaders).not.toContain("fragmentInputs.input.");
            expect(shaders).not.toContain("scene.invertNormal");

            const defines = new NodeMaterialDefines();
            const mesh = CreatePlane("plane", {}, scene);
            pbr.prepareDefines(defines, nodeMaterial, mesh);
            expect(defines.toString()).toContain("#define BENTNORMAL");
            expect(defines.toString()).not.toContain("#define SPECULARAA");
            engine.getCaps().standardDerivatives = true;
            pbr.enableSpecularAntiAliasing = true;
            pbr.prepareDefines(defines, nodeMaterial, mesh);
            expect(defines.toString()).toContain("#define SPECULARAA");
            expect(defines.toString()).toContain("#define BENTNORMAL");
            pbr.enableSpecularAntiAliasing = false;
            pbr.prepareDefines(defines, nodeMaterial, mesh);
            expect(defines.toString()).not.toContain("#define SPECULARAA");
            ambient.output.disconnectFrom(pbr.ambientOcc);
            pbr.prepareDefines(defines, nodeMaterial, mesh);
            expect(defines.toString()).not.toContain("#define BENTNORMAL");
        },
        15000
    );

    it("emits clear coat reflectance constants before clear coat functions", async () => {
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

        const clearCoatIntensity = new InputBlock("clearCoatIntensity", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
        clearCoatIntensity.value = 1;

        const clearCoat = new ClearCoatBlock("clearCoat");
        clearCoatIntensity.output.connectTo(clearCoat.intensity);
        clearCoat.clearcoat.connectTo(pbr.clearcoat);

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
        const clearCoatReflectanceIndex = shaders.indexOf("#include<pbrDirectLightingFunctions>");
        const clearCoatFunctionsIndex = shaders.indexOf("fresnelIBLClearCoat");

        expect(clearCoatReflectanceIndex).toBeGreaterThanOrEqual(0);
        expect(clearCoatFunctionsIndex).toBeGreaterThanOrEqual(0);
        expect(clearCoatReflectanceIndex).toBeLessThan(clearCoatFunctionsIndex);
    });
});
