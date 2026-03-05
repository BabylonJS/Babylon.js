import { BlockTools } from "../blockTools";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import type { ConnectionPointPortData } from "./connectionPointPortData";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";

export const RegisterNodePortDesign = (stateManager: StateManager) => {
    stateManager.getPortColor = (portData: IPortData) => {
        const cpd = portData as ConnectionPointPortData;
        if (cpd.connectionKind === "signal") {
            return BlockTools.GetSignalColor();
        }
        return BlockTools.GetColorForDataConnection(cpd.data as FlowGraphDataConnection<any>);
    };

    stateManager.applyNodePortDesign = (portData: IPortData, element: HTMLElement, imgHost: HTMLImageElement, _pip: HTMLDivElement) => {
        const cpd = portData as ConnectionPointPortData;

        if (cpd.connectionKind === "signal") {
            element.style.background = BlockTools.GetSignalColor();
            // Use a triangular arrow SVG for signal ports
            imgHost.src =
                "data:image/svg+xml;base64," +
                btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><polygon points="6,3 16,10 6,17" fill="#fff"/></svg>`);
        } else {
            const color = BlockTools.GetColorForDataConnection(cpd.data as FlowGraphDataConnection<any>);
            element.style.background = color;
            // Circle SVG for data ports
            imgHost.src =
                "data:image/svg+xml;base64," +
                btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" fill="#fff"/></svg>`);
        }

        imgHost.style.width = "100%";
        imgHost.style.height = "100%";

        return false;
    };
};
