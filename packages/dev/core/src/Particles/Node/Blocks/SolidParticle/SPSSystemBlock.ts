import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { SolidParticleSystem } from "core/Particles/solidParticleSystem";
import type { ISPSCreateData } from "./ISPSData";
import { SolidParticle } from "../../../solidParticle";
import { Observer } from "../../../../Misc";

/**
 * Block used to create SolidParticleSystem and collect all Create blocks
 */
export class SPSSystemBlock extends NodeParticleBlock {
    private static _IdCounter = 0;
    private _connectionObservers = new Map<number, Observer<NodeParticleConnectionPoint>>();
    private _disconnectionObservers = new Map<number, Observer<NodeParticleConnectionPoint>>();

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

        this.registerInput(`solidParticle-${this._entryCount - 1}`, NodeParticleBlockConnectionPointTypes.SolidParticle);
        this.registerOutput("system", NodeParticleBlockConnectionPointTypes.SolidParticleSystem);

        this._manageExtendedInputs(0);
    }

    public override getClassName() {
        return "SPSSystemBlock";
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
            console.log("connectionObserver solidParticle", index);
            console.log(" connectionObserver this._entryCount", this._entryCount);
            if (this._entryCount - 1 > index) {
                return;
            }
            this._extend();
        });

        const disconnectionObserver = this._inputs[index].onDisconnectionObservable.add(() => {
            console.log("solidParticle", index);
            console.log("this._entryCount", this._entryCount);
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
        return this._inputs[this._entryCount - 1];
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

        // Collect data from all connected solidParticle inputs
        const createBlocks: ISPSCreateData[] = [];
        for (let i = 0; i < this._inputs.length; i++) {
            if (this._inputs[i].isConnected && this._inputs[i]._storedValue) {
                createBlocks.push(this._inputs[i]._storedValue);
            }
        }

        for (const createBlock of createBlocks) {
            if (createBlock.mesh && createBlock.count) {
                createBlock.shapeId = sps.addShape(createBlock.mesh, createBlock.count);
                createBlock.mesh.isVisible = false;
            }
        }

        sps.initParticles = () => {
            for (const createBlock of createBlocks) {
                if (createBlock.initBlock && createBlock.shapeId !== undefined) {
                    const particles = sps.getParticlesByShapeId(createBlock.shapeId);

                    particles.forEach((particle) => {
                        if (createBlock.initBlock) {
                            particle.position.copyFrom(createBlock.initBlock.position());
                            particle.velocity.copyFrom(createBlock.initBlock.velocity());
                            particle.color?.copyFrom(createBlock.initBlock.color());
                            particle.scaling.copyFrom(createBlock.initBlock.scaling());
                            particle.rotation.copyFrom(createBlock.initBlock.rotation());
                        }
                    });
                }
            }
        };

        sps.updateParticle = (particle: SolidParticle) => {
            const createBlock = createBlocks.find((createBlock) => createBlock.shapeId === particle.shapeId);
            if (createBlock && createBlock.updateBlock) {
                particle.position.copyFrom(createBlock.updateBlock.position());
                particle.velocity.copyFrom(createBlock.updateBlock.velocity());
                particle.color?.copyFrom(createBlock.updateBlock.color());
                particle.scaling.copyFrom(createBlock.updateBlock.scaling());
                particle.rotation.copyFrom(createBlock.updateBlock.rotation());
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
        serializationObject._entryCount = this._entryCount;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.capacity = serializationObject.capacity;
        this.billboard = !!serializationObject.billboard;

        if (serializationObject._entryCount && serializationObject._entryCount > 1) {
            for (let i = 1; i < serializationObject._entryCount; i++) {
                this._extend();
            }
        }
    }
}

RegisterClass("BABYLON.SPSSystemBlock", SPSSystemBlock);
