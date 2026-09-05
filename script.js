// Keep the copyright year current anywhere a footer year is displayed.
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// Send a named event when PostHog is available without interrupting the site if it is blocked.
function trackEvent(eventName, properties = {}) {
  if (window.posthog && typeof window.posthog.capture === "function") {
    window.posthog.capture(eventName, properties);
  } else {
    // Keep early interactions until the telemetry module finishes loading.
    window.posthogEventQueue = window.posthogEventQueue || [];
    window.posthogEventQueue.push([eventName, properties]);
  }
}

// Measure how often visitors continue from the homepage into the tutor directory.
const findTutorLink = document.querySelector('a[href="tutors.html"]');
if (findTutorLink) {
  findTutorLink.addEventListener("click", () => trackEvent("find_tutor_clicked"));
}

// Temporary tutor data used to populate the directory.
// Each tutor includes their profile details, filter categories, and possible times.
const tutors = [
  { id: 1, name: "Maya Thompson", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=85", subjects: ["Math", "Science"], grades: ["elementary", "middle"], gradeLabel: "Grades K–8", rate: 42, times: ["afternoon", "evening"], slots: ["3:30 PM", "5:00 PM"] },
  { id: 2, name: "Daniel Kim", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=85", subjects: ["Math", "Physics"], grades: ["middle", "high"], gradeLabel: "Grades 6–12", rate: 50, times: ["evening"], slots: ["5:30 PM", "7:00 PM"] },
  { id: 3, name: "Sofia Ramirez", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=85", subjects: ["English", "Spanish"], grades: ["elementary", "middle", "high"], gradeLabel: "Grades K–12", rate: 45, times: ["morning", "afternoon"], slots: ["10:00 AM", "1:00 PM", "3:00 PM"] },
  { id: 4, name: "Marcus Johnson", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=85", subjects: ["History", "English"], grades: ["middle", "high"], gradeLabel: "Grades 6–12", rate: 46, times: ["afternoon", "evening"], slots: ["4:00 PM", "6:00 PM"] },
  { id: 5, name: "Emily Chen", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=85", subjects: ["Math", "Science"], grades: ["elementary"], gradeLabel: "Grades K–5", rate: 40, times: ["morning", "afternoon"], slots: ["9:30 AM", "2:30 PM"] },
  { id: 6, name: "Noah Williams", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=85", subjects: ["Science", "Biology"], grades: ["middle", "high"], gradeLabel: "Grades 6–12", rate: 48, times: ["evening"], slots: ["5:00 PM", "6:30 PM", "8:00 PM"] }
];

const tutorGrid = document.getElementById("tutor-grid");

// Only run the tutor directory code when the tutor grid exists on the page.
if (tutorGrid) {
  // Store references to the filters, results message, empty state, and dialog.
  const subjectFilter = document.getElementById("subject-filter");
  const gradeFilter = document.getElementById("grade-filter");
  const availabilityFilter = document.getElementById("availability-filter");
  const resultsCount = document.getElementById("results-count");
  const emptyResults = document.getElementById("empty-results");
  const dialog = document.getElementById("availability-dialog");
  let activeTutor = null;

  // Filter the tutor data and redraw the matching profile cards.
  function renderTutors() {
    const matches = tutors.filter((tutor) => {
      const subjectMatches = subjectFilter.value === "all" || tutor.subjects.includes(subjectFilter.value);
      const gradeMatches = gradeFilter.value === "all" || tutor.grades.includes(gradeFilter.value);
      const timeMatches = availabilityFilter.value === "all" || tutor.times.includes(availabilityFilter.value);
      return subjectMatches && gradeMatches && timeMatches;
    });

    resultsCount.textContent = `${matches.length} tutor${matches.length === 1 ? "" : "s"} available`;
    emptyResults.hidden = matches.length !== 0;
    // Convert every matching tutor into a clickable card.
    tutorGrid.innerHTML = matches.map((tutor) => `
      <button class="tutor-card" type="button" data-tutor-id="${tutor.id}" aria-label="View ${tutor.name}'s availability">
        <img src="${tutor.photo}" alt="${tutor.name}" loading="lazy">
        <span class="tutor-card-body">
          <span class="tutor-name-row"><strong>${tutor.name}</strong><span class="rate">$${tutor.rate}<small>/hour</small></span></span>
          <span class="subject-tags">${tutor.subjects.map((subject) => `<span>${subject}</span>`).join("")}</span>
          <span class="grade-line"><span aria-hidden="true">◉</span> ${tutor.gradeLabel}</span>
          <span class="view-availability">View availability <span aria-hidden="true">→</span></span>
        </span>
      </button>`).join("");
  }

  // Fill and open the weekly availability dialog for the selected tutor.
  function openAvailability(tutor) {
    activeTutor = tutor;
    trackEvent("tutor_profile_viewed", {
      tutor_name: tutor.name,
      subjects: tutor.subjects,
      grade_levels: tutor.gradeLabel,
      hourly_rate: tutor.rate
    });
    document.getElementById("dialog-photo").src = tutor.photo;
    document.getElementById("dialog-photo").alt = tutor.name;
    document.getElementById("dialog-title").textContent = tutor.name;
    document.getElementById("dialog-details").textContent = `${tutor.subjects.join(" · ")} | ${tutor.gradeLabel} | $${tutor.rate}/hour`;

    const calendar = document.getElementById("week-calendar");

    // Begin with tomorrow because sessions require at least one day's notice.
    const start = new Date();
    start.setDate(start.getDate() + 1);
    // Build seven calendar days and give each one a sample set of openings.
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const available = index !== 3 && index !== 6;
      const times = available ? tutor.slots.slice(0, index % 3 === 0 ? 1 : tutor.slots.length) : [];
      return { date, times };
    });

    // Count all available times so the dialog can show a useful summary.
    const totalSlots = days.reduce((sum, day) => sum + day.times.length, 0);
    document.getElementById("slot-count").textContent = totalSlots;
    calendar.innerHTML = days.map(({ date, times }) => `
      <div class="calendar-day ${times.length ? "" : "unavailable"}">
        <div class="calendar-date"><span>${date.toLocaleDateString("en-US", { weekday: "short" })}</span><strong>${date.getDate()}</strong></div>
        <div class="calendar-times">${times.length ? times.map((time) => {
          const dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          // Pass the chosen tutor, date, time, and subjects to the booking page.
          const bookingUrl = `booking.html?tutor=${encodeURIComponent(tutor.name)}&date=${encodeURIComponent(dateLabel)}&time=${encodeURIComponent(time)}&subjects=${encodeURIComponent(tutor.subjects.join(","))}`;
          return `<a href="${bookingUrl}" aria-label="Book ${tutor.name} on ${dateLabel} at ${time}">${time}</a>`;
        }).join("") : "<small>No openings</small>"}</div>
      </div>`).join("");
    dialog.showModal();
  }

  // Refresh the results whenever any filter changes.
  [subjectFilter, gradeFilter, availabilityFilter].forEach((filter) => filter.addEventListener("change", () => {
    renderTutors();
    trackEvent("tutor_filters_changed", {
      subject: subjectFilter.value,
      grade_level: gradeFilter.value,
      availability: availabilityFilter.value
    });
  }));

  // Reset every filter and restore the full directory.
  function clearFilters() {
    subjectFilter.value = gradeFilter.value = availabilityFilter.value = "all";
    renderTutors();
    trackEvent("tutor_filters_cleared");
  }
  document.getElementById("clear-filters").addEventListener("click", clearFilters);
  document.getElementById("empty-clear").addEventListener("click", clearFilters);
  // Use one click listener for all tutor cards, including cards drawn after filtering.
  tutorGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".tutor-card");
    if (card) openAvailability(tutors.find((tutor) => tutor.id === Number(card.dataset.tutorId)));
  });
  // Allow the dialog to close with its close button or by clicking the backdrop.
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    const timeLink = event.target.closest(".calendar-times a");
    if (timeLink && activeTutor) {
      const bookingUrl = new URL(timeLink.href);
      trackEvent("tutor_time_selected", {
        tutor_name: activeTutor.name,
        date: bookingUrl.searchParams.get("date"),
        time: bookingUrl.searchParams.get("time")
      });
    }
    if (event.target === dialog) dialog.close();
  });
  // Draw the complete tutor list when the directory first loads.
  renderTutors();
}

