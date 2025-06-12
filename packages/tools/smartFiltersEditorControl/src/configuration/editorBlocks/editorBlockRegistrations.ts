import { ConnectionPointType, InputBlock, type SmartFilter } from "@babylonjs/smart-filters";
import { TimeInputBlockName, WebCamInputBlockName } from "./blockNames.js";
import { type IBlockRegistration, inputsNamespace } from "@babylonjs/smart-filters-blocks";

/**
 * The block registrations for special blocks for ease of use in the editor.
 */
export const editorBlockRegistrations: IBlockRegistration[] = [
    {
        blockType: WebCamInputBlockName,
        namespace: inputsNamespace,
        isInput: true,
        tooltip: "Supplies a texture from a webcam",
        factory: async (smartFilter: SmartFilter) => {
            const module = await import(/* webpackChunkName: "webCamBlock" */ "./webCamInputBlock/webCamInputBlock.js");
            return new module.WebCamInputBlock(smartFilter);
        },
    },
    {
        blockType: TimeInputBlockName,
        namespace: inputsNamespace,
        isInput: true,
        tooltip: "Supplies a float value representing the current time",
        factory: (smartFilter: SmartFilter) => {
            const inputBlock = new InputBlock(smartFilter, "Time", ConnectionPointType.Float, 0.0);
            inputBlock.editorData = {
                animationType: "time",
                valueDeltaPerMs: 0.001,
                min: null,
                max: null,
            };
            return Promise.resolve(inputBlock);
        },
    },
];
