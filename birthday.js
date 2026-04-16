"use strict";

const CONFIG = {
  sheetsUrl: "https://script.google.com/macros/s/AKfycbztXTL5-gZU8rYmypM32IFn2rtA3Z3PSA5Q7tM98jA1ql_xNS2scbYp2PyoNPX2V2Io/exec",
  defaultGuestName: "Friend",
  particleCount: 24,
  loadingDelay: 520,
  flapLiftDelay: 120,
  envelopeDropDuration: 2000,
  cardRiseDuration: 1800,
  storageKeyPrefix: "birthday-rsvp:",
};

let currentGuest = {
  raw: CONFIG.defaultGuestName,
  display: CONFIG.defaultGuestName,
  slug: "friend",
  inviteId: "g000",
};

let envelopeFacingFront = false;
let envelopeOpened = false;
let cardFlipped = false;

function titleCase(value) {
  return value
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function createSlug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeInviteId(value) {
  const cleaned = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || "g000";
}

function getGuestFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const rawGuest = (
    params.get("guest") ||
    params.get("name") ||
    CONFIG.defaultGuestName
  ).trim();
  const display = rawGuest ? titleCase(rawGuest) : CONFIG.defaultGuestName;
  const slug = createSlug(display) || "friend";
  const inviteId = normalizeInviteId(params.get("id") || slug);

  return {
    raw: rawGuest || CONFIG.defaultGuestName,
    display,
    slug,
    inviteId,
  };
}

function personaliseInvitation() {
  currentGuest = getGuestFromUrl();

  const greeting = document.getElementById("guest-greeting");
  const envelopeGuestName = document.getElementById("envelope-guest-name");

  if (greeting) {
    greeting.textContent = `Dear ${currentGuest.display},`;
  }

  if (envelopeGuestName) {
    envelopeGuestName.textContent = currentGuest.display;
  }
}

function createParticle(index) {
  const particle = document.createElement("span");
  const size = (Math.random() * 8 + 4).toFixed(2);
  const left = (Math.random() * 100).toFixed(2);
  const duration = (Math.random() * 11 + 13).toFixed(2);
  const delay = (Math.random() * 6).toFixed(2);
  const travel = (Math.random() * 110 - 55).toFixed(2);

  particle.className = "particle";
  if (index % 3 === 0) {
    particle.classList.add("is-soft");
  }
  if (index % 5 === 0) {
    particle.classList.add("is-bright");
  }

  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.left = `${left}%`;
  particle.style.animationDuration = `${duration}s`;
  particle.style.animationDelay = `${delay}s`;
  particle.style.setProperty("--travel-x", `${travel}px`);

  return particle;
}

function initParticles() {
  const container = document.getElementById("particles");
  if (!container) {
    return;
  }

  const fragment = document.createDocumentFragment();
  for (let index = 0; index < CONFIG.particleCount; index += 1) {
    fragment.appendChild(createParticle(index));
  }
  container.appendChild(fragment);
}

function updateEnvelopeUi() {
  const mailpiece = document.getElementById("mailpiece");
  const hint = document.getElementById("envelope-hint");
  const turnLabel = document.getElementById("turn-envelope-label");
  const turnButton = document.getElementById("turn-envelope-button");
  const openButton = document.getElementById("open-envelope-button");

  if (!mailpiece || !hint || !turnLabel || !turnButton || !openButton) {
    return;
  }

  mailpiece.classList.toggle("is-front", envelopeFacingFront);

  if (!envelopeFacingFront) {
    hint.textContent = "Start by turning the envelope over";
    turnLabel.textContent = "Turn envelope";
    turnButton.disabled = false;
    openButton.disabled = true;
    return;
  }

  hint.textContent = "Now click the seal to open the invitation";
  turnLabel.textContent = "Turn back";
  turnButton.disabled = false;
  openButton.disabled = false;
}

function flipEnvelope() {
  if (envelopeOpened) {
    return;
  }

  envelopeFacingFront = !envelopeFacingFront;
  updateEnvelopeUi();
}

