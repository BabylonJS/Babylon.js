import type { IReadonlyObservable } from "core/index";
import type { IService } from "../modularity/serviceDefinition";

import { DataStorage } from "core/Misc/dataStorage";
import { Observable } from "core/Misc/observable";

export const SettingsStoreIdentity = Symbol("SettingsStore");

export type SettingDescriptor<T> = {
    readonly key: string;
    readonly defaultValue: T;
};

export interface ISettingsStore extends IService<typeof SettingsStoreIdentity> {
    onChanged: IReadonlyObservable<string>;
    readSetting<T>(descriptor: SettingDescriptor<T>): T;
    writeSetting<T>(descriptor: SettingDescriptor<T>, value: T): void;
}

function GetKey(namespace: string, settingKey: string) {
    return `Babylon/${namespace}/${settingKey}`;
}

export class SettingsStore implements ISettingsStore {
    private readonly _onChanged = new Observable<Readonly<string>>();

    public constructor(private readonly _namespace: string) {}

    public get onChanged(): IReadonlyObservable<Readonly<string>> {
        return this._onChanged;
    }

    public readSetting<T>(descriptor: SettingDescriptor<T>): T {
        const key = GetKey(this._namespace, descriptor.key);
        return DataStorage.ReadJson(key, descriptor.defaultValue);
    }

    public writeSetting<T>(descriptor: SettingDescriptor<T>, value: T): void {
        const key = GetKey(this._namespace, descriptor.key);
        DataStorage.WriteJson(key, value);
        this._onChanged.notifyObservers(descriptor.key);
    }
}
