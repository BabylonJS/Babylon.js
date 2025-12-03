import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ISolidParticleInitData } from "./ISolidParticleData";
import type { Observer } from "core/Misc/observable";

/**
 * Block used to merge multiple solid particle configurations
 */
export class MergeSolidParticlesBlock extends NodeParticleBlock {
    private _connectionObservers = new Map<number, Observer<NodeParticleConnectionPoint>>();
    private _disconnectionObservers = new Map<number, Observer<NodeParticleConnectionPoint>>();

    public constructor(name: string) {
        super(name);
        this.registerInput(`solidParticle-${this._entryCount - 1}`, NodeParticleBlockConnectionPointTypes.SolidParticle);
        this.registerOutput("solidParticle", NodeParticleBlockConnectionPointTypes.SolidParticle);

        this._manageExtendedInputs(0);
    }

    public override getClassName() {
        return "MergeSolidParticlesBlock";
    }

    private _entryCount = 1;

    private _extend() {
        this._entryCount++;
        this.registerInput(`solidParticle-${this._entryCount - 1}`, NodeParticleBlockConnectionPointTypes.SolidParticle, true);
        this._manageExtendedInputs(this._entryCount - 1);
    }

    private _shrink() {
        if (this._entryCount > 1) {
            this._unmanageExtendedInputs(this._entryCount - 1);
            this._entryCount--;
            this.unregisterInput(`solidParticle-${this._entryCount}`);
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

    public get solidParticle(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        // Collect all particle configurations
        const particleConfigs: ISolidParticleInitData[] = [];
        for (let i = 0; i < this._inputs.length; i++) {
            const particleData = this._inputs[i].getConnectedValue(state) as ISolidParticleInitData | ISolidParticleInitData[];
            if (this._inputs[i].isConnected && particleData) {
                // If it's already an array, flatten it
                if (Array.isArray(particleData)) {
                    particleConfigs.push(...particleData);
                } else {
                    particleConfigs.push(particleData);
                }
            }
        }

        // Output array of configurations
        // The actual SPS creation will happen in SolidParticleSystemBlock
        this.solidParticle._storedValue = particleConfigs;
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

RegisterClass("BABYLON.MergeSolidParticlesBlock", MergeSolidParticlesBlock);

