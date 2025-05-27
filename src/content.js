// Function to parse HTML and calculate attendance data
function parseAttendanceData() {
  const dailyAttendanceTable = document.getElementById("MainContent_GridView2");

  if (!dailyAttendanceTable) {
    return {
      status: "error",
      message: "Attendance table not found on the page.",
    };
  }

  const attendanceRecords = [];

  const rows = dailyAttendanceTable.querySelectorAll("tbody tr");
  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");

    if (cells.length >= 7) {
      const dateSpan = cells[1].querySelector("span");
      const dayStatusSpan = cells[2].querySelector("span");
      const workingHourSpan = cells[5].querySelector("span");

      const dateText = dateSpan ? dateSpan.textContent.trim() : "";
      const dayStatusText = dayStatusSpan
        ? dayStatusSpan.textContent.trim()
        : "";
      const workingHourText = workingHourSpan
        ? workingHourSpan.textContent.trim()
        : "";

      if (dayStatusText.toLowerCase() === "working day" && workingHourText) {
        const [hours, minutes, seconds] = workingHourText
          .split(":")
          .map(Number);
        const totalWorkingSeconds = hours * 3600 + minutes * 60 + seconds;

        const [day, month, yearPart] = dateText.split(" ");
        const formattedDateString = `${month} ${day}, ${
          yearPart.split(" ")[0]
        }`; // Ensure year is just the number
        const recordDate = new Date(formattedDateString);
        recordDate.setHours(0, 0, 0, 0); // Normalize date to start of day for comparison

        attendanceRecords.push({
          date: recordDate,
          totalWorkingSeconds: totalWorkingSeconds,
        });
      }
    }
  });

  // Sort data by date in ascending order
  attendanceRecords.sort((a, b) => a.date.getTime() - b.date.getTime());

  if (attendanceRecords.length === 0) {
    return {
      status: "error",
      message: "No working day attendance data found in the table.",
    };
  }

  // --- Calculate Weekly Hours (Current Week: from Monday of the current week up to the latest record's date) ---
  let currentWeeklyHours = 0;
  let prevWeeklyHours = 0;

  const latestRecordDate = attendanceRecords[attendanceRecords.length - 1].date;

  // Determine the Monday of the week for the latest record date
  const currentWeekMonday = new Date(latestRecordDate);
  // getDay() returns 0 for Sunday, 1 for Monday, etc.
  // To get to Monday, subtract (currentDay - 1) days. If Sunday (0), it's 6 days back.
  const dayOfWeek = currentWeekMonday.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days to Monday
  currentWeekMonday.setDate(latestRecordDate.getDate() - daysToSubtract);
  currentWeekMonday.setHours(0, 0, 0, 0); // Set to start of the day

  // Calculate start and end for previous week
  const prevWeekMonday = new Date(currentWeekMonday);
  prevWeekMonday.setDate(currentWeekMonday.getDate() - 7);
  prevWeekMonday.setHours(0, 0, 0, 0);

  const prevWeekSunday = new Date(currentWeekMonday); // Sunday before current week's Monday
  prevWeekSunday.setDate(currentWeekMonday.getDate() - 1);
  prevWeekSunday.setHours(23, 59, 59, 999);

  attendanceRecords.forEach((entry) => {
    if (entry.date >= currentWeekMonday && entry.date <= latestRecordDate) {
      currentWeeklyHours += entry.totalWorkingSeconds;
    }
    if (entry.date >= prevWeekMonday && entry.date <= prevWeekSunday) {
      prevWeeklyHours += entry.totalWorkingSeconds;
    }
  });

  // --- Calculate Monthly Hours (Current Period: 25th of prev month to 24th of current/next month) ---
  let currentMonthlyHours = 0;
  const now = new Date(); // Use the actual current date for the monthly period calculation
  now.setHours(0, 0, 0, 0); // Normalize 'now' to start of day

  let currentPeriodStart;
  let currentPeriodEnd;

  if (now.getDate() < 25) {
    // If current date is before 25th, period is from 25th of (month-1) to 24th of current month
    currentPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 25);
    currentPeriodEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      24,
      23,
      59,
      59,
      999
    );
  } else {
    // If current date is on or after 25th, period is from 25th of current month to 24th of next month
    currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 25);
    currentPeriodEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      24,
      23,
      59,
      59,
      999
    );
  }
  currentPeriodStart.setHours(0, 0, 0, 0); // Ensure start is beginning of day

  attendanceRecords.forEach((record) => {
    if (record.date >= currentPeriodStart && record.date <= currentPeriodEnd) {
      currentMonthlyHours += record.totalWorkingSeconds;
    }
  });

  // --- Calculate Previous Monthly Hours (25th of prev-prev month to 24th of prev month) ---
  let prevMonthlyHours = 0;
  let prevPeriodStart;
  let prevPeriodEnd;

  if (now.getDate() < 25) {
    // If current date is before 25th, prev period is from 25th of (month-2) to 24th of (month-1)
    prevPeriodStart = new Date(now.getFullYear(), now.getMonth() - 2, 25);
    prevPeriodEnd = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      24,
      23,
      59,
      59,
      999
    );
  } else {
    // If current date is on or after 25th, prev period is from 25th of (month-1) to 24th of current month
    prevPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 25);
    prevPeriodEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      24,
      23,
      59,
      59,
      999
    );
  }
  prevPeriodStart.setHours(0, 0, 0, 0); // Ensure start is beginning of day

  attendanceRecords.forEach((record) => {
    if (record.date >= prevPeriodStart && record.date <= prevPeriodEnd) {
      prevMonthlyHours += record.totalWorkingSeconds;
    }
  });

  return {
    status: "success",
    data: {
      weeklyHours: (currentWeeklyHours / 3600).toFixed(2),
      prevWeeklyHours: (prevWeeklyHours / 3600).toFixed(2), // New field
      monthlyHours: (currentMonthlyHours / 3600).toFixed(2),
      prevMonthlyHours: (prevMonthlyHours / 3600).toFixed(2),
    },
  };
}

// Listener for messages from the popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getAttendanceData") {
    const result = parseAttendanceData();
    sendResponse(result);
  }
});
