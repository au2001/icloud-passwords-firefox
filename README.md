<p align="center">
<a href="https://addons.mozilla.org/en-US/firefox/addon/keychain/">
<img src="meta/images/logo-128.png" alt="Logo" />
</a>
</p>
<h1 align="center">
<a href="https://addons.mozilla.org/en-US/firefox/addon/keychain/">
iCloud Passwords for Firefox
</a>
</h1>

<p align="center">
<a href="https://github.com/au2001/icloud-passwords-firefox/releases/latest"><img alt="Release" src="https://img.shields.io/github/v/release/au2001/icloud-passwords-firefox?style=for-the-badge" /></a>
<a href="https://addons.mozilla.org/en-US/firefox/addon/keychain/"><img alt="Stars" src="https://img.shields.io/amo/stars/icloud-passwords?style=for-the-badge" /></a>
<a href="https://addons.mozilla.org/en-US/firefox/addon/keychain/"><img alt="Users" src="https://img.shields.io/amo/users/icloud-passwords?style=for-the-badge" /></a>
<a href="https://github.com/au2001/icloud-passwords-firefox/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/au2001/icloud-passwords-firefox?style=for-the-badge" /></a>
</p>

This Firefox extension lets you securely fill passwords from iCloud Keychain® when signing in to websites.\
It also provides you with strong passwords, one-time codes, and passkeys to secure your online accounts.\
Your passwords are automatically synchronized accross your Apple and other compatible devices.

## Installation

