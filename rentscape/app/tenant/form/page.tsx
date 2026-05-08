"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function TenantFormPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [status, setStatus] = useState("");

	const router = useRouter();
	const pathname = usePathname();

	const syncFiltersToUrl = useCallback(
		(q: string, type: string) => {
			const params = new URLSearchParams(window.location.search);

			if (q.trim()) {
				params.set("q", q.trim());
			} else {
				params.delete("q");
			}

			if (type.trim()) {
				params.set("type", type.trim());
			} else {
				params.delete("type");
			}

			const query = params.toString();

			router.replace(query ? `${pathname}?${query}` : pathname);
		},
		[pathname, router]
	);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();


		syncFiltersToUrl(name, email);

		setStatus("Form submitted successfully.");
	};

	return (
		<main style={{ display: "flex", minHeight: "100vh", maxWidth: "28rem", margin: "0 auto", alignItems: "center", justifyContent: "center", padding: "24px" }}>
			<form
				onSubmit={handleSubmit}
				style={{ width: "100%", display: "grid", gap: "16px", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
			>
				<h1 style={{ fontSize: "20px", fontWeight: 600 }}>Tenant Form</h1>

				{/* Name */}
				<div style={{ display: "grid", gap: "8px" }}>
					<label htmlFor="name" style={{ display: "block", fontSize: "14px", fontWeight: 500 }}>
						Name
					</label>

					<input
						id="name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "8px 12px", outline: "none" }}
						placeholder="Enter your name"
					/>
				</div>

				{/* Email */}
				<div style={{ display: "grid", gap: "8px" }}>
					<label htmlFor="email" style={{ display: "block", fontSize: "14px", fontWeight: 500 }}>
						Email
					</label>

					<input
						id="email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "8px 12px", outline: "none" }}
						placeholder="Enter your email"
					/>
				</div>

				{/* Message */}
				<div style={{ display: "grid", gap: "8px" }}>
					<label htmlFor="message" style={{ display: "block", fontSize: "14px", fontWeight: 500 }}>
						Message
					</label>

					<textarea
						id="message"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "8px 12px", outline: "none", resize: "vertical" }}
						placeholder="Enter your message"
						rows={4}
					/>
				</div>

				{/* Submit Button */}
				<button
					type="submit"
					style={{ border: "none", borderRadius: "4px", backgroundColor: "#000", color: "#fff", padding: "8px 16px", cursor: "pointer" }}
				>
					Submit
				</button>

				{/* Status Message */}
				{status && (
					<p style={{ fontSize: "14px", color: "#16a34a" }}>
						{status}
					</p>
				)}
			</form>
		</main>
	);
}