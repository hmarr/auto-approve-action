FROM golang:1.11-stretch

LABEL "com.github.actions.name"="Auto Approve"
LABEL "com.github.actions.description"="Auto approve pull requests"
LABEL "com.github.actions.icon"="thumbs-up"
LABEL "com.github.actions.color"="green"

WORKDIR /go/src/app
COPY . .
ENV GO111MODULE=on
RUN go build -o action .
ENTRYPOINT ["/go/src/app/action"]
