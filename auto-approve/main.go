package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"strings"

	"github.com/google/go-github/v24/github"
	"golang.org/x/oauth2"
)

func main() {
	ctx := context.Background()
	client := newClient(ctx)

	f, err := os.Open(os.Getenv("GITHUB_EVENT_PATH"))
	if err != nil {
		log.Fatal(err)
	}
	decoder := json.NewDecoder(f)
	var triggerEvent github.PullRequestEvent
	if err := decoder.Decode(&triggerEvent); err != nil {
		log.Fatal(err)
	}

	fullRepo := os.Getenv("GITHUB_REPOSITORY")
	repo := strings.SplitN(fullRepo, "/", 2)
	if len(repo) != 2 {
		log.Fatalf("Invalid repo name: %s", fullRepo)
	}
	event := "APPROVE"
	req := &github.PullRequestReviewRequest{Event: &event}
	_, _, err = client.PullRequests.CreateReview(ctx, repo[0], repo[1], *triggerEvent.Number, req)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("Approved PR %d", *triggerEvent.Number)
}

func newClient(ctx context.Context) *github.Client {
	token := os.Getenv("GITHUB_TOKEN")

	ts := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: token},
	)
	tc := oauth2.NewClient(ctx, ts)
	return github.NewClient(tc)
}
