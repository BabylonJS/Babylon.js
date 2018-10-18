module BABYLON {
    /**
     * Class used to store custom tags
     */
    export class Tags {
        /**
         * Adds support for tags on the given object
         * @param obj defines the object to use
         */
        public static EnableFor(obj: any): void {
            obj._tags = obj._tags || {};

            obj.hasTags = () => {
                return Tags.HasTags(obj);
            };

            obj.addTags = (tagsString: string) => {
                return Tags.AddTagsTo(obj, tagsString);
            };

            obj.removeTags = (tagsString: string) => {
                return Tags.RemoveTagsFrom(obj, tagsString);
            };

            obj.matchesTagsQuery = (tagsQuery: string) => {
                return Tags.MatchesQuery(obj, tagsQuery);
            };
        }

        /**
         * Removes tags support
         * @param obj defines the object to use
         */
        public static DisableFor(obj: any): void {
            delete obj._tags;
            delete obj.hasTags;
            delete obj.addTags;
            delete obj.removeTags;
            delete obj.matchesTagsQuery;
        }

        /**
         * Gets a boolean indicating if the given object has tags
         * @param obj defines the object to use
         * @returns a boolean
         */
        public static HasTags(obj: any): boolean {
            if (!obj._tags) {
                return false;
            }
            return !Tools.IsEmpty(obj._tags);
        }

        /**
         * Gets the tags available on a given object
         * @param obj defines the object to use
         * @param asString defines if the tags must be returned as a string instead of an array of strings
         * @returns the tags
         */
        public static GetTags(obj: any, asString: boolean = true): any {
            if (!obj._tags) {
                return null;
            }
            if (asString) {
                var tagsArray = [];
                for (var tag in obj._tags) {
                    if (obj._tags.hasOwnProperty(tag) && obj._tags[tag] === true) {
                        tagsArray.push(tag);
                    }
                }
                return tagsArray.join(" ");
            } else {
                return obj._tags;
            }

        }

        /**
         * Adds tags to an object
         * @param obj defines the object to use
         * @param tagsString defines the tag string. The tags 'true' and 'false' are reserved and cannot be used as tags.
         * A tag cannot start with '||', '&&', and '!'. It cannot contain whitespaces
         */
        public static AddTagsTo(obj: any, tagsString: string): void {
            if (!tagsString) {
                return;
            }

            if (typeof tagsString !== "string") {
                return;
            }

            var tags = tagsString.split(" ");
            tags.forEach(function(tag, index, array) {
                Tags._AddTagTo(obj, tag);
            });
        }

        /**
         * @hidden
         */
        public static _AddTagTo(obj: any, tag: string): void {
            tag = tag.trim();

            if (tag === "" || tag === "true" || tag === "false") {
                return;
            }

            if (tag.match(/[\s]/) || tag.match(/^([!]|([|]|[&]){2})/)) {
                return;
            }

            Tags.EnableFor(obj);
            obj._tags[tag] = true;
        }

        /**
         * Removes specific tags from a specific object
         * @param obj defines the object to use
         * @param tagsString defines the tags to remove
         */
        public static RemoveTagsFrom(obj: any, tagsString: string) {
            if (!Tags.HasTags(obj)) {
                return;
            }
            var tags = tagsString.split(" ");
            for (var t in tags) {
                Tags._RemoveTagFrom(obj, tags[t]);
            }
        }

        /**
         * @hidden
         */
        public static _RemoveTagFrom(obj: any, tag: string): void {
            delete obj._tags[tag];
        }

        /**
         * Defines if tags hosted on an object match a given query
         * @param obj defines the object to use
         * @param tagsQuery defines the tag query
         * @returns a boolean
         */
        public static MatchesQuery(obj: any, tagsQuery: string): boolean {
            if (tagsQuery === undefined) {
                return true;
            }

            if (tagsQuery === "") {
                return Tags.HasTags(obj);
            }

            return AndOrNotEvaluator.Eval(tagsQuery, (r) => Tags.HasTags(obj) && obj._tags[r]);
        }
    }
}
