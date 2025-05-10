import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Metadata } from "next";

// Configure the Inter font with fallback options
const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	fallback: [
		"-apple-system",
		"BlinkMacSystemFont",
		"Segoe UI",
		"Roboto",
		"Oxygen",
		"Ubuntu",
		"Cantarell",
		"Fira Sans",
		"Droid Sans",
		"Helvetica Neue",
		"sans-serif",
	],
});

export const metadata: Metadata = {
	title: "LocalBase - Decentralized AI Compute Marketplace",
	description: "A decentralized marketplace for AI compute resources",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='en'>
			<body className={inter.className}>
				<AuthProvider>{children}</AuthProvider>
			</body>
		</html>
	);
}
