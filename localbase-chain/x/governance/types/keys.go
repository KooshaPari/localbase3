package types

const (
	// ModuleName defines the module name
	ModuleName = "governance"

	// StoreKey defines the primary module store key
	StoreKey = ModuleName

	// RouterKey defines the module's message routing key
	RouterKey = ModuleName

	// QuerierRoute defines the module's query routing key
	QuerierRoute = ModuleName

	// MemStoreKey defines the in-memory store key
	MemStoreKey = "mem_governance"
)

// Key prefixes for store
var (
	ProposalsKeyPrefix      = []byte{0x00} // prefix for storing proposals
	ActiveProposalQueueKey  = []byte{0x01} // prefix for the active proposal queue
	InactiveProposalQueueKey = []byte{0x02} // prefix for the inactive proposal queue
	ProposalIDKey           = []byte{0x03} // prefix for the next proposal ID
	DepositsKeyPrefix       = []byte{0x04} // prefix for storing deposits
	VotesKeyPrefix          = []byte{0x05} // prefix for storing votes
)

// GetProposalKey returns the key for a proposal
func GetProposalKey(proposalID uint64) []byte {
	return append(ProposalsKeyPrefix, sdk.Uint64ToBigEndian(proposalID)...)
}

// GetDepositKey returns the key for a deposit
func GetDepositKey(proposalID uint64, depositor sdk.AccAddress) []byte {
	return append(append(DepositsKeyPrefix, sdk.Uint64ToBigEndian(proposalID)...), depositor.Bytes()...)
}

// GetVoteKey returns the key for a vote
func GetVoteKey(proposalID uint64, voter sdk.AccAddress) []byte {
	return append(append(VotesKeyPrefix, sdk.Uint64ToBigEndian(proposalID)...), voter.Bytes()...)
}

// GetProposalIDBytes returns the byte representation of the proposalID
func GetProposalIDBytes(proposalID uint64) []byte {
	return sdk.Uint64ToBigEndian(proposalID)
}

// GetProposalIDFromBytes returns proposalID in uint64 format from a byte array
func GetProposalIDFromBytes(bz []byte) uint64 {
	return sdk.BigEndianToUint64(bz)
}
