export type PressedState = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '+' | '-' | '=' | '/' | '*'

export interface CalculatorCommand {
  state: PressedState
}


export interface CalculatorEvent {
  state: PressedState
}
