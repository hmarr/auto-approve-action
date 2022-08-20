# Auto Approve GitHub Action

**Name:** `hmarr/auto-approve-action`

Automatically approve GitHub pull requests.

**Important:** use v2 or later, as v1 was designed for the initial GitHub Actions beta, and no longer works.

## Usage instructions

Create a workflow file (e.g. `.github/workflows/auto-approve.yml`) that contains a step that `uses: hmarr/auto-approve-action@v2`. Here's an example workflow file:

```yaml
name: Auto approve
on: pull_request_target

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: hmarr/auto-approve-action@v2
```

Combine with an `if` clause to only auto-approve certain users. For example, to auto-approve [Dependabot][dependabot] pull requests, use:

```yaml
name: Auto approve

on: pull_request

jobs:
  auto-approve:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: hmarr/auto-approve-action@v2
        if: github.actor == 'dependabot[bot]'
```

If you want to use this action from a workflow file that doesn't run on the `pull_request` or `pull_request_target` events, use the `pull-request-number` input:

```yaml
name: Auto approve

on:
  workflow_dispatch:
    inputs: pullRequestNumber
      description: Pull request number to auto-approve
      required: false

jobs:
  auto-approve:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
    - uses: hmarr/auto-approve-action@v2
      with:
        pull-request-number: ${{ github.event.inputs.pullRequestNumber }}
```

Optionally, you can provide a message for the review:

```yaml
name: Auto approve

on: pull_request

jobs:
  auto-approve:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: hmarr/auto-approve-action@v2
        if: github.actor == 'dependabot[bot]'
        with:
          review-message: "Auto approved automated PR"
```

By default, this will use the [automatic GitHub token](https://docs.github.com/en/actions/security-guides/automatic-token-authentication) that's provided to the workflow. This means the approval will come from the "github-actions" bot user. Make sure you enable the `pull-requests: write` permission in your workflow.

To approve the pull request as a different user, pass a GitHub Personal Access Token into the `github-token` input:

```yaml
name: Auto approve

on: pull_request

jobs:
  auto-approve:
    runs-on: ubuntu-latest
    steps:
      - uses: hmarr/auto-approve-action@v2
        with:
          github-token: ${{ secrets.SOME_USERS_PAT }}
```

## Why?

GitHub lets you prevent merges of unapproved pull requests. However, it's occasionally useful to selectively circumvent this restriction - for instance, some people want Dependabot's automated pull requests to not require approval.

[dependabot]: https://github.com/marketplace/dependabot

## Code owners

If you're using a [CODEOWNERS file](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/about-code-owners), you'll need to give this action a personal access token for a user listed as a code owner. Rather than using a real user's personal access token, you're probably better off creating a dedicated bot user, and adding it to a team which you assign as the code owner. That way you can restrict the bot user's permissions as much as possible, and your workflow won't break when people leave the team.

## Development and release process

Each major version corresponds to a branch (e.g. `v1`, `v2`). The latest major version (`v2` at the time of writing) is the repository's default branch. Releases are tagged with semver-style version numbers (e.g. `v1.2.3`).
