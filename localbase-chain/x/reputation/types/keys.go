package types

const (
	// ModuleName defines the module name
	ModuleName = "reputation"

	// StoreKey defines the primary module store key
	StoreKey = ModuleName

	// RouterKey defines the module's message routing key
	RouterKey = ModuleName

	// QuerierRoute defines the module's query routing key
	QuerierRoute = ModuleName

	// MemStoreKey defines the in-memory store key
	MemStoreKey = "mem_reputation"
)

// Key prefixes for store
var (
	ReputationKey = []byte{0x01} // prefix for storing reputations
	RatingKey     = []byte{0x02} // prefix for storing ratings
)

// GetReputationKey returns the store key to retrieve a Reputation from the index fields
func GetReputationKey(providerID string) []byte {
	return append(ReputationKey, []byte(providerID)...)
}

// GetRatingKey returns the store key to retrieve a Rating from the index fields
func GetRatingKey(jobID string) []byte {
	return append(RatingKey, []byte(jobID)...)
}
