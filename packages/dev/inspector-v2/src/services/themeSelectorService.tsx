import type { MenuButtonProps, MenuCheckedValueChangeData, MenuCheckedValueChangeEvent } from "@fluentui/react-components";
import type { TernaryDarkMode } from "usehooks-ts";
import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IShellService } from "../services/shellService";

import { makeStyles, Menu, MenuItemRadio, MenuList, MenuPopover, MenuTrigger, SplitButton, Tooltip } from "@fluentui/react-components";
import { WeatherMoonRegular, WeatherSunnyRegular } from "@fluentui/react-icons";
import { useCallback } from "react";
import { useTernaryDarkMode } from "usehooks-ts";

import { ShellServiceIdentity } from "../services/shellService";

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    themeButton: {},
    themeMenu: {
        minWidth: 0,
    },
});

export const ThemeSelectorServiceDefinition: ServiceDefinition<[], [IShellService]> = {
    friendlyName: "ThemeSelector",
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const registration = shellService.addToTopBar({
            key: "ThemeSelector",
            alignment: "right",
            suppressTeachingMoment: true,
            order: -300,
            component: () => {
                const classes = useStyles();

                const { isDarkMode, ternaryDarkMode, setTernaryDarkMode } = useTernaryDarkMode();

                const onSelectedThemeChange = useCallback((e: MenuCheckedValueChangeEvent, data: MenuCheckedValueChangeData) => {
                    setTernaryDarkMode(data.checkedItems.includes("System") ? "system" : (data.checkedItems[0].toLocaleLowerCase() as TernaryDarkMode));
                }, []);

                const toggleTheme = useCallback(() => {
                    setTernaryDarkMode(isDarkMode ? "light" : "dark");
                }, [isDarkMode]);

                return (
                    <Menu positioning="below-end" checkedValues={{ theme: [ternaryDarkMode] }} onCheckedValueChange={onSelectedThemeChange}>
                        <MenuTrigger disableButtonEnhancement={true}>
                            {(triggerProps: MenuButtonProps) => (
                                <Tooltip content="Select Theme" relationship="label">
                                    <SplitButton
                                        className={classes.themeButton}
                                        menuButton={triggerProps}
                                        primaryActionButton={{ onClick: toggleTheme }}
                                        size="small"
                                        appearance="secondary"
                                        shape="circular"
                                        icon={isDarkMode ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
                                    ></SplitButton>
                                </Tooltip>
                            )}
                        </MenuTrigger>

                        <MenuPopover className={classes.themeMenu}>
                            <MenuList>
                                <MenuItemRadio name="theme" value={"system" satisfies TernaryDarkMode}>
                                    System
                                </MenuItemRadio>
                                <MenuItemRadio name="theme" value={"light" satisfies TernaryDarkMode}>
                                    Light
                                </MenuItemRadio>
                                <MenuItemRadio name="theme" value={"dark" satisfies TernaryDarkMode}>
                                    Dark
                                </MenuItemRadio>
                            </MenuList>
                        </MenuPopover>
                    </Menu>
                );
            },
        });

        return {
            dispose: () => registration.dispose(),
        };
    },
};
