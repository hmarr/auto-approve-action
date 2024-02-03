import * as core from "@actions/core";
import * as github from "@actions/github";
import { Context } from "@actions/github/lib/context";
import { setupServer } from "msw/node";
import { approve } from "./approve";
import { run } from "./main";

jest.mock("./approve");
const mockedApprove = jest.mocked(approve);

jest.mock("@actions/github");
const mockedGithub = jest.mocked(github);

afterAll(() => {
  jest.unmock("./approve");
  jest.unmock("@actions/github");
});

const originalEnv = process.env;

const mockServer = setupServer();
beforeAll(() => mockServer.listen({ onUnhandledRequest: "error" }));
afterAll(() => mockServer.close());

beforeEach(() => {
  jest.restoreAllMocks();
  mockedApprove.mockReset();
  jest.spyOn(core, "setFailed").mockImplementation(jest.fn());

  process.env = {
    GITHUB_REPOSITORY: "hmarr/test",
    "INPUT_GITHUB-TOKEN": "tok-xyz",
  };
});

afterEach(() => {
  process.env = originalEnv;
});

test("passes the review message to approve", async () => {
  mockedGithub.context = ghContext();
  process.env["INPUT_REVIEW-MESSAGE"] = "LGTM";
  await run();
  expect(mockedApprove).toHaveBeenCalledWith({
    token: "tok-xyz",
    context: expect.anything(),
    prNumber: 101,
    reviewMessage: "LGTM",
  });
});

test("calls approve when no PR number is provided", async () => {
  mockedGithub.context = ghContext();
  await run();
  expect(mockedApprove).toHaveBeenCalledWith({
    token: "tok-xyz",
    context: expect.anything(),
    prNumber: 101,
    reviewMessage: undefined,
  });
});

test("calls approve when a valid PR number is provided", async () => {
  process.env["INPUT_PULL-REQUEST-NUMBER"] = "456";
  await run();
  expect(mockedApprove).toHaveBeenCalledWith({
    token: "tok-xyz",
    context: expect.anything(),
    prNumber: 456,
    reviewMessage: undefined,
  });
});

test("errors when an invalid PR number is provided", async () => {
  process.env["INPUT_PULL-REQUEST-NUMBER"] = "not a number";
  await run();
  expect(mockedApprove).not.toHaveBeenCalled();
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
