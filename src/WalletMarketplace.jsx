import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, CircleAlert, Coins, CreditCard, Loader2, ReceiptText, RefreshCw, Search, ShieldCheck, ShoppingBag, Sparkles, TrendingUp, WalletCards, X } from "lucide-react";
import { EmptyState, Skeleton } from "./UIStates";
import { createPurchase, getOwnerSession, getPackages, getTransactions, getWallet } from "./walletApi";

const PAGE_SIZE = 10;

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

function PurchaseModal({ selected, onClose, onConfirm, pending }) {
  if (!selected) return null;
  return <div className="wallet-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="wallet-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-title">
      <button className="wallet-modal-close" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
      <span className="wallet-modal-icon"><CreditCard size={23} /></span>
      <p className="wallet-eyebrow">Confirm your selection</p>
      <h2 id="purchase-title">Get {animateNumber(selected.credits)} credits?</h2>
      <p>You’re creating a secure pending purchase for the <strong>{selected.name}</strong> package.</p>
      <div className="wallet-confirm-line"><span>Due when payment opens</span><strong>{formatMoney(selected.amount, selected.currency)}</strong></div>
      <p className="wallet-modal-note"><ShieldCheck size={15} /> Payment is not collected yet. You’ll see the next step once a provider is connected.</p>
      <div className="wallet-modal-actions"><button type="button" className="wallet-secondary-button" onClick={onClose} disabled={pending}>Not now</button><button type="button" className="wallet-primary-button" onClick={onConfirm} disabled={pending}>{pending ? <><Loader2 size={16} className="spin-icon" /> Creating…</> : <>Create pending purchase <Check size={16} /></>}</button></div>
    </section>
  </div>;
}

function PaymentNext({ purchase, onClose }) {
  if (!purchase) return null;
  const transaction = purchase.transaction || purchase;
  return <div className="wallet-modal-backdrop" role="presentation">
    <section className="wallet-modal wallet-success-modal" role="dialog" aria-modal="true" aria-labelledby="payment-next-title">
      <span className="wallet-success-orbit"><Sparkles size={24} /></span>
      <p className="wallet-eyebrow">Purchase created</p>
      <h2 id="payment-next-title">Payment coming next</h2>
      <p>Your {animateNumber(transaction.credits)} credit purchase is safely pending. Credits are only added after payment verification.</p>
      <div className="wallet-transaction-id"><span>Transaction ID</span><code>{transaction.transactionId}</code></div>
      <p className="wallet-modal-note"><ShieldCheck size={15} /> No payment has been taken. Payment provider integration is the next step.</p>
      <button type="button" className="wallet-primary-button wallet-full-button" onClick={onClose}>Back to marketplace</button>
    </section>
  </div>;
}

