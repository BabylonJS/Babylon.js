import { ConnectionPointType, InputBlock, type SmartFilter } from "smart-filters";
import { TimeInputBlockName, WebCamInputBlockName } from "./blockNames.js";
import { type IBlockRegistration, inputsNamespace } from "smart-filters-blocks";

/**
 * The block registrations for special blocks for ease of use in the editor.
 */
export const EditorBlockRegistrations: IBlockRegistration[] = [
    {
        blockType: WebCamInputBlockName,
        namespace: inputsNamespace,
        isInput: true,
        tooltip: "Supplies a texture from a webcam",
        // eslint-disable-next-line @typescript-eslint/naming-convention
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
        // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/promise-function-async
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
