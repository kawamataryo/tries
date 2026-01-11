import { CalculatorCommand, PressedState } from './../type.ts';
import { saveEvent } from "../storage.ts";


export class Calculator {
  private pressedStates: PressedState[] = [];

  constructor() {}

  handle(command: CalculatorCommand): void {
    if (this.isSameOperator(command.state)) {
      return;
    }
    saveEvent({
      state: command.state,
    });
  }

  isOperator(state: PressedState): boolean {
    return ['+', '-', '*', '/', '='].includes(state);
  }

  isSameOperator(state: PressedState): boolean {
    return this.pressedStates.at(-1) === state && this.isOperator(state);
  }
}
