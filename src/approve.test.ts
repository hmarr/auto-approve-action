import * as core from "@actions/core";
import { Context } from "@actions/github/lib/context";
import { create } from "domain";
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

const apiNock = nock("https://api.github.com");
const apiMocks = {
  getUser: (status?: number, body?: object) =>
    apiNock.get("/user").reply(status ?? 200, body ?? { login: "hmarr" }),
  getPull: (status?: number, body?: object) =>
    apiNock
      .get("/repos/hmarr/test/pulls/101")
      .reply(
        status ?? 200,
        body ?? { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } }
      ),
  getReviews: (status?: number, body?: any) =>
    apiNock
      .get("/repos/hmarr/test/pulls/101/reviews")
      .reply(status ?? 200, body ?? []),
  createReview: () =>
    apiNock.post("/repos/hmarr/test/pulls/101/reviews").reply(200, {}),
};

test("a review is successfully created with a PAT", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  const createReview = apiMocks.createReview();

  await approve("gh-tok", ghContext());

  expect(createReview.isDone()).toBe(true);
});

test("a review is successfully created with an Actions token", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  const createReview = apiMocks.createReview();

  await approve("gh-tok", ghContext());

  expect(createReview.isDone()).toBe(true);
});

test("when a review is successfully created with message", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  const createReview = apiMocks.createReview();

  await approve("gh-tok", ghContext(), undefined, "Review body");

  expect(createReview.isDone()).toBe(true);
});

test("when a review is successfully created using pull-request-number", async () => {
  apiMocks.getUser();
  apiNock
    .get("/repos/hmarr/test/pulls/102")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });
  apiNock.get("/repos/hmarr/test/pulls/102/reviews").reply(200, []);

  const createReview = apiNock
    .post("/repos/hmarr/test/pulls/102/reviews")
    .reply(200, { id: 1 });

  await approve("gh-tok", new Context(), 102);

  expect(createReview.isDone()).toBe(true);
});

test("when a review has already been approved by current user", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews(200, [
    {
      user: { login: "hmarr" },
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "APPROVED",
    },
  ]);
  const createReview = apiMocks.createReview();

  await approve("gh-tok", ghContext());

  expect(createReview.isDone()).toBe(false);
  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining(
      "Current user already approved pull request #101, nothing to do"
    )
  );
});

test("when a review is pending", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews(200, [
    {
      user: { login: "hmarr" },
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "PENDING",
    },
  ]);
  const createReview = apiMocks.createReview();

  await approve("gh-tok", new Context(), 101);

  expect(createReview.isDone()).toBe(true);
});

test("when a review is dismissed", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews(200, [
    {
      user: { login: "hmarr" },
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "DISMISSED",
    },
  ]);
  const createReview = apiMocks.createReview();

  await approve("gh-tok", new Context(), 101);

  expect(createReview.isDone()).toBe(true);
});

test("when a review is dismissed, but an earlier review is approved", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews(200, [
    {
      user: { login: "hmarr" },
      commit_id: "6a9ec7556f0a7fa5b49527a1eea4878b8a22d2e0",
      state: "APPROVED",
    },
    {
      user: { login: "hmarr" },
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "DISMISSED",
    },
  ]);
  const createReview = apiMocks.createReview();

  await approve("gh-tok", new Context(), 101);

  expect(createReview.isDone()).toBe(true);
});

test("when a review is not approved", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews(200, [
    {
      user: { login: "hmarr" },
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "CHANGES_REQUESTED",
    },
  ]);
  const createReview = apiMocks.createReview();

  await approve("gh-tok", new Context(), 101);

  expect(createReview.isDone()).toBe(true);
});

test("when a review is commented", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews(200, [
    {
      user: { login: "hmarr" },
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "COMMENTED",
    },
  ]);
  const createReview = apiMocks.createReview();

  await approve("gh-tok", new Context(), 101);

  expect(createReview.isDone()).toBe(true);
});

test("when a review has already been approved by another user", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews(200, [
    {
      user: { login: "some" },
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "APPROVED",
    },
  ]);
  const createReview = apiMocks.createReview();

  await approve("gh-tok", new Context(), 101);

  expect(createReview.isDone()).toBe(true);
});

test("when a review has already been approved by unknown user", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews(200, [
    {
      user: null,
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "APPROVED",
    },
  ]);
  const createReview = apiMocks.createReview();

  await approve("gh-tok", new Context(), 101);

  expect(createReview.isDone()).toBe(true);
});

test("when a review has been previously approved by user and but requests a re-review", async () => {
  apiMocks.getUser();
  apiMocks.getPull(200, {
    head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" },
    requested_reviewers: [{ login: "hmarr" }],
  });
  apiMocks.getReviews(200, [
    {
      user: { login: "some" },
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "APPROVED",
    },
  ]);

  const createReview = apiMocks.createReview();

  await approve("gh-tok", new Context(), 101);

  expect(createReview.isDone()).toBe(true);
});

test("without a pull request", async () => {
  const createReview = apiMocks.createReview();
  await approve("gh-tok", new Context());

  expect(createReview.isDone()).toBe(false);
  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("Make sure you're triggering this")
  );
});

test("when the token is invalid", async () => {
  apiMocks.getUser(401, { message: "Bad credentials" });
  apiMocks.getPull(401, { message: "Bad credentials" });
  apiMocks.getReviews(401, { message: "Bad credentials" });
  const createReview = apiMocks.createReview();

  await approve("gh-tok", ghContext());

  expect(createReview.isDone()).toBe(false);
  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("`github-token` input parameter")
  );
});

test("when the token doesn't have write permissions", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  apiNock
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(403, { message: "Resource not accessible by integration" });

  await approve("gh-tok", ghContext());

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("pull_request_target")
  );
});

test("when a user tries to approve their own pull request", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  apiNock
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(422, { message: "Unprocessable Entity" });

  await approve("gh-tok", ghContext());

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("same user account")
  );
});

test("when pull request does not exist or the token doesn't have access", async () => {
  apiMocks.getUser();
  apiMocks.getPull(404, { message: "Not Found" });
  apiMocks.getReviews(404, { message: "Not Found" });
  const createReview = apiMocks.createReview();

  await approve("gh-tok", ghContext());

  expect(createReview.isDone()).toBe(false);
  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("doesn't have access")
  );
});

test("when the token is read-only", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  apiNock
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(403, { message: "Not Authorized" });

  await approve("gh-tok", ghContext());

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("are read-only")
  );
});

test("when the token doesn't have write access to the repository", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  apiNock
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
