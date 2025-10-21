import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { SolidParticleSystem } from "core/Particles/solidParticleSystem";
import type { ISPSCreateData } from "./ISPSData";
import { SolidParticle } from "../../../solidParticle";
import { Observable } from "../../../../Misc/observable";

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

    /**
     * Gets or sets the list of particle sources
     */
    public particleSources: ISPSCreateData[] = [];

    /** Gets an observable raised when the particle sources are changed */
    public onParticleSourcesChangedObservable = new Observable<SPSSystemBlock>();

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

    /**
     * Add a particle source to the system
     * @param source The particle source data
     */
    public addParticleSource(source: ISPSCreateData): void {
        this.particleSources.push(source);
        this.onParticleSourcesChangedObservable.notifyObservers(this);
    }

    /**
     * Remove a particle source from the system
     * @param source The particle source data to remove
     */
    public removeParticleSource(source: ISPSCreateData): void {
        const index = this.particleSources.indexOf(source);
        if (index !== -1) {
            this.particleSources.splice(index, 1);
            this.onParticleSourcesChangedObservable.notifyObservers(this);
        }
    }

    /**
     * Clear all particle sources
     */
    public clearParticleSources(): void {
        this.particleSources.length = 0;
        this.onParticleSourcesChangedObservable.notifyObservers(this);
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

        const createBlocks: ISPSCreateData[] = this.particleSources;

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
        serializationObject.particleSources = this.particleSources;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.capacity = serializationObject.capacity;
        this.billboard = !!serializationObject.billboard;
        this.particleSources = serializationObject.particleSources || [];
    }
}

RegisterClass("BABYLON.SPSSystemBlock", SPSSystemBlock);
