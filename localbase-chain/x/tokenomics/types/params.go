package types

import (
	"fmt"
	"time"

	sdk "github.com/cosmos/cosmos-sdk/types"
	paramtypes "github.com/cosmos/cosmos-sdk/x/params/types"
)

// Parameter store keys
var (
	KeyInflationRate            = []byte("InflationRate")
	KeyInflationMax             = []byte("InflationMax")
	KeyInflationMin             = []byte("InflationMin")
	KeyGoalBonded               = []byte("GoalBonded")
	KeyBlocksPerYear            = []byte("BlocksPerYear")
	KeyProviderRewardPercentage = []byte("ProviderRewardPercentage")
	KeyUserRewardPercentage     = []byte("UserRewardPercentage")
	KeyCommunityPoolPercentage  = []byte("CommunityPoolPercentage")
	KeyJobFeePercentage         = []byte("JobFeePercentage")
)

// ParamTable for tokenomics module
func ParamKeyTable() paramtypes.KeyTable {
	return paramtypes.NewKeyTable().RegisterParamSet(&Params{})
}

// Default parameter values
const (
	DefaultInflationRate            = "0.13"  // 13% annual inflation
	DefaultInflationMax             = "0.20"  // 20% maximum inflation
	DefaultInflationMin             = "0.07"  // 7% minimum inflation
	DefaultGoalBonded               = "0.67"  // 67% goal of bonded tokens
	DefaultBlocksPerYear            = uint64(6311520) // assuming 5-second blocks
	DefaultProviderRewardPercentage = "0.70"  // 70% of inflation goes to providers
	DefaultUserRewardPercentage     = "0.10"  // 10% of inflation goes to users
	DefaultCommunityPoolPercentage  = "0.20"  // 20% of inflation goes to community pool
	DefaultJobFeePercentage         = "0.05"  // 5% of job fees go to community pool
)

// Params defines the parameters for the tokenomics module
type Params struct {
	InflationRate            sdk.Dec `json:"inflation_rate" yaml:"inflation_rate"`
	InflationMax             sdk.Dec `json:"inflation_max" yaml:"inflation_max"`
	InflationMin             sdk.Dec `json:"inflation_min" yaml:"inflation_min"`
	GoalBonded               sdk.Dec `json:"goal_bonded" yaml:"goal_bonded"`
	BlocksPerYear            uint64  `json:"blocks_per_year" yaml:"blocks_per_year"`
	ProviderRewardPercentage sdk.Dec `json:"provider_reward_percentage" yaml:"provider_reward_percentage"`
	UserRewardPercentage     sdk.Dec `json:"user_reward_percentage" yaml:"user_reward_percentage"`
	CommunityPoolPercentage  sdk.Dec `json:"community_pool_percentage" yaml:"community_pool_percentage"`
	JobFeePercentage         sdk.Dec `json:"job_fee_percentage" yaml:"job_fee_percentage"`
}

// NewParams creates a new Params instance
func NewParams(
	inflationRate sdk.Dec,
	inflationMax sdk.Dec,
	inflationMin sdk.Dec,
	goalBonded sdk.Dec,
	blocksPerYear uint64,
	providerRewardPercentage sdk.Dec,
	userRewardPercentage sdk.Dec,
	communityPoolPercentage sdk.Dec,
	jobFeePercentage sdk.Dec,
) Params {
	return Params{
		InflationRate:            inflationRate,
		InflationMax:             inflationMax,
		InflationMin:             inflationMin,
		GoalBonded:               goalBonded,
		BlocksPerYear:            blocksPerYear,
		ProviderRewardPercentage: providerRewardPercentage,
		UserRewardPercentage:     userRewardPercentage,
		CommunityPoolPercentage:  communityPoolPercentage,
		JobFeePercentage:         jobFeePercentage,
	}
}

// DefaultParams returns a default set of parameters
func DefaultParams() Params {
	return Params{
		InflationRate:            sdk.MustNewDecFromStr(DefaultInflationRate),
		InflationMax:             sdk.MustNewDecFromStr(DefaultInflationMax),
		InflationMin:             sdk.MustNewDecFromStr(DefaultInflationMin),
		GoalBonded:               sdk.MustNewDecFromStr(DefaultGoalBonded),
		BlocksPerYear:            DefaultBlocksPerYear,
		ProviderRewardPercentage: sdk.MustNewDecFromStr(DefaultProviderRewardPercentage),
		UserRewardPercentage:     sdk.MustNewDecFromStr(DefaultUserRewardPercentage),
		CommunityPoolPercentage:  sdk.MustNewDecFromStr(DefaultCommunityPoolPercentage),
		JobFeePercentage:         sdk.MustNewDecFromStr(DefaultJobFeePercentage),
	}
}

