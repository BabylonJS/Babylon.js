import type { SmartFilter } from "@babylonjs/smart-filters";
import type { GlobalState } from "../globalState";
import type { GraphCanvasComponent } from "@babylonjs/shared-ui-components/nodeGraphSystem/graphCanvas";

/**
 * Sets the SmartFilter's stored editor data (block locations, canvas position, zoom) using the current graph canvas state.
 * @param smartFilter - Target SmartFilter to update
 * @param globalState - State of the editor
 * @param graphCanvas - Graph canvas to pull data from
 */
export function setEditorData(smartFilter: SmartFilter, globalState: GlobalState, graphCanvas: GraphCanvasComponent) {
    smartFilter.editorData = {
        locations: [],
        x: graphCanvas.x,
        y: graphCanvas.y,
        zoom: graphCanvas.zoom,
    };

    for (const block of smartFilter.attachedBlocks) {
        const node = globalState.onGetNodeFromBlock(block);
        if (node) {
            smartFilter.editorData.locations.push({
                blockId: block.uniqueId,
                x: node.x,
                y: node.y,
                isCollapsed: node.isCollapsed,
            });
        }
    }
}
