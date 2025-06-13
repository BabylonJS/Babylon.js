import type { IBlockSerializerV1 } from "@babylonjs/smart-filters";
import { BlurBlockSerializer } from "../blocks/babylon/demo/effects/blurBlock.serializer";
import { DirectionalBlurBlockSerializer } from "../blocks/babylon/demo/effects/directionalBlurBlock.serializer";
import { CompositionBlockSerializer } from "../blocks/babylon/demo/effects/compositionBlock.serializer";
import {
    blackAndWhiteBlockType,
    pixelateBlockType,
    exposureBlockType,
    contrastBlockType,
    desaturateBlockType,
    posterizeBlockType,
    kaleidoscopeBlockType,
    greenScreenBlockType,
    maskBlockType,
    particleBlockType,
    spritesheetBlockType,
    tintBlockType,
    premultiplyAlphaBlockType,
    wipeBlockType,
} from "../blocks/blockTypes";

/**
 * Any blocks that do not need to make use of ISerializedBlockV1.data can use the default serialization and
 * should go in this list. If the serializer needs to store additional info in ISerializedBlockV1.data (e.g.
 * webcam source name), then it should be registered in additionalBlockSerializers below.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const blocksUsingDefaultSerialization: string[] = [
    blackAndWhiteBlockType,
    pixelateBlockType,
    exposureBlockType,
    contrastBlockType,
    desaturateBlockType,
    posterizeBlockType,
    kaleidoscopeBlockType,
    greenScreenBlockType,
    maskBlockType,
    particleBlockType,
    spritesheetBlockType,
    tintBlockType,
    premultiplyAlphaBlockType,
    wipeBlockType,
];

/**
 * Any blocks which require serializing more information than just the connections should be registered here.
 * They should make use of the ISerializedBlockV1.data field to store this information.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const additionalBlockSerializers: IBlockSerializerV1[] = [BlurBlockSerializer, DirectionalBlurBlockSerializer, CompositionBlockSerializer];
