function parseAttendanceData() {
  const dailyAttendanceTable = document.getElementById("MainContent_GridView2");
  if (!dailyAttendanceTable) {
    return { status: "error", message: "Attendance table not found." };
  }

  const rows = dailyAttendanceTable.querySelectorAll("tbody tr");
  const attendanceRecords = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length >= 7) {
      const dateSpan = cells[1]?.querySelector("span");
      const dayStatusSpan = cells[2]?.querySelector("span");
      const inTimeSpan = cells[3]?.querySelector("span"); // In time
      const workingHourSpan = cells[5]?.querySelector("span");

      const dateText = dateSpan ? dateSpan.textContent.trim() : "";
      const dayStatusText = dayStatusSpan
        ? dayStatusSpan.textContent.trim()
        : "";
      const workingHourText = workingHourSpan
        ? workingHourSpan.textContent.trim()
        : "";
      const inTimeText = inTimeSpan ? inTimeSpan.textContent.trim() : "";

      if (!dateText) return;

      const [day, month, yearPart] = dateText.split(" ");
      const formattedDateString = `${month} ${day}, ${yearPart.split(" ")[0]}`;
      const recordDate = new Date(formattedDateString);
      recordDate.setHours(0, 0, 0, 0);

      if (dayStatusText.toLowerCase() === "working day") {
        let totalWorkingSeconds = 0;

        if (workingHourText) {
          const [h, m, s] = workingHourText.split(":").map(Number);
          totalWorkingSeconds = h * 3600 + m * 60 + s;
        } else {
          // --- Handle "today" with ongoing work ---
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (recordDate.getTime() === today.getTime() && inTimeText) {
            // Parse in-time (e.g., "09:12 AM")
            const [timePart, meridiem] = inTimeText.split(" ");
            const [hourStr, minStr] = timePart.split(":");
            let hours = parseInt(hourStr);
            const minutes = parseInt(minStr);
            if (meridiem?.toLowerCase() === "pm" && hours < 12) hours += 12;
            if (meridiem?.toLowerCase() === "am" && hours === 12) hours = 0;

            const inDateTime = new Date();
            inDateTime.setHours(hours, minutes, 0, 0);

            const diffSeconds = Math.floor(
              (Date.now() - inDateTime.getTime()) / 1000
            );
            totalWorkingSeconds = Math.max(0, diffSeconds);
          }
        }

        attendanceRecords.push({
          date: recordDate,
          totalWorkingSeconds,
        });
      }
    }
  });

  if (attendanceRecords.length === 0) {
    return { status: "error", message: "No working day attendance found." };
  }

  attendanceRecords.sort((a, b) => a.date - b.date);

  // WEEKLY + MONTHLY CALCULATIONS
  let currentWeeklyHours = 0;
  let prevWeeklyHours = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentWeekMonday = new Date(today);
  const dow = today.getDay(); // 0 = Sun
  const daysToSubtract = dow === 0 ? 6 : dow - 1;
  currentWeekMonday.setDate(today.getDate() - daysToSubtract);
  currentWeekMonday.setHours(0, 0, 0, 0);

  const prevWeekMonday = new Date(currentWeekMonday);
  prevWeekMonday.setDate(currentWeekMonday.getDate() - 7);
  const prevWeekSunday = new Date(currentWeekMonday);
  prevWeekSunday.setDate(currentWeekMonday.getDate() - 1);
  prevWeekSunday.setHours(23, 59, 59, 999);

  attendanceRecords.forEach((entry) => {
    if (entry.date >= currentWeekMonday && entry.date <= today) {
      currentWeeklyHours += entry.totalWorkingSeconds;
    }
    if (entry.date >= prevWeekMonday && entry.date <= prevWeekSunday) {
      prevWeeklyHours += entry.totalWorkingSeconds;
    }
  });

  // Monthly 26th–25th
  let currentMonthlyHours = 0,
    prevMonthlyHours = 0;
  const monthNow = new Date();
  monthNow.setHours(0, 0, 0, 0);

  let curStart, curEnd, prevStart, prevEnd;
  if (monthNow.getDate() < 26) {
    curStart = new Date(monthNow.getFullYear(), monthNow.getMonth() - 1, 26);
    curEnd = new Date(
      monthNow.getFullYear(),
      monthNow.getMonth(),
      25,
      23,
      59,
      59,
      999
    );
    prevStart = new Date(monthNow.getFullYear(), monthNow.getMonth() - 2, 26);
    prevEnd = new Date(
      monthNow.getFullYear(),
      monthNow.getMonth() - 1,
      25,
      23,
      59,
      59,
      999
    );
  } else {
    curStart = new Date(monthNow.getFullYear(), monthNow.getMonth(), 26);
    curEnd = new Date(
      monthNow.getFullYear(),
      monthNow.getMonth() + 1,
      25,
      23,
      59,
      59,
      999
    );
    prevStart = new Date(monthNow.getFullYear(), monthNow.getMonth() - 1, 26);
    prevEnd = new Date(
      monthNow.getFullYear(),
      monthNow.getMonth(),
      25,
      23,
      59,
      59,
      999
    );
  }

  attendanceRecords.forEach((rec) => {
    if (rec.date >= curStart && rec.date <= curEnd)
      currentMonthlyHours += rec.totalWorkingSeconds;
    if (rec.date >= prevStart && rec.date <= prevEnd)
      prevMonthlyHours += rec.totalWorkingSeconds;
  });

  const weeklyTarget = 35 * 3600;
  const weeklyHoursLeft = Math.max(
    0,
    (weeklyTarget - currentWeeklyHours) / 3600
  );

  return {
    status: "success",
    data: {
      weeklyHours: (currentWeeklyHours / 3600).toFixed(2),
      prevWeeklyHours: (prevWeeklyHours / 3600).toFixed(2),
      monthlyHours: (currentMonthlyHours / 3600).toFixed(2),
      prevMonthlyHours: (prevMonthlyHours / 3600).toFixed(2),
      weeklyHoursLeft: weeklyHoursLeft.toFixed(2),
    },
  };
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "getAttendanceData") sendResponse(parseAttendanceData());
});
