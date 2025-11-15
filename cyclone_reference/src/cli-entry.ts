import { MarlinPort } from './marlin-port';
import { planWind } from './planner';
import { plotGCode } from './plotter';
import { hideBin } from 'yargs/helpers';
import { promises as fsPromises } from 'fs';
import { createWriteStream } from 'fs';
import * as readline from 'readline';

// Looks like using yargs most any other way is kind of broken
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
require('yargs').command({
    command: 'run <file>',
    describe: 'Run a gcode file on the machine',
    builder: {
        port: {
            alias: 'p',
            describe: 'Serial port to connect to',
            demandOption: true,
            type: 'string'
        },
        verbose: {
            alias: 'v',
            describe: 'Log every command?',
            default: false,
            type: 'boolean'
        }
    },
    async handler(argv: Record<string, string>): Promise<void> {
        const marlin = new MarlinPort(argv.port, (argv.verbose as unknown) as boolean);
        const marlinInitialized = marlin.initialize();
        const data = await fsPromises.readFile(argv.file);
        console.log(`Sending commands from "${argv.file}"`);
        await marlinInitialized;

        readline.emitKeypressEvents(process.stdin);

        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }

        process.stdin.on('keypress', (chunk, key) => {
            if (key && key.name === 'space') {
                if (marlin.isPaused()) {
                    console.log('Resuming machine...');
                    return marlin.resume();
                }
                console.log('Pausing machine, press "space" again to resume after it stops');
                marlin.pause();

            }
        });


        for (const command of data.toString().trim().split('\n')) {
            marlin.queueCommand(command);
        }
    }
})
    .command({
        command: 'plan <fileout> <filein>',
        describe: 'Generate gcode from a .wind file',
        builder: {
            output: {
                alias: 'o',
                describe: 'File to output to',
                demandOption: false,
                type: 'string'
            },
            verbose: {
                alias: 'v',
                describe: 'Include comments explaining segmented moves?',
                default: false,
                type: 'boolean'
            }
        },
        async handler(argv: Record<string, string>): Promise<void> {
            const inputFile = argv.filein;  // The first positional argument (i.e., the .wind file)
            const outputFile = argv.fileout;  // Output file passed via the -o flag
         //   console.log('Parsed Arguments:', argv);

            if (!inputFile) {
                console.error('Error: Input file is required');
                return;
            }
            if (!outputFile) {
                console.error('Error: Output file is required');
                return;
            }

            try {
                const fileContents = await fsPromises.readFile(inputFile, "utf8");

                if (!fileContents.trim()) {
                    console.error('Error: Input file is empty');
                    return;
                }

                console.log("file contents: ", fileContents);

                // Try parsing the file contents
                const windDefinition = JSON.parse(fileContents);

                // Todo: Verify contents
                const windCommands = planWind(windDefinition, (argv.verbose as unknown) as boolean);
                console.log(`Writing to: ${outputFile}`);
                await fsPromises.writeFile(outputFile, windCommands.join('\n'));
                console.log(`Wrote ${windCommands.length} commands to "${outputFile}"`);
            } catch (error) {
                console.error(`Error reading or parsing the file: ${error.message}`);
            }
        }

    })
    .command({
        command: 'plot <file>',
        describe: 'Visualize the contents of a gcode file',
        builder: {
            output: {
                alias: 'o',
                describe: 'PNG file to output to',
                demandOption: false,
                type: 'string'
            }
        },
        async handler(argv: Record<string, string>): Promise<void> {
            const inputFile = argv._[1];  // Positional argument: gcode file
            const outputFile = argv.file;  // Output file from -o flag
            console.log('argv: ', argv);
            console.log(`Reading gcode from`, inputFile);
            console.log(`Writing to`, outputFile);

            if (!inputFile) {
                console.error('Error: Input file is required');
                return;
            }

            if (!outputFile) {
                console.error('Error: Output file is required');
                return;
            }

            const fileContents = await fsPromises.readFile(inputFile, "utf8");

            const stream = plotGCode(fileContents.split('\n'));
            if (typeof stream === 'undefined') {
                console.log('No image to write');
                return;
            }

            const outputFileStream = createWriteStream(outputFile);
            stream.pipe(outputFileStream);
            outputFileStream.on('finish', () => console.log(`The PNG file was created at ${outputFile}`));
        }
    })
    .help()
    .parse(hideBin(process.argv));
