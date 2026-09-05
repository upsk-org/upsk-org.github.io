import posthog from "posthog-js";

posthog.init("phc_zQYes3SypTDY4BpZmoZUCpECSs3PDgTY2HaX4EuLfqXN", {
  api_host: "https://us.i.posthog.com",
  defaults: "2026-05-30"
});

// Make the SDK available to the event tracking in script.js.
window.posthog = posthog;

// Send any interactions that happened while the SDK was still loading.
const queuedEvents = window.posthogEventQueue || [];
queuedEvents.forEach(([eventName, properties]) => posthog.capture(eventName, properties));
window.posthogEventQueue = [];

export default posthog;
