# Auto Approve GitHub Action

**Name:** `hmarr/auto-approve-action`

**🔒 Requires the `GITHUB_TOKEN` environment variable checkbox to be checked.**

Automatically approve GitHub pull requests. Combine with the filter action to
only auto-approve certain users. For example, to auto-approve
[Dependabot][dependabot] pull requests, use `actor dependabot[bot]` as the args
for the filter action.

<p align="center">
  <img src="docs/approve-workflow.png" width="200">
</p>

*Note: the `uses` attribute requires a ref after the action name, so you'll need to use `hmarr/auto-approve-action@master`, or `hmarr/auto-approve-action@v1.0.0`.*

## Why?

GitHub lets you prevent merges of unapproved pull requests. However, it's occasionally useful to selectively circumvent this restriction - for instance, some people want Dependabot's automated pull requests to not require approval. Combining this action with the filter action lets you automatically approve certain pull requests.

[dependabot]: https://github.com/marketplace/dependabot
