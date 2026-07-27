import { recommend } from "../services/recommendationService.js";

export async function recommendHandler(request, response) {
  response.json({ data: await recommend(request.user, request.body) });
}