export default function WalletMarketplace({ onNavigate }) {
  const [session] = useState(getOwnerSession);
  const [wallet, setWallet] = useState(null);
  const [packages, setPackages] = useState([]);
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
  const [purchasePending, setPurchasePending] = useState(false);
  const [purchase, setPurchase] = useState(null);

  const loadSummary = useCallback(async () => {
    if (!session) return;
    setLoading(true); setError("");
    try {
      const [walletData, packageData, pendingData] = await Promise.all([
        getWallet(session.token), getPackages(session.token), getTransactions(session.token, { page: "1", limit: "1", status: "pending" }),
      ]);
      setWallet(walletData); setPackages(packageData.packages || []); setPendingTotal(pendingData.pagination?.total || 0);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [session]);

  const loadTransactions = useCallback(async () => {
    if (!session) return;
    setTransactionLoading(true); setTransactionError("");
    try {
      const data = await getTransactions(session.token, { page: String(page), limit: String(PAGE_SIZE), sortBy: "createdAt", sortOrder: "desc" });
      setTransactions(data.transactions || []); setPagination(data.pagination || null);
    } catch (err) { setTransactionError(err.message); }
    finally { setTransactionLoading(false); }
  }, [page, session]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadSummary(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSummary]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void loadTransactions(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTransactions]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return transactions;
    return transactions.filter((transaction) => [transaction.transactionId, transaction.packageId, transaction.status, transaction.type].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [search, transactions]);

  const startPurchase = async () => {
    if (!selected || !session) return;
    setPurchasePending(true);
    try {
      const data = await createPurchase(session.token, selected.id);
      setSelected(null); setPurchase(data); await Promise.all([loadSummary(), loadTransactions()]);
    } catch (err) {
      if (err.status === 409 && err.data?.transaction) { setSelected(null); setPurchase({ transaction: err.data.transaction }); await Promise.all([loadSummary(), loadTransactions()]); }
      else setError(err.message);
    } finally { setPurchasePending(false); }
  };

  if (!session) return <section className="wallet-page wallet-gated fade-up"><div className="wallet-gated-card"><span className="wallet-gated-icon"><WalletCards size={25} /></span><p className="wallet-eyebrow">Your credits, securely scoped</p><h1>Sign in to open your marketplace</h1><p>Credit packages and purchase history belong to your authenticated bot owner account.</p><button className="wallet-primary-button" type="button" onClick={() => onNavigate?.("dashboard")}>Sign in to continue <ChevronRight size={16} /></button></div><WalletStyles /></section>;

  return <section className="wallet-page fade-up">
    <header className="wallet-hero"><div><p className="wallet-eyebrow"><Sparkles size={14} /> Credit marketplace</p><h1>Power your next move.</h1><p>Manage credits, explore packages, and keep every purchase in one refined wallet.</p></div><button className="wallet-refresh" type="button" onClick={() => { void loadSummary(); void loadTransactions(); }} aria-label="Refresh wallet"><RefreshCw size={16} /></button></header>
    {error && <section className="wallet-error"><CircleAlert size={20} /><div><strong>We couldn’t load your wallet</strong><span>{error}</span></div><button type="button" onClick={() => void loadSummary()}><RefreshCw size={14} /> Retry</button></section>}
    <div className="wallet-metrics"><MetricCard icon={WalletCards} label="Available credits" value={wallet?.balance} loading={loading} accent="wallet-highlight" /><MetricCard icon={TrendingUp} label="Purchased credits" value={wallet?.totalPurchased} loading={loading} /><MetricCard icon={Coins} label="Used credits" value={wallet?.totalUsed} loading={loading} /><MetricCard icon={ReceiptText} label="Pending purchases" value={pendingTotal} loading={loading} /></div>
    <section className="wallet-section"><div className="wallet-section-head"><div><p className="wallet-eyebrow">Credit packages</p><h2>Choose your credit boost</h2></div><span className="wallet-trust"><ShieldCheck size={15} /> Secure pending checkout</span></div><div className="wallet-packages">{loading ? Array.from({ length: 3 }, (_, index) => <PackageSkeleton key={index} />) : packages.map((creditPackage) => <article key={creditPackage.id} className={`wallet-package ${selected?.id === creditPackage.id ? "is-selected" : ""}`}><div className="wallet-package-top"><span className="wallet-package-name">{creditPackage.name}</span>{creditPackage.savings && <span className="wallet-saving">{creditPackage.savings}</span>}</div><strong className="wallet-package-credits">{animateNumber(creditPackage.credits)} <small>credits</small></strong><p className="wallet-package-price">{formatMoney(creditPackage.amount, creditPackage.currency)}</p><button type="button" className="wallet-package-button" onClick={() => setSelected(creditPackage)}>Select package <ChevronRight size={15} /></button></article>)}</div></section>
    <section className="wallet-section wallet-history"><div className="wallet-section-head wallet-history-head"><div><p className="wallet-eyebrow">Transaction history</p><h2>Every credit movement, clear and current</h2></div><label className="wallet-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this page" aria-label="Search transactions on this page" /></label></div>
      {transactionError ? <section className="wallet-error"><CircleAlert size={20} /><div><strong>Transaction history is unavailable</strong><span>{transactionError}</span></div><button type="button" onClick={() => void loadTransactions()}><RefreshCw size={14} /> Retry</button></section> : transactionLoading ? <div className="wallet-table-skeleton">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="wallet-table-row-skeleton" />)}</div> : transactions.length === 0 ? <EmptyState className="wallet-empty" icon={ShoppingBag} title="Your credit story starts here" description="You haven’t created a credit purchase yet. Choose a package to begin." actionLabel="Purchase your first credit package" onAction={() => document.querySelector(".wallet-packages")?.scrollIntoView({ behavior: "smooth", block: "center" })} /> : <><div className="wallet-table-wrap"><table className="wallet-table"><thead><tr><th>Package</th><th>Credits</th><th>Amount</th><th>Status</th><th>Transaction ID</th><th>Date</th></tr></thead><tbody>{filteredTransactions.map((transaction) => <tr key={transaction.transactionId}><td data-label="Package"><strong>{transaction.packageId || transaction.type}</strong></td><td data-label="Credits">{animateNumber(transaction.credits)}</td><td data-label="Amount">{formatMoney(transaction.amount, transaction.currency)}</td><td data-label="Status"><StatusBadge status={transaction.status} /></td><td data-label="Transaction ID"><code>{transaction.transactionId}</code></td><td data-label="Date">{formatDate(transaction.createdAt)}</td></tr>)}</tbody></table></div>{filteredTransactions.length === 0 && <p className="wallet-no-results">No transactions on this page match “{search}”.</p>}{pagination && pagination.totalPages > 1 && <nav className="wallet-pagination" aria-label="Transaction pages"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={16} /> Previous</button><span>Page {pagination.page} of {pagination.totalPages}</span><button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight size={16} /></button></nav>}</>}</section>
    <PurchaseModal selected={selected} onClose={() => !purchasePending && setSelected(null)} onConfirm={startPurchase} pending={purchasePending} /><PaymentNext purchase={purchase} onClose={() => setPurchase(null)} /><WalletStyles />
  </section>;
}

function WalletStyles() { return <style>{`
  .wallet-page { width: min(1120px, 100%); margin: 0 auto; min-height: calc(100dvh - 135px); padding: clamp(32px, 6vw, 66px) 18px 72px; color: var(--token-text); }
  .wallet-hero, .wallet-section-head { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; }.wallet-hero { margin: 0 auto 30px; max-width: 900px; }.wallet-eyebrow { color: var(--token-info); font: 800 .68rem/1.2 var(--font-mono); letter-spacing: .1em; text-transform: uppercase; display: flex; gap: 7px; align-items: center; margin-bottom: 10px; }.wallet-hero h1, .wallet-gated-card h1 { font: 800 clamp(2rem, 5vw, 3.6rem)/1.04 var(--font-display); letter-spacing: -.045em; margin: 0 0 12px; }.wallet-hero > div > p:last-child, .wallet-gated-card > p { color: var(--token-muted); max-width: 610px; line-height: 1.65; font-size: .94rem; }.wallet-refresh, .wallet-modal-close { display: grid; place-items: center; width: 38px; height: 38px; background: var(--token-card); border: 1px solid var(--token-card-border); border-radius: 12px; color: var(--token-text); cursor: pointer; transition: transform .2s ease, background .2s ease; }.wallet-refresh:hover, .wallet-modal-close:hover { transform: rotate(20deg); background: var(--token-hover); }
  .wallet-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }.wallet-metric, .wallet-package, .wallet-gated-card { position: relative; overflow: hidden; border-radius: calc(var(--appearance-radius, var(--token-radius)) + 4px); background: var(--token-card); border: 1px solid var(--token-card-border); box-shadow: var(--token-shadow); backdrop-filter: blur(22px); }.wallet-metric { min-height: 145px; padding: 18px; display: flex; flex-direction: column; }.wallet-metric::after { content: ""; position: absolute; inset: auto -20px -48px; height: 72px; background: var(--token-glow); filter: blur(30px); opacity: .35; pointer-events: none; }.wallet-highlight { border-color: var(--token-border-strong); }.wallet-metric-icon { width: 34px; height: 34px; border-radius: 11px; display: grid; place-items: center; color: var(--token-info); background: var(--token-info-bg); border: 1px solid var(--token-info-border); }.wallet-metric-label { color: var(--token-muted); font-size: .72rem; font-weight: 700; margin: auto 0 5px; }.wallet-number { font-size: clamp(1.25rem, 2.5vw, 1.72rem); line-height: 1; letter-spacing: -.04em; animation: walletNumberIn .55s cubic-bezier(.16,1,.3,1); }.wallet-number-skeleton { width: 68%; height: 27px; border-radius: 7px; margin-top: auto; } @keyframes walletNumberIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .wallet-section { margin-top: 44px; }.wallet-section-head { margin-bottom: 18px; align-items: end; }.wallet-section h2 { margin: 0; font: 750 clamp(1.18rem, 3vw, 1.6rem)/1.15 var(--font-display); letter-spacing: -.025em; }.wallet-trust { display: flex; align-items: center; gap: 6px; color: var(--token-success); background: var(--token-success-bg); padding: 7px 10px; border-radius: 999px; font-size: .7rem; font-weight: 700; white-space: nowrap; }.wallet-packages { display: grid; grid-template-columns: repeat(auto-fit, minmax(205px, 1fr)); gap: 13px; }.wallet-package { min-height: 245px; padding: 19px; display: flex; flex-direction: column; transition: transform .23s ease, border-color .23s ease, box-shadow .23s ease; }.wallet-package:hover, .wallet-package.is-selected { transform: translateY(-5px); border-color: var(--token-border-strong); box-shadow: 0 18px 46px var(--token-glow); }.wallet-package-top { min-height: 26px; display: flex; align-items: start; justify-content: space-between; gap: 8px; }.wallet-package-name { color: var(--token-info); font-size: .74rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }.wallet-saving { color: var(--token-success); background: var(--token-success-bg); padding: 4px 7px; border-radius: 99px; font-size: .63rem; font-weight: 800; }.wallet-package-credits { font-size: 2rem; letter-spacing: -.05em; margin-top: 27px; }.wallet-package-credits small { color: var(--token-muted); font-size: .7rem; letter-spacing: 0; }.wallet-package-price { color: var(--token-muted); font-size: .82rem; margin: 3px 0 17px; }.wallet-package-button, .wallet-primary-button, .wallet-secondary-button { display: inline-flex; justify-content: center; align-items: center; gap: 7px; border-radius: 11px; padding: 11px 13px; border: 1px solid transparent; font-size: .76rem; font-weight: 800; cursor: pointer; transition: transform .2s ease, opacity .2s ease; }.wallet-package-button { width: 100%; margin-top: auto; background: var(--token-surface-strong); border-color: var(--token-card-border); color: var(--token-text); }.wallet-package-button:hover, .wallet-primary-button:hover { transform: translateY(-2px); }.wallet-primary-button { background: var(--token-accent-fill); color: var(--token-on-accent); box-shadow: 0 8px 24px var(--token-glow); }.wallet-secondary-button { background: transparent; border-color: var(--token-card-border); color: var(--token-text); }.wallet-package-skeleton { pointer-events: none; }.wallet-skeleton-chip { width: 45%; height: 13px; }.wallet-skeleton-title { width: 74%; height: 31px; margin-top: 32px; }.wallet-skeleton-number { width: 52%; height: 15px; margin-top: 8px; }.wallet-skeleton-button { width: 100%; height: 37px; margin-top: auto; }
  .wallet-history { padding: clamp(17px, 3vw, 25px); border-radius: calc(var(--appearance-radius, var(--token-radius)) + 4px); background: var(--token-card); border: 1px solid var(--token-card-border); box-shadow: var(--token-shadow); }.wallet-search { display: flex; align-items: center; gap: 8px; min-width: min(100%, 236px); padding: 9px 11px; background: var(--token-surface); border: 1px solid var(--token-card-border); border-radius: 11px; color: var(--token-muted); }.wallet-search:focus-within { border-color: var(--token-focus); }.wallet-search input { width: 100%; background: transparent; border: 0; outline: 0; color: var(--token-text); font: inherit; font-size: .78rem; }.wallet-search input::placeholder { color: var(--token-muted); }.wallet-table-wrap { overflow-x: auto; }.wallet-table { width: 100%; border-collapse: collapse; font-size: .77rem; }.wallet-table th { color: var(--token-muted); text-align: left; padding: 11px 10px; border-bottom: 1px solid var(--token-border); font: 800 .63rem var(--font-mono); letter-spacing: .06em; text-transform: uppercase; }.wallet-table td { padding: 14px 10px; border-bottom: 1px solid var(--token-border); color: var(--token-text-secondary); white-space: nowrap; }.wallet-table td strong { color: var(--token-text); }.wallet-table code, .wallet-transaction-id code { color: var(--token-muted); font-size: .66rem; }.wallet-status { display: inline-flex; padding: 4px 8px; border-radius: 99px; font-size: .66rem; font-weight: 800; text-transform: capitalize; background: var(--token-warning-bg); color: var(--token-warning); }.wallet-status.completed { color: var(--token-success); background: var(--token-success-bg); }.wallet-status.failed, .wallet-status.cancelled { color: var(--token-error); background: var(--token-error-bg); }.wallet-pagination { margin-top: 17px; display: flex; justify-content: center; align-items: center; gap: 14px; color: var(--token-muted); font-size: .72rem; }.wallet-pagination button { display: inline-flex; align-items: center; gap: 5px; background: transparent; border: 0; color: var(--token-text); cursor: pointer; font-size: .72rem; }.wallet-pagination button:disabled { opacity: .38; cursor: not-allowed; }.wallet-table-skeleton { display: grid; gap: 9px; }.wallet-table-row-skeleton { height: 43px; width: 100%; }.wallet-no-results { color: var(--token-muted); text-align: center; padding: 20px 0 5px; font-size: .8rem; }.wallet-empty { margin: 12px 0 0; background: transparent; border: 0; }
  .wallet-error { display: flex; align-items: center; gap: 12px; padding: 13px 15px; margin-bottom: 17px; border: 1px solid color-mix(in srgb, var(--token-error) 48%, transparent); border-radius: 14px; background: var(--token-error-bg); color: var(--token-error); }.wallet-error div { display: grid; gap: 2px; flex: 1; }.wallet-error strong { font-size: .78rem; }.wallet-error span { font-size: .71rem; opacity: .88; }.wallet-error button { display: inline-flex; gap: 5px; align-items: center; border: 0; background: transparent; color: inherit; cursor: pointer; font-weight: 800; font-size: .72rem; }.wallet-gated { display: grid; place-items: center; }.wallet-gated-card { max-width: 510px; padding: clamp(25px, 6vw, 48px); text-align: center; }.wallet-gated-icon, .wallet-modal-icon { display: grid; place-items: center; width: 55px; height: 55px; margin: 0 auto 19px; border-radius: 17px; color: var(--token-info); background: var(--token-info-bg); border: 1px solid var(--token-info-border); }.wallet-gated-card .wallet-eyebrow { justify-content: center; }.wallet-gated-card .wallet-primary-button { margin-top: 18px; }
  .wallet-modal-backdrop { position: fixed; z-index: 1500; inset: 0; display: grid; place-items: center; padding: 18px; background: var(--token-backdrop); backdrop-filter: blur(6px); animation: walletFade .2s ease; }.wallet-modal { position: relative; width: min(470px, 100%); padding: 30px; border-radius: 23px; background: var(--token-card-strong); border: 1px solid var(--token-border-strong); box-shadow: var(--token-shadow); text-align: center; animation: walletModal .25s cubic-bezier(.16,1,.3,1); }.wallet-modal-close { position: absolute; top: 13px; right: 13px; }.wallet-modal h2 { margin: 0 0 9px; font: 800 1.55rem/1.1 var(--font-display); letter-spacing: -.035em; }.wallet-modal > p:not(.wallet-eyebrow):not(.wallet-modal-note) { color: var(--token-muted); line-height: 1.55; font-size: .84rem; }.wallet-confirm-line, .wallet-transaction-id { margin: 19px 0 13px; display: flex; justify-content: space-between; gap: 16px; text-align: left; padding: 12px 13px; border-radius: 12px; background: var(--token-surface); border: 1px solid var(--token-card-border); font-size: .76rem; }.wallet-confirm-line span, .wallet-transaction-id span { color: var(--token-muted); }.wallet-modal-note { display: flex; gap: 7px; align-items: flex-start; color: var(--token-success); text-align: left; line-height: 1.45; font-size: .7rem; }.wallet-modal-actions { display: flex; gap: 9px; margin-top: 20px; }.wallet-modal-actions button { flex: 1; }.wallet-success-orbit { display: grid; place-items: center; width: 64px; height: 64px; margin: 0 auto 19px; border-radius: 50%; color: var(--token-success); background: var(--token-success-bg); border: 1px solid var(--token-success); box-shadow: 0 0 0 10px var(--token-success-bg); }.wallet-transaction-id { display: grid; gap: 5px; }.wallet-full-button { width: 100%; margin-top: 14px; } @keyframes walletFade { from { opacity: 0; } to { opacity: 1; } } @keyframes walletModal { from { opacity: 0; transform: translateY(16px) scale(.98); } to { opacity: 1; transform: none; } }
  @media (max-width: 780px) { .wallet-metrics { grid-template-columns: repeat(2, 1fr); }.wallet-history-head { align-items: stretch; flex-direction: column; }.wallet-search { width: 100%; }.wallet-table thead { display: none; }.wallet-table, .wallet-table tbody, .wallet-table tr, .wallet-table td { display: block; width: 100%; }.wallet-table tr { padding: 12px 0; border-bottom: 1px solid var(--token-border); }.wallet-table td { padding: 4px 0; border: 0; white-space: normal; display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }.wallet-table td::before { content: attr(data-label); color: var(--token-muted); font: 700 .61rem var(--font-mono); text-transform: uppercase; letter-spacing: .06em; }.wallet-table td:first-child { padding-top: 0; }.wallet-table td:last-child { padding-bottom: 0; }.wallet-table code { overflow-wrap: anywhere; text-align: right; }.wallet-table tr:last-child { border-bottom: 0; } }
  @media (max-width: 480px) { .wallet-page { padding-left: 13px; padding-right: 13px; }.wallet-hero { margin-bottom: 24px; }.wallet-hero h1 { font-size: 2rem; }.wallet-metric { min-height: 125px; padding: 14px; }.wallet-section { margin-top: 32px; }.wallet-section-head { align-items: flex-start; flex-direction: column; gap: 12px; }.wallet-trust { white-space: normal; }.wallet-modal { padding: 25px 19px; }.wallet-modal-actions { flex-direction: column-reverse; }.wallet-pagination { gap: 8px; }.wallet-pagination span { white-space: nowrap; } }
`}</style>; }
