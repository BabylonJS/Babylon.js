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
        contentArea.innerHTML = data.data.value.toString();
    }
    getBackgroundColor(data: INodeData): string {
        return ValueBlockBackgroundColor;
    }
    getHeaderText(data: INodeData): string {
        return data.name;
    }
}