function revealCardScreen() {
  const envelopeScreen = document.getElementById("envelope-screen");
  const cardScreen = document.getElementById("card-screen");
  const invitationCard = document.getElementById("invitation-card");

  if (cardScreen) {
    cardScreen.removeAttribute("aria-hidden");
    requestAnimationFrame(() => {
      cardScreen.classList.add("active");
      if (invitationCard) {
        invitationCard.focus({ preventScroll: true });
      }
    });
  }

  if (envelopeScreen) {
    window.setTimeout(() => {
      envelopeScreen.classList.remove("active");
      envelopeScreen.setAttribute("aria-hidden", "true");
    }, CONFIG.envelopeDropDuration);
  }
}

function openEnvelope() {
  const mailpiece = document.getElementById("mailpiece");
  const hint = document.getElementById("envelope-hint");
  const openButton = document.getElementById("open-envelope-button");
  const turnButton = document.getElementById("turn-envelope-button");

  if (envelopeOpened || !envelopeFacingFront) {
    return;
  }

  envelopeOpened = true;

  if (mailpiece) {
    mailpiece.classList.add("is-opening");
  }

  if (hint) {
    hint.textContent = "Unsealing your invitation";
  }

  if (openButton) {
    openButton.disabled = true;
  }

  if (turnButton) {
    turnButton.disabled = true;
  }

  window.setTimeout(() => {
    if (mailpiece) {
      mailpiece.classList.add("is-letter-rising");
      mailpiece.classList.add("is-departing");
    }
  }, CONFIG.flapLiftDelay);

  window.setTimeout(revealCardScreen, CONFIG.flapLiftDelay);
}

function initEnvelopeInteraction() {
  const turnButton = document.getElementById("turn-envelope-button");
  const openButton = document.getElementById("open-envelope-button");
  const mailpiece = document.getElementById("mailpiece");

  if (!turnButton || !openButton || !mailpiece) {
    return;
  }

  turnButton.addEventListener("click", flipEnvelope);

  mailpiece.addEventListener("click", (event) => {
    if (
      event.target.closest("#open-envelope-button") ||
      event.target.closest("#turn-envelope-button")
    ) {
      return;
    }

    if (!envelopeFacingFront && !envelopeOpened) {
      flipEnvelope();
    }
  });

  mailpiece.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      if (!envelopeFacingFront && !envelopeOpened) {
        event.preventDefault();
        flipEnvelope();
      }
    }
  });

  openButton.addEventListener("click", openEnvelope);
  updateEnvelopeUi();
}

function updateCardUi() {
  const invitationCard = document.getElementById("invitation-card");
  if (!invitationCard) {
    return;
  }

  invitationCard.classList.toggle("is-flipped", cardFlipped);
}

function flipCard(showBack) {
  cardFlipped = typeof showBack === "boolean" ? showBack : !cardFlipped;
  updateCardUi();
}

function initCardFlip() {
  const frontButton = document.getElementById("flip-card-button");
  const backButton = document.getElementById("flip-card-back-button");

  if (frontButton) {
    frontButton.addEventListener("click", () => {
      flipCard(true);
    });
  }

  if (backButton) {
    backButton.addEventListener("click", () => {
      flipCard(false);
    });
  }

  updateCardUi();
}

function getResponseStorageKey() {
  return `${CONFIG.storageKeyPrefix}${currentGuest.inviteId}`;
}

function getRsvpTimestamp() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date());
}

function saveLocalResponse(response) {
  try {
    const payload = JSON.stringify({
      response,
      timestamp: getRsvpTimestamp(),
    });
    window.localStorage.setItem(getResponseStorageKey(), payload);
  } catch (error) {
    console.warn("Unable to save RSVP locally.", error);
  }
}

function readStoredResponse() {
  try {
    const stored = window.localStorage.getItem(getResponseStorageKey());
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn("Unable to read stored RSVP response.", error);
    return null;
  }
}

