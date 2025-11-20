/* eslint-disable @typescript-eslint/naming-convention */

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import type { SolidParticleSystem } from "core/Particles/solidParticleSystem";

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

    @editableInPropertyPage("Lifetime (ms)", PropertyTypeForEdition.Float, "ADVANCED", {
        embedded: true,
        min: 0,
    })
    public lifetime = 0;

    @editableInPropertyPage("Dispose on end", PropertyTypeForEdition.Boolean, "ADVANCED", {
        embedded: true,
    })
    public disposeOnEnd = false;

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
        solidParticleSystem.lifetime = this.lifetime;
        solidParticleSystem.disposeOnEnd = this.disposeOnEnd;

        this.onDisposeObservable.addOnce(() => {
            solidParticleSystem.dispose();
        });
        return solidParticleSystem;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.billboard = this.billboard;
        serializationObject.lifetime = this.lifetime;
        serializationObject.disposeOnEnd = this.disposeOnEnd;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.billboard = !!serializationObject.billboard;
        this.lifetime = serializationObject.lifetime ?? 0;
        this.disposeOnEnd = !!serializationObject.disposeOnEnd;
    }
}

RegisterClass("BABYLON.SPSSystemBlock", SPSSystemBlock);
