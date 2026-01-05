import { Body1Strong, makeStyles, tokens } from "@fluentui/react-components";

import { ExtensibleAccordion } from "../extensibleAccordion";

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    placeholderDiv: {
        padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    },
});

export const PropertiesPane: typeof ExtensibleAccordion<unknown> = (props) => {
    const classes = useStyles();

    const entity = props.context;

    return entity != null ? (
        <ExtensibleAccordion {...props} />
    ) : (
        <div className={classes.placeholderDiv}>
            <Body1Strong italic>No entity selected.</Body1Strong>
        </div>
    );
};
