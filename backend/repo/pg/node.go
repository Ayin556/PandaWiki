package pg

import (
	"context"
	"time"

	"gorm.io/gorm"

	"github.com/google/uuid"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/store/pg"
)

type NodeRepository struct {
	db     *pg.DB
	logger *log.Logger
}

func NewNodeRepository(db *pg.DB, logger *log.Logger) *NodeRepository {
	return &NodeRepository{db: db, logger: logger.WithModule("repo.pg.node")}
}

func (r *NodeRepository) Create(ctx context.Context, req *domain.CreateNodeReq) (string, error) {
	nodeID, err := uuid.NewV7()
	if err != nil {
		return "", err
	}
	nodeIDStr := nodeID.String()
	err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var maxPos float64
		query := tx.WithContext(ctx).
			Model(&domain.Node{}).
			Where("kb_id = ?", req.KBID)

		if req.ParentID == "" {
			query = query.Where("parent_id IS NULL OR parent_id = ''")
		} else {
			query = query.Where("parent_id = ?", req.ParentID)
		}

		if err := query.
			Select("COALESCE(MAX(position::float), 0)").
			Scan(&maxPos).Error; err != nil {
			return err
		}

		newPos := maxPos + (domain.MaxPosition-maxPos)/2.0

		now := time.Now()
		node := &domain.Node{
			ID:        nodeIDStr,
			KBID:      req.KBID,
			Name:      req.Name,
			Content:   req.Content,
			Type:      req.Type,
			ParentID:  req.ParentID,
			Position:  newPos,
			CreatedAt: now,
			UpdatedAt: now,
		}

		return tx.Create(node).Error
	})
	if err != nil {
		return "", err
	}

	return nodeIDStr, nil
}

func (r *NodeRepository) GetList(ctx context.Context, req *domain.GetNodeListReq) ([]*domain.NodeListItemResp, error) {
	var nodes []*domain.NodeListItemResp
	query := r.db.WithContext(ctx).
		Model(&domain.Node{}).
		Where("nodes.kb_id = ?", req.KBID).
		Select("nodes.id, nodes.type, nodes.name, nodes.parent_id, nodes.position, nodes.created_at, nodes.updated_at, nodes.meta->>'summary' as summary")
	if req.Search != "" {
		searchPattern := "%" + req.Search + "%"
		query = query.Where("name LIKE ? OR content LIKE ?", searchPattern, searchPattern)
	}
	if err := query.Find(&nodes).Error; err != nil {
		return nil, err
	}
	return nodes, nil
}

func (r *NodeRepository) UpdateNodeContent(ctx context.Context, req *domain.UpdateNodeReq) error {
	updateMap := map[string]any{}
	if req.Name != nil {
		updateMap["name"] = *req.Name
	}
	if req.Content != nil {
		updateMap["content"] = *req.Content
	}
	if len(updateMap) > 0 {
		return r.db.WithContext(ctx).
			Model(&domain.Node{}).
			Where("id = ?", req.ID).
			Where("kb_id = ?", req.KBID).
			Updates(updateMap).Error
	}
	return nil
}

func (r *NodeRepository) GetByID(ctx context.Context, id string) (*domain.NodeDetailResp, error) {
	var node *domain.NodeDetailResp
	if err := r.db.WithContext(ctx).
		Model(&domain.Node{}).
		Where("id = ?", id).
		First(&node).Error; err != nil {
		return nil, err
	}
	return node, nil
}

func (r *NodeRepository) Delete(ctx context.Context, kbID, id string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.
			Model(&domain.Node{}).
			Where("id = ?", id).
			Where("kb_id = ?", kbID).
			Delete(&domain.Node{}).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *NodeRepository) GetNodeByID(ctx context.Context, id string) (*domain.Node, error) {
	var node *domain.Node
	if err := r.db.WithContext(ctx).
		Model(&domain.Node{}).
		Where("id = ?", id).
		First(&node).Error; err != nil {
		return nil, err
	}
	return node, nil
}

func (r *NodeRepository) GetNodesByDocIDs(ctx context.Context, ids []string) (map[string]*domain.Node, error) {
	var nodes []*domain.Node
	if err := r.db.WithContext(ctx).
		Model(&domain.Node{}).
		Where("doc_id IN ?", ids).
		Find(&nodes).Error; err != nil {
		return nil, err
	}
	nodesMap := make(map[string]*domain.Node)
	for _, node := range nodes {
		nodesMap[node.DocID] = node
	}
	return nodesMap, nil
}

