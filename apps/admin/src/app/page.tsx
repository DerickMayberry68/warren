import { Button } from "@warren/ui";
import { createClient } from "@warren/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string;
  message: string | null;
  status: string;
  created_at: string;
};

async function getContacts() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contacts")
      .select("id,name,email,phone,service,message,status,created_at")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      return {
        contacts: [] as Contact[],
        error: error.message,
      };
    }

    return {
      contacts: data,
      error: "",
    };
  } catch (error) {
    return {
      contacts: [] as Contact[],
      error:
        error instanceof Error
          ? error.message
          : "Unable to load contacts right now.",
    };
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function Home() {
  const { contacts, error } = await getContacts();
  const newContacts = contacts.filter((contact) => contact.status === "new");
  const metrics = [
    { label: "Open leads", value: String(newContacts.length) },
    { label: "Recent contacts", value: String(contacts.length) },
    { label: "Admin users", value: "0" },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-black/10 p-6 dark:border-white/10 lg:border-b-0 lg:border-r">
          <div className="text-sm font-semibold uppercase tracking-[0.18em]">
            Warren
          </div>
          <nav className="mt-10 grid gap-1 text-sm">
            <Link
              className="rounded-md bg-black/[0.04] px-3 py-2 dark:bg-white/10"
              href="/"
            >
              Overview
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-foreground/65"
              href="/leads"
            >
              Leads
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-foreground/65"
              href="/settings"
            >
              Settings
            </Link>
          </nav>
        </aside>

        <section className="p-6 sm:p-8">
          <header className="flex flex-col gap-4 border-b border-black/10 pb-6 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-foreground/60">Admin app</p>
              <h1 className="mt-1 text-3xl font-semibold">
                Workspace overview
              </h1>
            </div>
            <Button className="w-full sm:w-auto">New entry</Button>
          </header>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <div
                className="rounded-lg border border-black/10 p-5 dark:border-white/10"
                key={metric.label}
              >
                <div className="text-sm text-foreground/60">{metric.label}</div>
                <div className="mt-3 text-3xl font-semibold">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-black/10 p-4 dark:border-white/10">
              <div>
                <h2 className="text-sm font-medium">Contact requests</h2>
                <p className="mt-1 text-sm text-foreground/60">
                  Submissions from the marketing modal.
                </p>
              </div>
            </div>

            {error ? (
              <div className="grid gap-3 p-4 text-sm text-foreground/68">
                <p>
                  Contacts are ready to display once the Warren Supabase project
                  is configured.
                </p>
                <p className="font-mono text-xs text-foreground/56">{error}</p>
              </div>
            ) : null}

            {!error && contacts.length === 0 ? (
              <div className="p-8 text-sm text-foreground/60">
                No contact requests yet.
              </div>
            ) : null}

            {!error && contacts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-black/[0.03] text-foreground/60 dark:bg-white/[0.05]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Service</th>
                      <th className="px-4 py-3 font-medium">Contact</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr
                        className="border-t border-black/10 dark:border-white/10"
                        key={contact.id}
                      >
                        <td className="px-4 py-4 align-top">
                          <div className="font-medium">{contact.name}</div>
                          {contact.message ? (
                            <div className="mt-1 max-w-xs text-foreground/60">
                              {contact.message}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 align-top">
                          {contact.service}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <a
                            className="block text-foreground underline-offset-4 hover:underline"
                            href={`mailto:${contact.email}`}
                          >
                            {contact.email}
                          </a>
                          {contact.phone ? (
                            <a
                              className="mt-1 block text-foreground/60 underline-offset-4 hover:underline"
                              href={`tel:${contact.phone}`}
                            >
                              {contact.phone}
                            </a>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className="rounded-md bg-black/[0.04] px-2 py-1 text-xs font-medium uppercase tracking-[0.12em] dark:bg-white/10">
                            {contact.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top text-foreground/60">
                          {formatDate(contact.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
