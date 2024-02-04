package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
)

type Manifest struct {
	Name              string   `json:"name"`
	Description       string   `json:"description,omitempty"`
	Path              string   `json:"path"`
	Type              string   `json:"type"`
	AllowedExtensions []string `json:"allowed_extensions,omitempty"`
	AllowedOrigins    []string `json:"allowed_origins,omitempty"`
}

func ReadManifest(path string) (*Manifest, error) {
	bytes, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var manifest Manifest
	err = json.Unmarshal(bytes, &manifest)
	if err != nil {
		return nil, err
	}

	return &manifest, nil
}

func getManifestPaths(dirs []string) []string {
	paths := make([]string, len(dirs))

	home, _ := os.UserHomeDir()

	for i, dir := range dirs {
		if home != "" && strings.HasPrefix(dir, "~/") {
			dir = filepath.Join(home, dir[2:])
		}

		paths[i] = dir + NATIVE_MESSAGING_HOST + ".json"
	}

	return paths
}
