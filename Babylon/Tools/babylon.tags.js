"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.Tags = BABYLON.Tags || {};

    BABYLON.Tags.EnableFor = function (obj) {
        obj._tags = obj._tags || {};
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