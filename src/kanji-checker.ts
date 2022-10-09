#!/usr/bin/env node
import * as fs from 'fs/promises';
import path from 'path';
import Spinner from './loading';

type Kanji = string;
const filenameToGradeIndex = (filename: string) => parseInt(filename.replace(/[^0-9]/g, ''));
const filenametoGrade = (filename: string) => filename.replace('.json', '');

async function kanjiChecker () {
    const argPath = process.argv[2];
    const scoped = process.argv[3];
    const stat = await fs.stat(path.resolve(argPath));
    if (!stat.isDirectory()) throw '\x1b[32mpath is not directory.';
    const allowedNames = ['grade1.json', 'grade2.json', 'grade3.json', 'grade4.json', 'grade5.json', 'grade6.json', 'grade7.json', 'grade8.json'];
    let fileList: string[] = await fs.readdir(path.join(path.resolve(argPath), '/'));
    fileList = fileList.filter(async(filename) => {
        const fileStat = await fs.stat(path.join(argPath, filename))
        return fileStat.isFile() && allowedNames.indexOf(filename) !== -1;
    });
    if (fileList.length < 1) throw '\x1b[32mfile does not exist.';
    if (scoped !== undefined) {
        fileList = fileList.filter(filename => filename.indexOf(scoped) !== -1);
    };
    const templatePath = path.join(process.cwd(), 'node_modules/@simple-education-dev/kanji-checker/src/kanjiTemplate.json');
    const kanjiTemplates = JSON.parse(await fs.readFile(templatePath, 'utf8'));
    const kanjiRegex = /^([\u{3005}\u{3007}\u{303b}\u{3400}-\u{9FFF}\u{F900}-\u{FAFF}\u{20000}-\u{2FFFF}][\u{E0100}-\u{E01EF}\u{FE00}-\u{FE02}]?)+$/mu;
    const isKanji = (str: string) => str.match(kanjiRegex) ? true : false;
    const jsonFileParsing = fileList.map(async(fileName) => JSON.parse(await fs.readFile(path.join(argPath, fileName),'utf8')));
    const jsonArray = await Promise.all(jsonFileParsing)
    const result: string[] = [];
    jsonArray.map((json, fileIndex) => Object.keys(json).map((key) => {
        if (typeof json[key] === 'string') {
            for (var i = 0; i < json[key].length; ++i) {
                if (isKanji(json[key].charAt(i))) {
                    const kanji: Kanji = json[key].charAt(i);
                    let gradeIndex = 1;
                    let match = false;
                    while (!match && (gradeIndex - 1) < filenameToGradeIndex(fileList[fileIndex])) {
                        if (kanjiTemplates[`grade${gradeIndex}`].some((template: Kanji) => template === kanji)) {
                            match = true;
                        } else {
                            if (gradeIndex === filenameToGradeIndex(fileList[fileIndex])) {
                                result.push(
                                `\x1b[32m[${filenametoGrade(fileList[fileIndex])}]\x1b[39m ${key}:${
                                    i + 1
                                }文字目「\x1b[36m${kanji}\x1b[39m」は未習です`
                                );
                            }
                            gradeIndex++;
                        };
                    };
                };
            };
        };
    }));
    return result;
}

(async() => {
    const spinner = new Spinner('jsonファイルを解析中...');
    try {
        const result = await kanjiChecker();
        spinner.stop();
        if (result.length > 0) {
            result.forEach((resultString) => {
                console.log(resultString);
            });
        } else {
            console.log('\x1b[32m未習の漢字は見つかりませんでした。')
        };
    } catch (e) {
        spinner.stop();
        console.log(e);
    }
})();

