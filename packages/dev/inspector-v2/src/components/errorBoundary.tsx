import type { ErrorInfo, ReactNode } from "react";

import { Component } from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import { ErrorCircleRegular } from "@fluentui/react-icons";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { TokenMap } from "shared-ui-components/fluent/primitives/utils";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: TokenMap.px20,
        backgroundColor: tokens.colorNeutralBackground1,
        color: tokens.colorNeutralForeground1,
        height: "100%",
        minHeight: "100px",
    },
    icon: {
        fontSize: "48px",
        color: tokens.colorPaletteRedForeground1,
        marginBottom: TokenMap.px12,
    },
    title: {
        fontSize: TokenMap.px16,
        fontWeight: "600",
        marginBottom: TokenMap.px8,
    },
    message: {
        fontSize: TokenMap.px12,
        color: tokens.colorNeutralForeground2,
        marginBottom: TokenMap.px16,
        textAlign: "center",
        maxWidth: "300px",
    },
    details: {
        fontSize: TokenMap.px10,
        color: tokens.colorNeutralForeground3,
        fontFamily: "monospace",
        whiteSpace: "pre-wrap",
        maxHeight: "100px",
        overflow: "auto",
        padding: TokenMap.px8,
        backgroundColor: tokens.colorNeutralBackground3,
        borderRadius: TokenMap.px4,
        marginTop: TokenMap.px8,
        maxWidth: "100%",
    },
});

type ErrorBoundaryProps = {
    /** Child components to render */
    children: ReactNode;
    /** Optional fallback UI to show on error */
    fallback?: ReactNode;
    /** Optional callback when an error occurs */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    /** Optional name for identifying this boundary in logs */
    name?: string;
};

type ErrorBoundaryState = {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
};

/**
 * Error boundary component that catches JavaScript errors in child components
 * and displays a fallback UI instead of crashing the entire application.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });

        // Log the error
        const boundaryName = this.props.name || "ErrorBoundary";
        // eslint-disable-next-line no-console
        console.error(`[${boundaryName}] Error caught:`, error, errorInfo);

        // Call optional error callback
        this.props.onError?.(error, errorInfo);
    }

    private _handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    override render() {
        if (this.state.hasError) {
            // If a custom fallback is provided, use it
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return <ErrorFallback error={this.state.error} onRetry={this._handleRetry} />;
        }

        return this.props.children;
    }
}

type ErrorFallbackProps = {
    error: Error | null;
    onRetry: () => void;
};

function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
    const styles = useStyles();

    return (
        <div className={styles.root}>
            <ErrorCircleRegular className={styles.icon} />
            <div className={styles.title}>Something went wrong</div>
            <div className={styles.message}>An error occurred in this component. You can try again or continue using other parts of the tool.</div>
            <Button label="Try Again" appearance="primary" onClick={onRetry} />
            {error && <div className={styles.details}>{error.message}</div>}
        </div>
    );
}
