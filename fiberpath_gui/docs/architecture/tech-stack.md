# Tech Stack Details

Complete technical specifications for FiberPath GUI technology stack.

## Frontend Stack

### React 18.3.1

**Why React:**

- Component-based architecture for modular UI
- Virtual DOM for efficient updates
- Large ecosystem of libraries and tools
- Strong TypeScript support

**Key Features Used:**

- Functional components with hooks
- Controlled form inputs
- Conditional rendering
- Effect hooks for side effects
- Memo for performance optimization

**Example:**

```typescript
export function PlanForm() {
  const project = useProjectStore(state => state.project);
  const updateMandrel = useProjectStore(state => state.updateMandrel);

  return (
    <form>
      <input
        type="number"
        value={project.mandrelParameters.diameter}
        onChange={e => updateMandrel({ diameter: Number(e.target.value) })}
      />
    </form>
  );
}
```

### TypeScript 5.0+

**Why TypeScript:**

- Catch errors at compile time
- IntelliSense for better DX
- Refactoring confidence
- Self-documenting interfaces

**Configuration:** (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Key Patterns:**

- Discriminated unions for layer types
- Strict null checks
- Exhaustive switch statements
- Type guards for runtime safety

### Vite 5.0

**Why Vite:**

- Instant dev server startup with ESM
- Lightning-fast HMR (Hot Module Replacement)
- Optimized production builds with Rollup
- Native TypeScript support

**Configuration:** (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    target: "esnext",
    minify: !process.env.TAURI_DEBUG,
  },
});
```

**Performance:**

- Dev server starts in <1 second
- HMR updates in ~50ms
- Production build in ~10 seconds

### Zustand 5.0.9

**Why Zustand:**

- Minimal boilerplate vs Redux
- No context providers needed
- Shallow selectors prevent re-renders
- DevTools integration
- TypeScript-first design

**Store Pattern:**

```typescript
interface ProjectState {
  project: FiberPathProject | null;
  isDirty: boolean;
  updateMandrel: (params: Partial<MandrelParameters>) => void;
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set) => ({
      project: null,
      isDirty: false,
      updateMandrel: (params) =>
        set((state) => ({
          project: {
            ...state.project!,
            mandrelParameters: {
              ...state.project!.mandrelParameters,
              ...params,
            },
          },
          isDirty: true,
        })),
    }),
    { name: "ProjectStore" }
  )
);
```

**Selector Pattern:**

```typescript
// ❌ Bad: Re-renders on any state change
const state = useProjectStore();

// ✅ Good: Re-renders only when diameter changes
const diameter = useProjectStore(
  (state) => state.project?.mandrelParameters.diameter
);

// ✅ Better: Shallow comparison for objects
const mandrel = useProjectStore(
  (state) => state.project?.mandrelParameters,
  shallow
);
```

### Zod 3.25.76

**Why Zod:**

- Runtime validation with TypeScript inference
- Composable schemas
- Clear error messages
- JSON schema generation

**Schema Definition:**

```typescript
export const MandrelParametersSchema = z.object({
  diameter: z.number().positive(),
  windLength: z.number().positive(),
});

// TypeScript type inferred automatically
export type MandrelParameters = z.infer<typeof MandrelParametersSchema>;
```

**Validation:**

```typescript
const result = MandrelParametersSchema.safeParse(data);

if (!result.success) {
  console.error(result.error.issues);
  // [{ code: 'too_small', minimum: 0, path: ['diameter'], message: '...' }]
}
```

### @hello-pangea/dnd 18.0.1

**Why Drag & Drop:**

- Intuitive layer reordering in UI
- Accessible keyboard navigation
- Smooth animations

**Usage (LayerManager):**

```typescript
<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="layers">
    {(provided) => (
      <div ref={provided.innerRef} {...provided.droppableProps}>
        {layers.map((layer, index) => (
          <Draggable key={layer.id} draggableId={layer.id} index={index}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                {layer.windType}
              </div>
            )}
          </Draggable>
        ))}
      </div>
    )}
  </Droppable>
