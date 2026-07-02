// supabase/functions/invoke-llm/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { prompt, response_json_schema } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Build messages
    const messages = [
      {
        role: "system",
        content: response_json_schema
          ? "You are a helpful assistant. Always respond with valid JSON matching the provided schema. Do not include markdown formatting or code blocks — output raw JSON only."
          : "You are a helpful assistant."
      },
      {
        role: "user",
        content: response_json_schema
          ? `${prompt}\n\nRespond with JSON matching this schema:\n${JSON.stringify(response_json_schema)}`
          : prompt
      }
    ]

    // Call OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        ...(response_json_schema ? { response_format: { type: "json_object" } } : {}),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenAI error:", errorText)
      return new Response(
        JSON.stringify({ error: "LLM request failed", details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    // If schema provided, parse as JSON; otherwise return raw text
    let result
    if (response_json_schema) {
      try {
        result = JSON.parse(content)
      } catch {
        // If JSON parsing fails, return the raw content
        result = content
      }
    } else {
      result = content
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Edge function error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})