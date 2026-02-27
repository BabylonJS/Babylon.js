import type { ParticleSystem } from "core/index";

import { ConvertToNodeParticleSystemSetAsync } from "core/Particles/Node/nodeParticleSystemSet.helper";

export async function EditParticleSystem(particleSystem: ParticleSystem) {
    // TODO: Figure out how to get all the various build steps to work with this.
    //       See the initial attempt here: https://github.com/BabylonJS/Babylon.js/pull/17646
    // const { NodeParticleEditor } = await import("node-particle-editor/nodeParticleEditor");
    // NodeParticleEditor.Show({ nodeParticleSet: NodeParticleSystemSet });
    const scene = particleSystem.getScene();
    if (scene) {
        const systemSet = particleSystem.isNodeGenerated ? particleSystem.source : await ConvertToNodeParticleSystemSetAsync("source", [particleSystem]);
        if (systemSet) {
            await systemSet.editAsync({ nodeEditorConfig: { backgroundColor: scene.clearColor, disposeOnClose: !particleSystem.isNodeGenerated } });
        }
    }
}
