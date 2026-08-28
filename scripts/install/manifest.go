package main

import (
    "encoding/json"
    "fmt"
    "io/ioutil"
    "log"
    "os"
    "path/filepath"
    "sort"
    "strings"
)

type Manifest struct {
    Name              string   `json:"name"`
    Description       string   `json:"description"`
    Path              string   `json:"path"`
    Type              string   `json:"type"`
    AllowedExtensions []string `json:"allowed_extensions"`
}

// findLatestICloudHelperPath searches for the iCloudPasswordsExtensionHelper.exe executable
// within the WindowsApps directory and returns the path of the most recent version.
func findLatestICloudHelperPath() (string, error) {
    baseDir := `C:\Program Files\WindowsApps`
    entries, err := ioutil.ReadDir(baseDir)
    if err != nil {
        return "", fmt.Errorf("failed to read WindowsApps directory: %w", err)
    }

    var candidates []string
    for _, entry := range entries {
        if strings.HasPrefix(entry.Name(), "AppleInc.iCloud_") {
            exePath := filepath.Join(baseDir, entry.Name(), "iCloud", "iCloudPasswordsExtensionHelper.exe")
            if _, statErr := os.Stat(exePath); statErr == nil {
                candidates = append(candidates, exePath)
            }
        }
    }

    if len(candidates) == 0 {
        return "", fmt.Errorf("no iCloudPasswordsExtensionHelper.exe found in %s", baseDir)
    }

    // Sort candidates in reverse alphabetical order and pick the first (latest) one
    sort.Slice(candidates, func(i, j int) bool {
        return candidates[i] > candidates[j]
    })

    return candidates[0], nil
}

func main() {
    // Path where the manifest JSON will be written
    manifestPath := `C:\Program Files\Mozilla Firefox\FirefoxPwdMgrHostApp_manifest.json`

    // Locate the installed iCloud helper executable
    helperPath, err := findLatestICloudHelperPath()
    if err != nil {
        log.Fatalf("error locating iCloud helper executable: %v", err)
    }

    manifest := Manifest{
        Name:        "com.apple.passwordmanager",
        Description: "Apple iCloud Chrome/Edge Password Manager Host App",
        Path:        helperPath,
        Type:        "stdio",
        AllowedExtensions: []string{
            "apple-passwords-firefox-extension@apple.com",
        },
    }

    // Serialize manifest to JSON with indentation
    data, err := json.MarshalIndent(manifest, "", "    ")
    if err != nil {
        log.Fatalf("error serializing manifest JSON: %v", err)
    }

    // Write JSON file
    if writeErr := ioutil.WriteFile(manifestPath, data, 0644); writeErr != nil {
        log.Fatalf("error writing manifest file: %v", writeErr)
    }

    fmt.Printf("Manifest successfully updated at %s using helper: %s\n", manifestPath, helperPath)
}
