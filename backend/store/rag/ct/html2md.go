package ct

import (
	"path"
	"strings"

	"github.com/JohannesKaufmann/dom"
	"github.com/JohannesKaufmann/html-to-markdown/v2/converter"
	"github.com/JohannesKaufmann/html-to-markdown/v2/plugin/base"
	"github.com/JohannesKaufmann/html-to-markdown/v2/plugin/commonmark"
	"github.com/JohannesKaufmann/html-to-markdown/v2/plugin/table"
	"golang.org/x/net/html"
)

func NewHTML2MDConverter() *converter.Converter {
	conv := converter.NewConverter(
		converter.WithPlugins(
			base.NewBasePlugin(),
			commonmark.NewCommonmarkPlugin(),
			table.NewTablePlugin(
				table.WithSpanCellBehavior(table.SpanBehaviorMirror),
				table.WithNewlineBehavior(table.NewlineBehaviorPreserve),
			),
		),
	)
	// 注册自定义渲染器
	// attachment to md link
	conv.Register.RendererFor("span", converter.TagTypeInline, renderAttachment, converter.PriorityEarly)
	// task list
	conv.Register.RendererFor("ul", converter.TagTypeBlock, renderTaskList, converter.PriorityEarly)
	return conv
}

// renderAttachment 将自定义 attachment 的 span 解析为 Markdown 链接
func renderAttachment(ctx converter.Context, w converter.Writer, node *html.Node) converter.RenderStatus {
	if node.Type != html.ElementNode || node.Data != "span" {
		return converter.RenderTryNext
	}

	// 仅处理 data-tag="attachment" 的 span
	tag, ok := dom.GetAttribute(node, "data-tag")
	if !ok || tag != "attachment" {
		return converter.RenderTryNext
	}

	// 提取 URL，优先 data-url，其次 url
	url, hasURL := dom.GetAttribute(node, "data-url")
	if !hasURL || strings.TrimSpace(url) == "" {
		url, hasURL = dom.GetAttribute(node, "url")
	}
	if !hasURL || strings.TrimSpace(url) == "" {
		// 没有可用链接则交给其他渲染器
		return converter.RenderTryNext
	}

	// 提取标题，优先 data-title，其次 title；无则用文件名作标题
	title, hasTitle := dom.GetAttribute(node, "data-title")
	if !hasTitle || strings.TrimSpace(title) == "" {
		title, hasTitle = dom.GetAttribute(node, "title")
	}
	if !hasTitle || strings.TrimSpace(title) == "" {
		// 从 URL 中提取文件名作为标题
		title = path.Base(url)
	}

	// 写入 Markdown 链接（内联，不换行）
	if _, err := w.WriteString("[" + title + "](" + url + ")"); err != nil {
		return converter.RenderTryNext
	}

	return converter.RenderSuccess
}

// renderTaskList 渲染任务列表的自定义渲染器
func renderTaskList(ctx converter.Context, w converter.Writer, node *html.Node) converter.RenderStatus {
	// 检查是否是任务列表
	dataType, exists := dom.GetAttribute(node, "data-type")
	if !exists || dataType != "taskList" {
		return converter.RenderTryNext
	}

	// 遍历所有的li元素
	for child := node.FirstChild; child != nil; child = child.NextSibling {
		if child.Type == html.ElementNode && child.Data == "li" {
			// 检查是否是任务项
			childDataType, childExists := dom.GetAttribute(child, "data-type")
			if childExists && childDataType == "taskItem" {
				checkedValue, _ := dom.GetAttribute(child, "data-checked")
				isChecked := checkedValue == "true"

				// 获取文本内容
				textContent := getTextFromTaskItem(child)

				// 写入checkbox markdown
				if isChecked {
					if _, err := w.WriteString("- [x] " + textContent + "\n"); err != nil {
						return converter.RenderTryNext
					}
				} else {
					if _, err := w.WriteString("- [ ] " + textContent + "\n"); err != nil {
						return converter.RenderTryNext
					}
				}
			}
		}
	}

	return converter.RenderSuccess
}

// getTextFromTaskItem 从任务项中提取文本内容
func getTextFromTaskItem(node *html.Node) string {
	var textContent strings.Builder

	// 遍历所有子节点，提取文本
	var extractText func(*html.Node)
	extractText = func(n *html.Node) {
		if n.Type == html.TextNode {
			textContent.WriteString(n.Data)
		}
		for child := n.FirstChild; child != nil; child = child.NextSibling {
			extractText(child)
		}
	}

	extractText(node)
	return strings.TrimSpace(textContent.String())
}
