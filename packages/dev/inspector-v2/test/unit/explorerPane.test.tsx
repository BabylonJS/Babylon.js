// @vitest-environment jsdom

import { act, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Observable } from "core/Misc/observable";

import { type ExplorerNodeDescription } from "../../src/components/explorer/explorerModel";
import { CreateExplorerPaneRegistration } from "../../src/services/panes/explorer/explorerPane";
import { CreateExplorerService } from "../../src/services/panes/explorer/explorerService";
import { type ISelectionService } from "../../src/services/selectionService";
import { type IShellService, type SidePaneDefinition } from "shared-ui-components/modularTool/services/shellService";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

vi.mock("../../src/components/explorer/explorer", () => ({
    Explorer: ({ getNodes }: { getNodes: () => readonly ExplorerNodeDescription[] }) => {
        const children = getNodes()[0]?.getChildren?.() ?? [];
        return (
            <>
                {children.map((node) => (
                    <span key={node.id}>{node.getDisplayInfo().name}</span>
                ))}
            </>
        );
    },
}));

describe("Explorer pane", () => {
    const containers: HTMLElement[] = [];

    afterEach(() => {
        containers.forEach((container) => container.remove());
        containers.length = 0;
    });

    it("refreshes and cleans up node provider change observations", async () => {
        const providerChanged = new Observable<void>();
        const explorerService = CreateExplorerService();
        const parent = {};
        let childName = "First";
        const providerRegistration = explorerService.addNodeProvider({
            predicate: (entity): entity is object => entity === parent,
            getNodes: () => [{ id: "child", entity: {}, getDisplayInfo: () => ({ name: childName }) }],
            onChanged: providerChanged,
        });
        let PaneContent: ComponentType | undefined;
        const shellService = {
            addSidePane: (pane: SidePaneDefinition) => {
                PaneContent = pane.content;
                return { dispose: vi.fn() };
            },
        } as unknown as IShellService;
        const selectionChanged = new Observable<object>();
        const selectionService = {
            selectedEntity: null,
            onSelectedEntityChanged: selectionChanged,
        } as unknown as ISelectionService;

        CreateExplorerPaneRegistration(shellService, selectionService, {
            key: "Explorer",
            title: "Explorer",
            getRoot: () => parent,
            rootLabel: "Root",
            getNodes: () => [],
            nodeProviders: explorerService.nodeProviders,
        });
        if (!PaneContent) {
            throw new Error("Expected the Explorer pane to be registered.");
        }

        const container = document.createElement("div");
        containers.push(container);
        const root = createRoot(container);
        await act(async () => root.render(<PaneContent />));
        expect(container.textContent).toBe("First");
        expect(providerChanged.hasObservers()).toBe(true);
        expect(providerChanged.observers).toHaveLength(1);

        childName = "Second";
        await act(async () => providerChanged.notifyObservers());
        expect(container.textContent).toBe("Second");
        expect(providerChanged.observers).toHaveLength(1);

        await act(async () => providerRegistration.dispose());
        expect(container.textContent).toBe("");
        expect(providerChanged.observers).toHaveLength(0);

        await act(async () => root.unmount());
        explorerService.dispose();
    });
});
