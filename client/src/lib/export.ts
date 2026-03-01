import type { Block } from "@shared/schema";

function htmlToMarkdownInline(html: string): string {
  let text = html;
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
  text = text.replace(/<b>(.*?)<\/b>/gi, "**$1**");
  text = text.replace(/<em>(.*?)<\/em>/gi, "*$1*");
  text = text.replace(/<i>(.*?)<\/i>/gi, "*$1*");
  text = text.replace(/<u>(.*?)<\/u>/gi, "$1");
  text = text.replace(/<s>(.*?)<\/s>/gi, "~~$1~~");
  text = text.replace(/<strike>(.*?)<\/strike>/gi, "~~$1~~");
  text = text.replace(/<del>(.*?)<\/del>/gi, "~~$1~~");
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
  text = text.replace(/<mark[^>]*>(.*?)<\/mark>/gi, "==$1==");
  text = text.replace(/<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");
  text = text.replace(/<[^>]+>/g, "");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, " ");
  return text;
}

export function blocksToMarkdown(title: string, blocks: Block[]): string {
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push("");

  let numberedCounter = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const content = htmlToMarkdownInline(block.content);

    if (block.type !== "numbered-list") {
      numberedCounter = 0;
    }

    switch (block.type) {
      case "text":
        lines.push(content);
        lines.push("");
        break;
      case "heading1":
        lines.push(`## ${content}`);
        lines.push("");
        break;
      case "heading2":
        lines.push(`### ${content}`);
        lines.push("");
        break;
      case "heading3":
        lines.push(`#### ${content}`);
        lines.push("");
        break;
      case "bulleted-list":
        lines.push(`- ${content}`);
        if (i + 1 >= blocks.length || blocks[i + 1].type !== "bulleted-list") {
          lines.push("");
        }
        break;
      case "numbered-list":
        numberedCounter++;
        lines.push(`${numberedCounter}. ${content}`);
        if (i + 1 >= blocks.length || blocks[i + 1].type !== "numbered-list") {
          lines.push("");
        }
        break;
      case "code":
        lines.push("```");
        lines.push(content);
        lines.push("```");
        lines.push("");
        break;
      case "quote":
        lines.push(`> ${content}`);
        lines.push("");
        break;
      case "callout":
        lines.push(`> **Note:** ${content}`);
        lines.push("");
        break;
      case "divider":
        lines.push("---");
        lines.push("");
        break;
      default:
        lines.push(content);
        lines.push("");
    }
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export function downloadMarkdown(title: string, blocks: Block[]) {
  const markdown = blocksToMarkdown(title, blocks);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9\s-]/g, "").trim() || "Untitled"}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
