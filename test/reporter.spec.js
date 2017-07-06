import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import libxml from 'libxmljs'

import JunitReporter from '../lib/reporter'
import runnersFixture from './fixtures/runners.json'

let reporter = null
const outputDir = path.join(__dirname, 'tmp')
const baseReporter = {
    stats: runnersFixture,
    limit: (text) => text,
    epilogue: () => {}
}

describe('junit reporter', () => {
    describe('xml file', () => {
        before(() => {
            reporter = new JunitReporter(baseReporter, {}, { outputDir })
        })

        after(() => {
            rimraf.sync(outputDir)
        })

        it('should generate a valid xml file', () => {
            reporter.onEnd()
        })

        it('should have generated two files', () => {
            fs.readdirSync(outputDir).should.have.length(2)
        })

        describe('content checks', () => {
            let xml1 = null
            let xml1Content = null
            let xml2 = null
            let xml2Content = null

            before(() => {
                [ xml1, xml2 ] = fs.readdirSync(outputDir)
                xml1Content = fs.readFileSync(path.join(outputDir, xml1), 'utf8')
                xml2Content = fs.readFileSync(path.join(outputDir, xml2), 'utf8')
            })

            it('should have correct file names', () => {
                xml1.should.be.equal('WDIO.xunit.phantomjs.0-0.xml')
                xml2.should.be.equal('WDIO.xunit.phantomjs.0-1.xml')
            })

            it('should be valid xml', () => {
                const xmlDoc1 = libxml.parseXml(xml1Content)
                const xmlDoc2 = libxml.parseXml(xml2Content)
                xmlDoc1.errors.should.have.length(0)
                xmlDoc2.errors.should.have.length(0)
            })

            it('should have content for skipped test', () => {
                xml2Content.should.containEql(
`    <testcase classname="phantomjs.some_special_spec_title" name="skipped_test" time="1">`)
            })

            it('should have expected content', () => {
                xml1Content.should.containEql(
                    '<property name="file" value="/path/to/file.spec.js"/>'
                )
                xml2Content.should.containEql(
                    '<property name="file" value="/path/to/file2.spec.js"/>'
                )
                xml1Content.should.containEql(
`    <testcase classname="phantomjs.some_other_foobar_test" name="that_is_a_test" time="1">
      <system-out>
        <![CDATA[
COMMAND: POST /path/to/command - "some payload"
]]>
      </system-out>
    </testcase>`)
                xml1Content.should.containEql(
`    <properties>
      <property name="specId" value="12345"/>
      <property name="suiteName" value="some other foobar test"/>
      <property name="capabilities" value="phantomjs"/>
      <property name="file" value="/path/to/file.spec.js"/>
    </properties>`)

                xml1Content.should.containEql(
`<system-err>
        <![CDATA[
some error stack
with new line
]]>
      </system-err>`
                )
            })
        })
    })

    describe('outputFileFormat', () => {
        let xml1 = null
        let xml2 = null

        before(() => {
            reporter = new JunitReporter(baseReporter, {}, {
                outputDir,
                outputFileFormat: (opts) => `some-file-${opts.cid}.xml`
            })
            reporter.onEnd()
        })

        after(() => {
            rimraf.sync(outputDir)
        })

        it('should have used expected file name format', () => {
            [ xml1, xml2 ] = fs.readdirSync(outputDir)
            xml1.should.be.equal('some-file-0-0.xml')
            xml2.should.be.equal('some-file-0-1.xml')
        })
    })

    describe('suiteNameFormat', () => {
        let xml2Content = null

        before(() => {
            reporter = new JunitReporter(baseReporter, {}, {
                outputDir,
                suiteNameFormat: /[^a-z0-9*]+/
            })
            reporter.onEnd()

            const files = fs.readdirSync(outputDir)
            xml2Content = fs.readFileSync(path.join(outputDir, files[1]), 'utf8')
        })

        after(() => {
            rimraf.sync(outputDir)
        })

        it('should include ** in spec title', () => {
            xml2Content.should.containEql('<testsuite name="some_special_**_spec_title"')
        })
    })

    describe('packageName', () => {
        let xml1Content = null

        before(() => {
            reporter = new JunitReporter(baseReporter, {}, {
                outputDir,
                packageName: '____O.o____'
            })
            reporter.onEnd()

            const files = fs.readdirSync(outputDir)
            xml1Content = fs.readFileSync(path.join(outputDir, files[0]), 'utf8')
        })

        after(() => {
            rimraf.sync(outputDir)
        })

        it('should have package name in classname', () => {
            xml1Content.should.containEql('classname="phantomjs-____O.o____.some_foobar_test"')
        })
    })
})
