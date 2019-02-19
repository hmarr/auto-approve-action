workflow "New workflow" {
  on = "pull_request"
  resolves = ["Auto Approve"]
}

action "Filter user to dependabot" {
  uses = "actions/bin/filter@46ffca7632504e61db2d4cb16be1e80f333cb859"
  args = "user dependabot[bot]"
}

action "Auto Approve" {
  uses = "./auto-approve"
  needs = ["Filter user to dependabot"]
  secrets = ["GITHUB_TOKEN"]
}
