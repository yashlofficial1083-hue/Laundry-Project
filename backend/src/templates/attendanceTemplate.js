module.exports = function attendanceTemplate({ employeeName, from, to, rows }) {
    return `
    <html>
      <head>
        <style>
          body { font-family: Arial; padding: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ccc; padding: 6px; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h2>Attendance Report</h2>
        <div>
          <strong>${employeeName}</strong><br/>
          From ${from} to ${to}
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Punch In</th>
              <th>Punch Out</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length === 0
            ? `<tr><td colspan="3">No attendance found</td></tr>`
            : rows
                .map(
                    (r) => `
              <tr>
                <td>${r.attendance_date}</td>
                <td>${r.punch_in || "-"}</td>
                <td>${r.punch_out || "-"}</td>
              </tr>`
                )
                .join("")
        }
          </tbody>
        </table>
      </body>
    </html>
  `;
};
