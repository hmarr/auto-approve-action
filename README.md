# Auto Approve GitHub Action

**Name:** `hmarr/auto-approve-action`

**Requires the `GITHUB_TOKEN` environment variable checkbox to be checked.**

Automatically approve GitHub pull requests. Combine with the filter action to
only auto-approve certain users. For example, to auto-approve
[Dependabot][dependabot] pull requests, use `actor dependabot[bot]` as the args
for the filter action.

<p align="center">
  <img src="docs/approve-workflow.png" width="200">
</p>

[dependabot]: https://github.com/marketplace/dependabot
