"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@warren/supabase/server";

export type ContactActionState = {
  ok: boolean;
  message: string;
};

const initialError = {
  ok: false,
  message: "Something went wrong. Please call the shop at (870) 423-2037.",
};

function readRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export async function submitContact(
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const trap = readRequiredString(formData, "company");

  if (trap) {
    return {
      ok: true,
      message: "Thanks. We will be in touch.",
    };
  }

  const name = readRequiredString(formData, "name");
  const email = readRequiredString(formData, "email");
  const phone = readRequiredString(formData, "phone");
  const service = readRequiredString(formData, "service") || "General inquiry";
  const message = readRequiredString(formData, "message");

  if (!name || !email || !message) {
    return {
      ok: false,
      message: "Name, email, and message are required.",
    };
  }

  if (!email.includes("@")) {
    return {
      ok: false,
      message: "Please enter a valid email address.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("contacts").insert({
      email,
      message,
      name,
      phone: phone || null,
      service,
      source: "marketing",
      status: "new",
    });

    if (error) {
      return {
        ok: false,
        message: error.message,
      };
    }

    revalidatePath("/");

    return {
      ok: true,
      message: "Thanks. Your request has been saved.",
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Missing NEXT_PUBLIC")) {
      return {
        ok: false,
        message:
          "Contact storage is not configured yet. Add the Warren Supabase env vars, then try again.",
      };
    }

    return initialError;
  }
}
