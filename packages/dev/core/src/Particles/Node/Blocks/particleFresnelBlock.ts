import { RegisterClass } from "../../../Misc/typeStore";
import { Vector3 } from "core/Maths/math.vector";
import { NodeParticleBlock } from "../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";

/**
 * Block used to compute the fresnel term
 */
export class ParticleFresnelBlock extends NodeParticleBlock {
    /**
     * Creates a new ParticleFresnelBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("view", NodeParticleBlockConnectionPointTypes.Vector3);
        this.registerInput("normal", NodeParticleBlockConnectionPointTypes.Vector3);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleFresnelBlock";
    }

    /**
     * Gets the view input component
     */
    public get view(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the normal input component
     */
    public get normal(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the gradient operand input component
     */
    public get gradient(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build() {
        if (!this.view.isConnected || !this.normal.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        this.output._storedFunction = (state) => {
            const view = this.view.getConnectedValue(state);
            const normal = this.normal.getConnectedValue(state);
            const f0 = 0.04; // base reflectance at normal incidence (e.g. 0.04 for dielectrics)

            const nLen = normal.length();
            const vLen = view.length();

            // Guard against zero-length inputs
            if (nLen < 1e-8 || vLen < 1e-8) {
                return f0;
            }

            const cosTheta = Math.min(Math.max(Vector3.Dot(normal, view) / (nLen * vLen), 0.0), 1.0);

            // Schlick approximation
            const oneMinusCos = 1.0 - cosTheta;
            return f0 + (1.0 - f0) * Math.pow(oneMinusCos, 5.0);
        };
    }
}

RegisterClass("BABYLON.ParticleFresnelBlock", ParticleFresnelBlock);
