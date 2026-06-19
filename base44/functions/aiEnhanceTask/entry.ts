import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description } = await req.json();

  const response = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a productivity coach. Improve the following task to be more specific, actionable, and professional.
    
Current Title: ${title || '(empty)'}
Current Description: ${description || '(empty)'}

Return a JSON object with:
- improvedTitle: a concise, action-oriented task title (start with a verb)
- improvedDescription: a clear description with 2-3 bullet points of key steps or context`,
    response_json_schema: {
      type: "object",
      properties: {
        improvedTitle: { type: "string" },
        improvedDescription: { type: "string" }
      },
      required: ["improvedTitle", "improvedDescription"]
    }
  });

  return Response.json(response);
});