import type { ComponentProps, ComponentType } from "react";

import { forwardRef, useMemo } from "react";

import { ErrorBoundary } from "../errorBoundary";
import { usePropertyChangedNotifier } from "../../contexts/propertyContext";
import { MakePropertyHook, useProperty } from "../../hooks/compoundPropertyHooks";
import { GetPropertyDescriptor } from "../../instrumentation/propertyInstrumentation";
import { getClassNameWithNamespace } from "shared-ui-components/copyCommandToClipboard";
import { GenerateCopyString } from "./generateCopyString";

/**
 * Helper type to check if a type includes null or undefined
 */
type IsNullable<T> = null extends T ? true : undefined extends T ? true : false;

/**
 * Base props for BoundProperty
 */
type BaseBoundPropertyProps<TargetT extends object, PropertyKeyT extends keyof TargetT, ComponentT extends ComponentType<any>> = Omit<
    ComponentProps<ComponentT>,
    "value" | "onChange" | "nullable" | "defaultValue" | "ignoreNullable"
> & {
    component: ComponentT;
    target: TargetT | null | undefined;
    propertyKey: PropertyKeyT;
    /** Optional propertyPath used to generate the copyString if path to property is not equal to entity.target */
    propertyPath?: string;
    convertTo?: (value: TargetT[PropertyKeyT]) => TargetT[PropertyKeyT];
    convertFrom?: (value: TargetT[PropertyKeyT]) => TargetT[PropertyKeyT];
};

/**
 * Enhanced BoundProperty props that enforces strict nullable handling
 */
export type BoundPropertyProps<TargetT extends object, PropertyKeyT extends keyof TargetT, ComponentT extends ComponentType<any>> = BaseBoundPropertyProps<
    TargetT,
    PropertyKeyT,
    ComponentT
> &
    (IsNullable<TargetT[PropertyKeyT]> extends true
        ? // Pass null explicitly to skip nullable handling entirely - value passes through as-is
          | {
                    defaultValue: null;
                    nullable?: never;
                    ignoreNullable?: never;
                }
              | (ComponentProps<ComponentT> extends { nullable?: boolean }
                    ? // Component supports nullable UI and thus requires a defaultValue to be sent with nullable = {true}
                      | {
                                nullable: true;
                                defaultValue: NonNullable<TargetT[PropertyKeyT]>;
                                ignoreNullable?: never;
                            }
                          | {
                                ignoreNullable: true;
                                defaultValue: NonNullable<TargetT[PropertyKeyT]>;
                                nullable?: never;
                            }
                    : // Component doesn't support nullable UI - only allow defaultValue: null
                      never)
        : {});

function BoundPropertyCoreImpl<TargetT extends object, PropertyKeyT extends keyof TargetT, ComponentT extends ComponentType<any>>(
    props: Omit<BoundPropertyProps<TargetT, PropertyKeyT, ComponentT>, "target"> & { target: TargetT },
    ref?: any
) {
    const { target, propertyKey } = props;

    // Get the value of the property. If it changes, it will cause a re-render, which is needed to
    // re-evaluate which specific hook will catch all the nested property changes we want to observe.
    const value = useProperty(target, propertyKey);

    // Determine which specific property hook to use based on the value's type.
    const useSpecificProperty = useMemo(() => MakePropertyHook(value), [value]);

    const notifyPropertyChanged = usePropertyChangedNotifier();

    // Create an inline nested component that changes when the desired specific hook type changes (since hooks can't be conditional).
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const SpecificComponent = useMemo(() => {
        return (props: ComponentProps<ComponentT>) => {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const { target, propertyKey, propertyPath, convertTo, convertFrom, component: Component, ...rest } = props;

            // Hook the property, using the specific hook that also catches changes to nested properties as well (like x/y/z on a Vector3 for example).
            const value = useSpecificProperty(target, propertyKey);
            const convertedValue = convertTo ? convertTo(value) : value;

            const onChange = useMemo(() => {
                const propertyDescriptor = GetPropertyDescriptor(target, propertyKey)?.[1];
                if (propertyDescriptor && (propertyDescriptor.set || propertyDescriptor.writable)) {
                    return (val: TargetT[PropertyKeyT]) => {
                        const oldValue = target[propertyKey];
                        const newValue = convertFrom ? convertFrom(val) : val;
                        target[propertyKey] = newValue;
                        notifyPropertyChanged(target, propertyKey, oldValue, newValue);
                    };
                }
                return undefined;
            }, [target, propertyKey, convertFrom, notifyPropertyChanged]);

            const propsToSend = {
                // will be overriden if custom onCopy is passed in
                onCopy: () => {
                    if (propertyPath) {
                        return GetOnCopyString(value, propertyPath);
                    }
                    const { className, babylonNamespace } = getClassNameWithNamespace(target);
                    return `${GetOnCopyString(value, String(propertyKey))} // (debugNode as ${babylonNamespace}${className})`;
                },
                ...rest,
                ref,
                value: convertedValue as TargetT[PropertyKeyT],
                onChange,
            };

            return <Component {...(propsToSend as ComponentProps<ComponentT>)} />;
        };
    }, [useSpecificProperty, notifyPropertyChanged]);

    return <SpecificComponent {...(props as ComponentProps<ComponentT>)} />;
}

