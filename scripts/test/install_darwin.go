//go:build darwin

package main

func GetFirefoxManifestPaths() []string {
	return getManifestPaths([]string{
		"/Library/Application Support/Mozilla/NativeMessagingHosts/",
		"~/Library/Application Support/Mozilla/NativeMessagingHosts/",
	})
}
