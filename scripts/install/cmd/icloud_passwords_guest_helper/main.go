package main

import (
	"flag"
	"fmt"
	"log"
	"net"
	"os/exec"
	"path/filepath"

	"icloud_passwords_install/internal/icloud"
)

const DEFAULT_LISTEN_ADDRESS = "0.0.0.0:4646"

func main() {
	listenAddress := flag.String("address", DEFAULT_LISTEN_ADDRESS, "Address to listen on")
	extensionHelperPath := flag.String("helper-path", "", "Path to the iCloud passwords extension helper executable")
	flag.Parse()

	if *extensionHelperPath == "" {
		if path, err := findExtensionHelperPath(); err != nil {
			log.Fatalf("No iCloud passwords extension helper found. Please specify the path using --helper-path.")
			return
		} else {
			extensionHelperPath = &path
		}
	}

	log.Printf("Using iCloud passwords extension helper at %s", *extensionHelperPath)

	startServer(*listenAddress, *extensionHelperPath)
}

func findExtensionHelperPath() (string, error) {
	for _, path := range icloud.GetChromeManifestPaths() {
		manifest, err := icloud.ReadManifest(path)
		if err == nil {
			return filepath.Join(filepath.Dir(path), manifest.Path), nil
		}
	}
	return "", fmt.Errorf("no iCloud passwords extension helper found")
}

func startServer(listenAddress string, extensionHelperPath string) {
	listener, err := net.Listen("tcp", listenAddress)
	if err != nil {
		log.Fatalf("Failed to listen on %s: %v", listenAddress, err)
	}
	defer listener.Close()
	log.Printf("Listening on %s...", listenAddress)

	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Printf("Failed to accept connection: %v", err)
			continue
		}
		log.Printf("Accepted connection from %v", conn.RemoteAddr())
		go handleConnection(conn, extensionHelperPath)
	}
}

func handleConnection(conn net.Conn, extensionHelperPath string) {
	defer conn.Close()

	cmd := exec.Command(extensionHelperPath, icloud.EXTENSION_ID)
	cmd.Stdin = conn
	cmd.Stdout = conn

	if err := cmd.Start(); err != nil {
		log.Printf("Failed to start extension helper: %v", err)
		return
	}

	if err := cmd.Wait(); err != nil {
		log.Printf("Command exited with error: %v", err)
	}
}
