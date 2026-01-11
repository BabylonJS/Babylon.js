import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { SolidParticleSystem } from "core/Particles/solidParticleSystem";
import type { ISolidParticleInitData } from "./ISolidParticleData";
import { Mesh } from "core/Meshes/mesh";
import type { SolidParticle } from "../../../solidParticle";

/**
 * Block used to create SolidParticleSystem from merged particle configurations
 */
export class SolidParticleSystemBlock extends NodeParticleBlock {
    private static _IdCounter = 0;

    @editableInPropertyPage("Billboard", PropertyTypeForEdition.Boolean, "ADVANCED", {
        embedded: true,
        notifiers: { rebuild: true },
    })
    public billboard = false;

    public _internalId = SolidParticleSystemBlock._IdCounter++;

    public constructor(name: string) {
        super(name);
        this._isSystem = true;
        this.registerInput("solidParticle", NodeParticleBlockConnectionPointTypes.SolidParticle);
        this.registerOutput("system", NodeParticleBlockConnectionPointTypes.System);
    }

    public override getClassName() {
        return "SolidParticleSystemBlock";
    }

    public get solidParticle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get system(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public createSystem(state: NodeParticleBuildState): SolidParticleSystem {
        state.buildId = ++this._buildId;

        this.build(state);

        if (!state.scene) {
            throw new Error("Scene is not initialized in NodeParticleBuildState");
        }

        const particleData = this.solidParticle.getConnectedValue(state) as ISolidParticleInitData | ISolidParticleInitData[];

        if (!particleData) {
            throw new Error("No solid particle configuration connected to SolidParticleSystemBlock");
        }

        // Create the SPS
        const sps = new SolidParticleSystem(this.name, state.scene);

        const createBlocks = new Map<number, ISolidParticleInitData>();
        // Support both single particle config and array of configs
        const particleConfigs: ISolidParticleInitData[] = Array.isArray(particleData) ? particleData : [particleData];

        for (let i = 0; i < particleConfigs.length; i++) {
            const creatData = particleConfigs[i];
            if (!creatData || !creatData.meshData || !creatData.count) {
                continue;
            }

            if (!creatData.meshData.vertexData) {
                continue;
            }

            const mesh = new Mesh(`${this.name}_shape_${i}`, state.scene);
            creatData.meshData.vertexData.applyToMesh(mesh, true);

            const shapeId = sps.addShape(mesh, creatData.count);
            createBlocks.set(shapeId, creatData);
            mesh.dispose();
        }

        sps.initParticles = () => {
            if (!sps) {
                return;
            }

            const originalContext = state.particleContext;
            const originalSystemContext = state.systemContext;

            try {
                for (let p = 0; p < sps.nbParticles; p++) {
                    const particle = sps.particles[p];
                    const particleCreateData = createBlocks.get(particle.shapeId);
                    if (!particleCreateData) {
                        continue;
                    }
                    const { lifeTime, position, velocity, color, scaling, rotation } = particleCreateData;

                    state.particleContext = particle;
                    state.systemContext = sps;

                    if (lifeTime) {
                        particle.lifeTime = lifeTime();
                        particle.age = 0;
                        particle.alive = true;
                    }

                    if (position) {
                        particle.position.copyFrom(position());
                    }
                    if (velocity) {
                        particle.velocity.copyFrom(velocity());
                    }
                    if (color) {
                        const particleColor = particle.color;
                        if (particleColor) {
                            particleColor.copyFrom(color());
                        }
                    }
                    if (scaling) {
                        particle.scaling.copyFrom(scaling());
                    }
                    if (rotation) {
                        particle.rotation.copyFrom(rotation());
                    }
                }
            } finally {
                state.particleContext = originalContext;
                state.systemContext = originalSystemContext;
            }
        };

        sps.updateParticle = (particle: SolidParticle) => {
            if (!sps) {
                return particle;
            }

            const particleCreateData = createBlocks.get(particle.shapeId);
            const updateData = particleCreateData?.updateData;
            if (!updateData) {
                return particle;
            }
            // Set particle context in state for PerParticle lock mode
            const originalContext = state.particleContext;
            const originalSystemContext = state.systemContext;

            // Temporarily set particle context for PerParticle lock mode
            state.particleContext = particle;
            state.systemContext = sps;

            try {
                if (updateData.velocity) {
                    particle.velocity.copyFrom(updateData.velocity());
                }
                if (updateData.position) {
                    particle.position.copyFrom(updateData.position());
                }
                if (updateData.color) {
                    particle.color?.copyFrom(updateData.color());
                }
                if (updateData.scaling) {
                    particle.scaling.copyFrom(updateData.scaling());
                }
                if (updateData.rotation) {
                    particle.rotation.copyFrom(updateData.rotation());
                }
            } finally {
                // Restore original context
                state.particleContext = originalContext;
                state.systemContext = originalSystemContext;
            }
            return particle;
        };

        sps.billboard = this.billboard;
        sps.name = this.name;

        return sps;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.billboard = this.billboard;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.billboard = !!serializationObject.billboard;
    }
}

RegisterClass("BABYLON.SolidParticleSystemBlock", SolidParticleSystemBlock);
