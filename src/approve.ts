import * as core from "@actions/core";
import * as github from "@actions/github";
import { WebhookPayload } from "@actions/github/lib/interfaces";

export async function approve(token: string, payload: WebhookPayload) {
  try {
    const { pull_request: pr } = payload;
    if (!pr) {
      throw new Error("Event payload missing `pull_request`");
    }

    const client = github.getOctokit(token);

    core.debug(`Creating approving review for pull request #${pr.number}`);
    await client.pulls.createReview({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: pr.number,
      event: "APPROVE",
    });
    core.debug(`Approved pull request #${pr.number}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}
