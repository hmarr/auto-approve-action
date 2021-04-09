import * as core from "@actions/core";
import { Context } from "@actions/github/lib/context";
import nock from "nock";
import { approve } from "./approve";

beforeEach(() => {
  jest.restoreAllMocks();
  jest.spyOn(core, "setFailed").mockImplementation(jest.fn());
  jest.spyOn(core, "info").mockImplementation(jest.fn());

  process.env["GITHUB_REPOSITORY"] = "hmarr/test";
});

test("when a review is successfully created", async () => {
  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, { id: 1 });

  await approve("gh-tok", ghContext(), 0);

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining("Approved pull request #101")
  );
});

test("when a review is successfully created using pull-request-number", async () => {
  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, { id: 1 });

  await approve("gh-tok", new Context(), 101);

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining("Approved pull request #101")
  );
});

test("without a pull request", async () => {
  await approve("gh-tok", new Context(), 0);

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("Make sure you're triggering this")
  );
});

test("when the token is invalid", async () => {
  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(401, { message: "Bad credentials" });

  await approve("gh-tok", ghContext(), 0);

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("`github-token` input parameter")
  );
});

test("when the token doesn't have write permissions", async () => {
  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(403, { message: "Resource not accessible by integration" });

  await approve("gh-tok", ghContext(), 0);

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("pull_request_target")
  );
});

test("when a user tries to approve their own pull request", async () => {
  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(422, { message: "Unprocessable Entity" });

  await approve("gh-tok", ghContext(), 0);

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("same user account")
  );
});

test("when the token doesn't have access to the repository", async () => {
  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(404, { message: "Not Found" });

  await approve("gh-tok", ghContext(), 0);

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("doesn't have access")
  );
});

function ghContext(): Context {
  const ctx = new Context();
  ctx.payload = {
    pull_request: {
      number: 101,
    },
  };
  return ctx;
}
