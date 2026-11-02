
function escapeMarkup(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
}

export function markdownToPango(markdown: string): string {
    if (!markdown) return ""

    let text = escapeMarkup(markdown)

    // Fenced code blocks
    text = text.replace(/```[\w]*\n([\s\S]*?)```/g, (_, code) =>
        `<span font_family="monospace" background="#1e1e2e">${code}</span>`
    )

    // Inline code
    text = text.replace(/`([^`]+)`/g, (_, code) =>
        `<span font_family="monospace">${code}</span>`
    )

    // Headers
    text = text.replace(/^### (.+)$/gm, `<span weight="bold">$1</span>`)
    text = text.replace(/^## (.+)$/gm, `<span size="large" weight="bold">$1</span>`)
    text = text.replace(/^# (.+)$/gm, `<span size="x-large" weight="bold">$1</span>`)

    // Bold
    text = text.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")

    // Italic
    text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<i>$1</i>")

    // Bullet lists
    text = text.replace(/^[-*] (.+)$/gm, "  •  $1")

    return text
}
