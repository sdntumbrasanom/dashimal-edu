import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractGoogleSheetInfo,
  buildGoogleSheetCsvUrl,
  parseCsvLine,
  parseQuestionsCsv,
  randomizeQuizQuestions,
  shuffleQuestionOptions,
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

test('randomizeQuizQuestions shuffles question order and answer options', () => {
  const sampleQuestions = [
    {
      id: 'q1',
      question: 'Soal 1',
      correctAnswer: 'A1',
      options: ['A1', 'B1', 'C1', 'D1'],
    },
    {
      id: 'q2',
      question: 'Soal 2',
      correctAnswer: 'A2',
      options: ['A2', 'B2', 'C2', 'D2'],
    },
    {
      id: 'q3',
      question: 'Soal 3',
      correctAnswer: 'A3',
      options: ['A3', 'B3', 'C3', 'D3'],
    },
    {
      id: 'q4',
      question: 'Soal 4',
      correctAnswer: 'A4',
      options: ['A4', 'B4', 'C4', 'D4'],
    },
    {
      id: 'q5',
      question: 'Soal 5',
      correctAnswer: 'A5',
      options: ['A5', 'B5', 'C5', 'D5'],
    },
  ];

  // Test single question options shuffle
  const singleShuffled = shuffleQuestionOptions(sampleQuestions[0]);
  assert.equal(singleShuffled.id, 'q1');
  assert.equal(singleShuffled.correctAnswer, 'A1');
  assert.equal(singleShuffled.options.length, 4);
  assert.ok(singleShuffled.options.includes('A1'));

  // Run randomizeQuizQuestions multiple times to ensure answers are NOT always at index 0 (Option A)
  const results = randomizeQuizQuestions(sampleQuestions);
  assert.equal(results.length, sampleQuestions.length);

  // Verify that all questions contain their correctAnswer in options
  for (const q of results) {
    assert.ok(q.options.includes(q.correctAnswer), `Options must include correctAnswer ${q.correctAnswer}`);
    assert.equal(q.options.length, 4);
  }

  // Check distribution of correctAnswer position across 50 runs
  const correctPositions: number[] = [];
  for (let run = 0; run < 50; run++) {
    const randomized = randomizeQuizQuestions(sampleQuestions);
    for (const q of randomized) {
      const idx = q.options.indexOf(q.correctAnswer);
      correctPositions.push(idx);
    }
  }

  // Ensure correct answers are distributed across multiple positions (not solely at index 0)
  const hasNonZero = correctPositions.some((pos) => pos > 0);
  assert.ok(hasNonZero, 'Correct answer should be randomized across options and not always at index 0 (A)');

  // Verify at least indices 1, 2, or 3 are hit frequently
  const nonZeroCount = correctPositions.filter((pos) => pos > 0).length;
  assert.ok(nonZeroCount > 100, `Expected many correct answers at non-A positions, got ${nonZeroCount}/${correctPositions.length}`);
});

