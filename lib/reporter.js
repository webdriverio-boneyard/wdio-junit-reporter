import events from 'events'
import junit from 'junit-report-builder'
import path from 'path'
import fs from 'fs'

/**
 * Initialize a new `Junit` test reporter.
 *
 * @param {Runner} runner
 * @api public
 */
class JunitReporter extends events.EventEmitter {
    constructor (baseReporter, config) {
        super()

        this.baseReporter = baseReporter
        this.config = config

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
        const packageName = capabilities.sanitizedCapabilities

        for (let specId of Object.keys(capabilities.specs)) {
            const spec = capabilities.specs[specId]

            for (let suiteName of Object.keys(spec.suites)) {
                const suite = spec.suites[suiteName]
                const testSuite = builder.testSuite()
                    .name(suiteName.toLowerCase().split(/[^a-z0-9]+/).filter((item) => item && item.length).join('_'))
                    .timestamp(spec.suites[suiteName].start)
                    .time(spec.suites[suiteName].duration / 1000)
                    .property('specId', specId)
                    .property('suiteName', suiteName)
                    .property('capabilities', capabilities.sanitizedCapabilities)

                for (let testName of Object.keys(suite.tests)) {
                    const test = suite.tests[testName]
                    const testCase = testSuite.testCase()
                        .className(`${packageName}.${suiteName}`)
                        .name(testName)
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
                standardOutput.push(`[[ATTACHMENT|${data.payload.path}]]`)
                break
            }
        })
        return standardOutput.length ? standardOutput.join('\n') : ''
    }

    write (capabilities, cid, xml) {
        const filename = 'WDIO.xunit.' + capabilities.sanitizedCapabilities + '.' + cid + '.xml'
        const options = this.config.reporterOptions

        if (options && typeof options.outputDir === 'string') {
            const filepath = path.join(path.resolve(options.outputDir), filename)
            fs.writeFileSync(filepath, xml)
        } else {
            console.log(filename)
            console.log(xml)
        }
    }

    format (val) {
        return JSON.stringify(this.baseReporter.limit(val))
    }
}

export default JunitReporter
