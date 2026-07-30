import { chat, recommend } from "../services/recommendationService.js";

export async function recommendHandler(request, response) {
  response.json({ data: await recommend(request.user, request.body) });
}

export async function recommendationChatHandler(request, response) {
  response.json({ data: await chat(request.user, request.body) });
}
