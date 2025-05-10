package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"slices"

	"icloud_passwords_install/internal/icloud"
)

func main() {
	mode := flag.String("mode", "native", "Mode to run in: native or tunnel")
	tunnelAddress := flag.String("tunnel-address", "", "Tunnel address to use")
	flag.Parse()

	if *mode == "tunnel" {
		if tunnelAddress == nil || *tunnelAddress == "" {
			fmt.Println("Tunnel address is required in tunnel mode.")
		}
		installTunnel(*tunnelAddress)
		return
	} else if *mode != "native" {
		fmt.Println("Invalid mode. Use 'native' or 'tunnel'.")
		os.Exit(5)
	}

	firefoxManifests := icloud.GetFirefoxManifestPaths()

	for _, manifestPath := range firefoxManifests {
		manifest, err := icloud.ReadManifest(manifestPath)
		if err != nil {
			continue
		}

		if slices.Contains(manifest.AllowedExtensions, icloud.EXTENSION_ID) {
			fmt.Printf("Firefox native messaging host already setup at %s\n", manifestPath)
			return
		}

		manifest.AllowedExtensions = append(manifest.AllowedExtensions, icloud.EXTENSION_ID)
		err = manifest.Register(manifestPath)
		if err != nil {
			fmt.Printf("Failed to update Firefox native messaging host manifest at %s: %s\n", manifestPath, err)
			os.Exit(1)
		}

		fmt.Printf("Successfully updated Firefox native messaging host manifest at %s\n", manifestPath)
		return
	}

	if len(firefoxManifests) == 0 {
		fmt.Printf("Couldn't find any Firefox native messaging host manifest path to use\n")
		os.Exit(2)
	}

	for _, manifestPath := range icloud.GetChromeManifestPaths() {
		manifest, err := icloud.ReadManifest(manifestPath)
		if err != nil {
			continue
		}

		manifest.Path = filepath.Join(filepath.Dir(manifestPath), manifest.Path)
		manifest.AllowedOrigins = nil
		manifest.AllowedExtensions = []string{icloud.EXTENSION_ID}

		err = manifest.Register(firefoxManifests[0])
		if err != nil {
			fmt.Printf("Failed to register Firefox native messaging host manifest at %s: %s\n", firefoxManifests[0], err)
			os.Exit(3)
		}

		fmt.Printf("Successfully registered Firefox native messaging host manifest at %s\n", firefoxManifests[0])
		return
	}

	fmt.Println("No Firefox/Chrome native messaging host manifest found")
	os.Exit(4)
}

func installTunnel(tunnelAddress string) {
	helperScript := fmt.Sprintf("#!/bin/sh\nsocat STDIO TCP:%s,keepalive\n", tunnelAddress)

	for _, path := range icloud.GetFirefoxManifestPaths() {
		directory := filepath.Dir(path)
		helperPath := filepath.Join(directory, "icloud_passwords_host_helper.sh")

		manifest := icloud.Manifest{
			Name:              icloud.NATIVE_MESSAGING_HOST,
			Description:       "iCloud Passwords Extension Helper",
			Path:              helperPath,
			Type:              "stdio",
			AllowedExtensions: []string{icloud.EXTENSION_ID},
		}

		if err := manifest.Register(path); err != nil {
			fmt.Printf("Failed to register Firefox native messaging host manifest at %s: %s\n", path, err)
			continue
		}

		err := os.WriteFile(helperPath, []byte(helperScript), 0744)
		if err != nil {
			fmt.Printf("Failed to write host helper script at %s: %s\n", path, err)
			continue
		}

		fmt.Printf("Successfully wrote host helper script at %s\n", helperPath)
		fmt.Printf("Successfully updated Firefox native messaging host manifest at %s\n", path)
		return
	}
}
