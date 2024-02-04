package main

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"slices"
)

const (
	NATIVE_MESSAGING_HOST = "com.apple.passwordmanager"
	EXTENSION_ID          = "password-manager-firefox-extension@apple.com"
)

func test(manifestPath string, manifest *Manifest) error {
	cmd := exec.Command(manifest.Path, "path/to/manifest.json", EXTENSION_ID)

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return err
	}
	defer stdin.Close()

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	defer stdout.Close()

	err = cmd.Start()
	if err != nil {
		return err
	}

	data, err := json.Marshal(map[string]interface{}{
		"cmd": 14,
	})
	if err != nil {
		return err
	}

	err = binary.Write(stdin, binary.NativeEndian, uint32(len(data)))
	if err != nil {
		return err
	}

	binary.Write(stdin, binary.NativeEndian, []byte(data))
	if err != nil {
		return err
	}

	var l uint32
	binary.Read(stdout, binary.NativeEndian, &l)

	output := make([]byte, l)
	binary.Read(stdout, binary.NativeEndian, output)

	fmt.Println(string(output))

	return nil
}

func main() {
	for _, manifestPath := range GetFirefoxManifestPaths() {
		manifest, err := ReadManifest(manifestPath)
		if err != nil {
			continue
		}

		if !slices.Contains(manifest.AllowedExtensions, EXTENSION_ID) {
			continue
		}

		err = test(manifestPath, manifest)
		if err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
		return
	}

	fmt.Println("Firefox native messaging host has not been setup")
	os.Exit(2)
}