function buildSheetsUrl(response) {
  const url = new URL(CONFIG.sheetsUrl);
  url.searchParams.set("name", currentGuest.display);
  url.searchParams.set("guestId", currentGuest.inviteId);
  url.searchParams.set("guestSlug", currentGuest.slug);
  url.searchParams.set(
    "inviteLink",
    `${window.location.origin}${window.location.pathname}?guest=${encodeURIComponent(currentGuest.slug)}&id=${encodeURIComponent(currentGuest.inviteId)}`
  );
  url.searchParams.set("response", response);
  url.searchParams.set("timestamp", getRsvpTimestamp());
  return url;
}

function sendSheetsBeacon(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = url;
  });
}

async function submitToSheets(response) {
  if (CONFIG.sheetsUrl.includes("YOUR_DEPLOYMENT_ID")) {
    console.info("Sheets endpoint not configured yet.");
    return;
  }

  const url = buildSheetsUrl(response);

  try {
    await fetch(url.toString(), {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
    });
  } catch (error) {
    console.warn("Fetch submit failed, retrying with image beacon.", error);
  }

  try {
    await sendSheetsBeacon(url.toString());
  } catch (error) {
    console.warn("RSVP could not be submitted to Google Sheets.", error);
  }
}

function updateRsvpUi(response) {
  const attendButton = document.getElementById("btn-attend");
  const declineButton = document.getElementById("btn-decline");
  const confirmation = document.getElementById("rsvp-confirmation");
  const confirmationText = document.getElementById("rsvp-confirmation-text");

  if (!attendButton || !declineButton || !confirmation || !confirmationText) {
    return;
  }

  const attending = response === "Attending";

  attendButton.classList.toggle("selected", attending);
  declineButton.classList.toggle("selected", !attending);
  attendButton.disabled = true;
  declineButton.disabled = true;
  attendButton.setAttribute("aria-pressed", String(attending));
  declineButton.setAttribute("aria-pressed", String(!attending));

  confirmationText.textContent = attending
    ? `Thank you, ${currentGuest.display}. We look forward to celebrating with you.`
    : `Thank you for letting us know, ${currentGuest.display}. You will be missed.`;
  confirmation.hidden = false;
}

function initRsvp() {
  const attendButton = document.getElementById("btn-attend");
  const declineButton = document.getElementById("btn-decline");

  if (!attendButton || !declineButton) {
    return;
  }

  const applyResponse = async (response) => {
    updateRsvpUi(response);
    saveLocalResponse(response);
    await submitToSheets(response);
  };

  attendButton.addEventListener("click", () => {
    void applyResponse("Attending");
  });

  declineButton.addEventListener("click", () => {
    void applyResponse("Not Attending");
  });

  const stored = readStoredResponse();
  if (stored && stored.response) {
    updateRsvpUi(stored.response);
  }
}

function hideLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) {
    return;
  }

  overlay.classList.add("hidden");
  window.setTimeout(() => overlay.remove(), 650);
}

function init() {
  personaliseInvitation();
  initParticles();
  initEnvelopeInteraction();
  initCardFlip();
  initRsvp();
  window.setTimeout(hideLoading, CONFIG.loadingDelay);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

window.generateLinks = function generateLinks(names) {
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const links = names.map((entry, index) => {
    const rawName =
      typeof entry === "string"
        ? entry
        : entry && typeof entry === "object"
          ? entry.name
          : "";
    const displayName = titleCase(String(rawName));
    const slug = createSlug(displayName) || `guest-${index + 1}`;
    const inviteId = normalizeInviteId(
      entry && typeof entry === "object" && entry.id
        ? entry.id
        : `g${String(index + 1).padStart(3, "0")}`
    );

    return {
      name: displayName,
      id: inviteId,
      url: `${baseUrl}?guest=${encodeURIComponent(slug)}&id=${encodeURIComponent(inviteId)}`,
    };
  });

  console.log("\nPersonalised invitation links:\n");
  console.table(links);
  return links;
};
