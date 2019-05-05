const request = require('request')
const cheerio = require('cheerio')
const readline = require('readline')
const fs = require('fs')

var maxDepth = 3

main()

async function main () {
    var url
    while (!validURL(url)) {
        url = await askQuestion('Enter URL to scrape: ')
    }

    var maxDepthInput = await askQuestion('How deep do you want to go? (default 3): ')
    if (maxDepthInput.replace(/\D/g, '').length > 0) {
        maxDepth = maxDepthInput
    }

    await scrape(url, 1)
}

/**
 * Scrapes supplied URL for links, recursively up to depth.
 *
 * @param {*} url Link to scrape
 * @param {*} depth Current depth of recursion
 */
function scrape (url, depth) {
    var padding = ''
    for (let q = 1; q < depth; q++) {
        padding = padding + '    '
    }

    if (depth === 1) {
        writeOutput(true, padding + url)
    } else {
        writeOutput(false, padding + url)
    }

    if (depth < maxDepth) {
        try {
            return new Promise((resolve, reject) => {
                request(url, async (error, response, body) => {
                    if (error) {
                        reject(error)
                    }

                    if (body) {
                        var $ = cheerio.load(body)
                        var links = $('a')
                        for (let q = 0; q < links.length; q++) {
                            var link = $(links[q]).attr('href')
                            if (link && link !== url && validURL(link)) {
                                resolve(await scrape(link, (depth + 1)))
                            }
                        }
                    }
                })
            })
        } catch (error) {
            console.log(error)
        }
    }
}

/**
 * Helper function that writes to output.txt
 *
 * @param {*} newFile Create a new file, or append.
 * @param {*} data The info to write
 */
async function writeOutput (newFile, data) {
    if (newFile) {
        await fs.writeFile('output.txt', data + '\n', (err) => {
            if (err) throw err
        })
    } else {
        await fs.appendFileSync('output.txt', data + '\n', (err) => {
            if (err) throw err
        })
    }
}

/**
 * Helper function that waits for console input.
 *
 * https://stackoverflow.com/a/50890409
 *
 * @param {*} question The question string to be displayed
 */
function askQuestion (question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    return new Promise(resolve => rl.question(question, ans => {
        rl.close()
        resolve(ans)
    }))
}

/**
 * See if url is valid.
 *
 * https://stackoverflow.com/a/5717133
 *
 * @param {*} str URL
 */
function validURL (str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
    return !!pattern.test(str)
}
