import { NullEngine } from "core/Engines/nullEngine";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { TransformBlock } from "core/Materials/Node/Blocks/transformBlock";
import { VertexOutputBlock } from "core/Materials/Node/Blocks/Vertex/vertexOutputBlock";
import { FragmentOutputBlock } from "core/Materials/Node/Blocks/Fragment/fragmentOutputBlock";
import { ImageProcessingBlock } from "core/Materials/Node/Blocks/Fragment/imageProcessingBlock";
import { NodeMaterialSystemValues } from "core/Materials/Node/Enums/nodeMaterialSystemValues";
import { ImageProcessingConfiguration } from "core/Materials/imageProcessingConfiguration";
import { Color4 } from "core/Maths/math.color";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const _getActiveImageProcessingObserverCount = (scene: Scene): number => {
    return scene.imageProcessingConfiguration.onUpdateParameters.observers.filter((observer) => !observer._willBeUnregistered).length;
};

describe("Babylon NodeMaterial image processing observer lifecycle", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });

        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("does not accumulate scene image processing observers when parsing serialized node materials", () => {
        const template = new NodeMaterial("template", scene);
        const serialized = template.serialize();
        template.dispose();

        const initialObserverCount = _getActiveImageProcessingObserverCount(scene);

        for (let i = 0; i < 25; i++) {
            const material = new NodeMaterial(`nodeMaterial_${i}`, scene);
            material.parseSerializedObject(serialized);
            material.dispose();
        }

        const finalObserverCount = _getActiveImageProcessingObserverCount(scene);

        expect(finalObserverCount).toBe(initialObserverCount);
    });

    it("does not accumulate observers when serialized image processing payload is omitted", () => {
        const template = new NodeMaterial("template", scene);
        const serialized = template.serialize();
        template.dispose();

        // This approximates the no-invocation behavior where image processing metadata
        // is not part of the serialized property store.
        expect(serialized._imageProcessingConfiguration).toBeDefined();
        delete serialized._imageProcessingConfiguration;

        const initialObserverCount = _getActiveImageProcessingObserverCount(scene);

        for (let i = 0; i < 25; i++) {
            const material = new NodeMaterial(`nodeMaterial_noIpc_${i}`, scene);
            material.parseSerializedObject(serialized);
            material.dispose();
        }

        const finalObserverCount = _getActiveImageProcessingObserverCount(scene);

        expect(finalObserverCount).toBe(initialObserverCount);
    });
});

describe("Babylon NodeMaterial image processing configuration parsing", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });

        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("keeps the scene configuration when the serialized image processing configuration only holds default values", () => {
        // A default Node Material never customizes image processing, so its serialized configuration
        // only holds default values. Restoring it as a private configuration would detach the material
        // from the scene configuration and break the applyByPostProcess coordination used by the HDR
        // DefaultRenderingPipeline (leading to image processing being applied twice).
        const template = new NodeMaterial("template", scene);
        const serialized = template.serialize();
        template.dispose();

        expect(serialized._imageProcessingConfiguration).toBeDefined();

        const material = new NodeMaterial("nodeMaterial", scene);
        material.parseSerializedObject(serialized);

        expect(material.imageProcessingConfiguration).toBe(scene.imageProcessingConfiguration);

        material.dispose();
    });

    it("honors a serialized image processing configuration that was genuinely customized", () => {
        const template = new NodeMaterial("template", scene);
        const customConfiguration = new ImageProcessingConfiguration();
        customConfiguration.exposure = 2;
        template.imageProcessingConfiguration = customConfiguration;
        const serialized = template.serialize();
        template.dispose();

        const material = new NodeMaterial("nodeMaterial", scene);
        material.parseSerializedObject(serialized);

        expect(material.imageProcessingConfiguration).not.toBe(scene.imageProcessingConfiguration);
        expect(material.imageProcessingConfiguration.exposure).toBe(2);

        material.dispose();
    });

    it("keeps the scene configuration through NodeMaterial.Parse when the serialized configuration only holds default values", () => {
        // NodeMaterial.Parse first runs SerializationHelper.Parse (which already deserializes
        // _imageProcessingConfiguration into a detached private configuration) and then parseSerializedObject.
        // This double-parse must still resolve to the scene configuration for a default configuration,
        // otherwise the material renders overlighted under the HDR DefaultRenderingPipeline.
        const template = buildImageProcessingNodeMaterial(scene);
        const serialized = template.serialize();
        template.dispose();

        const material = NodeMaterial.Parse(serialized, scene, "");

        expect(material.imageProcessingConfiguration).toBe(scene.imageProcessingConfiguration);

        material.dispose();
    });

    it("honors a customized configuration through NodeMaterial.Parse", () => {
        const template = buildImageProcessingNodeMaterial(scene);
        const customConfiguration = new ImageProcessingConfiguration();
        customConfiguration.exposure = 2;
        template.imageProcessingConfiguration = customConfiguration;
        const serialized = template.serialize();
        template.dispose();

        const material = NodeMaterial.Parse(serialized, scene, "");

        expect(material.imageProcessingConfiguration).not.toBe(scene.imageProcessingConfiguration);
        expect(material.imageProcessingConfiguration.exposure).toBe(2);

        material.dispose();
    });
});

function buildImageProcessingNodeMaterial(scene: Scene): NodeMaterial {
    const material = new NodeMaterial("nodeMaterial", scene);

    const position = new InputBlock("position");
    position.setAsAttribute("position");
    const world = new InputBlock("world");
    world.setAsSystemValue(NodeMaterialSystemValues.World);
    const worldPosition = new TransformBlock("worldPosition");
    position.connectTo(worldPosition);
    world.connectTo(worldPosition);
    const viewProjection = new InputBlock("viewProjection");
    viewProjection.setAsSystemValue(NodeMaterialSystemValues.ViewProjection);
    const worldViewProjection = new TransformBlock("worldViewProjection");
    worldPosition.connectTo(worldViewProjection);
    viewProjection.connectTo(worldViewProjection);
    const vertexOutput = new VertexOutputBlock("vertexOutput");
    worldViewProjection.connectTo(vertexOutput);

    const color = new InputBlock("color");
    color.value = new Color4(0.5, 0.5, 0.5, 1);
    const imageProcessing = new ImageProcessingBlock("imageProcessing");
    color.connectTo(imageProcessing);
    const fragmentOutput = new FragmentOutputBlock("fragmentOutput");
    imageProcessing.connectTo(fragmentOutput);

    material.addOutputNode(vertexOutput);
    material.addOutputNode(fragmentOutput);
    material.build();

    return material;
}
