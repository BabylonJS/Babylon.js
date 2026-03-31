import { type Theme } from "@fluentui/react-components";

import { type IDisposable, type IObserver, type IReadonlyObservable } from "core/index";
import { type IService, type ServiceDefinition } from "../modularity/serviceDefinition";
import { type ISettingsStore, type SettingDescriptor, SettingsStoreIdentity } from "./settingsStore";

import { Observable } from "core/Misc/observable";
import { DarkTheme, LightTheme } from "../themes/babylonTheme";

/**
 * Represents the theme mode preference.
 */
export type ThemeMode = "system" | "light" | "dark";

/**
 * The setting descriptor for persisting the theme mode preference.
 */
export const ThemeModeSettingDescriptor: SettingDescriptor<ThemeMode> = {
    key: "ThemeMode",
    defaultValue: "system",
};

/**
 * Resolves the current theme based on user preference and system settings.
 * Listens for changes to both the persisted theme mode and the OS-level dark mode preference.
 */
export class ThemeResolver implements IDisposable {
    private readonly _darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    private readonly _onChanged = new Observable<void>();
    private readonly _onDarkModeMediaQueryChange = () => this._onChanged.notifyObservers();
    private readonly _settingsStoreObserver: IObserver;

    public constructor(private readonly _settingsStore: ISettingsStore) {
        this._darkModeMediaQuery.addEventListener("change", this._onDarkModeMediaQueryChange);
        this._settingsStoreObserver = this._settingsStore.onChanged.add((key) => {
            if (key === ThemeModeSettingDescriptor.key) {
                this._onChanged.notifyObservers();
            }
        });
    }

    public get onChanged(): IReadonlyObservable<void> {
        return this._onChanged;
    }

    public get mode(): ThemeMode {
        return this._settingsStore.readSetting(ThemeModeSettingDescriptor);
    }

    public set mode(value: ThemeMode) {
        if (value !== this.mode) {
            this._settingsStore.writeSetting(ThemeModeSettingDescriptor, value);
        }
    }

    public get isDark() {
        const themeMode = this.mode;
        return themeMode === "dark" || (themeMode === "system" && this._darkModeMediaQuery.matches);
    }

    public toggle() {
        this.mode = this.isDark ? "light" : "dark";
    }

    public dispose() {
        this._onChanged.clear();
        this._darkModeMediaQuery.removeEventListener("change", this._onDarkModeMediaQueryChange);
        this._settingsStoreObserver.remove();
    }
}

/**
 * The unique identity symbol for the theme service.
 */
export const ThemeServiceIdentity = Symbol("ThemeService");

/**
 * Exposes the current theme used by the application.
 */
export interface IThemeService extends IService<typeof ThemeServiceIdentity> {
    /**
     * Whether the current theme is the dark variant or not.
     */
    readonly isDark: boolean;

    /**
     * The current theme mode, which can be either "light", "dark" or "system". When set to "system", the theme will match the user's OS-level preference and update automatically when it changes.
     */
    mode: ThemeMode;

    /**
     * Toggles the theme mode between light and dark. If the current mode is "system", it will toggle based on the current OS-level preference.
     */
    toggle(): void;

    /**
     * The current theme used by the application.
     */
    readonly theme: Theme;

    /**
     * Observable that fires whenever the theme changes.
     */
    readonly onChanged: IReadonlyObservable<void>;
}

export const ThemeServiceDefinition: ServiceDefinition<[IThemeService], [ISettingsStore]> = {
    friendlyName: "Theme Service",
    produces: [ThemeServiceIdentity],
    consumes: [SettingsStoreIdentity],
    factory: (settingsStore) => {
        const themeResolver = new ThemeResolver(settingsStore);
        return Object.assign(themeResolver, {
            get theme() {
                return themeResolver.isDark ? DarkTheme : LightTheme;
            },
        });
    },
};
