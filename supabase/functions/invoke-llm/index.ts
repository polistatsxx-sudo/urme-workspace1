import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const MICHAEL_USER_ID = "24332e6e-fc06-46c4-a491-dc32e1efc58e"
const REQUEST_TIMEOUT_MS = 30000
const MAX_PROMPT_LENGTH = 50000

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const body = await req.json()
    const { prompt, response_json_schema, model, temperature } = body

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "prompt is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const authHeader = req.headers.get("Authorization") ?? ""
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || ""

    const useGrok = userId === MICHAEL_USER_ID
    const apiKey = useGrok ? Deno.env.get("XAI_API_KEY") : Deno.env.get("ANTHROPIC_API_KEY")
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: useGrok ? "XAI_API_KEY not configured" : "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const systemPrompt = response_json_schema
      ? "You are an AI assistant for URME, a B2B networking and matchmaking CRM. Always respond with valid JSON matching the provided schema exactly. Do not include markdown formatting, code blocks, or explanations — output raw JSON only."
      : "You are an AI assistant for URME, a B2B networking and matchmaking CRM. Be concise, professional, and actionable in your responses."
    const userMessage = response_json_schema
      ? `${prompt}\n\nRespond with JSON matching this schema:\n${JSON.stringify(response_json_schema)}`
      : prompt

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    let response
    try {
      if (useGrok) {
        response = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model || "grok-3-mini-fast",
            messages: [ { role: "system", content: systemPrompt }, { role: "user", content: userMessage } ],
            temperature: typeof temperature === "number" ? temperature : 0.7,
            ...(response_json_schema ? { response_format: { type: "json_object" } } : {}),
          }),
          signal: controller.signal,
        })
      } else {
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model || "claude-sonnet-4-20250514",
            max_tokens: 4096,
            temperature: typeof temperature === "number" ? temperature : 0.7,
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
          }),
          signal: controller.signal,
        })
      }
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
      console.error(`${useGrok ? "Grok" : "Anthropic"} error:`, errorText)
      let userMsg = "AI request failed"
      if (response.status === 401) userMsg = "API key is invalid or expired"
      else if (response.status === 429) userMsg = "AI rate limit reached. Please wait and try again."
      else if (response.status === 529) userMsg = "AI service temporarily overloaded. Try again shortly."
      return new Response(
        JSON.stringify({ error: userMsg, status: response.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const data = await response.json()
    const content = useGrok ? data.choices[0].message.content : data.content[0].text

    const usage = data.usage || {}
    console.log(JSON.stringify({
      event: "llm_call",
      provider: useGrok ? "grok" : "anthropic",
      user_id: userId,
      input_tokens: usage.input_tokens || usage.prompt_tokens || 0,
      output_tokens: usage.output_tokens || usage.completion_tokens || 0,
      elapsed_ms: Date.now() - startTime,
    }))

    let result
    if (response_json_schema) {
      try {
        result = JSON.parse(content)
      } catch {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/)
        if (jsonMatch) { try { result = JSON.parse(jsonMatch[1] || jsonMatch[0]) } catch { result = content } }
        else { result = content }
      }
    } else {
      result = content
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  } catch (error) {
    console.error("Edge function error:", error.message, `(${Date.now() - startTime}ms)`)
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
