import { BACKEND_URL } from "./config";

const OWNER_STORAGE = "26tech_owner_session";

export function getOwnerSession() {
  try {
    const session = JSON.parse(localStorage.getItem(OWNER_STORAGE) || "null");
    return session?.token ? session : null;
  } catch {
    return null;
  }
}

export async function walletRequest(path, { method = "GET", body, token } = {}) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Unable to reach your credits wallet.");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const getWallet = (token) => walletRequest("/wallet", { token });
export const getPackages = (token) => walletRequest("/wallet/packages", { token });
export const getPaymentProviders = (token) => walletRequest("/wallet/payment-providers", { token });
export const getTransactions = (token, params) => walletRequest(`/wallet/transactions?${new URLSearchParams(params)}`, { token });
export const createPurchase = (token, packageId, provider) => walletRequest("/wallet/purchase", { method: "POST", token, body: { packageId, provider } });
export const getPaymentSession = (token, paymentReference) => walletRequest(`/wallet/payments/${encodeURIComponent(paymentReference)}`, { token });
export const deleteTransaction = (token, transactionId) => walletRequest(`/wallet/transactions/${encodeURIComponent(transactionId)}`, { method: "DELETE", token });
export const clearTransactions = (token) => walletRequest("/wallet/transactions", { method: "DELETE", token });
