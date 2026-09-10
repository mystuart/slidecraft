// quiz build 期校验：correct ⊆ options、correct 非空、选项数下限
// 防的是"静默错题"——判分引用不存在的选项 id，学员永远答不对，build 却无感知
const { test } = require('node:test');
const assert = require('node:assert');
const quiz = require('../template/components/quiz.js');

const VALID = {
  id: 'q1',
  question: '1+1=?',
  type: 'single',
  options: [{ id: 'a', text: '1' }, { id: 'b', text: '2' }],
  correct: ['b'],
};

test('合法 quiz 正常渲染', () => {
  const html = quiz.render(VALID);
  assert.ok(html.includes('data-quiz-id="q1"'));
});

test('correct 引用不存在的 id → throw 自描述错误', () => {
  assert.throws(
    () => quiz.render({ ...VALID, correct: ['B'] }),
    /correct 引用了 "B".*options/u
  );
  assert.throws(
    () => quiz.render({ ...VALID, correct: ['a', 'c'] }),
    /"c".*options/u
  );
});

test('correct 为空 → throw', () => {
  assert.throws(() => quiz.render({ ...VALID, correct: [] }), /correct 为空/u);
});

test('选项数不足 2 → throw', () => {
  assert.throws(
    () => quiz.render({ ...VALID, options: [{ id: 'a', text: '唯一选项' }], correct: ['a'] }),
    /至少 2 个选项/u
  );
});

test('quiz-track 数组里每道题同样被校验', () => {
  assert.throws(
    () => quiz.renderTrack([VALID, { ...VALID, id: 'q2', correct: ['x'] }]),
    /q2.*"x"/u
  );
});
