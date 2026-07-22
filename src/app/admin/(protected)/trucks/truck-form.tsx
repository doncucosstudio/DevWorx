"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Truck } from "@/generated/prisma/client";

type SocialLink = { label: string; url: string };

export type TruckFormValues = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logoEmoji: string;
  logoUrl: string;
  coverUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  cornerStyle: string;
  isOpen: boolean;
  location: string;
  hoursText: string;
  estimatedWaitMinutes: number;
  taxRatePercent: number;
  currencySymbol: string;
  orderPrefix: string;
  contactPhone: string;
  contactEmail: string;
  socialLinks: SocialLink[];
};

function truckToFormValues(truck: Truck): TruckFormValues {
  let socialLinks: SocialLink[] = [];
  try {
    socialLinks = JSON.parse(truck.socialLinks);
  } catch {
    socialLinks = [];
  }
  return {
    slug: truck.slug,
    name: truck.name,
    tagline: truck.tagline,
    description: truck.description,
    logoEmoji: truck.logoEmoji,
    logoUrl: truck.logoUrl ?? "",
    coverUrl: truck.coverUrl ?? "",
    primaryColor: truck.primaryColor,
    secondaryColor: truck.secondaryColor,
    accentColor: truck.accentColor,
    fontFamily: truck.fontFamily,
    cornerStyle: truck.cornerStyle,
    isOpen: truck.isOpen,
    location: truck.location,
    hoursText: truck.hoursText,
    estimatedWaitMinutes: truck.estimatedWaitMinutes,
    taxRatePercent: truck.taxRatePercent,
    currencySymbol: truck.currencySymbol,
    orderPrefix: truck.orderPrefix,
    contactPhone: truck.contactPhone,
    contactEmail: truck.contactEmail,
    socialLinks,
  };
}

const DEFAULTS: TruckFormValues = {
  slug: "",
  name: "",
  tagline: "",
  description: "",
  logoEmoji: "🚚",
  logoUrl: "",
  coverUrl: "",
  primaryColor: "#ea580c",
  secondaryColor: "#1c1917",
  accentColor: "#facc15",
  fontFamily: "system",
  cornerStyle: "rounded",
  isOpen: true,
  location: "",
  hoursText: "",
  estimatedWaitMinutes: 15,
  taxRatePercent: 0,
  currencySymbol: "$",
  orderPrefix: "FT",
  contactPhone: "",
  contactEmail: "",
  socialLinks: [],
};

