# MIPSim

A visual MIPS processor simulator with step-by-step execution. Write MIPS assembly code, load it into a simulated single-cycle datapath, and watch data flow through the processor components in real time.

## Features

- **MIPS assembly editor** with syntax support for R-type, I-type, J-type, and pseudo-instructions
- **Visual datapath** showing Program Counter, Instruction Memory, Control Unit, Register File, ALU, Data Memory, MUXes, and wired connections
- **Step / Run / Reset** execution controls with adjustable speed
- **Draggable components** in the processor visualization
- **Jison-based parser** that handles `.data` / `.text` sections, labels, and pseudo-instruction expansion (`li`, `la`, `move`)

## Architecture

```
app/
  core/           Simulation engine (pure TypeScript, no React)
    Component.ts    Base class with event-propagation wiring
    Processor.ts    Orchestrator that connects all components
    ALU.ts, ControlUnit.ts, RegisterFile.ts, ...
    encoding.ts     MIPS instruction encode/decode
    constants.ts    ALU operation codes
    __tests__/      Unit tests for every component
  components/     React UI components
    ProcessorView.tsx, ComponentView.tsx, ConnectionSystem.tsx, ...
  utils/          Parser wrapper, instruction converter, register map
  routes/         React Router pages
parser/
  mips.jison      Grammar definition (generates mips.js via Jison)
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to use the simulator.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm test` | Run unit tests |
| `npm run typecheck` | Type-check the project |
| `npm run parser` | Regenerate `parser/mips.js` from `parser/mips.jison` |

## Tech Stack

- **React 19** + **React Router v7** (SSR-capable)
- **TypeScript** with strict mode
- **Tailwind CSS v4** via Vite plugin
- **Vite 7** for bundling and dev server
- **Jison** for MIPS assembly parsing
- **Jest** + **ts-jest** for testing
