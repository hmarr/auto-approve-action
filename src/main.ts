import * as core from "@actions/core";
import * as github from "@actions/github";
import { approve } from "./approve";

async function run() {
  const token = core.getInput("github-token", { required: true });
  await approve(token, github.context.payload);
}

run();
