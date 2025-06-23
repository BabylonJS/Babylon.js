import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import { useObservableState } from "../../hooks/observableHooks";
import type { ComponentType } from "react";
import type { BaseComponentProps } from "shared-ui-components/fluent/hoc/propertyLine";

export type BoundPropertyProps<T, P extends object> = Omit<P, "value" | "onChange"> & {
    component: ComponentType<P & BaseComponentProps<T>>;
    target: any;
    propertyKey: PropertyKey;
};

export function BoundPropertyLine<T, P extends object>(props: BoundPropertyProps<T, P>) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { target, propertyKey, component: Component, ...rest } = props;
    const value = useObservableState(() => target[propertyKey], useInterceptObservable("property", target, propertyKey));

    return <Component {...(rest as P)} value={value} onChange={(val: T) => (target[propertyKey] = val)} />;
}
