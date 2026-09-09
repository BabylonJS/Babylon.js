/**
 * @vitest-environment jsdom
 */

import { act, type FunctionComponent } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type IDisposable } from "core/index";
import { BoundProperty, ComputedProperty } from "../../src/components/properties/boundProperty";
import { WatcherContext } from "../../src/contexts/watcherContext";
import { type IWatcherService } from "../../src/services/watcherService";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

type Target = {
    name?: string;
};

type TestInputProps = {
    value?: string;
    onChange?: (value: string) => void;
    nullable?: boolean;
};

const NoOpDisposable: IDisposable = {
    dispose: () => {},
};

const TestWatcher: IWatcherService = {
    watchProperty: () => NoOpDisposable,
    watchValue: (getValue, onChanged) => {
        refreshComputedValue = () => onChanged(getValue());
        return NoOpDisposable;
    },
    refresh: () => {},
};

let refreshComputedValue = () => {};

describe("BoundProperty", () => {
    let container: HTMLDivElement;
    let root: Root;
    let inputProps: TestInputProps | undefined;

    const TestInput: FunctionComponent<TestInputProps> = (props) => {
        inputProps = props;
        return null;
    };

    const render = (target: Target) => {
        act(() =>
            root.render(
                <WatcherContext.Provider value={TestWatcher}>
                    <BoundProperty component={TestInput} target={target} propertyKey="name" ignoreNullable defaultValue="" />
                </WatcherContext.Provider>
            )
        );
    };

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
        inputProps = undefined;
        refreshComputedValue = () => {};
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    it("allows an extensible target to add a missing property", () => {
        const target: Target = {};

        render(target);
        expect(inputProps?.onChange).toBeTypeOf("function");

        act(() => inputProps?.onChange?.("Scene"));
        expect(target.name).toBe("Scene");
    });

    it("does not allow a non-extensible target to add a missing property", () => {
        const target: Target = Object.preventExtensions({});

        render(target);
        expect(inputProps?.onChange).toBeUndefined();
        expect("name" in target).toBe(false);
    });
});

describe("ComputedProperty", () => {
    it("passes a watcher-backed computed value to the property-line component", () => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);
        const target = { values: [1] };
        let value: number | undefined;
        const TestOutput: FunctionComponent<{ value: number }> = (props) => {
            value = props.value;
            return null;
        };

        act(() =>
            root.render(
                <WatcherContext.Provider value={TestWatcher}>
                    <ComputedProperty component={TestOutput} target={target} getValue={(currentTarget) => currentTarget.values.length} />
                </WatcherContext.Provider>
            )
        );
        expect(value).toBe(1);

        target.values.push(2);
        act(() => refreshComputedValue());
        expect(value).toBe(2);

        act(() => root.unmount());
        container.remove();
    });
});
