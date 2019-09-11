import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  try {
    const token = core.getInput("github-token", { required: true });

    console.log('payload')
    console.log(github.context.payload)
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run();
