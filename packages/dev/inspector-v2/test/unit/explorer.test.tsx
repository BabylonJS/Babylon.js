// @vitest-environment jsdom

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { TargetRegular } from "@fluentui/react-icons";
import { act, type FunctionComponent, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Observable } from "core/Misc/observable";
import { type IReactContextService } from "shared-ui-components/modularTool/services/reactContextService";
import { SettingsStore } from "shared-ui-components/modularTool/services/settingsStore";
import { Explorer } from "../../src/components/explorer/explorer";
import { type ExplorerCommand, type ExplorerCommandProvider, type ExplorerNodeDescription } from "../../src/components/explorer/explorerModel";
import { MakeWatcherServiceDefinitions } from "../../src/services/watcherService";

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

function RenderCommandExplorer(root: Root, entity: object, provider: ExplorerCommandProvider<object>): void {
    act(() =>
        root.render(
            <FluentProvider theme={webLightTheme}>
                <Explorer getNodes={() => [{ id: "target", entity, getDisplayInfo: () => ({ name: "Target" }) }]} itemCommandProviders={[provider]} groupCommandProviders={[]} />
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

    it("disposes display metadata when topology rebuilds", () => {
        const firstDispose = vi.fn();
        const firstEntity = {};
        const secondEntity = {};

        RenderSelectionExplorer(root, [{ id: "first", entity: firstEntity, getDisplayInfo: () => ({ name: "First", dispose: firstDispose }) }], firstEntity, vi.fn());
        expect(firstDispose).not.toHaveBeenCalled();

        RenderSelectionExplorer(root, [{ id: "second", entity: secondEntity, getDisplayInfo: () => ({ name: "Second" }) }], secondEntity, vi.fn());
        expect(firstDispose).toHaveBeenCalledOnce();
    });

    it("disposes item and group commands when their providers are removed", () => {
        const itemDispose = vi.fn();
        const groupDispose = vi.fn();
        const itemEntity = {};
        const childEntity = {};
        const nodes: readonly ExplorerNodeDescription[] = [
            { id: "item", entity: itemEntity, getDisplayInfo: () => ({ name: "Item" }) },
            {
                id: "group",
                kind: "group",
                getDisplayInfo: () => ({ name: "Group" }),
                getChildren: () => [{ id: "child", entity: childEntity, getDisplayInfo: () => ({ name: "Child" }) }],
            },
        ];
        const itemCommandProvider = {
            predicate: (context: unknown): context is object => context === itemEntity,
            getCommand: () => ({
                type: "action",
                displayName: "Inspect",
                icon: () => null,
                execute: () => {},
                dispose: itemDispose,
            }),
        } satisfies ExplorerCommandProvider<object>;
        const groupCommandProvider = {
            predicate: (context: unknown): context is "Group" => context === "Group",
            getCommand: () => ({
                type: "action",
                mode: "contextMenu",
                displayName: "Create",
                execute: () => {},
                dispose: groupDispose,
            }),
        } satisfies ExplorerCommandProvider<"Group", "contextMenu">;
        const render = (itemCommandProviders: readonly ExplorerCommandProvider<object>[], groupCommandProviders: readonly ExplorerCommandProvider<string, "contextMenu">[]) => {
            act(() =>
                root.render(
                    <FluentProvider theme={webLightTheme}>
                        <Explorer getNodes={() => nodes} itemCommandProviders={itemCommandProviders} groupCommandProviders={groupCommandProviders} />
                    </FluentProvider>
                )
            );
        };

        render([itemCommandProvider], [groupCommandProvider]);
        expect(itemDispose).not.toHaveBeenCalled();
        expect(groupDispose).not.toHaveBeenCalled();

        render([], []);
        expect(itemDispose).toHaveBeenCalledOnce();
        expect(groupDispose).toHaveBeenCalledOnce();
    });

    it.each(["isVisible", "showBoundingBox"] as const)("toggles a watcher-backed %s command twice in manual watch mode without Refresh", (propertyKey) => {
        const target = { isVisible: true, showBoundingBox: false };
        const reactContextService: IReactContextService = {
            addContext: () => ({ updateValue: () => {}, dispose: () => {} }),
        };
        const watcher = MakeWatcherServiceDefinitions({ defaultSettings: { mode: "manual" } }).watcherServiceDefinition.factory(
            new SettingsStore("Explorer command tests"),
            reactContextService
        );
        const refresh = vi.spyOn(watcher, "refresh");
        const onChange = new Observable<void>();
        const changed = vi.fn();
        onChange.add(changed);
        const registration = watcher.watchProperty(target, propertyKey, () => onChange.notifyObservers());
        const command = {
            type: "toggle",
            displayName: `Toggle ${propertyKey}`,
            icon: TargetRegular,
            get isEnabled() {
                return propertyKey === "isVisible" ? !target.isVisible : target.showBoundingBox;
            },
            set isEnabled(value: boolean) {
                target[propertyKey] = propertyKey === "isVisible" ? !value : value;
            },
            onChange,
            dispose: () => registration.dispose(),
        } satisfies ExplorerCommand<"inline", "toggle">;

        try {
            RenderCommandExplorer(root, target, { predicate: (entity): entity is object => entity === target, getCommand: () => command });
            Hover(GetTreeItem(container, "Target"));
            const button = GetTreeItem(container, "Target").querySelector<HTMLButtonElement>("button[aria-pressed]")!;
            expect(button.getAttribute("aria-pressed")).toBe("false");

            Click(button);
            expect(command.isEnabled).toBe(true);
            expect(button.getAttribute("aria-pressed")).toBe("true");
            Click(button);
            expect(command.isEnabled).toBe(false);
            expect(button.getAttribute("aria-pressed")).toBe("false");
            expect(refresh).not.toHaveBeenCalled();
            expect(changed).not.toHaveBeenCalled();

            command.isEnabled = true;
            expect(button.getAttribute("aria-pressed")).toBe("false");
            act(() => watcher.refresh());
            expect(button.getAttribute("aria-pressed")).toBe("true");
            expect(changed).toHaveBeenCalledOnce();
        } finally {
            act(() => root.render(<TestExplorer />));
            watcher.dispose?.();
        }
    });

    it("renders the accepted command state when its setter rejects a toggle", () => {
        const target = {};
        const request = vi.fn<(value: boolean) => void>();
        RenderCommandExplorer(root, target, {
            predicate: (entity): entity is object => entity === target,
            getCommand: () => ({
                type: "toggle",
                displayName: "Rejected Toggle",
                icon: TargetRegular,
                get isEnabled() {
                    return false;
                },
                set isEnabled(value: boolean) {
                    request(value);
                },
            }),
        });
        Hover(GetTreeItem(container, "Target"));
        const button = GetTreeItem(container, "Target").querySelector<HTMLButtonElement>("button[aria-pressed]")!;
        Click(button);
        Click(button);
        expect(request.mock.calls).toEqual([[true], [true]]);
        expect(button.getAttribute("aria-pressed")).toBe("false");
    });
});
