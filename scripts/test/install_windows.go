//go:build windows

package main

import (
	"golang.org/x/sys/windows/registry"
)

func getWindowsManifestPaths(keys []struct {
	registry.Key
	string
}) []string {
	paths := []string{}

	for _, key := range keys {
		k, err := registry.OpenKey(key.Key, key.string+NATIVE_MESSAGING_HOST, registry.QUERY_VALUE)
		if err != nil {
			continue
		}
		defer k.Close()

		path, _, err := k.GetStringValue("")
		if err != nil {
			continue
		}

		paths = append(paths, path)
	}

	return paths
}

func GetFirefoxManifestPaths() []string {
	return getWindowsManifestPaths([]struct {
		registry.Key
		string
	}{
		{registry.LOCAL_MACHINE, `SOFTWARE\Mozilla\NativeMessagingHosts\`},
		{registry.LOCAL_MACHINE, `SOFTWARE\WOW6432Node\WOW6432Node\NativeMessagingHosts\`},
		{registry.CURRENT_USER, `SOFTWARE\Mozilla\NativeMessagingHosts\`},
	})
}
