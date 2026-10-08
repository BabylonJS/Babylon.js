// @vitest-environment jsdom

import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type IButtonLineComponentProps } from "../../src/lines/buttonLineComponent";
import { GraphCanvasComponent } from "../../src/nodeGraphSystem/graphCanvas";
import { GraphFrame } from "../../src/nodeGraphSystem/graphFrame";
import { type INodeData } from "../../src/nodeGraphSystem/interfaces/nodeData";
import { StateManager } from "../../src/nodeGraphSystem/stateManager";
import { TeleportInPropertyComponent } from "../../src/nodeGraphSystem/teleportInPropertyComponent";

vi.mock("../../src/lines/buttonLineComponent", () => {
    const ButtonLineComponent: React.FunctionComponent<IButtonLineComponentProps> = (props) => {
        const { label, isDisabled, onClick } = props;
        return React.createElement("button", { disabled: isDisabled, onClick }, label);
    };
    return { ButtonLineComponent };
});

function createNodeData(data: object = {}, endpoints?: object[]): INodeData {
    return {
        data,
        name: "Test node",
        uniqueId: 1,
        isInput: false,
        comments: "",
        inputs: [],
        outputs: [],
        invisibleEndpoints: endpoints,
        prepareHeaderIcon: () => {},
        getClassName: () => "TestNode",
        dispose: () => {},
        getPortByName: () => null,
    };
}

