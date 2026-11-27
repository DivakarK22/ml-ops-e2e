import { NextResponse } from "next/server";
import { fetchOpenRouterModels, getOpenRouterKey } from "@/lib/openrouter";

export const runtime = "nodejs";

export async function GET() {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not set on the server." },
      { status: 500 }
    );
  }
  try {
    const models = await fetchOpenRouterModels(apiKey);
    const sorted = models
      .filter((m) => m.id)
      .map((m) => ({
        id: m.id,
        name: m.name || m.id,
        description: m.description,
        context_length: m.context_length,
        pricing: m.pricing,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ models: sorted });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load models";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}