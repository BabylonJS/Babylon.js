import type { IBlockSerializerV1 } from "@babylonjs/smart-filters";
import { blurBlockSerializer } from "../blocks/babylon/demo/effects/blurBlock.serializer.js";
import { directionalBlurBlockSerializer } from "../blocks/babylon/demo/effects/directionalBlurBlock.serializer.js";
import { compositionBlockSerializer } from "../blocks/babylon/demo/effects/compositionBlock.serializer.js";
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
} from "../blocks/blockTypes.js";

/**
 * Any blocks that do not need to make use of ISerializedBlockV1.data can use the default serialization and
 * should go in this list. If the serializer needs to store additional info in ISerializedBlockV1.data (e.g.
 * webcam source name), then it should be registered in additionalBlockSerializers below.
 */
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
export const additionalBlockSerializers: IBlockSerializerV1[] = [
    blurBlockSerializer,
    directionalBlurBlockSerializer,
    compositionBlockSerializer,
];
