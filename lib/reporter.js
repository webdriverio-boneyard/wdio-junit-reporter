import events from 'events'

/**
 * Initialize a new `Junit` test reporter.
 *
 * @param {Runner} runner
 * @api public
 */
class JunitReporter extends events.EventEmitter {
    constructor (baseReporter) {
        super()

        this.baseReporter = baseReporter
        const { epilogue } = this.baseReporter

        const events = ['start', 'runner:start', 'runner:init', 'runner:command', 'runner:result', 'suite:start', 'test:start', 'hook:start', 'hook:end', 'test:pass', 'test:fail', 'test:pending', 'test:end', 'suite:end', 'runner:end', 'end', 'runner:error', 'error']
        const calls = {}
        events.forEach((event) => {
            this.on(event, (...args) => {
                calls[event] = calls[event] ? (calls[event] + 1) : 1
            })
        })

        this.on('end', () => {
            // console.log('calls', calls)
            console.log('this.baseReporter.stats', require('util').inspect(this.baseReporter.stats, { colors: true, depth: null }))

            const builder = require('junit-report-builder')

            for (let cid of Object.keys(this.baseReporter.stats.runner)) {
                const capability = this.baseReporter.stats.runner[cid]
                const packageName = capability.sanitizedCapabilities

                for (let specId of Object.keys(capability.specs)) {
                    const spec = capability.specs[specId]

                    for (let suiteName of Object.keys(spec.suites)) {
                        const suite = spec.suites[suiteName]
                        const testSuite = builder.testSuite()
                            .name(suiteName.toLowerCase().split(/[^a-z0-9]+/).filter((item) => item && item.length).join('_'))
                            .timestamp(spec.suites[suiteName].start)
                            .time(spec.suites[suiteName].duration / 1000)
                            .property('specId', specId)
                            .property('suiteName', suiteName)
                            .property('capabilities', capability.sanitizedCapabilities)

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
                                if (test.error.message) testCase.error(test.error.message)
                                if (test.error.stack) testCase.standardError(test.error.stack)
                            }

                            let standardOutput = ''
                            test.screenshots.forEach((path) => {
                                standardOutput += `\n[[ATTACHMENT|${path}]]\n`
                            })
                            testCase.standardOutput(standardOutput)
                        }
                    }
                }
            }

            console.log(builder.build())

            epilogue.call(baseReporter)
        })
    }
}

export default JunitReporter
