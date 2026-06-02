/* eslint-disable @typescript-eslint/naming-convention */
import { type MultiMaterialParseMultiMaterial } from "./multiMaterial.pure";

type MultiMaterialParseMultiMaterialType = typeof MultiMaterialParseMultiMaterial;

declare module "./multiMaterial.pure" {
    namespace MultiMaterial {
        export let ParseMultiMaterial: MultiMaterialParseMultiMaterialType;
    }
}
