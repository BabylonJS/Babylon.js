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
import { Nullable } from "../../../../types";
import { Scene } from "../../../..";

/**
 * Block used to create SolidParticleSystem and collect all Create blocks
 */
export class SPSSystemBlock extends NodeParticleBlock {
    private static _IdCounter = 0;
    private _sps: SolidParticleSystem | null = null;
    private _connectionObservers = new Map<number, Observer<NodeParticleConnectionPoint>>();
    private _disconnectionObservers = new Map<number, Observer<NodeParticleConnectionPoint>>();
    private _onBeforeRenderObserver: Nullable<Observer<Scene>> = null;
    private _disposeHandlerAdded = false;

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
        return this._inputs[this._entryCount - 1];
    }

    public get system(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public createSystem(state: NodeParticleBuildState): SolidParticleSystem {
        state.capacity = this.capacity;
        state.buildId = this._buildId ? this._buildId + 1 : 0;

        this.build(state);

        if (!state.scene) {
            throw new Error("Scene is not initialized in NodeParticleBuildState");
        }
        if (this._sps) {
            // dispose is not working correctly
            // this._sps.dispose();
            this._sps = null;
        }

        if (this._onBeforeRenderObserver) {
            state.scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            this._onBeforeRenderObserver = null;
        }

        this._sps = new SolidParticleSystem(this.name, state.scene, {
            useModelMaterial: true,
        });
        this._sps.billboard = this.billboard;
        this._sps.name = this.name;

        const createBlocks = new Map<number, ISPSCreateData>();
        for (let i = 0; i < this._inputs.length; i++) {
            const creatData = this._inputs[i].getConnectedValue(state) as ISPSCreateData;
            if (this._inputs[i].isConnected && creatData) {
                if (creatData.mesh && creatData.count) {
                    const shapeId = this._sps.addShape(creatData.mesh, creatData.count);
                    createBlocks.set(shapeId, creatData);
                    creatData.mesh.isVisible = false;
                }
            }
        }

        this._sps.initParticles = () => {
            if (!this._sps) {
                return;
            }
            for (let p = 0; p < this._sps.nbParticles; p++) {
                const particle = this._sps.particles[p];
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

        this._sps.updateParticle = (particle: SolidParticle) => {
            if (!this._sps) {
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

        this._sps.buildMesh();
        this._sps.initParticles();
        this._sps.setParticles();

        this._onBeforeRenderObserver = state.scene.onBeforeRenderObservable.add(() => {
            this._sps?.setParticles();
        });

        this.system._storedValue = this;

        if (!this._disposeHandlerAdded) {
            this.onDisposeObservable.addOnce(() => {
                this._sps?.dispose();
                this._sps = null;
                if (this._onBeforeRenderObserver) {
                    state.scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
                    this._onBeforeRenderObserver = null;
                }
            });
            this._disposeHandlerAdded = true;
        }
        console.log("SPSSystemBlock#createSystem", this._sps.mesh.getScene().meshes.length);
        return this._sps;
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
