export type StaffProfile = {
  first_name: string;
  last_name: string;
  phone: string;
  job_title: string;
};

export function readStaffProfile(form: FormData): { profile: StaffProfile; error?: string } {
  const read = (key: string) => String(form.get(key) ?? "").trim();
  const profile = { first_name: read("first_name"), last_name: read("last_name"), phone: read("phone"), job_title: read("job_title") };
  if (!profile.first_name || !profile.last_name) return { profile, error: "First name and last name are required." };
  if (profile.first_name.length > 100 || profile.last_name.length > 100) return { profile, error: "Names must be 100 characters or fewer." };
  if (profile.job_title.length > 100) return { profile, error: "Job title must be 100 characters or fewer." };
  if (profile.phone && (!/^[\d\s()+.\-x#]{7,40}$/i.test(profile.phone) || profile.phone.replace(/\D/g, "").length < 7 || profile.phone.replace(/\D/g, "").length > 20)) {
    return { profile, error: "Enter a valid phone number, or leave it blank." };
  }
  return { profile };
}

export function staffProfileFromMetadata(metadata: Record<string, unknown>): StaffProfile {
  const text = (key: string) => typeof metadata[key] === "string" ? metadata[key] as string : "";
  return { first_name: text("first_name"), last_name: text("last_name"), phone: text("phone"), job_title: text("job_title") };
}
