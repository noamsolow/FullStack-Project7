import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext.jsx";
import { recommendationService } from "../../services/recommendations/recommendationService.js";
import { formatMoney } from "../../utils/format.js";
import { Icon } from "../ui/Icon.jsx";
import { ProductVisual } from "../ui/ProductVisual.jsx";

const quickPrompts = [
  "Lunch under NIS 35",
  "Show me something vegan",
  "I need study essentials",
];

function initialMessages(name) {
  return [{
    role: "assistant",
    content: `Hi${name ? ` ${name}` : ""}! What are you looking for today? Tell me a budget, a craving, or what you need for campus.`,
  }];
}

export function ShoppingAssistant() {
  const { user } = useAuth();
  const firstName = useMemo(
    () => user?.displayName?.trim().split(/\s+/)[0] ?? "",
    [user?.displayName],
  );
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => initialMessages(firstName));
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open) messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loading, messages, open]);

  if (!user || user.role !== "customer") return null;

  async function sendMessage(value) {
    const content = value.trim();
    if (!content || loading) return;

    const userMessage = { role: "user", content };
    const visibleMessages = [...messages, userMessage];
    setMessages(visibleMessages);
    setDraft("");
    setError("");
    setLoading(true);

    try {
      const history = visibleMessages
        .slice(-12)
        .map(({ role, content: messageContent }) => ({
          role,
          content: messageContent,
        }));
      const response = await recommendationService.chat(history);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.data.reply,
          recommendations: response.data.recommendations,
          source: response.data.source,
          safetyNotice: response.data.safetyNotice,
        },
      ]);
    } catch (caught) {
      setError(caught.message ?? "The shopping assistant could not answer. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    sendMessage(draft);
  }

  function resetChat() {
    setMessages(initialMessages(firstName));
    setDraft("");
    setError("");
  }

  if (!open) {
    return (
      <div className="shopping-assistant">
        <button
          type="button"
          className="shopping-assistant__launcher"
          aria-label="Open LevGo shopping assistant"
          aria-expanded="false"
          onClick={() => setOpen(true)}
        >
          <Icon name="sparkles" size={22} />
          <span>Ask LevGo</span>
        </button>
      </div>
    );
  }

  const hasCustomerMessage = messages.some((message) => message.role === "user");

  return (
    <div className="shopping-assistant">
      <section
        id="shopping-assistant-panel"
        className="shopping-assistant__panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby="shopping-assistant-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <header className="shopping-assistant__header">
          <span className="shopping-assistant__mark"><Icon name="sparkles" /></span>
          <div>
            <h2 id="shopping-assistant-title">LevGo shopping assistant</h2>
            <p>Live catalog recommendations</p>
          </div>
          <button type="button" onClick={resetChat}>New chat</button>
          <button
            type="button"
            className="icon-button"
            aria-label="Close shopping assistant"
            onClick={() => setOpen(false)}
          >
            <Icon name="close" />
          </button>
        </header>

        <div className="shopping-assistant__messages" aria-live="polite">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`shopping-message shopping-message--${message.role}`}
            >
              <p>{message.content}</p>
              {message.recommendations?.length > 0 && (
                <div className="shopping-message__products">
                  {message.recommendations.map(({ product, reason }) => (
                    <Link
                      key={product.public_id}
                      to={`/vendors/${product.vendor_slug}`}
                      className="shopping-product"
                      onClick={() => setOpen(false)}
                    >
                      <ProductVisual product={product} />
                      <span>
                        <small>{product.vendor_name}</small>
                        <strong>{product.name}</strong>
                        <em>{reason}</em>
                        <b>{formatMoney(product.price_agorot)}</b>
                      </span>
                      <Icon name="arrow" size={17} />
                    </Link>
                  ))}
                </div>
              )}
              {message.source && (
                <small className="shopping-message__source">
                  {message.source === "gemini" ? "AI answer" : "Local catalog match"}
                </small>
              )}
              {message.safetyNotice && message.recommendations?.length > 0 && (
                <small className="shopping-message__notice">{message.safetyNotice}</small>
              )}
            </div>
          ))}
          {loading && (
            <div className="shopping-message shopping-message--assistant shopping-message--typing">
              <span /><span /><span />
              <span className="sr-only">Assistant is thinking</span>
            </div>
          )}
          {error && <div className="shopping-assistant__error" role="alert">{error}</div>}
          <div ref={messageEndRef} />
        </div>

        {!hasCustomerMessage && (
          <div className="shopping-assistant__prompts" aria-label="Suggested questions">
            {quickPrompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => sendMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form className="shopping-assistant__form" onSubmit={submit}>
          <label className="sr-only" htmlFor="shopping-assistant-input">Ask what to buy</label>
          <input
            ref={inputRef}
            id="shopping-assistant-input"
            value={draft}
            maxLength={600}
            placeholder="Ask what to buy..."
            autoComplete="off"
            onChange={(event) => setDraft(event.target.value)}
          />
          <button
            type="submit"
            className="shopping-assistant__send"
            disabled={loading || !draft.trim()}
            aria-label="Send message"
          >
            <Icon name="arrow" />
          </button>
        </form>
      </section>
    </div>
  );
}
