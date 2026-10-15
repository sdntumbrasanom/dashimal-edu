import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractGoogleSheetInfo,
  buildGoogleSheetCsvUrl,
  parseCsvLine,
  parseQuestionsCsv,
} from './quizParser.ts';

test('extractGoogleSheetInfo extracts sheet ID and gid accurately', () => {
  const url1 = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?gid=123456#gid=123456';
  const info1 = extractGoogleSheetInfo(url1);
  assert.equal(info1.sheetId, '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
  assert.equal(info1.gid, '123456');

  const url2 = 'https://docs.google.com/spreadsheets/d/abc-123_XYZ/view';
  const info2 = extractGoogleSheetInfo(url2);
  assert.equal(info2.sheetId, 'abc-123_XYZ');
  assert.equal(info2.gid, '0');
});

test('buildGoogleSheetCsvUrl constructs valid export URL', () => {
  const url = 'https://docs.google.com/spreadsheets/d/mySheetId123/edit#gid=42';
  const csvUrl = buildGoogleSheetCsvUrl(url);
  assert.equal(csvUrl, 'https://docs.google.com/spreadsheets/d/mySheetId123/export?format=csv&gid=42');
});

test('parseCsvLine handles standard and quoted CSV values correctly', () => {
  const line = 'Pertanyaan A,"Jawaban B, dengan koma",Pilihan C,"Opsi ""D"" khusus"';
  const parsed = parseCsvLine(line);
  assert.equal(parsed.length, 4);
  assert.equal(parsed[0], 'Pertanyaan A');
  assert.equal(parsed[1], 'Jawaban B, dengan koma');
  assert.equal(parsed[2], 'Pilihan C');
  assert.equal(parsed[3], 'Opsi "D" khusus');
});

test('parseQuestionsCsv parses questions and options as specified', () => {
  const csvData = `Pertanyaan,Jawaban Benar,Opsi 1,Opsi 2,Opsi 3
Apa ibukota Indonesia?,Nusantara,Jakarta,Surabaya,Bandung
Berapa 5 x 5?,25,20,15,30
Hewan herbivora pemakan apa?,Tumbuhan,Daging,Batu,Besi`;

  const questions = parseQuestionsCsv(csvData);
  assert.equal(questions.length, 3);

  // Question 1
  assert.equal(questions[0].question, 'Apa ibukota Indonesia?');
  assert.equal(questions[0].correctAnswer, 'Nusantara');
  assert.equal(questions[0].options.length, 4);
  assert.ok(questions[0].options.includes('Nusantara'));
  assert.ok(questions[0].options.includes('Jakarta'));

  // Question 2
  assert.equal(questions[1].question, 'Berapa 5 x 5?');
  assert.equal(questions[1].correctAnswer, '25');
  assert.ok(questions[1].options.includes('25'));
});
