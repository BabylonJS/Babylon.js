import type { FrameGraphTask } from "core/index";

interface IFrameGraphEvaluate {
    evaluate: () => boolean;
}

/**
 * Interface used to evaluate a property in a multi values task property.
 */
export interface IFrameGraphEvaluateProperty<T> extends IFrameGraphEvaluate {
    /**
     * The value to use if evaluate() returns true.
     */
    value: T;
}

/**
 * An array of IFrameGraphEvaluateProperty.
 */
export type FrameGraphMultiValueType<T> = Array<IFrameGraphEvaluateProperty<T>>;

/** @internal */
export class FrameGraphTaskProperty<T> {
    private _multi?: FrameGraphMultiValueType<T>;
    private _value: T;

    constructor(
        private _task: FrameGraphTask,
        defaultValue: T,
        private _setter?: (oldValue: T) => void
    ) {
        _task.multiProperties.push(this);
        (this._value as any) = defaultValue;
    }

    public evaluate(): void {
        if (this._multi === undefined) {
            return;
        }
        for (const entry of this._multi) {
            if (entry.evaluate()) {
                const oldValue = this._value;
                this._value = entry.value;
                if (oldValue !== this._value && this._setter) {
                    this._setter.call(this._task, oldValue);
                }
                return;
            }
        }
    }

    public get multi(): FrameGraphMultiValueType<T> {
        if (this._multi === undefined) {
            this._multi = [];
        }
        return this._multi;
    }

    public set multi(value: FrameGraphMultiValueType<T>) {
        this._multi = value;
    }

    public get value(): T {
        return this._value;
    }

    public set value(value: T) {
        this._multi = undefined;
        this._value = value;
    }
}

/**
 * Decorator to create a multi-value property for a frame graph task.
 * @param setterName Optional name of the setter to call when the property changes.
 * @returns Internal use only.
 */
export function FrameGraphTaskMultiProperty(setterName?: string) {
    return (target: any, propertyKey: string) => {
        const propertyObjectName = propertyKey + "Prop";

        Object.defineProperty(target, propertyKey, {
            get: function (this: FrameGraphTask) {
                const prop = (this as any)[propertyObjectName];
                return prop && prop.evaluateMulti ? prop.value : prop;
            },
            set: function (this: FrameGraphTask, value: any) {
                const prop = (this as any)[propertyObjectName];
                let oldValue: any;
                if (prop && prop.evaluateMulti) {
                    oldValue = prop.value;
                    this.multiProperties.splice(this.multiProperties.indexOf(prop), 1);
                } else {
                    oldValue = prop;
                }
                if (oldValue === value) {
                    return;
                }
                (this as any)[propertyObjectName] = value;
                if (setterName) {
                    (this as any)[setterName].call(this, oldValue);
                }
            },
            enumerable: true,
            configurable: true,
        });

        Object.defineProperty(target, propertyKey + "Multi", {
            get: function (this: FrameGraphTask) {
                let prop = (this as any)[propertyObjectName] as FrameGraphTaskProperty<any>;
                if (!prop || !prop.evaluate) {
                    prop = new FrameGraphTaskProperty<any>(this, prop, setterName ? (this as any)[setterName] : undefined);
                    (this as any)[propertyObjectName] = prop;
                }

                return prop.multi;
            },
            set: function (this: FrameGraphTask, value: FrameGraphMultiValueType<any>) {
                let prop = (this as any)[propertyObjectName] as FrameGraphTaskProperty<any>;
                if (!prop || !prop.evaluate) {
                    prop = new FrameGraphTaskProperty<any>(this, prop, setterName ? (this as any)[setterName] : undefined);
                    (this as any)[propertyObjectName] = prop;
                }

                prop.multi = value;
            },
            enumerable: true,
            configurable: true,
        });
    };
}