// ParamSetPairs implements the ParamSet interface and returns all the key/value pairs
// pairs of tokenomics module's parameters.
func (p *Params) ParamSetPairs() paramtypes.ParamSetPairs {
	return paramtypes.ParamSetPairs{
		paramtypes.NewParamSetPair(KeyInflationRate, &p.InflationRate, validateInflationRate),
		paramtypes.NewParamSetPair(KeyInflationMax, &p.InflationMax, validateInflationMax),
		paramtypes.NewParamSetPair(KeyInflationMin, &p.InflationMin, validateInflationMin),
		paramtypes.NewParamSetPair(KeyGoalBonded, &p.GoalBonded, validateGoalBonded),
		paramtypes.NewParamSetPair(KeyBlocksPerYear, &p.BlocksPerYear, validateBlocksPerYear),
		paramtypes.NewParamSetPair(KeyProviderRewardPercentage, &p.ProviderRewardPercentage, validateProviderRewardPercentage),
		paramtypes.NewParamSetPair(KeyUserRewardPercentage, &p.UserRewardPercentage, validateUserRewardPercentage),
		paramtypes.NewParamSetPair(KeyCommunityPoolPercentage, &p.CommunityPoolPercentage, validateCommunityPoolPercentage),
		paramtypes.NewParamSetPair(KeyJobFeePercentage, &p.JobFeePercentage, validateJobFeePercentage),
	}
}

// Validate validates the set of params
func (p Params) Validate() error {
	if err := validateInflationRate(p.InflationRate); err != nil {
		return err
	}
	if err := validateInflationMax(p.InflationMax); err != nil {
		return err
	}
	if err := validateInflationMin(p.InflationMin); err != nil {
		return err
	}
	if err := validateGoalBonded(p.GoalBonded); err != nil {
		return err
	}
	if err := validateBlocksPerYear(p.BlocksPerYear); err != nil {
		return err
	}
	if err := validateProviderRewardPercentage(p.ProviderRewardPercentage); err != nil {
		return err
	}
	if err := validateUserRewardPercentage(p.UserRewardPercentage); err != nil {
		return err
	}
	if err := validateCommunityPoolPercentage(p.CommunityPoolPercentage); err != nil {
		return err
	}
	if err := validateJobFeePercentage(p.JobFeePercentage); err != nil {
		return err
	}

	// Check that percentages sum to 1
	totalPercentage := p.ProviderRewardPercentage.Add(p.UserRewardPercentage).Add(p.CommunityPoolPercentage)
	if !totalPercentage.Equal(sdk.OneDec()) {
		return fmt.Errorf("provider, user, and community pool percentages must sum to 1, got %s", totalPercentage)
	}

	return nil
}

func validateInflationRate(i interface{}) error {
	v, ok := i.(sdk.Dec)
	if !ok {
		return fmt.Errorf("invalid parameter type: %T", i)
	}

	if v.IsNegative() {
		return fmt.Errorf("inflation rate cannot be negative: %s", v)
	}

	return nil
}

func validateInflationMax(i interface{}) error {
	v, ok := i.(sdk.Dec)
	if !ok {
		return fmt.Errorf("invalid parameter type: %T", i)
	}

	if v.IsNegative() {
		return fmt.Errorf("max inflation cannot be negative: %s", v)
	}

	return nil
}

func validateInflationMin(i interface{}) error {
	v, ok := i.(sdk.Dec)
	if !ok {
		return fmt.Errorf("invalid parameter type: %T", i)
	}

	if v.IsNegative() {
		return fmt.Errorf("min inflation cannot be negative: %s", v)
	}

	return nil
}

func validateGoalBonded(i interface{}) error {
	v, ok := i.(sdk.Dec)
	if !ok {
		return fmt.Errorf("invalid parameter type: %T", i)
	}

	if v.IsNegative() || v.GT(sdk.OneDec()) {
		return fmt.Errorf("goal bonded must be between 0 and 1: %s", v)
	}

	return nil
}

func validateBlocksPerYear(i interface{}) error {
	v, ok := i.(uint64)
	if !ok {
		return fmt.Errorf("invalid parameter type: %T", i)
	}

	if v == 0 {
		return fmt.Errorf("blocks per year must be positive: %d", v)
	}

	return nil
}

func validateProviderRewardPercentage(i interface{}) error {
	v, ok := i.(sdk.Dec)
	if !ok {
		return fmt.Errorf("invalid parameter type: %T", i)
	}

	if v.IsNegative() || v.GT(sdk.OneDec()) {
		return fmt.Errorf("provider reward percentage must be between 0 and 1: %s", v)
	}

	return nil
}

func validateUserRewardPercentage(i interface{}) error {
	v, ok := i.(sdk.Dec)
	if !ok {
		return fmt.Errorf("invalid parameter type: %T", i)
	}

	if v.IsNegative() || v.GT(sdk.OneDec()) {
		return fmt.Errorf("user reward percentage must be between 0 and 1: %s", v)
	}

	return nil
}

func validateCommunityPoolPercentage(i interface{}) error {
	v, ok := i.(sdk.Dec)
	if !ok {
		return fmt.Errorf("invalid parameter type: %T", i)
	}

	if v.IsNegative() || v.GT(sdk.OneDec()) {
		return fmt.Errorf("community pool percentage must be between 0 and 1: %s", v)
	}

	return nil
}

func validateJobFeePercentage(i interface{}) error {
	v, ok := i.(sdk.Dec)
	if !ok {
		return fmt.Errorf("invalid parameter type: %T", i)
	}

	if v.IsNegative() || v.GT(sdk.OneDec()) {
		return fmt.Errorf("job fee percentage must be between 0 and 1: %s", v)
	}

	return nil
}
