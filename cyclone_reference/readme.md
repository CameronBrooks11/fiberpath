# Cyclone

We are using Node.js 20.18.1, Chromium 130.0.6723.170, and Electron 33.3.1.

## Overview

Cyclone is a script for generating and executing filament winding toolpaths. It was written for simple, 3-axis machines, (like my [Contraption](https://reilley.net/winder)) and currently only supports winding onto cylindrical mandrels. The gcode that it generates should work with many CNC controllers, but my machine utilizes a low-cost 3D printer main board running [Marlin](https://github.com/MarlinFirmware/Marlin) and the output may need to be modified slightly for other boards.

## Download and Setup

Cyclone is currently provided ony as the source code, which can be cloned or downloaded from this repository. The script requires [node.js](https://nodejs.org/) to run (NOTE - current scripts require node.js 18). Once node.js is installed and Cyclone is downloaded, navigate to the Cyclone directory in a terminal and install its dependencies with:

```bash
npm install canvas
npm i
```

## Opening Cyclone as a standalone workspace

Our team often needs to open `cyclone_reference/` in a dedicated VS Code window so we can regenerate upstream inputs/outputs while iterating on FiberPath. The quickest path is:

1. `cd cyclone_reference`
2. Install dependencies with `npm install canvas && npm install` the first time you open the workspace (as shown above).
3. Run whatever CLI command you need via `npm run cli -- <subcommand> ...`. The `cli` script compiles TypeScript and then executes the generated Node entry point, so the output matches the upstream project exactly.

If you prefer an isolated Node toolchain, `corepack enable` plus `nvm use 20.18.1` (the version we verified with) keeps the reference results reproducible.

## Machine Configuration

Future releases of Cyclone might include the ability to specify which gcode axis each machine axis is connected to, but for now, it is hardcoded to match my machine. The X axis is carriage movement, the Y axis is mandrel rotation, and the Z axis is delivery head rotation. Carriage coordinates are given in millimeters, so tune your steps/mm as usual for the X axis. The mandrel and delivery head are both rotational, which is not typical for the 3D printers that Marlin usually drives. The output for these axes is degrees rather than millimeters, so when configuring them, set the steps/mm to the steps/degree value from the motor manufacturer, also factoring in any gear ratios such that `Y360` produces a single complete mandrel rotation.

## Generating a Toolpath

The command for generating a gcode file with Cyclone is:

```bash
npm run cli -- plan -o <gcode output file> <wind input file>
```

Example:

```bash
npm run cli -- plan -o examples/output.gcode examples/input.wind
```

The input to Cyclone that specifies the parameters of the tube you wish to make is a `.wind` file, which use JSON formatting and metric units. At the top level, they consist of these sections:

```json
{
  "layers": [],
  "mandrelParameters": {
    "diameter": 69.75,
    "windLength": 940
  },
  "towParameters": {
    "width": 7,
    "thickness": 0.5
  },
  "defaultFeedRate": 9000
}
```

### Layers

`layers` is an array of the definitions of the layers that you would like the machine to wind, in the order that they will be wound. Each element in the array can be either a hoop wind or a helical wind.

#### Hoop Winds

A hoop wind can be added to the laminate with:

```json
{
  "windType": "hoop",
  "terminal": false
}
```

The single parameter, `"terminal"`, sets if the machine should do a there-and-back circuit, or just wind from one end of the mandrel to the other and stop, which is useful for application of heat shrink tape. An error will be produced if any layers follow a terminal layer, and planning will end.

#### Helical Winds

A helical wind can be added to the laminate with:

```json
{
  "windType": "helical",
  "windAngle": 55,
  "patternNumber": 2,
  "skipIndex": 1,
  "lockDegrees": 720,
  "leadInMM": 30,
  "leadOutDegrees": 90,
  "skipInitialNearLock": true
}
```

The most commonly changed parameters are `"windAngle"`(in degrees), and `"patternNumber"`/`"skipIndex"`. The latter two parameters are standard in filament winding and other resources describe in detail, but in summary, the "pattern number" sets how many evenly-distributed "start positions" there will be around the mandrel, and the "skip index" is the increment that will be applied to the "start position" index at the end of a circuit to know where to start the next one. The remaining parameters are for fine tuning, and will be documented when they stabilize more.

### Tow Parameters

`"towParamers"` is where you input details about the tow that the tube is wound from. The `"thickness"` parameter is currently unused.

### Mandrel Parameters

`"mandrelParameters"` includes the mandrel diameter, and the length of the mandrel that you would like to wind on. The actual length of usuable tube will be less than this due to the "locks" (excess build up of material at either end of the tube where the carriage turns around) which are usually cut off.

## Plotting a Toolpath

After generating a GCode file, you can visualize it by plotting it to a PNG image. The command for this is:

```bash
npm run cli -- plot -o <png output file> <gcode file>
```

- `<png output file>` specifies the name of the output PNG file (e.g., `output.png`).
- `<gcode file>` specifies the path to the GCode file to visualize (e.g., `output.gcode`).

This allows you to review the toolpath before running it on your machine.

Example:

```bash
npm run cli -- plot -o examples/plotted.png examples/output.gcode
```

## Executing a Toolpath

There are several, controller-dependent options when you have generated a gcode file and wish to run it on your machine. For Marlin-driven machines, Cylone has a command for streaming the gcode to the controller and displaying the progress in a terminal. The syntax for this command is:

```bash
npm run cli -- run -p <port> <gcode file>
```

To interrupt your machine while this command is running, press ctrl-c in your terminal window, or use the reset button on your Marlin board, which will stop motion and also exit the script.

## Capturing reference runs

The repository now includes `reference_runs/` as a scratchpad for the "golden" artifacts we want to diff against FiberPath during MVP development. The folder ships with empty `inputs/` and `outputs/` directories so you can:

1. Drop `.wind` cases you care about into `reference_runs/inputs/`.
2. Generate Cyclone outputs in matching subfolders under `reference_runs/outputs/` using `npm run cli -- plan` and `npm run cli -- plot`.
3. Copy or hash those outputs from the Python workspace to measure drift.

See `reference_runs/README.md` for a suggested naming convention and ready-to-copy command block.

## License

Cyclone is released under the GNU GPL v3 license. The source code is distributed so you can build cool stuff with it, and with the hope of encouraging more hobbyist tinkering in this area that I find fascinating.

## Contributing

Cyclone is mostly purpose-built for my filament winder, but contributions are welcome if you find it useful and have ideas for improvements. Some larger projects could include adding support for 4 axis winders and tapered parts, the creation of a GUI, and generalization to support more winders/controllers.
