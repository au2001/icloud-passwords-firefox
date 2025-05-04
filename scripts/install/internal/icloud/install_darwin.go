//go:build darwin

package icloud

func GetChromeManifestPaths() []string {
	return getManifestPaths([]string{
		"/Library/Google/Chrome/NativeMessagingHosts/",
		"/Library/Application Support/Chromium/NativeMessagingHosts/",
		"~/Library/Application Support/Google/Chrome/NativeMessagingHosts/",
		"~/Library/Application Support/Chromium/NativeMessagingHosts/",
	})
}

func GetFirefoxManifestPaths() []string {
	return getManifestPaths([]string{
		"/Library/Application Support/Mozilla/NativeMessagingHosts/",
		"~/Library/Application Support/Mozilla/NativeMessagingHosts/",
	})
}

func RegisterFirefoxManifestPath(path string) error {
	// NOP
	return nil
}
