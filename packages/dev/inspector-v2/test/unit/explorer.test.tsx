/**
 * @vitest-environment jsdom
 */

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act, type FunctionComponent, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Explorer } from "../../src/components/explorer/explorer";
import { type ExplorerNodeDescription } from "../../src/components/explorer/explorerModel";

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

function GetTreeItem(container: HTMLElement, name: string): HTMLElement {
    const label = [...container.querySelectorAll("span")].find((element) => element.textContent === name);
    const treeItem = label?.closest<HTMLElement>('[role="treeitem"]');
    if (!treeItem) {
        throw new Error(`Unable to find tree item '${name}'.`);
    }
    return treeItem;
}

function Click(element: Element): void {
    act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

function Hover(element: Element): void {
    act(() => element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
}

function PressKey(element: Element, key: string, options?: { ctrlKey?: boolean; shiftKey?: boolean }): void {
    act(() => element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key, code: key, ...options })));
}

const RootEntity = {};
const BranchEntity = {};
const LeafEntity = {};
const GetNodes = (): readonly ExplorerNodeDescription[] => [
    {
        id: "root",
        kind: "root",
        entity: RootEntity,
        getDisplayInfo: () => ({ name: "Root" }),
        getChildren: () => [
            {
                id: "group",
                kind: "group",
                getDisplayInfo: () => ({ name: "Group" }),
                getChildren: () => [
                    {
                        id: "branch",
                        kind: "item",
                        entity: BranchEntity,
                        getDisplayInfo: () => ({ name: "Branch" }),
                        getChildren: () => [
                            {
                                id: "leaf",
                                kind: "item",
                                entity: LeafEntity,
                                getDisplayInfo: () => ({ name: "Leaf" }),
                            },
                        ],
                    },
                ],
            },
        ],
    },
];

const TestExplorer: FunctionComponent = () => (
    <FluentProvider theme={webLightTheme}>
        <Explorer getNodes={GetNodes} itemCommandProviders={[]} groupCommandProviders={[]} />
    </FluentProvider>
);

function RenderSelectionExplorer(root: Root, nodes: readonly ExplorerNodeDescription[], selectedEntity: object, setSelectedEntity: (entity: object | null) => void): void {
    act(() =>
        root.render(
            <FluentProvider theme={webLightTheme}>
                <Explorer getNodes={() => nodes} itemCommandProviders={[]} groupCommandProviders={[]} selectedEntity={selectedEntity} setSelectedEntity={setSelectedEntity} />
            </FluentProvider>
        )
    );
}

describe("Explorer root node", () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
        act(() => root.render(<TestExplorer />));
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    it("starts expanded and supports ordinary mouse and keyboard expansion", () => {
        const rootItem = GetTreeItem(container, "Root");
        expect(rootItem.getAttribute("aria-expanded")).toBe("true");
        expect(GetTreeItem(container, "Group")).toBeTruthy();

        Click(rootItem.querySelector(".fui-TreeItemLayout__expandIcon")!);
        expect(rootItem.getAttribute("aria-expanded")).toBe("false");
        expect(container.textContent).not.toContain("Group");

        PressKey(rootItem, "ArrowRight");
        expect(rootItem.getAttribute("aria-expanded")).toBe("true");
        expect(GetTreeItem(container, "Group")).toBeTruthy();
    });

    it("supports expanding all descendants from the button and modifier shortcuts", () => {
        const rootItem = GetTreeItem(container, "Root");
        Hover(rootItem);
        const expandAllButton = rootItem.querySelector("button");
        expect(expandAllButton).toBeTruthy();

        Click(expandAllButton!);
        expect(GetTreeItem(container, "Leaf")).toBeTruthy();

        PressKey(rootItem, "ArrowLeft", { ctrlKey: true });
        expect(container.textContent).not.toContain("Group");

        PressKey(rootItem, "ArrowRight", { shiftKey: true });
        expect(GetTreeItem(container, "Leaf")).toBeTruthy();
    });

    it("clears a selected entity only after its last represented occurrence disappears", () => {
        const selectedEntity = {};
        const firstParent = {};
        const secondParent = {};
        const setSelectedEntity = vi.fn();
        const makeNodes = (includeFirst: boolean, includeSecond: boolean): readonly ExplorerNodeDescription[] => [
            {
                id: "first",
                entity: firstParent,
                getDisplayInfo: () => ({ name: "First" }),
                getChildren: () => (includeFirst ? [{ id: "selected", entity: selectedEntity, getDisplayInfo: () => ({ name: "Selected" }) }] : []),
            },
            {
                id: "second",
                entity: secondParent,
                getDisplayInfo: () => ({ name: "Second" }),
                getChildren: () => (includeSecond ? [{ id: "selected", entity: selectedEntity, getDisplayInfo: () => ({ name: "Selected" }) }] : []),
            },
        ];

        RenderSelectionExplorer(root, makeNodes(true, false), selectedEntity, setSelectedEntity);
        RenderSelectionExplorer(root, makeNodes(false, true), selectedEntity, setSelectedEntity);
        expect(setSelectedEntity).not.toHaveBeenCalled();

        RenderSelectionExplorer(root, makeNodes(false, false), selectedEntity, setSelectedEntity);
        expect(setSelectedEntity).toHaveBeenCalledExactlyOnceWith(null);
    });

    it("does not clear a selected entity that was never represented by the Explorer", () => {
        const customSelection = {};
        const setSelectedEntity = vi.fn();

        RenderSelectionExplorer(root, [GetNodes()[0]], customSelection, setSelectedEntity);
        RenderSelectionExplorer(root, [], customSelection, setSelectedEntity);

        expect(setSelectedEntity).not.toHaveBeenCalled();
    });
});
