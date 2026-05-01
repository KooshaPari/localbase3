import { createClient } from "@supabase/supabase-js";

// Environment variable validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fail fast if required environment variables are missing
function validateEnvConfig(): void {
	if (!supabaseUrl || !supabaseAnonKey) {
		const missingVars: string[] = [];
		if (!supabaseUrl) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
		if (!supabaseAnonKey) missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

		throw new Error(
			`Missing required environment variables: ${missingVars.join(", ")}. ` +
			"Please set these in your .env.local file."
		);
	}
}

// Validate before creating client
validateEnvConfig();

// Create the client with validated configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication functions
export async function signUp(email: string, password: string) {
	const { data, error } = await supabase.auth.signUp({
		email,
		password,
	});

	return { data, error };
}

export async function signIn(email: string, password: string) {
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	return { data, error };
}

export async function signOut() {
	const { error } = await supabase.auth.signOut();
	return { error };
}

export async function resetPassword(email: string) {
	const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${window.location.origin}/reset-password`,
	});

	return { data, error };
}

export async function updatePassword(password: string) {
	const { data, error } = await supabase.auth.updateUser({
		password,
	});

	return { data, error };
}

// User functions
export async function getCurrentUser() {
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return user;
}

export async function getUserProfile(userId: string) {
	const { data, error } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", userId)
		.single();

	return { data, error };
}

export async function updateUserProfile(userId: string, updates: UserProfileUpdates): Promise<{ data: UserProfileResponse | null; error: Error | null }> {
	const { data, error } = await supabase
		.from("profiles")
		.update(updates)
		.eq("id", userId);

	return { data: data as UserProfileResponse | null, error };
}

// User profile update type
export interface UserProfileUpdates {
	name?: string;
	email?: string;
	avatar_url?: string;
	// Allow additional string/number fields
	[key: string]: string | number | undefined;
}

// User profile response type
export interface UserProfileResponse {
	id: string;
	name?: string;
	email?: string;
	avatar_url?: string;
	created_at: string;
	updated_at: string;
	[key: string]: string | number | undefined;
}

// API key type
export interface ApiKeyResponse {
	id: string;
	user_id: string;
	name: string;
	permissions: string[];
	key: string;
	created_at: string;
}

// Provider response type
export interface ProviderResponse {
	id: string;
	user_id: string;
	name?: string;
	type?: string;
	config?: Record<string, unknown>;
	status: string;
	created_at: string;
	updated_at?: string;
	[key: string]: unknown;
}

// Provider data type
export interface ProviderData {
	name?: string;
	type?: string;
	config?: Record<string, unknown>;
	// Allow additional fields
	[key: string]: unknown;
}

// Job response type
export interface JobResponse {
	id: string;
	user_id: string;
	name?: string;
	model?: string;
	prompt?: string;
	status: string;
	created_at: string;
	updated_at?: string;
	[key: string]: unknown;
}

// Job data type
export interface JobData {
	name?: string;
	model?: string;
	prompt?: string;
	status?: string;
	// Allow additional fields
	[key: string]: unknown;
}

// API key management
export async function generateApiKey(
	userId: string,
	name: string,
	permissions: string[]
): Promise<{
	data: ApiKeyResponse | null;
	error: Error | null;
}> {
	const { data, error } = await supabase
		.from("api_keys")
		.insert([
			{
				user_id: userId,
				name,
				permissions,
				key: `lb_${globalThis.crypto.randomUUID().replace(/-/g, "")}`,
				created_at: new Date().toISOString(),
			},
		])
		.select()
		.single();

	return { data: data as ApiKeyResponse | null, error };
}

export async function listApiKeys(userId: string) {
	const { data, error } = await supabase
		.from("api_keys")
		.select("*")
		.eq("user_id", userId)
		.order("created_at", { ascending: false });

	return { data, error };
}

export async function deleteApiKey(keyId: string, userId: string) {
	const { data, error } = await supabase
		.from("api_keys")
		.delete()
		.eq("id", keyId)
		.eq("user_id", userId);

	return { data, error };
}

// Provider functions
export async function registerProvider(userId: string, providerData: ProviderData): Promise<{ data: ProviderResponse | null; error: Error | null }> {
	const { data, error } = await supabase
		.from("providers")
		.insert([
			{
				user_id: userId,
				...providerData,
				status: "pending",
				created_at: new Date().toISOString(),
			},
		])
		.select()
		.single();

	return { data: data as ProviderResponse | null, error };
}

export async function getProviderDetails(providerId: string) {
	const { data, error } = await supabase
		.from("providers")
		.select("*")
		.eq("id", providerId)
		.single();

	return { data, error };
}

// Job functions
export async function createJob(userId: string, jobData: JobData): Promise<{ data: JobResponse | null; error: Error | null }> {
	const { data, error } = await supabase
		.from("jobs")
		.insert([
			{
				user_id: userId,
				...jobData,
				status: "pending",
				created_at: new Date().toISOString(),
			},
		])
		.select()
		.single();

	return { data: data as JobResponse | null, error };
}

export async function listJobs(userId: string) {
	const { data, error } = await supabase
		.from("jobs")
		.select("*")
		.eq("user_id", userId)
		.order("created_at", { ascending: false });

	return { data, error };
}

export async function getJobDetails(jobId: string) {
	const { data, error } = await supabase
		.from("jobs")
		.select("*")
		.eq("id", jobId)
		.single();

	return { data, error };
}
