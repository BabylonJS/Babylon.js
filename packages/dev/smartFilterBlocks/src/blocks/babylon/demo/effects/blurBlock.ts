import {
    type ConnectionPointType,
    AggregateBlock,
    type ConnectionPoint,
    editableInPropertyPage,
    PropertyTypeForEdition,
    SmartFilter,
} from "@babylonjs/smart-filters";
import { DirectionalBlurBlock } from "./directionalBlurBlock.js";
import { blurBlockType } from "../../../blockTypes.js";
import { babylonDemoEffectsNamespace } from "../../../blockNamespaces.js";

const defaultBlurTextureRatioPerPass = 0.5;
const defaultBlurSize = 2;

/**
 * A block performing a blur on the input texture.
 *
 * It performs the blur in 4 consecutive passes, 2 verticals and 2 horizontals downsizing the texture as we go.
 */
export class BlurBlock extends AggregateBlock {
    /**
     * The class name of the block.
     */
    public static override ClassName = blurBlockType;

    /**
     * The namespace of the block.
     */
    public static override Namespace = babylonDemoEffectsNamespace;

    /**
     * The input texture connection point.
     */
    public readonly input: ConnectionPoint<ConnectionPointType.Texture>;

    /**
     * The output blurred texture connection point.
     */
    public readonly output: ConnectionPoint<ConnectionPointType.Texture>;

    private _blurTextureRatioPerPass = defaultBlurTextureRatioPerPass;
    private _blurSize = defaultBlurSize;

    private readonly _intermediateBlurV: DirectionalBlurBlock;
    private readonly _intermediateBlurH: DirectionalBlurBlock;
    private readonly _finalBlurV: DirectionalBlurBlock;
    private readonly _finalBlurH: DirectionalBlurBlock;

    /**
     * Gets how much smaller we should make the texture between the 2 consecutive bi lateral passes.
     */
    public get blurTextureRatioPerPass(): number {
        return this._blurTextureRatioPerPass;
    }

    /**
     * Sets how much smaller we should make the texture between the 2 consecutive bi lateral passes.
     */
    @editableInPropertyPage("Pass Texture Ratio", PropertyTypeForEdition.Float, "PROPERTIES", {
        min: 0,
        max: 1,
        notifiers: { rebuild: true },
    })
    public set blurTextureRatioPerPass(value: number) {
        this._blurTextureRatioPerPass = value;
        this._intermediateBlurV.blurTextureRatio = value;
        this._intermediateBlurH.blurTextureRatio = value;
        this._finalBlurV.blurTextureRatio = value * value;
        this._finalBlurH.blurTextureRatio = value * value;
    }

    /**
     * Gets how far the kernel might fetch the data from.
     */
    public get blurSize(): number {
        return this._blurSize;
    }

    /**
     * Sets how far the kernel might fetch the data from.
     */
    @editableInPropertyPage("Size", PropertyTypeForEdition.Float, "PROPERTIES", {
        notifiers: { rebuild: true },
    })
    public set blurSize(value: number) {
        this._blurSize = value;
        this._intermediateBlurV.blurHorizontalWidth = value;
        this._intermediateBlurH.blurVerticalWidth = value;
        this._finalBlurV.blurHorizontalWidth = value;
        this._finalBlurH.blurVerticalWidth = value;
    }

    /**
     * Instantiates a new Block.
     * @param smartFilter - The smart filter this block belongs to
     * @param name - The friendly name of the block
     */
    constructor(smartFilter: SmartFilter, name: string) {
        super(smartFilter, name);

        const internalFilter = new SmartFilter(name + "_BlurBlock_Aggregated");
        this._intermediateBlurV = new DirectionalBlurBlock(internalFilter, name + "IV");
        this._intermediateBlurH = new DirectionalBlurBlock(internalFilter, name + "IH");
        this._finalBlurV = new DirectionalBlurBlock(internalFilter, name + "V");
        this._finalBlurH = new DirectionalBlurBlock(internalFilter, name + "H");

        this._intermediateBlurV.output.connectTo(this._intermediateBlurH.input);
        this._intermediateBlurH.output.connectTo(this._finalBlurV.input);
        this._finalBlurV.output.connectTo(this._finalBlurH.input);

        this.input = this._registerSubfilterInput("input", [this._intermediateBlurV.input]);
        this.output = this._registerSubfilterOutput("output", this._finalBlurH.output);

        this.blurSize = defaultBlurSize;
        this.blurTextureRatioPerPass = defaultBlurTextureRatioPerPass;
        this._intermediateBlurV.blurVerticalWidth = 0;
        this._intermediateBlurH.blurHorizontalWidth = 0;
        this._finalBlurV.blurVerticalWidth = 0;
        this._finalBlurH.blurHorizontalWidth = 0;
    }
}
