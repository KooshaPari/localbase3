package types

const (
	// ModuleName defines the module name
	ModuleName = "staking"

	// StoreKey defines the primary module store key
	StoreKey = ModuleName

	// RouterKey defines the module's message routing key
	RouterKey = ModuleName

	// QuerierRoute defines the module's query routing key
	QuerierRoute = ModuleName

	// MemStoreKey defines the in-memory store key
	MemStoreKey = "mem_staking"
)

// Key prefixes for store
var (
	ValidatorsKey                  = []byte{0x21} // prefix for each key to a validator
	ValidatorsByConsAddrKey        = []byte{0x22} // prefix for each key to a validator index, by consensus address
	ValidatorsByPowerIndexKey      = []byte{0x23} // prefix for each key to a validator index, sorted by power
	DelegationKey                  = []byte{0x31} // prefix for each key to a delegation
	UnbondingDelegationKey         = []byte{0x32} // prefix for each key to an unbonding-delegation
	UnbondingDelegationByValIndexKey = []byte{0x33} // prefix for each key to an unbonding-delegation, by validator index
	RedelegationKey                = []byte{0x34} // prefix for each key to a redelegation
	RedelegationByValSrcIndexKey   = []byte{0x35} // prefix for each key to a redelegation, by source validator index
	RedelegationByValDstIndexKey   = []byte{0x36} // prefix for each key to a redelegation, by destination validator index
	UnbondingQueueKey              = []byte{0x41} // prefix for the timestamps in unbonding queue
	RedelegationQueueKey           = []byte{0x42} // prefix for the timestamps in redelegations queue
	ValidatorQueueKey              = []byte{0x43} // prefix for the timestamps in validator queue
	HistoricalInfoKey              = []byte{0x50} // prefix for the historical info
)

// GetValidatorKey returns the key for a validator
func GetValidatorKey(operatorAddr sdk.ValAddress) []byte {
	return append(ValidatorsKey, operatorAddr.Bytes()...)
}

// GetValidatorByConsAddrKey returns the key for a validator by consensus address
func GetValidatorByConsAddrKey(addr sdk.ConsAddress) []byte {
	return append(ValidatorsByConsAddrKey, addr.Bytes()...)
}

// GetValidatorsByPowerIndexKey returns the key for a validator by power index
func GetValidatorsByPowerIndexKey(validator Validator) []byte {
	// NOTE the address doesn't need to be stored because counter bytes must always be different
	return getValidatorPowerRank(validator)
}

// GetDelegationKey returns the key for a delegation
func GetDelegationKey(delAddr sdk.AccAddress, valAddr sdk.ValAddress) []byte {
	return append(append(DelegationKey, delAddr.Bytes()...), valAddr.Bytes()...)
}

// GetUnbondingDelegationKey returns the key for an unbonding delegation
func GetUnbondingDelegationKey(delAddr sdk.AccAddress, valAddr sdk.ValAddress) []byte {
	return append(append(UnbondingDelegationKey, delAddr.Bytes()...), valAddr.Bytes()...)
}

// GetUnbondingDelegationByValIndexKey returns the key for an unbonding delegation by validator index
func GetUnbondingDelegationByValIndexKey(valAddr sdk.ValAddress, delAddr sdk.AccAddress) []byte {
	return append(append(UnbondingDelegationByValIndexKey, valAddr.Bytes()...), delAddr.Bytes()...)
}

// GetRedelegationKey returns the key for a redelegation
func GetRedelegationKey(delAddr sdk.AccAddress, valSrcAddr, valDstAddr sdk.ValAddress) []byte {
	return append(append(append(RedelegationKey, delAddr.Bytes()...), valSrcAddr.Bytes()...), valDstAddr.Bytes()...)
}

// GetRedelegationByValSrcIndexKey returns the key for a redelegation by source validator index
func GetRedelegationByValSrcIndexKey(valSrcAddr, valDstAddr sdk.ValAddress, delAddr sdk.AccAddress) []byte {
	return append(append(append(RedelegationByValSrcIndexKey, valSrcAddr.Bytes()...), valDstAddr.Bytes()...), delAddr.Bytes()...)
}

// GetRedelegationByValDstIndexKey returns the key for a redelegation by destination validator index
func GetRedelegationByValDstIndexKey(valDstAddr, valSrcAddr sdk.ValAddress, delAddr sdk.AccAddress) []byte {
	return append(append(append(RedelegationByValDstIndexKey, valDstAddr.Bytes()...), valSrcAddr.Bytes()...), delAddr.Bytes()...)
}

// GetUnbondingDelegationTimeKey returns the key for an unbonding delegation timestamp
func GetUnbondingDelegationTimeKey(timestamp time.Time) []byte {
	bz := sdk.FormatTimeBytes(timestamp)
	return append(UnbondingQueueKey, bz...)
}

// GetRedelegationTimeKey returns the key for a redelegation timestamp
func GetRedelegationTimeKey(timestamp time.Time) []byte {
	bz := sdk.FormatTimeBytes(timestamp)
	return append(RedelegationQueueKey, bz...)
}

// GetValidatorQueueTimeKey returns the key for a validator queue timestamp
func GetValidatorQueueTimeKey(timestamp time.Time) []byte {
	bz := sdk.FormatTimeBytes(timestamp)
	return append(ValidatorQueueKey, bz...)
}

// GetHistoricalInfoKey returns the key for a historical info
func GetHistoricalInfoKey(height int64) []byte {
	return append(HistoricalInfoKey, sdk.Int64ToBigEndian(height)...)
}

// getValidatorPowerRank returns the validator power rank key
func getValidatorPowerRank(validator Validator) []byte {
	// NOTE the address doesn't need to be stored because counter bytes must always be different
	// NOTE power is the BondedTokens
	consensusPower := sdk.TokensToConsensusPower(validator.Tokens, sdk.DefaultPowerReduction)
	consensusPowerBytes := make([]byte, 8)
	binary.BigEndian.PutUint64(consensusPowerBytes, uint64(consensusPower))

	powerBytes := consensusPowerBytes
	powerBytesLen := len(powerBytes)

	// key is of format prefix || powerbytes || addrBytes
	key := make([]byte, 1+powerBytesLen+sdk.AddrLen)

	key[0] = ValidatorsByPowerIndexKey[0]
	copy(key[1:powerBytesLen+1], powerBytes)
	operAddrInvr := sdk.CopyBytes(validator.OperatorAddress)
	for i, b := range operAddrInvr {
		operAddrInvr[i] = ^b
	}
	copy(key[powerBytesLen+1:], operAddrInvr)

	return key
}
