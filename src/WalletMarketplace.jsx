import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, CircleAlert, Coins, CreditCard, Loader2, Lock, ReceiptText, RefreshCw, Search, ShieldCheck, ShoppingBag, Sparkles, TrendingUp, Trash2, WalletCards, X } from "lucide-react";
import { EmptyState, Skeleton } from "./UIStates";
import { clearTransactions, createPurchase, deleteTransaction, getFeatureEntitlements, getPackages, getPaymentSession, getTransactions, getWallet, reconcilePaymentSessions } from "./walletApi";
import { useAuth } from "./auth";
import { toast } from "./Toast";

const PAGE_SIZE = 10;
const TANZANIAN_MOBILE = /^(?:0[67]\d{8}|\+255[67]\d{8})$/;

function normalizeMobileNumber(value) {
  const compact = String(value || "").replace(/[\s()-]/g, "");
  if (/^0[67]\d{8}$/.test(compact)) return `+255${compact.slice(1)}`;
  return compact;
}

function phoneNumberError(value) {
  const normalized = normalizeMobileNumber(value);
  if (!normalized) return "Please enter your mobile money number before continuing.";
  if (!TANZANIAN_MOBILE.test(normalized)) return "Enter a valid Tanzanian mobile number, for example 07XXXXXXXX or +255XXXXXXXXX.";
  return "";
}

function animateNumber(value, formatter = (number) => number.toLocaleString()) {
  return formatter(Number(value || 0));
}

function formatMoney(value, currency) {
  if (value == null) return "Pricing coming soon";
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(value); }
  catch { return `${currency || "USD"} ${Number(value).toFixed(2)}`; }
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
}

function MetricCard({ icon: Icon, label, value, loading, accent }) {
  return <article className={`wallet-metric ${accent || ""}`}>
    <span className="wallet-metric-icon"><Icon size={18} /></span>
    <span className="wallet-metric-label">{label}</span>
    {loading ? <Skeleton className="wallet-number-skeleton" /> : <strong className="wallet-number">{animateNumber(value)}</strong>}
  </article>;
}

function PackageSkeleton() {
  return <article className="wallet-package wallet-package-skeleton"><Skeleton className="wallet-skeleton-chip" /><Skeleton className="wallet-skeleton-title" /><Skeleton className="wallet-skeleton-number" /><Skeleton className="wallet-skeleton-button" /></article>;
}

function StatusBadge({ status }) {
  return <span className={`wallet-status ${status || "pending"}`}>{status || "pending"}</span>;
}

function SubscriptionCard({ subscription, loading, error, onRetry, onUpgrade }) {
  if (loading) return <section className="wallet-subscription wallet-subscription-skeleton"><Skeleton className="wallet-skeleton-chip" /><Skeleton className="wallet-skeleton-title" /><Skeleton className="wallet-skeleton-button" /></section>;
  if (error) return <section className="wallet-subscription"><p className="wallet-eyebrow">Account access</p><strong>Subscription unavailable</strong><button type="button" className="wallet-secondary-button" onClick={onRetry}>Retry</button></section>;
  if (!subscription) return <section className="wallet-subscription"><p className="wallet-eyebrow">Account access</p><strong>No subscription found</strong><span>Account access details will appear here when available.</span></section>;
  const plan = String(subscription.plan || "").replace(/_/g, " ");
  const status = subscription.status || "";
  const copy = status === "TRIAL" ? "Your free trial is active" : status === "ACTIVE" ? "Your plan is active" : status === "SUSPENDED" ? "Account access is temporarily suspended." : "Your plan has expired. Upgrade to continue.";
  const expiry = subscription.expiry ? formatDate(subscription.expiry) : "—";
  const remaining = status === "TRIAL" ? `Trial ends in ${subscription.remainingDays} days` : status === "ACTIVE" ? (subscription.remainingDays > 0 ? `${subscription.remainingDays} days remaining` : `Expires on ${expiry}`) : `Expired on ${expiry}`;
  const scheduledPlan = subscription.scheduledPlan ? String(subscription.scheduledPlan).replace(/_/g, " ") : "";
  return <section className={`wallet-subscription ${status.toLowerCase()}`}><div><p className="wallet-eyebrow">Current subscription</p><strong className="wallet-subscription-plan">{plan}</strong><p>{copy}</p>{status === "TRIAL" && scheduledPlan && <p>Upcoming plan: <strong>{scheduledPlan}</strong> — starts after your trial.</p>}</div><div className="wallet-subscription-side"><span className="wallet-subscription-status">{status}</span><small>{remaining}</small><button type="button" className="wallet-primary-button" onClick={onUpgrade}>{status === "ACTIVE" ? "Manage Plan" : "Upgrade Plan"}</button></div></section>;
}

function FeatureEntitlements({ features, loading }) {
  if (loading) return null;
  return <section className="wallet-section wallet-entitlements"><div className="wallet-section-head"><div><p className="wallet-eyebrow">Package access</p><h2>Your available features</h2></div></div><div className="wallet-feature-list">{features.map((feature) => <span key={feature.name} className={feature.available ? "is-available" : "is-locked"}>{feature.available ? <Check size={14} /> : <Lock size={13} />}{feature.name.replace(/_/g, " ")}</span>)}</div></section>;
}

function paymentChannelLabel(channel) {
  return ({ MPESA: "M-PESA", AIRTEL_MONEY: "Airtel Money", HALOPESA: "HaloPesa", MIX_BY_YAS: "Mix by Yas (Tigo Pesa)" })[channel] || channel;
}

