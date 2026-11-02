

import { transitionTo } from "./SystemMenu"
import { OverviewButton } from "./Overview"

import { createState } from "ags"

export function PowerButton() {
    return (
        <OverviewButton
            icon={createState("fa6-bolt-symbolic")[0]}
            name="Power"
            label={createState("test")[0]}
            onToggled={() => {}}
            onExpand={() => {}}
        />
    )
}
