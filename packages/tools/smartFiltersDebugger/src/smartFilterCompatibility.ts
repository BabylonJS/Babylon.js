import { type SmartFilterEditorOptions } from "smart-filters-editor-control";

type SmartFilterHostWindow = {
    currentSmartFilter?: unknown;
    thinEngine?: unknown;
};

type CompatibleSmartFilter = NonNullable<SmartFilterEditorOptions["filter"]>;

/**
 * Whether a value exposes the graph capabilities required by the debugger.
 * @param value - The value to inspect
 * @returns Whether the value can be displayed as a Smart Filter
 */
export function IsCompatibleSmartFilter(value: unknown): value is CompatibleSmartFilter {
    if (!value || typeof value !== "object") {
        return false;
    }

    const smartFilter = value as {
        name?: unknown;
        attachedBlocks?: unknown;
        output?: unknown;
        outputBlock?: unknown;
        getClassName?: unknown;
    };

    if (
        typeof smartFilter.name !== "string" ||
        !Array.isArray(smartFilter.attachedBlocks) ||
        !smartFilter.output ||
        typeof smartFilter.output !== "object" ||
        !smartFilter.outputBlock ||
        typeof smartFilter.outputBlock !== "object" ||
        typeof smartFilter.getClassName !== "function"
    ) {
        return false;
    }

    try {
        return smartFilter.getClassName() === "SmartFilter";
    } catch {
        return false;
    }
}

/**
 * Gets editor options for a compatible Smart Filter exposed by a host page.
 * @param hostWindow - The host page globals
 * @returns Editor options, or null when no compatible filter is available
 */
export function GetSmartFilterEditorOptions(hostWindow: SmartFilterHostWindow): SmartFilterEditorOptions | null {
    if (!IsCompatibleSmartFilter(hostWindow.currentSmartFilter)) {
        return null;
    }

    return {
        filter: hostWindow.currentSmartFilter,
        engine: hostWindow.thinEngine as SmartFilterEditorOptions["engine"],
    };
}