// Short label + brand-ish color per known provider id — used as a fallback
// badge when a real logo file isn't available yet. `logo` points at a file
// you place in /public/providers/ (get the actual files from each
// provider's own official brand-asset page — see chat notes). If the file
// is missing, the <img> fails to load and we silently fall back to the
// colored letter badge, so nothing breaks in the meantime.
const PROVIDER_META = {
  MPESA: { short: "M", color: "#3AA13F", logo: "/mpesa.png" },
  AIRTEL_MONEY: { short: "A", color: "#E4002B", logo: "/airtel-money.png" },
  HALOPESA: { short: "H", color: "#F7941D", logo: "/halopesa.png" },
  MIX_BY_YAS: { short: "Y", color: "#1B70E8", logo: null },
};
function providerMeta(id) {
  return PROVIDER_META[id] || { short: (id || "?").charAt(0).toUpperCase(), color: "var(--token-info)", logo: null };
}

function ProviderPicker({ providers, provider, onChange, disabled }) {
  return <div className="wallet-provider-field">
    <span>Payment provider</span>
    <div className="wallet-provider-grid" role="radiogroup" aria-label="Payment provider">
      {providers.map((item) => {
        const meta = providerMeta(item.id);
        const isSelected = provider === item.id;
        return <ProviderCard key={item.id} item={item} meta={meta} isSelected={isSelected} onChange={onChange} disabled={disabled} />;
      })}
    </div>
  </div>;
}

function ProviderCard({ item, meta, isSelected, onChange, disabled }) {
  const [failed, setFailed] = useState(false);
  const hasLogo = Boolean(meta.logo) && !failed;
  return <button
    type="button"
    role="radio"
    aria-checked={isSelected}
    className={`wallet-provider-option ${hasLogo ? "has-logo" : ""} ${isSelected ? "is-selected" : ""} ${item.configured ? "" : "is-unconfigured"}`}
    onClick={() => onChange(item.id)}
    disabled={disabled}
  >
    {hasLogo
      ? <img className="wallet-provider-logo-fill" src={meta.logo} alt={item.name} onError={() => setFailed(true)} />
      : <span className="wallet-provider-icon" style={{ background: meta.color }}>{meta.short}</span>}
    <span className={hasLogo ? "sr-only" : "wallet-provider-name"}>{item.name}</span>
    {!item.configured && <span className="wallet-provider-flag">Not configured</span>}
    {isSelected && <span className="wallet-provider-check"><Check size={13} /></span>}
  </button>;
}

function PurchaseModal({ selected, phoneNumber, phoneError, onPhoneChange, onPhoneBlur, onClose, onConfirm, pending }) {
  if (!selected) return null;
  return <div className="wallet-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="wallet-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-title">
      <button className="wallet-modal-close" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
      <span className="wallet-modal-icon"><CreditCard size={23} /></span>
      <p className="wallet-eyebrow">Confirm your selection</p>
      <h2 id="purchase-title">Get {animateNumber(selected.credits)} credits?</h2>
      <p>You’re creating a secure pending purchase for the <strong>{selected.name}</strong> package.</p>
      <div className="wallet-confirm-line"><span>Due when payment opens</span><strong>{formatMoney(selected.amount, selected.currency)}</strong></div>
      <label className="wallet-phone-field"><span>Mobile Money Number</span><input type="tel" inputMode="tel" autoComplete="tel" placeholder="07XXXXXXXX" value={phoneNumber} onChange={(event) => onPhoneChange(event.target.value)} onBlur={onPhoneBlur} aria-invalid={Boolean(phoneError)} aria-describedby={phoneError ? "mobile-number-error" : undefined} disabled={pending} /></label>
      {phoneError && <p id="mobile-number-error" className="wallet-phone-error" role="alert">{phoneError}</p>}
      <p className="wallet-modal-note"><ShieldCheck size={15} /> Your mobile network is verified automatically before sending the payment prompt.</p>
      <div className="wallet-modal-actions"><button type="button" className="wallet-secondary-button" onClick={onClose} disabled={pending}>Not now</button><button type="button" className="wallet-primary-button" onClick={onConfirm} disabled={pending || Boolean(phoneNumberError(phoneNumber))}>{pending ? <><Loader2 size={16} className="spin-icon" /> Creating…</> : <>Continue to payment <Check size={16} /></>}</button></div>
    </section>
  </div>;
}

function PaymentNext({ purchase, onClose, onRetry }) {
  if (!purchase) return null;
  const transaction = purchase.transaction || purchase;
  const paymentSession = purchase.paymentSession || null;
  return <div className="wallet-modal-backdrop" role="presentation">
    <section className="wallet-modal wallet-success-modal" role="dialog" aria-modal="true" aria-labelledby="payment-next-title">
      <span className="wallet-success-orbit"><Sparkles size={24} /></span>
      <p className="wallet-eyebrow">{paymentSession?.status === "SUCCESS" ? "Payment verified" : "Secure mobile payment"}</p>
      <h2 id="payment-next-title">{paymentSession?.status === "SUCCESS" ? "Credits added" : paymentSession?.status === "FAILED" ? "Payment failed" : "Complete your payment"}</h2>
      <p>{paymentSession?.status === "SUCCESS" ? `Your ${animateNumber(transaction.credits)} credits are now in your wallet.` : paymentSession?.status === "FAILED" ? "No credits were added. You can safely try again." : "Confirm the USSD payment prompt on your phone. We are checking your payment automatically."}</p>
      {paymentSession?.provider && paymentSession.provider !== "CLICKPESA" && <div className="wallet-detected-network"><span>Detected network</span><strong><i aria-hidden="true" /> {paymentSession.channel || paymentChannelLabel(paymentSession.provider)}</strong></div>}
      <div className="wallet-transaction-id"><span>{paymentSession ? "Payment reference" : "Transaction ID"}</span><code>{paymentSession?.paymentReference || transaction.transactionId}</code></div>
      <p className="wallet-modal-note"><ShieldCheck size={15} /> {purchase.payment?.message || "No payment has been taken. Payment provider confirmation is required."}</p>
      {["FAILED", "CANCELLED", "EXPIRED"].includes(paymentSession?.status) && <button type="button" className="wallet-primary-button wallet-full-button" onClick={onRetry}>Try again</button>}
      <button type="button" className="wallet-secondary-button wallet-full-button" onClick={onClose}>Back to marketplace</button>
    </section>
  </div>;
}

