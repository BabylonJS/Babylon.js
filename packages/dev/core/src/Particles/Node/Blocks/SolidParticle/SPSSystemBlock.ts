import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { SolidParticleSystem } from "core/Particles/solidParticleSystem";

/**
 * Block used to create SolidParticleSystem and collect all Create blocks
 */
export class SPSSystemBlock extends NodeParticleBlock {
    private static _IdCounter = 0;

    @editableInPropertyPage("Billboard", PropertyTypeForEdition.Boolean, "ADVANCED", {
        embedded: true,
        notifiers: { rebuild: true },
    })
    public billboard = false;

    public _internalId = SPSSystemBlock._IdCounter++;

    public constructor(name: string) {
        super(name);
        this._isSystem = true;
        this.registerInput("solidParticleSystem", NodeParticleBlockConnectionPointTypes.SolidParticleSystem);
        this.registerOutput("solidParticleSystem", NodeParticleBlockConnectionPointTypes.SolidParticleSystem);
    }

    public override getClassName() {
        return "SPSSystemBlock";
    }

    public get solidParticleSystem(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get system(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public createSystem(state: NodeParticleBuildState): SolidParticleSystem {
        state.buildId = ++this._buildId;

        this.build(state);

        const solidParticleSystem = this.solidParticleSystem.getConnectedValue(state) as SolidParticleSystem;

        if (!solidParticleSystem) {
            throw new Error("No SolidParticleSystem connected to SPSSystemBlock");
        }

        solidParticleSystem.billboard = this.billboard;
        solidParticleSystem.name = this.name;

        this.onDisposeObservable.addOnce(() => {
            solidParticleSystem.dispose();
        });
        return solidParticleSystem;
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

RegisterClass("BABYLON.SPSSystemBlock", SPSSystemBlock);
