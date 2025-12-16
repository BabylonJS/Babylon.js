import type { FunctionComponent } from "react";
import { useRef } from "react";
import { ArrowUploadRegular } from "@fluentui/react-icons";
import { Button } from "./button";
import type { ButtonProps } from "./button";

type UploadButtonProps = Omit<ButtonProps, "onClick" | "icon"> & {
    /**
     * Callback when files are selected
     */
    onUpload: (files: FileList) => void;
    /**
     * File types to accept (e.g., ".jpg, .png, .dds")
     */
    accept?: string;
    /**
     * Text label to display on the button (optional)
     */
    label?: string;
};

/**
 * A button that triggers a file upload dialog.
 * Combines a Button with a hidden file input.
 * @param props UploadButtonProps
 * @returns UploadButton component
 */
export const UploadButton: FunctionComponent<UploadButtonProps> = (props) => {
    const { onUpload, accept, label, ...buttonProps } = props;
    UploadButton.displayName = "UploadButton";
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        const files = evt.target.files;
        if (files && files.length) {
            onUpload(files);
        }
        evt.target.value = "";
    };

    return (
        <>
            <Button icon={ArrowUploadRegular} title={label ?? "Upload"} label={label} onClick={handleClick} {...buttonProps} />
            <input ref={inputRef} type="file" accept={accept} style={{ display: "none" }} onChange={handleChange} />
        </>
    );
};
