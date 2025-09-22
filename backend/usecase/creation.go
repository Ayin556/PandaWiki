package usecase

import (
	"context"
	"fmt"
	"strings"

	modelkit "github.com/chaitin/ModelKit/v2/usecase"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/cloudwego/eino/schema"
)

type CreationUsecase struct {
	llm      *LLMUsecase
	model    *ModelUsecase
	logger   *log.Logger
	modelkit *modelkit.ModelKit
}

func NewCreationUsecase(logger *log.Logger, llm *LLMUsecase, model *ModelUsecase) *CreationUsecase {
	modelkit := modelkit.NewModelKit(logger.Logger)
	return &CreationUsecase{
		llm:      llm,
		model:    model,
		logger:   logger.WithModule("usecase.creation"),
		modelkit: modelkit,
	}
}

func (u *CreationUsecase) TextCreation(ctx context.Context, req *domain.TextReq, onChunk func(ctx context.Context, dataType, chunk string) error) error {
	model, err := u.model.GetChatModel(ctx)
	if err != nil {
		u.logger.Error("get chat model failed", log.Error(err))
		return domain.ErrModelNotConfigured
	}

	modelkitModel, err := model.ToModelkitModel()
	if err != nil {
		return fmt.Errorf("failed to convert model to modelkit model: %w", err)
	}
	chatModel, err := u.modelkit.GetChatModel(ctx, modelkitModel)
	if err != nil {
		return fmt.Errorf("get chat model failed: %w", err)
	}

	messages := []*schema.Message{
		{
			Role: "system",
			Content: "你是一位专业的文本编辑。你的任务是对输入的文本进行润色和优化。\n\n" +
				"规则：\n" +
				"1. 保持输入文本的原始语言\n" +
				"2. 禁止将文本翻译成其他语言\n" +
				"3. 保持原文的语言风格和表达方式\n\n" +
				"优化方向：\n" +
				"1. 内容优化：\n" +
				"   - 提高文本的清晰度和可读性\n" +
				"   - 确保逻辑流畅和连贯性\n" +
				"   - 保持原文的核心信息和重点\n" +
				"2. 语言优化：\n" +
				"   - 改进语法和句子结构\n" +
				"   - 使语言更加简洁有力\n" +
				"   - 优化用词和表达方式\n\n" +
				"输出要求：\n" +
				"1. 只返回优化后的文本\n" +
				"2. 不要添加任何解释或额外评论\n" +
				"3. 不要改变文本的语言\n" +
				"4. 保持原文的段落结构",
		},
		{
			Role:    "user",
			Content: req.Text,
		},
	}
	usage := &schema.TokenUsage{}
	err = u.llm.ChatWithAgent(ctx, chatModel, messages, usage, onChunk)
	if err != nil {
		return fmt.Errorf("chat with llm failed: %w", err)
	}
	return nil
}

func (u *CreationUsecase) TabComplete(ctx context.Context, req *domain.CompleteReq) (string, error) {
	// For FIM (Fill in Middle) style completion, we need to handle prefix and suffix
	if req.Prefix != "" || req.Suffix != "" {
		// System prompt for article continuation
		systemPrompt := `
你是集成在编辑器里的“内联续写”模型。任务是在光标处续写用户的文章，使其自然衔接并提升表达质量。

严格遵循：
1) 仅输出续写内容；不要复述已给文本；不要解释、不要前后标记、不要问答式措辞。
2) 充分利用上下文：<PREFIX> 是光标前文本，<SUFFIX> 是光标后文本（如有）。
   - 与 <PREFIX> 连贯一致，不改变已确立的观点、时间线、叙述视角与称谓。
   - 不与 <SUFFIX> 冲突；如需要，使用最少字数平滑过渡到 <SUFFIX>。
3) 维持原文语言与风格：语言保持与 <PREFIX> 一致（默认中文）；语气={tone}；受众={audience}；体裁={genre}。
   - 保留现有格式与排版（段落/列表/小标题/标点样式）。
   - 术语与专有名词前后一致。
4) 质量要求：推进论点或叙事，避免空话与陈词滥调；尽量给出具体细节/例证/因果逻辑。
   - 涉及事实时力求准确；不要编造具体个人信息、机密或不可核实的数据。
5) 长度控制：不超过 50 字 或 2 句话，尽量在句子或自然段边界收尾，避免半句戛然而止。
6) 约束：
   - 不重复 <PREFIX> 末尾与 <SUFFIX> 开头的文本。
   - 沿用当前段落缩进与标点风格（中英文空格、引号、数字样式保持一致）。
   - 不与用户对话，不提出问题，除非 <PREFIX> 已采用此写法。
7) 安全与合规：避免违法、仇恨、歧视、隐私泄露与危险内容输出。

输入格式（FIM）：
<FIM_PREFIX><PREFIX><FIM_SUFFIX><SUFFIX><FIM_MIDDLE>

输出：仅为紧接光标位置的续写文本。
`

		model, err := u.model.GetModelByType(ctx, domain.ModelTypeAnalysis)
		if err != nil {
			u.logger.Error("get chat model failed", log.Error(err))
			return "", domain.ErrModelNotConfigured
		}

		modelkitModel, err := model.ToModelkitModel()
		if err != nil {
			return "", fmt.Errorf("failed to convert model to modelkit model: %w", err)
		}
		chatModel, err := u.modelkit.GetChatModel(ctx, modelkitModel)
		if err != nil {
			return "", fmt.Errorf("get chat model failed: %w", err)
		}

		// Build FIM prompt with special tokens
		prompt := fmt.Sprintf("%s%s%s%s%s", domain.FIMPrefix, req.Prefix, domain.FIMSuffix, req.Suffix, domain.FIMMiddle)

		// Prepare model parameters similar to the reference implementation
		// TODO: These parameters should be configurable
		_ = 128  // maxTokens
		_ = 0.2  // temperature
		_ = 0.95 // topP

		// Build the message with FIM prompt
		messages := []*schema.Message{
			{
				Role:    "system",
				Content: systemPrompt,
			},
			{
				Role:    "user",
				Content: prompt,
			},
		}

		// For FIM-style completion, we collect the response in a string instead of streaming
		var result strings.Builder
		onChunk := func(ctx context.Context, dataType, chunk string) error {
			result.WriteString(chunk)
			return nil
		}

		usage := &schema.TokenUsage{}
		err = u.llm.ChatWithAgent(ctx, chatModel, messages, usage, onChunk)
		if err != nil {
			return "", fmt.Errorf("chat with llm failed: %w", err)
		}

		completion := result.String()
		return completion, nil
	}
	return "", nil
}
