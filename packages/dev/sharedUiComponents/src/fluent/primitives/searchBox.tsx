import { Field, SearchBox as FluentSearchBox, makeStyles } from "@fluentui/react-components";
import type { InputOnChangeData } from "@fluentui/react-components";
import type { SearchBoxChangeEvent } from "@fluentui/react-components";

type SearchProps = {
    onChange: (val: string) => void;
    placeholder?: string;
};
const useStyles = makeStyles({
    search: {
        minWidth: "50px",
    },
});
export const SearchBox = (props: SearchProps) => {
    const classes = useStyles();
    const onChange: (ev: SearchBoxChangeEvent, data: InputOnChangeData) => void = (_, data) => {
        props.onChange(data.value);
    };

    return (
        <Field>
            <FluentSearchBox className={classes.search} placeholder={props.placeholder} onChange={onChange} />
        </Field>
    );
};
