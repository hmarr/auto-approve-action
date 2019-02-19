FROM golang:1.11-stretch

LABEL "com.github.actions.name"="Auto Approve"
LABEL "com.github.actions.description"="Auto approve pull requests"
LABEL "com.github.actions.icon"="mic"
LABEL "com.github.actions.color"="green"

WORKDIR /go/src/app
COPY . .
ENV GO111MODULE=on
RUN go build -o action .
ENTRYPOINT ["/go/src/app/action"]

#LABEL "repository"="http://github.com/octocat/hello-world"
#LABEL "homepage"="http://github.com/actions"
#LABEL "maintainer"="Octocat <octocat@github.com>"

#ADD entrypoint.sh /entrypoint.sh
#ENTRYPOINT ["/entrypoint.sh"]
