import * as React from "react";
import type { HelpTopicId } from "./helpContent";
import { HelpTopics } from "./helpContent";

import "./helpDialog.scss";

interface IHelpDialogProps {
    /** When set, the dialog opens and scrolls to this topic. Null/undefined = closed. */
    initialTopicId?: HelpTopicId;
    /** Called when the user closes the dialog. */
    onClose: () => void;
}

interface IHelpDialogState {
    expandedTopics: Set<HelpTopicId>;
}

/**
 * Modal help dialog with collapsible topic sections.
 */
export class HelpDialogComponent extends React.Component<IHelpDialogProps, IHelpDialogState> {
    private _topicRefs = new Map<HelpTopicId, React.RefObject<HTMLDivElement>>();

    /** @internal */
    constructor(props: IHelpDialogProps) {
        super(props);

        // Create refs for each topic so we can scroll to them
        for (const topic of HelpTopics) {
            this._topicRefs.set(topic.id, React.createRef<HTMLDivElement>());
        }

        // If an initial topic is specified, expand it; otherwise start all collapsed
        const expanded = new Set<HelpTopicId>();
        if (props.initialTopicId) {
            expanded.add(props.initialTopicId);
        }
        this.state = { expandedTopics: expanded };
    }

    /** @internal */
    override componentDidMount() {
        if (this.props.initialTopicId) {
            this._scrollToTopic(this.props.initialTopicId);
        }
    }

    /** @internal */
    override componentDidUpdate(prevProps: IHelpDialogProps) {
        if (this.props.initialTopicId && this.props.initialTopicId !== prevProps.initialTopicId) {
            this.setState(
                (prev) => {
                    const expanded = new Set(prev.expandedTopics);
                    expanded.add(this.props.initialTopicId!);
                    return { expandedTopics: expanded };
                },
                () => {
                    this._scrollToTopic(this.props.initialTopicId!);
                }
            );
        }
    }

    private _scrollToTopic(topicId: HelpTopicId) {
        requestAnimationFrame(() => {
            const ref = this._topicRefs.get(topicId);
            if (ref?.current) {
                ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    }

    private _toggleTopic(topicId: HelpTopicId) {
        this.setState((prev) => {
            const expanded = new Set(prev.expandedTopics);
            if (expanded.has(topicId)) {
                expanded.delete(topicId);
            } else {
                expanded.add(topicId);
            }
            return { expandedTopics: expanded };
        });
    }

    private _onOverlayClick = (evt: React.MouseEvent) => {
        // Close when clicking the overlay background (not the dialog itself)
        if (evt.target === evt.currentTarget) {
            this.props.onClose();
        }
    };

    /** @internal */
    override render() {
        return (
            <div className="fge-help-overlay" onClick={this._onOverlayClick}>
                <div className="fge-help-dialog">
                    <div className="fge-help-header">
                        <h2>Flow Graph Editor — Help</h2>
                        <button className="fge-help-close" onClick={this.props.onClose} title="Close">
                            ✕
                        </button>
                    </div>
                    <div className="fge-help-body">
                        {HelpTopics.map((topic) => {
                            const isExpanded = this.state.expandedTopics.has(topic.id);
                            return (
                                <div key={topic.id} className="fge-help-topic" ref={this._topicRefs.get(topic.id)}>
                                    <div className="fge-help-topic-header" onClick={() => this._toggleTopic(topic.id)}>
                                        <span className={`fge-help-topic-arrow ${isExpanded ? "expanded" : ""}`}>▶</span>
                                        <span className="fge-help-topic-title">{topic.title}</span>
                                    </div>
                                    {isExpanded && (
                                        <div className="fge-help-topic-content">
                                            {topic.sections.map((section, idx) => (
                                                <div key={idx}>
                                                    {section.heading && <h4>{section.heading}</h4>}
                                                    {/* Content is developer-authored from helpContent.ts — safe to render as HTML.
                                                        If this ever accepts user/external content, sanitize with DOMPurify first. */}
                                                    {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
                                                    <div dangerouslySetInnerHTML={{ __html: section.html }} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
}
