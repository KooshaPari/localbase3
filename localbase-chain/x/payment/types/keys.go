package types

const (
	// ModuleName defines the module name
	ModuleName = "payment"

	// StoreKey defines the primary module store key
	StoreKey = ModuleName

	// RouterKey defines the module's message routing key
	RouterKey = ModuleName

	// QuerierRoute defines the module's query routing key
	QuerierRoute = ModuleName

	// MemStoreKey defines the in-memory store key
	MemStoreKey = "mem_payment"
)

// Key prefixes for store
var (
	PaymentKey       = []byte{0x01} // prefix for storing payments
	JobPaymentKey    = []byte{0x02} // prefix for storing job to payment mappings
	CreatorPaymentKey = []byte{0x03} // prefix for storing creator to payment mappings
	ProviderPaymentKey = []byte{0x04} // prefix for storing provider to payment mappings
)

// GetPaymentKey returns the store key to retrieve a Payment from the index fields
func GetPaymentKey(paymentID string) []byte {
	return append(PaymentKey, []byte(paymentID)...)
}

// GetJobPaymentKey returns the store key to retrieve payments by job
func GetJobPaymentKey(jobID string) []byte {
	return append(JobPaymentKey, []byte(jobID)...)
}

// GetCreatorPaymentKey returns the store key to retrieve payments by creator
func GetCreatorPaymentKey(creator string, paymentID string) []byte {
	return append(append(CreatorPaymentKey, []byte(creator)...), []byte(paymentID)...)
}

// GetProviderPaymentKey returns the store key to retrieve payments by provider
func GetProviderPaymentKey(provider string, paymentID string) []byte {
	return append(append(ProviderPaymentKey, []byte(provider)...), []byte(paymentID)...)
}

// GetCreatorPrefix returns the prefix for all payments for a specific creator
func GetCreatorPrefix(creator string) []byte {
	return append(CreatorPaymentKey, []byte(creator)...)
}

// GetProviderPrefix returns the prefix for all payments for a specific provider
func GetProviderPrefix(provider string) []byte {
	return append(ProviderPaymentKey, []byte(provider)...)
}
