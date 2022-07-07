import * as core from "@actions/core";
import * as github from "@actions/github";
import { approve } from "./approve";

async function run() {
  try {
    const token = core.getInput("github-token", { required: true });
    const reviewMessage = core.getInput("review-message");
    const prNumber: number =
      parseInt(core.getInput("pull-request-number"), 10) ??
      github.context.payload.pull_request?.number;
    await approve(token, github.context, prNumber, reviewMessage);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("Unknown error");
    }
  }
}

run();
