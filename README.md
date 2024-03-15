# maui-build-github-action

This action will build in .NET MAUI.
Output is available on iOS/Android/Windows/macOS platforms.

## Usage

### Simple usage

#### iOS build

```yml
- name: 🏭 .NET MAUI build
  uses: akiojin/maui-build-github-action@v0.1.9
  with:
    framework: net8.0
    build-target: iOS
```

#### Team ID & Provisioning Profile UUID

```yml
- name: ⚙️ Setup Xcode environment (iOS)
  uses: akiojin/setup-xcode-environment-github-action@v3
  id: setup-xcode-environment
  with:
    type: development
    app-identifier: <App ID>
    team-id: <Team ID>
    git-url: ${{ secrets.APPLE_CERTIFICATE_GIT_URL }}
    git-passphrase: ${{ secrets.APPLE_CERTIFICATE_GIT_PASSPHRASE }}
    keychain-password: ${{ secrets.KEYCHAIN_PASSWORD }}

- name: 🏭 .NET MAUI build & packagging (iOS)
  uses: akiojin/maui-build-github-action@v0.1.9
  with:
    configuration: Debug
    framework: net8.0
    build-target: iOS
    project: ${{ vars.PROJECT_NAME }}/${{ vars.PROJECT_NAME }}.csproj
    codesign-key: ${{ env.APPLE_CERTIFICATE_SIGNING_IDENTITY }}
    codesign-provision: ${{ env.APPLE_PROV_PROFILE_UUID }}
```

#### Android builds

```yml
- name: 🏭 .NET MAUI build
  uses: akiojin/maui-build-github-action@v0.1.9
  with:
    framework: net8.0
    build-target: Android
```

#### Keystore

```yml
- name: 🏭 .NET MAUI build & packagging (Android)
  uses: akiojin/maui-build-github-action@v0.1.9
  if: ${{ matrix.BUILD_TARGET == 'Android' }}
  with:
    configuration: Debug
    framework: net8.0
    build-target: Android
    project: ${{ vars.PROJECT_NAME }}/${{ vars.PROJECT_NAME }}.csproj
    android-signing-keystore: ${{ secrets.GOOGLE_KEYSTORE_BASE64 }}
    android-signing-store-pass: ${{ secrets.GOOGLE_KEYSTORE_PASSWORD }}
```

## License

Any contributions made under this project will be governed by the [MIT License](https://github.com/akiojin/maui-build-github-action/blob/main/LICENSE).
