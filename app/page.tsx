/**
 * Farm2Market Uganda - Home Page
 * 
 * This is a controlled, negotiation-driven agricultural trading platform.
 * Access is restricted to authorized users with specific roles.
 */

export default function Home() {
  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Farm2Market Uganda</h1>
      <p style={{ marginTop: "1rem", color: "#666" }}>
        Controlled, negotiation-driven agricultural trading platform
      </p>
      <div style={{ marginTop: "2rem", padding: "1rem", background: "#fff", borderRadius: "8px" }}>
        <h2>System Status</h2>
        <p style={{ marginTop: "0.5rem" }}>
          This application is currently in a private pilot phase.
        </p>
        <p style={{ marginTop: "0.5rem" }}>
          Access is restricted to authorized users.
        </p>
      </div>
    </main>
  );
}
