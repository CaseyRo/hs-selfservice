"use client";

import { useState, useEffect } from "react";

type ContactFields = {
  firstname: string;
  lastname: string;
  email: string;
};

type CompanyFields = {
  name: string;
  domain: string;
  contact: ContactFields;
};

type CreatedEntity = {
  type: string;
  id: string;
  name: string;
  url: string;
};

type AssociationLabel = {
  typeId: number;
  label: string;
  category: string;
};

const emptyContact = (): ContactFields => ({ firstname: "", lastname: "", email: "" });
const emptyCompany = (): CompanyFields => ({
  name: "",
  domain: "",
  contact: emptyContact(),
});

const APP_VERSION = "0.4.0";

export default function Home() {
  const [authLoading, setAuthLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [portalId, setPortalId] = useState<string | null>(null);

  const [partner, setPartner] = useState<CompanyFields>(emptyCompany());
  const [customer, setCustomer] = useState<CompanyFields>(emptyCompany());
  const [associationLabel, setAssociationLabel] = useState<number | null>(null);
  const [labels, setLabels] = useState<AssociationLabel[]>([]);
  const [labelsLoading, setLabelsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CreatedEntity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user already identified
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.loggedIn) setUserName(data.userName);
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  // Fetch labels when identified
  useEffect(() => {
    if (!userName) return;
    setLabelsLoading(true);
    setError(null);
    fetch("/api/labels")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setError(data.error || `Labels fetch failed: ${r.status}`);
          return;
        }
        if (data.labels) {
          setLabels(data.labels);
          if (data.labels.length > 0) setAssociationLabel(data.labels[0].typeId);
        }
        if (data.portalId) setPortalId(data.portalId);
      })
      .catch((err) => setError(err.message || "Failed to fetch labels"))
      .finally(() => setLabelsLoading(false));
  }, [userName]);

  const handleIdentify = async () => {
    if (!nameInput.trim()) return;
    const res = await fetch("/api/auth/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameInput.trim() }),
    });
    const data = await res.json();
    if (data.loggedIn) setUserName(data.userName);
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    setUserName(null);
    setNameInput("");
    setLabels([]);
    setResults(null);
    setPortalId(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner,
          customer,
          associationLabelId: associationLabel,
          portalId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResults(data.created);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePartner = (patch: Partial<CompanyFields>) =>
    setPartner((p) => ({ ...p, ...patch }));
  const updatePartnerContact = (patch: Partial<ContactFields>) =>
    setPartner((p) => ({ ...p, contact: { ...p.contact, ...patch } }));
  const updateCustomer = (patch: Partial<CompanyFields>) =>
    setCustomer((c) => ({ ...c, ...patch }));
  const updateCustomerContact = (patch: Partial<ContactFields>) =>
    setCustomer((c) => ({ ...c, contact: { ...c.contact, ...patch } }));

  const isValid =
    partner.name &&
    partner.contact.email &&
    customer.name &&
    customer.contact.email &&
    associationLabel !== null;

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-start justify-center px-4 py-12 md:py-20">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="animate-in mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-muted)]">
              HubSpot Entity Creator · v{APP_VERSION}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Create test entities
          </h1>
          <p className="text-[var(--text-muted)] mt-2 text-sm leading-relaxed">
            Creates a partner company + contact, a customer company + contact,
            and links them with an association label.
          </p>
        </div>

        {/* Name entry */}
        {!userName ? (
          <div className="animate-in animate-in-delay-1">
            <Section title="Who are you?">
              <p className="text-sm text-[var(--text-muted)] mb-4">
                Enter your name so we can keep track of who created what.
              </p>
              <Input
                label="Your name"
                value={nameInput}
                onChange={setNameInput}
                placeholder="e.g. Casey"
              />
              <button
                onClick={handleIdentify}
                disabled={!nameInput.trim()}
                className="mt-4 w-full py-2.5 rounded-lg font-medium text-sm transition-all
                  bg-[var(--accent)] text-white hover:brightness-110
                  disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </Section>
          </div>
        ) : (
          <>
            {/* User indicator */}
            <div className="animate-in flex items-center justify-between mb-6 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  Logged in as {userName}
                  {portalId ? ` · Portal ${portalId}` : ""}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                Switch user
              </button>
            </div>

            {/* Partner */}
            <div className="animate-in animate-in-delay-1">
              <Section title="Partner" badge="companytype = partner">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Company name"
                    value={partner.name}
                    onChange={(v) => updatePartner({ name: v })}
                    placeholder="Acme Corp"
                  />
                  <Input
                    label="Domain"
                    value={partner.domain}
                    onChange={(v) => updatePartner({ domain: v })}
                    placeholder="acme.com"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <Input
                    label="First name"
                    value={partner.contact.firstname}
                    onChange={(v) => updatePartnerContact({ firstname: v })}
                  />
                  <Input
                    label="Last name"
                    value={partner.contact.lastname}
                    onChange={(v) => updatePartnerContact({ lastname: v })}
                  />
                  <Input
                    label="Email"
                    value={partner.contact.email}
                    onChange={(v) => updatePartnerContact({ email: v })}
                    type="email"
                  />
                </div>
              </Section>
            </div>

            {/* Customer */}
            <div className="animate-in animate-in-delay-2">
              <Section title="Customer" badge="companytype = customer">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Company name"
                    value={customer.name}
                    onChange={(v) => updateCustomer({ name: v })}
                    placeholder="Widget Inc"
                  />
                  <Input
                    label="Domain"
                    value={customer.domain}
                    onChange={(v) => updateCustomer({ domain: v })}
                    placeholder="widget.io"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <Input
                    label="First name"
                    value={customer.contact.firstname}
                    onChange={(v) => updateCustomerContact({ firstname: v })}
                  />
                  <Input
                    label="Last name"
                    value={customer.contact.lastname}
                    onChange={(v) => updateCustomerContact({ lastname: v })}
                  />
                  <Input
                    label="Email"
                    value={customer.contact.email}
                    onChange={(v) => updateCustomerContact({ email: v })}
                    type="email"
                  />
                </div>
              </Section>
            </div>

            {/* Association label */}
            <div className="animate-in animate-in-delay-3">
              <Section title="Association">
                {labelsLoading ? (
                  <p className="text-sm text-[var(--text-muted)]">
                    Loading association labels from HubSpot...
                  </p>
                ) : labels.length > 0 ? (
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                      Partner &rarr; Customer label
                    </label>
                    <select
                      value={associationLabel ?? ""}
                      onChange={(e) =>
                        setAssociationLabel(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-lg text-sm
                        bg-[var(--surface-raised)] border border-[var(--border)]
                        text-[var(--text)] transition-colors"
                    >
                      {labels.map((l) => (
                        <option key={l.typeId} value={l.typeId}>
                          {l.label || `Unlabeled (${l.typeId})`} ·{" "}
                          {l.category}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <Input
                    label="Association Type ID (manual)"
                    value={String(associationLabel ?? "")}
                    onChange={(v) =>
                      setAssociationLabel(v ? Number(v) : null)
                    }
                    placeholder="e.g. 13"
                    mono
                  />
                )}
              </Section>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!isValid || loading}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-all
                bg-[var(--accent)] text-white hover:brightness-110
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? "Creating entities..." : "Create all entities"}
            </button>

            {/* Error */}
            {error && (
              <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-[var(--error)] font-mono">{error}</p>
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="mt-6 animate-in">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                  <span className="text-xs font-mono uppercase tracking-widest text-[var(--success)]">
                    Created successfully
                  </span>
                </div>
                <div className="space-y-2">
                  {results.map((r, i) => (
                    <a
                      key={i}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg
                        bg-[var(--surface)] border border-[var(--border)]
                        hover:border-[var(--accent)] transition-colors group"
                    >
                      <div>
                        <span className="text-xs font-mono text-[var(--text-muted)] uppercase">
                          {r.type}
                        </span>
                        <p className="text-sm font-medium">{r.name}</p>
                      </div>
                      <span className="text-xs font-mono text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                        {r.id} &rarr;
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/* Reusable components */

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {badge && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-raised)] text-[var(--text-muted)] border border-[var(--border)]">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg text-sm
          bg-[var(--surface-raised)] border border-[var(--border)]
          text-[var(--text)] placeholder:text-[var(--text-muted)]/40
          transition-colors ${mono ? "font-mono text-xs" : ""}`}
      />
    </div>
  );
}
