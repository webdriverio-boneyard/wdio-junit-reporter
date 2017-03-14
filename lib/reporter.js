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

    prepareName (name) {
        return name.toLowerCase().split(/[^a-z0-9]+/).filter((item) => item && item.length).join('_')
    }

    prepareXml (capabilities) {
        const builder = junit.newBuilder()
        const packageName = this.options.packageName ? `${capabilities.sanitizedCapabilities} - ${this.options.packageName}` : capabilities.sanitizedCapabilities

        for (let specId of Object.keys(capabilities.specs)) {
            const spec = capabilities.specs[specId]

            for (let suiteKey of Object.keys(spec.suites)) {
                const suite = spec.suites[suiteKey]
                const suiteName = this.prepareName(suite.title)
                const testSuite = builder.testSuite()
                    .name(suiteName)
                    .timestamp(suite.start)
                    .time(suite.duration / 1000)
                    .property('specId', specId)
                    .property('suiteName', suite.title)
                    .property('capabilities', capabilities.sanitizedCapabilities)

                for (let testKey of Object.keys(suite.tests)) {
                    const test = suite.tests[testKey]
                    const testName = this.prepareName(test.title)
                    const testCase = testSuite.testCase()
                        .className(`${packageName}.${suiteName}`)
                        .name(testName)
                        .time(test.duration / 1000)

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
        if (this.options.writeStandardOutput === false) {
            return ''
        }
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

        if (this.options.outputFileFormat && typeof this.options.outputFileFormat !== 'function') {
            return console.log(`Cannot write xunit report: 'outputFileFormat' should be a function`)
        }

        try {
            const dir = path.resolve(this.options.outputDir)
            const filename = this.options.outputFileFormat ? this.options.outputFileFormat({
                capabilities: capabilities.sanitizedCapabilities,
                cid: cid
            }) : `WDIO.xunit${capabilities.sanitizedCapabilities}.${cid}.xml`
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
}

export default JunitReporter
