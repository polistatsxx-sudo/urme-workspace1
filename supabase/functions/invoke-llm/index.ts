import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// --- Improvement 1: Configurable model & timeout ---
const DEFAULT_MODEL = "claude-sonnet-4-20250514"
const REQUEST_TIMEOUT_MS = 30000 // 30 seconds
const MAX_PROMPT_LENGTH = 50000 // ~12k tokens worth of text

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const body = await req.json()
    const { prompt, response_json_schema, model, temperature } = body

    // --- Improvement 2: Input validation & sanitization ---
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "prompt must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // --- Improvement 3: Smarter system prompt for CRM context ---
    const systemPrompt = response_json_schema
      ? "You are an AI assistant for URME, a B2B networking and matchmaking CRM. Always respond with valid JSON matching the provided schema exactly. Do not include markdown formatting, code blocks, or explanations — output raw JSON only."
      : "You are an AI assistant for URME, a B2B networking and matchmaking CRM. Be concise, professional, and actionable in your responses."

    const userMessage = response_json_schema
      ? `${prompt}\n\nRespond with JSON matching this schema:\n${JSON.stringify(response_json_schema)}`
      : prompt

    // --- Improvement 4: Request timeout with AbortController ---
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    let response
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model || DEFAULT_MODEL,
          max_tokens: 4096,
          temperature: typeof temperature === "number" ? temperature : 0.7,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        }),
        signal: controller.signal,
      })
    } catch (fetchError) {
      if (fetchError.name === "AbortError") {
        return new Response(
          JSON.stringify({ error: "Request timed out. Try a shorter prompt or try again." }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
      throw fetchError
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Anthropic error:", errorText)

      // --- Improvement 5: User-friendly error messages ---
      let userMessage = "AI request failed"
      if (response.status === 401) userMessage = "API key is invalid or expired"
      else if (response.status === 429) userMessage = "AI rate limit reached. Please wait a moment and try again."
      else if (response.status === 529) userMessage = "AI service is temporarily overloaded. Try again in a few seconds."

      return new Response(
        JSON.stringify({ error: userMessage, status: response.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const data = await response.json()
    const content = data.content[0].text

    // --- Improvement 6: Token usage logging for cost tracking ---
    const usage = data.usage || {}
    const elapsed = Date.now() - startTime
    console.log(JSON.stringify({
      event: "llm_call",
      model: model || DEFAULT_MODEL,
      input_tokens: usage.input_tokens || 0,
      output_tokens: usage.output_tokens || 0,
      elapsed_ms: elapsed,
      has_schema: !!response_json_schema,
      prompt_length: prompt.length,
    }))

    // Parse JSON if schema was provided
    let result
    if (response_json_schema) {
      try {
        result = JSON.parse(content)
      } catch {
        // --- Improvement 7: Retry JSON extraction if first parse fails ---
        // Sometimes the model wraps JSON in markdown code blocks despite instructions
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[1] || jsonMatch[0])
          } catch {
            result = content
          }
        } else {
          result = content
        }
      }
    } else {
      result = content
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          // --- Expose usage info to frontend (optional, for admin dashboard) ---
          "X-Token-Usage": JSON.stringify(usage),
          "X-Response-Time": String(elapsed),
        }
      }
    )

  } catch (error) {
    const elapsed = Date.now() - startTime
    console.error("Edge function error:", error.message, `(${elapsed}ms)`)
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})