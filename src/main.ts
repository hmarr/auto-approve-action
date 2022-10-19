import * as core from "@actions/core";
import * as github from "@actions/github";
import { approve } from "./approve";

export async function run() {
  try {
    const token = core.getInput("github-token");
    const reviewMessage = core.getInput("review-message");
    await approve(
      token,
      github.context,
      prNumber(),
      reviewMessage || undefined,
      forceReview()
    );
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("Unknown error");
    }
  }
}

function prNumber(): number {
  if (core.getInput("pull-request-number") !== "") {
    const prNumber = parseInt(core.getInput("pull-request-number"), 10);
    if (Number.isNaN(prNumber)) {
      throw new Error("Invalid `pull-request-number` value");
    }
    return prNumber;
  }

  if (!github.context.payload.pull_request) {
    throw new Error(
      "This action must be run using a `pull_request` event or " +
        "have an explicit `pull-request-number` provided"
    );
  }
  return github.context.payload.pull_request.number;
}

function forceReview(): boolean {
  if (core.getInput("force-review") === undefined) {
    return false;
  }
  return (/true/i).test(core.getInput("force-review"))
}

if (require.main === module) {
  run();
}
