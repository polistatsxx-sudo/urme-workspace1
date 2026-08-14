import { supabase } from "@/lib/supabaseClient";

/**
 * @param {{ prompt: string, response_json_schema?: any, model?: string, temperature?: number }} params
 */
export async function invokeLLM({ prompt, response_json_schema, model, temperature }) {
  const { data, error } = await supabase.functions.invoke("invoke-llm", {
    body: { prompt, response_json_schema, model, temperature },
  });

  if (error) {
    console.error("invokeLLM error:", error);
    throw new Error(error.message || "AI request failed");
  }

  return data;
}
