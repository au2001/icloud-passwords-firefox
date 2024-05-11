#!/usr/bin/env bash

cd `dirname "$0"`

build() {
    os="$1"
    arch="$2"
    suffix="${3:-_$os}"

    if [ "$os" = "windows" ]
    then
        suffix="$suffix.exe"
    fi

    GOOS="$os" GOARCH="$arch" go build -o "./dist/keychain_passwords_for_macos_install$suffix"
}

rm -rf ./dist

# build linux amd64 &
# build darwin amd64 -macos &
build windows amd64 &

wait
