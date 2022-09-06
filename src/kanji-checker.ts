#!/usr/bin/env node
import * as fs from 'fs'
import path from 'path'
import { Spinner } from './loading'

type Kanji = string;
const filenameToGradeIndex = (filename: string) => parseInt(filename.replace(/[^0-9]/g, ''));
const filenametoGrade = (filename: string) => filename.replace('.json', '');

function kanjiChecker () {
    const argPath = process.argv[2]
    const scoped = process.argv[3]
    const stat = fs.statSync(path.resolve(argPath))
    if (!stat.isDirectory()) throw 'path is not directory.';
    const allowedNames = ['grade1.json', 'grade2.json', 'grade3.json', 'grade4.json', 'grade5.json', 'grade6.json'];
    let fileList: string[] = fs.readdirSync(path.join(path.resolve(argPath), '/'));
    fileList = fileList.filter((filename) => {
        return fs.statSync(path.join(argPath, filename)).isFile() && allowedNames.indexOf(filename) !== -1;
    });
    if (fileList.length < 1) throw 'file does not exist.';
    if (scoped !== undefined) {
        fileList = fileList.filter(filename => filename.indexOf(scoped) !== -1);
    };
    const templatePath = path.join(process.cwd(), 'node_modules/@simple-education-dev/kanji-checker/src/kanjiTemplate.json')
    const kanjiTemplates = JSON.parse(
        fs.readFileSync(templatePath, 'utf8')
    );
    const kanjiRegex = /^([\u{3005}\u{3007}\u{303b}\u{3400}-\u{9FFF}\u{F900}-\u{FAFF}\u{20000}-\u{2FFFF}][\u{E0100}-\u{E01EF}\u{FE00}-\u{FE02}]?)+$/mu;
    const isKanji = (str: string) => str.match(kanjiRegex) ? true : false;
    const jsonArray = fileList.map((fileName) =>
        JSON.parse(fs.readFileSync(path.join(argPath, fileName),'utf8'))
    );
    const result: string[] = []
    jsonArray.map((file, fileIndex) => Object.keys(file).map((key) => {
        if (typeof file[key] === 'string') {
            for (var i = 0; i < file[key].length; ++i) {
                if (isKanji(file[key].charAt(i))) {
                    const kanji: Kanji = file[key].charAt(i);
                    let gradeIndex = 0;
                    let match = false;
                    while (!match && gradeIndex < filenameToGradeIndex(fileList[fileIndex])) {
                        if (kanjiTemplates[filenametoGrade(fileList[fileIndex])].some((template: Kanji) => template === kanji)) {
                            match = true;
                        } else {
                            if (gradeIndex === filenameToGradeIndex(fileList[fileIndex]) - 1) {
                                result.push(
                                `\x1b[32m[${filenametoGrade(fileList[fileIndex])}]\x1b[39m ${key}:${
                                    i + 1
                                }文字目「\x1b[36m${kanji}\x1b[39m」は未習です`
                                );
                            }
                            gradeIndex++;
                        }
                    }
                }
            }
        }
    }));
    return result
}

(async() => {
    const spinner = new Spinner('jsonファイルを解析中...')
    const result = kanjiChecker();
    spinner.stop()
    console.log('\n')
    result.forEach((resultString) => {
        console.log(resultString);
    })
})();