export default function TruckForm({ truck }: { truck?: Truck }) {
  const router = useRouter();
  const [values, setValues] = useState<TruckFormValues>(truck ? truckToFormValues(truck) : DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof TruckFormValues>(key: K, value: TruckFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function addSocialLink() {
    set("socialLinks", [...values.socialLinks, { label: "", url: "" }]);
  }

  function updateSocialLink(index: number, field: keyof SocialLink, value: string) {
    const next = [...values.socialLinks];
    next[index] = { ...next[index], [field]: value };
    set("socialLinks", next);
  }

  function removeSocialLink(index: number) {
    set(
      "socialLinks",
      values.socialLinks.filter((_, i) => i !== index)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const url = truck ? `/api/trucks/${truck.id}` : "/api/trucks";
      const method = truck ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Please check the form for errors and try again."
        );
        setSubmitting(false);
        return;
      }
      const id = truck ? truck.id : data.truck.id;
      router.push(`/admin/trucks/${id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400";
  const labelClass = "text-sm font-medium text-stone-900";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="font-semibold text-stone-900">Basics</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Truck name</label>
            <input
              required
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>URL slug</label>
            <input
              required
              value={values.slug}
              onChange={(e) => set("slug", e.target.value.toLowerCase())}
              pattern="[a-z0-9-]+"
              title="lowercase letters, numbers, and hyphens only"
              className={inputClass}
              placeholder="taco-time"
            />
            <p className="mt-1 text-xs text-stone-400">yoursite.com/trucks/{values.slug || "your-slug"}</p>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Tagline</label>
            <input
              value={values.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              className={inputClass}
              placeholder="Tacos made fresh, fast"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Logo emoji</label>
            <input
              value={values.logoEmoji}
              onChange={(e) => set("logoEmoji", e.target.value)}
              className={inputClass}
              maxLength={10}
            />
          </div>
          <div>
            <label className={labelClass}>Logo image URL (optional)</label>
            <input
              value={values.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="font-semibold text-stone-900">Branding &amp; theme</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelClass}>Primary color</label>
            <input
              type="color"
              value={values.primaryColor}
              onChange={(e) => set("primaryColor", e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-stone-200"
            />
          </div>
          <div>
            <label className={labelClass}>Secondary color</label>
            <input
              type="color"
              value={values.secondaryColor}
              onChange={(e) => set("secondaryColor", e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-stone-200"
            />
          </div>
          <div>
            <label className={labelClass}>Accent color</label>
            <input
              type="color"
              value={values.accentColor}
              onChange={(e) => set("accentColor", e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-stone-200"
            />
          </div>
          <div>
            <label className={labelClass}>Corner style</label>
            <select
              value={values.cornerStyle}
              onChange={(e) => set("cornerStyle", e.target.value)}
              className={inputClass}
            >
              <option value="sharp">Sharp</option>
              <option value="rounded">Rounded</option>
              <option value="pill">Pill</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <label className={labelClass}>Font style</label>
            <select
              value={values.fontFamily}
              onChange={(e) => set("fontFamily", e.target.value)}
              className={inputClass}
            >
              <option value="system">System sans-serif</option>
              <option value="serif">Serif</option>
              <option value="mono">Monospace</option>
              <option value="rounded">Friendly / rounded</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="font-semibold text-stone-900">Operations</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={values.isOpen}
              onChange={(e) => set("isOpen", e.target.checked)}
            />
            <span className={labelClass}>Currently accepting orders</span>
          </label>
          <div>
            <label className={labelClass}>Location</label>
            <input
              value={values.location}
              onChange={(e) => set("location", e.target.value)}
              className={inputClass}
              placeholder="Corner of 5th & Main"
            />
          </div>
          <div>
            <label className={labelClass}>Hours</label>
            <input
              value={values.hoursText}
              onChange={(e) => set("hoursText", e.target.value)}
              className={inputClass}
              placeholder="Mon-Fri 11am-8pm"
            />
          </div>
          <div>
            <label className={labelClass}>Estimated wait (minutes)</label>
            <input
              type="number"
              min={0}
              max={240}
              value={values.estimatedWaitMinutes}
              onChange={(e) => set("estimatedWaitMinutes", Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Tax rate (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={values.taxRatePercent}
              onChange={(e) => set("taxRatePercent", Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Currency symbol</label>
            <input
              value={values.currencySymbol}
              onChange={(e) => set("currencySymbol", e.target.value)}
              className={inputClass}
              maxLength={5}
            />
          </div>
          <div>
            <label className={labelClass}>Order number prefix</label>
            <input
              value={values.orderPrefix}
              onChange={(e) => set("orderPrefix", e.target.value.toUpperCase())}
              className={inputClass}
              maxLength={10}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="font-semibold text-stone-900">Contact &amp; social</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Contact phone</label>
            <input
              value={values.contactPhone}
              onChange={(e) => set("contactPhone", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Contact email</label>
            <input
              value={values.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className={labelClass}>Social links</label>
          {values.socialLinks.map((link, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={link.label}
                onChange={(e) => updateSocialLink(i, "label", e.target.value)}
                placeholder="Instagram"
                className={inputClass}
              />
              <input
                value={link.url}
                onChange={(e) => updateSocialLink(i, "url", e.target.value)}
                placeholder="https://instagram.com/..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeSocialLink(i)}
                className="shrink-0 rounded-lg border border-red-200 px-3 text-sm text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSocialLink}
            className="rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            + Add link
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-orange-600 px-6 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
      >
        {submitting ? "Saving…" : truck ? "Save changes" : "Create truck"}
      </button>
    </form>
  );
}
