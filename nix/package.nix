{ pkgs, ags }:

let
    astal = ags.packages.${pkgs.stdenv.hostPlatform.system};

    agsWithLibraries = astal.ags.override {
        extraPackages = (with astal; [
            battery
            bluetooth
            wireplumber
            hyprland
            network
            apps
            notifd
            mpris
        ]) ++ [
            pkgs.networkmanager
        ];
    };

    runtime = [ agsWithLibraries astal.io ] ++ (with pkgs; [
        awww
        brightnessctl
        hyprsunset
        gawk
        bc
        wireplumber
        grim
        slurp
        jq
        libnotify
        wl-clipboard
    ]) ++ import ./scripts { inherit pkgs; };

    launcher = pkgs.writeShellScriptBin "ags-shell" ''
        export PATH="${pkgs.lib.makeBinPath runtime}:$PATH"
        export AGS_CACHE_DIR="''${AGS_CACHE_DIR:-''${XDG_CACHE_HOME:-$HOME/.cache}/ags}"
        export AGS_WALLPAPER_DIR="''${AGS_WALLPAPER_DIR:-$HOME/Pictures/Wallpapers}"
        export AGS_SCREENSHOT_DIR="''${AGS_SCREENSHOT_DIR:-$HOME/Pictures/Screenshots}"
        export AGS_MAX_VOLUME="''${AGS_MAX_VOLUME:-1.5}"
        mkdir -p "$AGS_CACHE_DIR"

        awww_pid=
        if ! awww query >/dev/null 2>&1; then
            awww-daemon >/dev/null 2>&1 &
            awww_pid=$!
        fi

        cleanup() {
            if [ -n "$awww_pid" ]; then
                kill "$awww_pid" 2>/dev/null
            fi
            if [ "''${AGS_SHELL_RESET_HYPRLAND:-1}" = 1 ] && command -v hyprctl >/dev/null; then
                hyprctl reload >/dev/null
            fi
        }
        trap cleanup EXIT

        ags run -g 4 -d "''${1:-${../config}}"
    '';
in
pkgs.symlinkJoin {
    name = "ags-shell";
    paths = [ launcher agsWithLibraries ];
    meta.mainProgram = "ags-shell";
}
