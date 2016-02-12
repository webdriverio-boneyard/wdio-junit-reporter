import events from 'events'
import junit from 'junit-report-builder'
import path from 'path'
import fs from 'fs'
import mkdirp from 'mkdirp'

/**
 * Initialize a new `Junit` test reporter.
 *
 * @param {Runner} runner
 * @api public
 */
class JunitReporter extends events.EventEmitter {
    constructor (baseReporter, config, options = {}) {
        super()

        this.baseReporter = baseReporter
        this.config = config
        this.options = options

        const { epilogue } = this.baseReporter

        this.on('end', () => {
            for (let cid of Object.keys(this.baseReporter.stats.runners)) {
                const capabilities = this.baseReporter.stats.runners[cid]
                const xml = this.prepareXml(capabilities)
                this.write(capabilities, cid, xml)
            }
            epilogue.call(baseReporter)
        })
    }

    prepareXml (capabilities) {
        const builder = junit.newBuilder()

        for (let specId of Object.keys(capabilities.specs)) {
            const spec = capabilities.specs[specId]

            for (let suiteName of Object.keys(spec.suites)) {
                const suite = spec.suites[suiteName]
                const testSuite = builder.testSuite()
                    .name(this.sanitize(suiteName))
                    .timestamp(spec.suites[suiteName].start)
                    .time(spec.suites[suiteName].duration / 1000)
                    .property('specId', specId)
                    .property('suiteName', suiteName)
                    .property('capabilities', capabilities.sanitizedCapabilities)

                for (let testName of Object.keys(suite.tests)) {
                    const test = suite.tests[testName]
                    const testCase = testSuite.testCase()
                        .className(this.sanitize(`${capabilities.sanitizedCapabilities}.${suiteName}`))
                        .name(this.sanitize(testName))
                        .time(suite.tests[testName].duration / 1000)

                    if (test.state === 'pending') {
                        testCase.skipped()
                    }

                    if (test.error) {
                        if (test.error.message) testCase.error(`\n${test.error.message}\n`)
                        if (test.error.stack) testCase.standardError(`\n${test.error.stack}\n`)
                    }

                    const output = this.getStandardOutput(test)
                    if (output) testCase.standardOutput(`\n${output}\n`)
                }
            }
        }
        return builder.build()
    }

    getStandardOutput (test) {
        let standardOutput = []
        test.output.forEach((data) => {
            switch (data.type) {
            case 'command':
                standardOutput.push(`COMMAND: ${data.payload.method.toUpperCase()} ${data.payload.uri.href} - ${this.format(data.payload.data)}`)
                break
            case 'result':
                standardOutput.push(`RESULT: ${this.format(data.payload.body)}`)
                break
            case 'screenshot':
                // TODO: need to write raw attachment now
                // standardOutput.push(`[[ATTACHMENT|${data.payload.path}]]`)
                break
            }
        })
        return standardOutput.length ? standardOutput.join('\n') : ''
    }

    write (capabilities, cid, xml) {
        if (!this.options || typeof this.options.outputDir !== 'string') {
            return console.log(`Cannot write xunit report: empty or invalid 'outputDir'.`)
        }

        try {
            const dir = path.resolve(this.options.outputDir)
            const filename = 'WDIO.xunit.' + capabilities.sanitizedCapabilities + '.' + cid + '.xml'
            const filepath = path.join(dir, filename)
            mkdirp.sync(dir)
            fs.writeFileSync(filepath, xml)
            console.log(`Wrote xunit report to [${this.options.outputDir}].`)
        } catch (e) {
            console.log(`Failed to write xunit report to [${this.options.outputDir}]. Error: ${e}`)
        }
    }

    format (val) {
        return JSON.stringify(this.baseReporter.limit(val))
    }

    sanitize (val) {
        return val.split(/\W+/).join('_')
    }
}

export default JunitReporter
