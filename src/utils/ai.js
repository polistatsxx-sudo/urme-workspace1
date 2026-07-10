import { supabase } from "@/lib/supabaseClient";

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
