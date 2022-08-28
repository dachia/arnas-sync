const locale = "lt-lt"
export function getMonthDayNumber(): number {
  return new Date().getDate()
}

export function getCurrentYearName(): string {
  return new Date().toLocaleDateString(locale, { year: "numeric" })
}

export function getCurrentMonthName(): string {
  return new Date().toLocaleDateString(locale, { month: "long" })
}