</DragDropContext>
```

## Desktop Shell

### Tauri 2.0

**Why Tauri:**

- Small bundle size (~3-5 MB vs Electron's ~120 MB)
- Native webview (no embedded Chromium)
- Rust security and performance
- Cross-platform (Windows, macOS, Linux)

**Architecture:**

```text
┌────────────────────────────────┐
│     WebView (React UI)         │  JavaScript
├────────────────────────────────┤
│  Tauri IPC (invoke/listen)     │  Async bridge
├────────────────────────────────┤
│   Rust Backend (Commands)      │  Rust
│   - File I/O                   │
│   - Process spawning           │
│   - Serial port access         │
└────────────────────────────────┘
```

**Key Features:**

- **Commands:** Rust functions callable from JavaScript
- **Events:** Pub/sub for streaming updates
- **File System:** Secure path resolution
- **Updater:** Auto-update mechanism (v0.5.0+)

**Security Model:**

- Allowlist of permitted APIs
- No eval() or inline scripts
- CSP headers enforced
- Path traversal protection

### Rust 1.70+

**Why Rust:**

- Memory safety without garbage collection
- Zero-cost abstractions
- Fearless concurrency
- Strong type system

**CLI Integration:**

```rust
use std::process::Command;

#[tauri::command]
fn plan_project(wind_def: String) -> Result<String, String> {
    let output = Command::new("fiberpath")
        .arg("plan")
        .arg(&wind_def)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}
```

**Streaming State:**

```rust
pub struct MarlinState {
    port: Option<SerialPort>,
    is_connected: bool,
    queue: VecDeque<String>,
}

impl MarlinState {
    pub fn connect(&mut self, port_name: &str) -> Result<(), String> {
        self.port = Some(SerialPort::open(port_name)?);
        self.is_connected = true;
        Ok(())
    }
}
```

## Testing Stack

### Vitest

**Why Vitest:**

- Vite-native (same config, fast startup)
- Jest-compatible API
- ES modules support
- Watch mode with HMR

**Features:**

- Parallel test execution
- Coverage with v8
- Snapshot testing
- UI mode for exploration

### React Testing Library

**Why RTL:**

- Focus on user behavior, not implementation
- Accessible queries (getByRole, getByLabelText)
- Async utilities (waitFor, findBy)

**Example:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

it('should update mandrel diameter', () => {
  render(<MandrelForm />);

  const input = screen.getByLabelText('Diameter');
  fireEvent.change(input, { target: { value: '200' } });

  expect(input).toHaveValue(200);
});
```

## Build Tools

### ESLint 8.x

**Configuration:**

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### Prettier 3.x

**Configuration:**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### TypeScript Compiler

**Key Flags:**

- `strict: true` - All strict checks
- `noUncheckedIndexedAccess: true` - Array access safety
- `noUnusedLocals: true` - Dead code detection

## Version Matrix

| Package                | Version | Purpose            |
| ---------------------- | ------- | ------------------ |
| react                  | 18.3.1  | UI framework       |
| typescript             | 5.0+    | Type safety        |
| vite                   | 5.0.10  | Build tool         |
| zustand                | 5.0.9   | State management   |
| zod                    | 3.25.76 | Runtime validation |
| @tauri-apps/api        | 2.0.0   | Tauri bindings     |
| @hello-pangea/dnd      | 18.0.1  | Drag & drop        |
| vitest                 | 1.0+    | Test runner        |
| @testing-library/react | 14.0+   | Component testing  |

## Platform Support

### Windows

- **Minimum:** Windows 10 1809+
- **Webview:** Edge WebView2 (bundled)
- **Installer:** MSI

### macOS

- **Minimum:** macOS 10.15 Catalina
- **Webview:** WKWebView (native)
- **Installer:** DMG

### Linux

- **Minimum:** Ubuntu 20.04, Fedora 36, Arch (current)
- **Webview:** webkit2gtk 4.1
- **Installer:** AppImage, DEB

## Performance Characteristics

### Bundle Size

- **Development:** ~15 MB
- **Production:** ~3-5 MB (Tauri) + ~2 MB (React bundle)
- **Installer:** ~10-15 MB

### Startup Time

- **Cold start:** ~1-2 seconds
- **Warm start:** ~500ms

### Memory Usage

- **Idle:** ~50-80 MB
- **Active:** ~100-150 MB
- **Heavy use:** ~200-300 MB

### Build Time

- **Dev server:** <1 second
- **HMR update:** ~50ms
- **Production build:** ~10-15 seconds
- **Full rebuild:** ~20-30 seconds

## Next Steps

- [State Management Architecture](state-management.md)
- [CLI Integration Details](cli-integration.md)
- [Performance Guide](../guides/performance.md)
