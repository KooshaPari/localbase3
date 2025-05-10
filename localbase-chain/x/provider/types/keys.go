package types

const (
	// ModuleName defines the module name
	ModuleName = "provider"

	// StoreKey defines the primary module store key
	StoreKey = ModuleName

	// RouterKey defines the module's message routing key
	RouterKey = ModuleName

	// QuerierRoute defines the module's query routing key
	QuerierRoute = ModuleName

	// MemStoreKey defines the in-memory store key
	MemStoreKey = "mem_provider"
)

// Key prefixes for store
var (
	ProviderKey = []byte{0x01} // prefix for storing providers
	ModelKey    = []byte{0x02} // prefix for storing model to provider mappings
)

// GetProviderKey returns the store key to retrieve a Provider from the index fields
func GetProviderKey(providerID string) []byte {
	return append(ProviderKey, []byte(providerID)...)
}

// GetModelProviderKey returns the store key to retrieve providers by model
func GetModelProviderKey(model string, providerID string) []byte {
	return append(append(ModelKey, []byte(model)...), []byte(providerID)...)
}

// GetModelPrefix returns the prefix for all providers supporting a specific model
func GetModelPrefix(model string) []byte {
	return append(ModelKey, []byte(model)...)
}
