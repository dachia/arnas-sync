export type BaseType = string | boolean | number | null

export type SessionType = BaseType | { [key: string]: SessionType } | SessionType[]
export type JsonType = { [key: string]: BaseType | SessionType } | BaseType[] | SessionType[]