const BoundPropertyCore = CreateGenericForwardRef(BoundPropertyCoreImpl);

function BoundPropertyImpl<TargetT extends object, PropertyKeyT extends keyof TargetT, ComponentT extends ComponentType<any>>(
    props: BoundPropertyProps<TargetT, PropertyKeyT, ComponentT>,
    ref?: any
) {
    const { target, ...rest } = props;

    // If target is null, don't render anything.
    if (!target) {
        return null;
    }

    // Target is guaranteed to be non-null here, pass to core implementation.
    return (
        <ErrorBoundary name={`BoundProperty:${String(props.propertyKey)}`}>
            <BoundPropertyCore {...rest} target={target} ref={ref} />
        </ErrorBoundary>
    );
}

// Custom generic forwardRef function (this is needed because using forwardRef with BoundPropertyImpl does not properly resolve Generic types)
function CreateGenericForwardRef<T extends (...args: any[]) => any>(render: T) {
    return forwardRef(render as any) as unknown as T;
}

/**
 * Intercepts the passed in component's target[propertyKey] with useInterceptObservable and sets component state using useObservableState.
 * Renders the passed in component with value as the new observableState value and onChange as a callback to set the target[propertyKey] value.
 *
 * NOTE: BoundProperty has strict nullable enforcement!
 *
 * If Target[PropertyKey] is Nullable, caller has three options:
 * 1. `nullable: true` + `defaultValue: NonNullable<T>` - Shows enable/disable checkbox UI
 * 2. `ignoreNullable: true` + `defaultValue: NonNullable<T>` - Shows disabled state when null
 * 3. `defaultValue: null` - Skips nullable handling entirely, passes value through as-is
 *
 * @param props BoundPropertyProps with strict nullable validation
 * @returns JSX element
 */
export const BoundProperty = CreateGenericForwardRef(BoundPropertyImpl);

/**
 * Mutually exclusive propertyPath or functionPath - one required
 */
type RequiredPropertyPath = { propertyPath: string; functionPath?: never } | { functionPath: string; propertyPath?: never };
/**
 * Props for Property component - a simpler version of BoundProperty that only handles onCopy functionality
 * Pass in the full propertyPath from entity to property (e.g. "meshes[0].position.x") to ensure copyString is accurate
 * Use functionPath for function-based properties (e.g. "setEnabled" generates "debugNode.setEnabled(value)")
 */
export type PropertyProps<ComponentT extends ComponentType<any>> = Omit<ComponentProps<ComponentT>, "onCopy"> & {
    component: ComponentT;
} & RequiredPropertyPath;

function GetOnCopyString(value: unknown, propertyPath: string) {
    const valueStr = GenerateCopyString(value);
    return `globalThis.debugNode.${propertyPath} = ${valueStr};`;
}

function GetOnCopyStringFunc(value: unknown, functionPath: string) {
    const valueStr = GenerateCopyString(value);
    return `globalThis.debugNode.${functionPath}(${valueStr});`;
}

function PropertyImpl<ComponentT extends ComponentType<any>>(props: PropertyProps<ComponentT>, ref?: any) {
    const {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        component: Component,
        propertyPath,
        functionPath,
        value,
        ...rest
    } = props as PropertyProps<ComponentT> & { value?: unknown; propertyPath?: string; functionPath?: string };

    const propsToSend = {
        onCopy: () => (functionPath ? GetOnCopyStringFunc(value, functionPath) : GetOnCopyString(value, propertyPath!)),
        ...rest,
        ref,
        value,
    };

    return <Component {...(propsToSend as ComponentProps<ComponentT>)} />;
}

/**
 * A simpler version of BoundProperty that only provides the onCopy functionality.
 * Does not bind the value/onChange - those must be provided by the caller.
 * Use this when you need copy support but have custom value/onChange handling.
 *
 * @param props PropertyProps with propertyName for copy support
 * @returns JSX element
 */
export const Property = CreateGenericForwardRef(PropertyImpl);