// GetRecommendNodeListByIDs get node list by ids
func (r *NodeRepository) GetRecommendNodeListByIDs(ctx context.Context, kbID string, ids []string) ([]*domain.RecommendNodeListResp, error) {
	var nodes []*domain.RecommendNodeListResp
	if err := r.db.WithContext(ctx).
		Model(&domain.Node{}).
		Where("kb_id = ?", kbID).
		Where("id IN ?", ids).
		Select("id, name, type, meta->>'summary' as summary, parent_id, position").
		Find(&nodes).Error; err != nil {
		return nil, err
	}
	return nodes, nil
}

func (r *NodeRepository) GetRecommendNodeListByParentIDs(ctx context.Context, kbID string, parentIDs []string) (map[string][]*domain.RecommendNodeListResp, error) {
	var nodes []*domain.RecommendNodeListResp
	if err := r.db.WithContext(ctx).
		Model(&domain.Node{}).
		Where("kb_id = ? AND parent_id IN ?", kbID, parentIDs).
		Where("type != ?", domain.NodeTypeFolder).
		Select("id, name, type, meta->>'summary' as summary, parent_id, position").
		Find(&nodes).Error; err != nil {
		return nil, err
	}
	nodesMap := make(map[string][]*domain.RecommendNodeListResp)
	for _, node := range nodes {
		if _, ok := nodesMap[node.ParentID]; !ok {
			nodesMap[node.ParentID] = make([]*domain.RecommendNodeListResp, 0)
		}
		nodesMap[node.ParentID] = append(nodesMap[node.ParentID], node)
	}
	return nodesMap, nil
}

// GetNodeListByKBID get node list by kb id
func (r *NodeRepository) GetNodeListByKBID(ctx context.Context, kbID string) ([]*domain.ShareNodeListItemResp, error) {
	var nodes []*domain.ShareNodeListItemResp
	if err := r.db.WithContext(ctx).
		Model(&domain.Node{}).
		Where("kb_id = ?", kbID).
		Select("id, name, type, parent_id, position").
		Find(&nodes).Error; err != nil {
		return nil, err
	}
	return nodes, nil
}

func (r *NodeRepository) GetNodeDetailByKBIDAndID(ctx context.Context, kbID, id string) (*domain.NodeDetailResp, error) {
	var node *domain.NodeDetailResp
	if err := r.db.WithContext(ctx).
		Model(&domain.Node{}).
		Where("kb_id = ? AND id = ?", kbID, id).
		First(&node).Error; err != nil {
		return nil, err
	}
	return node, nil
}

func (r *NodeRepository) MoveNodeBetween(ctx context.Context, id string, parentID string, prevID, nextID string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var prevPos, maxPos float64 = 0, domain.MaxPosition
		if prevID != "" {
			var prevNode *domain.Node
			if err := tx.Model(&domain.Node{}).
				Where("id = ?", prevID).
				Where("parent_id = ?", parentID).
				Select("position, parent_id").
				First(&prevNode).Error; err != nil {
				return err
			}
			prevPos = prevNode.Position
		}
		if nextID != "" {
			var nextNode *domain.Node
			if err := tx.Model(&domain.Node{}).
				Where("id = ?", nextID).
				Where("parent_id = ?", parentID).
				Select("position, parent_id").
				First(&nextNode).Error; err != nil {
				return err
			}
			maxPos = nextNode.Position
		}

		newPos := prevPos + (maxPos-prevPos)/2.0

		return tx.Model(&domain.Node{}).
			Where("id = ?", id).
			Update("position", newPos).
			Update("parent_id", parentID).
			Error
	})
}

func (r *NodeRepository) UpdateNodeDocID(ctx context.Context, id, docID string) error {
	return r.db.WithContext(ctx).
		Model(&domain.Node{}).
		Where("id = ?", id).
		Update("doc_id", docID).Error
}

func (r *NodeRepository) UpdateNodeSummary(ctx context.Context, kbID, id, summary string) error {
	return r.db.WithContext(ctx).
		Model(&domain.Node{}).
		Where("kb_id = ? AND id = ?", kbID, id).
		Update("meta", gorm.Expr("jsonb_set(meta, '{summary}', to_jsonb(?::text))", summary)).Error
}

// traverse all nodes by pg cursor
func (r *NodeRepository) TraverseNodesByCursor(ctx context.Context, callback func(*domain.Node) error) error {
	rows, err := r.db.WithContext(ctx).
		Model(&domain.Node{}).
		Select("id, kb_id").
		Order("id ASC").
		Rows()
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var node domain.Node
		if err := r.db.ScanRows(rows, &node); err != nil {
			return err
		}
		if err := callback(&node); err != nil {
			return err
		}
	}

	if err := rows.Err(); err != nil {
		return err
	}

	return nil
}
