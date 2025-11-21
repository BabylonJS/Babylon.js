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

    @editableInPropertyPage("Dispose on end", PropertyTypeForEdition.Boolean, "ADVANCED", {
        embedded: true,
    })
    public disposeOnEnd = false;

    public _internalId = SPSSystemBlock._IdCounter++;

    public constructor(name: string) {
        super(name);
        this._isSystem = true;
        this.registerInput("lifeTime", NodeParticleBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("solidParticle", NodeParticleBlockConnectionPointTypes.SolidParticle);
        this.registerOutput("system", NodeParticleBlockConnectionPointTypes.System);
    }

    public override getClassName() {
        return "SPSSystemBlock";
    }

    public get lifeTime(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get solidParticle(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    public get system(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public createSystem(state: NodeParticleBuildState): SolidParticleSystem {
        state.buildId = ++this._buildId;

        this.build(state);

        const solidParticle = this.solidParticle.getConnectedValue(state) as SolidParticleSystem;

        if (!solidParticle) {
            throw new Error("No SolidParticleSystem connected to SPSSystemBlock");
        }

        solidParticle.billboard = this.billboard;
        solidParticle.name = this.name;
        if (this.lifeTime.isConnected) {
            const connectedLifetime = this.lifeTime.getConnectedValue(state) as number;
            solidParticle.lifetime = connectedLifetime ?? 0;
        } else {
            solidParticle.lifetime = this.lifeTime.value;
        }
        solidParticle.disposeOnEnd = this.disposeOnEnd;
        return solidParticle;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.billboard = this.billboard;
        serializationObject.lifeTime = this.lifeTime.value;
        serializationObject.disposeOnEnd = this.disposeOnEnd;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.billboard = !!serializationObject.billboard;
        this.lifeTime.value = serializationObject.lifeTime ?? 0;
        this.disposeOnEnd = !!serializationObject.disposeOnEnd;
    }
}

RegisterClass("BABYLON.SPSSystemBlock", SPSSystemBlock);
