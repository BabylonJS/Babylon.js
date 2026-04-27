# Contributing to Babylon.js

## Golden rules

**Babylon.js** is built upon 3 golden rules:

1. You cannot add code that will break backward compatibility
2. You cannot add code that will slow down the rendering process
3. You cannot add code that will make things complex to use

### Backward compatibility

The first golden rule is a really important one because we want our users to trust Babylon.js. And when we need to introduce something that will break backward compatibility, we know that it will imply more work for our customers to switch to a new version. So even if something could be simpler to do by breaking the backward compatibility, we will not do it (exceptions may apply of course if there is a problem with performance or if this is related to a bug).

### Performance

Babylon.js is a 3D rendering engine. So every piece of code has to be scrutinized to look for potential bottlenecks or slowdowns. Ultimately the goal is to render more with less resources.

### Simplicity

A developer should be able to quickly and easily learn to use the API.

Simplicity and a low barrier to entry are must-have features of every API. If you have any second thoughts about the complexity of a design, it is almost always much better to cut the feature from the current release and spend more time to get the design right for the next release.

You can always add to an API, you cannot ever remove anything from one. If the design does not feel right, and you ship it anyway, you are likely to regret having done so.

## Forum and Github issues

Since the very beginning, Babylon.js relies on a great forum and a tremendous community: [https://forum.babylonjs.com/](https://forum.babylonjs.com/). Please use the forum for **ANY questions you may have**.

Please use the Github issues (after discussing them on the forum) **only** for:

-   Bugs
-   Feature requests

We will try to enforce these rules as we consider the forum is a better place for discussions and learnings.

## Pull requests

We are not complicated people, but we still have some [coding guidelines](https://doc.babylonjs.com/contribute/toBabylon/approvedNamingConventions/)
Before submitting your PR, just check that everything goes well by [creating the minified version](https://doc.babylonjs.com/setup/support/minifiedVer/)

You should read the [how to contribute documentation](https://doc.babylonjs.com/contribute/toBabylon/) before working on your PR.

If you intend to only update the doc, this [documentation](https://doc.babylonjs.com/contribute/contributeToDocs/) would detail the process.

To validate your PR, please follow these steps:

-   Run `npm run build:dev` locally and make sure that no error is generated
-   Make sure that all public functions and classes are commented using JSDoc/TSDoc syntax
-   Run `npm run test:unit` for unit tests, and check the [how to contribute documentation: Visualization tests](https://doc.babylonjs.com/contribute/toBabylon/HowToContribute/#visualization-tests) section for information on how to run the visualization tests.

## What should go where

In order to not bloat the core engine with unwanted or unnecessary features (that we will need to maintain forever), here is a list of questions you could ask yourself before submitting a new feature (or feature request) for Babylon.js core engine:

-   Does my feature belong to a framework library?
-   Can my feature be used by multiple different applications?
-   Is there a general use case for this feature?
-   Does this feature already exist in a similar framework?

If your PR does not fall into the core category you can consider using our [Extensions repo](https://github.com/BabylonJS/Extensions) for more high level features.

## Managing Cloud Agents (GitHub Agentic Workflows)

This repository uses [GitHub Agentic Workflows](https://github.com/github/gh-aw) to run AI-powered automation in GitHub Actions. The workflow definitions live in `.github/workflows/*.md` files and are compiled to `.lock.yml` files before they can run.

If you want to create, update, or test these cloud agent workflows, we recommend installing the `gh-aw` CLI extension first:

```bash
gh extension install github/gh-aw
```

You can then compile, validate, and test workflows locally before checking them in. For example, to test a workflow from your working branch without merging to `main`:

```bash
# Compile your workflow changes
gh aw compile

# Run a workflow from your current branch
gh workflow run <workflow-name>.lock.yml --ref <your-branch>
```

> **Note:** The `gh-aw` extension is optional. It is only needed if you are working on the agent workflow definitions themselves. It is not required for general Babylon.js development.
