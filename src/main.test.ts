import * as core from "@actions/core";
import * as github from "@actions/github";
import { Context } from "@actions/github/lib/context";
import nock from "nock";
import { approve } from "./approve";
import { run } from "./main";

jest.mock("./approve");
const mockedApprove = jest.mocked(approve, true);

jest.mock("@actions/github");
const mockedGithub = jest.mocked(github, true);

afterAll(() => {
  jest.unmock("./approve");
  jest.unmock("@actions/github");
});

const originalEnv = process.env;

beforeEach(() => {
  jest.restoreAllMocks();
  mockedApprove.mockReset();
  jest.spyOn(core, "setFailed").mockImplementation(jest.fn());
  nock.disableNetConnect();

  process.env = {
    GITHUB_REPOSITORY: "hmarr/test",
    "INPUT_GITHUB-TOKEN": "tok-xyz",
  };
});

afterEach(() => {
  nock.enableNetConnect();
  process.env = originalEnv;
});

test("passes the review message to approve", async () => {
  mockedGithub.context = ghContext();
  process.env["INPUT_REVIEW-MESSAGE"] = "LGTM";
  await run();
  expect(mockedApprove).toHaveBeenCalledWith(
    "tok-xyz",
    expect.anything(),
    101,
    "LGTM"
  );
});

test("calls approve when no PR number is provided", async () => {
  mockedGithub.context = ghContext();
  await run();
  expect(mockedApprove).toHaveBeenCalledWith(
    "tok-xyz",
    expect.anything(),
    101,
    undefined
  );
});

test("calls approve when a valid PR number is provided", async () => {
  process.env["INPUT_PULL-REQUEST-NUMBER"] = "456";
  await run();
  expect(mockedApprove).toHaveBeenCalledWith(
    "tok-xyz",
    expect.anything(),
    456,
    undefined
  );
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
