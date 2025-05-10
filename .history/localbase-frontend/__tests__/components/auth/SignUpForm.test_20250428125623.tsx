import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignUpForm from "@/components/auth/SignUpForm";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Mock the useAuth hook
jest.mock("@/contexts/AuthContext", () => ({
	useAuth: jest.fn(),
}));

// Mock the useRouter hook
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
}));

describe("SignUpForm", () => {
	const mockSignUp = jest.fn();
	const mockPush = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();

		// Setup mocks
		(useAuth as jest.Mock).mockReturnValue({
			signUp: mockSignUp,
		});

		(useRouter as jest.Mock).mockReturnValue({
			push: mockPush,
		});
	});

	it("renders the sign up form correctly", () => {
		render(<SignUpForm />);

		expect(screen.getByText("Create an Account")).toBeInTheDocument();
		expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /sign up/i })
		).toBeInTheDocument();
		expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
		expect(screen.getByText(/sign in/i)).toBeInTheDocument();
	});

	it("validates form inputs", async () => {
		render(<SignUpForm />);

		// Try to submit with empty fields
		fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

		await waitFor(() => {
			expect(
				screen.getByText(/please fill in all fields/i)
			).toBeInTheDocument();
		});

		// Fill in email only
		fireEvent.change(screen.getByLabelText(/email address/i), {
			target: { value: "test@example.com" },
		});

		fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

		await waitFor(() => {
			expect(
				screen.getByText(/please fill in all fields/i)
			).toBeInTheDocument();
		});

		// Fill in email and password, but not confirm password
		fireEvent.change(screen.getByLabelText(/password/i), {
			target: { value: "password123" },
		});

		fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

		await waitFor(() => {
			expect(
				screen.getByText(/please fill in all fields/i)
			).toBeInTheDocument();
		});

		// Fill in all fields but with mismatched passwords
		fireEvent.change(screen.getByLabelText(/confirm password/i), {
			target: { value: "password456" },
		});

		fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

		await waitFor(() => {
			expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
		});

		// Verify signUp was not called
		expect(mockSignUp).not.toHaveBeenCalled();
	});

	it("handles successful sign up", async () => {
		mockSignUp.mockResolvedValueOnce({
			data: {
				user: { id: "123", identities: [{ id: "identity1" }] },
				session: { user: { id: "123" } },
			},
			error: null,
		});

		render(<SignUpForm />);

		// Fill in the form
		fireEvent.change(screen.getByLabelText(/full name/i), {
			target: { value: "Test User" },
		});

		fireEvent.change(screen.getByLabelText(/email address/i), {
			target: { value: "test@example.com" },
		});

		// Use a more specific selector to avoid ambiguity with multiple password fields
		fireEvent.change(screen.getByLabelText(/^password$/i), {
			target: { value: "password123" },
		});

		fireEvent.change(screen.getByLabelText(/confirm password/i), {
			target: { value: "password123" },
		});

		// Submit the form
		fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

		await waitFor(() => {
			// Verify signUp was called with correct parameters
			expect(mockSignUp).toHaveBeenCalledWith(
				"test@example.com",
				"password123"
			);

			// Verify redirect to dashboard
			expect(mockPush).toHaveBeenCalledWith("/dashboard");
		});

		// Verify no error message is displayed
		expect(
			screen.queryByText(/an unexpected error occurred/i)
		).not.toBeInTheDocument();
	});

	it("handles sign up with email confirmation", async () => {
		mockSignUp.mockResolvedValueOnce({
			data: { user: { id: "123", identities: [] } },
			error: null,
		});

		render(<SignUpForm />);

		// Fill in the form
		fireEvent.change(screen.getByLabelText(/full name/i), {
			target: { value: "Test User" },
		});

		fireEvent.change(screen.getByLabelText(/email address/i), {
			target: { value: "test@example.com" },
		});

		// Use a more specific selector to avoid ambiguity with multiple password fields
		fireEvent.change(screen.getByLabelText(/^password$/i), {
			target: { value: "password123" },
		});

		fireEvent.change(screen.getByLabelText(/confirm password/i), {
			target: { value: "password123" },
		});

		// Submit the form
		fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

		await waitFor(() => {
			// Verify signUp was called with correct parameters
			expect(mockSignUp).toHaveBeenCalledWith(
				"test@example.com",
				"password123"
			);

			// Verify success message is displayed
			expect(
				screen.getByText(/please check your email for a confirmation link/i)
			).toBeInTheDocument();

			// Verify redirect was not called (since email confirmation is required)
			expect(mockPush).not.toHaveBeenCalled();
		});
	});

	it("handles sign up error", async () => {
		mockSignUp.mockResolvedValueOnce({
			error: { message: "Email already registered" },
		});

		render(<SignUpForm />);

		// Fill in the form
		fireEvent.change(screen.getByLabelText(/full name/i), {
			target: { value: "Test User" },
		});

		fireEvent.change(screen.getByLabelText(/email address/i), {
			target: { value: "test@example.com" },
		});

		// Use a more specific selector to avoid ambiguity with multiple password fields
		fireEvent.change(screen.getByLabelText(/^password$/i), {
			target: { value: "password123" },
		});

		fireEvent.change(screen.getByLabelText(/confirm password/i), {
			target: { value: "password123" },
		});

		// Submit the form
		fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

		await waitFor(() => {
			// Verify error message is displayed
			expect(screen.getByText("Email already registered")).toBeInTheDocument();

			// Verify redirect was not called
			expect(mockPush).not.toHaveBeenCalled();
		});
	});

	it("handles unexpected errors", async () => {
		mockSignUp.mockRejectedValueOnce(new Error("Network error"));

		render(<SignUpForm />);

		// Fill in the form
		fireEvent.change(screen.getByLabelText(/email address/i), {
			target: { value: "test@example.com" },
		});

		// Use a more specific selector to avoid ambiguity with multiple password fields
		fireEvent.change(screen.getByLabelText(/^password$/i), {
			target: { value: "password123" },
		});

		fireEvent.change(screen.getByLabelText(/confirm password/i), {
			target: { value: "password123" },
		});

		// Submit the form
		fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

		await waitFor(() => {
			// Verify error message is displayed
			expect(
				screen.getByText(/an unexpected error occurred/i)
			).toBeInTheDocument();

			// Verify redirect was not called
			expect(mockPush).not.toHaveBeenCalled();
		});
	});

	it("disables the submit button during form submission", async () => {
		// Create a delayed promise to simulate network request
		mockSignUp.mockImplementationOnce(() => {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve({
						data: { user: { id: "123" }, session: { user: { id: "123" } } },
						error: null,
					});
				}, 100);
			});
		});

		render(<SignUpForm />);

		// Fill in the form
		fireEvent.change(screen.getByLabelText(/email address/i), {
			target: { value: "test@example.com" },
		});

		// Use a more specific selector to avoid ambiguity with multiple password fields
		fireEvent.change(screen.getByLabelText(/^password$/i), {
			target: { value: "password123" },
		});

		fireEvent.change(screen.getByLabelText(/confirm password/i), {
			target: { value: "password123" },
		});

		// Submit the form
		fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

		// Verify button is disabled and shows loading state
		expect(
			screen.getByRole("button", { name: /creating account/i })
		).toBeDisabled();

		await waitFor(() => {
			// After completion, verify redirect was called
			expect(mockPush).toHaveBeenCalledWith("/dashboard");
		});
	});
});
