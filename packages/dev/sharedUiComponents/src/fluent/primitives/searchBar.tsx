import { Field, SearchBox as FluentSearchBox, makeStyles } from "@fluentui/react-components";
import type { InputOnChangeData, SearchBoxChangeEvent } from "@fluentui/react-components";
import { forwardRef } from "react";

type SearchProps = {
    onChange: (val: string) => void;
    placeholder?: string;
};
const useStyles = makeStyles({
    search: {
        minWidth: "50px",
    },
});

export const SearchBar = forwardRef<HTMLInputElement, SearchProps>((props, ref) => {
    const classes = useStyles();
    const onChange: (ev: SearchBoxChangeEvent, data: InputOnChangeData) => void = (_, data) => {
        props.onChange(data.value);
    };

    return (
        <Field>
            <FluentSearchBox ref={ref} className={classes.search} placeholder={props.placeholder} onChange={onChange} />
        </Field>
    );
});
