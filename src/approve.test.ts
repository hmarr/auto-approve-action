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

const apiNock = nock("https://api.github.com");
const apiMocks = {
  getUser: () => apiNock.get("/user").reply(200, { login: "hmarr" }),
  getPull: () =>
    apiNock.get("/repos/hmarr/test/pulls/101").reply(200, {
      head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" },
    }),
  getReviews: (reviews?: object[]) =>
    apiNock
      .get("/repos/hmarr/test/pulls/101/reviews")
      .reply(200, reviews ?? []),
  getRequestedReviewers: (reviewers?: object) =>
    apiNock
      .get("/repos/hmarr/test/pulls/101/requested_reviewers")
      .reply(200, reviewers ?? {}),
  createReview: () =>
    apiNock.post("/repos/hmarr/test/pulls/101/reviews").reply(200, {}),
};

test("a review is successfully created with a PAT", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  apiMocks.getRequestedReviewers();
  const createReview = apiMocks.createReview();

  await approve("gh-tok", ghContext());

  expect(createReview.isDone()).toBe(true);
});

test("a review is successfully created with an Actions token", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  apiMocks.getRequestedReviewers();
  const createReview = apiMocks.createReview();

  await approve("gh-tok", ghContext());

  expect(createReview.isDone()).toBe(true);
});

test("when a review is successfully created with message", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  apiMocks.getRequestedReviewers();
  const createReview = apiMocks.createReview();

  await approve("gh-tok", ghContext(), undefined, "Review body");

  expect(createReview.isDone()).toBe(true);
});

test("when a review is successfully created using pull-request-number", async () => {
  apiMocks.getUser();
  apiNock
    .get("/repos/hmarr/test/pulls/102")
    .reply(200, { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } });
  apiNock.get("/repos/hmarr/test/pulls/102/requested_reviewers").reply(200, []);
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
  apiMocks.getReviews([
    {
      user: { login: "hmarr" },
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "APPROVED",
    },
  ]);
  apiMocks.getRequestedReviewers();
  const createReview = apiMocks.createReview();

  await approve("gh-tok", ghContext());

  expect(createReview.isDone()).toBe(false);
  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining(
      "Current user already approved pull request #101, nothing to do"
    )
  );
});
test("when a review has already been approved but subsequently re-requested", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews([
    {
      user: { login: "hmarr" },
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "APPROVED",
    },
  ]);
  apiMocks.getRequestedReviewers({ users: [{ login: "hmarr" }] });
  const createReview = apiMocks.createReview();

  await approve("gh-tok", ghContext());

  expect(createReview.isDone()).toBe(true);
});

test("when a review is pending", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews([
    {
      user: { login: "hmarr" },
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "PENDING",
    },
  ]);
  apiMocks.getRequestedReviewers();
  const createReview = apiMocks.createReview();

  await approve("gh-tok", new Context(), 101);

  expect(createReview.isDone()).toBe(true);
});

test("when a review is dismissed", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews([
    {
      user: { login: "hmarr" },
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "DISMISSED",
    },
  ]);
  apiMocks.getRequestedReviewers();
  const createReview = apiMocks.createReview();

  await approve("gh-tok", new Context(), 101);

  expect(createReview.isDone()).toBe(true);
});

test("when a review is not approved", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews([
    {
      user: { login: "hmarr" },
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "CHANGES_REQUESTED",
    },
  ]);
  apiMocks.getRequestedReviewers();
  const createReview = apiMocks.createReview();

  await approve("gh-tok", new Context(), 101);

  expect(createReview.isDone()).toBe(true);
});

test("when a review is commented", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews([
    {
      user: { login: "hmarr" },
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "COMMENTED",
    },
  ]);
  apiMocks.getRequestedReviewers();
  const createReview = apiMocks.createReview();

  await approve("gh-tok", new Context(), 101);

  expect(createReview.isDone()).toBe(true);
});

test("when an old commit has already been approved", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews([
    {
      user: { login: "hmarr" },
      commit_id: "6a9ec7556f0a7fa5b49527a1eea4878b8a22d2e0",
      state: "APPROVED",
    },
  ]);
  apiMocks.getRequestedReviewers();
  const createReview = apiMocks.createReview();

  await approve("gh-tok", ghContext());

  expect(createReview.isDone()).toBe(true);
});

test("when a review has already been approved by another user", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews([
    {
      user: { login: "some" },
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "APPROVED",
    },
  ]);
  apiMocks.getRequestedReviewers();
  const createReview = apiMocks.createReview();

  await approve("gh-tok", new Context(), 101);

  expect(createReview.isDone()).toBe(true);
});

test("when a review has already been approved by unknown user", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews([
    {
      user: null,
      commit_id: "24c5451bbf1fb09caa3ac8024df4788aff4d4974",
      state: "APPROVED",
    },
  ]);
  apiMocks.getRequestedReviewers();
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
  apiNock.get("/user").reply(401, { message: "Bad credentials" });
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
  apiMocks.getRequestedReviewers();
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
  apiMocks.getRequestedReviewers();
  apiNock
    .post("/repos/hmarr/test/pulls/101/reviews")
    .reply(422, { message: "Unprocessable Entity" });

  await approve("gh-tok", ghContext());

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("same user account")
  );
});

test("when pull request does not exist or the token doesn't have repo access", async () => {
  apiMocks.getUser();
  apiNock
    .get("/repos/hmarr/test/pulls/101")
    .reply(404, { message: "Not Found" });
  apiNock
    .get("/repos/hmarr/test/pulls/101/reviews")
    .reply(404, { message: "Not Found" });
  apiNock
    .get("/repos/hmarr/test/pulls/101/requested_reviewers")
    .reply(404, { message: "Not Found" });
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
  apiMocks.getRequestedReviewers();
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
  apiMocks.getRequestedReviewers();
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
