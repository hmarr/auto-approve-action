import * as core from "@actions/core";
import { Context } from "@actions/github/lib/context";
import { approve } from "./approve";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

const originalEnv = process.env;

beforeEach(() => {
  jest.restoreAllMocks();
  jest.spyOn(core, "setFailed").mockImplementation(jest.fn());
  jest.spyOn(core, "info").mockImplementation(jest.fn());

  process.env = { GITHUB_REPOSITORY: "hmarr/test" };
});

afterEach(() => {
  process.env = originalEnv;
});

const mockServer = setupServer();
beforeAll(() => mockServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

function mockOctokit(
  method: "get" | "post" | "put" | "delete",
  path: string,
  status: number,
  body: any
) {
  let isDone = false;
  mockServer.use(
    http[method](`https://api.github.com${path}`, () => {
      isDone = true;
      return HttpResponse.json(body, { status: status ?? 200 });
    })
  );
  return { isDone: () => isDone };
}

const apiMocks = {
  getUser: (status?: number, body?: object) =>
    mockOctokit("get", "/user", status ?? 200, body ?? { login: "hmarr" }),
  getPull: (status?: number, body?: object) =>
    mockOctokit(
      "get",
      "/repos/hmarr/test/pulls/101",
      status ?? 200,
      body ?? { head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" } }
    ),
  getReviews: (status?: number, body?: any) =>
    mockOctokit(
      "get",
      "/repos/hmarr/test/pulls/101/reviews",
      status ?? 200,
      body ?? []
    ),
  createReview: () =>
    mockOctokit("post", "/repos/hmarr/test/pulls/101/reviews", 200, {}),
};

test("a review is successfully created with a PAT", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  const createReview = apiMocks.createReview();

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      octokitOpts: { request: fetch },
    })
  ).toBeTruthy();
  expect(createReview.isDone()).toBe(true);
});

test("a review is successfully created with an Actions token", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  const createReview = apiMocks.createReview();

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      octokitOpts: { request: fetch },
    })
  ).toBeTruthy();
  expect(createReview.isDone()).toBe(true);
});

test("when a review is successfully created with message", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  const createReview = apiMocks.createReview();

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      reviewMessage: "Review body",
      octokitOpts: { request: fetch },
    })
  ).toBeTruthy();
  expect(createReview.isDone()).toBe(true);
});

test("when a review is successfully created using pull-request-number", async () => {
  apiMocks.getUser();
  mockOctokit("get", "/repos/hmarr/test/pulls/102", 200, {
    head: { sha: "24c5451bbf1fb09caa3ac8024df4788aff4d4974" },
  });
  mockOctokit("get", "/repos/hmarr/test/pulls/102/reviews", 200, []);

  const createReview = mockOctokit(
    "post",
    "/repos/hmarr/test/pulls/102/reviews",
    200,
    { id: 1 }
  );

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      prNumber: 102,
      octokitOpts: { request: fetch },
    })
  ).toBeTruthy();

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

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      octokitOpts: { request: fetch },
    })
  ).toBeFalsy();

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

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      prNumber: 101,
      octokitOpts: { request: fetch },
    })
  ).toBeTruthy();
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

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      prNumber: 101,
      octokitOpts: { request: fetch },
    })
  ).toBeTruthy();
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

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      prNumber: 101,
      octokitOpts: { request: fetch },
    })
  ).toBeTruthy();
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

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      prNumber: 101,
      octokitOpts: { request: fetch },
    })
  ).toBeTruthy();
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

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      prNumber: 101,
      octokitOpts: { request: fetch },
    })
  ).toBeTruthy();
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

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      prNumber: 101,
      octokitOpts: { request: fetch },
    })
  ).toBeTruthy();
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

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      prNumber: 101,
      octokitOpts: { request: fetch },
    })
  ).toBeTruthy();
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

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      prNumber: 101,
      octokitOpts: { request: fetch },
    })
  ).toBeTruthy();
  expect(createReview.isDone()).toBe(true);
});

test("without a pull request", async () => {
  const createReview = apiMocks.createReview();
  expect(
    await approve({
      token: "gh-tok",
      context: new Context(),
      octokitOpts: { request: fetch },
    })
  ).toBeFalsy();
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

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      octokitOpts: { request: fetch },
    })
  ).toBeFalsy();
  expect(createReview.isDone()).toBe(false);
  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("`github-token` input parameter")
  );
});

test("when the token doesn't have write permissions", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  mockOctokit("post", "/repos/hmarr/test/pulls/101/reviews", 403, {
    message: "Resource not accessible by integration",
  });

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      octokitOpts: { request: fetch },
    })
  ).toBeFalsy();
  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("pull_request_target")
  );
});

test("when a user tries to approve their own pull request", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  mockOctokit("post", "/repos/hmarr/test/pulls/101/reviews", 422, {
    message: "Unprocessable Entity",
  });

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      octokitOpts: { request: fetch },
    })
  ).toBeFalsy();
  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("same user account")
  );
});

test("when pull request does not exist or the token doesn't have access", async () => {
  apiMocks.getUser();
  apiMocks.getPull(404, { message: "Not Found" });
  apiMocks.getReviews(404, { message: "Not Found" });
  const createReview = apiMocks.createReview();

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      octokitOpts: { request: fetch },
    })
  ).toBeFalsy();
  expect(createReview.isDone()).toBe(false);
  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("doesn't have access")
  );
});

test("when the token is read-only", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  mockOctokit("post", "/repos/hmarr/test/pulls/101/reviews", 403, {
    message: "Not Authorized",
  });

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      octokitOpts: { request: fetch },
    })
  ).toBeFalsy();
  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("are read-only")
  );
});

test("when the token doesn't have write access to the repository", async () => {
  apiMocks.getUser();
  apiMocks.getPull();
  apiMocks.getReviews();
  mockOctokit("post", "/repos/hmarr/test/pulls/101/reviews", 404, {
    message: "Not Found",
  });

  expect(
    await approve({
      token: "gh-tok",
      context: ghContext(),
      octokitOpts: { request: fetch },
    })
  ).toBeFalsy();
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
