import { type IReadonlyObservable } from "core/index";
import { type IService } from "../modularity/serviceDefinition";

import { DataStorage } from "core/Misc/dataStorage";
import { Observable } from "core/Misc/observable";

/**
 * The unique identity symbol for the settings store service.
 */
export const SettingsStoreIdentity = Symbol("SettingsStore");

/**
 * Describes a setting by its key and default value.
 */
export type SettingDescriptor<T> = {
    /**
     * The unique key used to identify this setting in the store.
     */
    readonly key: string;

    /**
     * The default value to use when the setting has not been explicitly set.
     */
    readonly defaultValue: T;
};

/**
 * Provides a key-value store for persisting user settings.
 */
export interface ISettingsStore extends IService<typeof SettingsStoreIdentity> {
    /**
     * An observable that notifies when a setting has changed, providing the key of the changed setting.
     */
    onChanged: IReadonlyObservable<string>;

    /**
     * Reads a setting from the store.
     * @param descriptor The descriptor of the setting to read.
     * @returns The current value of the setting, or the default value if it has not been set.
     */
    readSetting<T>(descriptor: SettingDescriptor<T>): T;

    /**
     * Writes a setting to the store.
     * @param descriptor The descriptor of the setting to write.
     * @param value The value to write.
     */
    writeSetting<T>(descriptor: SettingDescriptor<T>, value: T): void;
}

function GetKey(namespace: string, settingKey: string) {
    return `Babylon/${namespace}/${settingKey}`;
}

/**
 * Default implementation of {@link ISettingsStore} that persists settings using browser local storage.
 */
export class SettingsStore implements ISettingsStore {
    private readonly _onChanged = new Observable<Readonly<string>>();

    /**
     * Creates a new settings store.
     * @param _namespace A namespace used to scope the settings keys to avoid collisions with other stores.
     */
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
