// @vitest-environment jsdom

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act, type ComponentType, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { Observable } from "core/Misc/observable";

import { CreateExplorerPaneRegistration } from "../../src/services/panes/explorer/explorerPane";
import { CreateExplorerService } from "../../src/services/panes/explorer/explorerService";
import { type ISelectionService } from "../../src/services/selectionService";
import { type IShellService, type SidePaneDefinition } from "shared-ui-components/modularTool/services/shellService";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }))
    );
    vi.stubGlobal(
        "ResizeObserver",
        class {
            public observe = vi.fn();
            public unobserve = vi.fn();
            public disconnect = vi.fn();
        }
    );
});

vi.mock("@fluentui-contrib/react-virtualizer", async () => {
    const { Fragment, createElement } = await import("react");

    return {
        VirtualizerScrollView: (props: { numItems: number; children: (index: number) => ReactElement }) =>
            createElement(Fragment, null, ...Array.from({ length: props.numItems }, (_, index) => props.children(index))),
    };
});

vi.mock("../../src/components/explorer/explorerDragDrop", () => ({
    useExplorerDragDrop: () => ({
        draggedEntity: null,
        dropTarget: null,
        dropTargetIsRoot: false,
        createDragProps: () => ({}),
        createGroupDropProps: () => ({}),
    }),
}));

vi.mock("shared-ui-components/modularTool/hooks/settingsHooks", () => ({
    useSetting: <T,>(descriptor: { defaultValue: T }) => [descriptor.defaultValue, vi.fn(), vi.fn()],
}));

describe("Explorer pane selection reconciliation", () => {
    it("clears selection when a provider notification removes the last represented occurrence", async () => {
        const explorerService = CreateExplorerService();
        const rootEntity = {};
        const selectedEntity = {};
        const entities = [selectedEntity];
        const providerChanged = new Observable<void>();
        explorerService.addNodeProvider({
            predicate: (entity): entity is object => entity === rootEntity,
            getNodes: () => entities.map((entity) => ({ id: "selected", entity, getDisplayInfo: () => ({ name: "Selected" }) })),
            onChanged: providerChanged,
        });

        let PaneContent: ComponentType | undefined;
        const shellService = {
            addSidePane: (pane: SidePaneDefinition) => {
                PaneContent = pane.content;
                return { dispose: vi.fn() };
            },
        } as unknown as IShellService;
        const selectionChanged = new Observable<void>();
        let currentSelection: object | null = selectedEntity;
        const selectionService = {
            get selectedEntity() {
                return currentSelection;
            },
            set selectedEntity(entity) {
                currentSelection = entity;
                selectionChanged.notifyObservers();
            },
            onSelectedEntityChanged: selectionChanged,
        } satisfies ISelectionService;

        const paneRegistration = CreateExplorerPaneRegistration(shellService, selectionService, {
            key: "Explorer",
            title: "Explorer",
            getRoot: () => rootEntity,
            rootLabel: "Root",
            getNodes: () => [],
            nodeProviders: explorerService.nodeProviders,
        });
        if (!PaneContent) {
            throw new Error("Expected the Explorer pane to be registered.");
        }
        const PaneComponent = PaneContent;

        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);
        await act(async () =>
            root.render(
                <FluentProvider theme={webLightTheme}>
                    <PaneComponent />
                </FluentProvider>
            )
        );
        expect(container.textContent).toContain("Selected");
        expect(selectionService.selectedEntity).toBe(selectedEntity);

        entities.splice(0, 1);
        await act(async () => providerChanged.notifyObservers());
        expect(container.textContent).not.toContain("Selected");
        expect(selectionService.selectedEntity).toBeNull();

        await act(async () => root.unmount());
        container.remove();
        paneRegistration.dispose();
        explorerService.dispose();
    });
});
