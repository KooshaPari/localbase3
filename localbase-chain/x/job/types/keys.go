package types

const (
	// ModuleName defines the module name
	ModuleName = "job"

	// StoreKey defines the primary module store key
	StoreKey = ModuleName

	// RouterKey defines the module's message routing key
	RouterKey = ModuleName

	// QuerierRoute defines the module's query routing key
	QuerierRoute = ModuleName

	// MemStoreKey defines the in-memory store key
	MemStoreKey = "mem_job"
)

// Key prefixes for store
var (
	JobKey              = []byte{0x01} // prefix for storing jobs
	ProviderJobKey      = []byte{0x02} // prefix for storing provider to job mappings
	CreatorJobKey       = []byte{0x03} // prefix for storing creator to job mappings
	ModelJobKey         = []byte{0x04} // prefix for storing model to job mappings
)

// GetJobKey returns the store key to retrieve a Job from the index fields
func GetJobKey(jobID string) []byte {
	return append(JobKey, []byte(jobID)...)
}

// GetProviderJobKey returns the store key to retrieve jobs by provider
func GetProviderJobKey(providerID string, jobID string) []byte {
	return append(append(ProviderJobKey, []byte(providerID)...), []byte(jobID)...)
}

// GetCreatorJobKey returns the store key to retrieve jobs by creator
func GetCreatorJobKey(creator string, jobID string) []byte {
	return append(append(CreatorJobKey, []byte(creator)...), []byte(jobID)...)
}

// GetModelJobKey returns the store key to retrieve jobs by model
func GetModelJobKey(model string, jobID string) []byte {
	return append(append(ModelJobKey, []byte(model)...), []byte(jobID)...)
}

// GetProviderPrefix returns the prefix for all jobs for a specific provider
func GetProviderPrefix(providerID string) []byte {
	return append(ProviderJobKey, []byte(providerID)...)
}

// GetCreatorPrefix returns the prefix for all jobs for a specific creator
func GetCreatorPrefix(creator string) []byte {
	return append(CreatorJobKey, []byte(creator)...)
}

// GetModelPrefix returns the prefix for all jobs for a specific model
func GetModelPrefix(model string) []byte {
	return append(ModelJobKey, []byte(model)...)
}
