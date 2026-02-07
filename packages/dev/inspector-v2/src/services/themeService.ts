import type { Theme } from "@fluentui/react-components";

import type { IReadonlyObservable } from "core/index";
import type { IService } from "../modularity/serviceDefinition";

export const ThemeServiceIdentity = Symbol("ThemeService");

/**
 * Exposes the current theme used by the application.
 */
export interface IThemeService extends IService<typeof ThemeServiceIdentity> {
    /**
     * The current theme used by the application.
     */
    readonly theme: Theme;
    /**
     * Observable that fires whenever the theme changes.
     */
    readonly onChanged: IReadonlyObservable<void>;
}
