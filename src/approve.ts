import * as core from "@actions/core";
import * as github from "@actions/github";
import { RequestError } from "@octokit/request-error";
import { Context } from "@actions/github/lib/context";

export async function approve(token: string, context: Context) {
  const { pull_request: pr } = context.payload;
  if (!pr) {
    core.setFailed(
      "Event payload missing `pull_request` key. Make sure you're " +
        "triggering this action on the `pull_request` or `pull_request_target` events."
    );
    return;
  }

  const client = github.getOctokit(token);

  core.info(`Creating approving review for pull request #${pr.number}`);
  try {
    await client.pulls.createReview({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: pr.number,
      event: "APPROVE",
    });
    core.info(`Approved pull request #${pr.number}`);
  } catch (error) {
    if (error instanceof RequestError) {
      switch (error.status) {
        case 401:
          core.setFailed(
            `${error.message}. Please check that the \`github-token\` input ` +
              `parameter is set correctly.`
          );
        case 403:
          core.setFailed(
            `${error.message}. In some cases, the GitHub token used for actions triggered ` +
              `from \`pull_request\` events are read-only, which can cause this problem. ` +
              `Switching to the \`pull_request_target\` event typically resolves this issue.`
          );
        default:
          core.setFailed(`Error (code ${error.status}): ${error.message}`);
      }
      return;
    }

    core.setFailed(error.message);
    return;
  }
}
