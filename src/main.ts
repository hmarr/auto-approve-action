import * as core from "@actions/core";
import * as github from "@actions/github";
import { approve } from "./approve";

async function run() {
  const token = core.getInput("github-token", { required: true });
  const prNumber: number = parseInt(core.getInput("pull-request-number"), 10);
  if (Number.isNaN(prNumber)) {
    await approve(token, github.context, prNumber);
  } else {
    await approve(token, github.context);
  }
}

run();
