import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "core/Particles/Node/nodeParticleBlockConnectionPoint";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";

export const RegisterDebugSupport = (stateManager: StateManager) => {
    stateManager.isDebugConnectionAllowed = (a, b) => {
        const pointA = a.portData.data as NodeParticleConnectionPoint;
        const pointB = b.portData.data as NodeParticleConnectionPoint;

        if (pointA.type === NodeParticleBlockConnectionPointTypes.Particle || pointB.type === NodeParticleBlockConnectionPointTypes.Particle) {
            return false; // We do not support debug on particle data
        }

        if (pointA.type === NodeParticleBlockConnectionPointTypes.Texture || pointB.type === NodeParticleBlockConnectionPointTypes.Texture) {
            return false; // We do not support debug on texture data
        }

        if (pointA.type === NodeParticleBlockConnectionPointTypes.System || pointB.type === NodeParticleBlockConnectionPointTypes.System) {
            return false; // We do not support debug on system data
        }

        if (pointA.type === NodeParticleBlockConnectionPointTypes.FloatGradient || pointB.type === NodeParticleBlockConnectionPointTypes.FloatGradient) {
            return false; // We do not support debug on gradient data
        }

        if (pointA.type === NodeParticleBlockConnectionPointTypes.Vector2Gradient || pointB.type === NodeParticleBlockConnectionPointTypes.Vector2Gradient) {
            return false; // We do not support debug on gradient data
        }

        if (pointA.type === NodeParticleBlockConnectionPointTypes.Vector3Gradient || pointB.type === NodeParticleBlockConnectionPointTypes.Vector3Gradient) {
            return false; // We do not support debug on gradient data
        }

        if (pointA.type === NodeParticleBlockConnectionPointTypes.Color4Gradient || pointB.type === NodeParticleBlockConnectionPointTypes.Color4Gradient) {
            return false; // We do not support debug on gradient data
        }

        return true;
    };
};
