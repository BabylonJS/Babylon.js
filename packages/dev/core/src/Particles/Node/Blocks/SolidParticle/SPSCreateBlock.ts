import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { SolidParticleSystem } from "core/Particles/solidParticleSystem";
import type { ISPSParticleConfigData } from "./ISPSData";
import { SolidParticle } from "../../../solidParticle";
import { Observer } from "../../../../Misc";

/**
 * Block used to create SolidParticleSystem and collect all Create blocks
 */
export class SPSCreateBlock extends NodeParticleBlock {
    private _connectionObservers = new Map<number, Observer<NodeParticleConnectionPoint>>();
    private _disconnectionObservers = new Map<number, Observer<NodeParticleConnectionPoint>>();

    public constructor(name: string) {
        super(name);
        this.registerInput(`particleConfig-${this._entryCount - 1}`, NodeParticleBlockConnectionPointTypes.SolidParticle);
        this.registerOutput("solidParticleSystem", NodeParticleBlockConnectionPointTypes.SolidParticleSystem);

        this._manageExtendedInputs(0);
    }

    public override getClassName() {
        return "SPSCreateBlock";
    }

    private _entryCount = 1;

    private _extend() {
        this._entryCount++;
        this.registerInput(`particleConfig-${this._entryCount - 1}`, NodeParticleBlockConnectionPointTypes.SolidParticle, true);
        this._manageExtendedInputs(this._entryCount - 1);
    }

    private _shrink() {
        if (this._entryCount > 1) {
            this._unmanageExtendedInputs(this._entryCount - 1);
            this._entryCount--;
            this.unregisterInput(`particleConfig-${this._entryCount}`);
        }
    }

    private _manageExtendedInputs(index: number) {
        const connectionObserver = this._inputs[index].onConnectionObservable.add(() => {
            if (this._entryCount - 1 > index) {
                return;
            }
            this._extend();
        });

        const disconnectionObserver = this._inputs[index].onDisconnectionObservable.add(() => {
            if (this._entryCount - 1 > index) {
                return;
            }
            this._shrink();
        });

        // Store observers for later removal
        this._connectionObservers.set(index, connectionObserver);
        this._disconnectionObservers.set(index, disconnectionObserver);
    }

    private _unmanageExtendedInputs(index: number) {
        const connectionObserver = this._connectionObservers.get(index);
        const disconnectionObserver = this._disconnectionObservers.get(index);

        if (connectionObserver) {
            this._inputs[index].onConnectionObservable.remove(connectionObserver);
            this._connectionObservers.delete(index);
        }

        if (disconnectionObserver) {
            this._inputs[index].onDisconnectionObservable.remove(disconnectionObserver);
            this._disconnectionObservers.delete(index);
        }
    }

    public get particleConfig(): NodeParticleConnectionPoint {
        return this._inputs[this._entryCount - 1];
    }

    public get solidParticleSystem(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        if (!state.scene) {
            throw new Error("Scene is not initialized in NodeParticleBuildState");
        }

        const sps = new SolidParticleSystem(this.name, state.scene, {
            useModelMaterial: true,
        });

        const createBlocks = new Map<number, ISPSParticleConfigData>();
        for (let i = 0; i < this._inputs.length; i++) {
            const creatData = this._inputs[i].getConnectedValue(state) as ISPSParticleConfigData;
            if (this._inputs[i].isConnected && creatData) {
                if (creatData.mesh && creatData.count) {
                    const shapeId = sps.addShape(creatData.mesh, creatData.count);
                    createBlocks.set(shapeId, creatData);
                    creatData.mesh.isVisible = false;
                }
            }
        }

        sps.initParticles = () => {
            if (!sps) {
                return;
            }
            for (let p = 0; p < sps.nbParticles; p++) {
                const particle = sps.particles[p];
                const particleCreateData = createBlocks.get(particle.shapeId);
                const initBlock = particleCreateData?.initBlock;
                if (!initBlock) {
                    continue;
                }
                if (initBlock.position) {
                    particle.position.copyFrom(initBlock.position());
                }
                if (initBlock.velocity) {
                    particle.velocity.copyFrom(initBlock.velocity());
                }
                if (initBlock.color) {
                    particle.color?.copyFrom(initBlock.color());
                }
                if (initBlock.scaling) {
                    particle.scaling.copyFrom(initBlock.scaling());
                }
                if (initBlock.rotation) {
                    particle.rotation.copyFrom(initBlock.rotation());
                }
            }
        };

        sps.updateParticle = (particle: SolidParticle) => {
            if (!sps) {
                return particle;
            }
            const particleCreateData = createBlocks.get(particle.shapeId);
            const updateBlock = particleCreateData?.updateBlock;
            if (!updateBlock) {
                return particle;
            }
            if (updateBlock.position) {
                particle.position.copyFrom(updateBlock.position());
            }
            if (updateBlock.velocity) {
                particle.velocity.copyFrom(updateBlock.velocity());
            }
            if (updateBlock.color) {
                particle.color?.copyFrom(updateBlock.color());
            }
            if (updateBlock.scaling) {
                particle.scaling.copyFrom(updateBlock.scaling());
            }
            if (updateBlock.rotation) {
                particle.rotation.copyFrom(updateBlock.rotation());
            }
            return particle;
        };

        sps.buildMesh();
        sps.initParticles();
        sps.setParticles();

        this.solidParticleSystem._storedValue = sps;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject._entryCount = this._entryCount;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        if (serializationObject._entryCount && serializationObject._entryCount > 1) {
            for (let i = 1; i < serializationObject._entryCount; i++) {
                this._extend();
            }
        }
    }
}

RegisterClass("BABYLON.SPSCreateBlock", SPSCreateBlock);
