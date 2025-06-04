package domain

const (
	// Vector topic (unidirectional)
	VectorTaskTopic = "apps.panda-wiki.vector.task"
)

var TopicConsumerName = map[string]string{
	VectorTaskTopic: "panda-wiki-vector-consumer",
}

type NodeContentVectorRequest struct {
	KBID   string `json:"kb_id"`
	ID     string `json:"id"`
	Action string `json:"action"` // upsert, delete
}
