FROM debian:9.5-slim

LABEL "repository"="http://github.com/hmarr/actions"
LABEL "homepage"="http://github.com/hmarr/actions"
LABEL "maintainer"="Harry Marr <harry@hmarr.com>"

LABEL "com.github.actions.name"="Debug Action"
LABEL "com.github.actions.description"="Log the action's environment variables and event"
LABEL "com.github.actions.icon"="code"
LABEL "com.github.actions.color"="yellow"

ADD entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
