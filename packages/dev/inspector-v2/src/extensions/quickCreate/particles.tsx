import { ParticleSystem } from "core/Particles/particleSystem";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { NodeParticleSystemSet } from "core/Particles/Node/nodeParticleSystemSet";
import { Texture } from "core/Materials/Textures/texture";
import type { Scene } from "core/scene";
import { useState } from "react";
import type { FunctionComponent } from "react";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SpinButtonPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/spinButtonPropertyLine";
import { SettingsPopover } from "./settingsPopover";
import { QuickCreateSection, QuickCreateRow } from "./quickCreateLayout";

// Side-effect import needed for GPUParticleSystem
import "core/Particles/webgl2ParticleSystem";

type ParticlesContentProps = {
    scene: Scene;
};

/**
 * Particles content component
 * @param props - Component props
 * @returns React component
 */
export const ParticlesContent: FunctionComponent<ParticlesContentProps> = ({ scene }) => {
    // CPU Particle System state
    const [cpuParticleSystemName, setCpuParticleSystemName] = useState("Particle System");
    const [cpuParticleSystemCapacity, setCpuParticleSystemCapacity] = useState(2000);

    // GPU Particle System state
    const [gpuParticleSystemName, setGpuParticleSystemName] = useState("GPU Particle System");
    const [gpuParticleSystemCapacity, setGpuParticleSystemCapacity] = useState(2000);

    // Node Particle System state
    const [nodeParticleSystemName, setNodeParticleSystemName] = useState("Node Particle System");
    const [nodeParticleSystemSnippetId, setNodeParticleSystemSnippetId] = useState("");

    const handleCreateCPUParticleSystem = () => {
        setTimeout(() => {
            const system = new ParticleSystem(cpuParticleSystemName, cpuParticleSystemCapacity, scene);
            system.particleTexture = new Texture("https://assets.babylonjs.com/textures/flare.png", scene);
            system.start();
        }, 0);
    };

    const handleCreateGPUParticleSystem = () => {
        if (GPUParticleSystem.IsSupported) {
            setTimeout(() => {
                const system = new GPUParticleSystem(gpuParticleSystemName, { capacity: gpuParticleSystemCapacity }, scene);
                system.particleTexture = new Texture("https://assets.babylonjs.com/textures/flare.png", scene);
                system.start();
            }, 0);
        } else {
            alert("GPU Particle System is not supported.");
        }
    };

    const handleCreateNodeParticleSystemAsync = async () => {
        try {
            let nodeParticleSet;
            const snippetId = nodeParticleSystemSnippetId.trim();
            if (snippetId) {
                nodeParticleSet = await NodeParticleSystemSet.ParseFromSnippetAsync(snippetId);
                nodeParticleSet.name = nodeParticleSystemName;
            } else {
                nodeParticleSet = NodeParticleSystemSet.CreateDefault(nodeParticleSystemName);
            }
            const particleSystemSet = await nodeParticleSet.buildAsync(scene);
            for (const system of particleSystemSet.systems) {
                system.name = nodeParticleSystemName;
            }
            particleSystemSet.start();
        } catch (e) {
            global.console.error("Error creating Node Particle System:", e);
            alert("Failed to create Node Particle System: " + e);
        }
    };

    return (
        <QuickCreateSection>
            {/* CPU Particle System */}
            <QuickCreateRow>
                <Button onClick={handleCreateCPUParticleSystem} label="CPU Particle System" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={cpuParticleSystemName} onChange={(value) => setCpuParticleSystemName(value)} />
                    <SpinButtonPropertyLine
                        label="Capacity"
                        value={cpuParticleSystemCapacity}
                        onChange={(value) => setCpuParticleSystemCapacity(value)}
                        min={1}
                        max={100000}
                        step={100}
                    />
                    <Button appearance="primary" onClick={handleCreateCPUParticleSystem} label="Create" />
                </SettingsPopover>
            </QuickCreateRow>

            {/* GPU Particle System */}
            <QuickCreateRow>
                <Button onClick={handleCreateGPUParticleSystem} label="GPU Particle System" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={gpuParticleSystemName} onChange={(value) => setGpuParticleSystemName(value)} />
                    <SpinButtonPropertyLine
                        label="Capacity"
                        value={gpuParticleSystemCapacity}
                        onChange={(value) => setGpuParticleSystemCapacity(value)}
                        min={1}
                        max={1000000}
                        step={1000}
                    />
                    <Button appearance="primary" onClick={handleCreateGPUParticleSystem} label="Create" />
                </SettingsPopover>
            </QuickCreateRow>

            {/* Node Particle System */}
            <QuickCreateRow>
                <Button onClick={handleCreateNodeParticleSystemAsync} label="Node Particle System" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={nodeParticleSystemName} onChange={(value) => setNodeParticleSystemName(value)} />
                    <TextInputPropertyLine label="Snippet ID" value={nodeParticleSystemSnippetId} onChange={(value) => setNodeParticleSystemSnippetId(value)} />
                    <Button appearance="primary" onClick={handleCreateNodeParticleSystemAsync} label="Create" />
                </SettingsPopover>
            </QuickCreateRow>
        </QuickCreateSection>
    );
};
