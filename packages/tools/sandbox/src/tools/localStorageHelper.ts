const WelcomeDialogDismissedKey = "WelcomeDialogDismissed";
const UseOpenPBRKey = "UseOpenPBR";

export class LocalStorageHelper {
    public static ReadLocalStorageValue(key: string, defaultValue: number) {
        if (typeof Storage !== "undefined" && localStorage.getItem(key) !== null) {
            return parseInt(localStorage.getItem(key)!);
        }

        return defaultValue;
    }

    /**
     * Sets the user's preference to not show the welcome dialog again
     */
    public static SetWelcomeDialogDismissed(): void {
        localStorage.setItem(WelcomeDialogDismissedKey, "true");
    }

    /**
     * Gets whether the user has previously dismissed the welcome dialog
     * @returns true if the user has chosen not to see the dialog again
     */
    public static GetWelcomeDialogDismissed(): boolean {
        return localStorage.getItem(WelcomeDialogDismissedKey) === "true";
    }

    /**
     * Clears the user's preference for the welcome dialog
     */
    public static ClearWelcomeDialogDismissed(): void {
        localStorage.removeItem(WelcomeDialogDismissedKey);
    }

    /**
     * Sets whether glTF loading should force OpenPBR materials.
     * @param value The value to persist.
     */
    public static SetUseOpenPBR(value: boolean): void {
        localStorage.setItem(UseOpenPBRKey, value ? "true" : "false");
    }

    /**
     * Gets whether glTF loading should force OpenPBR materials.
     * @returns true when OpenPBR mode is enabled.
     */
    public static GetUseOpenPBR(): boolean {
        return localStorage.getItem(UseOpenPBRKey) === "true";
    }
}
