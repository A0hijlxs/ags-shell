
import { OverviewButton } from "./Overview"
import { createState } from "ags"

export function AppearanceButton() {
    return (
        <OverviewButton
            icon={createState("gg-drop-symbolic")[0]}
            name="Appearance"
            label={createState("test")[0]}
            onToggled={() => {}}
            onExpand={() => {}}
        />
    )
}
