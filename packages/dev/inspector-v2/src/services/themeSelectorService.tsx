import type { MenuButtonProps, MenuCheckedValueChangeData, MenuCheckedValueChangeEvent } from "@fluentui/react-components";
import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { TernaryDarkMode } from "usehooks-ts";

import { useCallback } from "react";
import { makeStyles, Menu, MenuItemRadio, MenuList, MenuPopover, MenuTrigger, SplitButton, Tooltip } from "@fluentui/react-components";
import { WeatherSunnyRegular, WeatherMoonRegular } from "@fluentui/react-icons";
import { ShellService } from "../services/shellService";
import { useTernaryDarkMode } from "usehooks-ts";

const useStyles = makeStyles({
    themeButton: {
        //...shorthands.margin('6px'),
    },
    themeMenu: {
        minWidth: 0,
    },
});

export const themeSelectorServiceDefinition: ServiceDefinition<[], [ShellService]> = {
    friendlyName: "ThemeSelector",
    consumes: [ShellService],
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
