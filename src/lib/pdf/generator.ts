/**
 * PDF Generation Utilities for Strenx Fitness
 *
 * This module provides utilities for generating PDF exports of nutrition
 * and training plans. Uses browser-native functionality for basic PDF generation.
 *
 * For production, consider using @react-pdf/renderer for more advanced layouts.
 */

export interface NutritionPlanData {
  clientName: string;
  planName: string;
  startDate: string;
  endDate: string;
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  meals: Array<{
    name: string;
    time: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    items: Array<{
      name: string;
      portion: string;
      calories: number;
    }>;
  }>;
  notes?: string;
}

export interface TrainingPlanData {
  clientName: string;
  planName: string;
  startDate: string;
  endDate: string;
  daysPerWeek: number;
  focus: string;
  days: Array<{
    name: string;
    muscleGroups: string[];
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      rest: string;
      notes?: string;
    }>;
  }>;
  generalNotes?: string;
}

/**
 * Generate HTML content for nutrition plan PDF
 */
export function generateNutritionPlanHTML(data: NutritionPlanData): string {
  const mealsHTML = data.meals
    .map(
      (meal) => `
      <div class="meal">
        <div class="meal-header">
          <h3>${meal.name}</h3>
          <span class="meal-time">${meal.time}</span>
        </div>
        <div class="meal-macros">
          <span>${meal.calories} kcal</span>
          <span>P: ${meal.protein}g</span>
          <span>C: ${meal.carbs}g</span>
          <span>F: ${meal.fat}g</span>
        </div>
        <ul class="meal-items">
          ${meal.items.map((item) => `<li>${item.name} - ${item.portion} (${item.calories} kcal)</li>`).join("")}
        </ul>
      </div>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${data.planName} - ${data.clientName}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1c1917;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #d97706;
        }
        .logo { font-size: 28px; font-weight: bold; color: #d97706; }
        h1 { font-size: 24px; margin: 10px 0; }
        .client-name { color: #78716c; }
        .dates { font-size: 14px; color: #a8a29e; margin-top: 5px; }
        .summary {
          display: flex;
          justify-content: space-around;
          background: #fef3c7;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .summary-item { text-align: center; }
        .summary-value { font-size: 24px; font-weight: bold; color: #d97706; }
        .summary-label { font-size: 12px; color: #78716c; }
        .meal {
          background: #fafaf9;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .meal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .meal-header h3 { font-size: 18px; color: #d97706; }
        .meal-time { color: #78716c; font-size: 14px; }
        .meal-macros {
          display: flex;
          gap: 15px;
          font-size: 14px;
          color: #57534e;
          margin-bottom: 15px;
        }
        .meal-items {
          list-style: none;
          padding-left: 0;
        }
        .meal-items li {
          padding: 8px 0;
          border-bottom: 1px solid #e7e5e4;
          font-size: 14px;
        }
        .meal-items li:last-child { border-bottom: none; }
        .notes {
          margin-top: 30px;
          padding: 20px;
          background: #ecfdf5;
          border-radius: 8px;
        }
        .notes h3 { color: #059669; margin-bottom: 10px; }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #a8a29e;
        }
        @media print {
          body { padding: 20px; }
          .meal { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Strenx Fitness</div>
        <h1>${data.planName}</h1>
        <p class="client-name">Prepared for: ${data.clientName}</p>
        <p class="dates">${data.startDate} - ${data.endDate}</p>
      </div>

      <div class="summary">
        <div class="summary-item">
          <div class="summary-value">${data.totalCalories}</div>
          <div class="summary-label">Daily Calories</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${data.macros.protein}g</div>
          <div class="summary-label">Protein</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${data.macros.carbs}g</div>
          <div class="summary-label">Carbs</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${data.macros.fat}g</div>
          <div class="summary-label">Fat</div>
        </div>
      </div>

      ${mealsHTML}

      ${data.notes ? `<div class="notes"><h3>Notes</h3><p>${data.notes}</p></div>` : ""}

      <div class="footer">
        <p>Generated by Strenx Fitness</p>
        <p>This plan is personalized for ${data.clientName}. Do not share.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML content for training plan PDF
 */
export function generateTrainingPlanHTML(data: TrainingPlanData): string {
  const daysHTML = data.days
    .map(
      (day) => `
      <div class="day">
        <div class="day-header">
          <h3>${day.name}</h3>
          <span class="muscle-groups">${day.muscleGroups.join(", ")}</span>
        </div>
        <table class="exercises">
          <thead>
            <tr>
              <th>Exercise</th>
              <th>Sets</th>
              <th>Reps</th>
              <th>Rest</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${day.exercises
              .map(
                (ex) => `
              <tr>
                <td>${ex.name}</td>
                <td>${ex.sets}</td>
                <td>${ex.reps}</td>
                <td>${ex.rest}</td>
                <td>${ex.notes || "-"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${data.planName} - ${data.clientName}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1c1917;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #7c3aed;
        }
        .logo { font-size: 28px; font-weight: bold; color: #d97706; }
        h1 { font-size: 24px; margin: 10px 0; }
        .client-name { color: #78716c; }
        .dates { font-size: 14px; color: #a8a29e; margin-top: 5px; }
        .summary {
          display: flex;
          justify-content: space-around;
          background: #ede9fe;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .summary-item { text-align: center; }
        .summary-value { font-size: 24px; font-weight: bold; color: #7c3aed; }
        .summary-label { font-size: 12px; color: #78716c; }
        .day {
          background: #fafaf9;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .day-header h3 { font-size: 18px; color: #7c3aed; }
        .muscle-groups { color: #78716c; font-size: 14px; }
        .exercises {
          width: 100%;
          border-collapse: collapse;
        }
        .exercises th, .exercises td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #e7e5e4;
          font-size: 14px;
        }
        .exercises th {
          background: #f5f5f4;
          font-weight: 600;
          color: #57534e;
        }
        .notes {
          margin-top: 30px;
          padding: 20px;
          background: #fef3c7;
          border-radius: 8px;
        }
        .notes h3 { color: #d97706; margin-bottom: 10px; }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #a8a29e;
        }
        @media print {
          body { padding: 20px; }
          .day { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Strenx Fitness</div>
        <h1>${data.planName}</h1>
        <p class="client-name">Prepared for: ${data.clientName}</p>
        <p class="dates">${data.startDate} - ${data.endDate}</p>
      </div>

      <div class="summary">
        <div class="summary-item">
          <div class="summary-value">${data.daysPerWeek}</div>
          <div class="summary-label">Days/Week</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${data.focus}</div>
          <div class="summary-label">Focus</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${data.days.reduce((sum, d) => sum + d.exercises.length, 0)}</div>
          <div class="summary-label">Total Exercises</div>
        </div>
      </div>

      ${daysHTML}

      ${data.generalNotes ? `<div class="notes"><h3>General Notes</h3><p>${data.generalNotes}</p></div>` : ""}

      <div class="footer">
        <p>Generated by Strenx Fitness</p>
        <p>This plan is personalized for ${data.clientName}. Do not share.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Open print dialog for PDF generation (browser-native approach)
 */
export function printPlan(html: string): void {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

/**
 * Download plan as HTML file (can be opened in browser and printed to PDF)
 */
export function downloadPlanAsHTML(html: string, filename: string): void {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
