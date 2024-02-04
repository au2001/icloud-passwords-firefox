//go:build !windows && !darwin

package main

func GetChromeManifestPaths() []string {
	return getManifestPaths([]string{
		"/etc/opt/chrome/native-messaging-hosts/",
		"/etc/chromium/native-messaging-hosts/",
		"~/.config/google-chrome/NativeMessagingHosts/",
		"~/.config/chromium/NativeMessagingHosts/",
	})
}

func GetFirefoxManifestPaths() []string {
	return getManifestPaths([]string{
		"/usr/lib/mozilla/native-messaging-hosts/",
		"/usr/lib64/mozilla/native-messaging-hosts/",
		"~/.mozilla/native-messaging-hosts/",
	})
}

func RegisterFirefoxManifestPath(path string) error {
	// NOP
	return nil
}
