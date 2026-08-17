import { type ParticleSystem } from "core/index";

import { ConvertToNodeParticleSystemSetAsync } from "core/Particles/Node/nodeParticleSystemSet.helper";

export async function EditParticleSystem(particleSystem: ParticleSystem) {
    const scene = particleSystem.getScene();
    if (scene) {
        const systemSet = particleSystem.isNodeGenerated ? particleSystem.source : await ConvertToNodeParticleSystemSetAsync("source", [particleSystem]);
        if (systemSet) {
            const { NodeParticleEditor } = await import("node-particle-editor/nodeParticleEditor");
            NodeParticleEditor.Show({
                nodeParticleSet: systemSet,
                hostScene: scene,
                backgroundColor: scene.clearColor,
                disposeOnClose: !particleSystem.isNodeGenerated,
            });
        }
    }
}
