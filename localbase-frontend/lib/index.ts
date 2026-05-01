// Barrel export for lib utilities
// Re-export all public APIs from supabase module

export {
	supabase,
	signUp,
	signIn,
	signOut,
	resetPassword,
	updatePassword,
	getCurrentUser,
	getUserProfile,
	updateUserProfile,
	generateApiKey,
	listApiKeys,
	deleteApiKey,
	registerProvider,
	getProviderDetails,
	createJob,
	listJobs,
	getJobDetails,
} from "./supabase";

export type {
	UserProfileUpdates,
	UserProfileResponse,
	ApiKeyResponse,
	ProviderResponse,
	ProviderData,
	JobResponse,
	JobData,
} from "./supabase";
