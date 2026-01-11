import { getEvents } from "../storage.ts";
import { evaluate } from "npm:mathjs";

export class CalculatorDisplayProjector {
  public display: string = "0";
  public pressedState: string = ""

  constructor() {}

  project(): void {
    this.reset();
    for (const event of getEvents()) {
      if (this.pressedState.at(-1) === '=' && Number.isInteger(Number(event.state))) {
        this.display = event.state;
      } else if (event.state === '=') {
        this.display = String(evaluate(this.display));
      } else {
        if (this.display === "0") {
          this.display = event.state;
        } else {
          this.display = this.display + event.state;
        }
      }
      this.pressedState = this.pressedState + event.state;
    }
  }
  reset(): void {
    this.display = "0"
  }
}
