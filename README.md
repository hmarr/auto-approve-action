# Auto Approve GitHub Action

**Name:** `hmarr/auto-approve-action`

Automatically approve GitHub pull requests. The `GITHUB_TOKEN` secret must be provided as the `github-token` input for the action to work.

**Important:** use v2.0.0 or later, as v1 was designed for the initial GitHub Actions beta, and no longer works.

## Usage instructions

Create a workflow file (e.g. `.github/workflows/auto-approve.yml`) that contains a step that `uses: hmarr/auto-approve-action@v2.0.0`. Here's an example workflow file:

```yaml
name: Auto approve
on: pull_request

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: hmarr/auto-approve-action@v2.0.0
      with:
        github-token: "${{ secrets.GITHUB_TOKEN }}"
```


Combine with an `if` clause to only auto-approve certain users. For example, to auto-approve [Dependabot][dependabot] pull requests, use:

```yaml
    ...
    steps:
    - uses: hmarr/auto-approve-action@v2.0.0
      if: github.actor == 'dependabot[bot]' || github.actor == 'dependabot-preview[bot]'
      with:
        github-token: "${{ secrets.GITHUB_TOKEN }}"
    ...
```

## Why?

GitHub lets you prevent merges of unapproved pull requests. However, it's occasionally useful to selectively circumvent this restriction - for instance, some people want Dependabot's automated pull requests to not require approval.

[dependabot]: https://github.com/marketplace/dependabot