describe("Teleport reference focus", () => {
    let host: HTMLDivElement;
    let root: Root;
    let stateManager: StateManager;

    beforeEach(() => {
        host = document.createElement("div");
        document.body.appendChild(host);
        root = createRoot(host);
        stateManager = new StateManager();
        stateManager.hostDocument = document;
    });

    afterEach(() => {
        flushSync(() => root.unmount());
        host.remove();
    });

    function renderControl(nodeData: INodeData) {
        flushSync(() => root.render(React.createElement(TeleportInPropertyComponent, { nodeData, stateManager })));
    }

    function getButton() {
        const button = host.querySelector("button");
        if (!button) {
            throw new Error("Teleport focus button was not rendered.");
        }
        return button;
    }

    function renderCanvas() {
        const ref = React.createRef<GraphCanvasComponent>();
        flushSync(() =>
            root.render(
                React.createElement(GraphCanvasComponent, {
                    ref,
                    stateManager,
                    onEmitNewNode: (nodeData) => {
                        if (!ref.current) {
                            throw new Error("Graph canvas was not mounted.");
                        }
                        return ref.current.appendNode(nodeData);
                    },
                })
            )
        );
        const canvas = ref.current;
        if (!canvas) {
            throw new Error("Graph canvas was not mounted.");
        }
        Object.defineProperties(canvas.hostCanvas, {
            clientWidth: { value: 800, configurable: true },
            clientHeight: { value: 600, configurable: true },
        });
        return canvas;
    }

    it("visits references in order and wraps without changing selection", () => {
        const endpoints = [{ name: "First" }, { name: "Second" }, { name: "Third" }];
        const focused = vi.fn();
        const selected = vi.fn();
        stateManager.onFocusNodeObservable.add(focused);
        stateManager.onSelectionChangedObservable.add(selected);
        renderControl(createNodeData({}, endpoints));

        for (let i = 0; i < 4; i++) {
            getButton().click();
        }

        expect(focused.mock.calls.map(([endpoint]) => endpoint)).toEqual([...endpoints, endpoints[0]]);
        expect(selected).not.toHaveBeenCalled();
    });

    it("disables an entry with no references and refreshes when references change", () => {
        const endpoints: object[] = [];
        renderControl(createNodeData({}, endpoints));
        expect(getButton().disabled).toBe(true);

        endpoints.push({});
        flushSync(() => stateManager.onUpdateRequiredObservable.notifyObservers(null));
        expect(getButton().disabled).toBe(false);

        endpoints.length = 0;
        flushSync(() => stateManager.onUpdateRequiredObservable.notifyObservers(null));
        expect(getButton().disabled).toBe(true);
    });

    it("can repeatedly focus a single reference", () => {
        const endpoint = {};
        const focused = vi.fn();
        stateManager.onFocusNodeObservable.add(focused);
        renderControl(createNodeData({}, [endpoint]));

        getButton().click();
        getButton().click();

        expect(focused.mock.calls.map(([data]) => data)).toEqual([endpoint, endpoint]);
    });

    it("refreshes references after a graph rebuild", () => {
        const endpoints: object[] = [];
        renderControl(createNodeData({}, endpoints));
        expect(getButton().disabled).toBe(true);

        endpoints.push({});
        flushSync(() => stateManager.onRebuildRequiredObservable.notifyObservers());

        expect(getButton().disabled).toBe(false);
    });

    it("ignores a click when the last reference was removed before the property refresh", () => {
        const endpoints = [{}];
        const focused = vi.fn();
        stateManager.onFocusNodeObservable.add(focused);
        renderControl(createNodeData({}, endpoints));
        endpoints.length = 0;

        getButton().click();

        expect(focused).not.toHaveBeenCalled();
    });

    it("uses live references after removal and addition", () => {
        const first = {};
        const second = {};
        const third = {};
        const endpoints = [first, second];
        const focused = vi.fn();
        stateManager.onFocusNodeObservable.add(focused);
        renderControl(createNodeData({}, endpoints));

        getButton().click();
        endpoints.shift();
        getButton().click();
        endpoints.push(third);
        getButton().click();

        expect(focused.mock.calls.map(([endpoint]) => endpoint)).toEqual([first, second, third]);
    });

    it("starts at the first reference when another entry is selected", () => {
        const shared = {};
        const next = {};
        const focused = vi.fn();
        stateManager.onFocusNodeObservable.add(focused);
        renderControl(createNodeData({}, [shared]));
        getButton().click();

        renderControl(createNodeData({}, [shared, next]));
        getButton().click();

        expect(focused.mock.calls.map(([endpoint]) => endpoint)).toEqual([shared, shared]);
    });

    it("removes the property's update observer on unmount", () => {
        renderControl(createNodeData({}, []));
        expect(stateManager.onUpdateRequiredObservable.hasObservers()).toBe(true);
        expect(stateManager.onRebuildRequiredObservable.hasObservers()).toBe(true);

        flushSync(() => root.render(null));

        expect(stateManager.onUpdateRequiredObservable.hasObservers()).toBe(false);
        expect(stateManager.onRebuildRequiredObservable.hasObservers()).toBe(false);
    });

    it.each([0.5, 1, 2])("centers a distant node at zoom %s and preserves the selected entry", (zoom) => {
        const canvas = renderCanvas();
        const entry = canvas.appendNode(createNodeData());
        const endpoint = {};
        const target = canvas.appendNode(createNodeData(endpoint));
        Object.defineProperties(target.rootElement, {
            clientWidth: { value: 200, configurable: true },
            clientHeight: { value: 80, configurable: true },
        });
        target.x = 1200;
        target.y = -600;
        canvas.zoom = zoom;
        stateManager.onSelectionChangedObservable.notifyObservers({ selection: entry });

        stateManager.onFocusNodeObservable.notifyObservers(endpoint);

        expect(canvas.x + (target.x + target.width / 2) * canvas.zoom).toBe(400);
        expect(canvas.y + (target.y + target.height / 2) * canvas.zoom).toBe(300);
        expect(canvas.zoom).toBe(zoom);
        expect(canvas.selectedNodes).toEqual([entry]);
        expect(stateManager.activeNode).toBe(entry);
    });

    it("reports references absent from the graph", () => {
        renderCanvas();
        const error = vi.fn();
        stateManager.onErrorMessageDialogRequiredObservable.add(error);

        stateManager.onFocusNodeObservable.notifyObservers({});

        expect(error).toHaveBeenCalledWith("The referenced node is not available in the graph.", expect.anything());
    });

    it("reveals a reference inside a collapsed frame before centering it", () => {
        const canvas = renderCanvas();
        const endpoint = {};
        const target = canvas.appendNode(createNodeData(endpoint));
        const frame = new GraphFrame(null, canvas, true);
        canvas.frames.push(frame);
        frame.nodes.push(target);
        frame.isCollapsed = true;
        expect(target.isVisible).toBe(false);

        stateManager.onFocusNodeObservable.notifyObservers(endpoint);

        expect(frame.isCollapsed).toBe(false);
        expect(target.isVisible).toBe(true);
        expect(canvas.x + (target.x + target.width / 2) * canvas.zoom).toBe(400);
        expect(canvas.y + (target.y + target.height / 2) * canvas.zoom).toBe(300);
    });

    it("removes the canvas focus observer on unmount", () => {
        renderCanvas();
        expect(stateManager.onFocusNodeObservable.hasObservers()).toBe(true);

        flushSync(() => root.render(null));

        expect(stateManager.onFocusNodeObservable.hasObservers()).toBe(false);
    });
});
