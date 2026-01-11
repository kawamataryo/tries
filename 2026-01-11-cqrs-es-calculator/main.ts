import { Calculator } from "./src/domain/calculator.ts";
import { CalculatorDisplayProjector } from "./src/domain/CalculatorDisplayProjector.ts";

Deno.serve({ port: 3333 }, async (req) => {
    const url = new URL(req.url);

    if (url.pathname === "/display" && req.method === "GET") {
        const calculatorDisplayProjector = new CalculatorDisplayProjector();
        calculatorDisplayProjector.project();
        return new Response(JSON.stringify({ displayNumber: calculatorDisplayProjector.display }), {
            headers: { "content-type": "application/json; charset=utf-8" },
        });
    }
    if (url.pathname === "/press" && req.method === "POST") {
        const body = await req.json();
        const calculator = new Calculator();
        calculator.handle({
            state: body.number,
        });
        return new Response(null, { status: 200 });
    }

    return new Response("Not Found\n", { status: 404 });
});
