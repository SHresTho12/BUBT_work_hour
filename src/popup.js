// document.addEventListener("DOMContentLoaded", async () => {
//   const messageDiv = document.getElementById("message");
//   const weeklyHoursDiv = document.getElementById("weeklyHours");
//   const prevWeeklyHoursDiv = document.getElementById("prevWeeklyHours"); // New
//   const monthlyHoursDiv = document.getElementById("monthlyHours");
//   const prevMonthlyHoursDiv = document.getElementById("prevMonthlyHours");

//   const weeklyValueSpan = document.getElementById("weeklyValue");
//   const prevWeeklyValueSpan = document.getElementById("prevWeeklyValue"); // New
//   const monthlyValueSpan = document.getElementById("monthlyValue");
//   const prevMonthlyValueSpan = document.getElementById("prevMonthlyValue");

//   const togglePrevMonthBtn = document.getElementById("togglePrevMonthBtn"); // Renamed button

//   messageDiv.textContent = "Fetching attendance data...";

//   try {
//     const [tab] = await chrome.tabs.query({
//       active: true,
//       currentWindow: true,
//     });

//     if (
//       !tab ||
//       !tab.url ||
//       !tab.url.startsWith("http://hr.bubt.edu.bd/bubt/Dashboard.aspx")
//     ) {
//       messageDiv.className = "error";
//       messageDiv.textContent =
//         "Please navigate to http://hr.bubt.edu.bd/bubt/Dashboard.aspx to see attendance data.";
//       return;
//     }

//     chrome.tabs.sendMessage(
//       tab.id,
//       { action: "getAttendanceData" },
//       (response) => {
//         if (chrome.runtime.lastError) {
//           console.error(
//             "Error sending message or content script not ready:",
//             chrome.runtime.lastError.message
//           );
//           messageDiv.className = "error";
//           messageDiv.textContent =
//             "Failed to get data. Ensure you are on the BUBT HR Dashboard.";
//           return;
//         }

//         if (response && response.status === "success") {
//           const {
//             weeklyHours,
//             prevWeeklyHours,
//             monthlyHours,
//             prevMonthlyHours,
//           } = response.data; // Destructure new field
//           messageDiv.style.display = "none";

//           weeklyValueSpan.textContent = weeklyHours;
//           prevWeeklyValueSpan.textContent = prevWeeklyHours; // Display prev week

//           monthlyValueSpan.textContent = monthlyHours;

//           weeklyHoursDiv.style.display = "block";
//           prevWeeklyHoursDiv.style.display = "block"; // Show prev week div
//           monthlyHoursDiv.style.display = "block";
//           togglePrevMonthBtn.style.display = "block";

//           // Toggle logic for previous month
//           togglePrevMonthBtn.onclick = () => {
//             if (prevMonthlyHoursDiv.style.display === "none") {
//               prevMonthlyValueSpan.textContent = prevMonthlyHours;
//               prevMonthlyHoursDiv.style.display = "block";
//               togglePrevMonthBtn.textContent = "Hide Previous Month";
//             } else {
//               prevMonthlyHoursDiv.style.display = "none";
//               togglePrevMonthBtn.textContent = "Toggle Previous Month";
//             }
//           };
//         } else if (response && response.status === "error") {
//           messageDiv.className = "error";
//           messageDiv.textContent = response.message;
//         } else {
//           messageDiv.className = "error";
//           messageDiv.textContent = "No data received from the page.";
//         }
//       }
//     );
//   } catch (error) {
//     console.error("Popup script error:", error);
//     messageDiv.className = "error";
//     messageDiv.textContent = `An unexpected error occurred: ${error.message}`;
//   }
// });

document.addEventListener("DOMContentLoaded", async () => {
  const messageDiv = document.getElementById("message");
  const weeklyHoursDiv = document.getElementById("weeklyHours");
  const weeklyLeftDiv = document.getElementById("weeklyLeft"); // new
  const prevWeeklyHoursDiv = document.getElementById("prevWeeklyHours");
  const monthlyHoursDiv = document.getElementById("monthlyHours");
  const prevMonthlyHoursDiv = document.getElementById("prevMonthlyHours");

  const weeklyValueSpan = document.getElementById("weeklyValue");
  const weeklyLeftValueSpan = document.getElementById("weeklyLeftValue"); // new
  const prevWeeklyValueSpan = document.getElementById("prevWeeklyValue");
  const monthlyValueSpan = document.getElementById("monthlyValue");
  const prevMonthlyValueSpan = document.getElementById("prevMonthlyValue");

  const togglePrevMonthBtn = document.getElementById("togglePrevMonthBtn");

  messageDiv.textContent = "Fetching attendance data...";

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab || !tab.url || !tab.url.includes("bubt/Dashboard.aspx")) {
      messageDiv.className = "error";
      messageDiv.textContent =
        "Please open http://hr.bubt.edu.bd/bubt/Dashboard.aspx.";
      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      { action: "getAttendanceData" },
      (response) => {
        if (!response || response.status === "error") {
          messageDiv.className = "error";
          messageDiv.textContent = response
            ? response.message
            : "No data received.";
          return;
        }

        const {
          weeklyHours,
          weeklyHoursLeft,
          prevWeeklyHours,
          monthlyHours,
          prevMonthlyHours,
        } = response.data;

        messageDiv.style.display = "none";
        weeklyValueSpan.textContent = weeklyHours;
        weeklyLeftValueSpan.textContent = weeklyHoursLeft;
        prevWeeklyValueSpan.textContent = prevWeeklyHours;
        monthlyValueSpan.textContent = monthlyHours;

        weeklyHoursDiv.style.display = "block";
        weeklyLeftDiv.style.display = "block";
        prevWeeklyHoursDiv.style.display = "block";
        monthlyHoursDiv.style.display = "block";
        togglePrevMonthBtn.style.display = "block";

        togglePrevMonthBtn.onclick = () => {
          const visible = prevMonthlyHoursDiv.style.display !== "none";
          prevMonthlyValueSpan.textContent = prevMonthlyHours;
          prevMonthlyHoursDiv.style.display = visible ? "none" : "block";
          togglePrevMonthBtn.textContent = visible
            ? "Toggle Previous Month"
            : "Hide Previous Month";
        };
      }
    );
  } catch (err) {
    messageDiv.className = "error";
    messageDiv.textContent = err.message;
  }
});
