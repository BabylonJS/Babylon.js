import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import { ConnectionPointType, InputBlock, SmartFilter, createImageTexture } from "@babylonjs/smart-filters";
import { ExposureBlock, ContrastBlock, DesaturateBlock } from "@babylonjs/smart-filters-blocks";
import { HardCodedSmartFilterNames } from "./hardCodedSmartFilterNames";

export function createSimplePhotoEditSmartFilter(engine: ThinEngine): SmartFilter {
    const smartFilter = new SmartFilter(HardCodedSmartFilterNames.simplePhotoEdit);

    const photoTexture = createImageTexture(engine, "/assets/kittens.jpg");

    const exposureBlock = new ExposureBlock(smartFilter, "exposure");
    const contrastBlock = new ContrastBlock(smartFilter, "contrast");
    const desaturateBlock = new DesaturateBlock(smartFilter, "desaturate");

    const photoInput = new InputBlock(smartFilter, "photo", ConnectionPointType.Texture, photoTexture);
    const exposureDisabled = new InputBlock(smartFilter, "exposureDisabled", ConnectionPointType.Boolean, false);
    const contrastDisabled = new InputBlock(smartFilter, "contrastDisabled", ConnectionPointType.Boolean, false);
    const desaturateDisabled = new InputBlock(smartFilter, "desaturateDisabled", ConnectionPointType.Boolean, false);

    const exposureAmount = new InputBlock(smartFilter, "exposureAmount", ConnectionPointType.Float, 1.04);
    const contrastIntensity = new InputBlock(smartFilter, "contrastIntensity", ConnectionPointType.Float, 0.54);
    const desaturateIntensity = new InputBlock(smartFilter, "desaturateIntensity", ConnectionPointType.Float, 1.09);

    photoInput.output.connectTo(exposureBlock.input);

    exposureDisabled.output.connectTo(exposureBlock.disabled);
    exposureAmount.output.connectTo(exposureBlock.amount);
    exposureBlock.output.connectTo(contrastBlock.input);

    contrastDisabled.output.connectTo(contrastBlock.disabled);
    contrastIntensity.output.connectTo(contrastBlock.intensity);
    contrastBlock.output.connectTo(desaturateBlock.input);

    desaturateDisabled.output.connectTo(desaturateBlock.disabled);
    desaturateIntensity.output.connectTo(desaturateBlock.intensity);
    desaturateBlock.output.connectTo(smartFilter.output);

    return smartFilter;
}
