package usecase

import (
	"context"
	"regexp"

	"github.com/samber/lo"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/pg"
)

type ConversationUsecase struct {
	repo    *pg.ConversationRepository
	docRepo *pg.DocRepository
	logger  *log.Logger
}

func NewConversationUsecase(
	repo *pg.ConversationRepository,
	docRepo *pg.DocRepository,
	logger *log.Logger,
) *ConversationUsecase {
	return &ConversationUsecase{
		repo:    repo,
		docRepo: docRepo,
		logger:  logger.WithModule("usecase.conversation"),
	}
}

func (u *ConversationUsecase) CreateChatConversationMessage(ctx context.Context, kbID string, conversation *domain.ConversationMessage) error {
	references := extractReferencesBlock(conversation.ID, conversation.AppID, conversation.Content)
	if len(references) > 0 {
		urls := lo.Map(references, func(ref *domain.ConversationReference, _ int) string {
			return ref.URL
		})
		// get docs by urls
		urlDocs, err := u.docRepo.GetDocsByURLs(ctx, kbID, urls)
		if err != nil {
			return err
		}
		lo.Map(references, func(ref *domain.ConversationReference, _ int) *domain.ConversationReference {
			doc, ok := urlDocs[ref.URL]
			if !ok {
				return ref
			} else {
				ref.DocID = doc.ID
				ref.Title = doc.Meta.Title
				ref.Favicon = doc.Meta.Favicon
			}
			return ref
		})
	}
	return u.repo.CreateConversationMessage(ctx, conversation, references)
}

func (u *ConversationUsecase) GetConversationList(ctx context.Context, request *domain.ConversationListReq) (*domain.PaginatedResult[[]*domain.ConversationListItem], error) {
	conversations, total, err := u.repo.GetConversationList(ctx, request)
	if err != nil {
		return nil, err
	}
	lo.Map(conversations, func(conversation *domain.ConversationListItem, _ int) *domain.ConversationListItem {
		return conversation
	})
	return domain.NewPaginatedResult(conversations, total), nil
}

func (u *ConversationUsecase) GetConversationDetail(ctx context.Context, conversationID string) (*domain.ConversationDetailResp, error) {
	conversation, err := u.repo.GetConversationDetail(ctx, conversationID)
	if err != nil {
		return nil, err
	}
	// get messages
	messages, err := u.repo.GetConversationMessagesByID(ctx, conversationID)
	if err != nil {
		return nil, err
	}
	conversation.Messages = messages
	// get references
	references, err := u.repo.GetConversationReferences(ctx, conversationID)
	if err != nil {
		return nil, err
	}
	conversation.References = references
	return conversation, nil
}

func extractReferencesBlock(conversationID, appID, text string) []*domain.ConversationReference {
	// match whole reference block
	reBlock := regexp.MustCompile(`(?ms)((?:>|\\u003e)\s*\[\d+\]\.\s*\[.*?\]\(.*?\)\s*\n?)+$`)
	// find the last match index
	lastIndex := -1
	allMatches := reBlock.FindAllStringIndex(text, -1)
	if len(allMatches) > 0 {
		lastIndex = allMatches[len(allMatches)-1][0]
	}

	if lastIndex == -1 {
		return nil
	}

	// extract all references in the last reference block
	block := text[lastIndex:]
	reLine := regexp.MustCompile(`(?m)^(?:>|\\u003e)\s*\[(\d+)\]\.\s*\[(.*?)\]\((.*?)\)`)
	matches := reLine.FindAllStringSubmatch(block, -1)

	refs := make([]*domain.ConversationReference, 0)
	for _, match := range matches {
		if len(match) == 4 {
			refs = append(refs, &domain.ConversationReference{
				Title: match[2],
				URL:   match[3],

				ConversationID: conversationID,
				AppID:          appID,
			})
		}
	}
	return refs
}

func (u *ConversationUsecase) ValidateConversationNonce(ctx context.Context, conversationID, nonce string) error {
	return u.repo.ValidateConversationNonce(ctx, conversationID, nonce)
}

func (u *ConversationUsecase) CreateConversation(ctx context.Context, conversation *domain.Conversation) error {
	return u.repo.CreateConversation(ctx, conversation)
}
