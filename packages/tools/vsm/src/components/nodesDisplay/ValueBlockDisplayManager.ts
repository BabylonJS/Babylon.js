import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import styles from "./CommonStyles.modules.scss";

const ValueBlockBackgroundColor = "grey";

export class ValueBlockDisplayManager implements IDisplayManager {
    getHeaderClass(data: INodeData): string {
        return styles.noBorder;
    }
    shouldDisplayPortLabels(data: IPortData): boolean {
        return false;
    }
    updatePreviewContent(data: INodeData, contentArea: HTMLDivElement): void {
        contentArea.classList.add(styles.textContent);
        // contentArea.innerHTML = data.data.value.toString();
        const value = data.data.value;

        const cont = document.createElement("div");
        cont.classList.add(styles.vectorInputDisplay);
        contentArea.appendChild(cont);

        const ix = document.createElement("input");
        ix.type = "number";
        contentArea.appendChild(ix);
        ix.value = value.x.toString();
        ix.classList.add(styles.numberInput);

        const iy = document.createElement("input");
        iy.type = "number";
        contentArea.appendChild(iy);
        iy.value = value.y.toString();
        iy.classList.add(styles.numberInput);

        const iz = document.createElement("input");
        iz.type = "number";
        contentArea.appendChild(iz);
        iz.value = value.z.toString();
        iz.classList.add(styles.numberInput);
    }
    getBackgroundColor(data: INodeData): string {
        return ValueBlockBackgroundColor;
    }
    getHeaderText(data: INodeData): string {
        return data.name;
    }
}
