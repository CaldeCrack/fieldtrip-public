import { createContext } from 'react'

export interface HCStateType {
  fieldtripID: number | null
  fieldtripName: string | null
  healthChartOwner: number | null
}

export interface FStateType {
  fieldtripID: number | null
}

export interface IHealthChartContext {
  HCState: HCStateType
  HCDispatch: React.Dispatch<any>
}

export interface IFieldtriptContext {
  FState: FStateType
  FDispatch: React.Dispatch<any>
}

export const HealthChartContext = createContext<IHealthChartContext>({} as IHealthChartContext)
export const FieldtriptContext = createContext<IFieldtriptContext>({} as IFieldtriptContext)
