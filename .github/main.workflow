workflow "New workflow" {
  resolves = ["Auto Approve"]
  on = "pull_request"
}

action "Auto Approve" {
  uses = "./action-auto-approve"
  secrets = ["GITHUB_TOKEN"]
}
