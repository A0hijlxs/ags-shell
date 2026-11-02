{ config, lib, ... }:

let
    cfg = config.programs.ags-shell;
in
{
    imports = [
        ./hyprlock.nix
        ./hypridle.nix
    ];

    options.programs.ags-shell = {
        lock = {
            enable = lib.mkEnableOption "hyprlock and hypridle, styled to match (the NixOS module adds the PAM service)";

            background = lib.mkOption {
                type = lib.types.nullOr lib.types.path;
                default = null;
                description = "Lock screen background image; null blurs a screenshot of the desktop.";
            };

            fingerprint = lib.mkEnableOption "fingerprint unlock and its prompt";

            keyboardBacklight = lib.mkOption {
                type = lib.types.nullOr lib.types.str;
                default = null;
                example = "tpacpi::kbd_backlight";
                description = "brightnessctl device to switch off when idle.";
            };

            autosuspend = lib.mkOption {
                type = lib.types.bool;
                default = true;
                description = "Suspend after a long idle; disable on machines that should stay reachable.";
            };
        };
    };

    config.home.sessionVariables = lib.mkIf cfg.enable {
        AGS_SCREENSHOT_DIR = cfg.screenshotDir;
    };
}
