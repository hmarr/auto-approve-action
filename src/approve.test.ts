import * as core from "@actions/core";
import { Context } from "@actions/github/lib/context";
import nock from "nock";
import { approve } from "./approve";

const originalEnv = process.env;

beforeEach(() => {
  jest.restoreAllMocks();
  jest.spyOn(core, "setFailed").mockImplementation(jest.fn());
  jest.spyOn(core, "info").mockImplementation(jest.fn());
  nock.disableNetConnect();

  process.env = { GITHUB_REPOSITORY: "hmarr/test" };
});

afterEach(() => {
  nock.cleanAll();
  nock.enableNetConnect();
  process.env = originalEnv;
});

test("a review is successfully created with a PAT", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, []);

  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, { id: 1 });

  await approve("gh-tok", ghContext());

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining("Approved pull request #101")
  );
});

test("a review is successfully created with an Actions token", async () => {
  nock("https://api.github.com").get("/user").reply(403, {});

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, []);

  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, { id: 1 });

  await approve("gh-tok", ghContext());

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining("Approved pull request #101")
  );
});

test("when a review is successfully created with message", async () => {
  nock("https://api.github.com").get("/user").reply(403, {});

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, []);

  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, { id: 1 });

  await approve("gh-tok", ghContext(), undefined, "Review body");

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining("Approved pull request #101")
  );
});

test("when a review is successfully created using pull-request-number", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/102")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/102/reviews")
    .reply(200, []);

  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/102/reviews")
    .reply(200, { id: 1 });

  await approve("gh-tok", new Context(), 102);

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining("Approved pull request #102")
  );
});

test("when a review has already been approved by current user", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, [
      {
        user: { login: "hmarr" },
        commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
        state: "APPROVED",
      },
    ]);

  await approve("gh-tok", ghContext());

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining(
      "Current user already approved pull request #101, nothing to do"
    )
  );
});

test("when a review is pending", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, [
      {
        user: { login: "hmarr" },
        commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
        state: "PENDING",
      },
    ]);

  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, { id: 1 });

  await approve("gh-tok", new Context(), 101);

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining("Approved pull request #101")
  );
});

test("when a review is dismissed", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, [
      {
        user: { login: "hmarr" },
        commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
        state: "DISMISSED",
      },
    ]);

  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, { id: 1 });

  await approve("gh-tok", new Context(), 101);

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining("Approved pull request #101")
  );
});

test("when a review is not approved", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, [
      {
        user: { login: "hmarr" },
        commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
        state: "CHANGES_REQUESTED",
      },
    ]);

  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, { id: 1 });

  await approve("gh-tok", new Context(), 101);

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining("Approved pull request #101")
  );
});

test("when a review is commented", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, [
      {
        user: { login: "hmarr" },
        commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
        state: "COMMENTED",
      },
    ]);

  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, { id: 1 });

  await approve("gh-tok", new Context(), 101);

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining("Approved pull request #101")
  );
});

test("when an old commit has already been approved", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, [
      {
        user: { login: "hmarr" },
        commit_id: "6a9ec7556f0a7fa5b49527a1eea4878b8a22d2e0",
        state: "APPROVED",
      },
    ]);

  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, { id: 1 });

  await approve("gh-tok", ghContext());

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining("Approved pull request #101")
  );
});

test("when a review has already been approved by another user", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, [
      {
        user: { login: "some" },
        commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
        state: "APPROVED",
      },
    ]);

  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, { id: 1 });

  await approve("gh-tok", new Context(), 101);

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining("Approved pull request #101")
  );
});

test("when a review has already been approved by another user and forceReview is set to true", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, [
      {
        user: { login: "some" },
        commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
        state: "APPROVED",
      },
    ]);

  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, { id: 1 });

  await approve("gh-tok", new Context(), 101, undefined, true);

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining("Approved pull request #101")
  );
});

test("when a review has already been approved by unknown user", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, [
      {
        user: null,
        commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
        state: "APPROVED",
      },
    ]);

  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, { id: 1 });

  await approve("gh-tok", new Context(), 101);

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining("Approved pull request #101")
  );
});

test("without a pull request", async () => {
  await approve("gh-tok", new Context());

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("Make sure you're triggering this")
  );
});

test("when the token is invalid", async () => {
  nock("https://api.github.com")
    .get("/user")
    .reply(401, { message: "Bad credentials" });

  await approve("gh-tok", ghContext());

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("`github-token` input parameter")
  );
});

test("when the token doesn't have write permissions", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, []);

  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(403, { message: "Resource not accessible by integration" });

  await approve("gh-tok", ghContext());

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("pull_request_target")
  );
});

test("when a user tries to approve their own pull request", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, []);

  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(422, { message: "Unprocessable Entity" });

  await approve("gh-tok", ghContext());

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("same user account")
  );
});

test("when pull request does not exist", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(404, { message: "Not Found" });

  await approve("gh-tok", ghContext());

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("doesn't have access")
  );
});

test("when the token doesn't have read access to the repository", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(404, { message: "Not Found" });

  await approve("gh-tok", ghContext());

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("doesn't have access")
  );
});

test("when the token is read-only", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, []);

  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(403, { message: "Not Authorized" });

  await approve("gh-tok", ghContext());

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("are read-only")
  );
});

test("when the token doesn't have write access to the repository", async () => {
  nock("https://api.github.com").get("/user").reply(200, { login: "hmarr" });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });

  nock("https://api.github.com")
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(200, []);

  nock("https://api.github.com")
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(404, { message: "Not Found" });

  await approve("gh-tok", ghContext());

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