function DeleteHistoryModal({ target, onClose, onConfirm, pending }) {
  if (!target) return null;
  return <div className="wallet-modal-backdrop" role="presentation"><section className="wallet-modal wallet-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-history-title"><span className="wallet-modal-icon"><Trash2 size={22} /></span><h2 id="delete-history-title">Delete Transaction History?</h2><p>This will permanently remove your payment records from your history. Your active subscription and purchased plan will remain unchanged.</p><div className="wallet-modal-actions"><button type="button" className="wallet-secondary-button" onClick={onClose} disabled={pending}>Cancel</button><button type="button" className="wallet-danger-button" onClick={onConfirm} disabled={pending}>{pending ? <><Loader2 size={16} className="spin-icon" /> Deleting…</> : "Delete history"}</button></div></section></div>;
}

export default function WalletMarketplace({ onNavigate }) {
  const { session, logout, updateMembership } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [packages, setPackages] = useState([]);
  const [entitlements, setEntitlements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transactionLoading, setTransactionLoading] = useState(true);
  const [error, setError] = useState("");
  const [transactionError, setTransactionError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [purchasePending, setPurchasePending] = useState(false);
  const [purchase, setPurchase] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadSummary = useCallback(async () => {
    if (!session) return;
    setLoading(true); setError("");
    try {
      // Package prices and wallet state are critical marketplace data. The
      // feature list is informational, so a delayed deployment or temporary
      // failure of that optional endpoint must never blank the packages.
      const [walletData, packageData, pendingData] = await Promise.all([
        getWallet(session.token), getPackages(session.token), getTransactions(session.token, { page: "1", limit: "1", status: "pending" }),
      ]);
      setWallet(walletData); setPackages(packageData.packages || []); setPendingTotal(pendingData.pagination?.total || 0);
      try {
        const featureData = await getFeatureEntitlements(session.token);
        setEntitlements(featureData.features || []);
      } catch (featureError) {
        // Authorization remains backend-enforced; hide only this optional
        // display until it is available, while keeping the marketplace usable.
        setEntitlements([]);
        console.warn("Feature entitlement display unavailable:", featureError.message);
      }
      updateMembership(walletData.membership || { membershipTier: walletData.membershipTier || walletData.membership_tier }, walletData.subscription || null);
    } catch (err) { if (err.status === 401) logout(); setError(err.message); }
    finally { setLoading(false); }
  }, [logout, session, updateMembership]);

  const loadTransactions = useCallback(async () => {
    if (!session) return;
    setTransactionLoading(true); setTransactionError("");
    try {
      const data = await getTransactions(session.token, { page: String(page), limit: String(PAGE_SIZE), sortBy: "createdAt", sortOrder: "desc" });
      setTransactions(data.transactions || []); setPagination(data.pagination || null);
    } catch (err) { if (err.status === 401) logout(); setTransactionError(err.message); }
    finally { setTransactionLoading(false); }
  }, [logout, page, session]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadSummary(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSummary]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void loadTransactions(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTransactions]);

  // Reconcile once when this owner opens the marketplace. This recovers a
  // payment completed while the tab was closed without introducing polling or
  // repeated package/wallet refreshes across the page.
  useEffect(() => {
    if (!session?.token) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const data = await reconcilePaymentSessions(session.token);
        if (!cancelled && data.paymentSessions?.some((item) => ["SUCCESS", "FAILED", "CANCELLED", "EXPIRED"].includes(item.status))) {
          await Promise.all([loadSummary(), loadTransactions()]);
        }
      } catch (err) {
        if (err.status === 401) logout();
      }
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [loadSummary, loadTransactions, logout, session?.token]);

  // This is deliberately scoped to the one payment the owner has just
  // started. The backend queries ClickPesa and settles under a database lock;
  // the browser only asks for that authoritative result while it is pending.
  useEffect(() => {
    const paymentReference = purchase?.paymentSession?.paymentReference;
    const currentStatus = purchase?.paymentSession?.status;
    if (!paymentReference || !session?.token || !["CREATED", "PENDING", "PROCESSING"].includes(currentStatus)) return undefined;

    let cancelled = false;
    let timer;
    let attempts = 0;
    const poll = async () => {
      try {
        const data = await getPaymentSession(session.token, paymentReference);
        if (cancelled) return;
        const paymentSession = data.paymentSession;
        setPurchase((current) => current?.paymentSession?.paymentReference === paymentReference
          ? { ...current, paymentSession }
          : current);

        if (paymentSession.status === "SUCCESS") {
          await Promise.all([loadSummary(), loadTransactions()]);
          if (!cancelled) toast("Payment verified. Your credits have been added to your wallet.", "success");
          return;
        }
        if (["FAILED", "CANCELLED", "EXPIRED"].includes(paymentSession.status)) {
          await Promise.all([loadSummary(), loadTransactions()]);
          if (!cancelled) toast("Payment was not completed. No credits were added.", "error");
          return;
        }
      } catch (err) {
        if (err.status === 401) { logout(); return; }
        // A temporary status-check failure must not dismiss a payment that may
        // still settle through the provider webhook.
      }

      attempts += 1;
      const delay = attempts < 12 ? 5000 : 15000;
      timer = window.setTimeout(poll, delay);
    };

    timer = window.setTimeout(poll, 1500);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [loadSummary, loadTransactions, logout, purchase?.paymentSession?.paymentReference, purchase?.paymentSession?.status, session?.token]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return transactions;
    return transactions.filter((transaction) => [transaction.transactionId, transaction.packageId, transaction.status, transaction.type].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [search, transactions]);

  const startPurchase = async () => {
    if (!selected || !session) return;
    const validationError = phoneNumberError(phoneNumber);
    if (validationError) { setPhoneError(validationError); toast(validationError, "error"); return; }
    setPurchasePending(true);
    try {
      const data = await createPurchase(session.token, selected.id, normalizeMobileNumber(phoneNumber));
      setSelected(null); setPurchase(data); toast(data.payment?.configured === false ? data.payment.message : "Payment session created. Waiting for provider confirmation.", data.payment?.configured === false ? "info" : "success"); await Promise.all([loadSummary(), loadTransactions()]);
    } catch (err) {
      if (err.status === 409 && err.data?.transaction) { setSelected(null); setPurchase({ transaction: err.data.transaction }); toast("A pending purchase already exists for this package.", "info"); await Promise.all([loadSummary(), loadTransactions()]); }
      else { setError(err.message); toast(err.message || "Unable to initialize payment.", "error"); }
    } finally { setPurchasePending(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !session) return;
    setDeleting(true);
    try {
      if (deleteTarget === "all") await clearTransactions(session.token);
      else await deleteTransaction(session.token, deleteTarget.transactionId);
      setDeleteTarget(null);
      toast(deleteTarget === "all" ? "Transaction history deleted." : "Transaction deleted.", "success");
      await Promise.all([loadSummary(), loadTransactions()]);
    } catch (err) { if (err.status === 401) logout(); else { setTransactionError(err.message); toast(err.message || "Unable to delete transaction history.", "error"); } }
    finally { setDeleting(false); }
  };

  if (!session) return <section className="wallet-page wallet-gated fade-up"><div className="wallet-gated-card"><span className="wallet-gated-icon"><WalletCards size={25} /></span><p className="wallet-eyebrow">Your credits, securely scoped</p><h1>Sign in to open your marketplace</h1><p>Credit packages and purchase history belong to your authenticated bot owner account.</p><button className="wallet-primary-button" type="button" onClick={() => onNavigate?.("dashboard")}>Sign in to continue <ChevronRight size={16} /></button></div><WalletStyles /></section>;

  return <section className="wallet-page fade-up">
    <header className="wallet-hero"><div><p className="wallet-eyebrow"><Sparkles size={14} /> Credit marketplace</p><h1>Power your next move.</h1><p>Manage credits, explore packages, and keep every purchase in one refined wallet.</p>{(wallet?.membership?.tier || wallet?.membershipTier || wallet?.membership_tier) && <span className="wallet-trust" aria-label="Current membership">{wallet.membership?.tier || wallet.membershipTier || wallet.membership_tier}</span>}</div><button className="wallet-refresh" type="button" onClick={() => { void loadSummary(); void loadTransactions(); }} aria-label="Refresh wallet"><RefreshCw size={16} /></button></header>
    {error && <section className="wallet-error"><CircleAlert size={20} /><div><strong>We couldn’t load your wallet</strong><span>{error}</span></div><button type="button" onClick={() => void loadSummary()}><RefreshCw size={14} /> Retry</button></section>}
    <SubscriptionCard subscription={wallet?.subscription} loading={loading} error={error} onRetry={() => void loadSummary()} onUpgrade={() => document.querySelector(".wallet-packages")?.scrollIntoView({ behavior: "smooth", block: "center" })} />
    <FeatureEntitlements features={entitlements} loading={loading} />
    <div className="wallet-metrics"><MetricCard icon={WalletCards} label="Available credits" value={wallet?.balance} loading={loading} accent="wallet-highlight" /><MetricCard icon={TrendingUp} label="Purchased credits" value={wallet?.totalPurchased} loading={loading} /><MetricCard icon={Coins} label="Used credits" value={wallet?.totalUsed} loading={loading} /><MetricCard icon={ReceiptText} label="Pending purchases" value={pendingTotal} loading={loading} /></div>
    <section className="wallet-section"><div className="wallet-section-head"><div><p className="wallet-eyebrow">Credit packages</p><h2>Choose your credit boost</h2></div><span className="wallet-trust"><ShieldCheck size={15} /> Secure pending checkout</span></div><div className="wallet-packages">{loading ? Array.from({ length: 3 }, (_, index) => <PackageSkeleton key={index} />) : packages.map((creditPackage) => { const purchasable = creditPackage.amount !== null && creditPackage.amount !== undefined; return <article key={creditPackage.id} className={`wallet-package ${selected?.id === creditPackage.id ? "is-selected" : ""}`}><div className="wallet-package-top"><span className="wallet-package-name">{creditPackage.name}</span>{creditPackage.savings && <span className="wallet-saving">{creditPackage.savings}</span>}</div><strong className="wallet-package-credits">{animateNumber(creditPackage.credits)} <small>credits</small></strong><p className="wallet-package-price">{formatMoney(creditPackage.amount, creditPackage.currency)}</p><button type="button" className="wallet-package-button" disabled={!purchasable} onClick={() => setSelected(creditPackage)}>{purchasable ? <>Select package <ChevronRight size={15} /></> : "Not available yet"}</button></article>; })}</div></section>
    <section className="wallet-section wallet-history"><div className="wallet-section-head wallet-history-head"><div><p className="wallet-eyebrow">Transaction history</p><h2>Every credit movement, clear and current</h2></div><div className="wallet-history-actions"><label className="wallet-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this page" aria-label="Search transactions on this page" /></label>{transactions.length > 0 && <button type="button" className="wallet-clear-button" onClick={() => setDeleteTarget("all")}><Trash2 size={14} /> Clear history</button>}</div></div>
      {transactionError ? <section className="wallet-error"><CircleAlert size={20} /><div><strong>Transaction history is unavailable</strong><span>{transactionError}</span></div><button type="button" onClick={() => void loadTransactions()}><RefreshCw size={14} /> Retry</button></section> : transactionLoading ? <div className="wallet-table-skeleton">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="wallet-table-row-skeleton" />)}</div> : transactions.length === 0 ? <EmptyState className="wallet-empty" icon={ShoppingBag} title="Your credit story starts here" description="You haven’t created a credit purchase yet. Choose a package to begin." actionLabel="Purchase your first credit package" onAction={() => document.querySelector(".wallet-packages")?.scrollIntoView({ behavior: "smooth", block: "center" })} /> : <><div className="wallet-table-wrap"><table className="wallet-table"><thead><tr><th>Package</th><th>Credits</th><th>Amount</th><th>Status</th><th>Transaction ID</th><th>Date</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredTransactions.map((transaction) => <tr key={transaction.transactionId}><td data-label="Package"><strong>{transaction.packageId || transaction.type}</strong></td><td data-label="Credits">{animateNumber(transaction.credits)}</td><td data-label="Amount">{formatMoney(transaction.amount, transaction.currency)}</td><td data-label="Status"><StatusBadge status={transaction.status} /></td><td data-label="Transaction ID"><code>{transaction.transactionId}</code></td><td data-label="Date">{formatDate(transaction.createdAt)}</td><td data-label="Actions"><button type="button" className="wallet-row-delete" onClick={() => setDeleteTarget(transaction)} aria-label={`Delete transaction ${transaction.transactionId}`}><Trash2 size={14} /></button></td></tr>)}</tbody></table></div>{filteredTransactions.length === 0 && <p className="wallet-no-results">No transactions on this page match “{search}”.</p>}{pagination && pagination.totalPages > 1 && <nav className="wallet-pagination" aria-label="Transaction pages"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={16} /> Previous</button><span>Page {pagination.page} of {pagination.totalPages}</span><button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight size={16} /></button></nav>}</>}</section>
    <PurchaseModal selected={selected} phoneNumber={phoneNumber} phoneError={phoneError} onPhoneChange={(value) => { setPhoneNumber(value); setPhoneError(phoneNumberError(value)); }} onPhoneBlur={() => setPhoneError(phoneNumberError(phoneNumber))} onClose={() => { if (!purchasePending) { setSelected(null); setPhoneNumber(""); setPhoneError(""); } }} onConfirm={startPurchase} pending={purchasePending} /><PaymentNext purchase={purchase} onClose={() => setPurchase(null)} onRetry={() => { setPurchase(null); setPhoneNumber(""); setPhoneError(""); setSelected(purchase?.transaction?.packageId ? packages.find((item) => item.id === purchase.transaction.packageId) || null : null); }} /><DeleteHistoryModal target={deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} onConfirm={confirmDelete} pending={deleting} /><WalletStyles />
  </section>;
}

function WalletStyles() { return <style>{`
  .wallet-page { width: min(1120px, 100%); margin: 0 auto; min-height: calc(100dvh - 135px); padding: clamp(32px, 6vw, 66px) 18px 72px; color: var(--token-text); }
  .wallet-hero, .wallet-section-head { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; }.wallet-hero { margin: 0 auto 30px; max-width: 900px; }.wallet-eyebrow { color: var(--token-info); font: 800 .68rem/1.2 var(--font-mono); letter-spacing: .1em; text-transform: uppercase; display: flex; gap: 7px; align-items: center; margin-bottom: 10px; }.wallet-hero h1, .wallet-gated-card h1 { font: 800 clamp(2rem, 5vw, 3.6rem)/1.04 var(--font-display); letter-spacing: -.045em; margin: 0 0 12px; }.wallet-hero > div > p:last-child, .wallet-gated-card > p { color: var(--token-muted); max-width: 610px; line-height: 1.65; font-size: .94rem; }.wallet-refresh, .wallet-modal-close { display: grid; place-items: center; width: 38px; height: 38px; background: var(--token-card); border: 1px solid var(--token-card-border); border-radius: 12px; color: var(--token-text); cursor: pointer; transition: transform .2s ease, background .2s ease; }.wallet-refresh:hover, .wallet-modal-close:hover { transform: rotate(20deg); background: var(--token-hover); }
  .wallet-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }.wallet-metric, .wallet-package, .wallet-gated-card { position: relative; overflow: hidden; border-radius: calc(var(--appearance-radius, var(--token-radius)) + 4px); background: var(--token-card); border: 1px solid var(--token-card-border); box-shadow: var(--token-shadow); backdrop-filter: blur(22px); }.wallet-metric { min-height: 145px; padding: 18px; display: flex; flex-direction: column; }.wallet-metric::after { content: ""; position: absolute; inset: auto -20px -48px; height: 72px; background: var(--token-glow); filter: blur(30px); opacity: .35; pointer-events: none; }.wallet-highlight { border-color: var(--token-border-strong); }.wallet-metric-icon { width: 34px; height: 34px; border-radius: 11px; display: grid; place-items: center; color: var(--token-info); background: var(--token-info-bg); border: 1px solid var(--token-info-border); }.wallet-metric-label { color: var(--token-muted); font-size: .72rem; font-weight: 700; margin: auto 0 5px; }.wallet-number { font-size: clamp(1.25rem, 2.5vw, 1.72rem); line-height: 1; letter-spacing: -.04em; animation: walletNumberIn .55s cubic-bezier(.16,1,.3,1); }.wallet-number-skeleton { width: 68%; height: 27px; border-radius: 7px; margin-top: auto; } @keyframes walletNumberIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .wallet-section { margin-top: 44px; }.wallet-section-head { margin-bottom: 18px; align-items: end; }.wallet-section h2 { margin: 0; font: 750 clamp(1.18rem, 3vw, 1.6rem)/1.15 var(--font-display); letter-spacing: -.025em; }.wallet-trust { display: flex; align-items: center; gap: 6px; color: var(--token-success); background: var(--token-success-bg); padding: 7px 10px; border-radius: 999px; font-size: .7rem; font-weight: 700; white-space: nowrap; }.wallet-packages { display: grid; grid-template-columns: repeat(auto-fit, minmax(205px, 1fr)); gap: 13px; }.wallet-package { min-height: 245px; padding: 19px; display: flex; flex-direction: column; transition: transform .23s ease, border-color .23s ease, box-shadow .23s ease; }.wallet-package:hover, .wallet-package.is-selected { transform: translateY(-5px); border-color: var(--token-border-strong); box-shadow: 0 18px 46px var(--token-glow); }.wallet-package-top { min-height: 26px; display: flex; align-items: start; justify-content: space-between; gap: 8px; }.wallet-package-name { color: var(--token-info); font-size: .74rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }.wallet-saving { color: var(--token-success); background: var(--token-success-bg); padding: 4px 7px; border-radius: 99px; font-size: .63rem; font-weight: 800; }.wallet-package-credits { font-size: 2rem; letter-spacing: -.05em; margin-top: 27px; }.wallet-package-credits small { color: var(--token-muted); font-size: .7rem; letter-spacing: 0; }.wallet-package-price { color: var(--token-muted); font-size: .82rem; margin: 3px 0 17px; }.wallet-package-button, .wallet-primary-button, .wallet-secondary-button { display: inline-flex; justify-content: center; align-items: center; gap: 7px; border-radius: 11px; padding: 11px 13px; border: 1px solid transparent; font-size: .76rem; font-weight: 800; cursor: pointer; transition: transform .2s ease, opacity .2s ease; }.wallet-package-button { width: 100%; margin-top: auto; background: var(--token-surface-strong); border-color: var(--token-card-border); color: var(--token-text); }.wallet-package-button:hover, .wallet-primary-button:hover { transform: translateY(-2px); }.wallet-primary-button { background: var(--token-accent-fill); color: var(--token-on-accent); box-shadow: 0 8px 24px var(--token-glow); }.wallet-secondary-button { background: transparent; border-color: var(--token-card-border); color: var(--token-text); }.wallet-package-skeleton { pointer-events: none; }.wallet-skeleton-chip { width: 45%; height: 13px; }.wallet-skeleton-title { width: 74%; height: 31px; margin-top: 32px; }.wallet-skeleton-number { width: 52%; height: 15px; margin-top: 8px; }.wallet-skeleton-button { width: 100%; height: 37px; margin-top: auto; }
  .wallet-entitlements { margin-top: 28px; }.wallet-feature-list { display: flex; flex-wrap: wrap; gap: 8px; }.wallet-feature-list span { display: inline-flex; align-items: center; gap: 5px; padding: 7px 9px; border-radius: 999px; border: 1px solid var(--token-card-border); font-size: .67rem; font-weight: 750; }.wallet-feature-list .is-available { color: var(--token-success); background: var(--token-success-bg); }.wallet-feature-list .is-locked { color: var(--token-muted); background: var(--token-surface); }
  .wallet-history { padding: clamp(17px, 3vw, 25px); border-radius: calc(var(--appearance-radius, var(--token-radius)) + 4px); background: var(--token-card); border: 1px solid var(--token-card-border); box-shadow: var(--token-shadow); }.wallet-history-actions { display: flex; gap: 8px; align-items: center; }.wallet-clear-button, .wallet-row-delete { display: inline-flex; align-items: center; justify-content: center; gap: 5px; border: 1px solid color-mix(in srgb, var(--token-error) 48%, transparent); color: var(--token-error); background: var(--token-error-bg); border-radius: 9px; cursor: pointer; font-size: .7rem; font-weight: 800; }.wallet-clear-button { padding: 9px 10px; white-space: nowrap; }.wallet-row-delete { width: 29px; height: 29px; }.wallet-search { display: flex; align-items: center; gap: 8px; min-width: min(100%, 236px); padding: 9px 11px; background: var(--token-surface); border: 1px solid var(--token-card-border); border-radius: 11px; color: var(--token-muted); }.wallet-search:focus-within { border-color: var(--token-focus); }.wallet-search input { width: 100%; background: transparent; border: 0; outline: 0; color: var(--token-text); font: inherit; font-size: .78rem; }.wallet-search input::placeholder { color: var(--token-muted); }.wallet-table-wrap { overflow-x: auto; }.wallet-table { width: 100%; border-collapse: collapse; font-size: .77rem; }.wallet-table th { color: var(--token-muted); text-align: left; padding: 11px 10px; border-bottom: 1px solid var(--token-border); font: 800 .63rem var(--font-mono); letter-spacing: .06em; text-transform: uppercase; }.wallet-table td { padding: 14px 10px; border-bottom: 1px solid var(--token-border); color: var(--token-text-secondary); white-space: nowrap; }.wallet-table td strong { color: var(--token-text); }.wallet-table code, .wallet-transaction-id code { color: var(--token-muted); font-size: .66rem; }.wallet-status { display: inline-flex; padding: 4px 8px; border-radius: 99px; font-size: .66rem; font-weight: 800; text-transform: capitalize; background: var(--token-warning-bg); color: var(--token-warning); }.wallet-status.completed { color: var(--token-success); background: var(--token-success-bg); }.wallet-status.failed, .wallet-status.cancelled { color: var(--token-error); background: var(--token-error-bg); }.wallet-pagination { margin-top: 17px; display: flex; justify-content: center; align-items: center; gap: 14px; color: var(--token-muted); font-size: .72rem; }.wallet-pagination button { display: inline-flex; align-items: center; gap: 5px; background: transparent; border: 0; color: var(--token-text); cursor: pointer; font-size: .72rem; }.wallet-pagination button:disabled { opacity: .38; cursor: not-allowed; }.wallet-table-skeleton { display: grid; gap: 9px; }.wallet-table-row-skeleton { height: 43px; width: 100%; }.wallet-no-results { color: var(--token-muted); text-align: center; padding: 20px 0 5px; font-size: .8rem; }.wallet-empty { margin: 12px 0 0; background: transparent; border: 0; }
  .wallet-error { display: flex; align-items: center; gap: 12px; padding: 13px 15px; margin-bottom: 17px; border: 1px solid color-mix(in srgb, var(--token-error) 48%, transparent); border-radius: 14px; background: var(--token-error-bg); color: var(--token-error); }.wallet-error div { display: grid; gap: 2px; flex: 1; }.wallet-error strong { font-size: .78rem; }.wallet-error span { font-size: .71rem; opacity: .88; }.wallet-error button { display: inline-flex; gap: 5px; align-items: center; border: 0; background: transparent; color: inherit; cursor: pointer; font-weight: 800; font-size: .72rem; }.wallet-gated { display: grid; place-items: center; }.wallet-gated-card { max-width: 510px; padding: clamp(25px, 6vw, 48px); text-align: center; }.wallet-gated-icon, .wallet-modal-icon { display: grid; place-items: center; width: 55px; height: 55px; margin: 0 auto 19px; border-radius: 17px; color: var(--token-info); background: var(--token-info-bg); border: 1px solid var(--token-info-border); }.wallet-gated-card .wallet-eyebrow { justify-content: center; }.wallet-gated-card .wallet-primary-button { margin-top: 18px; }
  .wallet-modal-backdrop { position: fixed; z-index: 1500; inset: 0; display: grid; place-items: center; padding: 18px; background: var(--token-backdrop); backdrop-filter: blur(6px); animation: walletFade .2s ease; }.wallet-modal { position: relative; width: min(470px, 100%); padding: 30px; border-radius: 23px; background: var(--token-dialog); border: 1px solid var(--token-border-strong); box-shadow: var(--token-shadow); color: var(--token-text); text-align: center; animation: walletModal .25s cubic-bezier(.16,1,.3,1); }.wallet-modal-close { position: absolute; top: 13px; right: 13px; }.wallet-modal h2 { margin: 0 0 9px; color: var(--token-text); font: 800 1.55rem/1.1 var(--font-display); letter-spacing: -.035em; }.wallet-modal > p:not(.wallet-eyebrow):not(.wallet-modal-note) { color: var(--token-text-muted); line-height: 1.55; font-size: .84rem; }.wallet-confirm-line, .wallet-transaction-id { margin: 19px 0 13px; display: flex; justify-content: space-between; gap: 16px; text-align: left; padding: 12px 13px; border-radius: 12px; background: var(--token-dialog-surface); border: 1px solid var(--token-card-border); font-size: .76rem; }.wallet-confirm-line span, .wallet-transaction-id span { color: var(--token-text-muted); }.wallet-provider-field { display: grid; gap: 7px; margin: 0 0 13px; text-align: left; color: var(--token-text-muted); font-size: .76rem; }.wallet-provider-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 9px; }.wallet-provider-option { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; padding: 13px 8px; min-height: 92px; border: 1px solid var(--token-card-border); border-radius: 12px; background: var(--token-dialog-surface); color: var(--token-text); cursor: pointer; transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease; text-align: center; overflow: hidden; }.wallet-provider-option:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--token-border-strong); }.wallet-provider-option.is-selected { border-color: var(--token-focus); box-shadow: 0 0 0 2px var(--token-focus); }.wallet-provider-option:disabled { opacity: .55; cursor: not-allowed; }.wallet-provider-option.is-unconfigured { opacity: .6; }.wallet-provider-option.has-logo { padding: 10px; background: #fff; }.wallet-provider-logo-fill { width: 100%; height: 62px; object-fit: contain; }.wallet-provider-icon { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; color: #fff; font-weight: 800; font-size: .85rem; }.wallet-provider-name { font-size: .72rem; font-weight: 700; line-height: 1.2; }.wallet-provider-flag { font-size: .58rem; color: var(--token-error); font-weight: 700; }.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }.wallet-provider-check { position: absolute; top: 6px; right: 6px; width: 18px; height: 18px; border-radius: 50%; background: var(--token-focus); color: #fff; display: grid; place-items: center; }.wallet-modal-note { display: flex; gap: 7px; align-items: flex-start; color: var(--token-success); text-align: left; line-height: 1.45; font-size: .7rem; }.wallet-modal-actions { display: flex; gap: 9px; margin-top: 20px; }.wallet-modal-actions button { flex: 1; }.wallet-danger-button { display: inline-flex; justify-content: center; align-items: center; gap: 7px; border-radius: 11px; padding: 11px 13px; border: 1px solid transparent; background: var(--token-error); color: var(--token-on-accent); font-size: .76rem; font-weight: 800; cursor: pointer; }.wallet-success-orbit { display: grid; place-items: center; width: 64px; height: 64px; margin: 0 auto 19px; border-radius: 50%; color: var(--token-success); background: var(--token-success-bg); border: 1px solid var(--token-success); box-shadow: 0 0 0 10px var(--token-success-bg); }.wallet-transaction-id { display: grid; gap: 5px; }.wallet-full-button { width: 100%; margin-top: 14px; } @keyframes walletFade { from { opacity: 0; } to { opacity: 1; } } @keyframes walletModal { from { opacity: 0; transform: translateY(16px) scale(.98); } to { opacity: 1; transform: none; } }
  @media (max-width: 780px) { .wallet-metrics { grid-template-columns: repeat(2, 1fr); }.wallet-history-head { align-items: stretch; flex-direction: column; }.wallet-history-actions { flex-wrap: wrap; }.wallet-search { width: 100%; }.wallet-table thead { display: none; }.wallet-table, .wallet-table tbody, .wallet-table tr, .wallet-table td { display: block; width: 100%; }.wallet-table tr { padding: 12px 0; border-bottom: 1px solid var(--token-border); }.wallet-table td { padding: 4px 0; border: 0; white-space: normal; display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }.wallet-table td::before { content: attr(data-label); color: var(--token-muted); font: 700 .61rem var(--font-mono); text-transform: uppercase; letter-spacing: .06em; }.wallet-table td:first-child { padding-top: 0; }.wallet-table td:last-child { padding-bottom: 0; }.wallet-table code { overflow-wrap: anywhere; text-align: right; }.wallet-table tr:last-child { border-bottom: 0; } }
  @media (max-width: 480px) { .wallet-page { padding-left: 13px; padding-right: 13px; }.wallet-hero { margin-bottom: 24px; }.wallet-hero h1 { font-size: 2rem; }.wallet-metric { min-height: 125px; padding: 14px; }.wallet-section { margin-top: 32px; }.wallet-section-head { align-items: flex-start; flex-direction: column; gap: 12px; }.wallet-trust { white-space: normal; }.wallet-modal { padding: 25px 19px; }.wallet-modal-actions { flex-direction: column-reverse; }.wallet-pagination { gap: 8px; }.wallet-pagination span { white-space: nowrap; } }
  .wallet-phone-field { display: grid; gap: 7px; margin: 0 0 8px; text-align: left; color: var(--token-text-muted); font-size: .76rem; }.wallet-phone-field input { width: 100%; box-sizing: border-box; padding: 11px 12px; border: 1px solid var(--token-card-border); border-radius: 11px; outline: 0; color: var(--token-text); background: var(--token-dialog-surface); font: inherit; }.wallet-phone-field input:focus { border-color: var(--token-focus); box-shadow: 0 0 0 3px color-mix(in srgb, var(--token-focus) 22%, transparent); }.wallet-phone-field input[aria-invalid="true"] { border-color: var(--token-error); }.wallet-phone-error { margin: 0 0 11px; text-align: left; color: var(--token-error); font-size: .7rem; line-height: 1.4; }.wallet-detected-network { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 0 12px; padding: 11px 12px; border: 1px solid var(--token-success); border-radius: 11px; background: var(--token-success-bg); color: var(--token-success); font-size: .74rem; text-align: left; }.wallet-detected-network strong { display: inline-flex; align-items: center; gap: 6px; color: var(--token-text); }.wallet-detected-network i { width: 8px; height: 8px; border-radius: 50%; background: var(--token-success); }.wallet-detected-network.is-disabled { border-color: var(--token-error); background: var(--token-error-bg); color: var(--token-error); }.wallet-detected-network.is-disabled i { background: var(--token-error); }
  .wallet-subscription { margin: 0 0 18px; padding: 18px; display: flex; justify-content: space-between; gap: 18px; align-items: center; border: 1px solid var(--token-card-border); border-radius: calc(var(--appearance-radius, var(--token-radius)) + 4px); background: var(--token-card); box-shadow: var(--token-shadow); }.wallet-subscription > div > p:not(.wallet-eyebrow) { margin: 6px 0 0; color: var(--token-muted); font-size: .78rem; }.wallet-subscription-plan { font: 800 1.2rem var(--font-display); text-transform: uppercase; letter-spacing: .04em; }.wallet-subscription-side { display: grid; justify-items: end; gap: 7px; }.wallet-subscription-status { color: var(--token-success); background: var(--token-success-bg); border-radius: 999px; padding: 4px 8px; font: 800 .63rem var(--font-mono); }.wallet-subscription.expired .wallet-subscription-status, .wallet-subscription.suspended .wallet-subscription-status { color: var(--token-error); background: var(--token-error-bg); }.wallet-subscription-side small { color: var(--token-muted); font-size: .7rem; }.wallet-subscription-skeleton { min-height: 112px; pointer-events: none; }.wallet-subscription-skeleton .wallet-skeleton-button { margin-left: auto; width: 112px; } @media (max-width: 520px) { .wallet-subscription { align-items: flex-start; flex-direction: column; }.wallet-subscription-side { justify-items: start; }.wallet-subscription-side .wallet-primary-button { width: 100%; } }
`}</style>; }
