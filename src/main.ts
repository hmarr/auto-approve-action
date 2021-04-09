import * as core from "@actions/core";
import * as github from "@actions/github";
import { approve } from "./approve";

async function run() {
  const token = core.getInput("github-token", { required: true });
  const pr_number: number = JSON.parse(
    core.getInput("pull-request-number") || "0"
  );
  await approve(token, github.context, pr_number);
}

run();
