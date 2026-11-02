// Run only from a trusted operator's terminal, never from the public app.
// Uses a pre-authenticated Supabase Management API token; no email is sent.
import { createClient } from "@supabase/supabase-js";

const [email, role = "staff", baseUrl = "http://localhost:3001"] = process.argv.slice(2);
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["admin", "staff"].includes(role)) {
  throw new Error("Usage: node scripts/provision-staff.mjs email [staff|admin] [admin-site-url]");
}
const origin = new URL(baseUrl);
if (origin.pathname !== "/" || origin.search || origin.hash || origin.username || origin.password ||
    (origin.protocol !== "https:" && !(origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname)))) {
  throw new Error("Use an HTTPS admin origin (or localhost for development).");
}
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) throw new Error("Sign in to Supabase and provide SUPABASE_ACCESS_TOKEN in this terminal.");
const project = "kjzrpqpktsyghgabgjvj";
const response = await fetch(`https://api.supabase.com/v1/projects/${project}/api-keys`, {
  headers: { Authorization: `Bearer ${token}` },
});
if (!response.ok) throw new Error(`Unable to retrieve project credentials (${response.status}).`);
const keys = await response.json();
const secret = keys.find(key => key.name === "service_role");
if (!secret?.api_key) throw new Error("Project service credential is unavailable.");
const supabase = createClient(`https://${project}.supabase.co`, secret.api_key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
// Find an existing account without replacing its password or silently promoting it.
let existing;
for (let page = 1; ; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw error;
  existing = data.users.find(user => user.email?.toLowerCase() === email.toLowerCase());
  if (existing || data.users.length < 100) break;
}
if (existing && existing.app_metadata.role !== role) {
  throw new Error("Account already exists with a different role. Review its access in Supabase before changing it.");
}
const { data, error } = await supabase.auth.admin.generateLink({
  type: existing ? "recovery" : "invite", email,
});
if (error) throw error;
if (!existing) {
  const { error: roleError } = await supabase.auth.admin.updateUserById(data.user.id, {
    app_metadata: { ...data.user.app_metadata, role },
  });
  if (roleError) throw roleError;
}
const link = new URL("/auth/confirm", origin);
link.searchParams.set("token_hash", data.properties.hashed_token);
link.searchParams.set("type", existing ? "recovery" : "invite");
console.log(`Account ready: ${email} (${role}). No email sent.`);
console.log("Private one-time password setup link (do not commit or share with anyone else):");
console.log(link.href);
