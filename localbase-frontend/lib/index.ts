// Barrel export for lib utilities
// Re-export all public APIs from supabase module:
/**
 * @module lib
 * @description Supabase integration for localbase-frontend.
 * Provides authentication, user profile management, API key operations,
 * provider registration, and job tracking.
 *
 * @example
 * ```typescript
 * import { signIn, supabase, type UserProfile } from './lib';
 *
 * const { data, error } = await signIn(email, password);
 * const profile = await getUserProfile(userId);
 * ```
 */

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
	UserProfile,
	UserProfileUpdates,
	UserProfileResponse,
	ApiKeyResponse,
	ProviderResponse,
	ProviderData,
	JobResponse,
	JobData,
} from "./supabase";
