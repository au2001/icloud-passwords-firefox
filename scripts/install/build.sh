#!/usr/bin/env bash

cd `dirname "$0"`

build() {
    cmd="$1"
    os="$2"
    arch="$3"
    suffix="${4:-_$os}"

    if [ "$os" = "windows" ]
    then
        suffix="$suffix.exe"
    fi

    GOOS="$os" GOARCH="$arch" go build -o "./dist/$cmd$suffix" "cmd/$cmd/main.go"
}

rm -rf ./dist

build icloud_passwords_install windows amd64 &
build icloud_passwords_install linux amd64 &
build icloud_passwords_guest_helper windows amd64 &

wait
