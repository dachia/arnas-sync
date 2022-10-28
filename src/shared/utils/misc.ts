export const misToMinKm = (val: number): string => {
  const kmh = ((val * 60 * 60) / 1000)
  const minKm = 60 / kmh
  const min = Math.floor(minKm)
  const sec = (minKm - Math.floor(minKm)) * 60
  return `${min.toFixed(0).padStart(2, "0")}:${sec.toFixed(0).padStart(2, "0")}`
}
export const mToKm = (val: number): string => `${(val / 1000).toFixed(2).padStart(2, "0")}`
export const secToH = (val: number): string => {
  if (!val) return ``
  const h = Math.floor(val / 3600)
  const sec = Math.floor((val % 3600) / 60)
  return `${h.toFixed(0).padStart(2, "0")}:${sec.toFixed(0).padStart(2, "0")}`
}
