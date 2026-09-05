// Load PostHog once for every page in the site.
// This project uses manual events so form fields and student details are not autocaptured.
(function loadPostHog(documentObject, posthog) {
  if (posthog.__SV) return;

  window.posthog = posthog;
  posthog._i = [];
  posthog.init = function init(projectKey, config, name) {
    function addMethod(target, method) {
      target[method] = function queuedMethod() {
        target.push([method].concat(Array.prototype.slice.call(arguments)));
      };
    }

    const script = documentObject.createElement("script");
    script.type = "text/javascript";
    script.crossOrigin = "anonymous";
    script.async = true;
    script.src = config.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js";
    documentObject.getElementsByTagName("script")[0].parentNode.insertBefore(script, documentObject.getElementsByTagName("script")[0]);

    let instance = posthog;
    if (name !== undefined) instance = posthog[name] = [];
    else name = "posthog";

    instance.people = instance.people || [];
    [
      "capture", "identify", "alias", "reset", "set_config", "opt_in_capturing",
      "opt_out_capturing", "has_opted_in_capturing", "has_opted_out_capturing",
      "start_session_recording", "stop_session_recording"
    ].forEach((method) => addMethod(instance, method));

    posthog._i.push([projectKey, config, name]);
  };
  posthog.__SV = 1;
})(document, window.posthog || []);

posthog.init("phc_zQYes3SypTDY4BpZmoZUCpECSs3PDgTY2HaX4EuLfqXN", {
  api_host: "https://us.i.posthog.com",
  autocapture: false,
  capture_pageview: true,
  capture_pageleave: true,
  disable_session_recording: true,
  person_profiles: "identified_only"
});
