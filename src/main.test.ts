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
    "LGTM",
    expect.anything()
  );
});

test("calls approve when no PR number is provided", async () => {
  mockedGithub.context = ghContext();
  await run();
  expect(mockedApprove).toHaveBeenCalledWith(
    "tok-xyz",
    expect.anything(),
    101,
    undefined,
    expect.anything()
  );
});

test("calls approve when a valid PR number is provided", async () => {
  process.env["INPUT_PULL-REQUEST-NUMBER"] = "456";
  await run();
  expect(mockedApprove).toHaveBeenCalledWith(
    "tok-xyz",
    expect.anything(),
    456,
    undefined,
    expect.anything()
  );
});

test("errors when an invalid PR number is provided", async () => {
  process.env["INPUT_PULL-REQUEST-NUMBER"] = "not a number";
  await run();
  expect(mockedApprove).not.toHaveBeenCalled();
});

test("calls approve when force-review is set to true", async () => {
  process.env["INPUT_PULL-REQUEST-NUMBER"] = "456";
  process.env["INPUT_FORCE-REVIEW"] = "true";
  await run();
  expect(mockedApprove).toHaveBeenCalledWith(
    "tok-xyz",
    expect.anything(),
    456,
    undefined,
    true
  );
});

test("calls approve when force-review is set to false", async () => {
  process.env["INPUT_PULL-REQUEST-NUMBER"] = "456";
  await run();
  expect(mockedApprove).toHaveBeenCalledWith(
    "tok-xyz",
    expect.anything(),
    456,
    undefined,
    false
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
