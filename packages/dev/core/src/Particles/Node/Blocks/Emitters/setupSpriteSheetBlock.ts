import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ParticleSystem } from "core/Particles";
/**
 * Block used as configure the sprite sheet for particles
 */
export class SetupSpriteSheetBlock extends NodeParticleBlock {
    /**
     * Gets or sets the start cell of the sprite sheet
     */
    @editableInPropertyPage("Start", PropertyTypeForEdition.Int, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0 })
    public start = 0;

    /**
     * Gets or sets the end cell of the sprite sheet
     */
    @editableInPropertyPage("End", PropertyTypeForEdition.Int, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0 })
    public end = 8;

    /**
     * Gets or sets the width of the sprite sheet
     */
    @editableInPropertyPage("Width", PropertyTypeForEdition.Float, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0 })
    public width = 64;

    /**
     * Gets or sets the height of the sprite sheet
     */
    @editableInPropertyPage("Height", PropertyTypeForEdition.Float, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0 })
    public height = 64;

    /**
     * Gets or sets a boolean indicating if the sprite sheet should loop
     */
    @editableInPropertyPage("Loop", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public loop = false;

    /**
     * Gets or sets a boolean indicating if the sprite sheet should start at a random cell
     */
    @editableInPropertyPage("Random start cell", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public randomStartCell = false;

    /**
     * Creates a new SetupSpriteSheetBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SetupSpriteSheetBlock";
    }

    /**
     * Gets the particle component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        super._build(state);

        const system = this.particle.getConnectedValue(state) as ParticleSystem;

        system._isAnimationSheetEnabled = true;
        system.spriteCellWidth = this.width;
        system.spriteCellHeight = this.height;
        system.startSpriteCellID = this.start;
        system.endSpriteCellID = this.end;
        system.spriteRandomStartCell = this.randomStartCell;

        this.output._storedValue = system;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.width = this.width;
        serializationObject.height = this.height;
        serializationObject.start = this.start;
        serializationObject.end = this.end;
        serializationObject.randomStartCell = this.randomStartCell;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.width = serializationObject.width;
        this.height = serializationObject.height;
        this.start = serializationObject.start;
        this.end = serializationObject.end;
        this.randomStartCell = serializationObject.randomStartCell;
    }
}

RegisterClass("BABYLON.SetupSpriteSheetBlock", SetupSpriteSheetBlock);
