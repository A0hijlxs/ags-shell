{ pkgs }:

pkgs.writeShellScriptBin "grimburst" ''
    SAVE_DIR="''${AGS_SCREENSHOT_DIR:-$HOME/Pictures/Screenshots}"
    mkdir -p "$SAVE_DIR"

    # Get arguments
    if [ "$#" -lt 2 ]; then
        notify-send -a Grimburst "Error" "Usage: grimburst [display/window/area] [copy/save/copysave/none] [--output path]" -u critical
        exit 1
    fi
    MODE="$1"       # display/window/area
    ACTION="$2"     # copy/save/copysave/none
    shift 2

    # Optional: --output <path> overrides the default timestamped filename
    OUTPUT=""
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --output)
                OUTPUT="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done

    if [ -n "$OUTPUT" ]; then
        FILENAME="$OUTPUT"
        mkdir -p "$(dirname "$FILENAME")"
    else
        TIMESTAMP=$(date +'%Y-%m-%d_%H%M%S')
        FILENAME="$SAVE_DIR/screenshot_''${TIMESTAMP}_''${MODE}.png"
    fi

    # Select screenshot mode
    case "$MODE" in
        display)
        sleep 0.1
        grim "$FILENAME"
            ;;
        window)
        grim -g "$(hyprctl -j activewindow | jq -r '"\(.at[0]),\(.at[1]) \(.size[0])x\(.size[1])"')" "$FILENAME"
            ;;
        area)
            GEOM=$(slurp)
            if [ -z "$GEOM" ]; then
                # Selection cancelled - exit quietly, nothing was captured
                exit 0
            fi
            grim -g "$GEOM" "$FILENAME"
            ;;
        *)
        notify-send -a Grimburst "Error" "Usage: grimburst [display/window/area] [copy/save/copysave/none] [--output path]" -u critical
            exit 1
            ;;
    esac

    # Handle copy/save actions
    case "$ACTION" in
        copy)
            wl-copy < "$FILENAME"
        notify-send -a Grimburst -h STRING:image-path:$FILENAME "Screenshot" "Copied to clipboard"
            rm "$FILENAME"  # Remove file if only copying
        ;;
        save)
               notify-send -a Grimburst -h STRING:image-path:$FILENAME "Screenshot" "Saved to: $FILENAME"
               ;;
        copysave)
            wl-copy < "$FILENAME"
            notify-send -a Grimburst -h STRING:image-path:$FILENAME "Screenshot" "Copied & Saved to: $FILENAME"
        ;;
        none)
            # Caller handles copy/save/notify itself - just capture.
            ;;
        *)
        notify-send -a Grimburst "Error" "Usage: grimburst [display/window/area] [copy/save/copysave/none] [--output path]" -u critical
        exit 1
            ;;
    esac

    # Signal success (and the final path) to callers parsing stdout.
    # Not printed on the slurp-cancelled early exit above.
    echo "$FILENAME"
''