// Only run the booking code when the booking form exists on the page.
const bookingForm = document.getElementById("booking-form");
if (bookingForm) {
  // Read the tutor and session information passed from the selected calendar time.
  const bookingParams = new URLSearchParams(window.location.search);
  const selectedTutor = bookingParams.get("tutor");
  const selectedDate = bookingParams.get("date");
  const selectedTime = bookingParams.get("time");
  const offeredSubjects = (bookingParams.get("subjects") || "").split(",").filter(Boolean);
  // Show the selected appointment above the form.
  if (selectedTutor && selectedDate && selectedTime) {
    document.getElementById("booking-tutor").textContent = `Session with ${selectedTutor} on ${selectedDate} at ${selectedTime}.`;
  }
  // Limit the subject dropdown to subjects offered by the selected tutor.
  if (offeredSubjects.length) {
    const subjectSelect = document.getElementById("booking-subject");
    Array.from(subjectSelect.options).forEach((option) => {
      option.hidden = Boolean(option.value) && !offeredSubjects.includes(option.value);
    });
  }
  // This demo handles submission in the browser and displays a success message.
  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(bookingForm);
    trackEvent("booking_requested", {
      tutor_name: selectedTutor,
      date: selectedDate,
      time: selectedTime,
      requested_subject: formData.get("subject")
    });
    bookingForm.hidden = true;
    document.getElementById("booking-success").hidden = false;
  });
}
