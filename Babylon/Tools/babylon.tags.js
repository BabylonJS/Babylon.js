"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.Tags = BABYLON.Tags || {};

    BABYLON.Tags.EnableFor = function (obj) {
        obj._tags = obj._tags || {};

        obj.hasTags = function () {
            return BABYLON.Tags.HasTags(obj);
        };

        obj.addTags = function (tagsString) {
            return BABYLON.Tags.AddTagsTo(obj, tagsString);
        };

        obj.removeTags = function (tagsString) {
            return BABYLON.Tags.RemoveTagsFrom(obj, tagsString);
        };

        obj.matchesTagsQuery = function (tagsQuery) {
            return BABYLON.Tags.MatchesQuery(obj, tagsQuery);
        };
    };

    BABYLON.Tags.DisableFor = function (obj) {
        delete obj._tags;
        delete obj.hasTags;
        delete obj.addTags;
        delete obj.removeTags;
        delete obj.matchesTagsQuery;
    };

    BABYLON.Tags.HasTags = function (obj) {
        if (!obj._tags) {
            return false;
        }
        return !BABYLON.Tools.IsEmpty(obj._tags);
    };

    // the tags 'true' and 'false' are reserved and cannot be used as tags
    // a tag cannot start with '||', '&&', and '!'
    // it cannot contain whitespaces
    BABYLON.Tags.AddTagsTo = function (obj, tagsString) {
        if (!tagsString) {
            return;
        }

        var tags = tagsString.split(" ");
        for (var t in tags) {
            BABYLON.Tags._AddTagTo(obj, tags[t]);
        }
    };

    BABYLON.Tags._AddTagTo = function (obj, tag) {
        tag = tag.trim();

        if (tag === "" || tag === "true" || tag === "false") {
            return;
        }

        if (tag.match(/[\s]/) || tag.match(/^([!]|([|]|[&]){2})/)) {
            return;
        }

        BABYLON.Tags.EnableFor(obj);
        obj._tags[tag] = true;
    };

    BABYLON.Tags.RemoveTagsFrom = function (obj, tagsString) {
        if (!BABYLON.Tags.HasTags(obj)) {
            return;
        }
        var tags = tagsString.split(" ");
        for (var t in tags) {
            BABYLON.Tags._RemoveTagFrom(obj, tags[t]);
        }
    };
    

    BABYLON.Tags._RemoveTagFrom = function (obj, tag) {
        delete obj._tags[tag];
    };

    BABYLON.Tags.MatchesQuery = function (obj, tagsQuery) {
        if (tagsQuery === undefined) {
            return true;
        }

        if (tagsQuery === "") {
            return BABYLON.Tags.HasTags(obj);
        }

        return BABYLON.AndOrNotEvaluator.Eval(tagsQuery, function (r) {
            return BABYLON.Tags.HasTags(obj) && obj._tags[r];
        });
    };

})();