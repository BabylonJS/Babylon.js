import { ParticleSystem } from "core/Particles/particleSystem";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { NodeParticleSystemSet } from "core/Particles/Node/nodeParticleSystemSet";
import { Texture } from "core/Materials/Textures/texture";
import type { Scene } from "core/scene";
import { useState } from "react";
import type { FunctionComponent } from "react";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SpinButtonPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/spinButtonPropertyLine";
import { QuickCreateSection, QuickCreateItem } from "./quickCreateLayout";
import type { ISelectionService } from "../../services/selectionService";

// Side-effect import needed for GPUParticleSystem
import "core/Particles/webgl2ParticleSystem";

type ParticlesContentProps = {
    scene: Scene;
    selectionService: ISelectionService;
};

/**
 * Particles content component
 * @param props - Component props
 * @returns React component
 */
export const ParticlesContent: FunctionComponent<ParticlesContentProps> = ({ scene, selectionService }) => {
    // CPU Particle System state
    const [cpuParticleSystemName, setCpuParticleSystemName] = useState("Particle System");
    const [cpuParticleSystemCapacity, setCpuParticleSystemCapacity] = useState(2000);

    // GPU Particle System state
    const [gpuParticleSystemName, setGpuParticleSystemName] = useState("GPU Particle System");
    const [gpuParticleSystemCapacity, setGpuParticleSystemCapacity] = useState(2000);

    // Node Particle System state
    const [nodeParticleSystemName, setNodeParticleSystemName] = useState("Node Particle System");
    const [nodeParticleSystemSnippetId, setNodeParticleSystemSnippetId] = useState("");

    const handleCreateCPUAsync = async () => {
        return await new Promise<{ name: string }>((resolve) => {
            setTimeout(() => {
                const system = new ParticleSystem(cpuParticleSystemName, cpuParticleSystemCapacity, scene);
                system.particleTexture = new Texture("https://assets.babylonjs.com/textures/flare.png", scene);
                system.start();
                resolve(system);
            }, 0);
        });
    };

    const handleCreateGPUAsync = async () => {
        if (!GPUParticleSystem.IsSupported) {
            alert("GPU Particle System is not supported.");
            throw new Error("GPU Particle System is not supported.");
        }
        return await new Promise<{ name: string }>((resolve) => {
            setTimeout(() => {
                const system = new GPUParticleSystem(gpuParticleSystemName, { capacity: gpuParticleSystemCapacity }, scene);
                system.particleTexture = new Texture("https://assets.babylonjs.com/textures/flare.png", scene);
                system.start();
                resolve(system);
            }, 0);
        });
    };

    const handleCreateNodeAsync = async () => {
        let nodeParticleSet;
        const snippetId = nodeParticleSystemSnippetId.trim();
        if (snippetId) {
            nodeParticleSet = await NodeParticleSystemSet.ParseFromSnippetAsync(snippetId);
            nodeParticleSet.name = nodeParticleSystemName;
        } else {
            nodeParticleSet = NodeParticleSystemSet.CreateDefault(nodeParticleSystemName);
        }
        const particleSystemSet = await nodeParticleSet.buildAsync(scene);
        const systems = particleSystemSet.systems;
        if (systems.length === 0) {
            throw new Error("No particle systems were produced by the node particle system.");
        }
        for (const system of systems) {
            system.name = nodeParticleSystemName;
        }
        particleSystemSet.start();
        return systems[0];
    };

    return (
        <QuickCreateSection>
            {/* CPU Particle System */}
            <QuickCreateItem selectionService={selectionService} label="CPU Particle System" onCreate={handleCreateCPUAsync}>
                <TextInputPropertyLine label="Name" value={cpuParticleSystemName} onChange={(value) => setCpuParticleSystemName(value)} />
                <SpinButtonPropertyLine
                    label="Capacity"
                    value={cpuParticleSystemCapacity}
                    onChange={(value) => setCpuParticleSystemCapacity(value)}
                    min={1}
                    max={100000}
                    step={100}
                />
            </QuickCreateItem>

            {/* GPU Particle System */}
            <QuickCreateItem selectionService={selectionService} label="GPU Particle System" onCreate={handleCreateGPUAsync}>
                <TextInputPropertyLine label="Name" value={gpuParticleSystemName} onChange={(value) => setGpuParticleSystemName(value)} />
                <SpinButtonPropertyLine
                    label="Capacity"
                    value={gpuParticleSystemCapacity}
                    onChange={(value) => setGpuParticleSystemCapacity(value)}
                    min={1}
                    max={1000000}
                    step={1000}
                />
            </QuickCreateItem>

            {/* Node Particle System */}
            <QuickCreateItem selectionService={selectionService} label="Node Particle System" onCreate={handleCreateNodeAsync}>
                <TextInputPropertyLine label="Name" value={nodeParticleSystemName} onChange={(value) => setNodeParticleSystemName(value)} />
                <TextInputPropertyLine label="Snippet ID" value={nodeParticleSystemSnippetId} onChange={(value) => setNodeParticleSystemSnippetId(value)} />
            </QuickCreateItem>
        </QuickCreateSection>
    );
};
