{ config, lib, ... }:

let
    cfg = config.programs.ags-shell;
    text    = "rgba(205, 214, 244, 1.0)";
    subtext = "rgba(166, 173, 200, 1.0)";
    base    = "rgba(20, 15, 40, 0.82)";
    teal    = "rgba(148, 226, 213, 1.0)";
    red     = "rgba(243, 139, 168, 1.0)";
    yellow  = "rgba(249, 226, 175, 1.0)";
    clear   = "rgba(0, 0, 0, 0.0)";
    font       = "JetBrainsMono Nerd Font";
in
{
    programs.hyprlock = lib.mkIf (cfg.enable && cfg.lock.enable) {
        enable = true;

        settings = {

            general = {
                hide_cursor = true;
                ignore_empty_input = true;
            };

            auth.fingerprint.enabled = cfg.lock.fingerprint;

            background = [
                {
                    monitor = "";
                    path = if cfg.lock.background != null then toString cfg.lock.background else "screenshot";
                    blur_passes = 2;
                    blur_size = 4;
                    contrast = 0.85;
                    brightness = 0.75;
                    vibrancy = 0.3;
                    vibrancy_darkness = 0.1;
                }
            ];

            label = [
                {
                    # CLOCK
                    monitor = "";
                    text = "$TIME";
                    color = text;
                    font_size = 120;
                    font_family = "${font} Bold";
                    position = "0, 290";
                    halign = "center";
                    valign = "center";
                }
                {
                    # DATE
                    monitor = "";
                    text = "cmd[update:43200000] date +\"%A, %d %B %Y\"";
                    color = subtext;
                    font_size = 30;
                    font_family = font;
                    position = "0, 175";
                    halign = "center";
                    valign = "center";
                }
                {
                    # USERNAME
                    monitor = "";
                    text = " $USER";
                    color = text;
                    font_size = 26;
                    font_family = font;
                    position = "0, -30";
                    halign = "center";
                    valign = "center";
                }
            ] ++ lib.optional cfg.lock.fingerprint {
                monitor = "";
                text = "$FPRINTPROMPT";
                color = subtext;
                font_size = 15;
                font_family = font;
                position = "0, -345";
                halign = "center";
                valign = "center";
            };

            shape = [
                {
                    # USERNAME BOX
                    monitor = "";
                    size = "400, 80";
                    color = base;
                    rounding = 40;
                    border_size = 0;
                    position = "0, -30";
                    halign = "center";
                    valign = "center";
                }
                {
                    # PASSWORD BOX
                    monitor = "";
                    size = "400, 80";
                    color = base;
                    rounding = 40;
                    border_size = 0;
                    position = "0, -135";
                    halign = "center";
                    valign = "center";
                }
            ];

            image = lib.optionals cfg.lock.fingerprint [
                {
                    monitor = "";
                    path = toString ./ms-fingerprint.png;
                    size = 80;
                    rounding = 0;
                    border_size = 0;
                    position = "0, -275";
                    halign = "center";
                    valign = "center";
                }
            ];

            input-field = [
                {
                    monitor = "";
                    size = "400, 80";
                    outer_color = clear;
                    inner_color = clear;
                    font_color = text;
                    font_family = font;
                    placeholder_text = ''<span font_size="26pt" foreground="##a6adc8"> Password</span>'';
                    fade_on_empty = false;
                    hide_input = false;
                    rounding = 40;
                    dots_size = 0.3;
                    dots_spacing = 0.3;
                    dots_center = true;
                    check_color = teal;
                    fail_color = red;
                    fail_text = "<i>Auth failed <b>($ATTEMPTS)</b></i>";
                    capslock_color = yellow;
                    position = "0, -135";
                    halign = "center";
                    valign = "center";
                }
            ];
        };
    };
}
