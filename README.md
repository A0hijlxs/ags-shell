# ags-shell

A desktop shell for [Hyprland](https://hyprland.org), written in TypeScript/TSX on [AGS](https://github.com/aylur/ags) and [Astal](https://github.com/aylur/astal) (GTK4), packaged as a home-manager module. Hugely inspired from [JohnOberhauser](https://github.com/JohnOberhauser/OkPanel).

> **Archived.** This was my desktop from 2025, I have since ported it to Quickshell (QML). It's published as a reference and is not maintained nor complete.

![Desktop with the bar](screenshots/desktop.webp)

| | |
|---|---|
| ![App launcher and system menu](screenshots/launcher-and-system-menu.webp) | ![Wallpaper picker](screenshots/wallpapers.webp) |
| ![Controller, the workspace overview](screenshots/controller.webp) | ![Logout menu](screenshots/logout.webp) |

## Features

- **Bar** - workspaces, clock, system widgets.
- **Launcher** - app search and a wallpaper picker through `awww`.
- **System menu** - network (Wi-Fi, VPN, Tailscale), Bluetooth, audio devices, brightness.
- **Controller** - a workspace overview.
- **Screen capture** - display, window or area capture, copied or saved, with an optional *Ask AI* mode.
- **Notifications** - Notif daemon, with popups in the corner.
- **Alerts** - on-screen indicators for volume, mic, brightness, privacy mode and night light.
- **Logout menu**
- **night light** via `hyprsunset`.
- Optional: matching **hyprlock** lock screen and **hypridle** idle ladder.

## Try it

On a Hyprland session using the Lua config (Hyprland 0.55+), stop your current bar and notification daemon, then:

```sh
nix run github:A0hijlxs/ags-shell
```

The shell registers its keybindings and layer rules for the session, and starts `awww-daemon` for wallpapers if none is running. Ctrl+C stops it, kills that `awww-daemon` and runs `hyprctl reload`, which puts your own binds and rules back. Settings come from the environment, with these defaults: `AGS_WALLPAPER_DIR=~/Pictures/Wallpapers`, `AGS_SCREENSHOT_DIR=~/Pictures/Screenshots`, `AGS_CACHE_DIR=~/.cache/ags`, `AGS_MAX_VOLUME=1.5`. `nix shell github:A0hijlxs/ags-shell` also gives you the `ags` CLI (`ags request launcher`, …). Night light needs a running `hyprsunset`.

## Install

Add the flake and import the home-manager module (and the NixOS module if you enable the lock screen, for its PAM service):

```nix
{
    inputs.ags-shell.url = "github:A0hijlxs/ags-shell";

    # NixOS configuration
    imports = [ inputs.ags-shell.nixosModules.default ];

    # home-manager configuration
    imports = [ inputs.ags-shell.homeManagerModules.default ];

    programs.ags-shell = {
        enable = true;
        wallpaperDir = "/home/me/Pictures/Wallpapers";
        lock.enable = true;
    };
}
```

The module runs the same package as the `ags-shell` systemd user service, bound to `graphical-session.target`, and enables `awww` and `hyprpolkitagent`; `reload-ags` restarts the shell.

| Option | Default | |
|---|---|---|
| `enable` | `false` | the shell and its service |
| `package` | this flake's | launcher, `ags` with the shell's libraries, helper scripts |
| `wallpaperDir` | `~/Pictures/Wallpapers` | directory the wallpaper picker lists |
| `screenshotDir` | `~/Pictures/Screenshots` | where captures are saved |
| `cacheDir` | `~/.cache/ags` | state and thumbnails |
| `maxVolume` | `1.5` | volume ceiling (1.0 = 100%) |
| `lock.enable` | `false` | hyprlock + hypridle |
| `lock.background` | `null` | lock background image; `null` blurs the desktop |
| `lock.fingerprint` | `false` | fingerprint unlock and prompt |
| `lock.keyboardBacklight` | `null` | `brightnessctl` device dimmed when idle |
| `lock.autosuspend` | `true` | suspend after long idle |

The shell registers its own keybindings and layer rules with Hyprland at startup, and again after every config reload, so there is nothing to add to your Hyprland config. It targets Hyprland's Lua config (`hl.*` API, Hyprland 0.55+); it does not work with a hyprlang config.

| Keys | Action |
|---|---|
| `SUPER + space` | launcher |
| `SUPER + K` | system menu |
| `SUPER + Z` | controller (workspace overview) |
| `SUPER + P` | logout menu |
| `SUPER + B` | toggle the bar |
| `SUPER + SHIFT + P` | privacy mode |
| `SUPER + L` | lock (when hyprlock is installed) |
| `SUPER + A` | restart the shell |
| `Print` | screenshot of the display, saved to the screenshot directory |
| media keys | volume, mic mute, brightness |

## Credits

Built on [AGS](https://github.com/aylur/ags) and [Astal](https://github.com/aylur/astal) by Aylur.

The symbolic icons in `config/src/icons/` come from the open-source sets below, mostly by way of [Iconify](https://iconify.design).

| Set | Author | Licence | Files |
|---|---|---|---|
| [Material Design Icons](https://github.com/Templarian/MaterialDesign) | Pictogrammers | Apache-2.0 | `mdi-*` |
| [Material Symbols](https://github.com/google/material-design-icons) (incl. Light) | Google | Apache-2.0 | `ms-*`, `msl-*` |
| [Font Awesome 6 Free](https://github.com/FortAwesome/Font-Awesome) | Fonticons | CC BY 4.0 | `fa6-*` |
| [Charm Icons](https://github.com/jaynewey/charm-icons) | Jay Newey | MIT | `charm-*` |
| [Framework7 Icons](https://github.com/framework7io/framework7-icons) | Vladimir Kharlampidi | MIT | `f7-*` |
| [Fluent UI System Icons](https://github.com/microsoft/fluentui-system-icons) | Microsoft | MIT | `fluent-*` |
| [Lucide](https://github.com/lucide-icons/lucide) | Lucide Contributors | ISC | `lucide-*` |

## Licence

[MIT](LICENSE), excluding bundled icons (see Credits).
