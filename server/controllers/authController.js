import {
  currentUser,
  deleteProfile,
  login,
  registerCustomer,
  registerPartner,
  updateProfile,
} from "../services/authService.js";

function context(request) {
  return { requestId: request.id, ip: request.ip };
}

export async function registerCustomerHandler(request, response) {
  const result = await registerCustomer(request.body, context(request));
  response.status(201).json({ data: result });
}

export async function registerPartnerHandler(request, response) {
  const result = await registerPartner(request.body, context(request));
  response.status(201).json({ data: result });
}

function loginHandler(role) {
  return async function handleLogin(request, response) {
    const result = await login(request.body, role, context(request));
    response.json({ data: result });
  };
}

export const customerLoginHandler = loginHandler("customer");
export const partnerLoginHandler = loginHandler("vendor_manager");
export const adminLoginHandler = loginHandler("admin");

export async function meHandler(request, response) {
  response.json({ data: await currentUser(request.user) });
}

export async function updateMeHandler(request, response) {
  response.json({ data: await updateProfile(request.user, request.body) });
}

export async function deleteMeHandler(request, response) {
  await deleteProfile(request.user, context(request));
  response.status(204).end();
}