**➡️ Recommended:** Download this extension from [AMO (addons.mozilla.org)](https://addons.mozilla.org/en-US/firefox/addon/keychain/).

Alternatively, download the latest GitHub release and install it on Firefox by navigating to `about:addons`.

Refer to the following table to see if your configuration is supported:

| Platform                                                                                          | Version         | Status                                                                         |
| ------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------ |
| ![macOS](https://img.shields.io/badge/macos-white?style=for-the-badge&logo=apple&logoColor=black) | >= Sonoma (14)  | ✅ Fully supported                                                             |
| ![macOS](https://img.shields.io/badge/macos-white?style=for-the-badge&logo=apple&logoColor=black) | <= Ventura (13) | [❌ Unsupported](https://github.com/au2001/icloud-passwords-firefox/issues/33) |
| ![Windows](https://img.shields.io/badge/windows-blue?style=for-the-badge&logo=windows10)          | >= 7            | ⚠️ Requires additional setup (see below)                                       |
| ![Windows](https://img.shields.io/badge/windows-blue?style=for-the-badge&logo=windowsxp)          | <= Vista        | ❌ Unsupported                                                                 |
| ![Linux](https://img.shields.io/badge/linux-black?style=for-the-badge&logo=linux)                 | Any             | ⚠️ Requires additional setup (see below)

### Additional setup (Windows)

For Windows, additional steps are required for the extension to work:

1. Install [iCloud for Windows][icloud-for-windows].
2. Enable the `Passwords` option.
3. Click on `Install Extension...` for either Microsoft Edge or Google Chrome.
4. Download the `icloud_passwords_install` file from the [latest GitHub Release][github-latest-release].
5. Run the downloaded executable **as administrator**.
6. Restart Firefox, and you should be good to go!

### Additional setup (Linux)

For Linux, additional steps are required for the extension to work, as there is no native support for this platform. A Windows virtual machine is needed to enable the functionality:

1. Set up a Windows virtual machine on your Linux host using software like KVM or VirtualBox.
2. Install [iCloud for Windows][icloud-for-windows] in the Windows VM.
3. Enable the `Passwords` option in iCloud for Windows.
4. Click on `Install Extension...` for either Microsoft Edge or Google Chrome.
5. Download the `icloud_passwords_guest_helper` file from the [latest GitHub Release][github-latest-release] in the Windows VM.
6. Run the downloaded executable in the Windows VM (optionally add it to Windows startup).
7. Ensure `socat` is installed on the Linux host (e.g., `sudo apt install socat`).
8. Download the `icloud_passwords_install` file from the [latest GitHub Release][github-latest-release] on the Linux host.
9. Run the following command, replacing `<VM-IP>` with the IP address of your Windows VM:
    ```bash
    ./icloud_passwords_install --mode=tunnel --tunnel-address=<VM-IP>:4646
    ```
10. Restart Firefox, and you should be good to go!

**Note:** The Windows virtual machine must be running whenever you use the extension.

#### Why is this required?

macOS Sonoma (14) and later come with `PasswordManagerBrowserExtensionHelper.app` preinstalled.\
It's a utility which allows Apple's iCloud Passwords Chrome and Edge extensions to work.\
This extension uses the same utility, so it works natively without any further steps.

Unfortunately, this utility is not available on previous versions of macOS, on Windows, nor on Linux.\
For such operating systems, this utility needs to be replaced. iCloud for Windows serves this purpose.\
By default, iCloud for Windows does not grant access to Firefox to access passwords.\
The provided executable thus enables the communication between Firefox and iCloud for Windows.

Linux users can still use this extension by setting up iCloud for Windows in a Windows virtual machine.
By creating a local TCP tunnel, the Linux browser extension can seamlessly connect to iCloud for Windows
running inside the virtual machine.

The source code for the Golang executables is available [in the `scripts/install` directory](https://github.com/au2001/icloud-passwords-firefox/tree/main/scripts/install/).

## Need Help?

- [Report a bug](https://github.com/au2001/icloud-passwords-firefox/issues/new)
- [Request a new feature](https://github.com/au2001/icloud-passwords-firefox/issues/new)
- [Reach out](https://aurelien.garnier.dev/contact#contact)

## News

### 2025-03-10

While the original AMO listing still belongs to Apple, [a new one](https://addons.mozilla.org/en-US/firefox/addon/keychain/) has been created for this repository.\
It is meant to offer an open source alternative to the official version with greatly improved performance.

### 2024-12-04

The [AMO (addons.mozilla.org)](https://addons.mozilla.org/en-US/firefox/addon/icloud-passwords/) listing of this extension was transferred to Apple Inc.\
They are now the sole owners in charge of maintaining their own official iCloud Passwords extension.\
This repository and source code are no longer linked in any way to it appart from historical reasons.

## Features

| Feature                            | Status                                                             |
| ---------------------------------- | ------------------------------------------------------------------ |
| List accounts for current website  | ✅                                                                 |
| Select an account to auto-fill     | ✅                                                                 |
| Copy account password to clipboard | ✅                                                                 |
| Generate new secure passwords      | ✅                                                                 |
| In-page auto-complete suggestions  | ✅                                                                 |
| Search through existing accounts   | [⛅️](https://github.com/au2001/icloud-passwords-firefox/issues/5) |
| Auto-fill one-time codes           | [❌](https://github.com/au2001/icloud-passwords-firefox/issues/8)  |
| Copy one-time codes to clipboard   | [❌](https://github.com/au2001/icloud-passwords-firefox/issues/8)  |
| Register one-time codes            | [❌](https://github.com/au2001/icloud-passwords-firefox/issues/8)  |
| Save newly created accounts        | [❌](https://github.com/au2001/icloud-passwords-firefox/issues/12) |
| Login with a passkey               | [❌](https://github.com/au2001/icloud-passwords-firefox/issues/9)  |
| Create new passkeys                | [❌](https://github.com/au2001/icloud-passwords-firefox/issues/9)  |
| Create new accounts manually       | [❌](https://github.com/au2001/icloud-passwords-firefox/issues/7)  |
| Delete existing accounts           | ❌                                                                 |

The full list of planned features and known bugs is available under [Issues](https://github.com/au2001/icloud-passwords-firefox/issues).

## Contributing

Contributions are welcome, whether that be code, documentation, testing, feature ideas, or bug reporting.

🤝 If you are willing to contribute to tackle a specific GitHub Issue, please add a comment stating your intentions.\
👾 To submit code patches, please open a [GitHub Pull Request](https://github.com/au2001/icloud-passwords-firefox/compare).\
📕 If you are not sure where to start, take a look at open [GitHub Issues](https://github.com/au2001/icloud-passwords-firefox/issues).

Thanks for your interest!

### Development

To build and run the extension locally when developing, you should follow these instructions:

1. Clone this repository.
2. Open the folder in your favorite IDE.
3. Run `npm ci` to install the required Node dependencies.
4. Run `npm build:watch` to start building the code after each file change.
5. Navigate to `about:debugging#/runtime/this-firefox` and click on `Load Temporary Add-on...`.
6. Find where you cloned this repository, and select the `manifest.json` file in the `dist` folder (NOT in `meta`).
7. Click on `Inspect` to access the console which displays errors, warnings, and debug logs.
8. All user interface components refresh live when you save files in your IDE.
9. Background scripts do NOT refresh live, you need to click `Reload` under `Temporary Extensions`.
10. The AMO version will be restored after closing Firefox, or when clicking `Remove`.

## License

This extension is licensed under the [Apache License 2.0](https://github.com/au2001/icloud-passwords-firefox/blob/main/LICENSE).

**⚠️ All forks of this repository should explicitly state their changes in a clear manner within the README.**

[icloud-for-windows]: https://support.apple.com/kb/DL1455
[github-latest-release]: https://github.com/au2001/icloud-passwords-firefox/releases/latest
