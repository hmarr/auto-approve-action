import * as core from "@actions/core";
import { WebhookPayload } from "@actions/github/lib/interfaces";
import { approve } from "./approve";

beforeEach(() => {
  jest.restoreAllMocks();

  process.env["GITHUB_REPOSITORY"] = "hmarr/test";
});

test("without a pull request", async () => {
  const spy = jest.spyOn(core, "setFailed");

  const payload: WebhookPayload = {};
  await approve("gh-tok", payload);

  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining("missing `pull_request`")
  );
});
