"use client";

export function SignOutButton() {
  async function signOut() {
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = "/";
  }
  return (
    <button onClick={signOut} className="btn-quiet">
      Sign out
    </button>
  );
}
