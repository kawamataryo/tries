import { assertEquals } from "@std/assert";
import { Calculator } from "./src/domain/calculator.ts";
import { resetEvents } from "./src/storage.ts";
import { CalculatorDisplayProjector } from "./src/domain/CalculatorDisplayProjector.ts";

Deno.test('計算と表示',
  () => {
    resetEvents();
    const calculator = new Calculator();
    const calculatorDisplayProjector = new CalculatorDisplayProjector();
    calculator.handle({
      state: '2'
    });
    calculatorDisplayProjector.project();
    assertEquals(calculatorDisplayProjector.display, '2');
    calculator.handle({
      state: '+'
    });
    calculatorDisplayProjector.project();
    assertEquals(calculatorDisplayProjector.display, '2+');
    calculator.handle({
      state: '3'
    });
    calculatorDisplayProjector.project();
    assertEquals(calculatorDisplayProjector.display, '2+3');
    calculator.handle({
      state: '='
    });
    calculator.handle({
      state: '='
    });
    calculatorDisplayProjector.project();
    assertEquals(calculatorDisplayProjector.display, '5');
    calculator.handle({
      state: '+'
    });
    calculatorDisplayProjector.project();
    assertEquals(calculatorDisplayProjector.display, '5+');
    calculator.handle({
      state: '4'
    });
    calculatorDisplayProjector.project();
    assertEquals(calculatorDisplayProjector.display, '5+4');
    calculator.handle({
      state: '='
    });
    calculatorDisplayProjector.project();
    assertEquals(calculatorDisplayProjector.display, '9');
    calculator.handle({
      state: '-'
    });
    calculatorDisplayProjector.project();
    assertEquals(calculatorDisplayProjector.display, '9-');
    calculator.handle({
      state: '5'
    })
    calculatorDisplayProjector.project();
    assertEquals(calculatorDisplayProjector.display, '9-5');
    calculator.handle({
      state: '='
    });
    calculatorDisplayProjector.project();
    assertEquals(calculatorDisplayProjector.display, '4');
    calculator.handle({
      state: '5'
    })
    calculatorDisplayProjector.project();
    assertEquals(calculatorDisplayProjector.display, '5');
    calculator.handle({
      state: '5'
    })
    calculatorDisplayProjector.project();
    assertEquals(calculatorDisplayProjector.display, '55');
  }
)
