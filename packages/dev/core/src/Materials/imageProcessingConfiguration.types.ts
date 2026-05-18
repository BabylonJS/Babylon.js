/* eslint-disable @typescript-eslint/naming-convention */
import { type ImageProcessingConfigurationParse } from "./imageProcessingConfiguration.pure";

type ImageProcessingConfigurationParseType = typeof ImageProcessingConfigurationParse;

declare module "./imageProcessingConfiguration.pure" {
    namespace ImageProcessingConfiguration {
        export let Parse: ImageProcessingConfigurationParseType;
    }
}
