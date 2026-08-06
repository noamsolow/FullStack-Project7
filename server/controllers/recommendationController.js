import { recommend } from "../services/recommendationService.js";
import { chat } from "../services/shoppingAssistantService.js";

export async function recommendHandler(request, response) {
  response.json({ data: await recommend(request.user, request.body) });
}

export async function recommendationChatHandler(request, response) {
  response.json({ data: await chat(request.user, request.body) });
}
