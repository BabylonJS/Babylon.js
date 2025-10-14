import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { SolidParticleSystem } from "core/Particles/solidParticleSystem";
import type { ISPSCreateData } from "./ISPSData";

/**
 * Block used to create SolidParticleSystem and collect all Create blocks
 */
export class SPSSystemBlock extends NodeParticleBlock {
    private static _IdCounter = 0;

    @editableInPropertyPage("Capacity", PropertyTypeForEdition.Int, "ADVANCED", {
        embedded: true,
        notifiers: { rebuild: true },
        min: 0,
        max: 100000,
    })
    public capacity = 1000;

    @editableInPropertyPage("Billboard", PropertyTypeForEdition.Boolean, "ADVANCED", {
        embedded: true,
        notifiers: { rebuild: true },
    })
    public billboard = false;

    public _internalId = SPSSystemBlock._IdCounter++;

    public constructor(name: string) {
        super(name);

        this._isSystem = true;

        this.registerInput("solidParticle", NodeParticleBlockConnectionPointTypes.SolidParticle, true, null, null, null, true);
        this.registerOutput("system", NodeParticleBlockConnectionPointTypes.SolidParticleSystem);
    }

    public override getClassName() {
        return "SPSSystemBlock";
    }

    public get solidParticle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get system(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public createSystem(state: NodeParticleBuildState): SolidParticleSystem {
        state.capacity = this.capacity;
        state.buildId = this._buildId++;

        this.build(state);

        if (!state.scene) {
            throw new Error("Scene is not initialized in NodeParticleBuildState");
        }

        const sps = new SolidParticleSystem(this.name, state.scene);
        sps.billboard = this.billboard;
        sps.name = this.name;

        const createBlocks: ISPSCreateData[] = [];

        if (this.solidParticle.endpoints.length > 0) {
            for (const endpoint of this.solidParticle.endpoints) {
                const createBlock = endpoint.getConnectedValue(state);
                if (createBlock) {
                    createBlocks.push(createBlock);
                }
            }
        } else if (this.solidParticle.isConnected) {
            const createBlock = this.solidParticle.getConnectedValue(state);
            if (createBlock) {
                createBlocks.push(createBlock);
            }
        }

        if (createBlocks.length === 0 && this.solidParticle.allowMultipleConnections && this.solidParticle._connectedPoint) {
            const connectedPoint = this.solidParticle._connectedPoint;
            if (connectedPoint.endpoints && connectedPoint.endpoints.length > 0) {
                for (const endpoint of connectedPoint.endpoints) {
                    const createBlock = endpoint.getConnectedValue(state);
                    if (createBlock) {
                        createBlocks.push(createBlock);
                    }
                }
            }
        }

        for (const createBlock of createBlocks) {
            if (createBlock.mesh && createBlock.count) {
                sps.addShape(createBlock.mesh, createBlock.count);
                createBlock.mesh.dispose();
            }
        }

        sps.initParticles = () => {
            for (const createBlock of createBlocks) {
                if (createBlock.initBlock) {
                    let startIndex = 0;
                    for (let i = 0; i < createBlocks.indexOf(createBlock); i++) {
                        startIndex += createBlocks[i].count;
                    }
                    const endIndex = startIndex + createBlock.count - 1;

                    for (let p = startIndex; p <= endIndex && p < sps.nbParticles; p++) {
                        const particle = sps.particles[p];

                        if (createBlock.initBlock?.position) {
                            const particleContext = {
                                id: p,
                                position: particle.position,
                                velocity: particle.velocity,
                                color: particle.color,
                                scaling: particle.scaling,
                                rotation: particle.rotation,
                            };
                            state.particleContext = particleContext as any;

                            const positionValue = createBlock.initBlock.position;
                            if (typeof positionValue === "function") {
                                particle.position.copyFrom(positionValue());
                            } else {
                                particle.position.copyFrom(positionValue);
                            }
                        }
                        if (createBlock.initBlock?.velocity) {
                            const velocityValue = createBlock.initBlock.velocity;
                            if (typeof velocityValue === "function") {
                                particle.velocity.copyFrom(velocityValue());
                            } else {
                                particle.velocity.copyFrom(velocityValue);
                            }
                        }
                        if (createBlock.initBlock?.color) {
                            const colorValue = createBlock.initBlock.color;
                            if (typeof colorValue === "function") {
                                particle.color?.copyFrom(colorValue());
                            } else {
                                particle.color?.copyFrom(colorValue);
                            }
                        }
                        if (createBlock.initBlock?.scaling) {
                            const scalingValue = createBlock.initBlock.scaling;
                            if (typeof scalingValue === "function") {
                                particle.scaling.copyFrom(scalingValue());
                            } else {
                                particle.scaling.copyFrom(scalingValue);
                            }
                        }
                        if (createBlock.initBlock?.rotation) {
                            const rotationValue = createBlock.initBlock.rotation;
                            if (typeof rotationValue === "function") {
                                particle.rotation.copyFrom(rotationValue());
                            } else {
                                particle.rotation.copyFrom(rotationValue);
                            }
                        }
                    }
                }
            }
        };

        sps.updateParticle = (particle: any) => {
            let currentParticleIndex = 0;
            let targetCreateBlock = null;

            for (const createBlock of createBlocks) {
                if (particle.idx >= currentParticleIndex && particle.idx < currentParticleIndex + createBlock.count) {
                    targetCreateBlock = createBlock;
                    break;
                }
                currentParticleIndex += createBlock.count;
            }

            if (targetCreateBlock && targetCreateBlock.updateBlock) {
                if (targetCreateBlock.updateBlock.position) {
                    const positionValue = targetCreateBlock.updateBlock.position;
                    if (typeof positionValue === "function") {
                        particle.position.copyFrom(positionValue());
                    } else {
                        particle.position.copyFrom(positionValue);
                    }
                }
                if (targetCreateBlock.updateBlock.velocity) {
                    const velocityValue = targetCreateBlock.updateBlock.velocity;
                    if (typeof velocityValue === "function") {
                        particle.velocity.copyFrom(velocityValue());
                    } else {
                        particle.velocity.copyFrom(velocityValue);
                    }
                }
                if (targetCreateBlock.updateBlock.color) {
                    const colorValue = targetCreateBlock.updateBlock.color;
                    if (typeof colorValue === "function") {
                        particle.color?.copyFrom(colorValue());
                    } else {
                        particle.color?.copyFrom(colorValue);
                    }
                }
                if (targetCreateBlock.updateBlock.scaling) {
                    const scalingValue = targetCreateBlock.updateBlock.scaling;
                    if (typeof scalingValue === "function") {
                        particle.scaling.copyFrom(scalingValue());
                    } else {
                        particle.scaling.copyFrom(scalingValue);
                    }
                }
                if (targetCreateBlock.updateBlock.rotation) {
                    const rotationValue = targetCreateBlock.updateBlock.rotation;
                    if (typeof rotationValue === "function") {
                        particle.rotation.copyFrom(rotationValue());
                    } else {
                        particle.rotation.copyFrom(rotationValue);
                    }
                }
            }
            return particle;
        };

        sps.start();

        this.system._storedValue = this;

        this.onDisposeObservable.addOnce(() => {
            sps.dispose();
        });

        return sps;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.capacity = this.capacity;
        serializationObject.billboard = this.billboard;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.capacity = serializationObject.capacity;
        this.billboard = !!serializationObject.billboard;
    }
}

RegisterClass("BABYLON.SPSSystemBlock", SPSSystemBlock);
