//go:build !windows && !darwin

package main

func GetFirefoxManifestPaths() []string {
	return getManifestPaths([]string{
		"/usr/lib/mozilla/native-messaging-hosts/",
		"/usr/lib64/mozilla/native-messaging-hosts/",
		"~/.mozilla/native-messaging-hosts/",
	})
}
