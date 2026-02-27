import type { MenuButtonProps, MenuCheckedValueChangeData, MenuCheckedValueChangeEvent } from "@fluentui/react-components";
import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IShellService } from "../services/shellService";
import type { ThemeMode } from "../services/themeService";

import { makeStyles, Menu, MenuItemRadio, MenuList, MenuPopover, MenuTrigger, SplitButton, Tooltip } from "@fluentui/react-components";
import { WeatherMoonRegular, WeatherSunnyRegular } from "@fluentui/react-icons";
import { useCallback } from "react";

import { useThemeMode } from "../hooks/themeHooks";
import { ShellServiceIdentity } from "../services/shellService";

const useStyles = makeStyles({
    themeButton: {
        margin: 0,
    },
    themeMenuPopover: {
        minWidth: 0,
    },
});

export const ThemeSelectorServiceDefinition: ServiceDefinition<[], [IShellService]> = {
    friendlyName: "ThemeSelector",
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const registration = shellService.addToolbarItem({
            key: "ThemeSelector",
            horizontalLocation: "right",
            verticalLocation: "top",
            teachingMoment: false,
            order: -300,
            component: () => {
                const classes = useStyles();

                const { isDarkMode, themeMode, setThemeMode } = useThemeMode();

                const onSelectedThemeChange = useCallback((e: MenuCheckedValueChangeEvent, data: MenuCheckedValueChangeData) => {
                    setThemeMode(data.checkedItems.includes("System") ? "system" : (data.checkedItems[0].toLocaleLowerCase() as ThemeMode));
                }, []);

                const toggleTheme = useCallback(() => {
                    setThemeMode(isDarkMode ? "light" : "dark");
                }, [isDarkMode]);

                return (
                    <Menu positioning="below-end" checkedValues={{ theme: [themeMode] }} onCheckedValueChange={onSelectedThemeChange}>
                        <MenuTrigger disableButtonEnhancement={true}>
                            {(triggerProps: MenuButtonProps) => (
                                <Tooltip content="Select Theme" relationship="label">
                                    <SplitButton
                                        className={classes.themeButton}
                                        menuButton={triggerProps}
                                        primaryActionButton={{ onClick: toggleTheme }}
                                        size="small"
                                        appearance="transparent"
                                        shape="circular"
                                        icon={isDarkMode ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
                                    ></SplitButton>
                                </Tooltip>
                            )}
                        </MenuTrigger>

                        <MenuPopover className={classes.themeMenuPopover}>
                            <MenuList>
                                <MenuItemRadio name="theme" value={"system" satisfies ThemeMode}>
                                    System
                                </MenuItemRadio>
                                <MenuItemRadio name="theme" value={"light" satisfies ThemeMode}>
                                    Light
                                </MenuItemRadio>
                                <MenuItemRadio name="theme" value={"dark" satisfies ThemeMode}>
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
