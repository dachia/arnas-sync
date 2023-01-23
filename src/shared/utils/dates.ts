import startOfWeek from 'date-fns/startOfWeek'
import { subDays as subDaysFns } from 'date-fns'
import eachDayOfInterval from 'date-fns/eachDayOfInterval'
import eachWeekOfInterval from "date-fns/eachWeekOfInterval"
import getWeekFns from 'date-fns/getWeek'
import formatFns from 'date-fns/format'

const locale = "lt-lt"

export function subDays(date: Date, days: number): Date {
  return subDaysFns(date, days)
}

export function getWeek(date: Date): number {
  return getWeekFns(date, { weekStartsOn: 1 })
}
export function getStartOfWeek(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}
export function getMonthDayNumber(date: Date): number {
  return date.getDate()
}

export function getYearName(date: Date): string {
  return date.toLocaleDateString(locale, { year: "numeric" })
}

export function getMonthName(date: Date): string {
  return date.toLocaleDateString(locale, { month: "long" })
}

export function getStartOfDay(date: Date): Date {
  const start = new Date(date.getTime());
  start.setUTCHours(0, 0, 0, 0);
  return start
}

export function formatDate(date: Date): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
}

export function getEndOfDay(date: Date): Date {
  const end = new Date(date.getTime());
  end.setUTCHours(23, 59, 59, 999);
  return end
}

export function getMonday(date: Date): Date {
  const d = date;
  const day = d.getDay()
  const diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}

export function getEachDayOfInterval(interval: { start: Date, end: Date }): Array<Date> {
  return eachDayOfInterval(interval)
}

export function getEachWeekOfInterval(interval: { start: Date, end: Date }): Array<Date> {
  return eachWeekOfInterval(interval, { weekStartsOn: 1 })
}

export function parseStringDate(date: string): Date {
  if (date == null) return null

  return new Date(Date.parse(date))
}

export function format(date: Date): string {
  return formatFns(date, 'yyyy-MM-dd')
}