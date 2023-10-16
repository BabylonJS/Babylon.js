import type { ReactElement } from "react";

function makeAccessibleItem(props: {description: string | undefined, isClickable: boolean}) {
    const {description, isClickable} = props;
    if (description) {
        if (isClickable) {
            return <button>{description}</button>;
        } else {
            return <div>{description}</div>;
        }
    } else {
        return null;
    }
}

export function HTMLTwinAccessibilityItem(props: {description: string | undefined, isClickable: boolean, children: ReactElement[]}) {
    const accessibleItem = makeAccessibleItem(props);
    if (props.children.length > 0) {
        return (
            <div>
                {accessibleItem}
                <div>
                    {props.children}
                </div>
            </div>
        );
    } else {
        return accessibleItem;
    }
}