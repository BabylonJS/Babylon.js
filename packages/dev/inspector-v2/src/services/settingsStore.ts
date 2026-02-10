import type { IReadonlyObservable } from "core/index";
import type { IService } from "../modularity/serviceDefinition";

import { DataStorage } from "core/Misc/dataStorage";
import { Observable } from "core/Misc/observable";

export const SettingsStoreIdentity = Symbol("SettingsStore");

export type SettingDescriptor =
    | {
          key: string;
          type: "boolean";
          defaultValue: boolean;
      }
    | {
          key: string;
          type: "number";
          defaultValue: number;
      }
    | {
          key: string;
          type: "string";
          defaultValue: string;
      };

export type SettingValueType<T extends Readonly<SettingDescriptor>> = T["type"] extends "boolean" ? boolean : T["type"] extends "number" ? number : string;

export interface ISettingsStore extends IService<typeof SettingsStoreIdentity> {
    onChanged: IReadonlyObservable<Readonly<SettingDescriptor>>;
    readSetting<T extends Readonly<SettingDescriptor>>(descriptor: T): SettingValueType<T>;
    writeSetting<T extends Readonly<SettingDescriptor>>(descriptor: T, value: SettingValueType<T>): void;
}

function GetKey(namespace: string, settingKey: string) {
    return `Babylon/${namespace}/${settingKey}`;
}

export class SettingsStore implements ISettingsStore {
    private readonly _onChanged = new Observable<Readonly<SettingDescriptor>>();

    public constructor(private readonly _namespace: string) {}

    public get onChanged(): IReadonlyObservable<Readonly<SettingDescriptor>> {
        return this._onChanged;
    }

    public readSetting<T extends Readonly<SettingDescriptor>>(descriptor: T): SettingValueType<T> {
        const key = GetKey(this._namespace, descriptor.key);
        if (descriptor.type === "boolean") {
            return DataStorage.ReadBoolean(key, descriptor.defaultValue) as SettingValueType<T>;
        } else if (descriptor.type === "number") {
            return DataStorage.ReadNumber(key, descriptor.defaultValue) as SettingValueType<T>;
        } else {
            return DataStorage.ReadString(key, descriptor.defaultValue) as SettingValueType<T>;
        }
    }

    public writeSetting<T extends Readonly<SettingDescriptor>>(descriptor: T, value: SettingValueType<T>): void {
        const key = GetKey(this._namespace, descriptor.key);
        if (descriptor.type === "boolean") {
            DataStorage.WriteBoolean(key, value as boolean);
        } else if (descriptor.type === "number") {
            DataStorage.WriteNumber(key, value as number);
        } else {
            DataStorage.WriteString(key, value as string);
        }
        this._onChanged.notifyObservers(descriptor);
    }
}
